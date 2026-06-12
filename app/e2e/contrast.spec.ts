import { test, expect, type Page } from '@playwright/test'
import { contrastOnStack, aaThreshold } from './wcag'
import { login, gotoRegister, setTheme, type Brand, type Mode } from './helpers'

// AUDITORIA DE CONTRASTE por PIXEL REAL (WCAG 1.4.3): para cada texto VISÍVEL, mede a cor renderizada
// vs o fundo composto (camada a camada, com alpha) e exige AA (4.5:1 normal / 3:1 grande). Usa culori
// (o axe erra OKLCH). É o guard-rail que torna "conferi no olho" um GATE — nos 4 temas.
// Exclui o que o WCAG dispensa: desabilitado, sr-only, e SVG/charts (fill, não color).

const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']

// setTheme ANTES de navegar p/ a aba: o Gerador é full-screen e cobre os toggles flutuantes de tema.
// Os toggles de marca/tema são GLOBAIS (App.tsx) — existem no Login E no Cadastro.
const SURFACES: { name: string; go: (p: Page, b: Brand, m: Mode) => Promise<void> }[] = [
  { name: 'Login', go: async (p, b, m) => { await p.goto('/'); await setTheme(p, b, m) } },
  { name: 'Cadastro', go: async (p, b, m) => { await gotoRegister(p); await setTheme(p, b, m) } },
  { name: 'Dashboard', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await p.getByRole('tab', { name: 'Dashboard' }).click() } },
  { name: 'Gerador', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await p.getByRole('tab', { name: 'Gerador' }).click() } },
  // Passo 2 (Perfil e Requisitos): o card do Stepper pula direto, sem disparar a validação.
  { name: 'Gerador-Perfil', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m)
    await p.getByRole('tab', { name: 'Gerador' }).click()
    await p.getByRole('button', { name: /Perfil e Requisitos/ }).click()
    await expect(p.getByText('Template aplicado automaticamente.')).toBeVisible()
  } },
  { name: 'Componentes', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await p.getByRole('tab', { name: 'Componentes' }).click() } },
  // Charlie é um painel-irmão (flex, não overlay): abri-lo audita o Gerador + o drawer juntos.
  { name: 'Charlie', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m)
    await p.getByRole('tab', { name: 'Gerador' }).click()
    await p.getByRole('button', { name: /Falar com Charlie/ }).click()
    await expect(p.getByRole('complementary', { name: 'Copiloto Charlie' })).toBeVisible()
  } },
]

type TextItem = { color: string; size: number; weight: number; bgStack: string[]; text: string; tag: string }

async function collectText(page: Page): Promise<TextItem[]> {
  return page.evaluate(() => {
    const out: any[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
    let el = walker.currentNode as HTMLElement | null
    while (el) {
      const tag = el.tagName.toLowerCase()
      const inSvg = el.namespaceURI === 'http://www.w3.org/2000/svg' || !!el.closest('svg')
      const skipTag = tag === 'script' || tag === 'style' || tag === 'option'
      // tem texto DIRETO não-vazio?
      let direct = ''
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent && n.textContent.trim()) direct += n.textContent
      if (direct.trim() && !inSvg && !skipTag) {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width >= 2 && r.height >= 2
        const disabled = !!el.closest('[disabled],[aria-disabled="true"]')
        const srOnly = (el.className && String(el.className).includes('sr-only'))
        // Texto sobre GRADIENTE: fundo não é componível por cor (precisaria amostrar pixel). Esses
        // pares (texto sobre from-primary/secondary) usam -foreground, cobertos pelo check.mjs do DS.
        const onGradient = !!el.closest('[class*="gradient"]')
        if (visible && !disabled && !srOnly && !onGradient) {
          // Compõe o fundo subindo a árvore; PARA no 1º bg sólido opaco. Se topar com um
          // gradiente/imagem (background-image) ANTES de um opaco, o fundo não é componível por cor
          // (precisaria amostrar pixel) → pula o elemento (ex.: texto sobre o sidebar em gradiente;
          // esses pares são cobertos pelo check.mjs do DS).
          const bgStack: string[] = []
          let p: HTMLElement | null = el
          let onImage = false
          while (p) {
            const pcs = getComputedStyle(p)
            // backgroundImage PRIMEIRO: o gradiente é pintado POR CIMA do backgroundColor sólido —
            // se este elemento tem gradiente/imagem, é ele que aparece, não dá p/ compor por cor.
            if (pcs.backgroundImage && pcs.backgroundImage !== 'none') { onImage = true; break }
            const bg = pcs.backgroundColor
            // Coleta TODA camada não-transparente até a raiz; a composição (com alpha) é feita no Node
            // com culori — que entende oklab/oklch (`oklab(.. / 0.15)`). NÃO dá p/ detectar opacidade
            // por regex aqui (o getComputedStyle devolve oklab, não rgba) → era esse o falso "opaco".
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') bgStack.push(bg)
            p = p.parentElement
          }
          if (!onImage) {
            // Âncora: garante uma base OPACA no tema certo (o fundo da página). Sem isso, uma pilha só
            // com camadas translúcidas cai no branco — errado no dark (translúcido-escuro sobre branco).
            for (const b of [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.documentElement).backgroundColor])
              if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') bgStack.push(b)
            const w = cs.fontWeight === 'bold' ? 700 : parseInt(cs.fontWeight) || 400
            out.push({ color: cs.color, size: parseFloat(cs.fontSize) || 16, weight: w, bgStack, text: direct.trim().slice(0, 40), tag })
          }
        }
      }
      el = walker.nextNode() as HTMLElement | null
    }
    return out
  })
}

test.describe('auditoria de CONTRASTE (texto, pixel real)', () => {
  for (const brand of BRANDS)
    for (const mode of MODES)
      for (const surface of SURFACES) {
        test(`${surface.name} · ${brand} · ${mode}`, async ({ page }) => {
          await surface.go(page, brand, mode)
          await page.waitForTimeout(250)
          const items = await collectText(page)
          expect(items.length, 'esperava textos visíveis').toBeGreaterThan(3)

          const fails: string[] = []
          for (const it of items) {
            const ratio = contrastOnStack(it.color, it.bgStack)
            const need = aaThreshold(it.size, it.weight)
            if (ratio + 0.05 < need) // tolerância p/ arredondamento
              fails.push(`${ratio.toFixed(2)}:1 (precisa ${need}) — <${it.tag} ${it.size}px/${it.weight}> "${it.text}" color=${it.color} bg=[${it.bgStack.join(' / ')}]`)
          }
          expect(fails, `${surface.name}·${brand}·${mode} — contraste:\n${fails.join('\n')}`).toEqual([])
        })
      }
})
