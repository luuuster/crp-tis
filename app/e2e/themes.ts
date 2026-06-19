import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { Brand, Mode } from './helpers'
// build/lib/themes.mjs é JS puro (sem .d.ts); o e2e fica FORA do tsc (include só "src") e o Playwright
// transpila com esbuild — então importamos a SSOT direto. A matriz marca×tema passa a derivar de
// tokens/$themes.json (Token Studio): uma marca/modo novo expande TODOS os specs sozinho.
// @ts-ignore -- sem tipos no .mjs
import { loadThemes } from '../../build/lib/themes.mjs'

// e2e/ → app/ → raiz do repo (onde vive tokens/$themes.json).
const { brands, modes } = loadThemes(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'))

// marca = slug do set brand/* ; modo = nome em minúsculo (Light→light) — casa com setTheme(page, brand, mode).
export const BRANDS: Brand[] = brands.map((b: { slug: string }) => b.slug as Brand)
export const MODES: Mode[] = modes.map((m: { name: string }) => m.name.toLowerCase() as Mode)
