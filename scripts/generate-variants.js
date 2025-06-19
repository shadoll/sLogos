#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Use collections from src/collections.js
const { collections } = require('../src/collections.js');

// Accept collection as a CLI arg or env var
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : (process.env.COLLECTION || 'logos');

// Get file name without extension
function getBaseName(filename) {
  return path.basename(filename, path.extname(filename));
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

// Generate PNG and JPG variants for SVG files
function generateVariants(collectionName) {
  const collection = collections.find(c => c.name === collectionName);
  if (!collection) {
    console.error(`Collection "${collectionName}" not found`);
    return;
  }

  const imagesDir = path.join(__dirname, '..', 'public', collection.baseDir);
  const varDir = path.join(__dirname, '..', 'public', collection.varDir);

  if (!fs.existsSync(imagesDir)) {
    console.error(`Directory does not exist: ${imagesDir}`);
    return;
  }

  console.log(`Generating variants for collection: ${collection.label}`);
  console.log(`Source: ${imagesDir}`);
  console.log(`Target: ${varDir}`);

  // Clean variants directory
  cleanDir(varDir);

  const files = fs.readdirSync(imagesDir);
  const svgFiles = files.filter(file => /\.svg$/i.test(file));

  console.log(`Found ${svgFiles.length} SVG files to process`);

  let processed = 0;
  let errors = 0;

  for (const file of svgFiles) {
    const base = getBaseName(file);
    const svgPath = path.join(imagesDir, file);
    const pngPath = path.join(varDir, base + '.png');
    const jpgPath = path.join(varDir, base + '.jpg');

    try {
      const svgBuffer = fs.readFileSync(svgPath);

      // Generate PNG
      const pngBuffer = svgToPng(svgBuffer, 256, 256);
      fs.writeFileSync(pngPath, pngBuffer);

      // Generate JPG
      const jpgBuffer = svgToJpg(svgBuffer);
      fs.writeFileSync(jpgPath, jpgBuffer);

      processed++;
      console.log(`✓ Generated variants for ${file}`);
    } catch (e) {
      errors++;
      console.error(`✗ Error generating variants for ${file}:`, e.message);
    }
  }

  console.log(`\nCompleted: ${processed} processed, ${errors} errors`);
}

// Main function
function main() {
  if (collectionName === 'all') {
    // Process all collections
    for (const col of collections) {
      generateVariants(col.name);
    }
  } else {
    // Process single collection
    generateVariants(collectionName);
  }
}

// Run the script
main();
