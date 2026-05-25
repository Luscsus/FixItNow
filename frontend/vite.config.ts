import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Frontend Starter',
        short_name: 'Frontend',
        description: 'Vite + React + Tailwind starter with 2FA workflows',
        theme_color: '#0f766e',
        background_color: '#f7f2e9',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // sockjs-client expects Node's `global` to exist; alias it to the browser's window
  define: {
    global: 'window',
  },
})
