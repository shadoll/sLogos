#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Use collections from src/collections.js
const { collections } = require('../src/collections.js');

// Accept collection as a CLI arg or env var
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : (process.env.COLLECTION || 'all');

// Execute a script with proper error handling
function runScript(scriptName, collection) {
  try {
    const scriptPath = path.join(__dirname, scriptName);
    const command = `node "${scriptPath}" --collection=${collection}`;
    
    console.log(`\n=== Running ${scriptName} for ${collection} ===`);
    execSync(command, { stdio: 'inherit' });
    console.log(`=== Completed ${scriptName} ===`);
    
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error.message);
    process.exit(1);
  }
}

// Main batch processing function
function main() {
  console.log('🚀 Starting data update process...');
  
  if (collectionName === 'all') {
    console.log('Processing all collections');
  } else {
    const collection = collections.find(c => c.name === collectionName);
    if (!collection) {
      console.error(`Collection "${collectionName}" not found`);
      process.exit(1);
    }
    console.log(`Processing collection: ${collection.label}`);
  }

  // Step 1: Clean and validate SVG files
  console.log('\n📋 Step 1: SVG Cleanup and Validation');
  runScript('svg-cleanup.js', collectionName);

  // Step 2: Generate PNG/JPG variants
  console.log('\n🖼️  Step 2: Generate Image Variants');
  runScript('generate-variants.js', collectionName);

  // Step 3: Sync data files with filesystem
  console.log('\n📄 Step 3: Sync Data Files');
  runScript('sync-data.js', collectionName);

  // Step 4: Generate PWA cache list
  console.log('\n💾 Step 4: Generate PWA Cache List');
  runScript('generate-pwa-cache-list.js', 'all');

  console.log('\n✅ All tasks completed successfully!');
}

// Run the batch process
main();
