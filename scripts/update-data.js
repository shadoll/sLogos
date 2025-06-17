#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Configuration
const collections = [
  { name: 'logos', label: 'Logos',
    baseDir: 'logos',
    genDir: 'logos_gen',
    dataFile: 'data/logos.json'
  },
  { name: 'flags', label: 'Flags',
    baseDir: 'flags',
    genDir: 'flags_gen',
    dataFile: 'data/flags.json'
  }
];

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

    console.log(`Found ${logoFiles.length} logo files`);

    // Create a Set of all logo paths in the directory
    const logoPathsSet = new Set(logoFiles.map(file => `logos/${file}`));

    // Mark existing records as disabled if they are not found in the directory
    for (const logo of existing) {
      if (!logoPathsSet.has(logo.path)) {
        logo.disable = true;
      }
    }

    // Create a Set of existing paths to avoid duplication
    const existingPathsSet = new Set(existing.map(logo => logo.path));

    // Create new minimal logo objects for files that don't have records yet
    const newLogos = logoFiles
      .filter(file => !existingPathsSet.has(`logos/${file}`))
      .map(file => {
        const format = getFileExtension(file);
        const logoPath = `logos/${file}`;

        // Create minimal object for new logos - just the essential fields
        return {
          name: formatName(file),
          path: logoPath,
          format: format,
          disable: false,
          brand: formatName(file)
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Merge existing and new logos
    let merged = [...existing];

    // Add new logos in alphabetical order
    for (const newLogo of newLogos) {
      // Find the position to insert based on name
      let insertIdx = merged.findIndex(l => newLogo.name.localeCompare(l.name) < 0);
      if (insertIdx === -1) {
        merged.push(newLogo);
      } else {
        merged.splice(insertIdx, 0, newLogo);
      }
    }

    // Force-upgrade SVGs with older colorConfig format to the new targets+sets format
    // but ONLY if they have colors and either a target or selector defined
    // Don't add empty objects to logos that don't need them
    for (const logoObj of merged) {
      // Only proceed if this is an SVG with existing color info that needs upgrading
      if (logoObj.format?.toLowerCase() === 'svg' &&
          logoObj.colors &&
          Object.keys(logoObj.colors).length > 0 &&
          logoObj.colorConfig &&
          !logoObj.sets) {

        // Initialize targets only if needed
        if (!logoObj.targets) {
          logoObj.targets = {};

          if (logoObj.colorConfig.selector) {
            // Split multiple selectors (e.g., "#text, #logo_int")
            const selectors = logoObj.colorConfig.selector.split(',').map(s => s.trim());

            // Create a target for each selector
            selectors.forEach((selector, index) => {
              logoObj.targets[`selector_${index + 1}`] = selector;
            });
          } else if (logoObj.colorConfig.target) {
            logoObj.targets.main = logoObj.colorConfig.target;
          }
        }

        // Initialize sets only if we have both colors and targets
        if (logoObj.targets && Object.keys(logoObj.targets).length > 0) {
          logoObj.sets = {};
          let setIndex = 1;

          // Create a set for each color
          for (const [colorName, colorValue] of Object.entries(logoObj.colors)) {
            const setName = `set_${setIndex}`;
            logoObj.sets[setName] = {};

            // Apply this color to all targets
            Object.keys(logoObj.targets).forEach(targetName => {
              logoObj.sets[setName][targetName] = colorName;
            });

            setIndex++;
          }
        }
      }
    }

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
      const logos = (function scanLogosForCol() {
        let existing = [];
        if (fs.existsSync(outputFile)) {
          try {
            existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          } catch (e) {
            console.error('Could not parse existing', col.dataFile + ':', e);
          }
        }
        try {
          if (!fs.existsSync(logosDir)) {
            console.error(`Directory does not exist: ${logosDir}`);
            return [];
          }
          // Filter for image files (svg, png, jpg, jpeg)
          const logoFiles = files.filter(file =>
            /\.(svg|png|jpg|jpeg)$/i.test(file)
          );
          // Create a Set of all logo paths in the directory
          const logoPathsSet = new Set(logoFiles.map(file => `${col.baseDir}/${file}`));
          // Mark existing records as disabled if they are not found in the directory
          for (const logo of existing) {
            if (!logoPathsSet.has(logo.path)) {
              logo.disable = true;
            }
          }
          // Create a Set of existing paths to avoid duplication
          const existingPathsSet = new Set(existing.map(logo => logo.path));
          // Create new minimal logo objects for files that don't have records yet
          const newLogos = logoFiles
            .filter(file => !existingPathsSet.has(`${col.baseDir}/${file}`))
            .map(file => {
              const format = getFileExtension(file);
              const logoPath = `${col.baseDir}/${file}`;
              return {
                name: formatName(file),
                path: logoPath,
                format: format,
                disable: false,
                brand: formatName(file)
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
          let merged = [...existing];
          for (const newLogo of newLogos) {
            let insertIdx = merged.findIndex(l => newLogo.name.localeCompare(l.name) < 0);
            if (insertIdx === -1) {
              merged.push(newLogo);
            } else {
              merged.splice(insertIdx, 0, newLogo);
            }
          }
          for (const logoObj of merged) {
            if (logoObj.format?.toLowerCase() === 'svg' &&
                logoObj.colors &&
                Object.keys(logoObj.colors).length > 0 &&
                logoObj.colorConfig &&
                !logoObj.sets) {
              if (!logoObj.targets) {
                logoObj.targets = {};
                if (logoObj.colorConfig.selector) {
                  const selectors = logoObj.colorConfig.selector.split(',').map(s => s.trim());
                  selectors.forEach((selector, index) => {
                    logoObj.targets[`selector_${index + 1}`] = selector;
                  });
                } else if (logoObj.colorConfig.target) {
                  logoObj.targets.main = logoObj.colorConfig.target;
                }
              }
              if (logoObj.targets && Object.keys(logoObj.targets).length > 0) {
                logoObj.sets = {};
                let setIndex = 1;
                for (const [colorName, colorValue] of Object.entries(logoObj.colors)) {
                  const setName = `set_${setIndex}`;
                  logoObj.sets[setName] = {};
                  Object.keys(logoObj.targets).forEach(targetName => {
                    logoObj.sets[setName][targetName] = colorName;
                  });
                  setIndex++;
                }
              }
            }
          }
          return merged;
        } catch (error) {
          console.error('Error scanning directory:', logosDir, error);
          return [];
        }
      })();
      // Pregenerate PNG/JPG for all SVGs
      pregenerateImages(files, logosDir, genDir);
      // Save to JSON
      try {
        const data = JSON.stringify(logos, null, 2);
        fs.writeFileSync(outputFile, data);
        console.log(`Successfully wrote ${logos.length} items to ${outputFile}`);
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
