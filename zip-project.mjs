import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const zip = new AdmZip();

// function to add dir recursively, excluding ignore patterns
function addDirectory(dirPath, zipPath, ignores) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.join(zipPath, file);
    
    let shouldIgnore = false;
    for (const ignore of ignores) {
      if (fullPath.includes(ignore)) {
        shouldIgnore = true;
        break;
      }
    }
    
    if (shouldIgnore) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirectory(fullPath, relativePath, ignores);
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

addDirectory(__dirname, '', ['node_modules', 'dist', '.git', '.next', 'public/jaknooma-project.zip']);

zip.writeZip(path.join(publicDir, 'jaknooma-project.zip'));
console.log('Zip file created successfully!');
