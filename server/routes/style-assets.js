const path = require('path');
const fs = require('fs');

function getAssetsDir() {
  return path.join(__dirname, '..', '..', 'style-assets');
}

function getCatalogId(fileName) {
  return fileName.replace(/_styles\.json$/i, '');
}

function getCatalogLabel(catalogId) {
  return catalogId
    .split(/[_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStyleId(styleName) {
  return String(styleName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) {
    return null;
  }

  if (/^https?:\/\//i.test(thumbnail)) {
    return thumbnail;
  }

  const normalized = String(thumbnail).replace(/\\/g, '/');
  if (normalized.startsWith('thumbnails/')) {
    return `/style-assets/${normalized}`;
  }

  return `/style-assets/thumbnails/${path.basename(normalized)}`;
}

function readCatalogFile(assetsDir, catalogId) {
  const catalogPath = path.join(assetsDir, `${catalogId}_styles.json`);
  const raw = fs.readFileSync(catalogPath, 'utf8');
  return JSON.parse(raw);
}

function listCatalogFiles(assetsDir) {
  return fs.readdirSync(assetsDir)
    .filter(file => /_styles\.json$/i.test(file))
    .sort();
}

function getDefaultCatalogId(catalogFiles) {
  const preferred = catalogFiles.find(file => getCatalogId(file) === 'my_styles');
  if (preferred) {
    return getCatalogId(preferred);
  }

  return catalogFiles.length > 0 ? getCatalogId(catalogFiles[0]) : null;
}

function setupStyleAssetsRoutes(app) {
  app.get('/api/styles/catalogs', (req, res) => {
    console.log('GET /api/styles/catalogs called');
    try {
      const assetsDir = getAssetsDir();
      const catalogFiles = listCatalogFiles(assetsDir);
      const defaultCatalogId = getDefaultCatalogId(catalogFiles);
      const catalogs = catalogFiles.map(file => {
          const catalogId = getCatalogId(file);
          const styles = readCatalogFile(assetsDir, catalogId);

          return {
            id: catalogId,
            label: getCatalogLabel(catalogId),
            style_count: Array.isArray(styles) ? styles.length : 0,
            default: catalogId === defaultCatalogId
          };
        });

      res.json({ catalogs });
    } catch (e) {
      console.warn('Could not list style catalogs:', e.message || e);
      res.status(500).json({ error: 'could_not_list_style_catalogs' });
    }
  });

  app.get('/api/styles', (req, res) => {
    console.log('GET /api/styles called');
    try {
      const { catalog } = req.query;
      const assetsDir = getAssetsDir();
      const catalogFiles = listCatalogFiles(assetsDir);
      if (catalogFiles.length === 0) {
        return res.status(404).json({ error: 'no_style_catalogs' });
      }

      const defaultCatalogId = getDefaultCatalogId(catalogFiles);
      const requestedCatalog = catalog ? String(catalog) : defaultCatalogId;
      const styles = readCatalogFile(assetsDir, requestedCatalog);
      if (!Array.isArray(styles)) {
        return res.status(500).json({ error: 'invalid_catalog_format' });
      }

      res.json({
        catalog: {
          id: requestedCatalog,
          label: getCatalogLabel(requestedCatalog)
        },
        styles: styles.map(style => ({
          id: getStyleId(style.name),
          catalog: requestedCatalog,
          name: style.name,
          prompt: style.prompt,
          negative_prompt: style.negative_prompt,
          thumbnail_url: getThumbnailUrl(style.thumbnail)
        }))
      });
    } catch (e) {
      if (e.code === 'ENOENT') {
        return res.status(404).json({ error: 'catalog_not_found' });
      }

      console.warn('Could not load style catalog:', e.message || e);
      res.status(500).json({ error: 'could_not_load_style_catalog' });
    }
  });

  app.get('/style-assets/styles-list', (req, res) => {
    console.log('GET /style-assets/styles-list called');
    try {
      const assetsDir = getAssetsDir();
      const files = fs.readdirSync(assetsDir).filter(f => /_styles\.json$/i.test(f));
      console.log('Found style-assets files:', files);
      res.json(files);
    } catch (e) {
      console.warn('Could not list style-assets:', e.message || e);
      res.status(500).json({ error: 'could_not_list_style_assets' });
    }
  });
}

module.exports = { setupStyleAssetsRoutes };