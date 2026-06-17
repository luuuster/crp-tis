/**
 * Hash polinomial base-31 → uint32 não-negativo. Determinístico: mesma string sempre devolve o mesmo
 * número. É a base do "aleatório" SINTÉTICO do app (avatares, mocks, free/busy do Teams) — usamos hash
 * estável por nome/chave em vez de Math.random, para os dados não pularem a cada render.
 */
export function hashNum(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
