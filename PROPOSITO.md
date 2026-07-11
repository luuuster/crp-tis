# Para que serve este projeto

> **Em uma frase:** este repositório é um **mockup web navegável de alta fidelidade** (o TalentAI) que serve de
> **fonte da verdade visual e técnica** para o sistema real que virá — e que se **espelha no Figma com fidelidade
> medida**, para que design e desenvolvimento trabalhem sobre a mesma verdade.

---

## 1. O que ele é

Um sistema de recrutamento e seleção **de mentira** (dados mock, sem backend), construído **com o rigor de um
sistema de verdade**: design system com tokens versionados, acessibilidade WCAG 2.2 AA validada em CI,
componentes shadcn/Tailwind reais, quatro temas (2 marcas × claro/escuro), três aplicações (recrutador,
candidato e hub de documentação), i18n em 4 idiomas e uma ponte automatizada **código → Figma**.

Ele **não** é o produto final — e isso é uma decisão, não uma limitação. Autenticação, CAPTCHA e dados são
simulados de propósito ([SECURITY.md](SECURITY.md)); não há banco nem API. O valor está em tudo o que vem
**antes** do backend: o design, os padrões, os fluxos e a experiência — prontos, testados e navegáveis.

## 2. Os papéis que ele cumpre

### a) Visualizar o sistema rapidamente
Antes de investir no sistema real, o TalentAI permite **navegar** o produto: abrir vaga com copiloto de IA,
funil de contratação, triagem por IA, agendamento de entrevista pelo candidato, mural de vagas, perfil,
calendário. Fluxo por fluxo, tela por tela, com dados plausíveis — decisões de produto e UX são tomadas
vendo a coisa funcionar, não imaginando um wireframe.

### b) Ajudar o front-end do sistema real
Quando o sistema de verdade for construído, este repo é o **manual executável** do front:

- **Componentes prontos** (`app/src/components/ui/` = primitivas shadcn; `composicoes/` = organismos da
  plataforma; `pages/` = telas) com a API real (`variant × size` do cva) que as telas usam.
- **Padrões resolvidos**: foco visível, estados de hover/disabled/loading, máscaras, formulários com
  validação, i18n (pt-BR/en/es/pt-AO), paginação, empty states, skeletons, error boundaries.
- **Gates automatizados** que o front real pode herdar: tsc estrito, lint com regras do DS, ~350 testes,
  e2e Playwright com axe real, contraste por pixel e foco visível nos 4 temas.

### c) Acessibilidade como barra, não como etapa
A11y aqui é **fatal no CI**: contraste textual (≥4.5:1) e não-textual (≥3:1) medidos por pixel renderizado
nos 4 temas; axe estrutural em telas e overlays abertos; navegação por teclado; `prefers-reduced-motion`,
`forced-colors` e `prefers-contrast` tratados; manifesto de a11y por componente. O sistema real nasce
sabendo **exatamente** o que precisa cumprir — e com os testes que provam.

### d) Design System de verdade (o CRP DS)
Os tokens são a **única fonte da verdade** (`tokens/` em DTCG → Style Dictionary → `dist/` para
Tailwind v4/shadcn): cores OKLCH em 3 camadas (primitivo → contrato → componente), multi-marca
(CRP, Marca B) × claro/escuro trocáveis em runtime, tipografia, espaçamento, raios, ícones, motion.
Nenhuma cor ou medida é chumbada à mão — quem muda um token muda o produto inteiro, no web **e** no Figma.

### e) Espelhar tudo no Figma — fiel de verdade
A parte mais incomum do projeto: **o Figma é downstream do código**, não o contrário.

- `crp_plugins/` leva ao Figma os **tokens** (Variables, 4 modos), os **ícones** (biblioteca Lucide/Material
  componentizada), os **componentes** (ComponentSets bindados nas Variables) e as **telas**.
- As telas no Figma são **cópias medidas** do web (DOM real via Playwright: `getBoundingClientRect`,
  `getComputedStyle`, cores compostas) — nunca aproximação "no olho". Se o botão tem 40px no web,
  tem 40px no Figma; montadas com **instâncias de componentes** (atomic design), nunca desenho solto.
- Resultado: o designer trabalha no Figma com **os mesmos tokens, os mesmos componentes e as mesmas
  medidas** que o desenvolvedor vê no navegador. Handoff sem tradução, sem deriva.

### f) Padrões e documentação do sistema
Arquitetura de informação, user flow completo, handoff do front ([app/HANDOFF.md](app/HANDOFF.md)),
histórico de decisões e auditorias datadas ([docs/](docs/)). O "porquê" de cada escolha fica registrado.

## 3. Como as peças se conectam

```
                         tokens/ (DTCG — fonte da verdade)
                                      │  npm run build
                                      ▼
                            dist/ (theme.css, tokens.css)
                          ┌───────────┴───────────┐
                          ▼                       ▼
                 app/ (TalentAI)          crp_plugins/ (Figma)
             recrutador :5173             tokens → Variables
             candidato  :5172             ícones → biblioteca
             docs/galeria :5174           componentes → ComponentSets
                          │                telas → páginas montadas
                          │  medição (Playwright, DOM real)
                          └───────────► Figma = cópia MEDIDA do web
```

O ciclo de mudança: **token muda → web muda → Figma re-materializa**. Nunca o contrário, nunca à mão.

## 4. O que ele deliberadamente NÃO é

| Não é | Por quê |
|---|---|
| Sistema em produção | Sem backend/auth/dados reais — mockup por design |
| Protótipo descartável | O DS, os componentes, os testes e os padrões migram para o sistema real |
| Figma "inspirado" no web | O Figma é cópia **medida** — divergência é bug, não interpretação |
| Documentação estática | Tudo é executável e validado em CI; se a doc mente, o build quebra |

## 5. Para quem serve

- **UX/UI Designer** — trabalha no Figma com tokens/componentes idênticos aos do produto; a galeria
  (`:5174/componentes`) é o styleguide vivo; o mockup navegável é o campo de teste de UX.
- **Front-end** — copia padrões prontos e testados; herda a barra de a11y e os gates de CI.
- **Produto/stakeholders** — navegam o sistema antes de ele existir; decidem vendo.
- **Quem for construir o sistema real** — encontra aqui o contrato: o que o sistema deve **parecer**,
  como deve **se comportar** e o que deve **cumprir** (a11y, temas, i18n, estados).
