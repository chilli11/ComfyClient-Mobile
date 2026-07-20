const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const {
  generateThumbnailUrl,
  resizeIfNeeded,
  getCanonicalJpegFilename,
  getFilenameStem
} = require('../utils/imageUtils');

function firstImageFromHistoryOutputs(outputs) {
  if (!outputs || typeof outputs !== 'object') {
    return null;
  }

  for (const nodeOutput of Object.values(outputs)) {
    if (!nodeOutput || !Array.isArray(nodeOutput.images) || nodeOutput.images.length === 0) {
      continue;
    }

    const image = nodeOutput.images[0];
    const filename = image?.filename || image?.name || image?.path;
    if (!filename) {
      continue;
    }

    return {
      filename: path.basename(filename),
      subfolder: image?.subfolder || '',
      type: image?.type || 'output'
    };
  }

  return null;
}

function hasTerminalError(historyEntry) {
  const statusText = String(historyEntry?.status?.status_str || '').toLowerCase();
  if (statusText.includes('error') || statusText.includes('failed') || statusText.includes('interrupted')) {
    return true;
  }

  if (historyEntry?.status?.completed === false && Array.isArray(historyEntry?.status?.messages)) {
    return historyEntry.status.messages.some(message => {
      if (!Array.isArray(message) || message.length < 2) {
        return false;
      }

      const eventType = String(message[0] || '').toLowerCase();
      return eventType === 'execution_error' || eventType === 'execution_interrupted';
    });
  }

  return false;
}

class JobService {
  constructor({ comfyClient, workflowTemplateService, styleCatalogService, uploadService, jobStore, generatedDir, thumbnailsDir, comfyWsUrl }) {
    this.comfyClient = comfyClient;
    this.workflowTemplateService = workflowTemplateService;
    this.styleCatalogService = styleCatalogService;
    this.uploadService = uploadService;
    this.jobStore = jobStore;
    this.generatedDir = generatedDir;
    this.thumbnailsDir = thumbnailsDir;
    this.comfyWsUrl = comfyWsUrl;
  }

  ensureStorageDirs() {
    fs.mkdirSync(this.generatedDir, { recursive: true });
    fs.mkdirSync(this.thumbnailsDir, { recursive: true });
  }

  async materializeHistoryImage(job, imageInfo) {
    this.ensureStorageDirs();

    const canonicalName = getCanonicalJpegFilename(imageInfo.filename || `${job.job_id}.jpg`);
    const tempPath = path.join(this.generatedDir, `${getFilenameStem(canonicalName)}.${crypto.randomUUID()}.viewtmp`);
    const outputPath = path.join(this.generatedDir, canonicalName);
    const imageData = await this.comfyClient.getViewImage(imageInfo);

    fs.writeFileSync(tempPath, imageData);
    await resizeIfNeeded(tempPath, outputPath);
    try { fs.unlinkSync(tempPath); } catch (e) {}

    const thumbnailUrl = await generateThumbnailUrl(outputPath, canonicalName, this.thumbnailsDir);
    return {
      stored_filename: canonicalName,
      local_url: `/storage/generated/${canonicalName}`,
      thumbnail_url: thumbnailUrl
    };
  }

  async reconcileJob(jobId) {
    const job = this.jobStore.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    const upstreamPromptId = job?.prompt?.upstream_prompt_id;
    if (!upstreamPromptId) {
      return job;
    }

    try {
      const historyPayload = await this.comfyClient.getHistory(upstreamPromptId);
      const historyEntry = historyPayload?.[upstreamPromptId];

      if (historyEntry && hasTerminalError(historyEntry)) {
        return this.jobStore.update(jobId, {
          status: 'failed',
          error: historyEntry?.status?.messages || historyEntry?.status?.status_str || 'execution_failed'
        });
      }

      if (historyEntry) {
        const imageInfo = firstImageFromHistoryOutputs(historyEntry.outputs);
        if (imageInfo) {
          const result = await this.materializeHistoryImage(job, imageInfo);
          return this.jobStore.update(jobId, {
            status: 'completed',
            result,
            error: null
          });
        }
      }

      const queueState = await this.comfyClient.getQueueState();
      const pending = Array.isArray(queueState?.queue_pending) ? queueState.queue_pending : [];
      const running = Array.isArray(queueState?.queue_running) ? queueState.queue_running : [];

      const isPending = pending.some(item => Array.isArray(item) && item[1] === upstreamPromptId);
      const isRunning = running.some(item => Array.isArray(item) && item[1] === upstreamPromptId);

      if (isRunning && job.status !== 'running') {
        return this.jobStore.update(jobId, { status: 'running' });
      }

      if (isPending && job.status !== 'queued') {
        return this.jobStore.update(jobId, { status: 'queued' });
      }

      if (!isPending && !isRunning && historyEntry && !firstImageFromHistoryOutputs(historyEntry.outputs)) {
        return this.jobStore.update(jobId, {
          status: 'failed',
          error: historyEntry?.status?.status_str || 'completed_without_output'
        });
      }

      return this.jobStore.get(jobId);
    } catch (error) {
      return this.jobStore.get(jobId);
    }
  }

