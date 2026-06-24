import { defineConfig, mergeConfig, type PluginOption } from 'vite'
import baseConfig from './vite.config'

// Servidor de DEV do MAPA DE ARQUITETURA (página avulsa). Mesma base (alias, fs, tailwind, react), porém na
// porta 5174 e servindo mapa.html na raiz "/". Tela interna/de referência — fora da navegação dos dois apps.
//
// `vite --config vite.mapa.config.ts`

// Rotas que servem o mapa.html (a raiz e o deep-link /mapa).
const ROTAS_MAPA = new Set(['/', '/index.html', '/mapa', '/userflow', '/componentes'])

// Reescreve as rotas → "/mapa.html" ANTES dos middlewares internos do Vite (registro direto = pré-ordem),
// pra a raiz servir o mapa (e não o app do recrutador, que é o index.html padrão).
function rootToMapa(): PluginOption {
  return {
    name: 'root-to-mapa',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && ROTAS_MAPA.has(req.url.split('?')[0].toLowerCase())) req.url = '/mapa.html'
        next()
      })
    },
  }
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [rootToMapa()],
    server: { port: 5174 },
  }),
)
