/**
 * "Entrevista finalizada" (etapas de entrevista do funil — RH/gestor). O entrevistador registra como foi a
 * conversa (texto e/ou upload de arquivo) e a IA gera uma NOVA análise EM CIMA DISSO, frente à vaga; daí o
 * recrutador decide (aprovar/reprovar). Conteúdo do Sheet lateral — o pai envolve no <Sheet>.
 *
 * MOCK: sem IA/backend real. O upload só guarda o nome. A "análise" é um LEITOR das anotações (`lerNotas`):
 * quando o relato é estruturado, extrai a recomendação marcada, a nota da "Impressão geral" e os bullets de
 * "Pontos fortes"/"Pontos de atenção"; pra texto livre, cai num viés simples de sentimento. É exatamente o
 * ponto onde, no produto, entraria a IA lendo o texto/arquivo e cruzando com a vaga.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Paperclip, Sparkles, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { AvaliacaoIAConteudo, buildDetalhe, type Detalhe } from '../EntrevistasIA'
import type { Card } from './data'

type Estado = 'entrada' | 'analisando' | 'resultado'
type Rec = 'Sim' | 'Talvez' | 'Não'

const hojeStr = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Sentimento simples (fallback p/ texto livre): saldo de termos positivos − negativos (sem acento).
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const POS = ['bom', 'boa', 'otim', 'excelente', 'fort', 'solid', 'mandou bem', 'manda bem', 'recomend', 'gost', 'aprov', 'segur', 'positiv', 'acima', 'destaque', 'maduro', 'clareza', 'alinhad']
const NEG = ['ruim', 'fraco', 'fraca', 'dificuldade', 'problema', 'abaixo', 'preocup', 'insegur', 'confus', 'reprov', 'aquem', 'falta', 'limitad', 'negativ', 'alerta', 'lacuna']
const contar = (txt: string, termos: string[]) => termos.reduce((n, termo) => n + txt.split(termo).length - 1, 0)

// Lê as anotações e devolve os sinais que alimentam a análise. Robusto pra relato estruturado, degrada bem.
function lerNotas(notas: string, scoreBase: number) {
  const linhas = notas.split('\n')
  const saldo = contar(norm(notas), POS) - contar(norm(notas), NEG)

  // Recomendação: opção marcada com (X); senão, pelo sentimento.
  const rec: Rec =
    /\(x\)\s*n[ãa]o\s*avan/i.test(notas) ? 'Não'
      : /\(x\)\s*(avan[çc]ar com ressalv|em d[úu]vida)/i.test(notas) ? 'Talvez'
        : /\(x\)\s*avan[çc]ar/i.test(notas) ? 'Sim'
          : saldo >= 2 ? 'Sim' : saldo <= -2 ? 'Não' : 'Talvez'

  // Score: nota da "Impressão geral" (x,y de 5 → /100); senão, base ajustada pelo sentimento.
  const m = notas.match(/impress[ãa]o geral[^\d]*(\d[.,]\d)/i)
  const score = m
    ? Math.round(parseFloat(m[1].replace(',', '.')) * 20)
    : Math.max(35, Math.min(98, scoreBase + Math.max(-18, Math.min(18, saldo * 6))))

  // Bullets de uma seção (por título), limpando markdown.
  const bulletsSob = (titulo: RegExp): string[] => {
    const i = linhas.findIndex((l) => titulo.test(l))
    if (i < 0) return []
    const out: string[] = []
    for (let j = i + 1; j < linhas.length && out.length < 5; j++) {
      const l = linhas[j].trim()
      if (/^#{1,6}\s/.test(l)) break // próxima seção
      const b = l.match(/^[-*]\s+(.+)/)
      if (b) out.push(b[1].replace(/\*\*/g, '').replace(/^⚠️\s*/, '').trim())
    }
    return out
  }
  const fortes = bulletsSob(/pontos?\s+fortes/i)
  const atencao = bulletsSob(/aten[çc][ãa]o|a confirmar|melhoria/i)

  const lResumo = linhas.find((l) => /resumo:/i.test(l))
  const resumo = lResumo ? lResumo.replace(/.*resumo:\**\s*/i, '').replace(/\*\*/g, '').trim() : ''

  return { rec, score, fortes, atencao, resumo }
}

