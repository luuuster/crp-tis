/**
 * Lista de Vagas — a tela ANTERIOR ao passo a passo. Mostra os KPIs e a tabela de vagas já cadastradas;
 * o botão "Abrir vaga" entra no wizard (JobGenerator). Renderiza dentro do shell do Gerador (menu + topbar),
 * então é só o CONTEÚDO (sem sidebar/topbar próprios). Demo: dados mockados, sem backend.
 *
 * Os filtros (status + busca por título) ficam DENTRO do card da tabela — busca onde os dados estão.
 * 100% token-driven: badges de status usam as variantes -text (AA por tema), nada de cor à mão.
 */
import { useState, type ComponentType } from 'react'
import { Briefcase, Calendar, CheckCircle2, Clock, Layers, LayoutList, Lock, MapPin, Pencil, Plus, Search, TrendingUp, Users } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { usePagination } from '@/lib/usePagination'
import { PageContainer, PageHeader, StatCard, Paginacao, StatusBadge, type BadgeTone } from '@/components/page'
import { VagaDocumento } from '@/lib/vaga'
import { type StatusVaga as Status } from '@/lib/types'
import { BENEF, PROCESSO, mkGen, mkVaga, type Vaga } from './vagas.logic'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog'

// `type Vaga` mora em ./vagas.logic (lar do builder); re-exportado aqui p/ JobGenerator continuar importando de './VagasList'.
export type { Vaga } from './vagas.logic'

