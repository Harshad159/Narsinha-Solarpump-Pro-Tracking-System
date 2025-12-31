import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icon.svg', 'icon-192.png', 'icon-512.png'],
          manifest: {
            name: 'Narsinha SolarPump Tracking System',
            short_name: 'SolarPump Tracker',
            description: 'Professional solar pump tracking and management system with real-time monitoring and reporting',
            start_url: '/',
            scope: '/',
            theme_color: '#0f172a',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait-primary',
            icons: [
              {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            screenshots: [
              {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                form_factor: 'narrow'
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'wide'
              }
            ],
            categories: ['business', 'productivity'],
            shortcuts: [
              {
                name: 'Dashboard',
                short_name: 'Dashboard',
                description: 'View dashboard and analytics',
                url: '/?page=dashboard',
                icons: [
                  {
                    src: '/icon-192.png',
                    sizes: '192x192'
                  }
                ]
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^http:\/\/localhost:4000\/.*$/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  networkTimeoutSeconds: 10,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 3600
                  }
                }
              },
              {
                urlPattern: /^https:\/\/.*$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'cdn-cache',
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 86400
                  }
                }
              }
            ],
            cleanupOutdatedCaches: true
          },
          devOptions: {
            enabled: false,
            type: 'module'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
