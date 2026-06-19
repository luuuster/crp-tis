/**
 * Fábricas PURAS do histórico de processos (sem JSX). Determinísticas via hashNum — estáveis entre
 * renders. Extraídas de Candidatos.tsx. As puras pequenas (pick/pickN/areaInfo) vêm de ../candidatos.logic.
 */
import { hashNum } from '@/lib/hash'
import { buildDetalhe } from '../EntrevistasIA'
import { areaInfo, pick, pickN, type Candidato } from '../candidatos.logic'
import {
  AVALIADORES, CRITERIOS_POR_FASE, DATAS_ANTIGAS, DESTAQUE_POR_FASE, ETAPA_FASE, ETAPA_PROC,
  EXP_EXIGIDA, FASES_PADRAO, MOTIVO_REPROVA, MOTIVOS_POR_FASE, NIVEIS, POSITIVOS_POOL,
  RECOMENDACOES, RESUMO_FASE, STATUS_ANDAMENTO,
  type CampoDetalhe, type Criterio, type Desafio, type DetalheFase, type Fase, type PerfilVaga,
  type ProcCtx, type Processo, type QA, type Reprovacao, type Requisito, type ResultadoFase, type StatusProc,
} from './types'

export function conversaRH(resultado: ResultadoFase, seed: number): QA[] {
  const reprovou = resultado === 'reprovado'
  return [
    { pergunta: 'Por que você se candidatou a esta vaga?', resposta: 'Busca um novo desafio em um produto com mais escala e a chance de crescer técnica e profissionalmente.' },
    { pergunta: 'Qual é a sua pretensão salarial?', resposta: reprovou ? 'Informou um valor acima da faixa orçada para a posição.' : 'Apresentou um valor dentro da faixa prevista para a posição.' },
    { pergunta: 'Qual é a sua disponibilidade de início?', resposta: reprovou ? 'Disponibilidade incompatível com a necessidade do time (aviso prévio longo).' : 'Disponível para iniciar em até 30 dias.' },
    { pergunta: 'Como você descreveria seu jeito de trabalhar em equipe?', resposta: 'Colaborativo, com boa comunicação e abertura a feedback. Citou exemplos de trabalho próximo a produto e design.' },
    { pergunta: pick(['O que você sabe sobre a empresa?', 'O que te motiva no dia a dia?'], seed), resposta: 'Demonstrou ter pesquisado sobre o produto e conexão com os valores da empresa.' },
  ]
}

export function conversaGestor(ctx: ProcCtx, resultado: ResultadoFase): QA[] {
  const reprovou = resultado === 'reprovado'
  return [
    { pergunta: `Como você estruturaria a solução para um problema típico de ${ctx.vaga}?`, resposta: reprovou ? 'Apresentou uma abordagem superficial, sem aprofundar os trade-offs.' : 'Estruturou bem a solução, considerando trade-offs, escalabilidade e manutenção.' },
    { pergunta: 'Conte sobre uma decisão técnica difícil que você tomou.', resposta: reprovou ? 'Teve dificuldade em justificar as decisões com dados e contexto.' : 'Explicou com clareza o contexto, as alternativas avaliadas e o resultado.' },
    { pergunta: 'Como você lida com prazos e prioridades concorrentes?', resposta: 'Organiza o trabalho por impacto e alinha expectativas com o time e os stakeholders.' },
  ]
}

export function desafioTecnico(ctx: ProcCtx, resultado: ResultadoFase): Desafio {
  return {
    descricao: `Implementar uma aplicação enxuta de ${ctx.vaga}, cobrindo um fluxo real de ponta a ponta, com código versionado e testes.`,
    entrega: 'Entregue via repositório Git, com README e instruções de execução.',
    observacao: resultado === 'reprovado'
      ? 'A solução resolveu o caso básico, mas deixou lacunas em casos de borda, organização do código e testes.'
      : 'Solução completa, bem organizada, com boas práticas e cobertura de testes acima da média.',
  }
}

export function ofertaProposta(aprovado: boolean, seed: number): CampoDetalhe[] {
  const faixas = ['R$ 4.500 a R$ 6.000', 'R$ 7.000 a R$ 9.500', 'R$ 10.000 a R$ 14.000']
  return [
    { label: 'Faixa salarial', valor: pick(faixas, seed) },
    { label: 'Benefícios', valor: 'VR/VA · plano de saúde · auxílio home office' },
    { label: 'Modelo de trabalho', valor: 'Híbrido (2x/semana)' },
    { label: 'Status da proposta', valor: aprovado ? 'Proposta aceita' : 'Proposta não fechada' },
  ]
}

