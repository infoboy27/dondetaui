import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // e2e/ holds Playwright specs (different test() API, real browser) --
    // Vitest's default include glob would otherwise try to run them too.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
