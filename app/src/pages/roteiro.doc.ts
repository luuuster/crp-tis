/**
 * Montagem do DOCUMENTO Word (.docx) do roteiro — separado de `roteiro.ts` para ser carregado SOB DEMANDA
 * (dynamic import), mantendo a lib pesada `docx` fora do bundle das telas. Ver `roteiro.ts` para o contexto.
 */
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, HeightRule, Packer, Paragraph, Table, TableCell,
  TableRow, TextRun, WidthType,
} from 'docx'

import { buildDetalhe } from './EntrevistasIA'
import { areaInfo } from './candidatos.logic'
import { NIVEIS } from './candidatos/types'
import { hashNum } from '@/lib/hash'
import type { RoteiroDados } from './roteiro'

// Paleta (hex sem '#', formato do docx) — documento externo, fora do DS.
const CO = { verde: '16A34A', texto: '1F2937', mut: '6B7280', linha: 'E5E7EB', ok: '166534', av: '92400E', clara: 'F3F4F6', box: 'FAFAFA' }

// ---- helpers de baixo nível (TextRun/Paragraph/Table) ----
const run = (text: string, o: { bold?: boolean; size?: number; color?: string } = {}) =>
  new TextRun({ text, bold: o.bold, size: o.size ?? 22, color: o.color ?? CO.texto })
const bd = { style: BorderStyle.SINGLE, size: 4, color: CO.linha }
const cellBorders = { top: bd, bottom: bd, left: bd, right: bd }

const H2 = (texto: string) => new Paragraph({
  spacing: { before: 360, after: 140 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: CO.linha, space: 4 } },
  children: [run(texto, { bold: true, size: 26 })],
})
const nota = (texto: string) => new Paragraph({ spacing: { after: 100 }, children: [run(texto, { size: 19, color: CO.mut })] })

// Caixa AMPLA e vazia para escrever (single-cell table com altura fixa, não quebra entre páginas).
const boxAnotacao = (twips: number) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({
    height: { value: twips, rule: HeightRule.ATLEAST },
    cantSplit: true,
    children: [new TableCell({ shading: { fill: CO.box }, borders: cellBorders, children: [new Paragraph('')] })],
  })],
})

// Célula de tabela de dados (agenda/requisitos).
const td = (texto: string, o: { bold?: boolean; fill?: string; color?: string; width?: number } = {}) => new TableCell({
  width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
  shading: o.fill ? { fill: o.fill } : undefined,
  borders: cellBorders,
  margins: { top: 60, bottom: 60, left: 120, right: 120 },
  children: [new Paragraph({ children: [run(texto, { bold: o.bold, size: 20, color: o.color })] })],
})

// Bloco de UMA pergunta: título + enunciado + rubrica + ANOTAÇÕES (caixa ampla) + nota. keepNext mantém
// o cabeçalho junto do corpo; a caixa não quebra (cantSplit).
const blocoPergunta = (n: number, p: { titulo: string; texto: string; forte: string; atencao: string }): (Paragraph | Table)[] => [
  new Paragraph({ spacing: { before: 260, after: 90 }, keepNext: true, children: [run(`${n}. ${p.titulo}`, { bold: true, size: 24 })] }),
  new Paragraph({ spacing: { after: 130 }, keepNext: true, children: [run(p.texto)] }),
  new Paragraph({ spacing: { after: 60 }, keepNext: true, children: [run('Resposta forte: ', { bold: true, size: 21, color: CO.ok }), run(p.forte, { size: 21, color: CO.ok })] }),
  new Paragraph({ spacing: { after: 140 }, keepNext: true, children: [run('Sinais de atenção: ', { bold: true, size: 21, color: CO.av }), run(p.atencao, { size: 21, color: CO.av })] }),
  new Paragraph({ spacing: { after: 60 }, keepNext: true, children: [run('ANOTAÇÕES', { bold: true, size: 16, color: CO.mut })] }),
  boxAnotacao(2600),
  new Paragraph({ spacing: { before: 120, after: 220 }, children: [run('Nota (1–5):     1        2        3        4        5', { size: 21, color: CO.mut })] }),
]

