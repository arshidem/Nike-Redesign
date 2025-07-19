import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Nike App",
        short_name: "Nike",
        description: "Nike Store PWA",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/assets/logo/nikeLogoRounded.png", // Path from public folder
            sizes: "192x192", // Standard PWA size
            type: "image/png",
          },
          {
            src: "/assets/logo/nikeLogoRounded.png", // Same file or different size
            sizes: "512x512", // Splash screen size
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/api/, // keep this for prod
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
            // handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000,
              },
            },
          },
        ],
        // 👇 this will ignore localhost and internal dev APIs
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
