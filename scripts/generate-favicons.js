#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const jimp = require('jimp');

// Paths
const srcSvgPath = path.join(__dirname, '../public/favicon.svg');
const pngOutputPath = path.join(__dirname, '../public/apple-touch-icon.png');
const icoOutputPath = path.join(__dirname, '../public/favicon.ico');
const faviconPngPath = path.join(__dirname, '../public/favicon.png');
const icon192Path = path.join(__dirname, '../public/icon-192.png');
const icon512Path = path.join(__dirname, '../public/icon-512.png');

// Ensure the favicon.svg file exists
if (!fs.existsSync(srcSvgPath)) {
  console.error('Error: favicon.svg not found in public directory.');
  process.exit(1);
}

console.log('Generating favicons from SVG...');

async function generateFavicons() {
  try {
    // Read the SVG file
    const svgData = fs.readFileSync(srcSvgPath, 'utf8');

    // Render SVG to PNG using Resvg - maintain transparency
    const opts = {
      // No background specified to maintain transparency
      fitTo: {
        mode: 'width',
        value: 1024
      }
    };
    const resvg = new Resvg(svgData, opts);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Save a temporary high-resolution PNG
    const tempPngPath = path.join(__dirname, '../public/temp-favicon.png');
    fs.writeFileSync(tempPngPath, pngBuffer);

    // Generate apple-touch-icon.png (180x180) using jimp
    const appleIconImg = await jimp.read(tempPngPath);
    await appleIconImg.resize(180, 180).writeAsync(pngOutputPath);
    console.log(`Created ${pngOutputPath}`);

    // Create favicon.png (32x32) for browsers that support PNG favicons
    const faviconPng = await jimp.read(tempPngPath);
    await faviconPng.resize(32, 32).writeAsync(faviconPngPath);
    console.log(`Created ${faviconPngPath}`);

    // For favicon.ico, we'll just use the 32x32 PNG since we don't have ico-encoder
    // Most modern browsers will use the PNG or SVG anyway
    fs.copyFileSync(faviconPngPath, icoOutputPath);
    console.log(`Created ${icoOutputPath} (Note: This is actually a PNG file renamed to .ico)`);

    // Generate icon-192.png for PWA
    const icon192 = await jimp.read(tempPngPath);
    await icon192.resize(192, 192).writeAsync(icon192Path);
    console.log(`Created ${icon192Path}`);

    // Generate icon-512.png for PWA
    const icon512 = await jimp.read(tempPngPath);
    await icon512.resize(512, 512).writeAsync(icon512Path);
    console.log(`Created ${icon512Path}`);

    // Clean up temporary file
    fs.unlinkSync(tempPngPath);

    console.log('Favicon and PWA icon generation completed successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
