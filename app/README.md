# @crp/app — componentes shadcn/ui tematizados pelo CRP DS

App React (Vite + TypeScript + Tailwind v4) que usa os componentes do **shadcn/ui** tematizados
**100% pelos tokens** do `@crp/design-tokens` — multi-marca (CRP / Marca B) e claro/escuro saem de graça.

## Como funciona o tema

- O app depende do pacote (`"@crp/design-tokens": "file:.."`) e importa o contrato em
  [src/index.css](src/index.css): `@import "@crp/design-tokens/tokens.css";`.
- O `@theme inline` mapeia o contrato CRP (`--background`, `--primary`, …) para o tema do Tailwind v4,
  então os utilitários do shadcn (`bg-primary`, `text-foreground`, `ring-ring`, `rounded-lg`…) resolvem
  para os tokens do CRP **em runtime**.
- Trocar **marca/tema** = alternar `[data-brand="marca-b"]` e `.dark` no `<html>` (mesmo mecanismo dos previews).
- **Nunca** se edita cor/raio à mão: muda no Token Studio → `npm run build` na raiz → o app segue.

## Rodar

```bash
# 1) na RAIZ do repo: gerar o dist dos tokens (o app importa @crp/design-tokens/tokens.css)
npm run build

# 2) neste diretório (app/):
npm install
npm run dev        # abre o Vite
npm run build      # typecheck + build de produção
```

## Componentes

Adicionados via CLI oficial do shadcn (`npx shadcn@latest add <comp>`), que escreve os fontes em
`src/components/ui/` — são seus, versionáveis e atualizáveis pelo CLI. Não reimplementamos shadcn:
usamos o de verdade, só trocamos a fonte do tema para os tokens do CRP.
