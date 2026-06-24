// Regras de senha — FONTE ÚNICA (Cadastro do recrutador + Acesso do candidato), pra as duas telas não
// divergirem. Cada `key` aponta para o rótulo no i18n de CADA tela (mesmas chaves, namespaces diferentes).
// `senhaForte` = todas as regras cumpridas (usado no zod e no checklist ao vivo).
export const PWD_RULES = [
  { key: 'minChars', test: (v: string) => v.length >= 8 },
  { key: 'maiuscula', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'numero', test: (v: string) => /[0-9]/.test(v) },
  { key: 'especial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const

export const senhaForte = (v: string) => PWD_RULES.every((r) => r.test(v))
