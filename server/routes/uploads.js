const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }
});

function setupUploadsRoutes(app, uploadService) {
  app.post('/api/uploads', upload.single('image'), async (req, res) => {
    try {
      const uploadRecord = await uploadService.createUpload({
        file: req.file,
        sessionToken: req.body?.session_token
      });

      return res.status(201).json(uploadRecord);
    } catch (error) {
      if (error.code === 'MISSING_FILE') {
        return res.status(400).json({ error: 'missing_file' });
      }

      if (error.code === 'COMFY_UPLOAD_FAILED') {
        return res.status(502).json({ error: 'comfy_upload_failed', message: error.message || String(error) });
      }

      console.error('Upload create failed:', error.message || error);
      return res.status(500).json({ error: 'upload_failed', message: error.message || String(error) });
    }
  });
}

module.exports = { setupUploadsRoutes };
