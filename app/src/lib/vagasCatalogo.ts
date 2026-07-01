/**
 * Catálogo de vagas PÚBLICAS (visão do candidato) — MOCK. É "o que o candidato vê" no mural depois de
 * entrar na plataforma: todas as vagas abertas. TODAS são da própria TIS (é a página de carreiras da TIS).
 * Cada item carrega briefing + perfil COMPLETOS (mesma estrutura @/lib/vaga do recrutador), então o card
 * abre a descrição/inscrição real (InscricaoVaga) sem dado divergente. Constantes canônicas (benefícios/
 * processo) vêm de job-generator/model.ts. Localização estruturada (país/estado/cidade) alimenta o filtro
 * "Local de trabalho". Prosa em pt-BR (política de mock-prose). Determinístico p/ testes estáveis.
 */
import type { Briefing, Perfil } from '@/lib/vaga'
import { BENEFICIOS_POOL, PROCESSO_POOL } from '@/pages/job-generator/model'

// Todas as vagas são da TIS (carreira da própria plataforma).
export const EMPRESA = 'TIS Talent AI'

export type VagaPublica = {
  id: string
  pais: string
  estado: string // UF (Brasil) ou distrito/estado (internacional)
  cidade: string
  local: string // rótulo de exibição derivado (cidade, estado/país)
  publicada: string // dd/mm/aaaa
  prazoDias: number // dias ativos a partir de `publicada` (limite de tempo da vaga)
  pcd: boolean
  briefing: Briefing
  perfil: Perfil
}

// Prazo padrão de uma vaga ativa (dias após a publicação). Decisão de produto: 30 dias.
export const PRAZO_PADRAO_DIAS = 30

// Faixa salarial e experiência por nível (coerentes com o nível da vaga).
const BUDGET: Record<string, string> = {
  'Estágio': 'R$ 1.800 a R$ 2.500', 'Júnior': 'R$ 3.500 a R$ 5.000', 'Pleno': 'R$ 6.000 a R$ 9.000',
  'Sênior': 'R$ 10.000 a R$ 15.000', 'Especialista': 'R$ 14.000 a R$ 20.000', 'Liderança': 'R$ 18.000 a R$ 26.000',
}
const EXPERIENCIA: Record<string, string> = {
  'Estágio': 'Cursando ensino superior — sem experiência prévia exigida',
  'Júnior': 'Até 2 anos na área', 'Pleno': '2 a 4 anos na área', 'Sênior': '5+ anos na área',
  'Especialista': '7+ anos com profundidade técnica na especialidade', 'Liderança': '8+ anos, com experiência liderando times',
}

