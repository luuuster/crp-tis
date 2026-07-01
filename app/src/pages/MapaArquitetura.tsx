/**
 * Arquitetura de Informação da plataforma TalentAI (página avulsa, entrada Vite própria — porta 5174 no dev).
 * IA no sentido estrito: como o conteúdo é ORGANIZADO, ROTULADO e NAVEGADO — o site map (hierarquia) + as
 * camadas clássicas (organização, rótulos, navegação, busca). NÃO é um user flow: o caminho de ponta a ponta
 * (a "jornada"/ciclo de valor) é um artefato separado (ver @/lib/jornada, p/ a futura tela de User Flow).
 *
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA (headings + listas/árvore reais; cor nunca como
 * único portador de significado — sempre acompanha rótulo + ícone).
 */
import type { LucideIcon } from 'lucide-react'
import {
  Blocks, Bot, Brain, Briefcase, Building2, Calendar, CheckCircle2, ClipboardList, Compass, FileText, FolderTree,
  KanbanSquare, KeyRound, LayoutDashboard, LayoutGrid, Link2, LockKeyhole, Network, Search, Settings, Tag, UserPlus,
  UserRound, Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD, toneBadge, type Tone } from '@/lib/surfaces'
import { DocShell } from '@/components/DocShell'
import { Badge } from '@/components/ui/badge'

type Sub = { path: string; desc?: string }
type Item = { icon: LucideIcon; path: string; desc: string; subs?: Sub[] }
type Grupo = { nome: string; itens: Item[] }
type Produto = { nome: string; porta: string; icon: LucideIcon; tom: Tone; nav: string; grupos: Grupo[] }

// ── Produto: Recrutador (lado de dentro) ─────────────────────────────────────────────────────────────
const RECRUTADOR: Produto = {
  nome: 'Recrutador', porta: ':5173', icon: Building2, tom: 'primary',
  nav: 'Após o login, navega por abas — Workspace e Sistema.',
  grupos: [
    {
      nome: 'Workspace',
      itens: [
        {
          icon: LayoutDashboard, path: '/dashboard', desc: 'KPIs, gráficos e últimas entrevistas',
          subs: [{ path: '/dashboard/personalizar', desc: 'Personalizar widgets (arrastar, redimensionar, remover) + exportar CSV' }],
        },
        {
          icon: Briefcase, path: '/vagas', desc: 'Lista de vagas (busca + cards)',
          subs: [
            { path: '/vagas/nova', desc: 'Wizard de criação' },
            { path: '/vagas/nova/resumo', desc: 'Passo 1 — resumo da vaga' },
            { path: '/vagas/nova/perfil', desc: 'Passo 2 — perfil' },
            { path: '/vagas/nova/revisar', desc: 'Passo 3 — revisar, tom de voz e publicar' },
            { path: '/vagas/charlie', desc: 'Copiloto Charlie (IA): sugestões + revisão' },
            { path: '/vagas/:id', desc: 'Detalhe da vaga (read-only)' },
            { path: '/vagas/:id/editar', desc: 'Edição' },
          ],
        },
        {
          icon: Bot, path: '/entrevistas-ia', desc: 'Triagem — tabela de candidatos',
          subs: [{ path: '/entrevistas-ia/:id', desc: 'Detalhe (aderência, score, perguntas)' }],
        },
        {
          icon: Calendar, path: '/calendario', desc: 'Calendário mensal de entrevistas',
          subs: [
            { path: '/calendario/proximas', desc: 'Próximas entrevistas' },
            { path: '/calendario/reagendar', desc: 'Reagendar / cancelar (RH)' },
          ],
        },
        {
          icon: Users, path: '/banco-de-talentos', desc: 'Lista de candidatos (filtros + busca)',
          subs: [
            { path: '/banco-de-talentos/:id', desc: 'Perfil (histórico de processos)' },
            { path: '/banco-de-talentos/:id/processo', desc: 'Stepper de 5 fases (IA → RH → Teste → Gestor → Proposta)' },
            { path: '/banco-de-talentos/charlie', desc: 'Assistente Charlie (IA): ranking e próximas ações' },
          ],
        },
        {
          icon: KanbanSquare, path: '/funil', desc: 'Kanban de 5 colunas (reagendar nas etapas de entrevista)',
          subs: [{ path: '/funil/:id', desc: 'Detalhe do card — aprovar/reprovar move o card' }],
        },
      ],
    },
    {
      nome: 'Sistema',
      itens: [
        {
          icon: Settings, path: '/usuarios', desc: 'Lista de usuários (filtros)',
          subs: [
            { path: '/usuarios/novo', desc: 'Criar usuário' },
            { path: '/usuarios/:id', desc: 'Editar / desativar' },
          ],
        },
        { icon: Blocks, path: '/componentes', desc: 'Galeria do DS — tokens, a11y e marca/tema' },
      ],
    },
  ],
}

