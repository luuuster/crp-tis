/**
 * Usuários — gestão das pessoas que operam o sistema (admins, recrutadores, gestores, visualizadores):
 * convidar, editar função, desativar/reativar e reenviar convite. Reconstruída no DS (AppShell, CARD,
 * .ty-*, tokens) — mesmos padrões de tabela/filtros/paginação da lista de Vagas. Demo: dados mockados.
 *
 * 100% token-driven: badges de função e status usam as variantes -text (AA por tema), nada de cor à mão.
 */
import { useState } from 'react'
import { LayoutList, MailCheck, Pencil, Search, ShieldCheck, UserCheck, UserMinus, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { tintFor } from '@/lib/avatar'
import { usePagination } from '@/lib/usePagination'
import { AppShell } from '@/components/shell/AppShell'
import { PageContainer, PageHeader, StatCard, StatusBadge, Paginacao, type BadgeTone } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog'

type Funcao = 'Administrador' | 'Recrutador' | 'Gestor' | 'Visualizador'
type StatusU = 'Ativo' | 'Convite pendente' | 'Inativo'
type TipoPessoa = 'Pessoa Física' | 'Pessoa Jurídica'
type Usuario = { id: string; nome: string; email: string; funcao: Funcao; status: StatusU; ultimoAcesso: string; voce?: boolean; telefone?: string; cpf?: string; tipoPessoa?: TipoPessoa; nascimento?: string }

const USUARIOS_INICIAL: Usuario[] = [
  { id: '1', nome: 'Frank Lima', email: 'frank.lima@talentai.com', funcao: 'Administrador', status: 'Ativo', ultimoAcesso: 'agora', voce: true, telefone: '(11) 98765-4321', cpf: '123.456.789-00', tipoPessoa: 'Pessoa Física', nascimento: '12/03/1990' },
  { id: '2', nome: 'Carlos Mendes', email: 'carlos.mendes@talentai.com', funcao: 'Gestor', status: 'Ativo', ultimoAcesso: 'há 2 h' },
  { id: '3', nome: 'Marina Albuquerque', email: 'marina.albuquerque@talentai.com', funcao: 'Gestor', status: 'Ativo', ultimoAcesso: 'há 1 h' },
  { id: '4', nome: 'Rafael Tavares', email: 'rafael.tavares@talentai.com', funcao: 'Gestor', status: 'Ativo', ultimoAcesso: 'ontem' },
  { id: '5', nome: 'Beatriz Nunes', email: 'beatriz.nunes@talentai.com', funcao: 'Recrutador', status: 'Ativo', ultimoAcesso: 'há 3 h' },
  { id: '6', nome: 'Diego Farias', email: 'diego.farias@talentai.com', funcao: 'Recrutador', status: 'Ativo', ultimoAcesso: 'há 30 min' },
  { id: '7', nome: 'Camila Rocha', email: 'camila.rocha@talentai.com', funcao: 'Recrutador', status: 'Convite pendente', ultimoAcesso: '—' },
  { id: '8', nome: 'Lucas Andrade', email: 'lucas.andrade@talentai.com', funcao: 'Recrutador', status: 'Ativo', ultimoAcesso: 'há 5 h' },
  { id: '9', nome: 'Patrícia Gomes', email: 'patricia.gomes@talentai.com', funcao: 'Administrador', status: 'Ativo', ultimoAcesso: 'ontem' },
  { id: '10', nome: 'Thiago Moreira', email: 'thiago.moreira@talentai.com', funcao: 'Visualizador', status: 'Ativo', ultimoAcesso: 'há 2 dias' },
  { id: '11', nome: 'Juliana Castro', email: 'juliana.castro@talentai.com', funcao: 'Recrutador', status: 'Inativo', ultimoAcesso: '10/05/2026' },
  { id: '12', nome: 'André Pinto', email: 'andre.pinto@talentai.com', funcao: 'Visualizador', status: 'Convite pendente', ultimoAcesso: '—' },
  { id: '13', nome: 'Fernanda Dias', email: 'fernanda.dias@talentai.com', funcao: 'Gestor', status: 'Ativo', ultimoAcesso: 'há 4 h' },
  { id: '14', nome: 'Roberto Silva', email: 'roberto.silva@talentai.com', funcao: 'Recrutador', status: 'Inativo', ultimoAcesso: '22/04/2026' },
  { id: '15', nome: 'Aline Costa', email: 'aline.costa@talentai.com', funcao: 'Recrutador', status: 'Convite pendente', ultimoAcesso: '—' },
  { id: '16', nome: 'Marcelo Reis', email: 'marcelo.reis@talentai.com', funcao: 'Visualizador', status: 'Ativo', ultimoAcesso: 'há 6 dias' },
]

// Descrição de cada função — mostrada no select de convite/edição para deixar o escopo de acesso claro.
const FUNCOES: { value: Funcao; desc: string }[] = [
  { value: 'Administrador', desc: 'Acesso total: usuários, configurações e todas as vagas.' },
  { value: 'Recrutador', desc: 'Cria e gerencia vagas, candidatos e entrevistas.' },
  { value: 'Gestor', desc: 'Acompanha vagas e aprova candidatos do seu time.' },
  { value: 'Visualizador', desc: 'Apenas leitura de vagas e relatórios.' },
]

// Pílula de função: tom por função (variante -text, AA por tema). Cada função, um tom distinto.
const FUNCAO_TONE: Record<Funcao, BadgeTone> = {
  'Administrador': 'primary',
  'Recrutador': 'secondary',
  'Gestor': 'warning',
  'Visualizador': 'muted',
}
// Pílula de status (com ponto na cor corrente, via bg-current — herda a variante -text).
const STATUS_TONE: Record<StatusU, BadgeTone> = {
  'Ativo': 'success',
  'Convite pendente': 'warning',
  'Inativo': 'muted',
}

const FUNCAO_FILTROS = ['Todas', 'Administrador', 'Recrutador', 'Gestor', 'Visualizador'] as const
const STATUS_FILTROS = ['Todos', 'Ativo', 'Convite pendente', 'Inativo'] as const
const PER_PAGE = 10

// Máscaras BR (formatam enquanto digita): mantêm só dígitos e inserem a pontuação no formato esperado.
function soDigitos(v: string, max: number) { return v.replace(/\D/g, '').slice(0, max) }
function maskCPF(v: string) {
  const d = soDigitos(v, 11)
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`
  return d
}
function maskCNPJ(v: string) {
  const d = soDigitos(v, 14)
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`
  return d
}
function maskTel(v: string) {
  const d = soDigitos(v, 11)
  if (d.length === 0) return ''
  if (d.length < 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function maskData(v: string) {
  const d = soDigitos(v, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}


// Filtro de coluna (select compacto) — colunas Função e Status.
function ColFilter({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className="w-full font-normal"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  )
}

export function Usuarios({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_INICIAL)
  const [funcaoF, setFuncaoF] = useState<(typeof FUNCAO_FILTROS)[number]>('Todas')
  const [statusF, setStatusF] = useState<(typeof STATUS_FILTROS)[number]>('Todos')
  const [q, setQ] = useState('')
  const [desativar, setDesativar] = useState<Usuario | null>(null)
  const [reativarU, setReativarU] = useState<Usuario | null>(null)

  // Diálogo de convite/edição: editing=null → convidar; editing=usuário → editar.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<{ nome: string; email: string; telefone: string; cpf: string; tipoPessoa: TipoPessoa; nascimento: string; funcao: Funcao }>({ nome: '', email: '', telefone: '', cpf: '', tipoPessoa: 'Pessoa Física', nascimento: '', funcao: 'Recrutador' })

  // KPIs DERIVADOS dos dados (atualizam ao convidar/desativar) — números reais, não decorativos.
  const ativos = usuarios.filter((u) => u.status === 'Ativo').length
  const pendentes = usuarios.filter((u) => u.status === 'Convite pendente').length
  const admins = usuarios.filter((u) => u.funcao === 'Administrador').length

  const filtrados = usuarios.filter(
    (u) =>
      (funcaoF === 'Todas' || u.funcao === funcaoF) &&
      (statusF === 'Todos' || u.status === statusF) &&
      (u.nome.toLowerCase().includes(q.trim().toLowerCase()) || u.email.toLowerCase().includes(q.trim().toLowerCase())),
  )

  const { page, setPage, pageItems, total: totalPages, inicio } = usePagination(filtrados, PER_PAGE)
  const resetPage = () => setPage(1)

  const abrirConvite = () => { setEditing(null); setForm({ nome: '', email: '', telefone: '', cpf: '', tipoPessoa: 'Pessoa Física', nascimento: '', funcao: 'Recrutador' }); setDialogOpen(true) }
  const abrirEdicao = (u: Usuario) => { setEditing(u); setForm({ nome: u.nome, email: u.email, telefone: u.telefone ?? '', cpf: u.cpf ?? '', tipoPessoa: u.tipoPessoa ?? 'Pessoa Física', nascimento: u.nascimento ?? '', funcao: u.funcao }); setDialogOpen(true) }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const podeSalvar = form.nome.trim().length > 0 && emailValido
  // Documento e rótulo de data acompanham o Tipo de pessoa (PF → CPF/nascimento; PJ → CNPJ/abertura).
  const isPJ = form.tipoPessoa === 'Pessoa Jurídica'
  const docLabel = isPJ ? 'CNPJ' : 'CPF'
  const docPlaceholder = isPJ ? '00.000.000/0000-00' : '000.000.000-00'
  const maskDoc = isPJ ? maskCNPJ : maskCPF
  const dataLabel = isPJ ? 'Data de abertura' : 'Data de nascimento'

  const salvar = () => {
    if (!podeSalvar) return
    const dados = { nome: form.nome.trim(), email: form.email.trim(), telefone: form.telefone.trim(), cpf: form.cpf.trim(), tipoPessoa: form.tipoPessoa, nascimento: form.nascimento.trim(), funcao: form.funcao }
    if (editing) {
      setUsuarios((us) => us.map((x) => (x.id === editing.id ? { ...x, ...dados } : x)))
      toast.success(`Usuário "${dados.nome}" atualizado (demo).`)
    } else {
      const novo: Usuario = { id: `u-${usuarios.length + 1}-${dados.email}`, status: 'Ativo', ultimoAcesso: 'agora', ...dados }
      setUsuarios((us) => [novo, ...us])
      toast.success(`Usuário "${dados.nome}" cadastrado (demo).`)
    }
    setDialogOpen(false)
  }

  const confirmarDesativar = () => {
    if (!desativar) return
    setUsuarios((us) => us.map((x) => (x.id === desativar.id ? { ...x, status: 'Inativo', ultimoAcesso: 'inativo' } : x)))
    toast.success(`Acesso de "${desativar.nome}" desativado (demo).`)
    setDesativar(null)
  }
  const confirmarReativar = () => {
    if (!reativarU) return
    setUsuarios((us) => us.map((x) => (x.id === reativarU.id ? { ...x, status: 'Ativo', ultimoAcesso: 'agora' } : x)))
    toast.success(`Acesso de "${reativarU.nome}" reativado (demo).`)
    setReativarU(null)
  }
  const reenviar = (u: Usuario) => toast.info(`Convite reenviado para ${u.email} (demo).`)

  return (
    <AppShell active="usuarios" crumb="Usuários" onNavigate={onNavigate} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      <PageContainer>
        <PageHeader
          icon={Users}
          title="Usuários"
          desc="Gerencie quem tem acesso ao sistema e o que cada pessoa pode fazer. Convide novos membros, ajuste funções e controle o acesso da equipe."
        />

        {/* KPIs — números reais derivados da lista */}
        <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total de usuários" value={usuarios.length} />
          <StatCard icon={UserCheck} label="Ativos" value={ativos} />
          <StatCard icon={MailCheck} label="Convites pendentes" value={pendentes} />
          <StatCard icon={ShieldCheck} label="Administradores" value={admins} />
        </section>

        {/* Lista — filtros DENTRO do card, na barra de ferramentas da tabela */}
        <section aria-labelledby="lista-usuarios" className={cn(CARD, 'overflow-hidden')}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4 sm:p-5">
            <h2 id="lista-usuarios" className="flex items-center gap-2 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>
              <LayoutList className="size-5 shrink-0 text-primary-text" aria-hidden /> Equipe
              <span className="ty-body-sm font-normal text-muted-foreground tabular-nums">({filtrados.length})</span>
            </h2>
            <Button onClick={abrirConvite}><UserPlus aria-hidden /> Cadastro de usuário</Button>
          </div>

          <Table className="[&_:is(th,td):first-child]:pl-5 [&_:is(th,td):last-child]:pr-5">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Usuário</TableHead>
                <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Função</TableHead>
                <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Status</TableHead>
                <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Último acesso</TableHead>
                <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase text-right">Ações</TableHead>
              </TableRow>
              {/* Linha de FILTRO — barra de ferramentas (td, não th: não são cabeçalhos de coluna). Busca
                  alinhada à coluna Usuário; selects nas colunas Função e Status. */}
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableCell className="py-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input value={q} onChange={(e) => { setQ(e.target.value); resetPage() }} placeholder="Buscar nome ou e-mail…" aria-label="Buscar usuário por nome ou e-mail" className="h-8 pl-8 ty-body-sm font-normal" />
                  </div>
                </TableCell>
                <TableCell className="py-2"><ColFilter value={funcaoF} onChange={(v) => { setFuncaoF(v as (typeof FUNCAO_FILTROS)[number]); resetPage() }} options={FUNCAO_FILTROS} label="Filtrar por função" /></TableCell>
                <TableCell className="py-2"><ColFilter value={statusF} onChange={(v) => { setStatusF(v as (typeof STATUS_FILTROS)[number]); resetPage() }} options={STATUS_FILTROS} label="Filtrar por status" /></TableCell>
                <TableCell className="py-2" />
                <TableCell className="py-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-14 text-center ty-body-sm text-muted-foreground">Nenhum usuário encontrado com esses filtros.</TableCell>
                </TableRow>
              ) : (
                pageItems.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full ty-caption font-semibold', tintFor(u.nome))} aria-hidden>{iniciais(u.nome)}</span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate ty-body-sm font-medium text-foreground">
                            {u.nome}
                            {u.voce && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 ty-caption font-medium text-primary-text">você</span>}
                          </p>
                          <p className="truncate ty-caption text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3"><StatusBadge value={u.funcao} tones={FUNCAO_TONE} /></TableCell>
                    <TableCell className="py-3"><StatusBadge dot value={u.status} tones={STATUS_TONE} /></TableCell>
                    <TableCell className="py-3 ty-body-sm text-muted-foreground">{u.status === 'Inativo' && u.ultimoAcesso !== 'inativo' ? u.ultimoAcesso : u.status === 'Inativo' ? 'Sem acesso' : u.ultimoAcesso}</TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Editar ${u.nome}`} onClick={() => abrirEdicao(u)} className="text-muted-foreground hover:bg-primary/10 hover:text-primary-text"><Pencil /></Button>
                        {u.status === 'Convite pendente' ? (
                          <Button variant="ghost" size="icon-sm" aria-label={`Reenviar convite para ${u.nome}`} onClick={() => reenviar(u)} className="text-muted-foreground hover:bg-primary/10 hover:text-primary-text"><MailCheck /></Button>
                        ) : u.status === 'Inativo' ? (
                          <Button variant="ghost" size="icon-sm" aria-label={`Reativar acesso de ${u.nome}`} onClick={() => setReativarU(u)} className="text-muted-foreground hover:bg-success/10 hover:text-success-text"><UserCheck /></Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" aria-label={`Desativar acesso de ${u.nome}`} disabled={u.voce} onClick={() => setDesativar(u)} className="text-muted-foreground hover:bg-warning/10 hover:text-warning-text"><UserMinus /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginação — barra abaixo da tabela (10 itens por página) */}
          {filtrados.length > 0 && (
            <Paginacao page={page} total={totalPages} inicio={inicio} shown={pageItems.length} totalItems={filtrados.length} onPage={setPage} />
          )}
        </section>
      </PageContainer>

      {/* Cadastro / edição de usuário — modal lateral (mesmo padrão das outras telas) */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
          {/* cabeçalho */}
          <header className="flex items-center gap-3 border-b border-border/50 p-5 pr-12">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden>
              {editing ? <Pencil className="size-6" /> : <UserPlus className="size-6" />}
            </span>
            <div className="min-w-0">
              <p className="ty-overline text-muted-foreground">{editing ? 'Editar acesso' : 'Novo membro'}</p>
              <SheetTitle className="truncate font-heading text-xl font-bold tracking-tight text-foreground">{editing ? 'Editar usuário' : 'Cadastro de usuário'}</SheetTitle>
              <SheetDescription>{editing ? 'Atualize os dados e a função desta pessoa.' : 'Preencha os dados do novo membro e defina a função de acesso.'}</SheetDescription>
            </div>
          </header>

          {/* formulário (rolável) */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid gap-2">
              <Label htmlFor="u-nome">Nome completo</Label>
              <Input id="u-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="O nome completo" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-email">E-mail</Label>
              <Input id="u-email" type="email" inputMode="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="nome@empresa.com" aria-invalid={form.email.length > 0 && !emailValido} autoComplete="off" />
              {form.email.length > 0 && !emailValido && <p className="ty-caption text-destructive-text">Informe um e-mail válido.</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="u-tel">Telefone</Label>
                <Input id="u-tel" inputMode="tel" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: maskTel(e.target.value) }))} placeholder="(11) 98765-4321" autoComplete="off" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-doc">{docLabel}</Label>
                <Input id="u-doc" inputMode="numeric" value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskDoc(e.target.value) }))} placeholder={docPlaceholder} autoComplete="off" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="u-tipo">Tipo de pessoa</Label>
                <Select value={form.tipoPessoa} onValueChange={(v) => setForm((f) => ({ ...f, tipoPessoa: v as TipoPessoa, cpf: (v === 'Pessoa Jurídica' ? maskCNPJ : maskCPF)(f.cpf) }))}>
                  <SelectTrigger id="u-tipo" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                    <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-data">{dataLabel}</Label>
                <Input id="u-data" inputMode="numeric" value={form.nascimento} onChange={(e) => setForm((f) => ({ ...f, nascimento: maskData(e.target.value) }))} placeholder="DD/MM/AAAA" autoComplete="off" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-funcao">Função</Label>
              {/* trigger com altura automática + py extra: o valor tem 2 linhas (nome + descrição) e a
                  altura fixa padrão (h-9) o deixava espremido. */}
              <Select value={form.funcao} onValueChange={(v) => setForm((f) => ({ ...f, funcao: v as Funcao }))}>
                <SelectTrigger id="u-funcao" className="w-full data-[size=default]:h-auto py-2.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUNCOES.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="py-2.5">
                      <span className="flex flex-col items-start gap-1">
                        <span className="ty-body-sm font-medium text-foreground">{f.value}</span>
                        <span className="ty-caption text-muted-foreground">{f.desc}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* rodapé */}
          <footer className="space-y-2 border-t border-border/40 p-4">
            <Button className="w-full" onClick={salvar} disabled={!podeSalvar}>
              {editing ? <><Pencil aria-hidden /> Salvar alterações</> : <><UserPlus aria-hidden /> Cadastrar usuário</>}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          </footer>
        </SheetContent>
      </Sheet>

      {/* Confirmação de desativação (demo) */}
      <AlertDialog open={!!desativar} onOpenChange={(o) => { if (!o) setDesativar(null) }}>
        <AlertDialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning-text" aria-hidden><UserMinus className="size-5" /></span>
            <div className="space-y-1.5">
              <AlertDialogTitle>Desativar acesso?</AlertDialogTitle>
              <AlertDialogDescription><span className="font-medium text-foreground">{desativar?.nome}</span> perderá o acesso ao sistema e passará para o status <span className="font-medium text-foreground">Inativo</span>. Você pode reativar a qualquer momento.</AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="warning" onClick={confirmarDesativar}>Desativar acesso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de reativação (demo) */}
      <AlertDialog open={!!reativarU} onOpenChange={(o) => { if (!o) setReativarU(null) }}>
        <AlertDialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success-text" aria-hidden><UserCheck className="size-5" /></span>
            <div className="space-y-1.5">
              <AlertDialogTitle>Reativar acesso?</AlertDialogTitle>
              <AlertDialogDescription><span className="font-medium text-foreground">{reativarU?.nome}</span> voltará a ter acesso ao sistema e passará para o status <span className="font-medium text-foreground">Ativo</span>.</AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarReativar}>Reativar acesso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
