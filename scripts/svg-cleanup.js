#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Use collections from src/collections.js
const { collections } = require('../src/collections.js');

// Accept collection as a CLI arg or env var
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : (process.env.COLLECTION || 'logos');

// Fix single-letter ID conflicts in SVG content
function fixSvgIds(svgContent, filename) {
  let content = svgContent;
  let updated = false;
  let count = 0;

  // Find all single-letter IDs (both lowercase and uppercase)
  const idMatches = content.match(/\bid\s*=\s*["']([a-zA-Z])["']/g);

  if (!idMatches) {
    return { content, updated, count };
  }

  // Create a map of old ID to new ID
  const idMap = new Map();

  for (const match of idMatches) {
    const idMatch = match.match(/\bid\s*=\s*["']([a-zA-Z])["']/);
    if (idMatch) {
      const oldId = idMatch[1];
      const newId = `${filename}_${oldId}`;

      if (!idMap.has(oldId)) {
        idMap.set(oldId, newId);
      }
    }
  }

  // Replace all single-letter IDs with prefixed versions
  for (const [oldId, newId] of idMap) {
    // Replace id attribute declarations
    const idRegex = new RegExp(`\\bid\\s*=\\s*["']${oldId}["']`, 'g');
    content = content.replace(idRegex, `id="${newId}"`);

    // Replace references to the ID in url(), href, and other attributes
    const urlRegex = new RegExp(`url\\(#${oldId}\\)`, 'g');
    content = content.replace(urlRegex, `url(#${newId})`);

    const hrefRegex = new RegExp(`href\\s*=\\s*["']#${oldId}["']`, 'g');
    content = content.replace(hrefRegex, `href="#${newId}"`);

    const xlinkHrefRegex = new RegExp(`xlink:href\\s*=\\s*["']#${oldId}["']`, 'g');
    content = content.replace(xlinkHrefRegex, `xlink:href="#${newId}"`);

    count++;
    updated = true;
  }

  return { content, updated, count };
}

// SVG validation and fixing function
function validateAndFixSvg(svgPath) {
  try {
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    let modified = false;

    // Clean up SVG content
    const originalContent = svgContent;

    // Remove XML declaration
    svgContent = svgContent.replace(/<\?xml[^>]*\?>\s*/gi, '');

    // Remove DOCTYPE declaration
    svgContent = svgContent.replace(/<!DOCTYPE[^>]*>\s*/gi, '');

    // Remove comments
    svgContent = svgContent.replace(/<!--[\s\S]*?-->/g, '');

    // Remove leading/trailing whitespace and ensure it starts with <svg
    svgContent = svgContent.trim();

    if (originalContent !== svgContent) {
      modified = true;
      console.log(`${path.basename(svgPath)}: Cleaned up SVG (removed XML/DOCTYPE/comments)`);
    }

    // Parse SVG tag attributes
    const svgTagMatch = svgContent.match(/<svg[^>]*>/i);
    if (!svgTagMatch) {
      console.warn(`No SVG tag found in ${path.basename(svgPath)}`);
      return;
    }

    const svgTag = svgTagMatch[0];
    const viewBoxMatch = svgTag.match(/viewBox\s*=\s*["']([^"']+)["']/i);
    const widthMatch = svgTag.match(/width\s*=\s*["']([^"']+)["']/i);
    const heightMatch = svgTag.match(/height\s*=\s*["']([^"']+)["']/i);

    const hasViewBox = !!viewBoxMatch;
    const hasWidth = !!widthMatch;
    const hasHeight = !!heightMatch;
    const width = hasWidth ? widthMatch[1] : null;
    const height = hasHeight ? heightMatch[1] : null;

    if (!hasViewBox && !hasWidth && !hasHeight) {
      console.warn(`${path.basename(svgPath)}: No viewBox, width, or height found - cannot determine dimensions`);
      return;
    }

    let newSvgTag = svgTag;

    if (!hasViewBox && hasWidth && hasHeight) {
      // Add viewBox using width and height
      const widthValue = parseFloat(width);
      const heightValue = parseFloat(height);
      if (!isNaN(widthValue) && !isNaN(heightValue)) {
        const viewBoxValue = `0 0 ${widthValue} ${heightValue}`;
        newSvgTag = newSvgTag.replace(/(<svg[^>]*?)>/i, `$1 viewBox="${viewBoxValue}">`);
        modified = true;
        console.log(`${path.basename(svgPath)}: Added viewBox="${viewBoxValue}"`);
      }
    }

    // Update width and height to 100% if they exist
    if (hasWidth && width !== '100%') {
      newSvgTag = newSvgTag.replace(/width\s*=\s*["'][^"']+["']/i, 'width="100%"');
      modified = true;
      console.log(`${path.basename(svgPath)}: Updated width to 100%`);
    }

    if (hasHeight && height !== '100%') {
      newSvgTag = newSvgTag.replace(/height\s*=\s*["'][^"']+["']/i, 'height="100%"');
      modified = true;
      console.log(`${path.basename(svgPath)}: Updated height to 100%`);
    }

    // Fix ID conflicts - rename single-letter IDs
    const idUpdates = fixSvgIds(svgContent, path.basename(svgPath, '.svg'));
    if (idUpdates.updated) {
      svgContent = idUpdates.content;
      modified = true;
      console.log(`${path.basename(svgPath)}: Updated ${idUpdates.count} single-letter IDs`);
    }

    if (modified) {
      if (newSvgTag !== svgTag) {
        svgContent = svgContent.replace(svgTag, newSvgTag);
      }
      fs.writeFileSync(svgPath, svgContent, 'utf8');
      console.log(`${path.basename(svgPath)}: SVG file updated`);
    }

  } catch (error) {
    console.error(`Error processing SVG ${path.basename(svgPath)}:`, error.message);
  }
}

// Process SVG files for cleanup and validation
function processSvgFiles(collectionName) {
  const collection = collections.find(c => c.name === collectionName);
  if (!collection) {
    console.error(`Collection "${collectionName}" not found`);
    return;
  }

  const imagesDir = path.join(__dirname, '..', 'public', collection.baseDir);

  if (!fs.existsSync(imagesDir)) {
    console.error(`Directory does not exist: ${imagesDir}`);
    return;
  }

  console.log(`Processing SVG files in collection: ${collection.label}`);

  const files = fs.readdirSync(imagesDir);
  const svgFiles = files.filter(file => /\.svg$/i.test(file));

  console.log(`Found ${svgFiles.length} SVG files`);

  for (const file of svgFiles) {
    const svgPath = path.join(imagesDir, file);
    validateAndFixSvg(svgPath);
  }

  console.log(`Completed processing SVG files for ${collection.label}`);
}

// Main function
function main() {
  if (collectionName === 'all') {
    // Process all collections
    for (const col of collections) {
      processSvgFiles(col.name);
    }
  } else {
    // Process single collection
    processSvgFiles(collectionName);
  }
}

// Run the script
main();
