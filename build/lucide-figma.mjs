/**
 * lucide-figma — ponte lucide → Figma (fidelidade web-figma).
 *
 * Lê o SVG EXATO de cada ícone do MESMO pacote que a web usa (app/node_modules/lucide-react),
 * e emite o markup pronto para `figma.createNodeFromSvg(svg)`. Assim os ícones do Figma são
 * idênticos aos da aplicação (mesma fonte: lucide).
 *
 * REGRA: todo ícone usado no Figma DEVE existir no lucide. Se um nome não existir aqui, o script
 * o reporta em `missing` (e sai com código 2) — NÃO invente/placeholder: avise o usuário.
 *
 * Uso:
 *   node build/lucide-figma.mjs Search MapPin LayoutGrid Briefcase
 *   node build/lucide-figma.mjs search map-pin           # kebab também vale
 * Saída: JSON { icons: { "<kebab>": "<svg…>" }, missing: [...] } no stdout.
 */
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ICON_DIR = join(HERE, '..', 'app', 'node_modules', 'lucide-react', 'dist', 'esm', 'icons')

/** Converte um nome (PascalCase, camelCase ou com espaços) para o kebab-case do lucide. */
export function toKebab(name) {
  return String(name)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')     // mapPin -> map-Pin
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')  // IOStream -> IO-Stream
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

// Atributos com aspas SIMPLES (SVG aceita) — evita conflito ao embutir o SVG em JS/JSON.
const attrsOf = (a) =>
  Object.entries(a)
    .filter(([k]) => k !== 'key')
    .map(([k, v]) => `${k}='${v}'`)
    .join(' ')

/** Monta o SVG lucide (24×24, stroke currentColor, width 2, round) a partir do __iconNode. */
export function iconNodeToSvg(iconNode) {
  const body = iconNode.map(([tag, a]) => `<${tag} ${attrsOf(a)}/>`).join('')
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' ` +
    `fill='none' stroke='#000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>` +
    `${body}</svg>`
  )
}

/** Resolve um ícone lucide para SVG. Retorna null se não existir na biblioteca. */
export async function lucideSvg(name) {
  const kebab = toKebab(name)
  const file = join(ICON_DIR, `${kebab}.mjs`)
  if (!existsSync(file)) return null
  const mod = await import(pathToFileURL(file).href)
  return iconNodeToSvg(mod.__iconNode)
}

// CLI
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const names = process.argv.slice(2)
  if (!names.length) {
    console.error('Uso: node build/lucide-figma.mjs <Icon1> <Icon2> ...')
    process.exit(1)
  }
  const icons = {}
  const missing = []
  for (const n of names) {
    const svg = await lucideSvg(n)
    if (svg) icons[toKebab(n)] = svg
    else missing.push(n)
  }
  console.log(JSON.stringify({ icons, missing }, null, 2))
  if (missing.length) {
    console.error(`\n⚠️  NÃO existem no lucide (avise o usuário — não faça placeholder): ${missing.join(', ')}`)
    process.exit(2)
  }
}