// ── Produto: Candidato (lado de fora) ────────────────────────────────────────────────────────────────
const CANDIDATO: Produto = {
  nome: 'Candidato', porta: ':5172', icon: UserRound, tom: 'secondary',
  nav: 'Entra por /acesso ou por um link público; navega por rotas e links.',
  grupos: [
    {
      nome: 'Entrada',
      itens: [
        { icon: UserPlus, path: '/cadastro', desc: 'Nome, e-mail, senha e currículo' },
        {
          icon: KeyRound, path: '/acesso', desc: 'Login (senha provisória)',
          subs: [
            { path: '/acesso/trocar-senha', desc: 'Trocar a senha provisória (1º acesso)' },
            { path: '/acesso/recuperar', desc: 'Esqueci a senha — informa o e-mail' },
            { path: '/acesso/recuperar/enviado', desc: 'Link de recuperação enviado' },
          ],
        },
        {
          icon: LockKeyhole, path: '/redefinir_senha', desc: 'Redefinir senha (alvo do link do e-mail)',
          subs: [{ path: '/redefinir_senha/sucesso', desc: 'Senha redefinida → painel' }],
        },
        { icon: Link2, path: '/linkpublico', desc: 'Vaga divulgada (LinkedIn etc.) — abre sem login' },
      ],
    },
    {
      nome: 'Área logada (abas)',
      itens: [
        { icon: LayoutGrid, path: '/painel', desc: 'Mural de vagas — busca, filtros, ordenação, cards e paginação' },
        { icon: ClipboardList, path: '/candidaturas', desc: 'Minhas candidaturas — em andamento (busca + progresso no funil)' },
        { icon: CheckCircle2, path: '/candidaturas_finalizadas', desc: 'Finalizadas — resultado (aprovada/não selecionada) + feedback' },
      ],
    },
    {
      nome: 'Página da vaga',
      itens: [
        {
          icon: FileText, path: '/descricao', desc: 'Documento da vaga + sobre a empresa',
          subs: [
            { path: '/descricao/inscricao', desc: 'Logado: modal confirmar · Deslogado: formulário público' },
            { path: '/descricao/inscricao/sucesso', desc: 'Candidatura enviada' },
          ],
        },
      ],
    },
    {
      nome: '2ª etapa',
      itens: [
        {
          icon: Brain, path: '/questionario', desc: 'Perguntas abertas + captcha',
          subs: [{ path: '/questionario/enviado', desc: 'Questionário enviado → volta ao mural' }],
        },
      ],
    },
  ],
}

// As quatro camadas clássicas de IA (organização, rótulos, navegação, busca) aplicadas à plataforma.
const CAMADAS: { icon: LucideIcon; titulo: string; desc: string }[] = [
  { icon: FolderTree, titulo: 'Organização', desc: 'Por público no topo (Recrutador × Candidato) e por tarefa dentro de cada um. Estrutura hierárquica (árvore).' },
  { icon: Tag, titulo: 'Rótulos', desc: 'Nomes de menu e rotas claros e consistentes — ex.: “Banco de talentos”, /funil, /descricao/inscricao.' },
  { icon: Compass, titulo: 'Navegação', desc: 'Recrutador navega por abas (Workspace · Sistema); candidato por rotas e links. A trilha da rota é o breadcrumb.' },
  { icon: Search, titulo: 'Busca', desc: 'Busca por cargo no mural e nas candidaturas (/painel, /candidaturas) e por candidato no Banco de talentos (/banco-de-talentos).' },
]

// ── Árvore do site map (caixas + conectores) ─────────────────────────────────────────────────────────
type Kind = 'produto' | 'aux' | 'grupo' | 'item'
type TreeData = { kind: Kind; label: string; badge?: string; tone?: Tone; icon?: LucideIcon; dashed?: boolean; lines?: string[]; children?: TreeData[] }

// Último segmento de uma rota (/a/b/c → c) — nas folhas, a posição na árvore já dá o contexto do pai.
const folha = (path: string) => path.split('/').filter(Boolean).pop() ?? path

