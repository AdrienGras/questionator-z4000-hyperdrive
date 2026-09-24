import { fileURLToPath, URL } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/questionator-z4000-hyperdrive/',
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: String.raw`\.test\.tsx?$`,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Sans cela, `import css from '../index.css?raw'` renvoie '' sous Vitest (test des THEME_TOKENS).
    css: { include: [/index\.css/] },
  },
})
