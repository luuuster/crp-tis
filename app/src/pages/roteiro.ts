/**
 * Roteiro de entrevista (mockup) — download de um DOCUMENTO WORD .docx NATIVO para o entrevistador levar à
 * conversa e reenviar preenchido no fim ("Entrevista finalizada"), alimentando a análise da IA.
 *
 * A montagem do documento (e a lib pesada `docx`) vive em `roteiro.doc.ts` e é carregada SOB DEMANDA
 * (dynamic import), só quando o usuário clica em baixar — mantém o bundle das telas leve.
 */
export type RoteiroDados = {
  cand: string
  vaga: string
  data: string // dd/MM/yyyy
  hora: string
  tipo: string // rótulo do formato (já traduzido pelo chamador)
  entrevistadores: string[] // "Nome · Papel"
  score?: number // 0–100; se ausente, deriva do nome (determinístico)
}

// Dispara o download do .docx nativo (Microsoft Word / Google Docs abrem sem aviso de conversão).
export async function baixarRoteiro(d: RoteiroDados): Promise<void> {
  const { gerarRoteiroBlob } = await import('./roteiro.doc')
  const blob = await gerarRoteiroBlob(d)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const nome = `Roteiro - ${d.cand} - ${d.vaga}`.replace(/[\\/:*?"<>|]+/g, ' ').trim()
  a.download = `${nome}.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoga no próximo tick: revogar sincronamente logo após o click() funciona nos browsers atuais,
  // mas é frágil — o download pode ainda não ter "capturado" a URL do blob.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
