/**
 * Charlie — sugestões por etapa. Cada sugestão tem um ícone, um rótulo e um `run` que (opcionalmente)
 * preenche campos de verdade e retorna a fala do copiloto. É demo (sem backend).
 */
import {
  AlignLeft,
  CheckCircle2,
  ClipboardList,
  Code2,
  DollarSign,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Briefing, Perfil } from '@/lib/vaga'
import { isFilledVal, SECTIONS, type SetBriefing, type SetPerfil } from './model'

export type SugCtx = { data: Briefing; set: SetBriefing; perfil: Perfil; setPerfil: SetPerfil }
export type Suggestion = { icon: ComponentType<{ className?: string }>; label: string; run: (c: SugCtx) => string }

export function suggestionsFor(step: number): Suggestion[] {
  switch (step) {
    case 1:
      return [
        { icon: DollarSign, label: 'Sugerir faixa salarial', run: ({ data, set }) => {
          const faixas: Record<string, string> = { 'Estágio': 'R$ 1.800 – R$ 2.500', 'Júnior': 'R$ 4.000 – R$ 6.500', 'Pleno': 'R$ 9.000 – R$ 13.000', 'Sênior': 'R$ 14.000 – R$ 19.000', 'Especialista': 'R$ 16.000 – R$ 22.000', 'Liderança': 'R$ 20.000 – R$ 28.000' }
          const faixa = faixas[data.nivel] ?? 'R$ 9.000 – R$ 13.000'
          set('budget', faixa)
          return `Para ${data.cargo} ${data.nivel} em ${data.local} (${data.modelo}), o mercado fica em torno de ${faixa}. Já preenchi o Budget — ajuste à vontade.`
        } },
        { icon: Wallet, label: 'Recomendar benefícios', run: ({ data, set }) => {
          const sugeridos = ['Plano de saúde', 'Vale-refeição', 'Auxílio home-office', 'Gympass', 'Bônus anual']
          const novos = sugeridos.filter((b) => !data.beneficios.includes(b))
          if (novos.length) set('beneficios', [...data.beneficios, ...novos])
          return novos.length
            ? `Adicionei benefícios que deixam a vaga mais competitiva: ${novos.join(', ')}. Remova o que não fizer sentido.`
            : 'Seu pacote de benefícios já está bem competitivo para essa vaga. 👍'
        } },
        { icon: ClipboardList, label: 'Revisar o briefing', run: ({ data }) => {
          const faltando = SECTIONS.flatMap((s) => s.fields).filter((k) => !isFilledVal(data[k])).length
          return faltando === 0
            ? `Briefing completo: ${data.cargo} ${data.nivel} · ${data.modelo} · ${data.local} · ${data.modalidade}. Pode avançar para o Perfil. 👍`
            : `Briefing quase pronto — ${faltando} campo(s) ainda em branco${data.budget ? '' : ', incluindo o Budget'}. Quer que eu sugira a faixa salarial?`
        } },
      ]
    case 2:
      return [
        { icon: Code2, label: 'Sugerir stack técnica', run: ({ data, perfil, setPerfil }) => {
          const novas = ['Python 3.10+', 'FastAPI', 'PostgreSQL', 'Docker', 'Testes automatizados'].filter((s) => !perfil.stackObrigatoria.includes(s))
          if (novas.length) setPerfil('stackObrigatoria', [...perfil.stackObrigatoria, ...novas])
          return novas.length ? `Adicionei à stack obrigatória: ${novas.join(', ')}. Para ${data.cargo} ${data.nivel}, essa base cobre bem o dia a dia.` : 'Sua stack obrigatória já cobre o essencial para esse cargo. 👍'
        } },
        { icon: Star, label: 'Diferenciais desejáveis', run: ({ perfil, setPerfil }) => {
          const novas = ['Kubernetes', 'Kafka', 'Observabilidade'].filter((s) => !perfil.conhecimentosDesejaveis.includes(s))
          if (novas.length) setPerfil('conhecimentosDesejaveis', [...perfil.conhecimentosDesejaveis, ...novas])
          return novas.length ? `Coloquei em diferenciais: ${novas.join(', ')}. Pesam a favor, mas sem barrar bons perfis.` : 'Seus diferenciais já estão bem cobertos.'
        } },
        { icon: Smile, label: 'Sugerir soft skills', run: ({ perfil, setPerfil }) => {
          const novas = ['Comunicação clara', 'Trabalho em equipe', 'Mentoria'].filter((s) => !perfil.habilidades.includes(s))
          if (novas.length) setPerfil('habilidades', [...perfil.habilidades, ...novas])
          return novas.length ? `Sugeri no comportamental: ${novas.join(', ')}. Equilibram o lado técnico com a colaboração.` : 'Seu perfil comportamental já está bem definido.'
        } },
      ]
    case 3:
      return [
        { icon: AlignLeft, label: 'Resumir em um parágrafo', run: ({ data }) => `Resumo: vaga de ${data.cargo} ${data.nivel}, modelo ${data.modelo}, em ${data.local}, com foco em entregar valor ao projeto ${data.cliente}.` },
        { icon: Smile, label: 'Ajustar o tom da vaga', run: () => 'Use os botões Equilibrado / Descontraído / Formal acima da descrição — eu reescrevo o texto no tom escolhido na hora.' },
      ]
    default:
      return [
        { icon: ShieldCheck, label: 'Checar viés e inclusão', run: () => 'Revisei: evite termos como "jovem" ou "nativo digital" (podem indicar viés etário). O texto está neutro em gênero. 👍' },
        { icon: CheckCircle2, label: 'Revisar clareza', run: () => 'A descrição está clara. Sugiro separar os requisitos em "obrigatórios" e "desejáveis" para facilitar a leitura.' },
        { icon: Sparkles, label: 'Sugerir título chamativo', run: ({ data }) => `Que tal o título: "${data.cargo} ${data.nivel} (${data.modelo}) — ${data.local}"?` },
      ]
  }
}
