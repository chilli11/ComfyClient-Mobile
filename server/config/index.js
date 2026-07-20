const path = require('path');

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getConfig() {
  const rootDir = path.join(__dirname, '..', '..');

  return {
    env: process.env.NODE_ENV || 'development',
    port: toNumber(process.env.PORT, 3000),
    comfyApiUrl: process.env.COMFY_API_URL || 'http://host.docker.internal:8188',
    comfyWsUrl: process.env.COMFY_WS_URL || 'ws://host.docker.internal:8188/ws',
    styleAssetsDir: process.env.STYLE_ASSETS_DIR || path.join(rootDir, 'style-assets'),
    storage: {
      uploadsDir: process.env.UPLOADS_DIR || path.join(rootDir, 'storage', 'uploads'),
      generatedDir: process.env.GENERATED_DIR || path.join(rootDir, 'storage', 'generated'),
      thumbnailsDir: process.env.THUMBNAILS_DIR || path.join(rootDir, 'storage', 'thumbnails')
    }
  };
}

module.exports = { getConfig };
