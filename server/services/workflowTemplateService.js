const fs = require('fs');
const path = require('path');

function toComfyStylesCatalog(catalogId) {
  if (!catalogId) {
    return catalogId;
  }

  return /_styles$/i.test(catalogId) ? catalogId : `${catalogId}_styles`;
}

class WorkflowTemplateService {
  constructor(templatePath) {
    this.templatePath = templatePath;
  }

  loadTemplate() {
    const raw = fs.readFileSync(this.templatePath, 'utf8');
    return JSON.parse(raw);
  }

  buildStyleTransferWorkflow({ imageFilename, styleCatalogId, styleName, savePrefix }) {
    const workflow = this.loadTemplate();

    if (workflow['6'] && workflow['6'].inputs) {
      workflow['6'].inputs.image = imageFilename;
    }

    if (workflow['62'] && workflow['62'].inputs) {
      if (styleCatalogId) {
        workflow['62'].inputs.styles = toComfyStylesCatalog(styleCatalogId);
      }
      if (styleName) {
        workflow['62'].inputs.select_styles = styleName;
      }
    }

    if (workflow['17'] && workflow['17'].inputs) {
      workflow['17'].inputs.filename_prefix = savePrefix;
    }

    return workflow;
  }
}

function getDefaultTemplatePath(rootDir) {
  return path.join(rootDir, 'style-assets', 'Simple-Style-Changer-Flux-API.json');
}

module.exports = { WorkflowTemplateService, getDefaultTemplatePath };
