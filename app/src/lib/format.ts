/**
 * Formatadores de texto compartilhados entre páginas. Mantém-se puro e sem dependência de UI.
 */

/** Iniciais de um nome: 1ª letra das 2 primeiras palavras, em maiúsculas (ex.: "Mariana Lopes" → "ML"). */
export function iniciais(nome: string): string {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