export function gerarRoteiroDoc(d: RoteiroDados): Document {
  const score = d.score ?? 60 + (hashNum(d.cand) % 39)
  const det = buildDetalhe({ nome: d.cand, vaga: d.vaga, data: d.data, score })
  const { skills, cargoBase } = areaInfo(d.vaga)
  const nivel = NIVEIS[hashNum(d.vaga) % NIVEIS.length]
  const primeiro = d.cand.split(' ')[0]
  const recLabel = ({ Sim: 'Avançar', Talvez: 'Avançar com ressalvas', 'Não': 'Não avançar' } as Record<string, string>)[det.recomendacao] ?? det.recomendacao

  // Requisitos = skills da vaga; primeiros ~metade OBRIGATÓRIOS. "A confirmar" (determinístico por candidato)
  // = o que a triagem/currículo ainda não comprovou → foco da entrevista.
  const requisitos = skills.map((nome, i) => ({ nome, obrigatorio: i < Math.ceil(skills.length / 2), comprovado: hashNum(d.cand + nome) % 3 !== 0 }))
  const aConfirmar = requisitos.filter((r) => !r.comprovado)
  const focoSkills = (aConfirmar.length ? aConfirmar : requisitos).slice(0, 4).map((r) => r.nome)
  const perguntasReq = focoSkills.map((s) => ({
    titulo: `Competência: ${s}${requisitos.find((r) => r.nome === s)?.obrigatorio ? ' (obrigatório)' : ''}`,
    texto: `Peça um exemplo concreto e recente em que ${primeiro} usou ${s} — o contexto, a decisão técnica e o resultado. Explore a profundidade (não só o uso superficial).`,
    forte: `Explica trade-offs e o porquê das escolhas, cita resultados/métricas e conhece limitações de ${s}.`,
    atencao: 'Resposta genérica, sem exemplo próprio, ou apenas teoria sem aplicação prática.',
  }))
  const rubricaGen = { forte: 'Estrutura a resposta (situação, ação, resultado), assume responsabilidade e reflete sobre aprendizados.', atencao: 'Respostas vagas, foco só no “nós” sem o papel próprio, ou culpa terceiros.' }
  const perguntasIA = [...perguntasReq, ...det.perguntas.map((p) => ({ ...p, ...rubricaGen }))]

  const padraoSenioridade = /Especialista|Sênior|Lideran/i.test(nivel)
    ? { titulo: 'Liderança e influência técnica', texto: 'Conte como você elevou o nível técnico de um time (mentoria, padrões, decisões de arquitetura). Qual foi o impacto?', forte: 'Exemplos de mentoria/decisões que destravaram o time, com resultado mensurável.', atencao: 'Fala só de entregas individuais, sem impacto no time.' }
    : { titulo: 'Aprendizado e evolução', texto: 'Fale de algo novo que você precisou aprender rápido para entregar. Como se organizou e mediu o progresso?', forte: 'Método claro de aprendizado, busca por feedback e evolução visível.', atencao: 'Depende sempre de alguém dizer o que fazer; pouca autonomia.' }
  const perguntasPadrao = [
    { titulo: 'Trajetória e motivação', texto: 'Conte sua trajetória e o que te motivou a se candidatar a esta vaga.', forte: 'Narrativa coerente e motivação alinhada ao cargo e ao momento da empresa.', atencao: 'Motivação apenas financeira/genérica; pouco conhecimento da vaga.' },
    { titulo: 'Trabalho em equipe e conflito', texto: 'Descreva uma divergência com um colega e como vocês resolveram.', forte: 'Escuta ativa, foco no problema (não na pessoa) e desfecho construtivo.', atencao: 'Evita conflito a qualquer custo ou impõe a própria visão.' },
    padraoSenioridade,
    { titulo: 'Fechamento', texto: 'Por que você é a pessoa certa para esta vaga? Tem perguntas para nós?', forte: 'Conecta seus pontos fortes aos requisitos; faz perguntas relevantes.', atencao: 'Não faz perguntas; não relaciona seu perfil à vaga.' },
  ]

  const intvs = d.entrevistadores.length ? d.entrevistadores.join(', ') : '—'
  const agenda: [string, string, string][] = [
    ['Abertura e rapport', '5 min', 'Apresentar a vaga e o time; deixar o candidato à vontade.'],
    ['Aprofundamento técnico', '20 min', 'Validar os requisitos a confirmar (abaixo) com exemplos reais.'],
    ['Competências comportamentais', '15 min', 'Colaboração, comunicação, autonomia e resolução de conflitos.'],
    ['Perguntas do candidato', '10 min', 'Espaço para dúvidas — sinal de interesse e fit.'],
    ['Fechamento', '5 min', 'Próximos passos e prazo de retorno.'],
  ]

  const body: (Paragraph | Table)[] = [
    new Paragraph({ spacing: { after: 40 }, children: [run('ROTEIRO DE ENTREVISTA · CONFIDENCIAL', { bold: true, size: 18, color: CO.verde })] }),
    new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 40 }, children: [run(d.cand, { bold: true, size: 40 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [run(`${d.vaga} · ${nivel} · ${cargoBase}`, { size: 22, color: CO.mut })] }),

    new Paragraph({ spacing: { after: 60 }, children: [run('Data: ', { bold: true }), run(`${d.data} às ${d.hora}`), run('        Formato: ', { bold: true }), run(d.tipo)] }),
    new Paragraph({ spacing: { after: 60 }, children: [run('Entrevistador(es): ', { bold: true }), run(intvs)] }),
    new Paragraph({ spacing: { after: 60 }, children: [run('Compatibilidade com a vaga: ', { bold: true }), run(`${score}%`, { bold: true, size: 28, color: CO.verde }), run('     Aderência do currículo: ', { bold: true }), run(`${det.aderencia}%`)] }),
    new Paragraph({ spacing: { after: 60 }, children: [run('Recomendação preliminar da IA: ', { bold: true }), run(recLabel, { bold: true })] }),

    H2('Resumo do candidato (análise da IA)'),
    new Paragraph({ spacing: { after: 120 }, children: [run(det.analiseCandidato)] }),

    H2('Agenda sugerida (~55 min)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [3200, 1400, 4800],
      rows: [
        new TableRow({ tableHeader: true, children: [td('Bloco', { bold: true, fill: CO.clara }), td('Tempo', { bold: true, fill: CO.clara }), td('Objetivo', { bold: true, fill: CO.clara })] }),
        ...agenda.map(([b, t, o]) => new TableRow({ children: [td(b, { bold: true }), td(t), td(o, { color: CO.mut })] })),
      ],
    }),

    H2('Foco desta entrevista — requisitos a validar'),
    nota('Priorize investigar os requisitos “a confirmar”: são os que ainda não ficaram claros no currículo/triagem e mais pesam para achar quem adere à vaga.'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [4200, 1800, 3400],
      rows: [
        new TableRow({ tableHeader: true, children: [td('Requisito', { bold: true, fill: CO.clara }), td('Peso', { bold: true, fill: CO.clara }), td('Situação', { bold: true, fill: CO.clara })] }),
        ...requisitos.map((r) => new TableRow({ children: [
          td(r.nome, { bold: true }),
          td(r.obrigatorio ? 'Obrigatório' : 'Desejável', { color: CO.mut }),
          td(r.comprovado ? 'Indicado no currículo' : 'A confirmar na entrevista', { bold: true, color: r.comprovado ? CO.ok : CO.av }),
        ] })),
      ],
    }),

    H2('Perguntas sugeridas pela IA'),
    nota('Personalizadas a partir do currículo e dos requisitos da vaga. Cada pergunta traz o que caracteriza uma resposta forte e os sinais de atenção.'),
    ...perguntasIA.flatMap((p, i) => blocoPergunta(i + 1, p)),

    H2('Perguntas padrão'),
    ...perguntasPadrao.flatMap((p, i) => blocoPergunta(perguntasIA.length + i + 1, p)),

    H2('Boas práticas e imparcialidade'),
    ...[
      'Faça as mesmas perguntas-base a todos os candidatos da vaga — compara com justiça.',
      'Baseie a nota em evidências (exemplos concretos), não em impressão geral.',
      'Evite perguntas sobre idade, estado civil, filhos, religião, origem ou saúde — foque em competências.',
      'Registre as respostas ainda na entrevista; a memória distorce depois.',
    ].map((t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(t, { size: 21 })] })),

    H2('Avaliação final'),
    new Paragraph({ spacing: { before: 80, after: 120 }, children: [run('Recomendação:     ☐ Avançar        ☐ Avançar com ressalvas        ☐ Não avançar', { size: 22 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [run(`Requisitos obrigatórios comprovados na entrevista: ______ de ${requisitos.filter((r) => r.obrigatorio).length}`, { size: 22 })] }),
    new Paragraph({ spacing: { after: 60 }, children: [run(`Parecer geral de ${primeiro}`, { bold: true, size: 19, color: CO.mut })] }),
    boxAnotacao(3200),
    new Paragraph({ spacing: { before: 140, after: 60 }, children: [run('Impressão geral (0–5):     0     1     2     3     4     5', { size: 22 })] }),

    new Paragraph({
      spacing: { before: 320 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: CO.linha, space: 6 } },
      alignment: AlignmentType.LEFT,
      children: [run('Roteiro gerado automaticamente pela IA da plataforma (mockup). Preencha durante a entrevista e reenvie em “Entrevista finalizada” para alimentar a análise da IA.', { size: 18, color: CO.mut })],
    }),
  ]

  return new Document({
    creator: 'TalentAI',
    title: `Roteiro de entrevista — ${d.cand}`,
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: CO.texto } } } },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: body }],
  })
}

// Gera o .docx como Blob (Packer roda no navegador). Chamado sob demanda por `baixarRoteiro`.
export const gerarRoteiroBlob = (d: RoteiroDados): Promise<Blob> => Packer.toBlob(gerarRoteiroDoc(d))
