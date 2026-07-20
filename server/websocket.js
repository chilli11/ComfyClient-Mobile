const WebSocket = require('ws');

function setupWebSocket(server, COMFY_WS_URL) {
  const wss = new WebSocket.Server({ server, path: '/api/ws' });

  // Simple relay: when a client connects, connect to ComfyUI ws and pipe messages
  wss.on('connection', (wsClient) => {
    console.log('WebSocket connection handler called');
    console.log('WS client connected');
    const comfyWs = new WebSocket(COMFY_WS_URL);

    comfyWs.on('open', () => {
      console.log('Connected to ComfyUI WS');
    });
    comfyWs.on('message', (msg) => {
      // Forward raw message to client
      try { wsClient.send(msg); } catch(e){}

      // Try to parse and detect completion / image URLs
      try {
        const parsed = JSON.parse(msg.toString());
        // recursive search for image-like strings
        const urls = [];
        function collectStrings(o) {
          if (!o) return;
          if (typeof o === 'string') {
            const s = o;
            if (/^https?:\/\/.+\.(png|jpe?g|webp|gif)$/i.test(s) || /^\/view/.test(s) || /^\/storage\/.+\.(png|jpe?g|webp|gif)$/i.test(s) || /\.(png|jpe?g|webp|gif)$/.test(s)) {
              urls.push(s);
            }
            return;
          }
          if (Array.isArray(o)) return o.forEach(collectStrings);
          if (typeof o === 'object') return Object.values(o).forEach(collectStrings);
        }
        collectStrings(parsed);

        // Normalize to absolute URLs where possible
        const comfyBase = COMFY_WS_URL.replace(/^ws/, 'http').replace(/\/ws$/, '');
        const normalized = urls.map(s => {
          if (/^https?:\/\//.test(s)) return s;
          if (s.startsWith('/view')) return comfyBase + s;
          if (s.startsWith('/storage')) return comfyBase + s;
          // bare filename -> try /view?path=
          if (/^[\w\-]+\.(png|jpe?g|webp|gif)$/i.test(s)) return `${comfyBase}/view?name=${encodeURIComponent(s)}`;
          return null;
        }).filter(Boolean);

        if (normalized.length > 0) {
          const payload = { event: 'done', result_url: normalized[0], result_urls: normalized };
          try { wsClient.send(JSON.stringify(payload)); } catch(e){}
        }
      } catch (e) {
        // not JSON or parse failed - ignore
      }
    });
    comfyWs.on('error', (e) => console.warn('ComfyWS error', e.message || e));

    wsClient.on('message', (m) => {
      // allow client to forward messages to ComfyUI if needed
      if (comfyWs.readyState === WebSocket.OPEN) comfyWs.send(m);
    });

    wsClient.on('close', () => {
      try { comfyWs.close(); } catch(e){}
    });
  });
}

module.exports = { setupWebSocket };