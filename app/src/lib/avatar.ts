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

// Primeiros nomes FEMININOS que aparecem na demo — só para escolher o gênero do retrato fake.
const PRIMEIRO_FEM = new Set(['Aline', 'Beatriz', 'Camila', 'Fernanda', 'Juliana', 'Marina', 'Patrícia', 'Ana', 'Carla', 'Helena', 'Letícia', 'Paula', 'Renata', 'Sofia'])

/**
 * Foto FAKE determinística por nome (retrato do randomuser.me), com gênero inferido pelo primeiro nome.
 * É mockup: se a imagem não carregar (offline/sem rede), o Avatar cai no fallback de iniciais sozinho.
 * Mesmo nome → mesma foto.
 */
export const fotoDe = (nome: string) => {
  const fem = PRIMEIRO_FEM.has(nome.trim().split(' ')[0])
  return `https://randomuser.me/api/portraits/${fem ? 'women' : 'men'}/${hashNum(nome) % 100}.jpg`
}
