/**
 * Tipos de domínio + dados seed + pools de texto do Banco de talentos. Sem JSX, sem React.
 * Extraído de Candidatos.tsx (refactor puramente estrutural). Os tipos base do funil (Etapa,
 * Candidato, Match) vivem em ../candidatos.logic e são re-exportados aqui por conveniência.
 */
import type { Detalhe } from '../EntrevistasIA'
import type { Candidato, Etapa } from '../candidatos.logic'
export type { Candidato, Etapa, Match } from '../candidatos.logic'

// ---------- Processos seletivos (histórico do candidato) ----------

export type ResultadoFase = 'aprovado' | 'reprovado' | 'em andamento' | 'pendente'
export type CampoDetalhe = { label: string; valor: string }
export type Criterio = { nome: string; nota: number }
// Conteúdo "de verdade" que abre em cada etapa do stepper.
export type QA = { pergunta: string; resposta: string }
export type Desafio = { descricao: string; entrega: string; observacao: string }
// Contexto do candidato/vaga que alimenta o conteúdo de cada processo.
export type ProcCtx = { vaga: string; senioridade: string; nome: string }
// Detalhe rico de "como foi" cada etapa — abre no stepper do processo.
// triagemIA = avaliação completa da IA (a etapa 1 reaproveita a tela Entrevistas IA).
export type DetalheFase = {
  resumo: string; campos: CampoDetalhe[]; criterios: Criterio[]; destaques: string[]; atencao: string[]
  triagemIA?: Detalhe; conversa?: QA[]; desafio?: Desafio; oferta?: CampoDetalhe[]
}
export type Fase = { nome: string; resultado: ResultadoFase; observacao?: string; detalhe: DetalheFase }
export type StatusProc = 'Em andamento' | 'Contratado' | 'Reprovado'
export type Reprovacao = { resumo: string; motivos: string[]; positivos: string[]; recomendacao: string; avaliador: string }
// O que a vaga pedia × o que o candidato alcançou (resumo no topo do processo).
export type Requisito = { nome: string; obrigatorio: boolean; atendido: boolean }
export type PerfilVaga = { resumo: string; experiencia: string; requisitos: Requisito[]; aderencia: number; conquista: string }
export type Processo = { id: string; titulo: string; status: StatusProc; faseAtual: number; totalFases: number; data: string; fases: Fase[]; perfilVaga: PerfilVaga; reprovacao?: Reprovacao }

