/**
 * Modelos de domínio COMPARTILHADOS entre páginas. Módulo-folha: não importa de `pages/*` nem de
 * `lib/vaga.tsx` (que continua dono exclusivo de Briefing/Perfil/Tom) — sem ciclo de dependência.
 */

/** Status de uma vaga — usado por VagasList e Dashboard (antes duplicado literalmente nos dois). */
export type StatusVaga = 'Aberta' | 'Rascunho' | 'Em pausa' | 'Fechada'
