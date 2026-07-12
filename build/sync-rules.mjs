// sync-rules.mjs — espelha as regras canônicas (.cursor/rules/*.mdc) em .claude/rules/*.md.
//
// Por quê: o Cursor aplica .mdc nativamente (frontmatter com globs), e o Claude Code auto-carrega
// todo *.md de .claude/rules/ no contexto — mas o @import do CLAUDE.md NÃO aceita a extensão .mdc
// (testado em 2026-07-11: import de .mdc não resolve nem do CLAUDE.md raiz). Copiar à mão
// divergiria; então o espelho é GERADO daqui e o drift é gate:
//
//   npm run sync:rules          → (re)gera .claude/rules/*.md a partir dos .mdc
//   npm run sync:rules -- --check  → sai 1 se o espelho estiver desatualizado/órfão (roda no pretest)
//
// O espelho descarta o frontmatter (mecânica do Cursor) e preserva a description como linha
// "Quando aplicar" — o conteúdo normativo fica idêntico, byte a byte (normalizado para LF).

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, '.cursor', 'rules')
const OUT = join(ROOT, '.claude', 'rules')
const CHECK = process.argv.includes('--check')

const norm = (s) => s.replace(/\r\n/g, '\n')

function gerar(mdc) {
  const raw = norm(readFileSync(join(SRC, mdc), 'utf8'))
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  const body = (m ? raw.slice(m[0].length) : raw).replace(/^\n+/, '')
  const desc = ((m ? m[1] : '').match(/^description:\s*(.+)$/m) || [])[1]
  return (
    `<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/${mdc} — NÃO EDITAR AQUI.\n` +
    `     Edite o .mdc canônico e rode \`npm run sync:rules\`. O pretest reprova drift. -->\n\n` +
    (desc ? `> **Quando aplicar:** ${desc}\n\n` : '') +
    body +
    (body.endsWith('\n') ? '' : '\n')
  )
}

const mdcs = readdirSync(SRC).filter((f) => f.endsWith('.mdc')).sort()
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const drift = []
for (const mdc of mdcs) {
  const nome = basename(mdc, '.mdc') + '.md'
  const alvo = join(OUT, nome)
  const esperado = gerar(mdc)
  const atual = existsSync(alvo) ? norm(readFileSync(alvo, 'utf8')) : null
  if (atual !== esperado) {
    if (CHECK) drift.push(nome)
    else {
      writeFileSync(alvo, esperado)
      console.log('  ↻ ' + nome)
    }
  }
}

// .md órfão no espelho (regra removida/renomeada no canônico) também é drift
const esperados = new Set(mdcs.map((f) => basename(f, '.mdc') + '.md'))
const orfaos = readdirSync(OUT).filter((f) => f.endsWith('.md') && !esperados.has(f))
if (orfaos.length) drift.push(...orfaos.map((f) => `${f} (órfão — remova ou restaure o .mdc)`))

if (CHECK && drift.length) {
  console.error(`❌ sync:rules --check — espelho .claude/rules/ fora de sincronia com .cursor/rules/:`)
  for (const d of drift) console.error('   • ' + d)
  console.error('   Rode `npm run sync:rules` e commite o resultado.')
  process.exit(1)
}
if (!CHECK && orfaos.length) console.warn('  ⚠ órfãos: ' + orfaos.join(', '))
console.log(`✅ sync:rules ${CHECK ? 'OK — espelho em dia' : '— espelho atualizado'} (${mdcs.length} regras).`)
