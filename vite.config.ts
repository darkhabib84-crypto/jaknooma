import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';
import * as archiverLib from 'archiver';
const archiver = archiverLib.default || archiverLib;

const zipPlugin = () => ({
  name: 'zip-plugin',
  configureServer(server: any) {
    server.middlewares.use('/download-zip', (req: any, res: any) => {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=jaknooma-project.zip');
      
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      archive.on('error', function(err: any) {
        res.statusCode = 500;
        res.end(err.message);
      });
      
      archive.pipe(res);
      archive.glob('**/*', {
        cwd: process.cwd(),
        ignore: ['node_modules/**', 'dist/**', '.git/**', '.next/**']
      });
      archive.finalize();
    });
  }
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/jaknooma/', // <-- هذا السطر هو الذي سيوجه مسارات الصور والمتاجر للمكان الصحيح على GitHub
    plugins: [react(), tailwindcss(), zipPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
