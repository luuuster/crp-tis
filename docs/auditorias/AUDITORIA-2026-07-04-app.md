# Auditoria do sistema — front, tokens e design system

**Data:** 04/07/2026 · **Escopo:** app React (recrutador :5173, candidato :5172, docs :5174), pipeline de tokens (Token Studio → Style Dictionary → dist/), i18n (pt-BR/en/es/pt-AO).
**Método:** validações automáticas + 3 varreduras paralelas (front, tokens/DS, a11y) com verificação de cada achado no código — itens não confirmados foram descartados.

> ## ✅ Status: correções aplicadas (04/07/2026)
> Todos os itens acionáveis foram corrigidos e revalidados (tsc, lint, 211 testes verdes):
> **Médias 1.1–1.3** (aria-required + checklist de senha anunciada + erro de e-mail no Usuarios; describedby no Switch PcD) ·
> **F1** (Card ganhou `tipo`, reagendar preserva o formato) · **F2** (5 exports mortos removidos) ·
> **F3** (mapa lista `/perfil` do candidato) · **F4** (aria-labels de carregamento via i18n) · **F5** (revoke adiado) ·
> **A1** (form.tsx agora só referencia ids que existem — fix global) · **A2** (describedby condicional nos 2 perfis) ·
> **A3** (`aria-haspopup` nos comboboxes) · **A4** (data no nome acessível da pílula do calendário) ·
> **A5** (sr-only Pergunta/Resposta nas bolhas) · **A6** (erro de e-mail com role=alert) · **A7** (motion-safe no Chips) ·
> **2.4** (todas as chaves i18n mortas removidas ×3 línguas; override pt-AO ajustado) ·
> **2.5** (pt-AO exibe "Província" na cascata e no filtro do mural) · **D2** (`PANEL_W` em surfaces.ts).
>
> **Deixados de fora, por decisão** (não são defeitos): **D1** (scrim `bg-black/50` dos overlays — trocar exige definir um token `--overlay` no DS; alinhar antes de chumbar valor), **D3** (geometria decorativa de gráfico/ilustração), **2.6** (tamanho de chunks — observação de performance, sem impacto funcional) e a limitação de deep-links no preview (seção 5, por design de mockup).

---