// Transforma um Produto (grupos → itens → subs) na árvore de nós do site map. `aux` = página auxiliar
// (ex.: login) pendurada na raiz do ramo.
function produtoNode(p: Produto, aux?: string): TreeData {
  return {
    kind: 'produto', label: p.nome, badge: p.porta, tone: p.tom, icon: p.icon,
    children: [
      ...(aux ? [{ kind: 'aux' as const, label: aux, dashed: true }] : []),
      ...p.grupos.map((g): TreeData => ({
        kind: 'grupo', label: g.nome,
        children: g.itens.map((it): TreeData => ({
          kind: 'item', label: it.path, tone: p.tom, icon: it.icon, lines: it.subs?.map((s) => s.path),
        })),
      })),
    ],
  }
}

/** Rota em estilo breadcrumb: a barra e os segmentos-pai ficam esmaecidos; o último segmento (a "folha" da
 *  trilha) ganha destaque. Mono p/ leitura de rota. */
function Crumb({ path, strong = false }: { path: string; strong?: boolean }) {
  const segs = path.split('/').filter(Boolean)
  return (
    <span className="font-mono ty-body-sm">
      {segs.map((s, i) => {
        const last = i === segs.length - 1
        return (
          <span key={i}>
            <span className="text-muted-foreground/50">/</span>
            <span className={cn(last ? 'text-foreground' : 'text-muted-foreground', last && (strong ? 'font-semibold' : 'font-medium'))}>{s}</span>
          </span>
        )
      })}
    </span>
  )
}

