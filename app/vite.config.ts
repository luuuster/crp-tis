import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// Rotas do hub de DOCUMENTAÇÃO servidas pela entrada mapa.html (main-mapa.tsx roteia por pathname).
// No dev elas têm porta própria (:5174, vite.mapa.config.ts). No PREVIEW (vite preview — é o server
// do e2e) não há esse middleware: sem o rewrite, /componentes cai no fallback (index.html = app do
// recrutador) e a vitrine fica INALCANÇÁVEL pros specs. `configureServer` não roda no preview —
// precisa ser `configurePreviewServer`. ("/" fica com o recrutador; o dev :5174 é quem serve o hub na raiz.)
const ROTAS_DOCS = new Set(['/mapa', '/userflow', '/componentes'])
function docsNoPreview(): PluginOption {
  return {
    name: 'docs-no-preview',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && ROTAS_DOCS.has(req.url.split('?')[0].toLowerCase())) req.url = '/mapa.html'
        next()
      })
    },
  }
}

// O app consome o pacote @crp/design-tokens (linkado via file:..). O dist fica na RAIZ do
// repo (fora da raiz do app), então liberamos o fs do dev-server p/ o diretório pai.
export default defineConfig({
  plugins: [react(), tailwindcss(), docsNoPreview()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  server: {
    fs: { allow: [resolve(import.meta.dirname, '..')] },
  },
  // Multi-página: a plataforma tem DUAS entradas — recrutador (index.html) e candidato (candidato.html).
  // Um `vite build` emite as duas. No dev elas rodam em portas separadas (ver vite.candidato.config.ts).
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        candidato: resolve(import.meta.dirname, 'candidato.html'),
        mapa: resolve(import.meta.dirname, 'mapa.html'),
      },
    },
  },
  // Testes (Vitest): jsdom + Testing Library. css:false não processa Tailwind nos testes
  // (mais rápido e sem ruído) — os testes checam COMPORTAMENTO, não pixels.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Só os testes unitários em src/. e2e/*.spec.ts é Playwright (runner próprio) — sem isto,
    // o glob padrão do Vitest os captura e quebra (importam '@playwright/test').
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
