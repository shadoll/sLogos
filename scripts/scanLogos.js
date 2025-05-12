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

// Convert SVG to PNG with transparency
function svgToPng(svgBuffer, width, height) {
  // No background specified to maintain transparency
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: width || 256 }
  });
  const pngData = resvg.render().asPng();
  return pngData;
}

// Convert SVG to JPG
function svgToJpg(svgBuffer, width, height) {
  // For JPGs we need a white background since JPG doesn't support transparency
  const resvg = new Resvg(svgBuffer, {
    background: 'white',
    fitTo: { mode: 'width', value: width || 256 }
  });
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

    // Create a Set of all logo paths in the directory
    const logoPathsSet = new Set(logoFiles.map(file => `logos/${file}`));

    // 1. Keep all existing logos that still exist in the directory, in their original order
    const keptLogos = existing.filter(item => logoPathsSet.has(item.path));
    const keptPaths = new Set(keptLogos.map(item => item.path));

    // 2. Add new logos (not present in existing) and sort them alphabetically by name
    const newLogos = logoFiles
      .filter(file => !keptPaths.has(`logos/${file}`))
      .map(file => {
        const format = getFileExtension(file);
        const logoPath = `logos/${file}`;
        return {
          name: formatName(file),
          path: logoPath,
          format: format,
          disable: false,
          tags: [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // 3. Merge: existing (kept) + new (sorted)
    // Instead of just appending newLogos, insert each new logo in the correct sorted position by name
    let merged = [...keptLogos];
    for (const newLogo of newLogos) {
      // Find the first index where newLogo.name < merged[i].name
      let insertIdx = merged.findIndex(l => newLogo.name.localeCompare(l.name) < 0);
      if (insertIdx === -1) {
        merged.push(newLogo);
      } else {
        merged.splice(insertIdx, 0, newLogo);
      }
    }
    const logos = merged;

    // 4. For all, update format/path/brand fields if needed
    for (const logoObj of logos) {
      const file = path.basename(logoObj.path);
      logoObj.format = getFileExtension(file);
      logoObj.path = `logos/${file}`;
      if (!logoObj.name) logoObj.name = formatName(file);
      if (!logoObj.brand) logoObj.brand = logoObj.name;
      if (!Array.isArray(logoObj.tags)) logoObj.tags = [];
      if (typeof logoObj.disable !== 'boolean') logoObj.disable = false;
    }

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
