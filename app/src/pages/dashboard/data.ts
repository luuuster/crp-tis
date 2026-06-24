/**
 * Dados mock do Dashboard (demo, sem backend). Extraídos da página para serem compartilhados pelos
 * widgets do catálogo (dashboard/widgets) e pela exportação CSV. `mes`/`etapa`/`label`/status seguem
 * em pt-BR canônico (chave de gráfico/lookup); só a EXIBIÇÃO é traduzida via i18n na renderização.
 */
import { Briefcase, Clock, Percent, UserCheck, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import type { StatusVaga as Status } from '@/lib/types'
import type { BadgeTone } from '@/components/page'

// Nome de exibição (dado mockado — não traduzido); usado na saudação e no card de destaque.
export const NOME = 'Frank'

export type KpiKey = 'vagasAbertas' | 'candidatosFunil' | 'contratacoesMes' | 'tempoMedioFechamento' | 'taxaAceitacao'
export type Dir = 'up' | 'down'
// `unidade` (opcional): chave de UNIDADE traduzível anexada ao número — o número fica canônico e só a
// palavra ("dias") muda por idioma. Sem unidade, valor/delta são exibidos como estão.
export type Kpi = { key: KpiKey; valor: string; delta: string; dir: Dir; good: boolean; icon: ComponentType<{ className?: string }>; unidade?: 'dias' }
export const KPIS: Kpi[] = [
  { key: 'vagasAbertas', valor: '18', delta: '+5', dir: 'up', good: true, icon: Briefcase },
  { key: 'candidatosFunil', valor: '1.284', delta: '+12%', dir: 'up', good: true, icon: Users },
  { key: 'contratacoesMes', valor: '31', delta: '+6', dir: 'up', good: true, icon: UserCheck },
  { key: 'tempoMedioFechamento', valor: '27', delta: '−4', dir: 'down', good: true, icon: Clock, unidade: 'dias' },
]

// `mes` é o VALOR canônico (pt-BR) usado como chave do gráfico e do lookup de tradução do eixo.
export const CONTRATACOES = [
  { mes: 'Jan', total: 12 },
  { mes: 'Fev', total: 19 },
  { mes: 'Mar', total: 15 },
  { mes: 'Abr', total: 27 },
  { mes: 'Mai', total: 22 },
  { mes: 'Jun', total: 31 },
]

// Funil do processo seletivo — barras decrescentes (largura relativa ao topo) + conversão vs. etapa anterior.
export const FUNIL = [
  { etapa: 'Inscritos', valor: 1284 },
  { etapa: 'Triagem', valor: 642 },
  { etapa: 'Entrevista', valor: 268 },
  { etapa: 'Oferta', valor: 96 },
  { etapa: 'Contratados', valor: 31 },
]
export const FUNIL_MAX = FUNIL[0].valor

// Vagas por status — donut (conic-gradient com tokens). Cores DESSATURADAS: cada hue de status é
// misturado com a superfície do card (color-mix toward --card) → tom suave/clean nos dois temas,
// mantendo o significado. Mesma cor alimenta o donut e o ponto.
const soft = (token: string) => `color-mix(in oklab, ${token} 55%, var(--card))`
export const STATUS_DONUT = [
  { label: 'Aberta', value: 18, cor: soft('var(--success)') },
  { label: 'Em pausa', value: 5, cor: soft('var(--warning)') },
  { label: 'Rascunho', value: 6, cor: soft('var(--muted-foreground)') }, // rascunho = neutro (antes secondary/marca)
  { label: 'Fechada', value: 9, cor: soft('var(--destructive)') },
]
export const STATUS_TOTAL = STATUS_DONUT.reduce((s, x) => s + x.value, 0)
export const DONUT_STOPS = (() => {
  let acc = 0
  return STATUS_DONUT.map((s) => {
    const a = (acc / STATUS_TOTAL) * 100
    acc += s.value
    const b = (acc / STATUS_TOTAL) * 100
    return `${s.cor} ${a}% ${b}%`
  }).join(', ')
})()

export const STATUS_TONE: Record<Status, BadgeTone> = {
  'Aberta': 'success',
  'Rascunho': 'muted', // rascunho = não publicado → neutro (antes 'secondary'/marca)
  'Em pausa': 'warning',
  'Fechada': 'destructive',
}
export const VAGAS_RECENTES: { vaga: string; sr: string; inscritos: number; status: Status }[] = [
  { vaga: 'Desenvolvedor Backend', sr: 'Pleno', inscritos: 63, status: 'Aberta' },
  { vaga: 'Tech Lead Frontend', sr: 'Sênior', inscritos: 61, status: 'Aberta' },
  { vaga: 'Product Manager', sr: 'Sênior', inscritos: 56, status: 'Em pausa' },
  { vaga: 'UX Designer III', sr: 'Sênior', inscritos: 34, status: 'Rascunho' },
  { vaga: 'Engenheiro de Dados', sr: 'Pleno', inscritos: 47, status: 'Fechada' },
]

/* ───────── widgets EXTRAS do catálogo (não entram no layout padrão; o usuário adiciona se quiser) ───────── */

// Origem dos candidatos — donut. Soma = 1.284 (bate com o KPI "Candidatos no funil"). `key` → i18n origem.*
// Origem = CATEGORIA (não bom/ruim): paleta de DADOS (chart, fixa, não-marca) + neutro p/ "Outros".
// Antes misturava marca (primary/secondary) com semântico emprestado (success/warning).
export const ORIGEM = [
  { key: 'linkedin', value: 540, cor: soft('var(--chart-1)') },
  { key: 'indicacao', value: 270, cor: soft('var(--chart-2)') },
  { key: 'site', value: 230, cor: soft('var(--chart-6)') },
  { key: 'outros', value: 244, cor: soft('var(--muted-foreground)') },
]
export const ORIGEM_TOTAL = ORIGEM.reduce((s, x) => s + x.value, 0)
export const ORIGEM_STOPS = (() => {
  let acc = 0
  return ORIGEM.map((s) => {
    const a = (acc / ORIGEM_TOTAL) * 100
    acc += s.value
    const b = (acc / ORIGEM_TOTAL) * 100
    return `${s.cor} ${a}% ${b}%`
  }).join(', ')
})()

// Tempo médio por etapa (dias). `etapa` canônico (reusa etapa.* + etapa.Fechamento).
export const TEMPO_ETAPA = [
  { etapa: 'Triagem', dias: 3 },
  { etapa: 'Entrevista', dias: 8 },
  { etapa: 'Oferta', dias: 5 },
  { etapa: 'Fechamento', dias: 6 },
]

// Próximas entrevistas — agenda. candidato/vaga canônicos (mock); `diaKey` → i18n proximasEntrevistas.dia.*
export const PROXIMAS_ENTREVISTAS: { candidato: string; vaga: string; diaKey: string; hora: string }[] = [
  { candidato: 'Ana Souza', vaga: 'Desenvolvedor Backend', diaKey: 'hoje', hora: '14:00' },
  { candidato: 'Lucas Dias', vaga: 'Product Manager', diaKey: 'amanha', hora: '10:00' },
  { candidato: 'Marina Rocha', vaga: 'Designer UX/UI', diaKey: 'quinta', hora: '16:00' },
  { candidato: 'Pedro Lima', vaga: 'Analista de Dados', diaKey: 'sexta', hora: '09:30' },
]

// Taxa de aceitação de ofertas — KPI (reaproveita o card de KPI; rótulo em kpi.taxaAceitacao).
export const TAXA_ACEITACAO: Kpi = { key: 'taxaAceitacao', valor: '87%', delta: '+4%', dir: 'up', good: true, icon: Percent }
