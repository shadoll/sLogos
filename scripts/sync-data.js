#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Use collections from src/collections.js
const { collections } = require('../src/collections.js');

// Accept collection as a CLI arg or env var
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : (process.env.COLLECTION || 'logos');

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

// Sync data file with filesystem
function syncDataFile(collectionName) {
  const collection = collections.find(c => c.name === collectionName);
  if (!collection) {
    console.error(`Collection "${collectionName}" not found`);
    return;
  }

  const imagesDir = path.join(__dirname, '..', 'public', collection.baseDir);
  const outputFile = path.join(__dirname, '..', 'public', collection.dataFile);

  if (!fs.existsSync(imagesDir)) {
    console.error(`Directory does not exist: ${imagesDir}`);
    return;
  }

  console.log(`Syncing data file for collection: ${collection.label}`);
  console.log(`Source: ${imagesDir}`);
  console.log(`Data file: ${outputFile}`);

  // Load existing data
  let existing = [];
  if (fs.existsSync(outputFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    } catch (e) {
      console.error('Could not parse existing data file:', e);
    }
  }

  // Get current files
  const files = fs.readdirSync(imagesDir);
  const logoFiles = files.filter(file =>
    /\.(svg|png|jpg|jpeg)$/i.test(file)
  );

  const logoFilesSet = new Set(logoFiles);

  // Update existing entries
  let updated = 0;
  let disabled = 0;
  let enabled = 0;

  for (const logo of existing) {
    // Fix: If logo.path contains a slash, strip to filename only
    if (logo.path.includes('/')) {
      logo.path = logo.path.split('/').pop();
      updated++;
    }

    // Check if file exists
    if (!logoFilesSet.has(logo.path)) {
      if (!logo.disable) {
        logo.disable = true;
        disabled++;
      }
    } else if (logo.disable) {
      logo.disable = false;
      enabled++;
    }
  }

  // Add new entries
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

  // Merge existing and new logos
  const merged = [...existing, ...newLogos];

  // Save updated data
  try {
    const data = JSON.stringify(merged, null, 2);
    fs.writeFileSync(outputFile, data);

    console.log(`\nSync completed:`);
    console.log(`- Total entries: ${merged.length}`);
    console.log(`- New entries: ${newLogos.length}`);
    console.log(`- Updated paths: ${updated}`);
    console.log(`- Disabled: ${disabled}`);
    console.log(`- Re-enabled: ${enabled}`);

  } catch (error) {
    console.error('Error writing data file:', error);
  }
}

// Main function
function main() {
  if (collectionName === 'all') {
    // Process all collections
    for (const col of collections) {
      syncDataFile(col.name);
    }
  } else {
    // Process single collection
    syncDataFile(collectionName);
  }
}

// Run the script
main();
