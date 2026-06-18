/**
 * Modelo de dados, constantes estáticas e funções puras de validação do Gerador de Vagas.
 * Fonte única compartilhada pelos subcomponentes (sem JSX). O modelo de domínio (Briefing, Perfil,
 * Tom, GeneratedDesc) e o buildDesc vivem em @/lib/vaga — também compartilhados com a Lista/Detalhe.
 */
import {
  AlignLeft,
  Building2,
  CalendarClock,
  Code2,
  ListChecks,
  Rocket,
  Star,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { TFunction } from 'i18next'
import type { Briefing, Perfil, Tom } from '@/lib/vaga'

/* ────────────────────────────── dados estáticos ────────────────────────────── */

export const STEPS = [
  { n: 1, title: 'Briefing da Vaga', eyebrow: 'Briefing', desc: 'Dados institucionais e operacionais' },
  { n: 2, title: 'Perfil e Requisitos', eyebrow: 'Perfil', desc: 'Skills, experiência e formação' },
  { n: 3, title: 'Revisar & Publicar', eyebrow: 'Revisão', desc: 'Revise, edite e publique a vaga' },
] as const

export const CARGOS = ['Desenvolvedor Backend', 'Desenvolvedor Frontend', 'Desenvolvedor Fullstack', 'Product Manager', 'Designer UX/UI', 'Analista de Dados', 'Engenheiro DevOps', 'Analista de QA']
export const NIVEIS = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Liderança']
export const MODELOS = ['Presencial', 'Híbrido', 'Remoto']
export const CARGAS = ['20 horas', '30 horas', '40 horas', '44 horas']
export const HORARIOS = ['08:00 às 17:00', '09:00 às 18:00', '10:00 às 19:00', '12:00 às 21:00', 'Horário flexível', 'Escala 12x36']
export const MOTIVOS = ['Aumento do quadro', 'Substituição', 'Novo projeto', 'Backfill', 'Confidencial']
export const MODALIDADES = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Cooperado']
export const QUANTIDADES = Array.from({ length: 20 }, (_, i) => String(i + 1))
export const BENEFICIOS_POOL = ['Vale-refeição', 'Vale-transporte', 'Plano de saúde', 'Plano odontológico', 'Auxílio home-office', 'Day-off aniversário', 'Gympass', 'Bônus anual', 'Stock options', 'Auxílio creche', 'Seguro de vida', 'Horário flexível']
export const PROCESSO_POOL = ['Triagem de currículo', 'Entrevista com RH', 'Entrevista comportamental', 'Teste técnico / Case', 'Entrevista técnica', 'Entrevista com gestor', 'Entrevista com liderança', 'Dinâmica de grupo', 'Verificação de referências', 'Proposta']

// O modelo de dados (Briefing, Perfil, Tom, GeneratedDesc) e o buildDesc vivem em @/lib/vaga — fonte
// única compartilhada com a Lista/Detalhe de vagas.
export type SetBriefing = <K extends keyof Briefing>(k: K, v: Briefing[K]) => void

export const BRIEFING_INICIAL: Briefing = {
  cargo: 'Desenvolvedor Backend', nivel: 'Pleno', modelo: 'Híbrido',
  cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
  desafio: 'Estamos expandindo o time de engenharia do TIS Talent AI Platform para sustentar o crescimento da plataforma.',
  objetivo: 'Ampliar a capacidade de entrega de soluções backend de alta performance, garantindo escalabilidade e qualidade nas integrações da plataforma.',
  local: 'São Paulo — SP', horario: '', carga: '', motivo: 'Aumento do quadro', quantidade: 1,
  budget: '', modalidade: 'CLT', beneficios: ['Vale-refeição', 'Plano de saúde', 'Auxílio home-office', 'Day-off aniversário'],
  processoSeletivo: ['Entrevista comportamental', 'Entrevista técnica', 'Entrevista com RH'],
}

/* seções do briefing: ícone + campos (p/ status reativo conforme o usuário preenche).
 * `key` = identificador estável p/ a tradução (sections.<key> no namespace 'gerador'); title/desc
 * ficam como fallback pt-BR (a UI exibe via t()). */
export const SECTIONS = [
  { key: 'identidade', icon: Building2, title: 'Identidade da vaga', desc: 'Como essa posição se posiciona dentro da organização.', fields: ['cargo', 'nivel', 'modelo', 'cliente', 'gestor'] as (keyof Briefing)[] },
  { key: 'sobre', icon: Rocket, title: 'Sobre a vaga', desc: 'O contexto do desafio e o objetivo da contratação — a abertura da descrição.', fields: ['desafio', 'objetivo'] as (keyof Briefing)[] },
  { key: 'operacao', icon: CalendarClock, title: 'Operação & rotina', desc: 'Onde, quando e em que ritmo essa pessoa vai trabalhar.', fields: ['local', 'horario', 'carga', 'motivo', 'quantidade'] as (keyof Briefing)[] },
  { key: 'investimento', icon: Wallet, title: 'Investimento', desc: 'A faixa salarial e benefícios que tornam essa vaga competitiva.', fields: ['budget', 'modalidade', 'beneficios'] as (keyof Briefing)[] },
  { key: 'processo', icon: ListChecks, title: 'Processo seletivo', desc: 'As etapas da seleção, na ordem — o que quem se candidata vai enfrentar.', fields: ['processoSeletivo'] as (keyof Briefing)[] },
] as const

export const isFilledVal = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null
export type Status = 'completa' | 'preenchendo' | 'pendente' | 'opcional'
export function fieldsStatus<T extends object>(obj: T, fields: readonly (keyof T)[]): Status {
  const filled = fields.filter((k) => isFilledVal(obj[k])).length
  return filled === fields.length ? 'completa' : filled > 0 ? 'preenchendo' : 'pendente'
}

/* ───────── etapa 2 · Perfil e Requisitos ───────── */
export const STACK_POOL = ['Python 3.10+', 'FastAPI', 'Django', 'PostgreSQL', 'MySQL', 'Docker', 'Kubernetes', 'Git', 'APIs RESTful', 'GraphQL', 'Redis', 'Kafka', 'AWS', 'GCP', 'CI/CD', 'TypeScript', 'Node.js', 'Testes automatizados', 'Microsserviços', 'Observabilidade'] as const
export const CONHECIMENTOS_POOL = ['Kubernetes', 'Redis', 'Kafka', 'GraphQL', 'Cloud (AWS/Azure/GCP)', 'Observabilidade', 'Terraform', 'gRPC', 'Event Sourcing', 'Data Engineering'] as const
export const HABILIDADES_POOL = ['Comunicação clara', 'Trabalho em equipe', 'Pensamento analítico', 'Proatividade', 'Mentoria', 'Autonomia', 'Organização', 'Resolução de problemas', 'Adaptabilidade'] as const
export const EXIGENCIAS = ['Ensino superior obrigatório', 'Comprovação de experiência', 'Certificações profissionais'] as const

export type SetPerfil = <K extends keyof Perfil>(k: K, v: Perfil[K]) => void

export const PERFIL_INICIAL: Perfil = {
  formacao: 'Superior completo em Ciência da Computação, Engenharia de Software, Sistemas de Informação ou áreas correlatas.',
  experiencia: 'Mínimo 3 anos em desenvolvimento backend, com experiência comprovada em APIs RESTful, bancos de dados relacionais e ambientes em produção.',
  exigencias: ['Ensino superior obrigatório'],
  stackObrigatoria: ['Python 3.10+', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'APIs RESTful', 'Testes automatizados'],
  conhecimentosDesejaveis: ['Kubernetes', 'Redis', 'Kafka', 'GraphQL', 'Cloud (AWS/Azure/GCP)', 'Observabilidade'],
  responsabilidades: 'Desenvolver e manter APIs RESTful de alta performance utilizando Python e FastAPI. Projetar soluções técnicas que atendam aos requisitos de escalabilidade e segurança. Realizar code reviews, assegurando boas práticas e consistência de código. Atuar como mentor de desenvolvedores júnior, promovendo aprendizado e crescimento da equipe. Garantir a qualidade do código por meio de testes automatizados e integração contínua.',
  habilidades: ['Comunicação clara', 'Trabalho em equipe', 'Pensamento analítico', 'Proatividade', 'Mentoria'],
  justificativa: 'Expansão da equipe para suportar o crescimento do produto e reduzir o tempo de entrega das squads de backend.',
}

// `optional` = seção que NÃO entra no readiness (Diferenciais) — mostra "Opcional" no StatusPill.
export type PerfilSection = { key: string; icon: ComponentType<{ className?: string }>; title: string; desc: string; fields: (keyof Perfil)[]; optional?: boolean }
export const PERFIL_SECTIONS: PerfilSection[] = [
  { key: 'requisitos', icon: Code2, title: 'Requisitos técnicos', desc: 'O que essa pessoa precisa dominar logo de cara.', fields: ['formacao', 'experiencia', 'stackObrigatoria'] },
  { key: 'diferenciais', icon: Star, title: 'Diferenciais', desc: 'Conhecimentos que pesam positivamente, mas não são bloqueantes.', fields: ['conhecimentosDesejaveis'], optional: true },
  { key: 'responsabilidades', icon: AlignLeft, title: 'Responsabilidades & perfil', desc: 'O dia a dia da posição e o tipo de pessoa que você procura.', fields: ['responsabilidades', 'justificativa'] },
]

/* ───────── etapa 3 · descrição gerada por IA ───────── */
export const TONS: Tom[] = ['Equilibrado', 'Descontraído', 'Formal']

/* ───────── etapa 3 · "Melhorar com IA" (demo) ─────────
 * Aprimora os 3 blocos NARRATIVOS da descrição (resumo + desafio + objetivo) com uma redação mais
 * envolvente, derivada do briefing/perfil. É simulado (sem backend) — o mesmo espírito do Charlie. */
export function melhorarResumo(d: Briefing, p: Perfil): string {
  const foco = p.stackObrigatoria.slice(0, 3).join(', ')
  return `Procuramos uma pessoa ${d.cargo} ${d.nivel} para integrar o time do ${d.cliente}, em ${d.local} (modelo ${d.modelo}), reportando-se a ${d.gestor}. Você vai conduzir entregas técnicas de alto impacto${foco ? `, com foco em ${foco}` : ''}, num ambiente que valoriza autonomia, qualidade e crescimento contínuo.`
}
export function melhorarDesafio(d: Briefing): string {
  return `O ${d.cliente} está em plena expansão e busca reforço técnico para sustentar o próximo ciclo de crescimento. É a chance de construir junto: novas integrações, mais escala e decisões de arquitetura que vão moldar a evolução da plataforma.`
}
export function melhorarObjetivo(_d: Briefing, p: Perfil): string {
  return `Elevar a capacidade de entrega de soluções backend${p.stackObrigatoria[0] ? ` em ${p.stackObrigatoria[0]}` : ''}, garantindo escalabilidade, segurança e alta performance — com impacto direto na qualidade das integrações e na experiência de quem usa a plataforma.`
}


// Tudo obrigatório: o readiness checa TODOS os campos de cada seção.
export const requiredBriefingOk = (d: Briefing) => SECTIONS.flatMap((s) => s.fields).every((k) => isFilledVal(d[k]))
export const requiredPerfilOk = (p: Perfil) => PERFIL_SECTIONS.filter((s) => !s.optional).flatMap((s) => s.fields).every((k) => isFilledVal(p[k]))

// Campos obrigatórios → rótulo legível (lista "Faltando completar" da Visão da vaga no passo 3).
export const REQ_LABELS: Partial<Record<keyof Briefing | keyof Perfil, string>> = {
  cargo: 'Cargo', nivel: 'Nível', modelo: 'Modelo de atuação', cliente: 'Cliente/Projeto', gestor: 'Gestor imediato',
  desafio: 'Sobre o desafio', objetivo: 'Objetivo da vaga',
  local: 'Local de trabalho', horario: 'Horário', carga: 'Carga horária', motivo: 'Motivo de abertura', quantidade: 'Quantidade de vagas',
  budget: 'Budget', modalidade: 'Modalidade', beneficios: 'Benefícios', processoSeletivo: 'Processo seletivo',
  formacao: 'Formação', experiencia: 'Experiência obrigatória', stackObrigatoria: 'Stack técnica obrigatória', responsabilidades: 'Responsabilidades', justificativa: 'Justificativa da contratação',
}
export type MissingField = { scope: 'Briefing' | 'Perfil'; label: string; hint: string }
export function missingRequired(d: Briefing, p: Perfil) {
  const briefFields = SECTIONS.flatMap((s) => s.fields)
  const perfFields = PERFIL_SECTIONS.filter((s) => !s.optional).flatMap((s) => s.fields)
  const hint = (label: string, k: string) => (k === 'quantidade' ? 'Deve ser maior que zero.' : `Informe ${label.toLowerCase()}.`)
  const mk = (scope: 'Briefing' | 'Perfil') => (k: keyof Briefing | keyof Perfil): MissingField => {
    const label = REQ_LABELS[k] || String(k)
    return { scope, label, hint: hint(label, String(k)) }
  }
  return {
    brief: briefFields.filter((k) => !isFilledVal(d[k])).map(mk('Briefing')),
    perf: perfFields.filter((k) => !isFilledVal(p[k])).map(mk('Perfil')),
    briefTotal: briefFields.length, perfTotal: perfFields.length,
  }
}

/* ────────────────────────────── etapa 3 · Revisar & Publicar ────────────────────────────── */

export const CANDIDATE_LINK = 'https://talentos.tst.tis.apps.fabricacrp.com.br/candidate-application-frontend/?vaga=b64d36cb-c623-48f8-b614-ba67f4e6cf78'

// Versão TEXTO do post (p/ "Copiar texto do post" e publicação manual) — derivada do mesmo briefing/perfil.
export function buildPostText(d: Briefing, p: Perfil, desc: import('@/lib/vaga').GeneratedDesc): string {
  const L: string[] = []
  L.push(`VAGA: ${d.cargo} ${d.nivel}`.trim(), '')
  L.push(`MODELO DE ATUAÇÃO: ${[d.modelo, d.horario].filter(Boolean).join(' · ') || '—'}`)
  L.push(`LOCAL: ${d.local || '—'}`)
  L.push(`NÍVEL: ${d.nivel || '—'}`, '')
  L.push('🚀 SOBRE O DESAFIO')
  if (d.desafio?.trim()) L.push(d.desafio.trim())
  if (d.objetivo?.trim()) L.push(`OBJETIVO: ${d.objetivo.trim()}`)
  L.push('', '— O QUE VOCÊ VAI FAZER', ...desc.responsabilidades.map((r) => `• ${r}`))
  L.push('', '— O QUE BUSCAMOS')
  if (p.formacao.trim()) L.push(`✅ FORMAÇÃO: ${p.formacao.trim()}`)
  if (p.experiencia.trim()) L.push(`✅ EXPERIÊNCIA: ${p.experiencia.trim()}`)
  if (p.stackObrigatoria.length) L.push(`✅ STACK TÉCNICA: ${p.stackObrigatoria.join(', ')}`)
  if (p.conhecimentosDesejaveis.length) L.push('', '— DIFERENCIAIS', p.conhecimentosDesejaveis.join(', '))
  if (p.habilidades.length) L.push('', '— PERFIL COMPORTAMENTAL', `Buscamos alguém com ${p.habilidades.join(', ')}.`)
  L.push('', '— REMUNERAÇÃO E CONDIÇÕES')
  if (d.budget) L.push(`Orçamento: ${d.budget}`)
  if (d.carga) L.push(`Regime: ${d.carga}`)
  if (d.processoSeletivo.length) L.push('', '— PROCESSO SELETIVO', d.processoSeletivo.map((e, i) => `${i + 1}. ${e}`).join('; '))
  L.push('', 'Link:', CANDIDATE_LINK)
  return L.join('\n')
}

/* ────────────────────────────── tipos auxiliares de UI ────────────────────────────── */

export type SectionMeta = { key: string; icon: ComponentType<{ className?: string }>; title: string; desc: string }

export type Msg = { id: number; role: 'user' | 'assistant'; text: string; at: number }

// Tempo relativo CRU (módulo → fora do escopo de pureza de render): a UI traduz o rótulo via i18n.
// `unit` escolhe a chave (segundos/minutos) e `value` é o número a interpolar.
export function relativeAgo(at: number): { unit: 'segundos' | 'minutos'; value: number } {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000))
  return s < 60 ? { unit: 'segundos', value: s } : { unit: 'minutos', value: Math.round(s / 60) }
}

/* ───────── tradução só da EXIBIÇÃO das opções ─────────
 * O VALOR canônico pt-BR permanece no estado do form, no buildDesc e no post (a vaga GERADA é conteúdo
 * pt-BR). Só o rótulo que o recrutador VÊ no picker é traduzido (lookup `opcoes.<grupo>.<valor>`); o
 * `defaultValue` garante o fallback ao canônico se faltar chave. Grupos de palavras comuns — stack
 * técnica, horários e quantidades ficam como estão (nomes próprios/formato, não se traduzem). */
// 'tech' cobre os pools de stack/conhecimentos: traduz só os TERMOS GENÉRICOS (ex.: "Observabilidade");
// nomes próprios (Python, Kubernetes…) e itens digitados à mão caem no fallback canônico via defaultValue.
export type OptGroup = 'cargo' | 'nivel' | 'modelo' | 'carga' | 'motivo' | 'modalidade' | 'beneficio' | 'processo' | 'exigencia' | 'habilidade' | 'tech'
export const optLabeler = (t: TFunction<'gerador'>, group: OptGroup) => (value: string) =>
  t(`opcoes.${group}.${value}` as 'opcoes.nivel.Pleno', { defaultValue: value })
