/**
 * Lógica pura (sem JSX) do calendário de entrevistas — extraída de Entrevistas.tsx para ficar testável.
 * Tudo aqui é DETERMINÍSTICO por chave (via hashNum) — espelha o free/busy do Teams e os mocks da demo,
 * sem Math.random, para os dados não pularem a cada render.
 *
 * Os parâmetros são tipados ESTRUTURALMENTE (não importam o tipo `Evento` de Entrevistas.tsx) para
 * evitar ciclo de importação entre os dois módulos.
 */
import { hashNum } from '@/lib/hash'

export const ENTREVISTADORES = ['Marina Albuquerque · RH', 'Carlos Mendes · Gestor', 'Rafael Tavares · Tech Lead', 'Beatriz Nunes · Recrutadora']
export const DURACOES = ['30 min', '45 min', '60 min', '90 min']

// Disponibilidade (demo): horários úteis (pula 12h de almoço). O livre/ocupado de cada entrevistador
// é DETERMINÍSTICO por (entrevistador + data + horário) — simula o que viria do free/busy do Teams
// (Microsoft Graph getSchedule/findMeetingTimes). ~35% ocupado por bloco.
export const WORK_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
export function ocupado(entrevistador: string, dataISO: string, slot: string) {
  return dataISO !== '' && hashNum(`${entrevistador}|${dataISO}|${slot}`) % 100 < 35
}

// Slot livre para TODOS os entrevistadores selecionados ao mesmo tempo (interseção das agendas do Teams).
export function slotLivre(entrevistadores: string[], dataISO: string, slot: string) {
  return dataISO !== '' && entrevistadores.length > 0 && entrevistadores.every((e) => !ocupado(e, dataISO, slot))
}

// Há ALGUM horário em comum no dia? (false → não há janela: mostrar aviso "sem horário" em vez da grade).
export function temHorarioLivre(entrevistadores: string[], dataISO: string) {
  return WORK_SLOTS.some((s) => slotLivre(entrevistadores, dataISO, s))
}

// A partir de `dataISO` (exclusiva), acha a PRÓXIMA data com algum horário em comum p/ os entrevistadores —
// p/ sugerir ao usuário em vez de só dizer "tente outra data". Determinística (ocupado é por chave). Busca
// limitada (padrão 90 dias) p/ não varrer indefinidamente; retorna '' se não houver nenhuma. Date.UTC cuida
// da virada de mês/ano sem ruído de fuso (a data é derivada da seleção, não de "agora" → estável no render).
export function proximaDataLivre(entrevistadores: string[], dataISO: string, limite = 90): string {
  if (dataISO === '' || entrevistadores.length === 0) return ''
  const [y, m, d] = dataISO.split('-').map(Number)
  for (let i = 1; i <= limite; i++) {
    const iso = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10)
    if (temHorarioLivre(entrevistadores, iso)) return iso
  }
  return ''
}

// Painel de entrevistadores (demo): para eventos SEMEADOS sem lista própria, deriva 2–4 internos
// DISTINTOS de forma determinística por candidato — espelha o multi-entrevistador do agendamento.
export function painelDe(ev: { cand: string }): string[] {
  const h = hashNum(ev.cand)
  const n = 2 + (h % 3) // 2 a 4
  const inicio = h % ENTREVISTADORES.length
  return Array.from({ length: n }, (_, i) => ENTREVISTADORES[(inicio + i) % ENTREVISTADORES.length])
}
export const duracaoDe = (ev: { cand: string }) => DURACOES[hashNum(ev.cand) % DURACOES.length]
export const linkDe = (ev: { cand: string; d: number; m: number }) => `meet.tis.app/${ev.cand.split(' ')[0].toLowerCase()}-${ev.d}${ev.m + 1}`
