/**
 * Charlie — motor de REVISÃO da vaga (demo, sem backend). Diferente das `charlie-suggestions` (que
 * preenchem campos), aqui o Charlie ANALISA o briefing + perfil já preenchidos e aponta inconsistências
 * que passam batido na correria — com foco em remuneração vs. senioridade vs. padrão de mercado.
 *
 * Tudo é função PURA (sem JSX, sem i18n): cada achado vira um `Finding` com chave de tradução + params;
 * a UI (ReviewStep) traduz e renderiza. O `severity` 'critica' BLOQUEIA a publicação (a vaga sai errada);
 * 'aviso' pede confirmação; 'ok' é um reforço positivo. cargo/nível seguem em pt-BR (conteúdo da vaga).
 */
import type { Briefing, Perfil } from '@/lib/vaga'

export type Severity = 'critica' | 'aviso' | 'ok' | 'info'

export interface Finding {
  id: string // chave estável (dedupe/lista)
  severity: Severity
  tituloKey: string // review.charlie.<tituloKey>
  detalheKey: string // review.charlie.<detalheKey>
  params?: Record<string, string | number>
  goto?: 1 | 2 | 3 // "Ajustar" leva a esta etapa do wizard
}

/* ───────────────────────────── referência de mercado (cargo × nível) ─────────────────────────────
 * Faixa-base por nível (CLT, bruto/mês, R$) × fator por cargo. Valores de mercado tech BR aproximados —
 * é a "régua" do Charlie no mockup; ajuste à vontade. A faixa resolvida arredonda para a centena. */
const NIVEL_BASE: Record<string, [number, number]> = {
  'Estágio': [1800, 2500],
  'Júnior': [4000, 6500],
  'Pleno': [8000, 13000],
  'Sênior': [14000, 20000],
  'Especialista': [18000, 26000],
  'Liderança': [22000, 32000],
}
const CARGO_FATOR: Record<string, number> = {
  'Desenvolvedor Backend': 1.0,
  'Desenvolvedor Frontend': 0.95,
  'Desenvolvedor Fullstack': 1.05,
  'Product Manager': 1.15,
  'Designer UX/UI': 0.85,
  'Analista de Dados': 0.95,
  'Engenheiro DevOps': 1.1,
  'Analista de QA': 0.85,
}

const cem = (n: number) => Math.round(n / 100) * 100
export function faixaMercado(cargo: string, nivel: string): { min: number; max: number } {
  const [bmin, bmax] = NIVEL_BASE[nivel] ?? NIVEL_BASE['Pleno']
  const f = CARGO_FATOR[cargo] ?? 1
  return { min: cem(bmin * f), max: cem(bmax * f) }
}

// R$ 8.000 (sem centavos, separador de milhar pt-BR — é um produto BR, mantém o formato em qualquer idioma).
export function fmtBRL(n: number): string {
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR')
}

/* ───────────────────────────── parser da faixa digitada ─────────────────────────────
 * O budget é texto livre ("R$ 9.000 a R$ 13.000", "9k–13k", "2 mil", "A combinar"). Extrai os números
 * plausíveis de salário e devolve {min,max}; null quando não há número legível (ex.: "Confidencial"). */
export function parseFaixa(budget: string): { min: number; max: number } | null {
  if (!budget) return null
  const nums: number[] = []
  const re = /(\d[\d.]*(?:,\d+)?)\s*(k|mil)?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(budget.toLowerCase()))) {
    let n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
    if (!isFinite(n)) continue
    const suf = m[2]?.toLowerCase()
    if (suf === 'k' || suf === 'mil') n *= 1000
    if (n >= 100) nums.push(n) // descarta ruído (13º, "x2", percentuais)
  }
  return nums.length ? { min: Math.min(...nums), max: Math.max(...nums) } : null
}

/* ───────────────────────────── experiência exigida × nível ─────────────────────────────
 * Lê "Mínimo 3 anos" do texto de experiência e confere coerência com o nível. */
const EXP_ESPERADO: Record<string, [number, number]> = {
  'Estágio': [0, 1],
  'Júnior': [0, 3],
  'Pleno': [2, 6],
  'Sênior': [4, 10],
  'Especialista': [6, 15],
  'Liderança': [6, 20],
}
function anosExperiencia(txt: string): number | null {
  const m = txt?.toLowerCase().match(/(\d+)\s*\+?\s*anos?/)
  return m ? parseInt(m[1], 10) : null
}

/* ───────────────────────────── revisão completa ─────────────────────────────
 * Roda todos os checks e devolve os achados ORDENADOS por severidade (crítica → aviso → info → ok). */
const ORDEM: Record<Severity, number> = { critica: 0, aviso: 1, info: 2, ok: 3 }

