function setupStylesRoutes(app, styleCatalogService) {
  app.get('/api/styles/catalogs', (req, res) => {
    try {
      const catalogs = styleCatalogService.getCatalogs();
      res.json({ catalogs });
    } catch (error) {
      console.warn('Could not list style catalogs:', error.message || error);
      res.status(500).json({ error: 'could_not_list_style_catalogs' });
    }
  });

  app.get('/api/styles', (req, res) => {
    try {
      const stylesPayload = styleCatalogService.getStyles(req.query.catalog);
      res.json(stylesPayload);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'catalog_not_found' });
      }

      if (error.code === 'NO_STYLE_CATALOGS') {
        return res.status(404).json({ error: 'no_style_catalogs' });
      }

      if (error.code === 'INVALID_CATALOG_FORMAT') {
        return res.status(500).json({ error: 'invalid_catalog_format' });
      }

      console.warn('Could not load styles:', error.message || error);
      res.status(500).json({ error: 'could_not_load_style_catalog' });
    }
  });
}

module.exports = { setupStylesRoutes };
