function setupJobsRoutes(app, jobService) {
  app.post('/api/jobs/style-transfer', async (req, res) => {
    try {
      const { session_token: sessionToken, upload_id: uploadId, catalog, style_id: styleId } = req.body || {};
      const job = await jobService.createStyleTransferJob({
        sessionToken,
        uploadId,
        catalog,
        styleId
      });

      res.status(201).json(job);
    } catch (error) {
      if (error.code === 'MISSING_REQUIRED_FIELDS') {
        return res.status(400).json({ error: 'missing_required_fields' });
      }

      if (error.code === 'STYLE_NOT_FOUND') {
        return res.status(404).json({ error: 'style_not_found' });
      }

      if (error.code === 'UPLOAD_NOT_FOUND') {
        return res.status(404).json({ error: 'upload_not_found' });
      }

      if (error.code === 'UPLOAD_SESSION_MISMATCH') {
        return res.status(403).json({ error: 'upload_session_mismatch' });
      }

      console.error('Create job failed:', error.message || error);
      return res.status(502).json({ error: 'job_submission_failed', message: error.message || String(error) });
    }
  });

  app.get('/api/jobs/:jobId', async (req, res) => {
    const job = await jobService.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'job_not_found' });
    }

    return res.json(job);
  });

  app.get('/api/jobs/recent', async (req, res) => {
    const sessionToken = req.query.session_token || req.header('x-session-token');
    if (!sessionToken) {
      return res.status(400).json({ error: 'missing_session_token' });
    }

    const jobs = await jobService.getRecentJobs(sessionToken);
    return res.json({ session_token: sessionToken, jobs });
  });
}

module.exports = { setupJobsRoutes };
