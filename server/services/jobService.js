const crypto = require('crypto');

class JobService {
  constructor({ comfyClient, workflowTemplateService, styleCatalogService, uploadService, jobStore }) {
    this.comfyClient = comfyClient;
    this.workflowTemplateService = workflowTemplateService;
    this.styleCatalogService = styleCatalogService;
    this.uploadService = uploadService;
    this.jobStore = jobStore;
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

    const workflow = this.workflowTemplateService.buildStyleTransferWorkflow({
      imageFilename: uploadRecord.stored_filename,
      styleCatalogId: catalog,
      styleName: selectedStyle.name,
      savePrefix
    });

    const promptResponse = await this.comfyClient.submitPrompt({ prompt: workflow });
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
        upstream_prompt_id: upstreamPromptId
      },
      result: null,
      error: null
    });

    return stored;
  }

  getJob(jobId) {
    return this.jobStore.get(jobId);
  }

  getRecentJobs(sessionToken) {
    return this.jobStore.listRecentBySession(sessionToken);
  }
}

module.exports = { JobService };
