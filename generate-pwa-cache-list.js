// Node.js script to generate a list of all files in public, logos, and logos_gen for PWA caching
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const logosDir = path.join(__dirname, 'logos');
const logosGenDir = path.join(__dirname, 'logos_gen');

function walkDir(dir, baseUrl = '') {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const relPath = path.join(baseUrl, file).replace(/\\/g, '/');
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(walkDir(filePath, relPath));
    } else {
      results.push('/' + relPath);
    }
  });
  return results;
}

const publicFiles = walkDir(publicDir, '').filter(f => !f.endsWith('sw.js'));
const logosFiles = walkDir(logosDir, 'logos');
const logosGenFiles = walkDir(logosGenDir, 'logos_gen');

const allFiles = Array.from(new Set([...publicFiles, ...logosFiles, ...logosGenFiles]));

fs.writeFileSync(
  path.join(publicDir, 'pwa-files-to-cache.json'),
  JSON.stringify(allFiles, null, 2)
);

console.log('PWA files-to-cache list generated with', allFiles.length, 'files.');
