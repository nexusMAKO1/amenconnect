//vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import fs from 'fs';
import path from 'path';

const keyPath = path.resolve(__dirname, 'public', 'server.key');
const certPath = path.resolve(__dirname, 'public', 'server.crt');
const httpsConfig = (fs.existsSync(keyPath) && fs.existsSync(certPath)) ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
} : undefined;

export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],

  server: {
    ...(httpsConfig ? { https: httpsConfig } : {}),
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/serial": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