// Caixa de um nó da árvore. Estilo por tipo (produto colorido, grupo cinza, item card com as páginas
// listadas dentro, aux tracejado) — hierarquia também por cor, mas sempre com rótulo (nunca só cor).
function TreeBox({ node }: { node: TreeData }) {
  const Icon = node.icon
  const tint =
    node.kind === 'produto' ? cn(toneBadge[node.tone ?? 'primary'], 'font-semibold')
    : node.kind === 'aux' ? 'border border-dashed border-border bg-muted/40 text-muted-foreground'
    : node.kind === 'grupo' ? 'bg-muted text-foreground'
    : 'bg-card text-foreground' // item
  return (
    <div title={node.label} className={cn('flex shrink-0 flex-col items-center gap-1 rounded-lg px-2.5 py-2.5 text-center shadow-sm', node.kind === 'item' ? 'w-40' : 'w-36', node.kind !== 'aux' && 'ring-1 ring-surface-ring', tint)}>
      {Icon && <Icon className="size-4.5" aria-hidden />}
      {node.kind === 'item' ? (
        <>
          <Crumb path={node.label} strong />
          {node.lines && node.lines.length > 0 && (
            <ul className="mt-1.5 w-full space-y-0.5 border-t border-border/60 pt-1.5 text-left">
              {node.lines.map((l) => (
                <li key={l} title={l} className="truncate font-mono ty-caption text-muted-foreground"><span className="text-muted-foreground/50">/</span>{folha(l)}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <span className={cn(node.kind === 'grupo' ? 'ty-label-sm uppercase tracking-wide' : 'ty-body-sm')}>{node.label}</span>
      )}
      {node.badge && <span className="font-mono ty-caption opacity-70">{node.badge}</span>}
    </div>
  )
}

type Pos = 'root' | 'first' | 'mid' | 'last' | 'only'

// Nó + conectores: linha que desce do pai, barramento horizontal entre irmãos e queda até a caixa. Os
// segmentos são spans com bg-border (token), decorativos (aria-hidden).
function TreeNode({ node, pos }: { node: TreeData; pos: Pos }) {
  const kids = node.children ?? []
  const top = pos !== 'root'
  const left = pos === 'mid' || pos === 'last'
  const right = pos === 'mid' || pos === 'first'
  return (
    <li className={cn('relative flex shrink-0 flex-col items-center px-2', top && 'pt-6')}>
      {top && <span aria-hidden className="absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 bg-border" />}
      {left && <span aria-hidden className="absolute top-0 left-0 h-px w-1/2 bg-border" />}
      {right && <span aria-hidden className="absolute top-0 right-0 h-px w-1/2 bg-border" />}
      <TreeBox node={node} />
      {kids.length > 0 && (
        <>
          <span aria-hidden className="h-6 w-px bg-border" />
          <ul className="flex items-start">
            {kids.map((k, i) => (
              <TreeNode key={k.label} node={k} pos={kids.length === 1 ? 'only' : i === 0 ? 'first' : i === kids.length - 1 ? 'last' : 'mid'} />
            ))}
          </ul>
        </>
      )}
    </li>
  )
}

export function MapaArquitetura() {
  return (
    <DocShell active="ia">
        {/* Hero */}
        <div className="max-w-2xl">
          <Badge variant="secondary" className="font-medium">Arquitetura de informação</Badge>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Como a plataforma se organiza</h1>
          <p className="mt-2 ty-body text-muted-foreground">
            A arquitetura de informação descreve como o conteúdo é <strong className="font-semibold text-foreground">organizado, rotulado e
            navegado</strong> — o site map e suas hierarquias. O caminho que a pessoa percorre numa tarefa (a jornada) é
            um <em>User Flow</em>, um artefato separado.
          </p>
        </div>

        {/* Site map (hierarquia / árvore) */}
        <section aria-labelledby="sitemap" className="mt-10">
          <h2 id="sitemap" className="ty-h4 text-foreground">Site map</h2>
          <p className="mt-1 ty-body-sm text-muted-foreground">
            Organização por público no topo — dois produtos na mesma plataforma — e por tarefa dentro de cada um.
          </p>

          {/* Raiz da árvore */}
          <div className={cn(CARD, 'mt-4 flex items-center gap-3 p-4')}>
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground"><Network className="size-5" /></span>
            <div className="min-w-0">
              <p className="ty-body font-semibold text-foreground">TalentAI <span className="font-normal text-muted-foreground">· plataforma (raiz)</span></p>
              <p className="ty-body-sm text-muted-foreground">esquema de organização: por público → 2 produtos</p>
            </div>
          </div>

          {/* Árvores (uma por produto) — caixas + conectores; rola na horizontal quando fica largo. */}
          <div className="mt-6 space-y-6">
            {[produtoNode(RECRUTADOR, '/login'), produtoNode(CANDIDATO)].map((raiz) => (
              // A árvore do Recrutador é larga (9 folhas numa linha) — rola na horizontal quando não cabe.
              // O fade nas bordas (mask, no wrapper interno p/ não desbotar o chrome do card) sinaliza
              // "há mais conteúdo p/ rolar" em vez de parecer cortado; simétrico e theme-agnóstico.
              <div key={raiz.label} className={cn(CARD, 'p-5 sm:p-6')}>
                <div className="overflow-x-auto [--fade:1.75rem] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_var(--fade),#000_calc(100%-var(--fade)),transparent)] [mask-image:linear-gradient(to_right,transparent,#000_var(--fade),#000_calc(100%-var(--fade)),transparent)]">
                  <ul aria-label={`Site map — ${raiz.label}`} className="mx-auto flex w-max justify-center px-1 pt-1">
                    <TreeNode node={raiz} pos="root" />
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Camadas da IA */}
        <section aria-labelledby="camadas" className="mt-12">
          <h2 id="camadas" className="ty-h4 text-foreground">Camadas da arquitetura</h2>
          <p className="mt-1 ty-body-sm text-muted-foreground">Os quatro sistemas clássicos de IA aplicados à plataforma.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAMADAS.map((c) => (
              <div key={c.titulo} className={cn(CARD, 'flex flex-col gap-2.5 p-5')}>
                <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-muted text-foreground"><c.icon className="size-4.5" /></span>
                <h3 className="ty-body-sm font-semibold text-foreground">{c.titulo}</h3>
                <p className="ty-body-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Legenda + nota */}
        <section aria-labelledby="legenda" className="mt-12">
          <h2 id="legenda" className="mb-4 ty-h4 text-foreground">Legenda</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
            {([
              { tom: 'primary', label: 'Produto do recrutador' },
              { tom: 'secondary', label: 'Produto do candidato' },
            ] as { tom: Tone; label: string }[]).map((l) => (
              <li key={l.label} className="flex items-center gap-2 ty-body-sm text-muted-foreground">
                <span aria-hidden className={cn('size-3.5 rounded-full', toneBadge[l.tom])} /> {l.label}
              </li>
            ))}
          </ul>
          <p className="mt-5 ty-caption text-muted-foreground">
            Site map + camadas de IA. A jornada de ponta a ponta (criação → contratação) é um <strong className="font-semibold text-foreground">User Flow</strong>,
            artefato separado. Versão visual de <span className="font-mono">docs/ARQUITETURA-INFORMACAO.md</span> · mockup sem backend ·
            multi-marca (CRP / Trevo) × claro/escuro · i18n pt-BR/en/es · WCAG 2.2 AA.
          </p>
        </section>
    </DocShell>
  )
}
