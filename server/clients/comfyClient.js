class ComfyClient {
  constructor(comfyApiUrl) {
    this.comfyApiUrl = String(comfyApiUrl || '').replace(/\/$/, '');
  }

  async postJson(path, payload) {
    const response = await fetch(`${this.comfyApiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Comfy request failed (${response.status})`);
      error.status = response.status;
      error.body = text;
      throw error;
    }

    return response.json();
  }

  async getJson(path) {
    const response = await fetch(`${this.comfyApiUrl}${path}`);
    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Comfy request failed (${response.status})`);
      error.status = response.status;
      error.body = text;
      throw error;
    }

    return response.json();
  }

  async submitPrompt(promptPayload) {
    return this.postJson('/prompt', promptPayload);
  }

  async getHistory(promptId) {
    return this.getJson(`/history/${encodeURIComponent(promptId)}`);
  }
}

module.exports = { ComfyClient };
