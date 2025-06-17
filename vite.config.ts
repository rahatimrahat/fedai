
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react(), splitVendorChunkPlugin()],
      // define: {
      //   'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Removed for security
      // },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});