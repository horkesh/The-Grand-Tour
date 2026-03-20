import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || ''),
        'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || ''),
        'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ''),
        'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || ''),
        'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || ''),
        'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''),
        'process.env.MAPBOX_TOKEN': JSON.stringify(env.MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || ''),
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
              if (id.includes('node_modules/protobufjs') || id.includes('node_modules/@protobufjs') || id.includes('node_modules/long')) return 'firebase';
              if (id.includes('node_modules/framer-motion') || id.includes('node_modules/@motionone')) return 'framer';
              if (id.includes('node_modules/@google') || id.includes('node_modules/google-') || id.includes('node_modules/gcp-') || id.includes('node_modules/gaxios')) return 'gemini';
              if (id.includes('node_modules/react-dom')) return 'react-dom';
              if (id.includes('node_modules/react') || id.includes('node_modules/react-router')) return 'react';
              if (id.includes('node_modules/mapbox-gl')) return 'mapbox';
              if (id.includes('node_modules/html2canvas')) return 'html2canvas';
              if (id.includes('node_modules/')) return 'vendor';
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