export function reviewVaga(data: Briefing, perfil: Perfil): Finding[] {
  const out: Finding[] = []
  const cargo = data.cargo
  const nivel = data.nivel
  const mkt = faixaMercado(cargo, nivel)
  const faixa = parseFaixa(data.budget)
  const baseParams = { cargo, nivel, mercado: `${fmtBRL(mkt.min)} a ${fmtBRL(mkt.max)}`, piso: fmtBRL(mkt.min), teto: fmtBRL(mkt.max) }

  // 1 · remuneração vs. mercado (o coração da revisão)
  if (data.budget && !faixa) {
    out.push({ id: 'salario-ilegivel', severity: 'aviso', tituloKey: 'salarioIlegivel.titulo', detalheKey: 'salarioIlegivel.detalhe', params: { ...baseParams }, goto: 1 })
  } else if (faixa) {
    const seuMax = fmtBRL(faixa.max)
    const seuMin = fmtBRL(faixa.min)
    const suaFaixa = faixa.min === faixa.max ? fmtBRL(faixa.min) : `${seuMin} a ${seuMax}`
    if (faixa.max < mkt.min) {
      out.push({ id: 'salario-abaixo', severity: 'critica', tituloKey: 'salarioAbaixo.titulo', detalheKey: 'salarioAbaixo.detalhe', params: { ...baseParams, sua: suaFaixa, seuMax }, goto: 1 })
    } else if (faixa.min > mkt.max * 1.2) {
      out.push({ id: 'salario-acima', severity: 'aviso', tituloKey: 'salarioAcima.titulo', detalheKey: 'salarioAcima.detalhe', params: { ...baseParams, sua: suaFaixa, seuMin }, goto: 1 })
    } else {
      out.push({ id: 'salario-ok', severity: 'ok', tituloKey: 'salarioOk.titulo', detalheKey: 'salarioOk.detalhe', params: { ...baseParams, sua: suaFaixa } })
    }
    // faixa larga demais (teto > 2,2× piso) — confunde o candidato sobre o real nível da vaga
    if (faixa.min > 0 && faixa.max > faixa.min * 2.2) {
      out.push({ id: 'faixa-ampla', severity: 'aviso', tituloKey: 'faixaAmpla.titulo', detalheKey: 'faixaAmpla.detalhe', params: { sua: suaFaixa }, goto: 1 })
    }
  }

  // 2 · experiência exigida coerente com o nível
  const anos = anosExperiencia(perfil.experiencia)
  const exp = EXP_ESPERADO[nivel]
  if (anos != null && exp) {
    if (anos > exp[1]) {
      out.push({ id: 'exp-alta', severity: 'aviso', tituloKey: 'expAlta.titulo', detalheKey: 'expAlta.detalhe', params: { anos, nivel, max: exp[1] }, goto: 2 })
    } else if (anos < exp[0]) {
      out.push({ id: 'exp-baixa', severity: 'aviso', tituloKey: 'expBaixa.titulo', detalheKey: 'expBaixa.detalhe', params: { anos, nivel, min: exp[0] }, goto: 2 })
    }
  }

  // 3 · pacote de benefícios magro para a competitividade
  if (data.beneficios.length > 0 && data.beneficios.length < 3) {
    out.push({ id: 'beneficios-poucos', severity: 'info', tituloKey: 'poucosBeneficios.titulo', detalheKey: 'poucosBeneficios.detalhe', params: { n: data.beneficios.length }, goto: 1 })
  }

  // 4 · jornada × modalidade de contratação (o erro que um humano deixa passar):
  //   · Estágio é limitado a 30h/semana por lei → acima disso é CRÍTICO (vaga sai irregular).
  //   · CLT em tempo integral é 40h/44h → menos que isso é tempo parcial, vale confirmar.
  const horas = parseInt((data.carga.match(/\d+/) ?? ['0'])[0], 10)
  if (horas > 0) {
    if (data.modalidade === 'Estágio' && horas > 30) {
      out.push({ id: 'estagio-carga', severity: 'critica', tituloKey: 'estagioCarga.titulo', detalheKey: 'estagioCarga.detalhe', params: { carga: data.carga }, goto: 1 })
    } else if (data.modalidade === 'CLT' && horas < 40) {
      out.push({ id: 'clt-carga', severity: 'aviso', tituloKey: 'cltCarga.titulo', detalheKey: 'cltCarga.detalhe', params: { carga: data.carga }, goto: 1 })
    }
  }

  // 5 · benefícios típicos de CLT (VR/VT) num contrato PJ não costumam se aplicar
  const benefCLT = data.beneficios.filter((b) => b === 'Vale-refeição' || b === 'Vale-transporte')
  if (data.modalidade === 'PJ' && benefCLT.length > 0) {
    out.push({ id: 'pj-beneficios', severity: 'info', tituloKey: 'pjBeneficios.titulo', detalheKey: 'pjBeneficios.detalhe', params: { itens: benefCLT.join(', ') }, goto: 1 })
  }

  return out.sort((a, b) => ORDEM[a.severity] - ORDEM[b.severity])
}

export const contarCriticas = (fs: Finding[]) => fs.filter((f) => f.severity === 'critica').length
