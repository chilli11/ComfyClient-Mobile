const fs = require('fs');
const path = require('path');

class JobStore {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.jobs = new Map();
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
      const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
      this.jobs = new Map(jobs.map(job => [job.job_id, job]));
    } catch (error) {
      this.jobs = new Map();
    }
  }

  persist() {
    this.ensureStorageDir();
    const payload = {
      jobs: Array.from(this.jobs.values())
    };
    fs.writeFileSync(this.storagePath, JSON.stringify(payload, null, 2));
  }

  save(job) {
    this.jobs.set(job.job_id, { ...job });
    this.persist();
    return this.jobs.get(job.job_id);
  }

  get(jobId) {
    return this.jobs.get(jobId) || null;
  }

  listRecentBySession(sessionToken, limit = 20) {
    return Array.from(this.jobs.values())
      .filter(job => job.session_token === sessionToken)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  }

  update(jobId, updates) {
    const existing = this.get(jobId);
    if (!existing) {
      return null;
    }

    const next = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.jobs.set(jobId, next);
    this.persist();
    return next;
  }
}

module.exports = { JobStore };