// Bits específicos por área (derivados do cargo) — stack, formação, responsabilidades, desafio/objetivo.
type Area = { desafio: string; objetivo: string; formacao: string; stack: string[]; desejaveis: string[]; resp: string; habilidades: string[] }
const AREAS: Record<string, Area> = {
  'Desenvolvedor Backend': {
    desafio: 'Evoluir os serviços de backend que sustentam o produto, com foco em performance, observabilidade e qualidade.',
    objetivo: 'Entregar APIs estáveis e bem testadas e reduzir a latência das integrações do time.',
    formacao: 'Ensino superior em Computação ou áreas correlatas (ou experiência equivalente)',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL', 'API REST', 'Docker'], desejaveis: ['Kafka', 'AWS', 'Microsserviços', 'CI/CD'],
    resp: 'Desenvolver e manter APIs e serviços. Escrever testes automatizados. Revisar o código dos colegas. Acompanhar performance e observabilidade.',
    habilidades: ['Comunicação clara', 'Autonomia', 'Colaboração', 'Pensamento analítico'],
  },
  'Desenvolvedor Frontend': {
    desafio: 'Construir interfaces acessíveis e performáticas, evoluindo o design system do produto.',
    objetivo: 'Entregar telas consistentes, acessíveis (WCAG) e rápidas, com forte colaboração com o time de design.',
    formacao: 'Ensino superior em Computação ou áreas correlatas (ou experiência equivalente)',
    stack: ['React', 'TypeScript', 'CSS', 'Vite', 'Testing Library'], desejaveis: ['Tailwind', 'Acessibilidade (WCAG)', 'Design tokens', 'Storybook'],
    resp: 'Desenvolver componentes e telas. Garantir acessibilidade e performance. Colaborar com design. Escrever testes de interface.',
    habilidades: ['Atenção a detalhe', 'Sensibilidade de UX', 'Colaboração', 'Comunicação clara'],
  },
  'Desenvolvedor Fullstack': {
    desafio: 'Atuar de ponta a ponta nas features do produto, do banco à interface.',
    objetivo: 'Entregar funcionalidades completas, com qualidade e bom tempo de resposta.',
    formacao: 'Ensino superior em Computação ou áreas correlatas (ou experiência equivalente)',
    stack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'], desejaveis: ['AWS', 'CI/CD', 'Testes automatizados', 'Metodologias ágeis'],
    resp: 'Desenvolver features completas (frontend e backend). Escrever testes. Participar das decisões técnicas. Revisar código.',
    habilidades: ['Autonomia', 'Visão de produto', 'Colaboração', 'Pensamento analítico'],
  },
  'Product Manager': {
    desafio: 'Conectar necessidades de clientes e negócio em um roadmap claro e priorizado.',
    objetivo: 'Aumentar o impacto das entregas com decisões baseadas em dados e descoberta contínua.',
    formacao: 'Ensino superior completo (Administração, Engenharia, Computação ou correlatas)',
    stack: ['Discovery', 'Roadmap', 'Métricas de produto', 'Pesquisa com usuários'], desejaveis: ['SQL', 'Experimentação A/B', 'Design thinking', 'OKRs'],
    resp: 'Priorizar o backlog. Conduzir descoberta com usuários. Definir métricas de sucesso. Alinhar negócio, design e engenharia.',
    habilidades: ['Comunicação', 'Visão estratégica', 'Empatia', 'Negociação'],
  },
  'Designer UX/UI': {
    desafio: 'Desenhar experiências acessíveis e consistentes, evoluindo o design system.',
    objetivo: 'Elevar a usabilidade e a acessibilidade do produto, com fluxos claros e validados.',
    formacao: 'Ensino superior em Design, áreas correlatas ou formação equivalente',
    stack: ['Figma', 'Design system', 'Prototipação', 'Acessibilidade (WCAG)'], desejaveis: ['Pesquisa com usuários', 'Design tokens', 'Noções de HTML/CSS', 'Motion'],
    resp: 'Desenhar fluxos e telas. Manter o design system. Conduzir testes de usabilidade. Colaborar com produto e engenharia.',
    habilidades: ['Sensibilidade visual', 'Empatia', 'Comunicação', 'Colaboração'],
  },
  'Analista de Dados': {
    desafio: 'Transformar dados em decisões, com análises e indicadores confiáveis.',
    objetivo: 'Dar visibilidade ao negócio com dashboards e análises que orientam decisões.',
    formacao: 'Ensino superior em Estatística, Computação, Engenharia ou correlatas',
    stack: ['SQL', 'Python', 'BI (dashboards)', 'Modelagem de dados'], desejaveis: ['dbt', 'ETL', 'Estatística', 'Cloud (BigQuery/Redshift)'],
    resp: 'Construir e manter dashboards. Fazer análises exploratórias. Garantir qualidade dos dados. Apoiar áreas com indicadores.',
    habilidades: ['Pensamento analítico', 'Comunicação', 'Curiosidade', 'Atenção a detalhe'],
  },
  'Engenheiro DevOps': {
    desafio: 'Sustentar e evoluir a infraestrutura e os pipelines que entregam o produto.',
    objetivo: 'Aumentar a confiabilidade e a velocidade de entrega com automação e observabilidade.',
    formacao: 'Ensino superior em Computação ou áreas correlatas (ou experiência equivalente)',
    stack: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'AWS'], desejaveis: ['Observabilidade', 'Segurança', 'Linux', 'Scripting'],
    resp: 'Manter a infraestrutura como código. Evoluir pipelines de CI/CD. Garantir observabilidade e confiabilidade. Apoiar os times de engenharia.',
    habilidades: ['Autonomia', 'Resolução de problemas', 'Colaboração', 'Atenção a detalhe'],
  },
  'Analista de QA': {
    desafio: 'Garantir a qualidade do produto com testes manuais e automatizados.',
    objetivo: 'Reduzir defeitos em produção e ampliar a cobertura de testes automatizados.',
    formacao: 'Ensino superior em Computação ou áreas correlatas (ou experiência equivalente)',
    stack: ['Testes automatizados', 'Cypress/Playwright', 'API testing', 'Casos de teste'], desejaveis: ['CI/CD', 'Testes de performance', 'Acessibilidade', 'SQL'],
    resp: 'Planejar e executar testes. Automatizar cenários. Reportar e acompanhar defeitos. Colaborar com o time no shift-left de qualidade.',
    habilidades: ['Atenção a detalhe', 'Pensamento crítico', 'Comunicação', 'Organização'],
  },
}

