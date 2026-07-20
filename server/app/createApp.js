const path = require('path');
const express = require('express');

const { getConfig } = require('../config');
const { ComfyClient } = require('../clients/comfyClient');
const { StyleCatalogService } = require('../services/styleCatalogService');
const { WorkflowTemplateService, getDefaultTemplatePath } = require('../services/workflowTemplateService');
const { UploadStore } = require('../store/uploadStore');
const { JobStore } = require('../store/jobStore');
const { UploadService } = require('../services/uploadService');
const { JobService } = require('../services/jobService');

const { setupStylesRoutes } = require('../routes/styles');
const { setupUploadsRoutes } = require('../routes/uploads');
const { setupJobsRoutes } = require('../routes/jobs');

function createApp() {
  const config = getConfig();
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const comfyClient = new ComfyClient(config.comfyApiUrl);
  const styleCatalogService = new StyleCatalogService(config.styleAssetsDir);
  const workflowTemplateService = new WorkflowTemplateService(getDefaultTemplatePath(path.join(__dirname, '..', '..')));
  const metadataDir = path.join(config.storage.uploadsDir, '..', 'metadata');
  const uploadStore = new UploadStore(path.join(metadataDir, 'uploads.json'));
  const jobStore = new JobStore(path.join(metadataDir, 'jobs.json'));

  const uploadService = new UploadService({
    uploadsDir: config.storage.uploadsDir,
    thumbnailsDir: config.storage.thumbnailsDir,
    uploadStore,
    comfyClient
  });

  const jobService = new JobService({
    comfyClient,
    workflowTemplateService,
    styleCatalogService,
    uploadService,
    jobStore,
    generatedDir: config.storage.generatedDir,
    thumbnailsDir: config.storage.thumbnailsDir,
    comfyWsUrl: config.comfyWsUrl
  });

  app.use('/storage/uploads', express.static(config.storage.uploadsDir));
  app.use('/storage/generated', express.static(config.storage.generatedDir));
  app.use('/storage/thumbnails', express.static(config.storage.thumbnailsDir));
  app.use('/style-assets/thumbnails', express.static(path.join(config.styleAssetsDir, 'thumbnails')));

  setupStylesRoutes(app, styleCatalogService);
  setupUploadsRoutes(app, uploadService);
  setupJobsRoutes(app, jobService);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', comfy_api_url: config.comfyApiUrl });
  });

  return { app, config };
}

module.exports = { createApp };
