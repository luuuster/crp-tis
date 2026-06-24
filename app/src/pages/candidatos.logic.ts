/**
 * Lógica PURA do Banco de talentos (sem JSX) — extraída de Candidatos.tsx para ser testável isolada.
 * Tipos do domínio + helpers determinísticos (seleção circular, mapa vaga→área, match do Charlie).
 * NÃO importa de Candidatos.tsx (evita ciclo); só depende de utilitários de @/lib.
 */

export type Etapa = 'Triagem' | 'Em entrevista' | 'Entrevistado' | 'Contratado' | 'Banco de talentos' | 'Reprovado'
export type Candidato = { id: string; nome: string; email: string; vaga: string; senioridade: string; etapa: Etapa; score: number; atualizado: string }

// Match = candidato + % de aderência + skills da vaga que ele cobre + o "por quê".
export type Match = { c: Candidato; pct: number; skills: string[]; motivo: string }

export const pick = <T,>(arr: readonly T[], n: number) => arr[n % arr.length]
export const pickN = (arr: readonly string[], seed: number, n: number) =>
  Array.from({ length: Math.min(n, arr.length) }, (_, i) => arr[(seed + i) % arr.length])

// Mapeia a vaga para skills, curso e cargo-base coerentes com a área.
export function areaInfo(vaga: string): { skills: string[]; curso: string; cargoBase: string } {
  const v = vaga.toLowerCase()
  if (v.includes('full stack')) return { skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'API REST', 'Git'], curso: 'Ciência da Computação', cargoBase: 'Desenvolvedor(a) Full Stack' }
  if (v.includes('backend') || v.includes('back-end')) return { skills: ['Node.js', 'Java', 'Python', 'PostgreSQL', 'Docker', 'Kafka', 'API REST', 'Microsserviços'], curso: 'Engenharia de Software', cargoBase: 'Desenvolvedor(a) Backend' }
  if (v.includes('front')) return { skills: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Jest', 'Vite', 'Acessibilidade', 'Storybook'], curso: 'Análise e Desenvolvimento de Sistemas', cargoBase: 'Desenvolvedor(a) Frontend' }
  if (v.includes('mobile')) return { skills: ['React Native', 'Swift', 'Kotlin', 'TypeScript', 'Firebase', 'CI/CD'], curso: 'Engenharia de Computação', cargoBase: 'Desenvolvedor(a) Mobile' }
  if (v.includes('devops')) return { skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Prometheus', 'Linux'], curso: 'Engenharia de Computação', cargoBase: 'Engenheiro(a) DevOps' }
  if (v.includes('dados') || v.includes('data') || v.includes('cientista')) return { skills: ['Python', 'SQL', 'Pandas', 'Spark', 'Airflow', 'dbt', 'Machine Learning'], curso: 'Estatística', cargoBase: 'Profissional de Dados' }
  if (v.includes('product')) return { skills: ['Discovery', 'Roadmap', 'Métricas', 'Jira', 'Análise de dados', 'A/B Test', 'Stakeholders'], curso: 'Administração', cargoBase: 'Product Manager' }
  if (v.includes('ux') || v.includes('design')) return { skills: ['Figma', 'Pesquisa com usuário', 'Prototipação', 'Design System', 'Acessibilidade', 'Usabilidade'], curso: 'Design Digital', cargoBase: 'Designer de Produto' }
  if (v.includes('qa') || v.includes('quality')) return { skills: ['Cypress', 'Selenium', 'Postman', 'Testes automatizados', 'Jest', 'CI/CD'], curso: 'Análise e Desenvolvimento de Sistemas', cargoBase: 'Analista de QA' }
  if (v.includes('tech lead') || v.includes('arquiteto')) return { skills: ['Arquitetura de software', 'React', 'Node.js', 'AWS', 'Liderança técnica', 'System Design'], curso: 'Engenharia de Software', cargoBase: 'Tech Lead' }
  if (v.includes('scrum') || v.includes('master')) return { skills: ['Scrum', 'Kanban', 'Facilitação', 'Métricas ágeis', 'Jira', 'Coaching'], curso: 'Gestão de Projetos', cargoBase: 'Scrum Master' }
  if (v.includes('marketing')) return { skills: ['SEO', 'Google Ads', 'Analytics', 'Conteúdo', 'CRM', 'Mídia paga'], curso: 'Publicidade e Propaganda', cargoBase: 'Analista de Marketing' }
  return { skills: ['Comunicação', 'Organização', 'Excel avançado', 'Gestão de tempo'], curso: 'Administração', cargoBase: 'Profissional' }
}

// Ordem dos níveis (escala única e canônica de senioridade — espelha NIVEIS do Gerador de Vagas, que é
// a fonte da verdade da criação de vaga). Sem composto "Pleno/Sênior": a vaga tem UM nível só.
export const SEN_ORDEM: Record<string, number> = { 'Estágio': 0, 'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 4, 'Liderança': 5 }
// Quão perto a senioridade do candidato está da desejada (0–1). "Qualquer" = neutro.
export function senioridadeScore(alvo: string, cand: string): number {
  if (alvo === 'Qualquer') return 0.7
  if (alvo === cand) return 1
  const dist = Math.abs((SEN_ORDEM[alvo] ?? 2) - (SEN_ORDEM[cand] ?? 2))
  return dist <= 1 ? 0.5 : 0.25
}

// Ranqueia TODO o banco pela aderência à vaga-alvo. Determinístico (skills da área + senioridade +
// histórico do candidato + texto livre do recrutador). Sem aleatoriedade — estável entre renders.
export function charlieRank(alvoVaga: string, alvoSen: string, contexto: string, cands: Candidato[]): Match[] {
  const alvo = areaInfo(alvoVaga)
  const alvoSet = alvo.skills.map((s) => s.toLowerCase())
  const ctx = contexto.trim().toLowerCase()
  return cands
    .map((c) => {
      const ci = areaInfo(c.vaga)
      const skills = ci.skills.filter((s) => alvoSet.includes(s.toLowerCase())) // skills da vaga que o candidato cobre
      const areaScore = alvo.skills.length ? skills.length / alvo.skills.length : 0
      const senScore = senioridadeScore(alvoSen, c.senioridade)
      // bônus pelo que o recrutador descreveu em texto livre (skills citadas / cargo da área)
      const ctxBonus = ctx
        ? Math.min(0.12, skills.filter((s) => ctx.includes(s.toLowerCase())).length * 0.03 + (ctx.includes(ci.cargoBase.toLowerCase()) ? 0.06 : 0))
        : 0
      const base = 0.55 * areaScore + 0.25 * senScore + 0.2 * (c.score / 100) + ctxBonus
      const pct = Math.max(8, Math.min(99, Math.round(base * 100)))
      const senTxt = alvoSen === 'Qualquer' || senScore >= 1 ? `senioridade ${c.senioridade}` : `senioridade ${c.senioridade} (próxima)`
      const motivo = skills.length
        ? `Domina ${skills.slice(0, 3).join(', ')}${skills.length > 3 ? ` e +${skills.length - 3}` : ''} · ${senTxt} · histórico ${c.score}%`
        : `Perfil de outra área (${ci.cargoBase}) · ${senTxt} · histórico ${c.score}%`
      return { c, pct, skills, motivo }
    })
    .sort((a, b) => b.pct - a.pct)
}