  startExecutionMonitor({ jobId, promptId, clientId }) {
    if (!this.comfyWsUrl || !promptId || !clientId) {
      return;
    }

    const wsUrl = `${this.comfyWsUrl}${this.comfyWsUrl.includes('?') ? '&' : '?'}clientId=${encodeURIComponent(clientId)}`;
    const ws = new WebSocket(wsUrl);
    const cleanup = () => {
      try { ws.close(); } catch (e) {}
    };

    ws.on('message', async raw => {
      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const messageType = payload?.type;
      const data = payload?.data || {};

      if (!messageType || data.prompt_id !== promptId) {
        return;
      }

      if (messageType === 'execution_start' || messageType === 'progress') {
        this.jobStore.update(jobId, { status: 'running' });
      }

      if (messageType === 'executing') {
        if (data.node === null) {
          await this.reconcileJob(jobId);
          cleanup();
          return;
        }
        this.jobStore.update(jobId, { status: 'running' });
      }

      if (messageType === 'execution_success') {
        await this.reconcileJob(jobId);
        cleanup();
        return;
      }

      if (messageType === 'execution_error' || messageType === 'execution_interrupted') {
        this.jobStore.update(jobId, {
          status: 'failed',
          error: data || messageType
        });
        cleanup();
      }
    });

    ws.on('error', () => {
      cleanup();
    });

    // Safety timeout: fallback reconciliation still happens via API polling.
    setTimeout(cleanup, 5 * 60 * 1000);
  }

  async createStyleTransferJob({ sessionToken, uploadId, catalog, styleId }) {
    if (!sessionToken || !uploadId || !catalog || !styleId) {
      const error = new Error('missing_required_fields');
      error.code = 'MISSING_REQUIRED_FIELDS';
      throw error;
    }

    const uploadRecord = this.uploadService.getUpload(uploadId);
    if (!uploadRecord) {
      const error = new Error('upload_not_found');
      error.code = 'UPLOAD_NOT_FOUND';
      throw error;
    }

    if (uploadRecord.session_token !== sessionToken) {
      const error = new Error('upload_session_mismatch');
      error.code = 'UPLOAD_SESSION_MISMATCH';
      throw error;
    }

    const stylesPayload = this.styleCatalogService.getStyles(catalog);
    const selectedStyle = stylesPayload.styles.find(style => style.id === styleId);
    if (!selectedStyle) {
      const error = new Error('style_not_found');
      error.code = 'STYLE_NOT_FOUND';
      throw error;
    }

    const jobId = `job_${crypto.randomUUID()}`;
    const savePrefix = `${jobId}-${Date.now()}`;
    const comfyImageName = uploadRecord.comfy_image?.name || uploadRecord.stored_filename;

    const workflow = this.workflowTemplateService.buildStyleTransferWorkflow({
      imageFilename: comfyImageName,
      styleCatalogId: catalog,
      styleName: selectedStyle.name,
      savePrefix
    });

    const comfyClientId = crypto.randomUUID();

    const promptResponse = await this.comfyClient.submitPrompt({
      prompt: workflow,
      client_id: comfyClientId
    });
    const upstreamPromptId = promptResponse.prompt_id || null;

    const createdAt = new Date().toISOString();
    const stored = this.jobStore.save({
      job_id: jobId,
      session_token: sessionToken,
      status: 'queued',
      created_at: createdAt,
      updated_at: createdAt,
      upload: {
        upload_id: uploadRecord.upload_id,
        stored_filename: uploadRecord.stored_filename,
        local_url: uploadRecord.local_url
      },
      style: {
        catalog,
        id: selectedStyle.id,
        name: selectedStyle.name
      },
      prompt: {
        upstream_prompt_id: upstreamPromptId,
        upstream_client_id: comfyClientId
      },
      result: null,
      error: null
    });

    this.startExecutionMonitor({
      jobId,
      promptId: upstreamPromptId,
      clientId: comfyClientId
    });

    return stored;
  }

  async getJob(jobId) {
    const reconciled = await this.reconcileJob(jobId);
    return reconciled;
  }

  async getRecentJobs(sessionToken) {
    const jobs = this.jobStore.listRecentBySession(sessionToken);
    const nonTerminal = jobs.filter(job => job.status !== 'completed' && job.status !== 'failed');

    for (const job of nonTerminal) {
      await this.reconcileJob(job.job_id);
    }

    return this.jobStore.listRecentBySession(sessionToken);
  }
}

module.exports = { JobService };
