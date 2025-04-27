// This file has been renamed and updated. See scanLogos.js in the same directory for the new script.

const fs = require('fs');
const path = require('path');

// Configuration
const logosDir = path.join(__dirname, '../public/logos');
const outputFile = path.join(__dirname, '../public/data/logos.json');

// Get file extension without the dot
function getFileExtension(filename) {
  return path.extname(filename).slice(1).toUpperCase();
}

// Get file name without extension
function getBaseName(filename) {
  return path.basename(filename, path.extname(filename));
}

// Convert filename to readable name (replace hyphens with spaces, capitalize words)
function formatName(filename) {
  return getBaseName(filename)
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Scan directory and update logo objects
function scanLogos() {
  console.log(`Scanning logos directory: ${logosDir}`);

  let existing = [];
  if (fs.existsSync(outputFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    } catch (e) {
      console.error('Could not parse existing logos.json:', e);
    }
  }
  const existingMap = new Map();
  for (const item of existing) {
    existingMap.set(item.path, item);
  }

  try {
    if (!fs.existsSync(logosDir)) {
      console.error(`Directory does not exist: ${logosDir}`);
      return [];
    }

    const files = fs.readdirSync(logosDir);
    // Filter for image files (svg, png, jpg, jpeg)
    const logoFiles = files.filter(file =>
      /\.(svg|png|jpg|jpeg)$/i.test(file)
    );

    console.log(`Found ${logoFiles.length} logo files`);

    // Create logo objects
    const logos = logoFiles.map(file => {
      const format = getFileExtension(file);
      const logoPath = `logos/${file}`;
      const existingItem = existingMap.get(logoPath);
      if (existingItem) {
        // Preserve name and disable, update format/path
        return {
          ...existingItem,
          path: logoPath,
          format: format,
          disable: typeof existingItem.disable === 'boolean' ? existingItem.disable : false
        };
      } else {
        // New logo
        return {
          name: formatName(file),
          path: logoPath,
          format: format,
          disable: false
        };
      }
    });
    return logos;
  } catch (error) {
    console.error('Error scanning logos directory:', error);
    return [];
  }
}

// Save logos data to JSON file
function saveLogosToJson(logos) {
  try {
    const data = JSON.stringify(logos, null, 2);
    fs.writeFileSync(outputFile, data);
    console.log(`Successfully wrote ${logos.length} logos to ${outputFile}`);
  } catch (error) {
    console.error('Error writing logos data to file:', error);
  }
}

// Main function
function main() {
  const logos = scanLogos();
  saveLogosToJson(logos);
}

// Run the script
main();
