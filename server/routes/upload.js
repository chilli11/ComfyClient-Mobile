const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { generateThumbnailUrl, checkDuplicate, resizeIfNeeded, getCanonicalJpegFilename, getFilenameStem } = require('../utils/imageUtils');

// Multer setup - use memory storage to avoid race condition
const storage = multer.memoryStorage();
// Enforce 30MB file-size limit for uploads
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

function setupUploadRoutes(app, UPLOADS, GENERATED, THUMBNAILS, COMFY_API_URL) {
  // Check for duplicate files before upload
  app.post('/api/upload/check-duplicate', async (req, res) => {
    console.log('POST /upload/check-duplicate called');
    try {
      const { filename } = req.body;
      if (!filename) return res.status(400).json({ error: 'missing filename' });

      const duplicate = await checkDuplicate(filename, UPLOADS, THUMBNAILS);
      res.json(duplicate);
    } catch (error) {
      console.warn('Duplicate check endpoint failed:', error.message);
      res.status(500).json({ error: 'duplicate_check_failed' });
    }
  });

  // Upload endpoint - save locally then proxy to ComfyUI; on proxy failure delete local file
  app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    console.log('POST /api/upload/image called');
    if (!req.file) return res.status(400).json({ error: 'no file' });

    // Set filename from originalname, sanitized
    const sanitized = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const canonicalFilename = getCanonicalJpegFilename(sanitized);
    req.file.filename = canonicalFilename;
    const stem = getFilenameStem(canonicalFilename);

    try {
      console.log('proceeding with upload for:', req.file.filename);

      // Save uploaded bytes to a temp file, then process to canonical JPEG output.
      const tempInputPath = path.join(UPLOADS, `${stem}.uploadtmp`);
      const finalPath = path.join(UPLOADS, req.file.filename);
      fs.writeFileSync(tempInputPath, req.file.buffer);

      const wasResized = await resizeIfNeeded(tempInputPath, finalPath);
      console.log(`Image processing finished for ${req.file.filename} (${wasResized ? 'resized' : 'converted'})`);
      try { fs.unlinkSync(tempInputPath); } catch (e) {}

      const FormData = require('form-data');
      const form = new FormData();
      form.append('image', fs.createReadStream(finalPath), { filename: req.file.filename });

      const comfyUrl = `${COMFY_API_URL}/upload/image`;
      let resp;
      try {
        resp = await axios.post(comfyUrl, form, {
          headers: Object.assign({}, form.getHeaders()),
          maxBodyLength: Infinity,
          timeout: 30000, // 30 second timeout
        });
        console.log('ComfyUI upload: successful');
      } catch (comfyError) {
        console.error('ComfyUI upload failed:', comfyError.message);
        throw comfyError; // Re-throw to be caught by outer catch
      }

      // Generate thumbnail from the final image (will overwrite existing thumbnail)
      const thumbnailUrl = await generateThumbnailUrl(finalPath, req.file.originalname, THUMBNAILS);

      const relativePath = `/storage/uploads/${path.basename(finalPath)}`;
      const responseData = Object.assign({}, resp.data || {}, {
        local_path: relativePath,
        filename: req.file.filename,
        thumbnail: thumbnailUrl
      });

      return res.status(resp.status).json(responseData);
    } catch (err) {
      console.error('Upload failed:', err.message || err);
      if (err.response) {
        console.error('ComfyUI response status:', err.response.status);
        console.error('ComfyUI response data:', err.response.data);
      }
      if (err.code) {
        console.error('Error code:', err.code);
      }

      // Clean up any files we may have created
      const filePath = path.join(UPLOADS, req.file.filename);
      const tempInputPath = path.join(UPLOADS, `${stem}.uploadtmp`);
      try { fs.unlinkSync(filePath); } catch (e) {}
      try { fs.unlinkSync(tempInputPath); } catch (e) {}

      return res.status(502).json({ error: 'proxy_failed', message: err.message || String(err) });
    }
  });

  // Save image from an absolute URL (e.g., ComfyUI /view) into generated storage
  app.post('/api/save-from-url', async (req, res) => {
    console.log('POST /api/save-from-url called');
    try {
      const { url, filename } = req.body;
      if (!url) return res.status(400).json({ error: 'missing url' });
      const resp = await axios.get(url, { responseType: 'arraybuffer' });
      const sourceName = filename || `gen-${Date.now()}.jpg`;
      const outName = getCanonicalJpegFilename(sourceName);
      const tempPath = path.join(GENERATED, `${getFilenameStem(outName)}.downloadtmp`);
      const outPath = path.join(GENERATED, outName);

      fs.writeFileSync(tempPath, resp.data);
      await resizeIfNeeded(tempPath, outPath);
      try { fs.unlinkSync(tempPath); } catch (e) {}

      res.json({ path: `/storage/generated/${outName}`, filename: outName });
    } catch (err) {
      console.error('save-from-url error', err.message || err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Serve generated files listing
  app.get('/api/generated', (req, res) => {
    console.log('GET /api/generated called');
    const files = fs.readdirSync(GENERATED).map(f => `/storage/generated/${f}`);
    res.json(files);
  });
}

module.exports = { setupUploadRoutes };