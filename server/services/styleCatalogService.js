const fs = require('fs');
const path = require('path');

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

class StyleCatalogService {
  constructor(styleAssetsDir) {
    this.styleAssetsDir = styleAssetsDir;
  }

  listCatalogFiles() {
    return fs.readdirSync(this.styleAssetsDir)
      .filter(file => /_styles\.json$/i.test(file))
      .sort();
  }

  getDefaultCatalogId(catalogFiles) {
    const preferred = catalogFiles.find(file => getCatalogId(file) === 'my_styles');
    if (preferred) {
      return getCatalogId(preferred);
    }

    return catalogFiles.length > 0 ? getCatalogId(catalogFiles[0]) : null;
  }

  readCatalog(catalogId) {
    const catalogPath = path.join(this.styleAssetsDir, `${catalogId}_styles.json`);
    const raw = fs.readFileSync(catalogPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      const error = new Error('invalid_catalog_format');
      error.code = 'INVALID_CATALOG_FORMAT';
      throw error;
    }

    return parsed;
  }

  getCatalogs() {
    const files = this.listCatalogFiles();
    const defaultCatalogId = this.getDefaultCatalogId(files);

    return files.map(file => {
      const id = getCatalogId(file);
      const styles = this.readCatalog(id);

      return {
        id,
        label: getCatalogLabel(id),
        style_count: styles.length,
        default: id === defaultCatalogId
      };
    });
  }

  getStyles(catalogId) {
    const files = this.listCatalogFiles();
    if (files.length === 0) {
      const error = new Error('no_style_catalogs');
      error.code = 'NO_STYLE_CATALOGS';
      throw error;
    }

    const requestedCatalog = catalogId || this.getDefaultCatalogId(files);
    const styles = this.readCatalog(requestedCatalog);

    return {
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
    };
  }
}

module.exports = { StyleCatalogService, getStyleId };