// O que a vaga pedia × o que o candidato alcançou (aderência por requisito, conforme o desfecho).
export function buildPerfilVaga(ctx: ProcCtx, status: StatusProc, faseAtual: number, totalFases: number, h: number): PerfilVaga {
  const { skills, cargoBase } = areaInfo(ctx.vaga)
  // Quanto mais longe chegou (e melhor o desfecho), mais requisitos atendidos.
  const taxa = status === 'Contratado' ? 0.92 : status === 'Em andamento' ? 0.55 + 0.08 * faseAtual : 0.3 + 0.1 * faseAtual
  const requisitos: Requisito[] = skills.map((nome, i) => {
    const obrigatorio = i < Math.ceil(skills.length / 2)
    const r = ((h + i * 13) % 100) / 100
    // Contratado: garante os obrigatórios atendidos (coerência com o desfecho).
    const atendido = status === 'Contratado' ? (obrigatorio || r < 0.8) : r < taxa
    return { nome, obrigatorio, atendido }
  })
  const atendidos = requisitos.filter((r) => r.atendido).length
  const obrig = requisitos.filter((r) => r.obrigatorio)
  const obrigAtend = obrig.filter((r) => r.atendido).length
  const aderencia = Math.round((atendidos / requisitos.length) * 100)
  return {
    resumo: `A vaga buscava um(a) ${cargoBase} ${ctx.senioridade.toLowerCase()} para atuar nas entregas do time de produto, com domínio das principais tecnologias da área.`,
    experiencia: EXP_EXIGIDA[ctx.senioridade] ?? '2 a 4 anos',
    requisitos,
    aderencia,
    conquista: `O candidato atendeu ${atendidos} de ${requisitos.length} requisitos (${obrigAtend} de ${obrig.length} obrigatórios) e chegou à fase ${faseAtual} de ${totalFases}.`,
  }
}

export function criteriosDaFase(n: number, aprovado: boolean, seed: number): Criterio[] {
  return (CRITERIOS_POR_FASE[n] ?? []).map((nome, i) => ({
    nome,
    // Aprovado: notas altas (70–95). Reprovado: notas mais baixas (38–61), com variação por critério.
    nota: aprovado ? 70 + ((seed + i * 7) % 26) : 38 + ((seed + i * 9) % 24),
  }))
}
// Ficha de cada etapa (campos "label · valor") — números/atores sintéticos, estáveis pelo seed.
export function camposDaFase(n: number, aprovado: boolean, seed: number): CampoDetalhe[] {
  switch (n) {
    case 1: {
      const ader = aprovado ? 80 + (seed % 16) : 42 + (seed % 12)
      return [
        { label: 'Aderência ao perfil', valor: `${ader}%` },
        { label: 'Requisitos atendidos', valor: `${Math.max(2, Math.round((ader / 100) * 9))} de 9` },
        { label: 'Análise', valor: 'TIS Screening AI' },
        { label: 'Tempo de leitura', valor: `${4 + (seed % 6)} s` },
      ]
    }
    case 2:
      return [
        { label: 'Entrevistador(a)', valor: pick(['Marina Albuquerque · RH', 'Beatriz Nunes · Recrutadora'], seed) },
        { label: 'Duração', valor: `${26 + (seed % 12)} min` },
        { label: 'Formato', valor: 'Vídeo (online)' },
        { label: 'Fit cultural', valor: aprovado ? 'Alto' : 'Médio' },
      ]
    case 3: {
      const nota = aprovado ? 78 + (seed % 18) : 38 + (seed % 16)
      return [
        { label: 'Nota do teste', valor: `${nota}/100` },
        { label: 'Formato', valor: 'Desafio assíncrono' },
        { label: 'Tempo gasto', valor: `${2 + (seed % 4)} h ${10 + (seed % 49)} min` },
        { label: 'Stack avaliada', valor: 'React · TypeScript · API' },
      ]
    }
    case 4:
      return [
        { label: 'Gestor(a)', valor: pick(['Carlos Mendes · Gestor', 'Rafael Tavares · Tech Lead'], seed) },
        { label: 'Duração', valor: `${38 + (seed % 18)} min` },
        { label: 'Profundidade técnica', valor: aprovado ? 'Alta' : 'Média' },
        { label: 'Formato', valor: 'Presencial' },
      ]
    default:
      return [
        { label: 'Modelo de trabalho', valor: 'Híbrido' },
        { label: 'Status da proposta', valor: aprovado ? 'Aceita' : 'Não fechada' },
        { label: 'Resposta em', valor: `${2 + (seed % 4)} dias` },
      ]
  }
}
export function buildDetalheFase(n: number, resultado: ResultadoFase, seed: number, ctx: ProcCtx): DetalheFase {
  if (resultado === 'pendente') {
    return { resumo: 'Etapa ainda não iniciada, será realizada quando o candidato avançar até aqui.', campos: [], criterios: [], destaques: [], atencao: [] }
  }
  const r = RESUMO_FASE[n] ?? RESUMO_FASE[3]
  const resumo = resultado === 'reprovado' ? r.ko : resultado === 'em andamento' ? r.and : r.ok
  if (resultado === 'em andamento') {
    return { resumo, campos: camposDaFase(n, false, seed).slice(0, 2), criterios: [], destaques: [], atencao: [] }
  }
  const aprovado = resultado === 'aprovado'
  // Etapa 1 — Triagem de currículo por IA: avaliação COMPLETA da IA (a mesma da tela Entrevistas IA).
  if (n === 1) {
    const score = Math.min(96, resultado === 'reprovado' ? 42 + (seed % 16) : 68 + (seed % 28))
    const dia = String(1 + (seed % 27)).padStart(2, '0')
    const triagemIA = buildDetalhe({ nome: ctx.nome, vaga: ctx.vaga, data: `${dia}/06/2026`, score })
    return { resumo, campos: [], criterios: [], destaques: [], atencao: [], triagemIA }
  }
  // Bloco rico específico do tipo da etapa: conversa (RH/gestor), desafio (técnico), oferta (proposta).
  const rico =
    n === 2 ? { conversa: conversaRH(resultado, seed) }
      : n === 3 ? { desafio: desafioTecnico(ctx, resultado) }
        : n === 4 ? { conversa: conversaGestor(ctx, resultado) }
          : { oferta: ofertaProposta(aprovado, seed) }
  return {
    resumo,
    campos: n === 5 ? [] : camposDaFase(n, aprovado, seed), // proposta usa o bloco "oferta" no lugar da ficha
    criterios: criteriosDaFase(n, aprovado, seed),
    destaques: pickN(DESTAQUE_POR_FASE[n] ?? [], seed, aprovado ? 3 : 1),
    atencao: aprovado ? [] : pickN(MOTIVOS_POR_FASE[n] ?? MOTIVOS_POR_FASE[3], seed, 2),
    ...rico,
  }
}