const GESTORES = ['Carlos Mendes', 'Ana Beatriz Rocha', 'Rafael Lima', 'Juliana Prado', 'Marcos Tavares', 'Patrícia Nunes']

type Spec = {
  cargo: keyof typeof AREAS; nivel: string
  pais: string; estado: string; cidade: string
  modelo: string; modalidade: string; pcd: boolean; data: string
  budget?: string // override do salário (ex.: "A combinar" em vagas PJ); senão usa a faixa por nível
  prazo?: number // override do prazo (dias); senão PRAZO_PADRAO_DIAS
}

// Mural mockado: variedade de cargo × nível (todos os níveis canônicos) × modelo × localização.
const SPECS: Spec[] = [
  { cargo: 'Designer UX/UI', nivel: 'Pleno', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', modelo: 'Remoto', modalidade: 'CLT', pcd: true, data: '20/06/2026' },
  { cargo: 'Desenvolvedor Backend', nivel: 'Sênior', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', modelo: 'Híbrido', modalidade: 'CLT', pcd: true, data: '19/06/2026' },
  { cargo: 'Product Manager', nivel: 'Pleno', pais: 'Brasil', estado: 'SP', cidade: 'Campinas', modelo: 'Híbrido', modalidade: 'CLT', pcd: false, data: '18/06/2026' },
  { cargo: 'Desenvolvedor Frontend', nivel: 'Júnior', pais: 'Brasil', estado: 'SC', cidade: 'Florianópolis', modelo: 'Remoto', modalidade: 'CLT', pcd: true, data: '17/06/2026' },
  { cargo: 'Analista de Dados', nivel: 'Pleno', pais: 'Brasil', estado: 'MG', cidade: 'Belo Horizonte', modelo: 'Presencial', modalidade: 'CLT', pcd: false, data: '16/06/2026' },
  { cargo: 'Engenheiro DevOps', nivel: 'Sênior', pais: 'Brasil', estado: 'RJ', cidade: 'Rio de Janeiro', modelo: 'Híbrido', modalidade: 'PJ', budget: 'A combinar', pcd: false, data: '15/06/2026' },
  { cargo: 'Designer UX/UI', nivel: 'Especialista', pais: 'Brasil', estado: 'PR', cidade: 'Curitiba', modelo: 'Remoto', modalidade: 'CLT', pcd: true, data: '13/06/2026' },
  { cargo: 'Desenvolvedor Fullstack', nivel: 'Pleno', pais: 'Brasil', estado: 'RS', cidade: 'Porto Alegre', modelo: 'Híbrido', modalidade: 'CLT', pcd: false, data: '12/06/2026' },
  { cargo: 'Analista de QA', nivel: 'Júnior', pais: 'Brasil', estado: 'PE', cidade: 'Recife', modelo: 'Remoto', modalidade: 'CLT', pcd: true, data: '11/06/2026' },
  { cargo: 'Desenvolvedor Backend', nivel: 'Estágio', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', modelo: 'Presencial', modalidade: 'Estágio', pcd: false, data: '09/06/2026' },
  { cargo: 'Product Manager', nivel: 'Liderança', pais: 'Brasil', estado: 'RJ', cidade: 'Rio de Janeiro', modelo: 'Híbrido', modalidade: 'CLT', pcd: false, data: '06/06/2026' },
  { cargo: 'Analista de Dados', nivel: 'Sênior', pais: 'Brasil', estado: 'SP', cidade: 'Campinas', modelo: 'Remoto', modalidade: 'PJ', pcd: true, data: '04/06/2026' },
  { cargo: 'Desenvolvedor Frontend', nivel: 'Pleno', pais: 'Portugal', estado: 'Lisboa', cidade: 'Lisboa', modelo: 'Híbrido', modalidade: 'CLT', pcd: false, data: '02/06/2026' },
  { cargo: 'Engenheiro DevOps', nivel: 'Especialista', pais: 'México', estado: 'CDMX', cidade: 'Cidade do México', modelo: 'Remoto', modalidade: 'PJ', budget: 'A combinar', pcd: false, data: '30/05/2026' },
  { cargo: 'Desenvolvedor Fullstack', nivel: 'Liderança', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', modelo: 'Híbrido', modalidade: 'CLT', pcd: false, data: '28/05/2026' },
]

// Rótulo de local SEMPRE com o país (deixa claro se é no Brasil ou fora). Omite o estado quando é igual à
// cidade (ex.: Lisboa). Ex.: "Campinas, SP · Brasil" · "Lisboa · Portugal" · "Cidade do México, CDMX · México".
const localLabel = (s: Spec) => {
  const cidadeEstado = s.estado && s.estado !== s.cidade ? `${s.cidade}, ${s.estado}` : s.cidade
  return `${cidadeEstado} · ${s.pais}`
}

function mkVaga(s: Spec, i: number): VagaPublica {
  const a = AREAS[s.cargo]
  // Quantidade de vagas variada (1–3) p/ o mural não ficar tudo "1 vaga".
  const quantidade = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1
  const briefing: Briefing = {
    cargo: s.cargo, nivel: s.nivel, modelo: s.modelo, cliente: EMPRESA, gestor: GESTORES[i % GESTORES.length],
    desafio: a.desafio, objetivo: a.objetivo,
    local: localLabel(s), horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade, prazo: s.prazo ?? PRAZO_PADRAO_DIAS,
    budget: s.budget ?? BUDGET[s.nivel], modalidade: s.modalidade,
    beneficios: BENEFICIOS_POOL.slice(0, 6),
    processoSeletivo: [PROCESSO_POOL[0], PROCESSO_POOL[1], PROCESSO_POOL[3], PROCESSO_POOL[5], PROCESSO_POOL[9]],
  }
  const perfil: Perfil = {
    formacao: a.formacao, experiencia: EXPERIENCIA[s.nivel],
    exigencias: ['Boas práticas e organização', 'Trabalho em time ágil', 'Comunicação clara'],
    stackObrigatoria: a.stack, conhecimentosDesejaveis: a.desejaveis,
    responsabilidades: a.resp, habilidades: a.habilidades,
    justificativa: 'O crescimento da demanda exige reforço no time.',
  }
  return { id: String(i + 1), pais: s.pais, estado: s.estado, cidade: s.cidade, local: localLabel(s), publicada: s.data, prazoDias: s.prazo ?? PRAZO_PADRAO_DIAS, pcd: s.pcd, briefing, perfil }
}

export const VAGAS_CATALOGO: VagaPublica[] = SPECS.map(mkVaga)

/* ─── filtro do mural (função pura, testável) ─── */
export type FiltroVagas = { q: string; modelo: string; nivel: string; pais: string; estado: string; cidade: string; soPcd: boolean }
export const FILTRO_VAZIO: FiltroVagas = { q: '', modelo: 'todos', nivel: 'todos', pais: 'todos', estado: 'todos', cidade: 'todas', soPcd: false }

export function filtrarVagas(vagas: VagaPublica[], f: FiltroVagas): VagaPublica[] {
  const q = f.q.trim().toLowerCase()
  return vagas.filter(
    (v) =>
      (q === '' || v.briefing.cargo.toLowerCase().includes(q)) &&
      (f.modelo === 'todos' || v.briefing.modelo === f.modelo) &&
      (f.nivel === 'todos' || v.briefing.nivel === f.nivel) &&
      (f.pais === 'todos' || v.pais === f.pais) &&
      (f.estado === 'todos' || v.estado === f.estado) &&
      (f.cidade === 'todas' || v.cidade === f.cidade) &&
      (!f.soPcd || v.pcd),
  )
}

export const filtroAtivo = (f: FiltroVagas) =>
  f.q.trim() !== '' || f.modelo !== 'todos' || f.nivel !== 'todos' || f.pais !== 'todos' || f.estado !== 'todos' || f.cidade !== 'todas' || f.soPcd

/* ─── ordenação por data de publicação (dd/mm/aaaa → aaaammdd, comparável) ─── */
export type Ordem = 'recentes' | 'antigas'
const chaveData = (d: string) => d.split('/').reverse().join('') // 'dd/mm/aaaa' -> 'aaaammdd'
export function ordenarVagas(vagas: VagaPublica[], ordem: Ordem): VagaPublica[] {
  return [...vagas].sort((a, b) =>
    ordem === 'recentes' ? chaveData(b.publicada).localeCompare(chaveData(a.publicada)) : chaveData(a.publicada).localeCompare(chaveData(b.publicada)),
  )
}

export const localFiltroAtivo = (f: FiltroVagas) => f.pais !== 'todos' || f.estado !== 'todos' || f.cidade !== 'todas'

/* ─── opções em cascata do filtro "Local de trabalho" (derivadas do catálogo) ─── */
export const PAISES = [...new Set(VAGAS_CATALOGO.map((v) => v.pais))]
export const estadosDe = (pais: string) =>
  [...new Set(VAGAS_CATALOGO.filter((v) => pais === 'todos' || v.pais === pais).map((v) => v.estado))]
export const cidadesDe = (pais: string, estado: string) =>
  [...new Set(
    VAGAS_CATALOGO.filter((v) => (pais === 'todos' || v.pais === pais) && (estado === 'todos' || v.estado === estado)).map((v) => v.cidade),
  )]

/* ─── prazo / expiração da vaga (limite de tempo) — funções PURAS que recebem `hoje` (testáveis e
   determinísticas; nada de new Date() aqui dentro). Vaga expira em `publicada + prazoDias`. ─── */
const soData = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()) // zera horas
const parseData = (d: string) => { const [dd, mm, aaaa] = d.split('/').map(Number); return new Date(aaaa, mm - 1, dd) }

export function dataExpiracao(v: VagaPublica): Date {
  const base = parseData(v.publicada)
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + v.prazoDias)
}
/** Dias restantes até expirar (0 = expira hoje; negativo = já expirou). */
export function diasRestantes(v: VagaPublica, hoje: Date): number {
  return Math.round((soData(dataExpiracao(v)).getTime() - soData(hoje).getTime()) / 86_400_000)
}
export const estaExpirada = (v: VagaPublica, hoje: Date) => diasRestantes(v, hoje) < 0
/** Mural só lista vagas ATIVAS (não expiradas). */
export const vagasAtivas = (vagas: VagaPublica[], hoje: Date) => vagas.filter((v) => !estaExpirada(v, hoje))

/* ─── lookup da vaga por id — o card abre a vaga em NOVA ABA via ?vaga=<id> (id na URL funciona entre
   abas; sessionStorage não). A aba nova lê o id e resolve a vaga aqui. ─── */
export const vagaPorId = (id: string) => VAGAS_CATALOGO.find((v) => v.id === id)
