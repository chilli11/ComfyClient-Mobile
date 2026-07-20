const axios = require('axios');

function setupHistoryRoutes(app, COMFY_API_URL) {
  // Proxy ComfyUI history endpoint by id (GET /history/:id)
  app.get('/api/history/:id', async (req, res) => {
    console.log('GET /api/history/:id called');
    const id = req.params.id;
    try {
      const comfyUrl = `${COMFY_API_URL}/history/${encodeURIComponent(id)}`;
      const resp = await axios.get(comfyUrl);
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      // If ComfyUI responded with a non-2xx, forward that status and body
      if (err.response) {
        try { return res.status(err.response.status).json(err.response.data); } catch(e) {}
      }
      console.error('history proxy error', err.message || err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Convenience endpoint: fetch a specific history entry and return it
  // Uses the ID requested by the user: 1febdeee-0ad3-4d74-836e-dc3bc4d092a6
  app.post('/api/history/fetch-specific', async (req, res) => {
    console.log('POST /api/history/fetch-specific called');
    const id = '1febdeee-0ad3-4d74-836e-dc3bc4d092a6';
    try {
      const comfyUrl = `${COMFY_API_URL}/history/${encodeURIComponent(id)}`;
      const resp = await axios.get(comfyUrl);
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      if (err.response) {
        try { return res.status(err.response.status).json(err.response.data); } catch(e) {}
      }
      console.error('fetch-specific history error', err.message || err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });
}

module.exports = { setupHistoryRoutes };