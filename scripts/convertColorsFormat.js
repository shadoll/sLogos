#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to logos.json
const logosJsonPath = path.join(__dirname, '../public/data/logos.json');

// Read the current logos.json file
console.log('Reading logos.json...');
const logosData = JSON.parse(fs.readFileSync(logosJsonPath, 'utf8'));

// Convert the colors format and create targets & sets
console.log('Converting logos format...');
let convertedColorsCount = 0;
let convertedConfigCount = 0;

for (const logo of logosData) {
  // 1. Convert colors array to object if needed
  if (logo.colors && Array.isArray(logo.colors)) {
    // Convert array format to object format
    const newColors = {};
    for (const colorObj of logo.colors) {
      // Convert label to lowercase and replace spaces with underscores
      const key = colorObj.label.toLowerCase().replace(/\s+/g, '_');
      newColors[key] = colorObj.value;
    }
    logo.colors = newColors;
    convertedColorsCount++;
  }

  // 2. Convert colorConfig to targets and sets
  if (logo.colorConfig && !logo.targets) {
    // Create targets object
    logo.targets = {};

    // Handle selector or target from colorConfig
    if (logo.colorConfig.selector) {
      // Split multiple selectors (e.g., "#text, #logo_int")
      const selectors = logo.colorConfig.selector.split(',').map(s => s.trim());

      // Create a target for each selector
      selectors.forEach((selector, index) => {
        logo.targets[`selector_${index + 1}`] = selector;
      });

      // Create sets for each color
      if (logo.colors && Object.keys(logo.colors).length > 0) {
        logo.sets = {};
        let setIndex = 1;

        // Create a set for each color
        for (const [colorName, colorValue] of Object.entries(logo.colors)) {
          const setName = `set_${setIndex}`;
          logo.sets[setName] = {};

          // Apply this color to all targets in this set
          Object.keys(logo.targets).forEach(targetName => {
            logo.sets[setName][targetName] = colorName;
          });

          setIndex++;
        }
      }
    } else if (logo.colorConfig.target) {
      logo.targets.main = logo.colorConfig.target;

      // Create sets for each color
      if (logo.colors && Object.keys(logo.colors).length > 0) {
        logo.sets = {};
        let setIndex = 1;

        // Create a set for each color
        for (const [colorName, colorValue] of Object.entries(logo.colors)) {
          const setName = `set_${setIndex}`;
          logo.sets[setName] = {
            main: colorName
          };
          setIndex++;
        }
      }
    }

    convertedConfigCount++;

    // Keep the original colorConfig for backward compatibility
  }
}

// Write the updated data back to logos.json
console.log('Writing updated logos.json...');
fs.writeFileSync(logosJsonPath, JSON.stringify(logosData, null, 2));
console.log(`Conversion complete! Updated colors for ${convertedColorsCount} logos and created targets/sets for ${convertedConfigCount} logos.`);