## 0. Validações automáticas — tudo verde ✅

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` (app) | ✅ 0 erros |
| `eslint src` (inclui regra custom `crp/design-tokens`) | ✅ 0 avisos |
| `vitest` | ✅ 211/211 testes (23 arquivos), inclui paridade i18n e axe |
| `npm run check` (DS: contrato, refs, contraste AA fatal, coerência marca/tema, a11y shippada) | ✅ 4 temas, 763 declarações, 0 fill-como-texto |
| `npm run audit:dark` (contraste surface-aware no dark) | ✅ 0 reprovações AA |
| `vite build` (produção, multi-página) | ✅ exit 0 |

**Não há nenhum achado de severidade ALTA.** O sistema está num estado muito limpo; o que segue são 3 médias (todas de a11y) e uma cauda de baixas.

---

## 1. Severidade MÉDIA — acessibilidade (WCAG 2.2 AA)

### 1.1 `Usuarios.tsx` — campos obrigatórios não anunciados
`app/src/pages/Usuarios.tsx:393-459` — todos os campos do sheet de editar/cadastrar marcam obrigatório apenas com `*` visual (`aria-hidden`), e os inputs **não têm `aria-required`** nem `sr-only` equivalente. Leitor de tela não sabe que os campos são obrigatórios (WCAG 3.3.2).
**Correção:** `aria-required` nos inputs (ou o padrão `ReqLabel` com `sr-only "obrigatório"` que o `RegisterPage` já usa).

### 1.2 `Usuarios.tsx` — checklist de requisitos de senha não anunciada
`app/src/pages/Usuarios.tsx:447-482` — o input `u-senha` tem `aria-invalid`, mas nenhum `aria-describedby` apontando para a lista de requisitos; o contador `N/5` não é `role="status"` (WCAG 3.3.2 / 4.1.3).
**Correção:** `id` no bloco de requisitos + `aria-describedby` no input + `role="status"` no contador (mesmo padrão do `RegisterPage`/`CandidatoAcesso`).

### 1.3 `StepBriefing.tsx` — hint do toggle PcD não anunciado
`app/src/pages/job-generator/StepBriefing.tsx:95-99` — o `Switch` "Afirmativas para PcD" tem `aria-labelledby="pcd-label"`, mas o texto explicativo não está em `aria-describedby` (WCAG 1.3.1).
**Correção:** `id="pcd-hint"` no `<p>` do hint + `aria-describedby="pcd-hint"` no `<Switch>`.

---

## 2. Severidade BAIXA

### 2.1 Front / lógica

| # | Onde | Problema | Correção |
|---|---|---|---|
| F1 | `app/src/pages/Pipeline.tsx:53-58` | `eventoDoCard` força `tipo: 'Online'` — reagendar uma entrevista presencial sempre reabre como Online; chips do calendário do funil sempre com ícone de vídeo. Raiz: o modelo `Card` (`pipeline/data.ts:44-53`) não guarda `tipo`. | Adicionar `tipo?: Tipo` ao `Card` e propagar. |
| F2 | `app/src/pages/pipeline/data.ts:89-99` | 5 exports mortos: `contratar`, `agendar`, `aplicarTeste`, `enviarProposta`, `gateCumprido` — nada os importa (o funil usa `aprovar`/`reprovar` e atualização inline). | Remover (ou documentar como API intencional). |
| F3 | `app/src/pages/MapaArquitetura.tsx:93-147` | O produto CANDIDATO no mapa não lista a tela nova `/perfil` (`CandidatoPerfil.tsx`, roteada em `CandidatoApp.tsx` e `vite.candidato.config.ts`). Doc desatualizada. | Adicionar `/perfil` ao grupo "Área logada". |
| F4 | `app/src/App.tsx:31` · `CandidatoApp.tsx:35` · `components/PainelSkeleton.tsx:44` | `aria-label="Carregando página"` / `"Carregando vagas"` hardcoded pt-BR num app com en/es/pt-AO — leitores de tela anunciam sempre em português. | Trocar por `t(...)` do namespace common. |
| F5 | `app/src/pages/roteiro.ts:28-30` | `URL.revokeObjectURL` chamado sincronamente logo após `a.click()` — funciona nos browsers atuais, mas é frágil. | `setTimeout(() => URL.revokeObjectURL(url), 0)`. |

### 2.2 Design System / tokens (nenhuma violação — só dívida cosmética)

| # | Onde | Problema | Correção |
|---|---|---|---|
| D1 | `app/src/components/ui/{alert-dialog,dialog,drawer,sheet}.tsx` (~linha 38) | Scrim dos overlays usa `bg-black/50` — padrão shadcn, único desvio de "100% token" restante. Impacto visual nulo (backdrop translúcido igual nos 2 temas). | Se quiser 100%: token `--overlay` ou `bg-foreground/50`. |
| D2 | `app/src/components/shell/AppShell.tsx:66` · `pages/job-generator/CharlieRail.tsx:142` | `w-[300px]` (largura de painel) duplicado em 2 lugares — candidato a drift. | Token/constante `--panel-width`. |
| D3 | `app/src/pages/dashboard/widgets.tsx:93,217` · `pages/UserFlow.tsx:133` | Números mágicos de geometria (`inset-[18px]` no donut; `top-[88px] left-[calc(50%+120px)]` no fluxo ilustrativo). | Aceitável; documentar ou tokenizar se incomodar. |

**Exceções legítimas já documentadas no código (não são achados):** `chart.tsx:70` (os `#ccc`/`#fff` são *seletores de atributo* do SVG do Recharts, com eslint-disable) e `AppShell.tsx:96,140` (pílula invertida `bg-primary-foreground text-primary`, AA por simetria — o próprio `check.mjs` trata como válida).

