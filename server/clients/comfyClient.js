const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

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

  async getPromptState() {
    return this.getJson('/prompt');
  }

  async getQueueState() {
    return this.getJson('/queue');
  }

  async getHistory(promptId) {
    return this.getJson(`/history/${encodeURIComponent(promptId)}`);
  }

  async getViewImage({ filename, subfolder = '', type = 'output' }) {
    const params = new URLSearchParams({ filename, type });
    if (subfolder) {
      params.set('subfolder', subfolder);
    }

    const response = await axios.get(`${this.comfyApiUrl}/view?${params.toString()}`, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return Buffer.from(response.data);
  }

  async uploadImage(imagePath, filename) {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath), { filename });

    const response = await axios.post(`${this.comfyApiUrl}/upload/image`, form, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      timeout: 30000
    });

    return response.data || {};
  }
}

module.exports = { ComfyClient };
