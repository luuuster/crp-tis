/**
 * Entrevistas IA — triagem dos candidatos no PRIMEIRO funil de recrutamento conduzido pela IA.
 * A IA entrevista e pontua; o RH revisa e aprova/reprova (em lote). Clicar num candidato abre o
 * DETALHE completo (currículo analisado, aderência, avaliação da IA, pontos fortes/áreas, competências
 * e perguntas sugeridas). Reconstruída no DS (AppShell, CARD, .ty-*, tokens) — nada de cor/borda à mão.
 * Demo: candidatos mockados; ações só simulam (toast).
 *
 * Seleção em lote: só linhas AGUARDANDO decisão (Pendente / Aprovado bot) são selecionáveis; aprovar
 * move p/ "Aprovado RH" e reprovar p/ "Reprovado" (regra de progressão da etapa de entrevista IA → RH).
 */
import { useState, type ComponentType, type ReactNode } from 'react'
import {
  ArrowUpRight, BarChart3, Bot, Briefcase, Calendar, CheckCircle2, ChevronLeft, CircleDot,
  Clock, FileSearch, FileText, HelpCircle, Mail, MessageSquareText, Search, Sparkles, Tags, Users, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { tintFor } from '@/lib/avatar'
import { usePagination } from '@/lib/usePagination'
import { AppShell } from '@/components/shell/AppShell'
import { PageContainer, PageHeader, Panel, StatCard, DetailScreen, StatusBadge, Paginacao, type BadgeTone } from '@/components/page'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type StatusIA = 'Pendente' | 'Aprovado bot' | 'Aprovado RH' | 'Reprovado'
type Recomendacao = 'Sim' | 'Talvez' | 'Não'
type Pergunta = { titulo: string; texto: string }
// Detalhe = tudo que aparece na tela do candidato (currículo analisado + avaliação da IA).
export type Detalhe = {
  aderencia: number          // % de aderência do currículo à vaga
  dataAnalise: string        // data/hora da análise do currículo
  scoreGeral: number         // score da entrevista com IA (0–100)
  recomendacao: Recomendacao
  dataEntrevista: string     // data/hora da entrevista conversacional
  avaliacaoTecnica: string
  avaliacaoComportamental: string
  pontosFortes: string[]
  areasMelhoria: string[]
  feedbackDetalhado: string  // parágrafos separados por \n
  analiseCandidato: string   // resumo do currículo
  competencias: string[]
  perguntas: Pergunta[]
}
export type Candidato = { id: string; nome: string; email: string; vaga: string; data: string; score: number; status: StatusIA; detalhe?: Detalhe }

// --- Detalhes ricos (escritos à mão) dos dois candidatos do print ---
const DETALHE_DIEGO: Detalhe = {
  aderencia: 80,
  dataAnalise: '16/06/2026 12:13',
  scoreGeral: 68,
  recomendacao: 'Talvez',
  dataEntrevista: '10/06/2026 18:47',
  avaliacaoTecnica:
    'Diego possui sólida experiência técnica em TI (mais de 25 anos) e domínio avançado de metodologias ágeis (Scrum, Kanban, Lean Inception, Design Thinking, OKR, Balanced Scorecard). Demonstrou capacidade de construir e priorizar backlogs, definir roadmaps de MVPs e conduzir entregas em ambientes complexos, além de forte conhecimento em governança (ITIL, COBIT, ISO). Contudo, não apresenta experiência prática em análise de mercado, definição de estratégias de go-to-market nem em ferramentas específicas de roadmap (ex.: Aha!, Productboard, Roadmunk), que são requisitos críticos da vaga.',
  avaliacaoComportamental:
    'A comunicação de Diego é clara e estruturada. Nos exemplos fornecidos, ele mostrou habilidade em conduzir sessões de discovery, alinhar stakeholders multidisciplinares e resolver conflitos usando dados e critérios de priorização objetivos. Sua postura colaborativa e foco em resultados são consistentes com a cultura de equipes ágeis e orientadas a métricas. No entanto, ainda demonstra certa insegurança ao falar de atividades que ainda não liderou (ex.: análise de mercado completa).',
  pontosFortes: [
    'Experiência extensa em TI e gestão de projetos complexos.',
    'Domínio avançado de metodologias ágeis e práticas de discovery.',
    'Capacidade comprovada de entregar MVPs em prazos curtos (ex.: solução de IA para triagem de currículos).',
    'Habilidade de mediar conflitos entre áreas comerciais e técnicas usando dados e frameworks de priorização.',
    'Comunicação eficaz e foco em métricas de sucesso (redução de tempo, aumento de produtividade).',
    'Certificações relevantes (PSM II, ITIL 4, COBIT, ISO 27001).',
  ],
  areasMelhoria: [
    'Desenvolver experiência prática em análise de mercado, segmentação de clientes e definição de proposta de valor.',
    'Familiarizar-se com ferramentas de roadmap e gestão de portfólio de produto (ex.: Aha!, Productboard, Roadmunk).',
    'Aprofundar conhecimentos em estratégias de go-to-market e métricas de adoção/retenção de produto.',
    'Ganhar autonomia na condução completa de estudos de concorrência e validação de hipóteses de mercado.',
    'Aprimorar a confiança ao discutir atividades ainda não realizadas de forma independente.',
  ],
  feedbackDetalhado:
    'Diego traz um perfil muito forte em execução ágil, gestão de equipes multidisciplinares e entrega de MVPs que geram valor imediato. Seu histórico demonstra que ele sabe organizar backlogs, conduzir discovery e alinhar stakeholders, além de resolver conflitos de forma data-driven.\n' +
    'Entretanto, a vaga exige experiência explícita em análise de mercado e uso de ferramentas de roadmap, áreas onde Diego ainda não tem comprovação prática. Ele reconhece essa lacuna e apresenta um plano plausível para suprir a deficiência, mas a falta de experiência direta pode impactar a velocidade de entrega de estratégias de produto mais amplas.\n' +
    'Recomendamos avançar para uma segunda fase de entrevista focada em casos práticos de análise de concorrência e definição de roadmap, onde Diego possa demonstrar sua capacidade de aplicar rapidamente as ferramentas e metodologias necessárias.',
  analiseCandidato:
    'Diego possui mais de 25 anos de experiência em tecnologia e gestão de produtos digitais, com forte atuação em ambientes ágeis e equipes multidisciplinares. Seu currículo evidencia liderança em discovery, priorização de backlog e entrega de MVPs, com certificações sólidas em produto, governança e segurança. Atende bem aos requisitos de execução e liderança da vaga de Product Manager, com ressalvas na comprovação de análise de mercado e ferramentas de roadmap.',
  competencias: ['Discovery', 'Roadmap', 'Priorização de backlog', 'OKRs', 'Métricas de produto', 'Scrum', 'Kanban', 'Lean Inception', 'Design Thinking', 'Gestão de stakeholders', 'ITIL', 'COBIT', 'Governança', 'Comunicação', 'Liderança de equipes'],
  perguntas: [
    { titulo: 'Análise de mercado e proposta de valor', texto: 'Descreva como você abordaria um estudo de concorrência e a definição de proposta de valor para um produto novo. Que dados buscaria e como validaria as hipóteses?' },
    { titulo: 'Roadmap e priorização', texto: 'Conte uma situação em que precisou priorizar um backlog com recursos limitados e stakeholders divergentes. Quais frameworks usou e como comunicou as decisões?' },
    { titulo: 'Métricas de adoção e retenção', texto: 'Como você define e acompanha as métricas de sucesso de uma feature após o lançamento? Dê um exemplo de iteração baseada em dados.' },
  ],
}

const DETALHE_JAIR: Detalhe = {
  aderencia: 92,
  dataAnalise: '16/06/2026 12:13',
  scoreGeral: 82,
  recomendacao: 'Sim',
  dataEntrevista: '05/06/2026 18:47',
  avaliacaoTecnica:
    'Jair demonstrou domínio sólido de desenvolvimento backend com Python, construção de APIs com FastAPI e Flask, e integração de modelos de IA em produção. Apresentou exemplos consistentes de projetos de alta carga com PostgreSQL, uso avançado de Docker e pipelines de CI/CD, evidenciando senioridade compatível com a vaga e domínio das tecnologias obrigatórias.',
  avaliacaoComportamental:
    'Jair comunica-se de forma objetiva e técnica, com boa capacidade de explicar decisões de arquitetura e seus trade-offs. Mostrou postura colaborativa em equipes ágeis, abertura a code review e preocupação com qualidade, documentação e observabilidade. Demonstrou maturidade ao falar de incidentes em produção e do que aprendeu com eles.',
  pontosFortes: [
    'Experiência consolidada em backend com Python, FastAPI e Flask.',
    'Construção de APIs robustas e escaláveis com PostgreSQL e alta disponibilidade.',
    'Integração de modelos de Machine Learning em ambientes de produção.',
    'Domínio de Docker, CI/CD e práticas de testes automatizados.',
    'Forte atuação em arquitetura de serviços e documentação (OpenAPI/Swagger).',
    'Boa comunicação técnica e colaboração em equipes ágeis.',
  ],
  areasMelhoria: [
    'Aprofundar estratégias de cache distribuído e mensageria em larga escala.',
    'Ampliar experiência com orquestração em Kubernetes em cenários multirregião.',
    'Evoluir práticas de observabilidade e definição de SLOs em serviços críticos.',
  ],
  feedbackDetalhado:
    'Jair atende plenamente aos requisitos técnicos da vaga de Desenvolvedor Backend Pleno, com histórico comprovado em APIs de alta carga e integração de IA em produção. Seu domínio de Python, FastAPI, PostgreSQL, Docker e CI/CD, somado à experiência em arquitetura de serviços, o coloca como um candidato forte para avançar no processo.\n' +
    'Recomendamos seguir para a etapa técnica final com foco em desenho de sistemas e casos de alta concorrência, para confirmar a profundidade em escalabilidade e confiabilidade.',
  analiseCandidato:
    'Jair possui mais de 4 anos de experiência em desenvolvimento backend com foco em Python, construção de APIs robustas usando FastAPI e Flask, e integração de modelos de IA em ambientes de produção. Seu histórico inclui projetos de alta carga com PostgreSQL, uso avançado de Docker e pipelines CI/CD, além de prática consolidada em testes automatizados e documentação OpenAPI. Com experiência em equipes ágeis e forte atuação em arquitetura de serviços, ele atende plenamente aos requisitos da vaga de Desenvolvedor Backend Pleno, demonstrando senioridade compatível e domínio das tecnologias obrigatórias.',
  competencias: ['Python', 'FastAPI', 'Flask', 'SQL', 'PostgreSQL', 'Docker', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'APIs RESTful', 'OpenAPI', 'Swagger', 'Testes automatizados', 'Metodologias ágeis', 'TensorFlow', 'Deep Learning', 'NLP', 'RAG', 'Modelos de Machine Learning', 'Integração de IA', 'Arquitetura de serviços backend', 'Otimização de consultas SQL', 'Modelagem de dados', 'Alta disponibilidade', 'Documentação', 'Comunicação', 'Trabalho em equipe'],
  perguntas: [
    { titulo: 'FastAPI e design de APIs', texto: 'Descreva um caso em que você precisou otimizar uma API construída com FastAPI para suportar alta concorrência. Quais estratégias de async/await, validação e versionamento você utilizou?' },
    { titulo: 'Docker, CI/CD e deploy', texto: 'Conte como você estruturou o pipeline de CI/CD para deploy de containers Docker que incluem dependências pesadas como TensorFlow. Como garantiu consistência entre ambientes de desenvolvimento e produção?' },
    { titulo: 'Integração de IA no backend e trabalho em equipe', texto: 'Fale sobre um projeto onde você integrou um modelo de Machine Learning ao backend e precisou alinhar requisitos de latência e disponibilidade com o time de produto. Como mediu o desempenho da API e quais ajustes fez?' },
  ],
}

const CANDIDATOS_INICIAL: Candidato[] = [
  { id: '1', nome: 'Diego Teste 2', email: 'jairgoncol3456@gmail.com', vaga: 'Product Manager', data: '10/06/2026', score: 68, status: 'Pendente', detalhe: DETALHE_DIEGO },
  { id: '2', nome: 'Jair Carmona Gon', email: 'jairgon3456@gmail.com', vaga: 'Desenvolvedor Backend', data: '05/06/2026', score: 82, status: 'Pendente', detalhe: DETALHE_JAIR },
  { id: '3', nome: 'Mariana Lopes', email: 'mariana.lopes@email.com', vaga: 'Desenvolvedor Full Stack', data: '09/06/2026', score: 91, status: 'Aprovado bot' },
  { id: '4', nome: 'Rodrigo Alves', email: 'rodrigo.alves@email.com', vaga: 'UX Designer III', data: '08/06/2026', score: 74, status: 'Pendente' },
  { id: '5', nome: 'Carla Mendonça', email: 'carla.mendonca@email.com', vaga: 'Engenheiro de Dados', data: '07/06/2026', score: 88, status: 'Aprovado bot' },
  { id: '6', nome: 'Felipe Santos', email: 'felipe.santos@email.com', vaga: 'Analista de QA', data: '06/06/2026', score: 65, status: 'Pendente' },
  { id: '7', nome: 'Bianca Ferreira', email: 'bianca.ferreira@email.com', vaga: 'Desenvolvedor Backend', data: '04/06/2026', score: 95, status: 'Aprovado RH' },
  { id: '8', nome: 'Gustavo Pereira', email: 'gustavo.pereira@email.com', vaga: 'Product Manager', data: '03/06/2026', score: 58, status: 'Reprovado' },
  { id: '9', nome: 'Larissa Castro', email: 'larissa.castro@email.com', vaga: 'Cientista de Dados', data: '09/06/2026', score: 84, status: 'Pendente' },
  { id: '10', nome: 'Vitor Hugo', email: 'vitor.hugo@email.com', vaga: 'DevOps Engineer', data: '08/06/2026', score: 79, status: 'Aprovado bot' },
  { id: '11', nome: 'Aline Ramos', email: 'aline.ramos@email.com', vaga: 'Tech Lead Frontend', data: '07/06/2026', score: 90, status: 'Aprovado RH' },
  { id: '12', nome: 'Daniel Moreira', email: 'daniel.moreira@email.com', vaga: 'Desenvolvedor Mobile', data: '05/06/2026', score: 62, status: 'Pendente' },
  { id: '13', nome: 'Patrícia Lima', email: 'patricia.lima@email.com', vaga: 'UX Designer III', data: '04/06/2026', score: 49, status: 'Reprovado' },
  { id: '14', nome: 'Ricardo Nunes', email: 'ricardo.nunes@email.com', vaga: 'Analista de QA', data: '02/06/2026', score: 71, status: 'Pendente' },
]

// Competências por vaga (fallback do builder p/ os candidatos sem detalhe escrito à mão).
const COMPETENCIAS_VAGA: Record<string, string[]> = {
  'Product Manager': ['Discovery', 'Roadmap', 'Métricas de produto', 'Priorização', 'Gestão de stakeholders', 'OKRs'],
  'Desenvolvedor Backend': ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'APIs RESTful', 'Testes automatizados', 'CI/CD'],
  'Desenvolvedor Full Stack': ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'APIs RESTful', 'Git'],
  'UX Designer III': ['Figma', 'Design System', 'Pesquisa com usuários', 'Prototipação', 'Acessibilidade', 'Design Thinking'],
  'Engenheiro de Dados': ['Python', 'SQL', 'Spark', 'Airflow', 'AWS', 'Modelagem de dados', 'Observabilidade'],
  'Analista de QA': ['Testes manuais', 'Cypress', 'Casos de teste', 'Automação de testes', 'APIs RESTful', 'Git'],
  'Cientista de Dados': ['Python', 'Machine Learning', 'Pandas', 'SQL', 'MLOps', 'Estatística'],
  'DevOps Engineer': ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Observabilidade', 'Docker'],
  'Tech Lead Frontend': ['React', 'TypeScript', 'Arquitetura', 'Performance', 'Mentoria', 'Design System'],
  'Desenvolvedor Mobile': ['React Native', 'TypeScript', 'iOS', 'Android', 'APIs RESTful', 'Git'],
}
const COMPETENCIAS_BASE = ['Comunicação', 'Trabalho em equipe', 'Resolução de problemas', 'Organização', 'Metodologias ágeis']

