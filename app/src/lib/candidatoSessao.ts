/**
 * Identidade do candidato "logado" (MOCK, sem backend) — guarda o e-mail informado no /acesso e deriva
 * nome de exibição + iniciais para o avatar/saudações. Usa localStorage (NÃO sessionStorage): a vaga abre
 * em NOVA ABA, e a aba nova precisa saber que a pessoa está logada (sessionStorage é por-aba; localStorage
 * é compartilhado na mesma origem). Sem auth real: é só pra a UI refletir quem entrou.
 */
const EMAIL_KEY = 'candidato.email'

function emailGuardado(): string {
  try { return localStorage.getItem(EMAIL_KEY) || '' } catch { return '' }
}

export function guardarEmailCandidato(email: string) {
  try { localStorage.setItem(EMAIL_KEY, email) } catch { /* storage indisponível */ }
}

export function sairCandidato() {
  try { localStorage.removeItem(EMAIL_KEY) } catch { /* storage indisponível */ }
}

export const estaLogado = () => emailGuardado() !== ''

// Contas "cadastradas" (MOCK, sem backend): e-mail + senha que entram DIRETO na plataforma, sem o fluxo de
// senha provisória / 1º acesso. No produto, isto viria da base de candidatos cadastrados.
type Conta = { email: string; senha: string }
const CONTAS: Conta[] = [
  { email: 'candidato@talentai.com', senha: 'talentai123' },
]

/** Valida uma conta cadastrada (e-mail case-insensitive). Retorna true se as credenciais batem. */
export function autenticarCandidato(email: string, senha: string): boolean {
  const e = email.trim().toLowerCase()
  return CONTAS.some((c) => c.email.toLowerCase() === e && c.senha === senha)
}

export type Candidato = { email: string; nome: string; iniciais: string }

export function lerCandidato(): Candidato {
  const email = emailGuardado()
  const local = email.split('@')[0] || ''
  const partes = local.split(/[._-]+/).filter(Boolean)
  const nome = partes.length
    ? partes.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    : 'Candidato'
  const iniciais = (partes.length >= 2 ? partes[0][0] + partes[1][0] : local.slice(0, 2) || 'C').toUpperCase()
  return { email: email || '—', nome, iniciais }
}
