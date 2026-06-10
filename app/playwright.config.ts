import { defineConfig, devices } from '@playwright/test'

// E2E só para o que o jsdom NÃO vê: contraste renderizado (axe real) e screenshots da vitrine.
// Local: usa o Edge do sistema (channel) — zero download. CI: chromium instalado pela action.
const PORT = 4173
const channel = process.env.CI ? undefined : 'msedge'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    channel,
  },
  // Serve o build de produção (vite preview); o CI faz `vite build` antes.
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