const VAGAS_INICIAL: Vaga[] = [
  mkVaga(
    { id: '1', data: '10/01/2026', inscritos: 80, aprovados: 15, status: 'Aberta' },
    {
      cargo: 'Desenvolvedor Full Stack', nivel: 'Pleno/Sênior', modelo: 'Remoto',
      cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
      desafio: 'O TIS Talent AI Platform está evoluindo sua experiência de ponta a ponta e precisa de reforço para acelerar a entrega de novas funcionalidades web.',
      objetivo: 'Entregar features completas — do banco à interface — com qualidade, performance e boa experiência para quem usa a plataforma.',
      local: 'São Paulo — SP (100% remoto)', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 2,
      budget: 'R$ 9.000 a R$ 14.000', modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
    },
    {
      formacao: 'Superior completo em Ciência da Computação, Engenharia de Software ou áreas correlatas.',
      experiencia: 'Mínimo 4 anos com desenvolvimento web full stack, em produção e ambientes de alta disponibilidade.',
      exigencias: ['Ensino superior obrigatório', 'Comprovação de experiência'],
      stackObrigatoria: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'APIs RESTful', 'Git'],
      conhecimentosDesejaveis: ['Next.js', 'GraphQL', 'AWS', 'CI/CD', 'Testes automatizados'],
      responsabilidades: 'Desenvolver e manter aplicações web full stack com React e Node.js. Projetar APIs RESTful escaláveis e seguras. Colaborar com design e produto na construção de novas features. Garantir qualidade com testes automatizados e code reviews. Apoiar decisões de arquitetura do front e do back.',
      habilidades: ['Comunicação clara', 'Trabalho em equipe', 'Autonomia', 'Resolução de problemas', 'Organização'],
      justificativa: 'Expansão do time de produto para acelerar o roadmap web e reduzir o tempo de entrega das squads.',
    },
  ),
  mkVaga(
    { id: '2', data: '10/01/2026', inscritos: 34, aprovados: 6, status: 'Rascunho' },
    {
      cargo: 'UX Designer III', nivel: 'Pleno/Sênior', modelo: 'Remoto',
      cliente: 'TIS Talent AI Platform', gestor: 'Marina Albuquerque',
      desafio: 'Queremos elevar a maturidade de design da plataforma e tornar as jornadas de recrutamento mais simples e humanas.',
      objetivo: 'Conduzir a pesquisa e o design de experiências consistentes, acessíveis e orientadas a dados em todo o produto.',
      local: 'São Paulo — SP (100% remoto)', horario: '09h às 18h', carga: '40h semanais', motivo: 'Nova posição', quantidade: 1,
      budget: 'R$ 8.000 a R$ 12.000', modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
    },
    {
      formacao: 'Superior completo em Design, Interação Humano-Computador ou áreas correlatas.',
      experiencia: 'Mínimo 4 anos em UX/Product Design, com portfólio de produtos digitais complexos.',
      exigencias: ['Comprovação de experiência', 'Portfólio'],
      stackObrigatoria: ['Figma', 'Design System', 'Pesquisa com usuários', 'Prototipação', 'WCAG 2.2 AA'],
      conhecimentosDesejaveis: ['Design Tokens', 'Análise de dados', 'Motion design', 'Acessibilidade'],
      responsabilidades: 'Conduzir pesquisa com usuários e traduzir achados em decisões de design. Desenhar fluxos, wireframes e protótipos de alta fidelidade. Evoluir e manter o design system junto ao time. Garantir acessibilidade (WCAG 2.2 AA) em todas as entregas. Validar soluções com testes de usabilidade.',
      habilidades: ['Comunicação clara', 'Empatia', 'Pensamento analítico', 'Colaboração', 'Storytelling'],
      justificativa: 'Estruturar a prática de UX para sustentar o crescimento do produto com consistência e qualidade.',
    },
  ),
  mkVaga(
    { id: '3', data: '10/01/2026', inscritos: 56, aprovados: 9, status: 'Em pausa' },
    {
      cargo: 'Product Manager', nivel: 'Sênior', modelo: 'Presencial',
      cliente: 'TIS Talent AI Platform', gestor: 'Rafael Tavares',
      desafio: 'A plataforma cresceu e precisa de liderança de produto para priorizar com clareza e conectar negócio, design e engenharia.',
      objetivo: 'Definir e executar a estratégia de produto de uma área crítica, maximizando o valor entregue e o impacto no negócio.',
      local: 'São Paulo — SP', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 1,
      budget: 'R$ 14.000 a R$ 20.000', modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
    },
    {
      formacao: 'Superior completo em Administração, Engenharia, Computação ou áreas correlatas.',
      experiencia: 'Mínimo 5 anos em gestão de produtos digitais, com cases de discovery e delivery ponta a ponta.',
      exigencias: ['Ensino superior obrigatório', 'Comprovação de experiência'],
      stackObrigatoria: ['Discovery', 'Métricas de produto', 'Roadmap', 'Metodologias ágeis', 'SQL básico'],
      conhecimentosDesejaveis: ['OKRs', 'Growth', 'Análise de dados', 'IA aplicada a produto'],
      responsabilidades: 'Definir a visão e a estratégia do produto junto às lideranças. Priorizar o backlog com base em dados e valor de negócio. Conduzir discovery contínuo com usuários e stakeholders. Alinhar design e engenharia em torno de objetivos claros. Acompanhar métricas e iterar sobre os resultados.',
      habilidades: ['Liderança', 'Comunicação clara', 'Pensamento analítico', 'Negociação', 'Visão estratégica'],
      justificativa: 'Garantir foco e priorização em uma área estratégica em rápido crescimento.',
    },
  ),
  mkVaga(
    { id: '4', data: '10/01/2026', inscritos: 47, aprovados: 8, status: 'Fechada' },
    {
      cargo: 'Engenheiro de Dados', nivel: 'Pleno', modelo: 'Híbrido',
      cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
      desafio: 'Os modelos de IA da plataforma dependem de dados confiáveis; precisamos fortalecer a engenharia de dados que os alimenta.',
      objetivo: 'Construir e manter pipelines de dados robustos, escaláveis e observáveis para sustentar analytics e modelos de IA.',
      local: 'São Paulo — SP', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 1,
      budget: 'R$ 10.000 a R$ 15.000', modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
    },
    {
      formacao: 'Superior completo em Ciência da Computação, Engenharia ou áreas correlatas.',
      experiencia: 'Mínimo 3 anos em engenharia de dados, com pipelines em produção e grandes volumes.',
      exigencias: ['Ensino superior obrigatório'],
      stackObrigatoria: ['Python', 'SQL', 'Spark', 'Airflow', 'AWS', 'Docker'],
      conhecimentosDesejaveis: ['dbt', 'Kafka', 'Snowflake', 'Terraform', 'Observabilidade'],
      responsabilidades: 'Projetar e manter pipelines de ingestão e transformação de dados. Garantir qualidade, governança e observabilidade dos dados. Modelar dados para analytics e para os modelos de IA. Otimizar custo e performance do processamento. Colaborar com cientistas de dados e engenharia.',
      habilidades: ['Pensamento analítico', 'Organização', 'Trabalho em equipe', 'Atenção a detalhes', 'Autonomia'],
      justificativa: 'Sustentar a base de dados que alimenta os recursos de IA da plataforma.',
    },
  ),
  mkVaga(
    { id: '5', data: '08/01/2026', inscritos: 22, aprovados: 4, status: 'Aberta' },
    {
      cargo: 'Analista de QA', nivel: 'Júnior', modelo: 'Híbrido',
      cliente: 'TIS Talent AI Platform', gestor: 'Marina Albuquerque',
      desafio: 'Conforme a plataforma ganha escala, precisamos garantir qualidade de forma sistemática e cada vez mais automatizada.',
      objetivo: 'Assegurar a qualidade das entregas por meio de testes manuais e automatizados, prevenindo regressões.',
      local: 'São Paulo — SP', horario: '09h às 18h', carga: '40h semanais', motivo: 'Nova posição', quantidade: 1,
      budget: 'R$ 4.000 a R$ 6.000', modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
    },
    {
      formacao: 'Cursando ou superior completo em Tecnologia, Sistemas de Informação ou áreas correlatas.',
      experiencia: 'A partir de 1 ano com testes de software (estágio ou efetivo).',
      exigencias: ['Comprovação de experiência'],
      stackObrigatoria: ['Testes manuais', 'Casos de teste', 'Cypress', 'Git', 'APIs RESTful'],
      conhecimentosDesejaveis: ['Automação de testes', 'CI/CD', 'Postman', 'SQL'],
      responsabilidades: 'Elaborar e executar casos de teste manuais e automatizados. Registrar e acompanhar defeitos até a resolução. Apoiar a automação de testes de regressão. Validar requisitos junto a produto e desenvolvimento. Contribuir para a cultura de qualidade do time.',
      habilidades: ['Atenção a detalhes', 'Comunicação clara', 'Proatividade', 'Organização', 'Trabalho em equipe'],
      justificativa: 'Reforçar a qualidade das entregas em um produto em rápida evolução.',
    },
  ),
  mkVaga(
    { id: '6', data: '06/01/2026', inscritos: 63, aprovados: 12, status: 'Aberta' },
    {
      cargo: 'Desenvolvedor Backend', nivel: 'Pleno', modelo: 'Híbrido',
      cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
      desafio: 'Estamos expandindo o time de engenharia do TIS Talent AI Platform para sustentar o crescimento da plataforma.',
      objetivo: 'Ampliar a capacidade de entrega de soluções backend de alta performance, garantindo escalabilidade e qualidade nas integrações da plataforma.',
      local: 'São Paulo — SP', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 1,
      budget: 'R$ 8.000 a R$ 12.000', modalidade: 'CLT', beneficios: ['Vale-refeição', 'Plano de saúde', 'Auxílio home-office', 'Day-off aniversário'], processoSeletivo: ['Entrevista comportamental', 'Entrevista técnica', 'Entrevista com RH'],
    },
    {
      formacao: 'Superior completo em Ciência da Computação, Engenharia de Software, Sistemas de Informação ou áreas correlatas.',
      experiencia: 'Mínimo 3 anos em desenvolvimento backend, com experiência comprovada em APIs RESTful, bancos de dados relacionais e ambientes em produção.',
      exigencias: ['Ensino superior obrigatório'],
      stackObrigatoria: ['Python 3.10+', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'APIs RESTful', 'Testes automatizados'],
      conhecimentosDesejaveis: ['Kubernetes', 'Redis', 'Kafka', 'GraphQL', 'Cloud (AWS/Azure/GCP)', 'Observabilidade'],
      responsabilidades: 'Desenvolver e manter APIs RESTful de alta performance utilizando Python e FastAPI. Projetar soluções técnicas que atendam aos requisitos de escalabilidade e segurança. Realizar code reviews, assegurando boas práticas e consistência de código. Atuar como mentor de desenvolvedores júnior, promovendo aprendizado e crescimento da equipe. Garantir a qualidade do código por meio de testes automatizados e integração contínua.',
      habilidades: ['Comunicação clara', 'Trabalho em equipe', 'Pensamento analítico', 'Proatividade', 'Mentoria'],
      justificativa: 'Expansão da equipe para suportar o crescimento do produto e reduzir o tempo de entrega das squads de backend.',
    },
  ),
  // --- vagas adicionais (template genérico, detalhe completo) — povoam a lista p/ demonstrar a paginação ---
  mkGen({ id: '7', data: '05/01/2026', inscritos: 41, aprovados: 7, status: 'Aberta' }, 'Desenvolvedor Mobile', 'Pleno', 'Remoto', 'Carlos Mendes', 'R$ 8.000 a R$ 12.000', ['React Native', 'TypeScript', 'iOS', 'Android', 'Git'], 'Desenvolver e manter aplicativos móveis. Integrar APIs e otimizar performance. Garantir qualidade com testes. Colaborar com design e produto.'),
  mkGen({ id: '8', data: '05/01/2026', inscritos: 18, aprovados: 3, status: 'Rascunho' }, 'Scrum Master', 'Sênior', 'Híbrido', 'Rafael Tavares', 'R$ 11.000 a R$ 16.000', ['Scrum', 'Kanban', 'Facilitação', 'Jira', 'Métricas ágeis'], 'Facilitar cerimônias ágeis e remover impedimentos. Apoiar a melhoria contínua do time. Acompanhar métricas de fluxo. Promover a cultura ágil.'),
  mkGen({ id: '9', data: '03/01/2026', inscritos: 52, aprovados: 10, status: 'Aberta' }, 'Cientista de Dados', 'Pleno/Sênior', 'Remoto', 'Carlos Mendes', 'R$ 12.000 a R$ 18.000', ['Python', 'SQL', 'Machine Learning', 'Pandas', 'MLOps'], 'Desenvolver e validar modelos de machine learning. Analisar dados e gerar insights. Colocar modelos em produção. Colaborar com engenharia de dados.'),
  mkGen({ id: '10', data: '03/01/2026', inscritos: 29, aprovados: 5, status: 'Em pausa' }, 'Analista de Marketing', 'Pleno', 'Presencial', 'Marina Albuquerque', 'R$ 5.000 a R$ 8.000', ['SEO', 'Mídia paga', 'Analytics', 'Conteúdo', 'CRM'], 'Planejar e executar campanhas de marketing. Acompanhar métricas e otimizar resultados. Produzir conteúdo. Apoiar a estratégia de growth.'),
  mkGen({ id: '11', data: '02/01/2026', inscritos: 37, aprovados: 6, status: 'Aberta' }, 'DevOps Engineer', 'Sênior', 'Remoto', 'Carlos Mendes', 'R$ 13.000 a R$ 19.000', ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Observabilidade'], 'Automatizar pipelines de build e deploy. Manter a infraestrutura como código. Garantir confiabilidade e observabilidade. Apoiar as squads em produção.'),
  mkGen({ id: '12', data: '02/01/2026', inscritos: 14, aprovados: 2, status: 'Rascunho' }, 'Designer de Produto', 'Júnior', 'Híbrido', 'Marina Albuquerque', 'R$ 4.500 a R$ 7.000', ['Figma', 'Protótipos', 'Design System', 'Pesquisa', 'Acessibilidade'], 'Apoiar a criação de fluxos e telas. Manter componentes no design system. Participar de testes com usuários. Garantir acessibilidade nas entregas.'),
  mkGen({ id: '13', data: '28/12/2025', inscritos: 45, aprovados: 9, status: 'Fechada' }, 'Analista de RH', 'Pleno', 'Presencial', 'Rafael Tavares', 'R$ 5.000 a R$ 7.500', ['Recrutamento', 'Entrevistas', 'Cultura', 'Indicadores de RH', 'Onboarding'], 'Conduzir processos seletivos ponta a ponta. Apoiar a jornada do colaborador. Acompanhar indicadores de RH. Fortalecer a cultura da empresa.'),
  mkGen({ id: '14', data: '28/12/2025', inscritos: 61, aprovados: 11, status: 'Aberta' }, 'Tech Lead Frontend', 'Sênior', 'Remoto', 'Carlos Mendes', 'R$ 15.000 a R$ 22.000', ['React', 'TypeScript', 'Arquitetura', 'Performance', 'Mentoria'], 'Liderar tecnicamente o time de frontend. Definir padrões e arquitetura. Revisar código e mentorar. Garantir performance e qualidade.'),
  mkGen({ id: '15', data: '22/12/2025', inscritos: 20, aprovados: 4, status: 'Em pausa' }, 'Suporte Técnico N2', 'Júnior', 'Híbrido', 'Marina Albuquerque', 'R$ 3.500 a R$ 5.000', ['Atendimento', 'Troubleshooting', 'SQL básico', 'Documentação', 'ITIL'], 'Atender e resolver chamados de nível 2. Diagnosticar e escalar problemas. Documentar soluções. Apoiar a satisfação dos clientes.'),
  mkGen({ id: '16', data: '22/12/2025', inscritos: 33, aprovados: 6, status: 'Aberta' }, 'Arquiteto de Software', 'Sênior', 'Híbrido', 'Rafael Tavares', 'R$ 16.000 a R$ 24.000', ['Arquitetura', 'Microsserviços', 'Cloud', 'Segurança', 'Design Patterns'], 'Definir a arquitetura de soluções. Orientar decisões técnicas entre squads. Garantir escalabilidade e segurança. Conduzir revisões de arquitetura.'),
]

