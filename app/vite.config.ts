import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// Rotas amigáveis das entradas SECUNDÁRIAS (multi-página): docs → mapa.html, candidato → candidato.html.
// No dev cada uma tem porta própria (:5174 vite.mapa.config.ts, :5172 vite.candidato.config.ts) com o
// middleware em `configureServer`. No PREVIEW (vite preview — é o server do e2e e o espelho do artefato
// publicado) esse middleware NÃO roda — precisa ser `configurePreviewServer`. Sem o rewrite, /componentes
// e /acesso caem no fallback (index.html = app do recrutador) e entregam o PRODUTO ERRADO.
// "/" fica com o recrutador no preview; nos devs dedicados a raiz é reescrita pelos configs próprios.
// NOTA deploy: um hosting real precisa replicar estas regras (rewrite) — ver CR-03 da auditoria.
export const ROTAS_DOCS = new Set(['/mapa', '/userflow', '/componentes'])
export const ROTAS_CANDIDATO = new Set(['/descricao_da_vaga', '/inscricao_da_vaga', '/linkpublico', '/linkpublico/inscricao_na_vaga', '/linkpublico/inscricao_na_vaga/inscricao_enviada', '/acesso', '/acesso/recuperar', '/acesso/recuperar/enviado', '/redefinir_senha', '/redefinir_senha/sucesso', '/cadastro', '/painel', '/perfil', '/candidaturas', '/candidaturas_finalizadas', '/agendar', '/agendar_entrevista', '/entrevista'])
function rotasNoPreview(): PluginOption {
  return {
    name: 'rotas-no-preview',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url ? req.url.split('?')[0].toLowerCase() : ''
        if (ROTAS_DOCS.has(path)) req.url = '/mapa.html'
        else if (ROTAS_CANDIDATO.has(path)) req.url = '/candidato.html'
        next()
      })
    },
  }
}

// O app consome o pacote @crp/design-tokens (linkado via file:..). O dist fica na RAIZ do
// repo (fora da raiz do app), então liberamos o fs do dev-server p/ o diretório pai.
export default defineConfig({
  plugins: [react(), tailwindcss(), rotasNoPreview()],
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
