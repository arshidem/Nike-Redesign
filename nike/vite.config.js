import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // optional: auto register service worker
      strategies: 'generateSW', // ✅ use auto-generated service worker
      manifest: {
        name: 'Nike App',
        short_name: 'Nike',
        start_url: '/',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: '/assets/logo/nikeLogoRounded.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/logo/nikeLogoRounded.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