const recomendaDeScore = (s: number): Recomendacao => (s >= 80 ? 'Sim' : s >= 60 ? 'Talvez' : 'Não')

// Gera um detalhe COERENTE a partir dos campos base (p/ todo candidato ter uma tela completa).
export function buildDetalhe(c: { nome: string; vaga: string; data: string; score: number }): Detalhe {
  const primeiro = c.nome.split(' ')[0]
  const s = c.score
  const conclusao = s >= 80 ? 'Os exemplos apresentados foram consistentes e bem fundamentados.' : s >= 60 ? 'Alguns pontos ainda merecem aprofundamento em situações práticas.' : 'Há lacunas relevantes frente aos requisitos técnicos da vaga.'
  return {
    aderencia: Math.min(98, s + 6),
    dataAnalise: `${c.data} 12:13`,
    scoreGeral: s,
    recomendacao: recomendaDeScore(s),
    dataEntrevista: `${c.data} 18:47`,
    avaliacaoTecnica: `${primeiro} demonstrou conhecimento compatível com a vaga de ${c.vaga}, com familiaridade nas principais ferramentas e práticas exigidas. ${conclusao}`,
    avaliacaoComportamental: `${primeiro} comunica-se de forma clara e colaborativa, com bons exemplos de trabalho em equipe e foco em resultados. Mostrou abertura a feedback e organização na condução das próprias entregas.`,
    pontosFortes: ['Boa fundamentação técnica nas tecnologias da vaga.', 'Comunicação clara e objetiva.', 'Foco em resultados e qualidade das entregas.', 'Postura colaborativa em equipes ágeis.'],
    areasMelhoria: ['Aprofundar experiência prática em cenários de maior complexidade.', 'Ampliar o repertório de ferramentas específicas da vaga.', 'Ganhar mais autonomia na condução de decisões técnicas.'],
    feedbackDetalhado: `${primeiro} apresenta um perfil consistente para a vaga de ${c.vaga}, com pontos fortes claros em execução e colaboração.\nRecomendamos avançar para uma etapa técnica mais aprofundada, validando a profundidade em cenários reais e a aderência aos requisitos críticos da posição.`,
    analiseCandidato: `${primeiro} possui experiência alinhada à vaga de ${c.vaga}, com histórico que evidencia domínio das principais responsabilidades e tecnologias esperadas. O currículo indica boa aderência ao perfil buscado, com espaço para validação prática na entrevista técnica.`,
    competencias: [...(COMPETENCIAS_VAGA[c.vaga] ?? []), ...COMPETENCIAS_BASE],
    perguntas: [
      { titulo: `Experiência em ${c.vaga}`, texto: `Conte sobre um desafio técnico relevante que você resolveu atuando em ${c.vaga}. Qual era o contexto, o que você fez e qual foi o resultado?` },
      { titulo: 'Colaboração e comunicação', texto: 'Descreva uma situação em que precisou alinhar diferentes pessoas (produto, design, engenharia) em torno de uma decisão. Como conduziu e lidou com divergências?' },
      { titulo: 'Aprendizado e autonomia', texto: 'Fale sobre algo novo que você precisou aprender rapidamente para entregar. Como se organizou e como mediu o progresso?' },
    ],
  }
}