// Pílula de status: mapa valor→TOM (token-driven, AA por tema). Renderizada via <StatusBadge>.
const STATUS_TOM: Record<Status, BadgeTone> = {
  'Aberta': 'success',
  'Rascunho': 'secondary',
  'Em pausa': 'warning',
  'Fechada': 'destructive',
}
const STATUS_FILTROS = ['Todos', 'Aberta', 'Rascunho', 'Em pausa', 'Fechada'] as const
const PER_PAGE = 10

// Filtro de coluna (select compacto) — usado nas colunas Data, Senioridade, Modelo e Status.
function ColFilter({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className="w-full font-normal"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

// Detalhe da vaga (conteúdo) — abre ao clicar na linha. As ações (Voltar / Editar) ficam no rodapé do
// shell (JobGenerator), no MESMO slot do rodapé do wizard — por isso aqui é só o conteúdo (rola no <main>).
export function VagaDetalhe({ vaga }: { vaga: Vaga }) {
  const taxa = vaga.inscritos > 0 ? Math.round((vaga.aprovados / vaga.inscritos) * 100) : 0
  const detalhes: { icon: ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: Calendar, label: 'Data de abertura', value: vaga.data },
    { icon: Layers, label: 'Senioridade', value: vaga.senioridade },
    { icon: MapPin, label: 'Modelo de atuação', value: vaga.modelo },
  ]
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 lg:px-8">
      {/* cabeçalho da vaga: título + status + metadados */}
      <header className={cn(CARD, 'space-y-5 p-6')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="ty-overline text-muted-foreground">Vaga</p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{vaga.vaga}</h1>
          </div>
          <StatusBadge value={vaga.status} tones={STATUS_TOM} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          {detalhes.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-text" aria-hidden><d.icon className="size-5" /></span>
              <div className="min-w-0">
                <dt className="ty-caption text-muted-foreground">{d.label}</dt>
                <dd className="ty-body-sm font-medium text-foreground">{d.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </header>

      {/* funil: inscritos → aprovados → taxa */}
      <section aria-label="Resultados" className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Inscritos" value={vaga.inscritos} />
        <StatCard icon={CheckCircle2} label="Aprovados" value={vaga.aprovados} />
        <StatCard
          icon={TrendingUp}
          label="Taxa de aprovação"
          value={`${taxa}%`}
          delta={
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-success" style={{ width: `${taxa}%` }} />
            </div>
          }
        />
      </section>

      {/* documento completo da vaga — TODAS as informações (briefing + perfil) */}
      <VagaDocumento data={vaga.briefing} perfil={vaga.perfil} />
    </div>
  )
}

export function VagasList({ onAbrirVaga, onEditVaga, onVerVaga }: { onAbrirVaga: () => void; onEditVaga: (vaga: Vaga) => void; onVerVaga: (vaga: Vaga) => void }) {
  const [vagas, setVagas] = useState<Vaga[]>(VAGAS_INICIAL)
  const [status, setStatus] = useState<(typeof STATUS_FILTROS)[number]>('Todos')
  const [q, setQ] = useState('')
  const [dataF, setDataF] = useState('Todas')
  const [senioridadeF, setSenioridadeF] = useState('Todas')
  const [modeloF, setModeloF] = useState('Todos')
  const [fechar, setFechar] = useState<Vaga | null>(null)

  // Opções de filtro derivadas dos dados (sentinela "Todas/Todos" primeiro).
  const datas = ['Todas', ...Array.from(new Set(vagas.map((v) => v.data)))]
  const senioridades = ['Todas', ...Array.from(new Set(vagas.map((v) => v.senioridade)))]
  const modelos = ['Todos', ...Array.from(new Set(vagas.map((v) => v.modelo)))]

  // KPIs DERIVADOS dos dados (atualizam ao fechar uma vaga) — número real, não decorativo.
  const abertas = vagas.filter((v) => v.status === 'Aberta').length
  const inscritos = vagas.reduce((s, v) => s + v.inscritos, 0)
  const aprovados = vagas.reduce((s, v) => s + v.aprovados, 0)
  const emProcesso = vagas.filter((v) => v.status === 'Aberta' || v.status === 'Em pausa').length

  const filtradas = vagas.filter(
    (v) =>
      (status === 'Todos' || v.status === status) &&
      (dataF === 'Todas' || v.data === dataF) &&
      (senioridadeF === 'Todas' || v.senioridade === senioridadeF) &&
      (modeloF === 'Todos' || v.modelo === modeloF) &&
      v.vaga.toLowerCase().includes(q.trim().toLowerCase()),
  )

  // Paginação: PER_PAGE itens por página. A página é saneada dentro do hook (filtro pode encolher a lista).
  const { page, setPage, pageItems, total: totalPages, inicio, totalItems } = usePagination(filtradas, PER_PAGE)
  // Mudar qualquer filtro volta para a 1ª página (some o risco de ficar "preso" numa página vazia).
  const resetPage = () => setPage(1)

  // Fechar a vaga = mudar o status para "Fechada" (NÃO remove da lista; ela continua visível, encerrada).
  const fecharVaga = () => {
    if (!fechar) return
    setVagas((vs) => vs.map((x) => (x.id === fechar.id ? { ...x, status: 'Fechada' } : x)))
    toast.success(`Vaga "${fechar.vaga}" fechada (demo).`)
    setFechar(null)
  }

  return (
    <PageContainer>
      <PageHeader
        icon={MapPin}
        title="Vagas"
        desc={<>Visualize as vagas cadastradas na TalentAI Data API e acompanhe inscritos, aprovados e status. Clique em <span className="font-medium text-foreground">Abrir vaga</span> para criar uma nova pelo passo a passo.</>}
      />

      {/* KPIs — números reais derivados da lista */}
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Vagas abertas" value={abertas} />
        <StatCard icon={Users} label="Total de inscritos" value={inscritos} />
        <StatCard icon={CheckCircle2} label="Aprovados" value={aprovados} />
        <StatCard icon={Clock} label="Em processo" value={emProcesso} />
      </section>

      {/* Lista — filtros DENTRO do card, na barra de ferramentas da tabela */}
      <section aria-labelledby="lista-vagas" className={cn(CARD, 'overflow-hidden')}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4 sm:p-5">
          <h2 id="lista-vagas" className="flex items-center gap-2 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>
            <LayoutList className="size-5 shrink-0 text-primary-text" aria-hidden /> Lista de vagas
            <span className="ty-body-sm font-normal text-muted-foreground tabular-nums">({filtradas.length})</span>
          </h2>
          <Button onClick={onAbrirVaga}><Plus aria-hidden /> Abrir vaga</Button>
        </div>

        <Table className="[&_:is(th,td):first-child]:pl-5 [&_:is(th,td):last-child]:pr-5">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Data</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Vaga</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Senioridade</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Modelo</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase text-right">Inscritos</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase text-right">Aprovados</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Status</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase text-right">Ações</TableHead>
            </TableRow>
            {/* Linha de FILTRO — barra de ferramentas (td, não th: não são cabeçalhos de coluna). Busca
                alinhada à coluna Vaga, status à coluna Status. */}
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableCell className="py-2"><ColFilter value={dataF} onChange={(v) => { setDataF(v); resetPage() }} options={datas} label="Filtrar por data" /></TableCell>
              <TableCell className="py-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input value={q} onChange={(e) => { setQ(e.target.value); resetPage() }} placeholder="Buscar título…" aria-label="Buscar vaga por título" className="h-8 pl-8 ty-body-sm font-normal" />
                </div>
              </TableCell>
              <TableCell className="py-2"><ColFilter value={senioridadeF} onChange={(v) => { setSenioridadeF(v); resetPage() }} options={senioridades} label="Filtrar por senioridade" /></TableCell>
              <TableCell className="py-2"><ColFilter value={modeloF} onChange={(v) => { setModeloF(v); resetPage() }} options={modelos} label="Filtrar por modelo" /></TableCell>
              <TableCell className="py-2" />
              <TableCell className="py-2" />
              <TableCell className="py-2"><ColFilter value={status} onChange={(v) => { setStatus(v as (typeof STATUS_FILTROS)[number]); resetPage() }} options={STATUS_FILTROS} label="Filtrar por status" /></TableCell>
              <TableCell className="py-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-14 text-center ty-body-sm text-muted-foreground">Nenhuma vaga encontrada com esses filtros.</TableCell>
              </TableRow>
            ) : (
              pageItems.map((v) => (
                // Clicar na linha abre o detalhe. O onClick aqui é conveniência de MOUSE; o acesso por
                // teclado/leitor de tela é o botão do título (abaixo). Mantém o <tr> semântico de propósito —
                // role="button" quebraria a estrutura ARIA da tabela (rowgroup→row) e reprovaria no axe.
                <TableRow key={v.id} onClick={() => onVerVaga(v)} className="cursor-pointer">
                  <TableCell className="py-3 ty-body-sm tabular-nums text-muted-foreground">{v.data}</TableCell>
                  <TableCell className="py-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onVerVaga(v) }} className="rounded-sm text-left ty-body-sm font-medium text-foreground transition-colors hover:text-primary-text focus-visible:focus-ring">{v.vaga}</button>
                  </TableCell>
                  <TableCell className="py-3"><Badge variant="ghost" className="bg-primary/10 ty-caption font-medium text-primary-text">{v.senioridade}</Badge></TableCell>
                  <TableCell className="py-3 ty-body-sm text-muted-foreground">{v.modelo}</TableCell>
                  <TableCell className="py-3 text-right ty-body-sm font-medium tabular-nums text-foreground">{v.inscritos}</TableCell>
                  <TableCell className="py-3 text-right ty-body-sm font-semibold tabular-nums text-success-text">{v.aprovados}</TableCell>
                  <TableCell className="py-3"><StatusBadge value={v.status} tones={STATUS_TOM} /></TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${v.vaga}`} onClick={(e) => { e.stopPropagation(); onEditVaga(v) }} className="text-muted-foreground hover:bg-primary/10 hover:text-primary-text"><Pencil /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Fechar ${v.vaga}`} onClick={(e) => { e.stopPropagation(); setFechar(v) }} className="text-muted-foreground hover:bg-warning/10 hover:text-warning-text"><Lock /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginação — barra abaixo da tabela (10 itens por página) */}
        {filtradas.length > 0 && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Paginacao page={page} total={totalPages} inicio={inicio} shown={pageItems.length} totalItems={totalItems} onPage={setPage} />
          </div>
        )}
      </section>

      {/* Confirmação de fechamento (demo) */}
      <AlertDialog open={!!fechar} onOpenChange={(o) => { if (!o) setFechar(null) }}>
        <AlertDialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning-text" aria-hidden><Lock className="size-5" /></span>
            <div className="space-y-1.5">
              <AlertDialogTitle>Fechar vaga?</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja fechar <span className="font-medium text-foreground">{fechar?.vaga}</span>? A vaga deixará de receber candidaturas e passará para o status <span className="font-medium text-foreground">Fechada</span>.</AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="warning" onClick={fecharVaga}>Fechar vaga</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
