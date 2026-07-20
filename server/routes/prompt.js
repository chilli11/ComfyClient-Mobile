const axios = require('axios');

function setupPromptRoutes(app, COMFY_API_URL) {
  // Proxy prompt to local ComfyUI
  app.post('/api/prompt', async (req, res) => {
    console.log('POST /api/prompt called');
    try {
      const comfyUrl = `${COMFY_API_URL}/prompt`;
      const resp = await axios.post(comfyUrl, req.body, { headers: { 'Content-Type': 'application/json' } });
      res.json(resp.data);
    } catch (err) {
      console.error('prompt error', err.message || err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });
}

module.exports = { setupPromptRoutes };