export const CANDIDATOS_INICIAL: Candidato[] = [
  { id: '1', nome: 'Mariana Lopes', email: 'mariana.lopes@email.com', vaga: 'Desenvolvedor Full Stack', senioridade: 'Pleno/Sênior', etapa: 'Contratado', score: 92, atualizado: 'há 3 dias' },
  { id: '2', nome: 'Jair Carmona', email: 'jair.carmona@email.com', vaga: 'Desenvolvedor Backend', senioridade: 'Pleno', etapa: 'Entrevistado', score: 82, atualizado: 'ontem' },
  { id: '3', nome: 'Diego Teixeira', email: 'diego.teixeira@email.com', vaga: 'Product Manager', senioridade: 'Sênior', etapa: 'Em entrevista', score: 68, atualizado: 'há 2 h' },
  { id: '4', nome: 'Rodrigo Alves', email: 'rodrigo.alves@email.com', vaga: 'UX Designer III', senioridade: 'Pleno/Sênior', etapa: 'Em entrevista', score: 74, atualizado: 'há 5 h' },
  { id: '5', nome: 'Carla Mendonça', email: 'carla.mendonca@email.com', vaga: 'Engenheiro de Dados', senioridade: 'Pleno', etapa: 'Entrevistado', score: 88, atualizado: 'ontem' },
  { id: '6', nome: 'Felipe Santos', email: 'felipe.santos@email.com', vaga: 'Analista de QA', senioridade: 'Júnior', etapa: 'Triagem', score: 65, atualizado: 'há 1 dia' },
  { id: '7', nome: 'Bianca Ferreira', email: 'bianca.ferreira@email.com', vaga: 'Desenvolvedor Backend', senioridade: 'Sênior', etapa: 'Contratado', score: 95, atualizado: 'há 1 semana' },
  { id: '8', nome: 'Gustavo Pereira', email: 'gustavo.pereira@email.com', vaga: 'Product Manager', senioridade: 'Sênior', etapa: 'Reprovado', score: 58, atualizado: 'há 4 dias' },
  { id: '9', nome: 'Larissa Castro', email: 'larissa.castro@email.com', vaga: 'Cientista de Dados', senioridade: 'Pleno/Sênior', etapa: 'Entrevistado', score: 84, atualizado: 'ontem' },
  { id: '10', nome: 'Vitor Hugo', email: 'vitor.hugo@email.com', vaga: 'DevOps Engineer', senioridade: 'Sênior', etapa: 'Em entrevista', score: 79, atualizado: 'há 3 h' },
  { id: '11', nome: 'Aline Ramos', email: 'aline.ramos@email.com', vaga: 'Tech Lead Frontend', senioridade: 'Sênior', etapa: 'Contratado', score: 90, atualizado: 'há 2 semanas' },
  { id: '12', nome: 'Daniel Moreira', email: 'daniel.moreira@email.com', vaga: 'Desenvolvedor Mobile', senioridade: 'Pleno', etapa: 'Banco de talentos', score: 62, atualizado: 'há 1 mês' },
  { id: '13', nome: 'Patrícia Lima', email: 'patricia.lima@email.com', vaga: 'UX Designer III', senioridade: 'Pleno', etapa: 'Reprovado', score: 49, atualizado: 'há 5 dias' },
  { id: '14', nome: 'Ricardo Nunes', email: 'ricardo.nunes@email.com', vaga: 'Analista de QA', senioridade: 'Júnior', etapa: 'Triagem', score: 71, atualizado: 'há 2 dias' },
  { id: '15', nome: 'Sofia Martins', email: 'sofia.martins@email.com', vaga: 'Desenvolvedor Mobile', senioridade: 'Pleno', etapa: 'Em entrevista', score: 80, atualizado: 'há 6 h' },
  { id: '16', nome: 'Gabriel Costa', email: 'gabriel.costa@email.com', vaga: 'Analista de Marketing', senioridade: 'Pleno', etapa: 'Banco de talentos', score: 55, atualizado: 'há 2 meses' },
  { id: '17', nome: 'Juliana Reis', email: 'juliana.reis@email.com', vaga: 'Product Manager', senioridade: 'Pleno', etapa: 'Triagem', score: 73, atualizado: 'há 1 dia' },
  { id: '18', nome: 'Thiago Barros', email: 'thiago.barros@email.com', vaga: 'Arquiteto de Software', senioridade: 'Sênior', etapa: 'Entrevistado', score: 86, atualizado: 'ontem' },
  { id: '19', nome: 'Rafael Tavares', email: 'rafael.tavares@email.com', vaga: 'DevOps Engineer', senioridade: 'Sênior', etapa: 'Banco de talentos', score: 77, atualizado: 'há 3 semanas' },
  { id: '20', nome: 'Letícia Gomes', email: 'leticia.gomes@email.com', vaga: 'Cientista de Dados', senioridade: 'Pleno', etapa: 'Banco de talentos', score: 70, atualizado: 'há 1 mês' },
  { id: '21', nome: 'Pedro Antunes', email: 'pedro.antunes@email.com', vaga: 'Scrum Master', senioridade: 'Sênior', etapa: 'Reprovado', score: 60, atualizado: 'há 6 dias' },
  { id: '22', nome: 'Helena Castro', email: 'helena.castro@email.com', vaga: 'Tech Lead Frontend', senioridade: 'Sênior', etapa: 'Em entrevista', score: 83, atualizado: 'há 4 h' },
  { id: '23', nome: 'Bruno Lima', email: 'bruno.lima@email.com', vaga: 'Engenheiro de Dados', senioridade: 'Pleno', etapa: 'Contratado', score: 91, atualizado: 'há 2 semanas' },
  { id: '24', nome: 'Ana Souza', email: 'ana.souza@email.com', vaga: 'Analista de QA', senioridade: 'Pleno', etapa: 'Banco de talentos', score: 64, atualizado: 'há 1 mês' },
]