### 2.3 Acessibilidade (cauda)

| # | Onde | Problema | Correção |
|---|---|---|---|
| A1 | `app/src/pages/CandidatoAcesso.tsx:344,447,465` (e FormItems sem description no geral) | `aria-describedby` do `FormControl` sempre inclui `…-description`, que não existe quando não há `<FormDescription>` — referência órfã (AT ignoram, mas é sujeira). O erro em si **é** anunciado (`FormMessage` presente — item do plano antigo REFUTADO). | `FormDescription` sr-only, ou só incluir o id quando existir. |
| A2 | `app/src/pages/CandidatoPerfil.tsx:199-205` | `aria-describedby="c-nova-req"` aponta para bloco que só monta quando o usuário digita (`querSenha`) — órfão momentâneo; requisitos não são lidos ao focar. | Manter o container no DOM sempre (ou `aria-live`). |
| A3 | `app/src/pages/job-generator/fields/SearchSelect.tsx:31-33` | Combobox sem `aria-haspopup="listbox"`. | Adicionar ao trigger (idem FormSelect). |
| A4 | `app/src/components/CalendarioMensal.tsx:96-104` | Nome acessível da pílula de evento não inclui o **dia** (só hora + candidato). | Incluir a data no `aria-label` da pílula. |
| A5 | `app/src/pages/candidatos/ProcessoDetalhe.tsx:213-216` | Bolhas do chat do teste técnico distinguem pergunta×resposta só por cor/alinhamento. | `<span class="sr-only">Pergunta/Resposta</span>` em cada bolha. |
| A6 | `app/src/pages/Usuarios.tsx:399` | "E-mail inválido" sem `role="alert"`/`aria-describedby` (só `aria-invalid` no input). | `id` no `<p>` + `aria-describedby` no `u-email`. |
| A7 | `app/src/pages/job-generator/fields/Chips.tsx:145` | Popover anima sem `motion-safe:` (inconsistente com o padrão do projeto; o `MobileSheet` irmão usa). | Prefixar com `motion-safe:`. |

### 2.4 i18n — chaves mortas (não quebram nada; paridade ok nas 3-4 línguas)

Sobras de refatorações recentes — remover em `pt-BR`, `en` e `es` (e o override `pt-AO` correspondente):

- `painel.json` → `conta.editarCurriculo`, `conta.perfilEmBreve`, `conta.curriculoEmBreve` (menu unificado em "Editar perfil").
- `candidatos.json` → `proc.iaAprovado`, `proc.iaReprovado` (status agora vem de `entrevistas-ia`).
- `usuarios.json` → `sheet.senhaDica`, `sheet.senhaCurta` (substituídos pela checklist de requisitos).
- `gerador.json` → `briefing.local.hint` e `briefing.local.placeholder` (o Input virou cascata País→Estado→Cidade; só o `label` segue em uso como título do bloco). **Atenção:** o override pt-AO em `app/src/i18n/index.ts` aponta para `gerador.briefing.local.hint` — limpar junto.

### 2.5 Conteúdo

- Rótulo **"Estado"** (filtro do mural `painel.json:52` e cascata `gerador.json:151`) vs. Angola, que usa **províncias** (Luanda/Benguela/Huambo entram na lista de "estados"). Funciona, mas o termo é impreciso para pt-AO. Opções: rótulo neutro ("Estado/Província") ou rótulo por locale.

### 2.6 Performance (observação)

Build ok, mas dois chunks merecem um olhar quando sobrar tempo:
- `ThemeToggles` → **528 KB** (168 gzip) — suspeito de arrastar registro de ícones/assets de marca para um componente pequeno.
- `mapa` → 495 KB (145 gzip) — página de docs, tolerável.
- `roteiro.doc` (368 KB) e `chart` (342 KB) são lazy por design — ok.