// Pílula de status: mapa valor→TOM (a renderização token-driven mora no StatusBadge).
const STATUS_TONE: Record<StatusIA, BadgeTone> = {
  'Pendente': 'warning',
  'Aprovado bot': 'primary',
  'Aprovado RH': 'success',
  'Reprovado': 'destructive',
}
const RECOMENDA_TONE: Record<Recomendacao, BadgeTone> = {
  'Sim': 'success',
  'Talvez': 'warning',
  'Não': 'destructive',
}
const STATUS_FILTROS = ['Todos', 'Pendente', 'Aprovado bot', 'Aprovado RH', 'Reprovado'] as const
const PER_PAGE = 10

const acionavel = (s: StatusIA) => s === 'Pendente' || s === 'Aprovado bot'

// Faixa de uma nota 0–100 → cor do texto (-text, AA) + cor da barra (fill sólido).
function faixa(s: number) {
  if (s >= 80) return { text: 'text-success-text', bar: 'bg-success' }
  if (s >= 65) return { text: 'text-warning-text', bar: 'bg-warning' }
  return { text: 'text-destructive-text', bar: 'bg-destructive' }
}
const scoreTint = (s: number) => (s >= 80 ? 'bg-success/10 text-success-text' : s >= 65 ? 'bg-warning/10 text-warning-text' : 'bg-destructive/10 text-destructive-text')

