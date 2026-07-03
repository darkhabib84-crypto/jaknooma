const fs = require('fs');
const archiverLib = require('archiver');
const archiver = archiverLib.default || archiverLib;
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const output = fs.createWriteStream(path.join(publicDir, 'jaknooma-project.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// append files from a sub-directory and naming it `new-subdir` within the archive
// archive.directory('source_dir/', 'new-subdir');

archive.glob('**/*', {
  cwd: __dirname,
  ignore: ['node_modules/**', 'dist/**', '.git/**', '.next/**', 'public/jaknooma-project.zip']
});

archive.finalize();