---

## 3. Itens do plano de auditoria anterior — já corrigidos ✔

Verificados um a um no código atual; **não existem mais**:

1. ~~Calendário de Entrevistas abre vazio~~ → corrigido com `EVENTO_ANCORA` (`Entrevistas.tsx:60-62,406-407`); mesmo padrão no funil (`CAL_ANCORA`, `Pipeline.tsx:67`).
2. ~~Efeito colateral no corpo do render~~ → `guardarEmailCandidato` está em `useEffect(..., [])` nas duas telas.
3. ~~Mapa lista `/componentes` no recrutador / falta EditarPerfil~~ → mapa atual correto (`/perfil` do recrutador presente; `/acesso · trocar senha` marcado como etapa sem URL).
4. ~~Erro de senha não anunciado (FormMessage ausente)~~ → `FormMessage` presente em `CandidatoAcesso` e `RegisterPage`; sobrou apenas o describedby órfão (item A1).
5. ~~`estadoDaFase`/`EstadoFase` mortos em candidaturas.ts~~ → já removidos.

---

## 4. Áreas varridas e LIMPAS

- **Cores chumbadas** (hex/rgb/hsl/oklch em className/style): zero em `app/src` (exceções documentadas acima).
- **Fill-como-texto**: zero — 100% dos textos coloridos usam `-text`/`-foreground` (validado por grep exaustivo + gate fatal do `check.mjs`).
- **Bordas duras/pretas**: zero; reset `border-color: var(--border)` correto no `index.css`.
- **Tipografia**: escala `ty-*` pervasiva (511 usos); nenhum `text-[NNpx]` arbitrário; `text-xs` (12px) só em chrome/rótulos (badge, kbd, tooltip, iniciais) — dentro da regra "12px raríssimo".
- **Dark/light**: nenhum `bg-white`/`text-black`/`bg-gray-*` só-light.
- **Pipeline de tokens**: SSOT `tokens/` → `dist/` em sync; app consome via `@crp/design-tokens/tokens.css` (sem cópia hardcoded); `check.mjs` cobre contrato completo, contraste AA fatal, estados de botão, z-index e a11y shippada.
- **Higiene**: zero `as any` / `@ts-ignore`; `console.error` só na telemetria plugável (intencional).
- **Funil no UserFlow**: coerente com a ordem atual (IA → Teste → RH → Gestor → Proposta).
- **Cascata País→Estado→Cidade**: troca de país limpa estado/cidade e recalcula `local` — sem estado incoerente; `/perfil` do candidato em sync entre `CandidatoApp` e vite config.
- **Foco/teclado**: sem `tabIndex` positivo, sem `outline-none` órfão, botões só-ícone com `aria-label`, `aria-current` correto no stepper.

---

## 5. Limitações conhecidas (por design de mockup — não corrigir)

- **Deep links do candidato só no dev server**: o middleware `rootToCandidato` existe só em `vite.candidato.config.ts` (dev). Num `vite preview`/hospedagem estática, `/painel`, `/perfil` etc. dariam 404 sem rewrite equivalente no host. Pré-existente e vale para todas as rotas, não só as novas.
- Sem backend/persistência real; prosa mockada hardcoded em pt-BR; fotos externas randomuser — decisões registradas do projeto.

---

## 6. Ordem de correção sugerida

1. **Médias de a11y** (1.1–1.3): pequenas, mecânicas, e o projeto tem barra AA — ~30 min.
2. **A2 + A6** (mesma família das médias, mesmos arquivos abertos).
3. **F4** (aria-labels i18n) + **2.4** (chaves mortas) — limpeza de i18n num commit só.
4. **F1** (tipo no reagendar) e **F3** (mapa) — coerência de produto/doc.
5. Cauda: F2, F5, A3–A5, A7, D1–D3, 2.5 — quando tocar nos arquivos por outro motivo.