export function EntrevistaFinalizada({ card, onCancelar, onAprovar, onReprovar }: {
  card: Card; onCancelar: () => void; onAprovar: () => void; onReprovar: () => void
}) {
  const { t } = useTranslation('pipeline')
  const { t: tc } = useTranslation('common')
  const [estado, setEstado] = useState<Estado>('entrada')
  const [notas, setNotas] = useState('')
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Detalhe | null>(null)
  const podeAnalisar = notas.trim().length > 0 || !!arquivo

  const analisar = () => {
    if (!podeAnalisar) return
    setEstado('analisando')
    // Monta a análise A PARTIR das anotações; o narrativo (técnica/competências/perguntas) vem do builder.
    const lido = lerNotas(notas, card.score)
    const base = buildDetalhe({ nome: card.nome, vaga: card.vaga, data: hojeStr(), score: lido.score })
    const primeiro = card.nome.split(' ')[0]
    const d: Detalhe = {
      ...base,
      scoreGeral: lido.score,
      aderencia: Math.min(98, lido.score + 6),
      recomendacao: lido.rec,
      pontosFortes: lido.fortes.length ? lido.fortes : base.pontosFortes,
      areasMelhoria: lido.atencao.length ? lido.atencao : base.areasMelhoria,
      analiseCandidato: `Avaliação da entrevista de ${primeiro} para a vaga de ${card.vaga}, a partir das anotações registradas pelo entrevistador.${lido.resumo ? ` ${lido.resumo}` : ` ${base.analiseCandidato}`}`,
      feedbackDetalhado: lido.resumo ? `${lido.resumo}\n${base.feedbackDetalhado}` : base.feedbackDetalhado,
    }
    setTimeout(() => { setResultado(d); setEstado('resultado') }, 1400) // delay só p/ o efeito de "IA analisando"
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/50 p-5 pr-12">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden><Sparkles className="size-6" /></span>
        <div className="min-w-0">
          <p className="ty-overline text-muted-foreground">{t('finalizar.overline')}</p>
          <h2 className="truncate font-heading text-xl font-bold tracking-tight text-foreground">{card.nome}</h2>
          <p className="truncate ty-body-sm text-muted-foreground">{card.vaga}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {estado === 'entrada' && (
          <div className="space-y-5">
            <p className="ty-body-sm text-muted-foreground">{t('finalizar.intro')}</p>
            <label className="block space-y-1.5">
              <span className="ty-body-sm font-medium text-foreground">{t('finalizar.notasLabel')}</span>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={8} placeholder={t('finalizar.notasPlaceholder')} />
            </label>
            <div className="space-y-1.5">
              <span className="block ty-body-sm font-medium text-foreground">{t('finalizar.arquivoLabel')}</span>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/50 focus-within:focus-ring">
                <Upload className="size-5 text-muted-foreground" aria-hidden />
                <span className="ty-body-sm text-foreground">{arquivo ?? t('finalizar.arquivoPlaceholder')}</span>
                <input type="file" className="sr-only" aria-label={t('finalizar.arquivoLabel')} onChange={(e) => setArquivo(e.target.files?.[0]?.name ?? null)} />
              </label>
              {arquivo && <button type="button" onClick={() => setArquivo(null)} className="rounded-sm ty-caption text-muted-foreground transition-colors hover:text-destructive-text focus-visible:focus-ring">{t('finalizar.removerArquivo')}</button>}
            </div>
          </div>
        )}
        {estado === 'analisando' && (
          <div className="grid place-items-center gap-3 py-20 text-center" role="status" aria-label={t('finalizar.analisando')}>
            <Spinner className="size-6" />
            <p className="ty-body-sm text-muted-foreground">{t('finalizar.analisando')}</p>
          </div>
        )}
        {estado === 'resultado' && resultado && (
          <div className="space-y-4">
            <div className="rounded-xl bg-primary/5 p-4 ring-1 ring-primary/15">
              <p className="flex items-center gap-2 ty-body-sm font-semibold text-primary-text"><Sparkles className="size-4 shrink-0" aria-hidden /> {t('finalizar.resultadoTitulo')}</p>
              <p className="mt-1 ty-caption text-muted-foreground">{t('finalizar.resultadoDesc', { nome: card.nome, vaga: card.vaga })}</p>
            </div>
            {/* O que a IA considerou (colapsado p/ não dominar a tela). */}
            <details className="rounded-xl bg-muted/30">
              <summary className="cursor-pointer rounded-xl p-3 ty-caption font-semibold tracking-wide text-foreground uppercase focus-visible:focus-ring">{t('finalizar.entradaTitulo')}</summary>
              <div className="border-t border-border/50 p-4 pt-3">
                {notas.trim() && <p className="max-h-60 overflow-y-auto whitespace-pre-wrap ty-body-sm leading-relaxed text-muted-foreground">{notas.trim()}</p>}
                {arquivo && <p className="mt-3 flex items-center gap-1.5 ty-caption text-muted-foreground"><Paperclip className="size-3.5 shrink-0" aria-hidden /> {arquivo}</p>}
              </div>
            </details>
            <AvaliacaoIAConteudo d={resultado} vaga={card.vaga} />
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border/50 p-4">
        {estado === 'entrada' && (
          <>
            <Button variant="ghost" onClick={onCancelar}>{tc('acao.cancelar')}</Button>
            <Button disabled={!podeAnalisar} onClick={analisar}><Sparkles aria-hidden /> {t('finalizar.analisar')}</Button>
          </>
        )}
        {estado === 'resultado' && (
          <>
            <Button variant="destructive-outline" onClick={onReprovar}><X aria-hidden /> {t('decisao.reprovar')}</Button>
            <Button onClick={onAprovar}><Check aria-hidden /> {t('decisao.aprovar')}</Button>
          </>
        )}
      </footer>
    </div>
  )
}
