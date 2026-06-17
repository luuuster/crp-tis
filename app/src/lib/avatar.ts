import { hashNum } from './hash'

/**
 * Tinturas de avatar/chip por tom — token-driven (fundo a 10-15% + texto na variante `-text`, AA nos 4
 * temas). Eram declaradas idênticas em 3 páginas (Banco de talentos, Entrevistas IA, Usuários); aqui
 * viram fonte única. NUNCA usar o token de FILL como cor de texto.
 */
export const AVATAR_TINTS = [
  'bg-primary/10 text-primary-text',
  'bg-secondary/15 text-secondary-text',
  'bg-success/10 text-success-text',
  'bg-warning/10 text-warning-text',
] as const

/** Escolhe uma tintura ESTÁVEL por nome (determinístico via hashNum) — mesmo nome, mesma cor. */
export const tintFor = (nome: string) => AVATAR_TINTS[hashNum(nome) % AVATAR_TINTS.length]