export const ETAPA_FILTROS = ['Todas', 'Triagem', 'Em entrevista', 'Entrevistado', 'Contratado', 'Banco de talentos', 'Reprovado'] as const
export const PER_PAGE = 10

// ---------- Pools de texto do domínio (dados sintéticos, determinísticos por seed) ----------

export const FASES_PADRAO = ['Triagem de currículo por IA', 'Entrevista com RH', 'Teste técnico', 'Entrevista com o gestor', 'Proposta']
export const NIVEIS = ['Júnior', 'Pleno', 'Pleno/Sênior', 'Sênior']
export const DATAS_ANTIGAS = ['há 3 meses', 'há 6 meses', 'há 9 meses', 'há 1 ano']
export const MOTIVO_REPROVA = [
  'Não atingiu o nível técnico esperado para a senioridade da vaga.',
  'Perfil comportamental pouco aderente à cultura do time.',
  'Pretensão salarial acima da faixa da posição.',
  'Outro candidato com aderência maior avançou no processo.',
  'Pouca experiência prática nas tecnologias obrigatórias.',
]
export const STATUS_ANDAMENTO = [
  'Entrevista agendada — aguardando realização.',
  'Aguardando feedback do gestor.',
  'Em análise pela equipe de recrutamento.',
]
// Detalhamento da reprovação (painel "Por que foi reprovado"). Motivos específicos da etapa onde caiu.
export const MOTIVOS_POR_FASE: Record<number, string[]> = {
  1: [
    'O currículo não evidencia a experiência mínima exigida para a senioridade da vaga.',
    'Formação e trajetória pouco aderentes ao escopo da posição.',
    'Ausência de comprovação nas principais tecnologias obrigatórias.',
  ],
  2: [
    'Pretensão salarial acima da faixa orçada para a posição.',
    'Disponibilidade de início incompatível com a necessidade do time.',
    'Pouca aderência aos valores e à forma de trabalho da equipe.',
  ],
  3: [
    'Não atingiu a nota mínima no teste técnico (resultado abaixo do corte).',
    'Dificuldade em estruturar a solução e justificar as decisões técnicas.',
    'Lacunas relevantes nas tecnologias obrigatórias da vaga.',
  ],
  4: [
    'Pouca profundidade técnica ao discutir cenários reais com o gestor.',
    'Comunicação e clareza abaixo do esperado para o nível da vaga.',
    'Experiência prática em autonomia/liderança aquém do requerido.',
  ],
  5: [
    'Não houve acordo nas condições finais da proposta.',
    'Candidato optou por outra oferta no fechamento.',
  ],
}
export const POSITIVOS_POOL = [
  'Boa comunicação e postura colaborativa ao longo do processo.',
  'Demonstrou interesse genuíno pela vaga e pela empresa.',
  'Base teórica consistente nos fundamentos da área.',
  'Evolução perceptível entre as etapas do processo.',
]
export const RECOMENDACOES = [
  'Manter no banco de talentos e reavaliar em processos futuros (~6 meses).',
  'Indicado para vaga de senioridade inferior, com melhor aderência ao perfil.',
  'Revisitar após ganhar mais experiência prática nas tecnologias da vaga.',
  'Bom potencial — considerar para outras posições em aberto.',
]
export const AVALIADORES = ['Carlos Mendes · Gestor', 'Marina Albuquerque · RH', 'Rafael Tavares · Tech Lead', 'Beatriz Nunes · Recrutadora']

