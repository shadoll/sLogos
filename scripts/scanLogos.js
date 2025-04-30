// This file has been renamed and updated. See scanLogos.js in the same directory for the new script.

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Configuration
const logosDir = path.join(__dirname, '../public/logos');
const outputFile = path.join(__dirname, '../public/data/logos.json');
const genDir = path.join(__dirname, '../public/logos_gen');

// Remove old PNG/JPG folders if they exist
const pngDir = path.join(__dirname, '../public/logos-png');
const jpgDir = path.join(__dirname, '../public/logos-jpg');
if (fs.existsSync(pngDir)) fs.rmSync(pngDir, { recursive: true, force: true });
if (fs.existsSync(jpgDir)) fs.rmSync(jpgDir, { recursive: true, force: true });

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

// Clean directory (remove all contents)
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (file !== '.gitignore') {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Convert SVG to PNG
function svgToPng(svgBuffer, width, height) {
  const resvg = new Resvg(svgBuffer, { fitTo: { mode: 'width', value: width || 256 } });
  const pngData = resvg.render().asPng();
  return pngData;
}

// Convert SVG to JPG
function svgToJpg(svgBuffer, width, height) {
  const resvg = new Resvg(svgBuffer, { fitTo: { mode: 'width', value: width || 256 } });
  // Convert PNG buffer to JPEG using a pure JS lib, or just save as PNG (JPEG is optional)
  const pngData = resvg.render().asPng();
  return pngData;
}

// Pregenerate PNG and JPG images for SVG files
function pregenerateImages(logoFiles) {
  cleanDir(genDir);
  for (const file of logoFiles) {
    if (/\.svg$/i.test(file)) {
      const base = getBaseName(file);
      const svgPath = path.join(logosDir, file);
      const pngPath = path.join(genDir, base + '.png');
      const jpgPath = path.join(genDir, base + '.jpg');
      try {
        const svgBuffer = fs.readFileSync(svgPath);
        const pngBuffer = svgToPng(svgBuffer, 256, 256);
        fs.writeFileSync(pngPath, pngBuffer);
        const jpgBuffer = svgToJpg(svgBuffer);
        fs.writeFileSync(jpgPath, jpgBuffer);
      } catch (e) {
        console.error('Error generating PNG/JPG for', file, e);
      }
    }
  }
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
      let logoObj;
      if (existingItem) {
        // Preserve name, tags, and disable, update format/path
        logoObj = {
          ...existingItem,
          path: logoPath,
          format: format,
          disable: typeof existingItem.disable === 'boolean' ? existingItem.disable : false,
          brand: existingItem.brand || existingItem.name || formatName(file)
        };
      } else {
        // New logo
        logoObj = {
          name: formatName(file),
          path: logoPath,
          format: format,
          disable: false,
          brand: formatName(file)
        };
      }
      // Ensure tags field exists and is an array
      if (!Array.isArray(logoObj.tags)) {
        logoObj.tags = [];
      }
      return logoObj;
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
  // Pregenerate PNG/JPG for all SVGs
  const files = fs.readdirSync(logosDir);
  pregenerateImages(files);
  saveLogosToJson(logos);
}

// Run the script
main();
