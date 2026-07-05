import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { resolve } from 'path'

// SPENDWISE_WEB=1 runs the renderer alone in a browser (localStorage-backed),
// useful for UI development without launching Electron.
const webOnly = process.env.SPENDWISE_WEB === '1'

export default defineConfig({
  plugins: [
    react(),
    !webOnly &&
      electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: resolve(__dirname, 'electron/preload.ts'),
        },
      }),
  ].filter(Boolean),
  // Electron loads over file:// (needs relative paths); a static web deploy
  // (e.g. GitHub Pages project site) sets BASE_PATH to its subpath.
  base: process.env.BASE_PATH || './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
