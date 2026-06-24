import { test, expect, type Page } from '@playwright/test'
import { contrastOnStack, aaThreshold } from './wcag'
import { login, setTheme, gotoMenu, abrirVaga, type Brand, type Mode } from './helpers'
import { BRANDS, MODES } from './themes'

// AUDITORIA DE CONTRASTE por PIXEL REAL (WCAG 1.4.3): para cada texto VISÍVEL, mede a cor renderizada
// vs o fundo composto (camada a camada, com alpha) e exige AA (4.5:1 normal / 3:1 grande). Usa culori
// (o axe erra OKLCH). É o guard-rail que torna "conferi no olho" um GATE — nos 4 temas.
// Exclui o que o WCAG dispensa: desabilitado, sr-only, e SVG/charts (fill, não color).


// setTheme ANTES de navegar p/ a aba: o Gerador é full-screen e cobre os toggles flutuantes de tema.
// Os toggles de marca/tema são GLOBAIS (App.tsx). O Cadastro saiu daqui: virou do candidato (porta 5172,
// /cadastro, dev-only) — fora do alcance do preview do recrutador. A11y do form é coberta no jsdom (RegisterPage).
const SURFACES: { name: string; go: (p: Page, b: Brand, m: Mode) => Promise<void> }[] = [
  { name: 'Login', go: async (p, b, m) => { await p.goto('/'); await setTheme(p, b, m) } },
  // Login já cai na Dashboard (AppShell); navegação das telas internas é pelo MENU (sidebar), não pelo dock.
  { name: 'Dashboard', go: async (p, b, m) => { await login(p); await setTheme(p, b, m) } },
  { name: 'Vagas', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Vagas') } },
  // Passo 2 (Perfil e Requisitos): entra no wizard pela lista ("Abrir vaga") e avança pelo RODAPÉ.
  // Obrigatórios em branco → confirma no aviso "Avançar assim mesmo".
  { name: 'Gerador-Perfil', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Vagas'); await abrirVaga(p)
    await p.getByRole('button', { name: /Avançar para/ }).click()
    const soft = p.getByRole('button', { name: 'Avançar assim mesmo' })
    await soft.waitFor({ state: 'visible', timeout: 1500 }).then(() => soft.click()).catch(() => {})
    await expect(p.getByText('Template aplicado automaticamente.')).toBeVisible()
  } },
  { name: 'Componentes', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Componentes') } },
  // Overlay aberto na vitrine: mede o texto sobre a superfície --popover/--popover-foreground
  // (que o scan fechado de "Componentes" não alcança — o conteúdo é portaled e só monta ao abrir).
  { name: 'Componentes-Popover', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Componentes')
    await p.getByRole('button', { name: 'Abrir popover' }).click()
    await expect(p.getByText('Dimensões')).toBeVisible()
  } },
  // Charlie do Gerador é um painel-irmão (flex, não overlay): abri-lo audita o wizard + o drawer juntos.
  { name: 'Charlie-Gerador', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Vagas'); await abrirVaga(p)
    await p.getByRole('button', { name: /Falar com Charlie/ }).click()
    await expect(p.getByRole('complementary', { name: 'Copiloto Charlie' })).toBeVisible()
  } },
  // ── Telas de dados (antes descobertas pelo e2e de contraste) ──────────────────────────────────
  { name: 'Candidatos', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Banco de talentos') } },
  // Perfil do candidato: HERÓI AZUL (bg-primary) com badge de etapa — alvo da classe "texto colorido
  // sobre fill sólido". Abre o 1º candidato (Mariana Lopes = Contratado).
  { name: 'Candidatos-Perfil', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Banco de talentos')
    await p.getByRole('button', { name: 'Mariana Lopes' }).click()
    await expect(p.getByText('Perfil do candidato')).toBeVisible()
  } },
  // Charlie do Banco: Sheet lateral (roxo/secondary).
  { name: 'Charlie-Banco', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Banco de talentos')
    await p.getByRole('button', { name: 'Falar com Charlie' }).click()
    await expect(p.getByRole('dialog')).toBeVisible()
  } },
  { name: 'Usuarios', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Usuários') } },
  // Sheet de cadastro: form portaled (collectText varre o document.body, então mede o Sheet aberto).
  { name: 'Usuarios-Cadastro', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Usuários')
    await p.getByRole('button', { name: 'Cadastro de usuário' }).click()
    await expect(p.getByRole('dialog')).toBeVisible()
  } },
  { name: 'Entrevistas', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Calendário de entrevistas') } },
  { name: 'EntrevistasIA', go: async (p, b, m) => { await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Entrevistas IA') } },
  // Detalhe da IA: também tem HERÓI AZUL (mesmo padrão do perfil) — abre o 1º candidato.
  { name: 'EntrevistasIA-Detalhe', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Entrevistas IA')
    await p.getByRole('button', { name: 'Diego Teste 2' }).click()
    await expect(p.getByText('Detalhes do candidato')).toBeVisible()
  } },
  // Sheet de agendar (Teams): abre, preenche a data → renderiza os slots de disponibilidade
  // (livre=success / selecionado=primary / ocupado=disabled) p/ medir o contraste deles.
  { name: 'Agendar-Teams', go: async (p, b, m) => {
    await login(p); await setTheme(p, b, m); await gotoMenu(p, 'Calendário de entrevistas')
    await p.getByRole('button', { name: 'Agendar' }).first().click()
    await expect(p.getByRole('dialog')).toBeVisible()
    await p.locator('#ag-data').fill('22/06/2026')
    await p.waitForTimeout(150)
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
