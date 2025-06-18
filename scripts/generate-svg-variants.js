#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { collections } = require('../src/collections.js');


// Accept collection as a CLI arg or env var
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : (process.env.COLLECTION || 'logos');
const collection = collections.find(c => c.name === collectionName) || collections[0];

const LOGOS_DIR = path.join(__dirname, '..', 'public', collection.baseDir);
const LOGOS_GEN_DIR = path.join(__dirname, '..', 'public', collection.varDir);

// Try multiple possible locations for logos.json
const POSSIBLE_LOGOS_JSON_PATHS = [
  path.join(process.cwd(), 'public', collection.dataFile),
  path.join(__dirname, '..', 'public', collection.dataFile),
  path.join(process.cwd(), 'public', collection.baseDir + '.json'),
  path.join(__dirname, '..', 'public', collection.baseDir + '.json'),
  path.join(__dirname, '..', 'src', 'data', collection.baseDir + '.json')
];

function findLogosJsonPath() {
  for (const possiblePath of POSSIBLE_LOGOS_JSON_PATHS) {
    if (fs.existsSync(possiblePath)) {
      console.log(`📁 Found ${collection.dataFile} at: ${possiblePath}`);
      return possiblePath;
    }
  }
  console.error(`❌ Could not find ${collection.dataFile} in any of these locations:`);
  POSSIBLE_LOGOS_JSON_PATHS.forEach(p => console.error(`   ${p}`));
  return null;
}

/**
 * Load logos data from logos.json
 */
function loadLogosData() {
  const LOGOS_JSON_PATH = findLogosJsonPath();

  if (!LOGOS_JSON_PATH) {
    console.error('❌ logos.json file not found');
    process.exit(1);
  }

  try {
    const data = fs.readFileSync(LOGOS_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading logos.json:', error.message);
    process.exit(1);
  }
}

/**
 * Apply color set to SVG content
 */
function applySvgColors(svgContent, colorSet, targets) {
  let modifiedSvg = svgContent;

  if (!targets || !colorSet) {
    return modifiedSvg;
  }

  // Apply colors based on targets mapping
  Object.entries(targets).forEach(([targetKey, selector]) => {
    if (colorSet[targetKey]) {
      const color = colorSet[targetKey];

      // Handle different types of selectors
      if (selector.startsWith('#')) {
        // ID selector - replace fill/stroke for specific element
        const elementId = selector.substring(1);

        // First, remove any existing fill attributes for this element
        // Updated regex to preserve the closing tag structure
        const removeExistingFillRegex = new RegExp(`(id="${elementId}"[^>]*?)\\s*fill="[^"]*"([^>]*>)`, 'g');
        modifiedSvg = modifiedSvg.replace(removeExistingFillRegex, '$1$2');

        // Then add the new fill attribute before the closing >
        const addFillRegex = new RegExp(`(id="${elementId}"[^>]*?)(\s*\/?>)`, 'g');
        modifiedSvg = modifiedSvg.replace(addFillRegex, `$1 fill="${color}"$2`);
      } else {
        // Default: replace all fill attributes (fallback)
        modifiedSvg = modifiedSvg.replace(
          /fill="[^"]*"/g,
          `fill="${color}"`
        );
      }
    }
  });

  return modifiedSvg;
}

/**
 * Generate SVG variants with color sets
 */
function generateSvgVariants() {
  console.log(`🎨 Generating SVG variants with color sets for collection: ${collection.name}...`);

  // Ensure the logos_gen directory exists
  if (!fs.existsSync(LOGOS_GEN_DIR)) {
    fs.mkdirSync(LOGOS_GEN_DIR, { recursive: true });
    console.log(`📁 Created directory: ${LOGOS_GEN_DIR}`);
  }

  const logos = loadLogosData();
  let generatedCount = 0;
  let skippedCount = 0;

  if (!Array.isArray(logos)) {
    console.error('❌ Expected data file to contain an array, got:', typeof logos);
    process.exit(1);
  }  console.log(`📊 Processing ${logos.length} logos...`);

  logos.forEach((logo, index) => {
    // Check if logo has required properties
    if (!logo || typeof logo !== 'object') {
      console.warn(`⚠️  Logo at index ${index} is not a valid object`);
      skippedCount++;
      return;
    }// Handle different possible filename properties
    const pathOrFilename = logo.path || logo.filename || logo.file || logo.name;

    if (!pathOrFilename) {
      console.warn(`⚠️  Logo at index ${index} has no path/filename property`);
      skippedCount++;
      return;
    }

    // Extract just the filename from path if needed
    const actualFilename = pathOrFilename.includes('/') ? path.basename(pathOrFilename) : pathOrFilename;

    // Skip if no sets or not an SVG
    if (!logo.sets || !actualFilename.endsWith('.svg')) {
      skippedCount++;
      return;
    }

    const basePath = path.join(LOGOS_DIR, actualFilename);
    const baseNameWithoutExt = path.basename(actualFilename, '.svg');    // Check if base SVG exists
    if (!fs.existsSync(basePath)) {
      console.warn(`⚠️  Base SVG not found: ${actualFilename}`);
      skippedCount++;
      return;
    }

    // Read the base SVG content
    const baseSvgContent = fs.readFileSync(basePath, 'utf8');

    // Generate variants for each color set
    // Handle sets as object (not array)
    Object.entries(logo.sets).forEach(([setName, setConfig]) => {
      if (!setName || !setConfig) {
        console.warn(`⚠️  Invalid set in ${actualFilename}: missing name or config`);
        return;
      }

      // Convert set config to colors object
      const colors = {};
      if (logo.colors && logo.targets) {
        Object.entries(setConfig).forEach(([targetKey, colorKey]) => {
          if (logo.colors[colorKey]) {
            colors[targetKey] = logo.colors[colorKey];
          }
        });
      }

      if (Object.keys(colors).length === 0) {
        console.warn(`⚠️  No valid colors found for set ${setName} in ${actualFilename}`);
        return;
      }      const variantFilename = `${baseNameWithoutExt}__${setName}.svg`;
      const variantPath = path.join(LOGOS_GEN_DIR, variantFilename);

      // Apply colors to SVG
      const modifiedSvg = applySvgColors(baseSvgContent, colors, logo.targets);

      // Write the variant SVG
      fs.writeFileSync(variantPath, modifiedSvg, 'utf8');

      console.log(`✅ Generated: ${variantFilename}`);
      generatedCount++;
    });
  });

  console.log(`\n🎨 SVG variant generation complete!`);
  console.log(`   Generated: ${generatedCount} variants`);
  console.log(`   Skipped: ${skippedCount} logos (no sets or not SVG)`);
}

// Run the script
if (require.main === module) {
  generateSvgVariants();
}

module.exports = { generateSvgVariants };