// ── "Como foi" cada etapa (o detalhe que abre no stepper do processo) ──────────────────────────────
// Resumo por fase em 3 tons (aprovada / reprovada / em andamento). Determinístico por (hash + nº da fase).
export const RESUMO_FASE: Record<number, { ok: string; ko: string; and: string }> = {
  1: {
    ok: 'A IA leu o currículo e cruzou com os requisitos da vaga. A aderência ficou acima do corte e o candidato foi liberado para a etapa seguinte.',
    ko: 'A IA leu o currículo e cruzou com os requisitos da vaga, mas a aderência ficou abaixo do corte — o candidato não avançou automaticamente.',
    and: 'A IA está processando o currículo e cruzando com os requisitos da vaga.',
  },
  2: {
    ok: 'Conversa inicial de RH para entender trajetória, motivação e expectativas. Avaliação positiva — seguiu para a etapa técnica.',
    ko: 'Conversa inicial de RH para entender trajetória, motivação e expectativas. A aderência ficou abaixo do esperado nesta etapa.',
    and: 'Entrevista de RH agendada — aguardando realização e registro do feedback.',
  },
  3: {
    ok: 'Desafio técnico para avaliar a forma de resolver problemas e a qualidade do código. Resultado acima do corte exigido.',
    ko: 'Desafio técnico para avaliar a forma de resolver problemas e a qualidade do código. Resultado abaixo do corte exigido.',
    and: 'Teste técnico enviado — aguardando a entrega do candidato.',
  },
  4: {
    ok: 'Entrevista com o gestor da vaga sobre cenários reais, arquitetura e fit com o time. Avaliação positiva.',
    ko: 'Entrevista com o gestor da vaga sobre cenários reais, arquitetura e fit com o time. Não atingiu o nível esperado.',
    and: 'Entrevista com o gestor agendada — aguardando realização.',
  },
  5: {
    ok: 'Apresentação e negociação da proposta. Condições acordadas entre as partes.',
    ko: 'Apresentação e negociação da proposta, mas não houve acordo nas condições finais.',
    and: 'Proposta em elaboração pela equipe de recrutamento.',
  },
}
// Pontos fortes observados em cada etapa (entram em "Destaques" do detalhe).
export const DESTAQUE_POR_FASE: Record<number, string[]> = {
  1: [
    'Experiência prática nas principais tecnologias da vaga identificada no histórico.',
    'Formação acadêmica compatível com a área da posição.',
    'Palavras-chave do anúncio encontradas em projetos anteriores.',
  ],
  2: [
    'Comunicação clara e objetiva durante a conversa.',
    'Motivação genuína pela vaga e pela empresa.',
    'Expectativas de carreira alinhadas à posição.',
  ],
  3: [
    'Solução funcional e entregue dentro do prazo proposto.',
    'Código organizado, com boa nomeação e estrutura.',
    'Decisões técnicas bem justificadas no relatório.',
  ],
  4: [
    'Boa profundidade ao discutir arquitetura e trade-offs.',
    'Exemplos concretos de entregas e impacto no negócio.',
    'Clareza ao explicar decisões técnicas para o time.',
  ],
  5: [
    'Faixa salarial dentro do orçamento da posição.',
    'Disponibilidade de início compatível com o time.',
    'Modelo de trabalho (híbrido) acordado entre as partes.',
  ],
}
export const EXP_EXIGIDA: Record<string, string> = { 'Júnior': '6 meses a 2 anos', 'Pleno': '2 a 4 anos', 'Pleno/Sênior': '3 a 6 anos', 'Sênior': '5+ anos' }

// Critérios avaliados em cada etapa — viram a "Avaliação por critério" (barra de nota por item).
export const CRITERIOS_POR_FASE: Record<number, string[]> = {
  1: ['Experiência relevante', 'Formação acadêmica', 'Skills técnicas', 'Palavras-chave da vaga'],
  2: ['Comunicação', 'Motivação', 'Fit cultural', 'Expectativas alinhadas'],
  3: ['Lógica e algoritmo', 'Qualidade do código', 'Boas práticas', 'Cobertura de testes'],
  4: ['Profundidade técnica', 'Resolução de problemas', 'Comunicação', 'Fit com o time'],
  5: ['Alinhamento salarial', 'Disponibilidade', 'Aderência ao modelo'],
}

export const ETAPA_PROC: Record<Etapa, StatusProc> = {
  'Triagem': 'Em andamento', 'Em entrevista': 'Em andamento', 'Entrevistado': 'Em andamento',
  'Contratado': 'Contratado', 'Reprovado': 'Reprovado', 'Banco de talentos': 'Reprovado',
}
export const ETAPA_FASE: Record<Etapa, (h: number) => number> = {
  'Triagem': () => 1,
  'Em entrevista': (h) => 2 + (h % 2),
  'Entrevistado': () => 4,
  'Contratado': () => 5,
  'Reprovado': (h) => 2 + (h % 3),
  'Banco de talentos': (h) => 3 + (h % 2),
}

// Charlie — copiloto de match
export const SEN_OPCOES = ['Qualquer', ...NIVEIS]
