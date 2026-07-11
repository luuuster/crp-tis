import { test, expect, type Page } from '@playwright/test'
import { login, gotoMenu } from './helpers'

// GATE DIMENSIONAL — "40px é 40px". A escala de altura dos controles é LEI do DS
// (--button-height-*: xs 24 · sm 32 · md 40 · lg 44) e já regrediu mais de uma vez (36px, 51px)
// sem nenhum teste acusar: contraste e foco tinham gate, dimensão não. Este spec mede a ALTURA
// RENDERIZADA dos controles do DS (data-slot do shadcn) nas telas principais e reprova qualquer
// valor fora da escala. Roda num tema só (dimensão não varia por tema).
const SCALE = [24, 32, 40, 44]
const TOL = 1 // arredondamento de subpixel
// Só controles do DS (data-slot) — evita falso positivo de checkbox/tab/chip, que têm escala própria.
const SELECTOR = '[data-slot="button"], [data-slot="select-trigger"], [data-slot="input"]'

// min = piso de sanidade por tela (o Login só tem 1 controle MENSURÁVEL: o input dentro de
// FormControl perde o data-slot="input" — o Slot do Radix sobrescreve com "form-control" — e o
// dock de tema do auth não é o Button do DS; ambos fora do escopo deste gate).
const ROUTES: { name: string; min: number; go: (p: Page) => Promise<void> }[] = [
  // Login e Painel montam conteúdo LAZY (chunk/skeleton) — esperar um elemento âncora, não tempo fixo.
  { name: 'Login', min: 1, go: async (p) => { await p.goto('/'); await p.getByLabel('E-mail').waitFor() } },
  { name: 'Dashboard', min: 3, go: async (p) => { await login(p) } },
  { name: 'Vagas', min: 3, go: async (p) => { await login(p); await gotoMenu(p, 'Vagas') } },
  { name: 'Entrevistas', min: 3, go: async (p) => { await login(p); await gotoMenu(p, 'Calendário de entrevistas') } },
  // Mural do candidato: deep link servido pelo rewrite do preview (candidato.html)
  { name: 'Candidato-Painel', min: 3, go: async (p) => { await p.goto('/painel'); await p.getByRole('heading', { name: 'Vagas abertas' }).waitFor() } },
]

test.describe('escala de altura dos controles (24/32/40/44)', () => {
  for (const route of ROUTES) {
    test(route.name, async ({ page }) => {
      await route.go(page)
      await page.waitForTimeout(300)
      const items = await page.evaluate((sel) => {
        const out: { h: number; slot: string | null; size: string | null; text: string }[] = []
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect()
          const cs = getComputedStyle(el)
          if (cs.display === 'none' || cs.visibility === 'hidden' || r.height < 2 || r.width < 2) continue
          out.push({
            h: Math.round(r.height),
            slot: el.getAttribute('data-slot'),
            size: el.getAttribute('data-size'),
            text: (el.textContent || '').trim().slice(0, 30),
          })
        }
        return out
      }, SELECTOR)
      expect(items.length, `esperava ≥${route.min} controles do DS em ${route.name} — achados: ${JSON.stringify(items)}`).toBeGreaterThanOrEqual(route.min)

      const fails = items.filter((it) => !SCALE.some((s) => Math.abs(it.h - s) <= TOL))
      expect(
        fails,
        `${route.name} — controles FORA da escala ${SCALE.join('/')}:\n` +
          fails.map((f) => `  ${f.h}px — [${f.slot}${f.size ? ` size=${f.size}` : ''}] "${f.text}"`).join('\n'),
      ).toEqual([])
    })
  }
})
