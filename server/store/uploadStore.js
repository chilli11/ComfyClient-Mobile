const fs = require('fs');
const path = require('path');

class UploadStore {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.uploads = new Map();
    this.load();
  }

  ensureStorageDir() {
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
  }

  load() {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return;
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw);
      const uploads = Array.isArray(parsed.uploads) ? parsed.uploads : [];
      this.uploads = new Map(uploads.map(upload => [upload.upload_id, upload]));
    } catch (error) {
      this.uploads = new Map();
    }
  }

  persist() {
    this.ensureStorageDir();
    const payload = {
      uploads: Array.from(this.uploads.values())
    };
    fs.writeFileSync(this.storagePath, JSON.stringify(payload, null, 2));
  }

  save(upload) {
    this.uploads.set(upload.upload_id, { ...upload });
    this.persist();
    return this.uploads.get(upload.upload_id);
  }

  get(uploadId) {
    return this.uploads.get(uploadId) || null;
  }
}

module.exports = { UploadStore };
