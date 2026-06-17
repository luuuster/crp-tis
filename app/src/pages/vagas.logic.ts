/**
 * Lógica (sem JSX) da Lista de Vagas — builders e constantes de domínio. Lar natural do tipo `Vaga` e dos
 * construtores `mkVaga`/`mkGen`, separados da tela (VagasList.tsx) para serem testáveis sem React.
 * Importa Briefing/Perfil de '@/lib/vaga' e StatusVaga de '@/lib/types' — não importa de VagasList.tsx (sem ciclo).
 */
import { type Briefing, type Perfil } from '@/lib/vaga'
import { type StatusVaga as Status } from '@/lib/types'

// Uma vaga carrega o BRIEFING + PERFIL completos (todas as informações do detalhe). Os campos da tabela
// (vaga/senioridade/modelo) são DERIVADOS do briefing pelo mkVaga — fonte única, sem risco de divergência.
export type Vaga = {
  id: string; data: string; inscritos: number; aprovados: number; status: Status
  vaga: string; senioridade: string; modelo: string
  briefing: Briefing; perfil: Perfil
}

// Condições comuns da empresa (mesma TIS) — reaproveitadas por todas as vagas.
export const BENEF: string[] = ['Vale-refeição', 'Plano de saúde', 'Vale-transporte', 'Auxílio home-office', 'Day-off no aniversário', 'Gympass']
export const PROCESSO: string[] = ['Triagem de currículo', 'Entrevista com RH', 'Entrevista técnica', 'Entrevista com o gestor', 'Proposta']

// Constrói uma Vaga derivando os campos da tabela do próprio briefing (cargo/nível/modelo).
export function mkVaga(meta: { id: string; data: string; inscritos: number; aprovados: number; status: Status }, briefing: Briefing, perfil: Perfil): Vaga {
  return { ...meta, vaga: briefing.cargo, senioridade: briefing.nivel, modelo: briefing.modelo, briefing, perfil }
}

// Vaga "genérica" completa (detalhe íntegro) a partir do cargo — povoa a lista p/ demonstrar a paginação.
export function mkGen(meta: { id: string; data: string; inscritos: number; aprovados: number; status: Status }, cargo: string, nivel: string, modelo: string, gestor: string, budget: string, stack: string[], responsabilidades: string): Vaga {
  return mkVaga(meta,
    {
      cargo, nivel, modelo, cliente: 'TIS Talent AI Platform', gestor,
      desafio: `O time responsável por ${cargo.toLowerCase()} está crescendo para acompanhar a evolução da plataforma e entregar mais valor com qualidade.`,
      objetivo: `Reforçar a área com uma pessoa ${nivel} para elevar a capacidade de entrega, mantendo escalabilidade, qualidade e boas práticas.`,
      local: 'São Paulo — SP', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 1,
      budget, modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
    },
    {
      formacao: 'Superior completo em área correlata à vaga.',
      experiencia: `Experiência compatível com o nível ${nivel}, com atuação comprovada na função.`,
      exigencias: ['Comprovação de experiência'],
      stackObrigatoria: stack,
      conhecimentosDesejaveis: ['Metodologias ágeis', 'Trabalho colaborativo', 'Documentação técnica'],
      responsabilidades,
      habilidades: ['Comunicação clara', 'Trabalho em equipe', 'Organização', 'Proatividade', 'Autonomia'],
      justificativa: 'Expansão da equipe para sustentar o crescimento do produto.',
    },
  )
}
