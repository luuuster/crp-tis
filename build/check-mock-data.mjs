// check-mock-data.mjs — gate da regra 10 (.cursor/rules/10-mock-data-i18n.mdc).
//
// O repo é PÚBLICO e simula recrutamento: dado real é incidente. Este gate varre o conteúdo
// mockado (app/src + app/e2e) e REPROVA:
//   1. e-mail cujo domínio não é fictício declarado (allowlist abaixo) — pega @gmail/@hotmail/etc.
//   2. CPF matematicamente VÁLIDO (dígito verificador correto) — mock DEVE ser inválido de
//      propósito (ex.: 123.456.789-00) ou máscara (000.000.000-00).
//
// Exceções deliberadas (documentadas na regra 10):
//   - talentai.com  → domínio corporativo do PRODUTO fictício (login demo, equipe, placeholders);
//   - exemplo.com / ejemplo.com → placeholder de e-mail nos locales pt/es (equivalente local do example.com);
//   - example.com/.org/.net e *.example → reservados pela RFC 2606/6761.
//
// Uso: npm run check:mock (raiz). Sai 1 com achados; 0 com o placar. Sem dependências.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SCAN_DIRS = ['app/src', 'app/e2e']
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.html'])
const ALLOWED_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'exemplo.com', 'ejemplo.com', 'talentai.com'])

const EMAIL_RE = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g
const CPF_RE = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g

// CPF real usa dois dígitos verificadores (módulo 11). Um CPF que PASSA aqui pode ser de uma
// pessoa de verdade — é exatamente o que o mock não pode conter.
function cpfEhValido(cpf) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false // repetido = sintético notório
  for (const n of [9, 10]) {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i)
    const dv = ((soma * 10) % 11) % 10
    if (dv !== Number(d[n])) return false
  }
  return true
}

function* arquivos(dir) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome)
    if (statSync(p).isDirectory()) {
      if (nome !== 'node_modules' && nome !== '__screenshots__') yield* arquivos(p)
    } else if (EXTS.has(nome.slice(nome.lastIndexOf('.')))) yield p
  }
}

const achados = []
let total = 0
for (const dir of SCAN_DIRS) {
  for (const arq of arquivos(join(ROOT, dir))) {
    total++
    const rel = relative(ROOT, arq).replaceAll('\\', '/')
    const linhas = readFileSync(arq, 'utf8').split('\n')
    linhas.forEach((linha, i) => {
      for (const m of linha.matchAll(EMAIL_RE)) {
        const dominio = m[1].toLowerCase()
        if (!ALLOWED_DOMAINS.has(dominio) && !dominio.endsWith('.example'))
          achados.push(`${rel}:${i + 1}  e-mail com domínio não-fictício "${dominio}": ${m[0]}`)
      }
      for (const m of linha.matchAll(CPF_RE)) {
        if (cpfEhValido(m[0]))
          achados.push(`${rel}:${i + 1}  CPF VÁLIDO (pode ser de pessoa real): ${m[0]} — use um inválido por dígito verificador`)
      }
    })
  }
}

if (achados.length) {
  console.error(`❌ check:mock — ${achados.length} achado(s) de dado potencialmente real:\n`)
  for (const a of achados) console.error('  ' + a)
  console.error('\nRegra: .cursor/rules/10-mock-data-i18n.mdc (e-mail @example.com; CPF inválido de propósito).')
  process.exit(1)
}
console.log(`✅ check:mock OK — ${total} arquivos varridos (${SCAN_DIRS.join(', ')}): e-mails só em domínios fictícios, nenhum CPF válido.`)