function ColFilter({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className="w-full font-normal"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  )
}

// ---------- Detalhe do candidato ----------

function Meta({ icon: Icon, label, value, children }: { icon: ComponentType<{ className?: string }>; label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-text" aria-hidden><Icon className="size-4.5" /></span>
      <div className="min-w-0">
        <p className="ty-caption text-muted-foreground">{label}</p>
        <div className="ty-body-sm font-medium break-words text-foreground">{value ?? children}</div>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, unit = '' }: { label: string; value: number; unit?: string }) {
  const f = faixa(value)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="ty-body-sm font-medium text-foreground">{label}</p>
        <span className={cn('font-heading text-xl font-bold tabular-nums', f.text)}>{value}{unit}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={cn('h-full rounded-full transition-all', f.bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// Bloco de texto avaliativo (tile suave — evita "card dentro de card").
function Bloco({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 p-4">
      <h3 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><Icon className="size-4 text-muted-foreground" aria-hidden /> {title}</h3>
      <p className="mt-2 ty-body-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

export function CandidatoDetalhe({ c, onVoltar, onAprovar, onReprovar }: { c: Candidato; onVoltar: () => void; onAprovar: () => void; onReprovar: () => void }) {
  const d = c.detalhe ?? buildDetalhe(c)
  return (
    <DetailScreen
      width="5xl"
      footer={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={onVoltar}><ChevronLeft aria-hidden /> Voltar para a lista</Button>
            <Button variant="ghost" className="bg-secondary/10 text-secondary-text hover:bg-secondary/15 hover:text-secondary-text" onClick={() => toast.info('Currículo enviado pelo candidato (demo).')}><FileText aria-hidden /> Abrir currículo</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ConfirmDialog
              trigger={<Button variant="destructive-outline"><XCircle aria-hidden /> Reprovar candidato</Button>}
              icon={XCircle}
              tone="destructive"
              confirmVariant="destructive"
              title="Reprovar este candidato?"
              description={`${c.nome} será movido para "Reprovado", encerrando a participação no processo seletivo.`}
              cancelLabel="Voltar"
              confirmLabel="Reprovar"
              onConfirm={onReprovar}
            />
            <Button onClick={onAprovar}><CheckCircle2 aria-hidden /> Aprovar candidato</Button>
          </div>
        </>
      }
    >
      {/* hero */}
      <header className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-surface-ring">
        <div className="flex items-center gap-4 p-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 font-heading text-xl font-bold" aria-hidden>{iniciais(c.nome)}</span>
          <div className="min-w-0">
            <p className="ty-overline text-primary-foreground">Detalhes do candidato</p>
            <h1 className="truncate font-heading text-2xl font-bold tracking-tight sm:text-3xl">{c.nome}</h1>
            <p className="mt-0.5 truncate ty-body-sm text-primary-foreground">{c.vaga}</p>
          </div>
        </div>
      </header>

      {/* visão geral: contato/meta + scores + currículo */}
      <section className={cn(CARD, 'p-6')}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Meta icon={Mail} label="E-mail" value={c.email} />
            <Meta icon={Briefcase} label="Vaga" value={c.vaga} />
            <Meta icon={CircleDot} label="Status"><StatusBadge value={c.status} tones={STATUS_TONE} /></Meta>
            <Meta icon={Calendar} label="Data da análise" value={d.dataAnalise} />
          </div>
          <div className="space-y-5">
            <ScoreBar label="Aderência à vaga" value={d.aderencia} unit="%" />
            <ScoreBar label="Score da entrevista (IA)" value={d.scoreGeral} />
            <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
              <div>
                <p className="ty-caption text-muted-foreground">Recomendação</p>
                <StatusBadge value={d.recomendacao} tones={RECOMENDA_TONE} className="mt-1" />
              </div>
              <div>
                <p className="ty-caption text-muted-foreground">Data da entrevista</p>
                <p className="mt-1 flex items-center gap-1.5 ty-body-sm font-medium tabular-nums text-foreground"><Clock className="size-3.5 text-muted-foreground" aria-hidden /> {d.dataEntrevista}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* avaliação da IA */}
      <Panel icon={Sparkles} title="Avaliação da entrevista com IA" desc="Resultado da entrevista conduzida pelo entrevistador conversacional." bodyClassName="space-y-5">
        <div className="space-y-4">
          <Bloco icon={BarChart3} title="Avaliação técnica">{d.avaliacaoTecnica}</Bloco>
          <Bloco icon={Users} title="Avaliação comportamental">{d.avaliacaoComportamental}</Bloco>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><CheckCircle2 className="size-4 text-success-text" aria-hidden /> Pontos fortes</h3>
            <div className="mt-3 space-y-2">
              {d.pontosFortes.map((p, i) => (
                <span key={i} className="flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2 ty-body-sm ring-1 ring-success/20">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
                  <span className="text-foreground">{p}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><ArrowUpRight className="size-4 text-warning-text" aria-hidden /> Áreas de melhoria</h3>
            <div className="mt-3 space-y-2">
              {d.areasMelhoria.map((p, i) => (
                <span key={i} className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 ty-body-sm ring-1 ring-warning/20">
                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
                  <span className="text-foreground">{p}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><MessageSquareText className="size-4 text-muted-foreground" aria-hidden /> Feedback detalhado</h3>
          <div className="mt-2 space-y-3 ty-body-sm leading-relaxed text-muted-foreground">
            {d.feedbackDetalhado.split('\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>
      </Panel>

      {/* análise do currículo + competências */}
      <Panel icon={FileSearch} title="Análise do currículo" desc="Resumo do currículo analisado e competências identificadas." bodyClassName="space-y-5">
        <p className="ty-body-sm leading-relaxed text-muted-foreground">{d.analiseCandidato}</p>
        <div>
          <h3 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><Tags className="size-4 text-muted-foreground" aria-hidden /> Competências e habilidades</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {d.competencias.map((s, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 ty-body-sm font-medium text-primary-text ring-1 ring-primary/15">{s}</span>
            ))}
          </div>
        </div>
      </Panel>

      {/* perguntas sugeridas */}
      <Panel icon={HelpCircle} title="Perguntas sugeridas para a entrevista" desc="Use como guia durante a entrevista com o candidato." bodyClassName="space-y-5">
        <div className="space-y-3">
          {d.perguntas.map((p, i) => (
            <div key={i} className="rounded-xl bg-muted/30 p-4">
              <p className="ty-overline text-muted-foreground">Pergunta {i + 1}</p>
              <p className="mt-1 ty-body-sm font-semibold text-primary-text">{p.titulo}</p>
              <p className="mt-1.5 ty-body-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </div>
          ))}
        </div>
      </Panel>
    </DetailScreen>
  )
}

// Conteúdo da avaliação da IA em formato EMBUTIDO (sem cards externos) — reaproveitado dentro de outra
// superfície, ex.: a etapa "Triagem de currículo por IA" do detalhe de um processo seletivo.
export function AvaliacaoIAConteudo({ d, email, vaga, statusLabel }: {
  d: Detalhe; email?: string; vaga?: string; statusLabel?: StatusIA
}) {
  return (
    <div className="space-y-6">
      {/* visão geral: meta (largura total, 2 colunas) + scores empilhados — não espreme em coluna estreita */}
      <div className="space-y-6">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {email && <Meta icon={Mail} label="E-mail" value={email} />}
          {vaga && <Meta icon={Briefcase} label="Vaga" value={vaga} />}
          {statusLabel && <Meta icon={CircleDot} label="Status"><StatusBadge value={statusLabel} tones={STATUS_TONE} /></Meta>}
          <Meta icon={Calendar} label="Data da análise" value={d.dataAnalise} />
        </div>
        <div className="space-y-5">
          <ScoreBar label="Aderência à vaga" value={d.aderencia} unit="%" />
          <ScoreBar label="Score da entrevista (IA)" value={d.scoreGeral} />
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
            <div>
              <p className="ty-caption text-muted-foreground">Recomendação</p>
              <StatusBadge value={d.recomendacao} tones={RECOMENDA_TONE} className="mt-1" />
            </div>
            <div>
              <p className="ty-caption text-muted-foreground">Data da entrevista</p>
              <p className="mt-1 flex items-center gap-1.5 ty-body-sm font-medium tabular-nums text-foreground"><Clock className="size-3.5 text-muted-foreground" aria-hidden /> {d.dataEntrevista}</p>
            </div>
          </div>
        </div>
      </div>

      {/* avaliação técnica / comportamental */}
      <div className="space-y-4">
        <Bloco icon={BarChart3} title="Avaliação técnica">{d.avaliacaoTecnica}</Bloco>
        <Bloco icon={Users} title="Avaliação comportamental">{d.avaliacaoComportamental}</Bloco>
      </div>

      {/* pontos fortes / áreas de melhoria */}
      <div className="space-y-5">
        <div>
          <h4 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><CheckCircle2 className="size-4 text-success-text" aria-hidden /> Pontos fortes</h4>
          <div className="mt-3 space-y-2">
            {d.pontosFortes.map((p, i) => (
              <span key={i} className="flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2 ty-body-sm ring-1 ring-success/20">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
                <span className="text-foreground">{p}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><ArrowUpRight className="size-4 text-warning-text" aria-hidden /> Áreas de melhoria</h4>
          <div className="mt-3 space-y-2">
            {d.areasMelhoria.map((p, i) => (
              <span key={i} className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 ty-body-sm ring-1 ring-warning/20">
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
                <span className="text-foreground">{p}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* feedback detalhado */}
      <div>
        <h4 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><MessageSquareText className="size-4 text-muted-foreground" aria-hidden /> Feedback detalhado</h4>
        <div className="mt-2 space-y-3 ty-body-sm leading-relaxed text-muted-foreground">
          {d.feedbackDetalhado.split('\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>

      {/* análise do currículo + competências */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><FileSearch className="size-4 text-muted-foreground" aria-hidden /> Análise do currículo</h4>
          <Button variant="ghost" size="sm" className="bg-secondary/10 text-secondary-text hover:bg-secondary/15 hover:text-secondary-text" onClick={() => toast.info('Currículo enviado pelo candidato (demo).')}><FileText aria-hidden /> Abrir currículo</Button>
        </div>
        <p className="mt-2 ty-body-sm leading-relaxed text-muted-foreground">{d.analiseCandidato}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {d.competencias.map((s, i) => (
            <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 ty-body-sm font-medium text-primary-text ring-1 ring-primary/15">{s}</span>
          ))}
        </div>
      </div>

      {/* perguntas sugeridas */}
      <div>
        <h4 className="flex items-center gap-2 ty-body-sm font-semibold text-foreground"><HelpCircle className="size-4 text-muted-foreground" aria-hidden /> Perguntas sugeridas para a entrevista</h4>
        <div className="mt-3 space-y-3">
          {d.perguntas.map((p, i) => (
            <div key={i} className="rounded-xl bg-muted/30 p-4">
              <p className="ty-overline text-muted-foreground">Pergunta {i + 1}</p>
              <p className="mt-1 ty-body-sm font-semibold text-primary-text">{p.titulo}</p>
              <p className="mt-1.5 ty-body-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Lista de triagem ----------

export function EntrevistasIA({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const [cands, setCands] = useState<Candidato[]>(CANDIDATOS_INICIAL)
  const [statusF, setStatusF] = useState<(typeof STATUS_FILTROS)[number]>('Todos')
  const [vagaF, setVagaF] = useState('Todas')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [vendo, setVendo] = useState<Candidato | null>(null)

  // KPIs DERIVADOS (atualizam ao aprovar/reprovar) — números reais, não decorativos.
  const pendentes = cands.filter((c) => c.status === 'Pendente').length
  const aprovadosBot = cands.filter((c) => c.status === 'Aprovado bot').length
  const aprovadosRH = cands.filter((c) => c.status === 'Aprovado RH').length

  const vagas = ['Todas', ...Array.from(new Set(cands.map((c) => c.vaga)))]

  const filtrados = cands.filter(
    (c) =>
      (statusF === 'Todos' || c.status === statusF) &&
      (vagaF === 'Todas' || c.vaga === vagaF) &&
      (c.nome.toLowerCase().includes(q.trim().toLowerCase()) || c.email.toLowerCase().includes(q.trim().toLowerCase())),
  )

  const { page, setPage, pageItems, total, inicio, totalItems } = usePagination(filtrados, PER_PAGE)
  const resetPage = () => setPage(1)

  const pageActionableIds = pageItems.filter((c) => acionavel(c.status)).map((c) => c.id)
  const allPageSelected = pageActionableIds.length > 0 && pageActionableIds.every((id) => sel.has(id))
  const toggleAllPage = (checked: boolean) =>
    setSel((prev) => {
      const next = new Set(prev)
      pageActionableIds.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  const toggleOne = (id: string, checked: boolean) =>
    setSel((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const aplicar = (novo: StatusIA, msg: (n: number) => string) => {
    if (sel.size === 0) return
    const n = sel.size
    setCands((cs) => cs.map((c) => (sel.has(c.id) ? { ...c, status: novo } : c)))
    toast.success(msg(n))
    setSel(new Set())
  }
  const aprovar = () => aplicar('Aprovado RH', (n) => `${n} candidato(s) aprovado(s) pelo RH (demo).`)
  const reprovar = () => aplicar('Reprovado', (n) => `${n} candidato(s) reprovado(s) (demo).`)

  // Decisão individual na tela de detalhe → muda o status do candidato e volta para a listagem.
  const decidirDetalhe = (novo: StatusIA, verbo: string) => {
    if (!vendo) return
    setCands((cs) => cs.map((x) => (x.id === vendo.id ? { ...x, status: novo } : x)))
    toast.success(`Candidato "${vendo.nome}" ${verbo} (demo).`)
    setVendo(null)
  }

  // Qualquer clique no menu (inclusive no próprio "Entrevistas IA") volta para a listagem: o navHandle
  // dispara onNavigate mesmo no item já ativo, então limpamos o candidato em foco antes de navegar.
  const handleNav = (v: string) => { setVendo(null); onNavigate(v) }

  const crumb = vendo ? vendo.nome : 'Entrevistas IA'

  return (
    <AppShell active="entrevistas-ia" crumb={crumb} onNavigate={handleNav} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      {vendo ? (
        <CandidatoDetalhe c={vendo} onVoltar={() => setVendo(null)} onAprovar={() => decidirDetalhe('Aprovado RH', 'aprovado pelo RH')} onReprovar={() => decidirDetalhe('Reprovado', 'reprovado')} />
      ) : (
        <PageContainer>
          <PageHeader
            icon={Bot}
            title="Entrevistas IA"
            desc="Acompanhe as entrevistas concluídas pela IA no primeiro funil de recrutamento e registre a decisão do RH — aprovação ou reprovação. Clique em um candidato para ver a análise completa."
          />

          {/* KPIs — números reais derivados da lista */}
          <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total" value={cands.length} />
            <StatCard icon={Clock} label="Pendente" value={pendentes} />
            <StatCard icon={Bot} label="Aprovado bot" value={aprovadosBot} />
            <StatCard icon={CheckCircle2} label="Aprovado RH" value={aprovadosRH} />
          </section>

          {/* Lista de triagem — filtros DENTRO do card */}
          <section aria-labelledby="lista-triagem" className={cn(CARD, 'overflow-hidden')}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4 sm:p-5">
              <h2 id="lista-triagem" className="flex items-center gap-2 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                <Sparkles className="size-5 shrink-0 text-primary-text" aria-hidden /> Candidatos na triagem
                <span className="ty-body-sm font-normal text-muted-foreground tabular-nums">({filtrados.length})</span>
              </h2>
              {/* Ações em lote — na mesma linha do título; aplicam a regra de progressão da etapa IA → RH. */}
              <div className="flex flex-wrap items-center gap-2">
                {sel.size > 0 && (
                  <span className="mr-1 ty-body-sm font-medium text-primary-text tabular-nums" aria-live="polite">{sel.size} selecionado(s)</span>
                )}
                <Button onClick={aprovar} disabled={sel.size === 0}><CheckCircle2 aria-hidden /> Aprovar selecionados</Button>
                <ConfirmDialog
                  trigger={<Button variant="destructive-outline" disabled={sel.size === 0}><XCircle aria-hidden /> Reprovar selecionados</Button>}
                  icon={XCircle}
                  tone="destructive"
                  confirmVariant="destructive"
                  title={`Reprovar ${sel.size} candidato${sel.size > 1 ? 's' : ''}?`}
                  description="Os candidatos selecionados serão movidos para “Reprovado”, encerrando a participação deles no processo seletivo."
                  cancelLabel="Voltar"
                  confirmLabel="Reprovar"
                  onConfirm={reprovar}
                />
              </div>
            </div>

            <Table className="[&_:is(th,td):first-child]:pl-5 [&_:is(th,td):last-child]:pr-5">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox checked={allPageSelected} onCheckedChange={(v) => toggleAllPage(v === true)} disabled={pageActionableIds.length === 0} aria-label="Selecionar todos os candidatos desta página" />
                  </TableHead>
                  <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Candidato</TableHead>
                  <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Vaga</TableHead>
                  <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Pontuação IA</TableHead>
                  <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Data</TableHead>
                  <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Status</TableHead>
                </TableRow>
                {/* Linha de FILTRO — barra de ferramentas (td, não th: não são cabeçalhos de coluna). */}
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell className="py-2" />
                  <TableCell className="py-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input value={q} onChange={(e) => { setQ(e.target.value); resetPage() }} placeholder="Buscar nome ou e-mail…" aria-label="Buscar candidato por nome ou e-mail" className="h-8 pl-8 ty-body-sm font-normal" />
                    </div>
                  </TableCell>
                  <TableCell className="py-2"><ColFilter value={vagaF} onChange={(v) => { setVagaF(v); resetPage() }} options={vagas} label="Filtrar por vaga" /></TableCell>
                  <TableCell className="py-2" />
                  <TableCell className="py-2" />
                  <TableCell className="py-2"><ColFilter value={statusF} onChange={(v) => { setStatusF(v as (typeof STATUS_FILTROS)[number]); resetPage() }} options={STATUS_FILTROS} label="Filtrar por status" /></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-14 text-center ty-body-sm text-muted-foreground">Nenhum candidato encontrado com esses filtros.</TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((c) => (
                    // Linha clicável abre o detalhe (conveniência de mouse). O acesso por teclado/leitor é
                    // o botão do nome; a célula do checkbox para a propagação p/ selecionar não navegar.
                    <TableRow key={c.id} data-state={sel.has(c.id) ? 'selected' : undefined} onClick={() => setVendo(c)} className="cursor-pointer">
                      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={sel.has(c.id)} onCheckedChange={(v) => toggleOne(c.id, v === true)} disabled={!acionavel(c.status)} aria-label={`Selecionar ${c.nome}`} />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full ty-caption font-semibold', tintFor(c.nome))} aria-hidden>{iniciais(c.nome)}</span>
                          <div className="min-w-0">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setVendo(c) }} className="block max-w-full truncate rounded-sm text-left ty-body-sm font-medium text-foreground transition-colors hover:text-primary-text focus-visible:focus-ring">{c.nome}</button>
                            <p className="truncate ty-caption text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 ty-body-sm text-muted-foreground">{c.vaga}</TableCell>
                      <TableCell className="py-3">
                        <Badge variant="ghost" className={cn('gap-1 ty-caption font-semibold tabular-nums', scoreTint(c.score))}><Sparkles className="size-3" aria-hidden /> {c.score}%</Badge>
                      </TableCell>
                      <TableCell className="py-3 ty-body-sm tabular-nums text-muted-foreground">{c.data}</TableCell>
                      <TableCell className="py-3"><StatusBadge value={c.status} tones={STATUS_TONE} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Paginação — barra abaixo da tabela (10 itens por página) */}
            {filtrados.length > 0 && (
              <Paginacao page={page} total={total} inicio={inicio} shown={pageItems.length} totalItems={totalItems} onPage={setPage} className="mt-0 px-4 pb-4 sm:px-5 sm:pb-5" />
            )}
          </section>
        </PageContainer>
      )}
    </AppShell>
  )
}
