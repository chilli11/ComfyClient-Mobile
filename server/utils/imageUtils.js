const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

function getFilenameStem(sourceName) {
  return path.basename(sourceName, path.extname(sourceName));
}

function getCanonicalJpegFilename(sourceName) {
  return `${getFilenameStem(sourceName)}.jpg`;
}

// Generate a thumbnail with max 512px dimension, maintaining aspect ratio
async function generateThumbnail(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'inside', // Maintain aspect ratio, fit within 512x512
        withoutEnlargement: true // Don't enlarge images smaller than 512px
      })
      .jpeg({
        quality: 60, // Low quality for smaller file size
        progressive: true
      })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error(`Thumbnail generation failed for ${inputPath}:`, error.message);
    return false;
  }
}

// Check if image needs resizing (dimensions > 1600px)
async function needsResize(inputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    return metadata.width > 1600 || metadata.height > 1600;
  } catch (error) {
    console.warn('Failed to check image dimensions:', error.message);
    return false;
  }
}

// Resize image if larger than 1600px on any dimension
async function resizeIfNeeded(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    const { width, height } = metadata;

    // If image is larger than 1600px on any dimension, resize it
    if (width > 1600 || height > 1600) {
      await sharp(inputPath)
        .resize(1600, 1600, {
          fit: 'inside', // Maintain aspect ratio, fit within 1600x1600
          withoutEnlargement: false // Allow resizing down
        })
        .jpeg({
          quality: 85, // Good quality for resized images
          progressive: true
        })
        .toFile(outputPath);

      return true; // Image was resized
    } else {
      // Image doesn't need resizing, but we still need to move it to the final location
      // Use sharp to copy/convert to ensure consistent format
      await sharp(inputPath)
        .jpeg({
          quality: 95, // High quality for non-resized images
          progressive: true
        })
        .toFile(outputPath);
      return false; // Image was not resized but was processed
    }
  } catch (error) {
    console.error(`Resize failed for ${inputPath}:`, error.message);
    return false;
  }
}

// Generate thumbnail for an image and return the URL
async function generateThumbnailUrl(sourcePath, sourceName, THUMBNAILS) {
  // Check if source file exists first
  if (!fs.existsSync(sourcePath)) {
    console.warn(`Source file does not exist: ${sourcePath}`);
    return null;
  }

  const thumbnailFilename = `thumb_${getFilenameStem(sourceName)}.jpg`;
  const thumbnailPath = path.join(THUMBNAILS, thumbnailFilename);

  const thumbnailGenerated = await generateThumbnail(sourcePath, thumbnailPath);
  if (thumbnailGenerated) {
    return `/storage/thumbnails/${thumbnailFilename}`;
  } else {
    console.error(`Thumbnail generation failed for ${sourcePath}`);
    return null;
  }
}

// Check if file with same name exists and return its info
async function checkDuplicate(filename, UPLOADS, THUMBNAILS) {
  try {
    const files = fs.readdirSync(UPLOADS);
    const exactMatch = files.find(f => f === filename);
    if (exactMatch) {
      const filePath = path.join(UPLOADS, exactMatch);
      const thumbnailUrl = await generateThumbnailUrl(filePath, exactMatch, THUMBNAILS);
      return {
        exists: true,
        filename: exactMatch,
        path: filePath,
        thumbnail: thumbnailUrl,
        local_path: `/storage/uploads/${exactMatch}`
      };
    }
    return { exists: false };
  } catch (error) {
    console.warn('Duplicate check failed:', error.message);
    return { exists: false };
  }
}

module.exports = {
  generateThumbnail,
  needsResize,
  resizeIfNeeded,
  generateThumbnailUrl,
  checkDuplicate,
  getFilenameStem,
  getCanonicalJpegFilename
};