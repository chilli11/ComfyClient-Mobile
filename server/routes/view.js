const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { resizeIfNeeded, generateThumbnailUrl, getCanonicalJpegFilename, getFilenameStem } = require('../utils/imageUtils');

function setupViewRoutes(app, COMFY_API_URL, GENERATED, THUMBNAILS) {
  // Fetch a history entry by id, extract generated filename, fetch the image via ComfyUI /view
  // and save it into our generated storage, returning a local storage path.
  app.post('/api/history/:id/view', async (req, res) => {
    console.log('POST /api/history/:id/view called');
    const id = req.params.id;
    try {
      const comfyUrl = `${COMFY_API_URL}/history/${encodeURIComponent(id)}`;
      console.log(`Fetching history from: ${comfyUrl}`);
      const histResp = await axios.get(comfyUrl);
      const hist = histResp.data[id] || {};
      console.log(`History data for ${id}`);

      if (!hist || Object.keys(hist).length === 0) {
        console.log(`No history entry found for id: ${id}`);
        return res.status(404).json({ error: 'history_entry_not_found' });
      }

      // Try to locate a filename inside hist.outputs
      let filename = null;
      let subfolder = '';
      if (hist.outputs && typeof hist.outputs === 'object') {
        for (const val of Object.values(hist.outputs)) {
          if (val && Array.isArray(val.images) && val.images.length > 0) {
            const img = val.images[0];
            // Try different possible filename fields
            const baseFilename = img.filename || img.name || img.path;
            if (baseFilename) {
              filename = baseFilename;
              subfolder = img.subfolder || '';
              // If filename includes path, extract just the filename
              if (filename.includes('/') || filename.includes('\\')) {
                filename = path.basename(filename);
              }
              console.log(`Found filename in history: ${filename}, subfolder: ${subfolder}`);
              break;
            }
          }
        }
      }

      if (!filename) {
        console.log('No filename found in history outputs:', JSON.stringify(hist.outputs, null, 2));
        return res.status(404).json({ error: 'no_filename_found_in_history' });
      }

      // Validate filename
      if (!filename.match(/\.(png|jpe?g|webp|gif)$/i)) {
        console.log(`Invalid filename format: ${filename}`);
        return res.status(400).json({ error: 'invalid_filename_format' });
      }

      // Fetch the binary from ComfyUI /view
      let viewUrl = `${COMFY_API_URL}/view?filename=${encodeURIComponent(filename)}`;
      if (subfolder) {
        viewUrl += `&subfolder=${encodeURIComponent(subfolder)}`;
      }
      console.log(`Fetching image from: ${viewUrl}`);
      const imgResp = await axios.get(viewUrl, { responseType: 'arraybuffer' });
      console.log(`Image fetch successful, size: ${imgResp.data.length} bytes`);

      const outName = getCanonicalJpegFilename(filename);
      const tempPath = path.join(GENERATED, `temp_${getFilenameStem(outName)}.viewtmp`);
      const outPath = path.join(GENERATED, outName);

      // Save to temp file first
      fs.writeFileSync(tempPath, imgResp.data);

      // Resize if needed and save to final location
      const wasResized = await resizeIfNeeded(tempPath, outPath);

      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (e) {}

      // Generate thumbnail from the final image
      const thumbnailUrl = await generateThumbnailUrl(outPath, outName, THUMBNAILS);

      return res.json({
        path: `/storage/generated/${outName}`,
        filename: outName,
        thumbnail: thumbnailUrl
      });
    } catch (err) {
      if (err.response) {
        try { return res.status(err.response.status).json(err.response.data); } catch(e) {}
      }
      console.error('history view error', err.message || err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Direct endpoint: provide a filename and fetch the image from ComfyUI /view, save locally and return path
  app.post('/api/view/from-filename', async (req, res) => {
    console.log('POST /api/view/from-filename called');
    try {
      const { filename } = req.body || {};
      if (!filename) return res.status(400).json({ error: 'missing filename' });

      const viewUrl = `${COMFY_API_URL}/view?filename=${encodeURIComponent(filename)}`;
      const imgResp = await axios.get(viewUrl, { responseType: 'arraybuffer' });
      const outName = getCanonicalJpegFilename(filename);
      const tempPath = path.join(GENERATED, `temp_${getFilenameStem(outName)}.viewtmp`);
      const outPath = path.join(GENERATED, outName);

      // Save to temp file first
      fs.writeFileSync(tempPath, imgResp.data);

      // Resize if needed and save to final location
      const wasResized = await resizeIfNeeded(tempPath, outPath);

      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (e) {}

      // Generate thumbnail from the final image
      const thumbnailUrl = await generateThumbnailUrl(outPath, outName, THUMBNAILS);

      return res.json({
        path: `/storage/generated/${outName}`,
        filename: outName,
        thumbnail: thumbnailUrl
      });
    } catch (err) {
      if (err.response) {
        try { return res.status(err.response.status).json(err.response.data); } catch(e) {}
      }
      console.error('view from filename error', err.message || err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });
}

module.exports = { setupViewRoutes };