const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const zip = new AdmZip();

// Folders to include
const folders = ['src', 'public'];
folders.forEach(folder => {
  if (fs.existsSync(folder)) {
    // addLocalFolder (localPath, zipPath, filter)
    zip.addLocalFolder(folder, folder);
  }
});

// Files to include from root
const files = [
  'package.json',
  'package-lock.json',
  'index.html',
  'tsconfig.json',
  'vite.config.ts',
  'firebase.json',
  'firestore.rules',
  'firebase-applet-config.json',
  'firebase-blueprint.json',
  '.env.example',
  '.firebaserc',
  '.gitignore',
  'AGENTS.md',
  'scraper.cjs'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    zip.addLocalFile(file);
  }
});

// Remove old zip files if they somehow got in the zip
const entries = zip.getEntries();
entries.forEach(entry => {
  if (entry.entryName.endsWith('.zip')) {
    zip.deleteFile(entry);
  }
});

zip.writeZip('public/jaknooma-source.zip');
console.log('Zip file created successfully at public/jaknooma-source.zip');
