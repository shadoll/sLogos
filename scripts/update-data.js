#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Use collections from src/collections.js
const { collections } = require('../src/collections.js');

// Accept collection as a CLI arg or env var
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : (process.env.COLLECTION || 'logos');
const collection = collections.find(c => c.name === collectionName) || collections[0];

const logosDir = path.join(__dirname, '..', 'public', collection.baseDir);
const outputFile = path.join(__dirname, '..', 'public', collection.dataFile);
const genDir = path.join(__dirname, '..', 'public', collection.genDir);

// Remove old PNG/JPG folders if they exist
const pngDir = path.join(__dirname, '..', 'public', collection.baseDir + '-png');
const jpgDir = path.join(__dirname, '..', 'public', collection.baseDir + '-jpg');
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
function pregenerateImages(logoFiles, logosDir, genDir) {
  cleanDir(genDir);
  // Only process SVG files
  const svgFiles = logoFiles.filter(file => /\.svg$/i.test(file));
  for (const file of svgFiles) {
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

    // Create a Set of all logo filenames in the directory
    const logoFilesSet = new Set(logoFiles);

    // Mark existing records as disabled if they are not found in the directory
    for (const logo of existing) {
      // Fix: If logo.path contains a slash, strip to filename only
      if (logo.path.includes('/')) {
        logo.path = logo.path.split('/').pop();
      }
      if (!logoFilesSet.has(logo.path)) {
        logo.disable = true;
      } else if (logo.disable) {
        logo.disable = false;
      }
    }

    // Create a Set of existing filenames to avoid duplication
    const existingPathsSet = new Set(existing.map(logo => logo.path));

    // Create new minimal logo objects for files that don't have records yet
    const newLogos = logoFiles
      .filter(file => !existingPathsSet.has(file))
      .map(file => {
        const format = getFileExtension(file);
        // Only add minimal fields for new files
        return {
          name: formatName(file),
          path: file,
          format: format,
          disable: false
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Merge existing and new logos (add new at the end)
    let merged = [...existing, ...newLogos];
    return merged;
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
  // If no collection is specified, process all collections
  if (!collectionArg && !process.env.COLLECTION) {
    for (const col of collections) {
      const logosDir = path.join(__dirname, '..', 'public', col.baseDir);
      const outputFile = path.join(__dirname, '..', 'public', col.dataFile);
      const genDir = path.join(__dirname, '..', 'public', col.genDir);
      if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
      }
      const files = fs.readdirSync(logosDir);
      // Only update/disable/add, do not overwrite existing keys
      let existing = [];
      if (fs.existsSync(outputFile)) {
        try {
          existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        } catch (e) {
          console.error('Could not parse existing', col.dataFile + ':', e);
        }
      }
      // Filter for image files (svg, png, jpg, jpeg)
      const logoFiles = files.filter(file =>
        /\.(svg|png|jpg|jpeg)$/i.test(file)
      );
      const logoFilesSet = new Set(logoFiles);
      for (const logo of existing) {
        // Fix: If logo.path contains a slash, strip to filename only
        if (logo.path.includes('/')) {
          logo.path = logo.path.split('/').pop();
        }
        if (!logoFilesSet.has(logo.path)) {
          logo.disable = true;
        } else if (logo.disable) {
          logo.disable = false;
        }
      }
      const existingPathsSet = new Set(existing.map(logo => logo.path));
      const newLogos = logoFiles
        .filter(file => !existingPathsSet.has(file))
        .map(file => {
          const format = getFileExtension(file);
          return {
            name: formatName(file),
            path: file,
            format: format,
            disable: false
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      let merged = [...existing, ...newLogos];
      pregenerateImages(files, logosDir, genDir);
      try {
        const data = JSON.stringify(merged, null, 2);
        fs.writeFileSync(outputFile, data);
        console.log(`Successfully wrote ${merged.length} items to ${outputFile}`);
      } catch (error) {
        console.error('Error writing data to file:', outputFile, error);
      }
    }
  } else {
    // Single collection mode (as before)
    const logos = scanLogos();
    const files = fs.readdirSync(logosDir);
    pregenerateImages(files, logosDir, genDir);
    saveLogosToJson(logos);
  }
}

// Run the script
main();
