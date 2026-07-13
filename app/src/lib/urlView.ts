// Roteamento por URL do app do RECRUTADOR (:5173). Diferente do candidato (:5172), que navega por
// pathname com recarga real (CandidatoApp lê location.pathname na montagem), aqui a navegação é por
// ESTADO (Tabs + forceMount preservam o wizard/lista em memória — ver App.tsx). Este módulo sincroniza
// esse estado com a URL via history.pushState/popstate: `/vagas` abre a tela direto, deep-link e o botão
// voltar do navegador funcionam, SEM recarregar (o estado interno sobrevive).
//
// As rotas evitam de propósito os caminhos do candidato/docs (ROTAS_CANDIDATO/ROTAS_DOCS em vite.config):
// o perfil do recrutador é `/conta` (o candidato já usa `/perfil`). Assim não há colisão no preview/deploy.

export type RecruiterView =
  | 'login' | 'dashboard' | 'gerador' | 'entrevistas' | 'entrevistas-ia'
  | 'candidatos' | 'pipeline' | 'usuarios' | 'perfil'

// view → caminho amigável. `login` = raiz. `gerador` = a tela "Vagas".
export const VIEW_PATH: Record<RecruiterView, string> = {
  login: '/',
  dashboard: '/dashboard',
  gerador: '/vagas',
  entrevistas: '/entrevistas',
  'entrevistas-ia': '/entrevistas-ia',
  candidatos: '/candidatos',
  pipeline: '/pipeline',
  usuarios: '/usuarios',
  perfil: '/conta',
}

const PATH_VIEW = new Map<string, RecruiterView>(
  (Object.entries(VIEW_PATH) as [RecruiterView, string][]).map(([v, p]) => [p, v]),
)

// Normaliza o pathname (minúsculo, sem barra final) e resolve a view. `/vagas` e QUALQUER subrota dela
// (`/vagas/nova`, `/vagas/:id`, `/vagas/:id/editar`) resolvem para `gerador` — o sub-estado é roteado
// DENTRO do JobGenerator (ver parseVagaSub). Retorna null se não é rota do recrutador (fallback do chamador).
export function viewFromPath(pathname: string = window.location.pathname): RecruiterView | null {
  const norm = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  if (norm === '/vagas' || norm.startsWith('/vagas/')) return 'gerador'
  return PATH_VIEW.get(norm) ?? null
}

// Sub-estado da tela Vagas (roteado no JobGenerator). `id` é o id da vaga (URL-safe: '1'..'16' ou timestamp
// de rascunho). `/vagas`=lista · `/vagas/nova`=criar · `/vagas/:id`=ver · `/vagas/:id/editar`=editar.
export type VagaSub =
  | { screen: 'lista' }
  | { screen: 'wizard'; create: true }
  | { screen: 'wizard'; id: string }
  | { screen: 'detalhe'; id: string }

export function parseVagaSub(pathname: string = window.location.pathname): VagaSub {
  const norm = pathname.toLowerCase().replace(/\/+$/, '')
  if (norm === '/vagas/nova') return { screen: 'wizard', create: true }
  const edit = norm.match(/^\/vagas\/([^/]+)\/editar$/)
  if (edit) return { screen: 'wizard', id: decodeURIComponent(edit[1]) }
  const ver = norm.match(/^\/vagas\/([^/]+)$/)
  if (ver && ver[1] !== 'nova') return { screen: 'detalhe', id: decodeURIComponent(ver[1]) }
  return { screen: 'lista' }
}

// Deriva o sub-path a partir do estado do JobGenerator (fonte única — o effect de escrita da URL usa isto).
export function vagaSubPath(screen: 'lista' | 'detalhe' | 'wizard', editingId: string | null, verId: string | null): string {
  if (screen === 'wizard') return editingId ? `/vagas/${editingId}/editar` : '/vagas/nova'
  if (screen === 'detalhe' && verId) return `/vagas/${verId}`
  return '/vagas'
}
