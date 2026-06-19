# Handoff — `@crp/app` (protótipo TalentAI / TIS)

> Documento de transferência para quem vai construir o **front-end de produção** a partir deste protótipo.
> Objetivo: você entender **tudo** — o que está sendo usado, **como** e **por quê** — sem precisar
> garimpar o código. Leitura ~20 min. Tudo aqui foi verificado contra o código real.

---

## Índice

1. [O que é isto (e o que NÃO é)](#1-o-que-é-isto-e-o-que-não-é)
2. [Como rodar](#2-como-rodar)
3. [Arquitetura em uma página](#3-arquitetura-em-uma-página)
4. [Stack — o quê e por quê](#4-stack--o-quê-e-por-quê)
5. [Estrutura de pastas](#5-estrutura-de-pastas)
6. [Mapa das telas](#6-mapa-das-telas)
7. [Camada de dados (mockup) — onde plugar o backend](#7-camada-de-dados-mockup--onde-plugar-o-backend)
8. [Design System e tokens](#8-design-system-e-tokens)
9. [Convenções inegociáveis (o porquê)](#9-convenções-inegociáveis-o-porquê)
10. [Internacionalização (i18n)](#10-internacionalização-i18n)
11. [Componentes](#11-componentes)
12. [Qualidade: testes e portões (gates)](#12-qualidade-testes-e-portões-gates)
13. [Arquivos de configuração](#13-arquivos-de-configuração)
14. [Roadmap "tornar real"](#14-roadmap-tornar-real)
15. [Pegadinhas (gotchas)](#15-pegadinhas-gotchas)
16. [Glossário](#16-glossário)

---

## 1. O que é isto (e o que NÃO é)

**TalentAI** (marca exibida como **TIS**; a segunda marca de demonstração é **Trevo**) é um protótipo de
uma plataforma de **RH / recrutamento assistido por IA**: cria vagas, tria currículos por IA, agenda
entrevistas, gerencia o banco de talentos e os usuários.

**É um MOCKUP de propósito.** Foi feito para ser **pixel-fiel, acessível e navegável** — mas **não tem
backend**. Não há API, banco de dados nem autenticação real. Os dados são constantes em memória e a
"sessão" vive no `localStorage`.

| É | NÃO é |
|---|---|
| Front-end React completo e tematizado | App conectado a backend |
| UI/UX/a11y de produção (WCAG 2.2 AA) | Persistência real / API |
| Fluxos navegáveis com dados mock | Autenticação de verdade |
| Referência visual e de comportamento | Roteamento por URL (não há `react-router`) |

**Seu trabalho ("front-end verdadeiro")** normalmente é: **manter esta UI** e **trocar a camada de dados
mock por chamadas de API reais**, adicionar **roteamento**, **autenticação** e **observabilidade**. A
arquitetura já foi desenhada para isso — veja a [seção 7](#7-camada-de-dados-mockup--onde-plugar-o-backend)
e o [roadmap](#14-roadmap-tornar-real). Se o plano for reescrever em outro stack, este repo é a
**referência canônica** de telas, tokens e regras de a11y.

---

## 2. Como rodar

São **dois pacotes** no monorepo: o **Design System** (raiz, `@crp/design-tokens`) e este **app**
(`app/`, `@crp/app`). O app importa o CSS **gerado** do DS, então o DS precisa ser buildado primeiro.

```bash
# pré-requisitos: Node >= 20 (o pacote de tokens pede >= 22)

# 1) NA RAIZ do repo — gera dist/ dos tokens (o app importa @crp/design-tokens/tokens.css)
npm install
npm run build

# 2) DENTRO de app/
cd app
npm install
npm run dev        # Vite em http://localhost:5173

# credenciais de DEMO (tela de login):
#   recrutador@talentai.com  /  talentai123
```

Scripts do app ([app/package.json](package.json)):

| Script | O que faz |
|---|---|
| `npm run dev` | Vite (dev server, HMR) |
| `npm run build` | `tsc --noEmit` + `vite build` (produção) |
| `npm run typecheck` | só checagem de tipos |
| `npm run lint` | ESLint em `src/` (inclui a regra própria do DS) |
| `npm run test` | Vitest (unit) |
| `npm run e2e` | Playwright (a11y, contraste, foco, screenshots) |
| `npm run verify` | `lint && test && build && e2e` — o portão completo |

> Se mudar **tokens** (cor, raio, tipografia), rode `npm run build` **na raiz** de novo: o app lê o
> `dist/` do DS. Nunca edite cor/raio no app à mão (ver [seção 9](#9-convenções-inegociáveis-o-porquê)).

---

## 3. Arquitetura em uma página

```
main.tsx (bootstrap)
 ├─ import '@crp/design-tokens/tokens.css'   → contrato de tokens (:root / .dark / [data-brand])
 ├─ import './index.css'                      → Tailwind v4 + @theme inline (mapeia tokens → utilitários)
 ├─ import './i18n'                           → react-i18next (pt-BR padrão + en + es), síncrono
 ├─ initTelemetry()                           → handlers globais de erro → lib/telemetry.ts
 └─ <StrictMode><App/></StrictMode>

App.tsx (a "casca" e o roteador-por-estado)
 ├─ estado: brand ('crp'|'marca-b') · mode ('light'|'dark') · view (qual tela) — PERSISTIDOS no localStorage
 ├─ aplica tema no <html>: classList .dark + atributo [data-brand="marca-b"]
 ├─ providers globais: <TooltipProvider> + <Toaster> (sonner) + <ErrorBoundary>
 ├─ NÃO logado → LoginPage / RegisterPage (+ dock flutuante de marca/tema/idioma)
 └─ logado → <Tabs> (navegação por estado, sem URL) com forceMount:
       Dashboard · JobGenerator(Vagas) · EntrevistasIA · Entrevistas · Candidatos · Usuarios · Showcase
       cada tela recebe brand/mode + callbacks de navegação por props

Por dentro de cada tela "logada":
 └─ <AppShell> (components/shell) = Sidebar (menu) + topbar (marca/tema/idioma/conta) + <main>
       └─ conteúdo da página (lista/detalhe) consome DADOS via lib/useMockData
```

**Decisões-chave:**

- **Sem `react-router`.** A navegação é **estado** em [src/App.tsx](src/App.tsx) (`view`), renderizada
  por `<Tabs forceMount>` (as telas ficam montadas e escondidas → estado interno preservado ao alternar).
  Um app de produção provavelmente troca isto por um router de verdade (ver [roadmap](#14-roadmap-tornar-real)).
- **Tema sem framework de tema.** `brand`/`mode` são estado no `App.tsx`, aplicados como `class="dark"` e
  `data-brand` no `<html>`. Os **tokens CSS** fazem o resto — zero cor escrita à mão.
- **`brand`/`mode` descem por props** (prop-drilling) até as telas e o `AppShell`. Não há Context para isso
  (decisão de simplicidade do protótipo).
- **Persistência da demo:** `localStorage` guarda `crp.view`, `crp.brand`, `crp.mode`, `crp.locale` e o
  layout do dashboard. Um F5 não desloga nem reseta o tema.

---

## 4. Stack — o quê e por quê

Versões em [app/package.json](package.json). As escolhas seguem o padrão **shadcn/ui** (Radix + Tailwind + cva).

| Biblioteca | Para quê | Por quê esta |
|---|---|---|
| **React 19** + **react-dom** | framework de UI | base do projeto; segue as **regras do React Compiler** via lint (ver gotchas) |
| **Vite 8** + `@vitejs/plugin-react` | dev server + build | rápido, padrão atual do ecossistema |
| **TypeScript** (strict) | tipos | `strict` + `noUnusedLocals`; pega bug antes do runtime |
| **Tailwind v4** + `@tailwindcss/vite` | estilo utilitário | v4 usa `@theme inline` — é o que liga os tokens do DS aos utilitários (`bg-primary` etc.) |
| **`@crp/design-tokens`** (`file:..`) | tokens do DS | fonte única de cor/raio/tipografia/sombra, multi-marca × claro/escuro |
| **radix-ui** / `@radix-ui/react-slot` / **`@base-ui/react`** | primitivos headless | base acessível dos componentes shadcn (foco, teclado, ARIA prontos) |
| **class-variance-authority** (cva) | variantes de classe | define `variant`/`size` dos componentes (padrão shadcn) |
| **clsx** + **tailwind-merge** | `cn()` (lib/utils.ts) | mescla classes e resolve conflito do Tailwind |
| **lucide-react** | ícones | conjunto coeso; combina com o sistema de ícones do DS |
| **recharts** | gráficos | barras/área do Dashboard (único lugar com cor "crua" — Recharts não usa classes) |
| **react-hook-form** + `@hookform/resolvers` + **zod** | formulários + validação | login, cadastro, wizard de vaga, convite de usuário |
| **react-i18next** + **i18next** | i18n | pt-BR/en/es, tipado, sem flicker (síncrono) |
| **sonner** | toasts | feedback não-bloqueante (sucesso/erro/info) |
| **date-fns** + **react-day-picker** | datas / calendário | agenda de entrevistas, date-picker |
| **cmdk** | command palette | busca de comandos (vitrine) |
| **embla-carousel-react**, **vaul**, **react-resizable-panels**, **input-otp** | carousel, drawer mobile, painéis redimensionáveis, OTP | usados em telas/vitrine específicas |
| **next-themes** | (dependência presente) | o tema é alternado **manualmente** no `App.tsx`; o `Toaster` recebe `theme={mode}` |

> **Dev/qualidade:** `vitest` + `@testing-library/*` (unit), `@playwright/test` + `@axe-core/playwright` +
> `axe-core` (e2e a11y), `eslint` + `typescript-eslint` + `eslint-plugin-jsx-a11y` +
> `eslint-plugin-react-hooks` (inclui o **React Compiler**) + a regra própria `crp/design-tokens`.

---

## 5. Estrutura de pastas

```
app/
├─ HANDOFF.md            ← este arquivo
├─ README.md             ← resumo curto (tema + como rodar)
├─ index.html            ← shell HTML (viewport-fit=cover p/ safe-area iOS)
├─ src/
│  ├─ main.tsx           ← bootstrap (tokens.css, i18n, telemetria, render)
│  ├─ App.tsx            ← casca + navegação-por-estado + tema (brand/mode/view)
│  ├─ config.ts          ← env (import.meta.env.VITE_*) — ponto único de config
│  ├─ index.css          ← @import tokens + @theme inline (tokens → utilitários Tailwind)
│  │
│  ├─ components/
│  │  ├─ ui/             ← shadcn/ui VENDORIZADO (não reinventar — ver seção 11)
│  │  │  └─ demos/       ← demonstrações de cada componente (alimentam a vitrine)
│  │  ├─ shell/AppShell  ← Sidebar + topbar + <main> (casca das telas logadas)
│  │  ├─ auth/           ← AuthLayout, BrandPanel, Logo (telas de login/cadastro)
│  │  ├─ page.tsx        ← PRIMITIVOS de página (PageContainer, Panel, StatCard, StatusBadge…)
│  │  ├─ ErrorBoundary, ExportButton, LanguageSelect, confirm-dialog
│  │
│  ├─ pages/             ← UMA pasta/arquivo por TELA (ver seção 6)
│  │  ├─ Dashboard.tsx        + dashboard/   (widgets modulares, data mock)
│  │  ├─ JobGenerator.tsx     + job-generator/  (wizard de vaga + Charlie)
│  │  ├─ VagasList.tsx        + vagas.logic.ts
│  │  ├─ EntrevistasIA.tsx
│  │  ├─ Candidatos.tsx       + candidatos/  + candidatos.logic.ts
│  │  ├─ Entrevistas.tsx      + entrevistas.logic.ts
│  │  ├─ Usuarios.tsx
│  │  ├─ Login/RegisterPage.tsx
│  │  └─ Showcase.tsx         (vitrine de componentes do DS)
│  │
│  ├─ lib/               ← infra e utilitários (ver tabela abaixo)
│  ├─ hooks/use-mobile.ts
│  └─ i18n/              ← react-i18next: index.ts + locales/{pt-BR,en,es}/*.json + parity.test.ts
│
├─ e2e/                  ← Playwright (a11y, contraste, foco, screenshots)
├─ eslint-rules/crp-tokens.js   ← regra de lint própria do DS
└─ (vite/tsconfig/eslint/playwright/components).config…
```

**`lib/` — utilitários (o "porquê" de cada um):**

| Arquivo | O que faz |
|---|---|
| `utils.ts` | `cn()` (clsx + tailwind-merge) — usado em todo `className` condicional |
| `useMockData.ts` | **camada de dados mock** — ciclo `{data, loading, error, retry, setData}` (ver seção 7) |
| `useAsync.ts` | estado de operação assíncrona de **mutação** (`run/retry/reset`) — já pronto p/ API real |
| `telemetry.ts` | captura de erro plugável (console hoje; **ponto de plug do Sentry** marcado) |
| `surfaces.ts` | superfícies/tinturas reutilizáveis (`CARD`, `FIELD`, `FLOAT`, `toneBadge`) |
| `focus.ts` | anel de foco padronizado (`focusRing`, `focusRingOnPrimary`) |
| `types.ts` | tipos de domínio compartilhados (ex.: `StatusVaga`) |
| `usePagination.ts` | paginação de listas (saneia página ao filtrar) |
| `exportCsv.ts` | exporta listas filtradas em CSV (botão "Exportar") |
| `datetime.ts` / `format.ts` / `hash.ts` / `avatar.ts` | formatação de número/data por locale, iniciais, hash determinístico (dados sintéticos estáveis), tintura de avatar |
| `vaga.tsx` | modelo da Vaga + renderer read-only do documento da vaga |

---

## 6. Mapa das telas

Cada tela é navegável após o login (menu lateral). "Dados mock" indica **onde** ficam os dados que você
trocará por API.

| Tela | Arquivo(s) | O que faz | Dados mock |
|---|---|---|---|
| **Login / Cadastro** | `pages/LoginPage.tsx`, `RegisterPage.tsx`, `components/auth/*` | auth **simulada** (RHF + zod; credencial fixa de demo) | credenciais em `LoginPage.tsx` |
| **Dashboard** | `pages/Dashboard.tsx`, `pages/dashboard/*` | dashboard **modular**: modo "Personalizar" adiciona/remove/redimensiona widgets; layout salvo no `localStorage` | `dashboard/data.ts` |
| **Vagas (Gerador)** | `pages/JobGenerator.tsx`, `pages/VagasList.tsx`, `pages/job-generator/*`, `vagas.logic.ts` | lista de vagas + **wizard** (Briefing → Perfil → Revisão) + **Charlie** (motor de consistência da vaga) | `VagasList.tsx` (`VAGAS_INICIAL`), `vagas.logic.ts` |
| **Entrevistas IA** | `pages/EntrevistasIA.tsx` | triagem de currículos pela IA; aprovar/reprovar em lote; detalhe do candidato (score, aderência, perguntas) | `CANDIDATOS_INICIAL` no próprio arquivo |
| **Banco de talentos** | `pages/Candidatos.tsx`, `pages/candidatos/*`, `candidatos.logic.ts` | pool de candidatos, perfil, **histórico de processos** (gerado deterministicamente), assistente Charlie de match | `candidatos/types.ts` (`CANDIDATOS_INICIAL`), `builders.ts` |
| **Entrevistas (Agenda)** | `pages/Entrevistas.tsx`, `entrevistas.logic.ts` | calendário, agendamento, reagendar/cancelar | `entrevistas.logic.ts` |
| **Usuários** | `pages/Usuarios.tsx` | gestão de usuários: papéis (Admin/Recrutador/Gestor), convite, ativar/desativar | `USUARIOS_INICIAL` no arquivo |
| **Componentes (Vitrine)** | `pages/Showcase.tsx`, `components/ui/demos/*` | **styleguide vivo**: galeria de todos os componentes do DS nos 4 temas. Use isto para ver o que já existe pronto. | `demos/*` |

**O "Charlie"** (em Vagas e no Banco de talentos) é um **assistente** apresentado como IA. No protótipo o
"motor" é **lógica determinística** em [pages/job-generator/charlie-review.ts](src/pages/job-generator/charlie-review.ts)
(ex.: detecta salário abaixo do piso de mercado para a senioridade, jornada incompatível com a modalidade).
No produto, isto é o ponto natural para uma chamada de **LLM**.

---

## 7. Camada de dados (mockup) — onde plugar o backend

**Este é o capítulo mais importante para o "tornar real".** A arquitetura já isola os dados num único
formato, igual ao de um hook de `fetch`.

### 7.1 Leitura de listas — `useMockData`

Toda tela de lista usa [lib/useMockData.ts](src/lib/useMockData.ts):

```ts
const { data, loading, error, setData, retry } = useMockData('vagas', () => VAGAS_INICIAL, [])
```

- Devolve **exatamente** `{ data, loading, error, retry, setData }` — a **mesma forma** que um hook de
  dados reais teria. Por isso, **trocar por API não muda as telas**.
- Simula `loading` (skeleton na 1ª visita), `error` (abra a URL com `?erro=1`) e mutação local (`setData`).
- **Como tornar real:** substitua o corpo por um `fetch`/React Query/SWR mantendo a mesma assinatura. Em
  vez de `() => VAGAS_INICIAL`, o `load` vira uma função assíncrona que chama a API. As páginas continuam iguais.

### 7.2 Mutações — `useAsync`

[lib/useAsync.ts](src/lib/useAsync.ts) já existe para operações de escrita: `{ data, loading, error, run, retry, reset }`,
com guarda de desmontagem e captura de erro na telemetria. Hoje as mutações (fechar vaga, convidar
usuário) fazem `setData(local)`; no produto, chame a API via `run()` e atualize no sucesso.

### 7.3 Onde estão os dados mock

Cada tela tem sua constante `*_INICIAL` (ou `data.ts`). Veja a coluna "Dados mock" na
[seção 6](#6-mapa-das-telas). Substitua cada um pela resposta da API correspondente.

### 7.4 Sessão e persistência (localStorage)

| Chave | Conteúdo |
|---|---|
| `crp.view` | última tela aberta |
| `crp.brand` / `crp.mode` | marca / claro-escuro |
| `crp.locale` | idioma |
| (layout do dashboard) | widgets escolhidos — `pages/dashboard/useDashboardLayout.ts` |

### 7.5 Telemetria / erros

[lib/telemetry.ts](src/lib/telemetry.ts) centraliza captura de erro (usada pelo `ErrorBoundary`,
`useAsync` e handlers globais). Hoje loga no console; quando `VITE_SENTRY_DSN` existir, é **ali** que o
Sentry entra (linha já marcada). Config de env em [src/config.ts](src/config.ts).

---

## 8. Design System e tokens

O app **não tem cores próprias** — tudo vem do pacote `@crp/design-tokens` (na raiz do repo). Detalhes
completos do pipeline no [README da raiz](../README.md). O essencial para o front-end:

- **Contrato de tokens** (`@crp/design-tokens/tokens.css`) define variáveis CSS sob seletores de tema:

  | Tema | Seletor |
  |---|---|
  | CRP · claro | `:root` |
  | CRP · escuro | `.dark` |
  | Marca B · claro | `[data-brand="marca-b"]` |
  | Marca B · escuro | `[data-brand="marca-b"].dark` |

- [src/index.css](src/index.css) faz o `@theme inline` do Tailwind v4: mapeia o contrato (`--primary`,
  `--background`, `--radius`…) para os utilitários (`bg-primary`, `text-foreground`, `rounded-lg`…). Então
  **toda classe Tailwind de cor/raio resolve para um token** e responde a `.dark`/`[data-brand]`
  automaticamente.
- **Fonte da verdade dos tokens = Token Studio (Figma)**, versionado em `tokens/*.json`, buildado para
  `dist/`. **Nunca** edite `dist/` nem cor à mão. Para mudar uma cor: Token Studio → `npm run build` (raiz).
- **Marcas:** CRP (azul, exibida como "TIS") e Marca B (verde, exibida como "Trevo"). Cada uma tem
  rampa/fontes próprias nos tokens; a troca é só `data-brand`.

---

## 9. Convenções inegociáveis (o porquê)

Estas regras são levadas a sério (várias são **validadas em CI e falham o build**). Respeite-as ao evoluir.

1. **Acessibilidade WCAG 2.2 AA — fatal.** Contraste de texto (≥ 4.5:1) e não-texto (≥ 3:1), foco visível,
   teclado e ARIA. Validado por `axe.test` (unit) + e2e (`a11y`, `contrast`, `focus-visible`) nos **4 temas**.
   *Por quê:* é um diferencial do produto e quebrar é regressão silenciosa cara.

2. **Token-driven — sem cor chumbada.** Use sempre classes de token (`bg-primary`, `text-foreground`,
   `ring-surface-ring`…). Uma **regra de ESLint própria** ([eslint-rules/crp-tokens.js](eslint-rules/crp-tokens.js))
   **proíbe e falha o build** quando vê: hex/`rgb()`/`oklch()` cru, `ring-black/white`, e
   `text-<fill>` usado como cor de texto.

3. **Texto colorido usa a variante `-text`, não o fill.** `text-primary-text` (AA por tema), nunca
   `text-primary` (é cor de preenchimento; reprova contraste). Veja `toneBadge` em
   [lib/surfaces.ts](src/lib/surfaces.ts).

4. **Marca ≠ dado.** A paleta da marca (`primary`/`secondary`) é só para **identidade e ação** (logo, CTAs,
   ícones, foco). **Nunca** para codificar dado/status/categoria — senão trocar a marca repinta dados e
   "Aprovado" pode virar vermelho. Para categorias que precisam de cores distintas existe a **paleta de
   dados** em `badgeTone` ([components/page.tsx](src/components/page.tsx)): `blue`/`violet`/`teal` (tokens
   `chart-*`, fixos, não-marca). Semântico (verde=bom, âmbar=atenção, vermelho=ruim) é permitido e mantido.

5. **Tipografia:** base 16px, **mínimo 14px** (12px só via `.ty-caption`/`.ty-overline`). A regra de lint
   reprova `text-[<13px]`. Use as classes de escala `.ty-*` do DS.

6. **Sem borda preta/dura.** Bordas são `currentColor`/tokens (`border-border`, `ring-surface-ring`).

7. **Transições suaves.** Render condicional "estala"; prefira fade/ease. Respeite
   `prefers-reduced-motion` (use `motion-safe:`).

8. **Reuse os primitivos de página.** Antes de montar uma tela nova, use
   [components/page.tsx](src/components/page.tsx): `PageContainer`, `PageHeader`, `Panel`, `StatCard`,
   `DetailScreen`, `StatusBadge`, `Paginacao`, `EmptyState`, `ErrorState`, `TableSkeleton`. Eles já
   carregam o espaçamento, a a11y e os estados (loading/empty/erro).

9. **Estados completos.** Toda lista tem **carregando** (skeleton), **vazio** (com ação) e **erro** (com
   "tentar novamente"). Não entregue lista sem os três.

> Se um valor **não existe no DS**, **pare e alinhe** para criá-lo no DS — não chumbe no app.

---

## 10. Internacionalização (i18n)

Setup em [src/i18n/index.ts](src/i18n/index.ts). **pt-BR é a fonte**; en e es são traduções.

- **Só o "chrome" de UI é traduzido** (navegação, botões, rótulos, status, vazios, toasts, validações). A
  **prosa mockada** (análises da IA, bios, nomes) **não** é traduzida — é dado.
- **10 namespaces** × 3 locales: `common, nav, auth, dashboard, vagas, usuarios, candidatos,
  entrevistas-ia, entrevistas, gerador` (em `i18n/locales/<locale>/<ns>.json`).
- **Tipado:** [i18n/i18next.d.ts](src/i18n/i18next.d.ts) deriva os tipos da árvore pt-BR — chave errada
  **não compila**.
- **Paridade garantida:** [i18n/parity.test.ts](src/i18n/parity.test.ts) falha se os 3 locales não tiverem
  **exatamente as mesmas chaves**.
- **Padrão importante:** o **valor canônico** de status/etapa fica em **pt-BR** no estado e nos mapas de
  cor/comparação; só a **exibição** é traduzida (`t('status.Aberta')`). Não troque o valor canônico ao
  traduzir.
- Idioma persiste em `crp.locale` e reflete em `<html lang>`. Tradução é **síncrona** (sem flicker/Suspense).

**Para adicionar uma string:** adicione a chave nos **3** arquivos do namespace (pt-BR primeiro), use
`const { t } = useTranslation('<ns>')` e `t('chave')`. Rode `npm run test` (o parity test confere).

---

## 11. Componentes

- **`components/ui/` é shadcn/ui vendorizado** (adicionado via `npx shadcn@latest add <comp>`). São fontes
  **suas**, versionáveis — mas **não reinvente**: o padrão é usar o shadcn de verdade, só trocando a fonte
  do tema para os tokens do CRP. O ESLint **afrouxa** algumas regras só nessa pasta (para não divergir do
  upstream); o uso real é validado nas páginas + `axe.test`.
- **`components/page.tsx`** são os **primitivos de composição** de página (ver convenção #8). É o que você
  mais vai reusar.
- **`components/ui/demos/` + `pages/Showcase.tsx`** são a **vitrine** (styleguide vivo). **Abra a tela
  "Componentes" no app** para ver tudo que já existe pronto antes de criar algo novo.
- **`a11y-manifest.ts`** declara as garantias de a11y de cada componente (usado pela vitrine/sweep).

---

## 12. Qualidade: testes e portões (gates)

| Camada | Comando | O que garante |
|---|---|---|
| Tipos | `npm run typecheck` | TS strict, sem `any` solto, i18n tipado |
| Lint | `npm run lint` | bugs, a11y de wrapper, **e a regra do DS** (cor/tipografia) |
| Unit (21 arquivos) | `npm run test` | lógica (Charlie, paginação, datas, vagas), `axe.test` (a11y estrutural de todas as páginas nos temas), `parity.test` (i18n) |
| E2E (9 specs) | `npm run e2e` | `a11y` + `contrast` + `focus-visible` em **pixel real** nos 4 temas (crp/marca-b × claro/escuro), `screenshots` (captura p/ revisão) |
| Tudo | `npm run verify` | roda os quatro acima em sequência |

> O e2e leva ~10 min e sobe o **próprio** servidor (não usa o `dev` da 5173). Roda em Desktop Chrome + um
> spec mobile (390px). **Rode `npm run verify` antes de cada PR.**

No DS (raiz) há ainda `npm run check`, que valida **contraste dos tokens** nos 4 temas e **falha o build**
se algum par texto/fundo não passar AA.

---

## 13. Arquivos de configuração

| Arquivo | Para quê |
|---|---|
| `vite.config.ts` | Vite + `@vitejs/plugin-react` + Tailwind v4; alias `@`→`src`; `fs.allow` libera o `dist/` do DS (pasta pai); também configura o Vitest (jsdom) |
| `tsconfig.json` | TS strict + alias `@/*` → `src/*` |
| `eslint.config.js` | flat config: foco em **bug + a11y** (sem Prettier de propósito); plugins jsx-a11y, react-hooks (**React Compiler**) e a regra própria `crp/design-tokens: 'error'` |
| `eslint-rules/crp-tokens.js` | a regra própria (cor chumbada / fill-como-texto / tipografia < 14px) |
| `components.json` | config do CLI shadcn (Tailwind v4, cssVariables) |
| `playwright.config.ts` | e2e: projetos, servidor próprio, viewport mobile |
| `src/vite-env.d.ts` | tipos de `import.meta.env.VITE_*` |

---

## 14. Roadmap "tornar real"

Ordem sugerida para sair do protótipo:

1. **Camada de dados → API.** Troque o corpo de `useMockData` (ou cada `load`) por chamadas reais
   (`fetch`/React Query/SWR), mantendo a forma `{ data, loading, error, retry, setData }`. As telas não mudam.
   Use `useAsync` para as mutações.
2. **Roteamento.** Substitua a navegação-por-estado do `App.tsx` por um router de verdade
   (URLs, deep-link, voltar do navegador). Mapeie cada `view` para uma rota.
3. **Autenticação.** Troque a auth simulada do `LoginPage` por login real (token/sessão), proteja as views,
   e ligue o estado de "logado".
4. **Config & env.** Centralize endpoints/flags em [src/config.ts](src/config.ts) via `VITE_*`.
5. **Observabilidade.** Instale o Sentry no ponto já marcado em `telemetry.ts` (defina `VITE_SENTRY_DSN`).
6. **Limpar afordâncias de demo.** Remova: credencial fixa do login, `NOME` chumbado, parâmetros
   `?erro=1`/`?demoload`, e as constantes `*_INICIAL` (viram resposta de API).
7. **Manter os portões.** Conforme integra o backend, **mantenha `npm run verify` verde** — a11y, tipos e a
   regra de tokens são o que segura a qualidade.

**O que NÃO precisa refazer:** todo o front-end (telas, componentes, tema, i18n, formulários RHF+zod,
estados loading/empty/erro, a11y) já está pronto e é o ativo que você está recebendo.

---

## 15. Pegadinhas (gotchas)

- **Dois pacotes / ordem de build.** O app importa o **`dist/` gerado** do DS. Mudou token → `npm run build`
  na **raiz**. O `dist/` é **gitignored** (cada consumidor builda).
- **Regras do React Compiler (no lint).** O *transform* do compilador **não** está ligado no build; o que
  está ativo são as **regras** do `eslint-plugin-react-hooks` (v7), que forçam padrões compatíveis: **não
  ler refs em render**, **não fazer set-state em effect**. Por isso alguns padrões parecem estranhos de
  propósito — ex.: persistência é feita em **handlers** (escrita direta no `localStorage`), não em effects.
  Se o ESLint reclamar de "purity/set-state-in-effect", o caminho é mover para handler.
- **React Hook Form × React Compiler.** Em formulários, o compilador pode "pular" o componente (perf-hint,
  não bug) — há comentários explicando onde e por quê (ex.: `LoginPage.tsx`). Não tente "consertar".
- **StrictMode.** Em dev o React monta→desmonta→monta; por isso há guardas de montagem (`mountedRef`) — não
  remova.
- **Recharts é a exceção da cor crua.** Gráficos recebem `var(--chart-*)` como `fill` (Recharts não usa
  classes Tailwind), com `// eslint-disable` pontual. É o **único** lugar permitido.
- **Credenciais de demo** e dados mock são públicos no código — é um protótipo. Remova no produto.
- **Hook de commit "doctor".** O repo tem um pre-commit que checa **corrupção** de arquivo (não bloqueia
  edição legítima). Se aparecer no commit, é normal.
- **Windows/CRLF.** Avisos "LF will be replaced by CRLF" no git são inofensivos (normalização de fim de linha).

---

## 16. Glossário

| Termo | Significado |
|---|---|
| **TalentAI / TIS** | o produto; marca padrão (CRP, azul) exibida como "TIS" |
| **Trevo / Marca B** | segunda marca de demonstração (verde) — prova o multi-marca |
| **Charlie** | assistente "de IA" (revisão de vaga / match de candidato); hoje é lógica determinística |
| **DS** | Design System (`@crp/design-tokens`) — fonte de cor/raio/tipografia |
| **token** | variável de design (cor/raio/etc.) resolvida por tema; nunca cor crua |
| **contrato** | os tokens semânticos (nomes shadcn: `primary`, `background`, `border`…) que o app consome |
| **paleta de dados** | tons `blue`/`violet`/`teal` (tokens `chart-*`) para categorias — **não** a marca |
| **vitrine / Showcase** | a tela "Componentes" = styleguide vivo de tudo que existe pronto |
| **mockup / protótipo** | sem backend; dados em memória + `localStorage` |

---

*Dúvida sobre uma decisão específica? Os arquivos têm comentários densos explicando o **porquê** de cada
escolha não-óbvia — comece pelo arquivo da área e leia o cabeçalho.*
