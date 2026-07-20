const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  generateThumbnailUrl,
  resizeIfNeeded,
  getCanonicalJpegFilename,
  getFilenameStem
} = require('../utils/imageUtils');

class UploadService {
  constructor({ uploadsDir, thumbnailsDir, uploadStore }) {
    this.uploadsDir = uploadsDir;
    this.thumbnailsDir = thumbnailsDir;
    this.uploadStore = uploadStore;
  }

  ensureStorageDirs() {
    fs.mkdirSync(this.uploadsDir, { recursive: true });
    fs.mkdirSync(this.thumbnailsDir, { recursive: true });
  }

  async createUpload({ file, sessionToken }) {
    if (!file) {
      const error = new Error('missing_file');
      error.code = 'MISSING_FILE';
      throw error;
    }

    this.ensureStorageDirs();

    const sanitized = String(file.originalname || 'upload')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFilename = getCanonicalJpegFilename(sanitized);
    const stem = getFilenameStem(storedFilename);

    const tempInputPath = path.join(this.uploadsDir, `${stem}.${crypto.randomUUID()}.uploadtmp`);
    const outputPath = path.join(this.uploadsDir, storedFilename);

    fs.writeFileSync(tempInputPath, file.buffer);
    await resizeIfNeeded(tempInputPath, outputPath);
    try { fs.unlinkSync(tempInputPath); } catch (e) {}

    const thumbnailUrl = await generateThumbnailUrl(outputPath, storedFilename, this.thumbnailsDir);
    const uploadId = `upl_${crypto.randomUUID()}`;
    const resolvedSessionToken = sessionToken || `sess_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    const upload = this.uploadStore.save({
      upload_id: uploadId,
      session_token: resolvedSessionToken,
      created_at: createdAt,
      original_filename: file.originalname,
      stored_filename: storedFilename,
      mime_type: 'image/jpeg',
      local_url: `/storage/uploads/${storedFilename}`,
      thumbnail_url: thumbnailUrl
    });

    return upload;
  }

  getUpload(uploadId) {
    return this.uploadStore.get(uploadId);
  }
}

module.exports = { UploadService };
