# Integração React — `<Icon>` + Code Connect (referência)

Estes arquivos **moram no app React**, não neste pacote de tokens. Aqui ficam como **referência versionada
p/ copiar** — neste repo eles **não compilam** (não há `react`/`lucide-react` instalados; é esperado).

Objetivo: **paridade 1:1** entre o componente `lucide/<nome>` do Figma (gerado pelo plugin) e um `<Icon>`
no código — mesmos nomes, mesmos tamanhos, mesmo stroke.

## 1) Componente `<Icon>`

Copie [`Icon.tsx`](./Icon.tsx) para o app e instale a lib oficial:

```bash
npm i lucide-react
```

```tsx
import { Icon } from '@/components/Icon';

<Icon name="arrow-right" size={16} />
<Icon name="chevron-down" size={24} style={{ color: 'var(--primary-foreground)' }} />
```

### Paridade com o Figma

| | Figma (plugin) | React (`<Icon>`) |
|---|---|---|
| Nome | SET `lucide/arrow-right` | `name="arrow-right"` (kebab, idêntico) |
| Tamanho | `Size=16/20/24/32` → `icon/sm…xl` | `size={16\|20\|24\|32}` |
| Stroke | bind em `border-width/*` (16/20→1.5px, 24→2px, 32→3px) | mesmo stroke **absoluto** (convertido p/ o viewBox do Lucide) |
| Cor | bind em `primary-foreground` | `currentColor` → aponte p/ a var do token |

> **Stroke:** o Lucide usa `strokeWidth` em unidades do viewBox (24), que **escala** com o `size`. O `<Icon>`
> converte o valor **absoluto** (px) p/ bater com o Figma: `sw = abs · 24 / size`. Passe `strokeWidth` p/ sobrepor.

> ⚠ **Aliases:** o `lucide-react` só conhece os nomes **canônicos**. Mantenha o **"Ocultar aliases" ligado**
> no plugin (padrão) — assim os nomes do Figma (`lucide/<nome>`) batem com `IconName`. Se um nome alias
> vazar, o TypeScript acusa e o ícone não renderiza (falha segura, não quebra).

### Sem `lucide-react`?
Alternativa: importe os SVGs do pacote **`lucide-static`** (`lucide-static/icons/<nome>.svg`) via SVGR/`?react`
e renderize com `currentColor`. Mas `lucide-react` é o caminho idiomático (nomes idênticos, tree-shaking,
sem bundlar 1962 SVGs).

## 2) Code Connect (Dev Mode mostra o snippet)

No Dev Mode do Figma, clicar num ícone passa a mostrar **`<Icon name="…" size={…} />`** em vez de CSS genérico.
Como há **1 ComponentSet por ícone** (~1962), os mapeamentos são **gerados** — não escritos à mão.

Tudo pronto neste diretório (copie p/ o app):
[`Icon.tsx`](./Icon.tsx) · [`gen-code-connect.mjs`](./gen-code-connect.mjs) (gerador) ·
[`figma.config.json`](./figma.config.json) (config) · [`Icon.figma.tsx`](./Icon.figma.tsx) (exemplo de 1 ícone, **sobrescrito** pelo gerador).

### Passo a passo

1. **Publique a lib** de ícones no Figma — painel **Assets → Publish**. (Sem publicar, não há node-ids → o gerador avisa e para.)
2. **File key:** está na URL do arquivo → `figma.com/design/`**`<FILE_KEY>`**`/<nome>?node-id=…`.
3. **Token:** Figma → Settings → **Personal access tokens** (escopo de leitura de arquivo). Não comite o token.
4. No app: `npm i -D @figma/code-connect`
5. **Gere os mapeamentos** (lê os `lucide/*` publicados via API e escreve `Icon.figma.tsx`):
   ```bash
   FIGMA_FILE_KEY=<FILE_KEY> FIGMA_TOKEN=figd_xxx node gen-code-connect.mjs
   ```
6. **Publique o Code Connect:** `npx figma connect publish`

Cada bloco gerado fica assim — mesmo `<Icon>`, um nó do Figma por ícone, `Size` como enum:
```tsx
figma.connect(Icon, 'https://www.figma.com/design/<FILE_KEY>/lucide?node-id=1-23', {
  props: { size: figma.enum('Size', { '16': 16, '20': 20, '24': 24, '32': 32 }) },
  example: ({ size }) => <Icon name="arrow-right" size={size} />,
});
```

> Estes arquivos moram no **repo do app React** (outro projeto) — aqui ficam só como **referência versionada**.
> Como sua conta Figma já está conectada via MCP, alternativa ao token: me mande a **URL da lib publicada**
> que eu puxo os node-ids direto.
