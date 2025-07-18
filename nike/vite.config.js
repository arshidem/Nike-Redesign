import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the root directory
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: env.VITE_APP_NAME || 'Nike Redesign',
          short_name: 'Nike',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#000000',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512', 
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './public')
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});