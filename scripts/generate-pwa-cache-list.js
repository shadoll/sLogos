// Moved from project root to scripts directory for consistency
// Node.js script to generate a list of all files in public and images for PWA caching
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public/images');
const logosDir = path.join(projectRoot, 'logos');
const logosGenDir = path.join(projectRoot, 'logos_variants');

// List of files to ignore
const IGNORED_FILES = ['.DS_Store', 'CNAME', 'pwa-files-to-cache.json', '.gitignore'];

function walkDir(dir, baseUrl = '') {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    if (IGNORED_FILES.includes(file)) return; // Ignore listed files
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

function safeWalkDir(dir, baseUrl = '') {
  if (!fs.existsSync(dir)) return [];
  return walkDir(dir, baseUrl);
}

const publicFiles = walkDir(publicDir, '').filter(f => !f.endsWith('sw.js'));
const logosFiles = safeWalkDir(logosDir, 'logos');
const logosGenFiles = safeWalkDir(logosGenDir, 'logos_variants');

const allFiles = Array.from(new Set([...publicFiles, ...logosFiles, ...logosGenFiles]));

fs.writeFileSync(
  path.join(publicDir, 'pwa-files-to-cache.json'),
  JSON.stringify(allFiles, null, 2)
);

console.log('PWA files-to-cache list generated with', allFiles.length, 'files.');
