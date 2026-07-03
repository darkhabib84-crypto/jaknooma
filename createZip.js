import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

function createZip() {
  const zip = new AdmZip();
  
  // Folders to include
  const folders = ['src', 'public'];
  folders.forEach(folder => {
    if (fs.existsSync(folder)) {
      zip.addLocalFolder(folder, folder);
    }
  });

  // Files to include
  const files = [
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.node.json',
    'tsconfig.app.json',
    'firebase-applet-config.json',
    'firestore.rules',
    'firebase-blueprint.json',
    '.env.example'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      zip.addLocalFile(file);
    }
  });

  // Ensure public directory exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }

  // Write the zip file
  const outputPath = path.join('public', 'jaknooma.zip');
  zip.writeZip(outputPath);
  console.log(`Zip file created successfully at ${outputPath}`);
}

createZip();