export function mkProcesso(id: string, titulo: string, status: StatusProc, faseAtual: number, data: string, h: number, ctx: ProcCtx): Processo {
  const fases: Fase[] = FASES_PADRAO.map((nome, idx) => {
    const n = idx + 1
    const resultado: ResultadoFase =
      n < faseAtual ? 'aprovado'
        : n > faseAtual ? 'pendente'
          : status === 'Reprovado' ? 'reprovado'
            : status === 'Em andamento' ? 'em andamento'
              : 'aprovado'
    const observacao =
      resultado === 'reprovado' ? MOTIVO_REPROVA[(h + n) % MOTIVO_REPROVA.length]
        : resultado === 'em andamento' ? STATUS_ANDAMENTO[(h + n) % STATUS_ANDAMENTO.length]
          : undefined
    return { nome, resultado, observacao, detalhe: buildDetalheFase(n, resultado, h + n, ctx) }
  })
  let reprovacao: Reprovacao | undefined
  if (status === 'Reprovado') {
    const pool = MOTIVOS_POR_FASE[faseAtual] ?? MOTIVOS_POR_FASE[3]
    reprovacao = {
      resumo: `O candidato avançou até a etapa "${FASES_PADRAO[faseAtual - 1]}", onde não atingiu os critérios necessários para seguir no processo.`,
      motivos: [pool[h % pool.length], pool[(h + 1) % pool.length]],
      positivos: [POSITIVOS_POOL[h % POSITIVOS_POOL.length]],
      recomendacao: RECOMENDACOES[h % RECOMENDACOES.length],
      avaliador: AVALIADORES[h % AVALIADORES.length],
    }
  }
  const perfilVaga = buildPerfilVaga(ctx, status, faseAtual, FASES_PADRAO.length, h)
  return { id, titulo, status, faseAtual, totalFases: FASES_PADRAO.length, data, fases, perfilVaga, reprovacao }
}

// Gera o histórico de processos de um candidato: 1 atual (reflete a etapa) + 1–2 anteriores (mesma vaga
// em outra senioridade, com desfecho variado). Determinístico pelo nome → estável entre renders.
export function buildProcessos(c: Candidato): Processo[] {
  const h = hashNum(c.nome)
  const procs: Processo[] = [mkProcesso(`${c.id}-1`, `${c.vaga} · ${c.senioridade}`, ETAPA_PROC[c.etapa], ETAPA_FASE[c.etapa](h), c.atualizado, h, { vaga: c.vaga, senioridade: c.senioridade, nome: c.nome })]
  const nPast = 1 + (h % 2)
  for (let k = 0; k < nPast; k++) {
    const hk = hashNum(`${c.nome}-${k}`)
    const nivel = NIVEIS[(hk + 1) % NIVEIS.length]
    // Processo em Júnior é sempre reprovado (numa fase intermediária, 2–4). Os demais níveis variam.
    const juniorReprovado = nivel === 'Júnior'
    const fase = juniorReprovado ? 2 + (hk % 3) : 2 + (hk % 4)
    const status: StatusProc = juniorReprovado ? 'Reprovado' : fase >= 5 ? 'Contratado' : 'Reprovado'
    procs.push(mkProcesso(`${c.id}-p${k}`, `${c.vaga} · ${nivel}`, status, fase, DATAS_ANTIGAS[hk % DATAS_ANTIGAS.length], hk, { vaga: c.vaga, senioridade: nivel, nome: c.nome }))
  }
  return procs
}
