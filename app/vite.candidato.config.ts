import { defineConfig, mergeConfig, type PluginOption } from 'vite'
import baseConfig from './vite.config'

// Servidor de DEV do app do CANDIDATO. Mesma base (alias, fs, tailwind, react), porém na porta 5172 e
// servindo candidato.html na raiz "/". Assim a separação recrutador (:5173) × candidato (:5172) fica
// explícita no dev. (No build, as duas entradas saem juntas como multi-página — ver vite.config.ts.)
//
// `vite --config vite.candidato.config.ts`

// Rotas de navegação do app do candidato (SPA): a raiz e as rotas das abas servem candidato.html. O React
// lê o pathname e abre a aba certa (ver InscricaoVaga). Mantido em sync com TAB_PATH lá.
const ROTAS_CANDIDATO = new Set(['/', '/index.html', '/descricao_da_vaga', '/inscricao_da_vaga', '/linkpublico', '/linkpublico/inscricao_na_vaga', '/linkpublico/inscricao_na_vaga/inscricao_enviada', '/acesso', '/cadastro', '/painel'])

// Reescreve as rotas de navegação → "/candidato.html" ANTES dos middlewares internos do Vite (registro
// direto = pré-ordem), pra a raiz e os deep-links das abas servirem o app do candidato (e não o recrutador).
function rootToCandidato(): PluginOption {
  return {
    name: 'root-to-candidato',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        // pathname em minúsculas: o set é todo lowercase, então /ACESSO, /Acesso etc. também batem
        // (senão o deep-link caía no fallback e servia o app do recrutador na porta do candidato).
        if (req.url && ROTAS_CANDIDATO.has(req.url.split('?')[0].toLowerCase())) req.url = '/candidato.html'
        next()
      })
    },
  }
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [rootToCandidato()],
    server: { port: 5172 },
  }),
)
