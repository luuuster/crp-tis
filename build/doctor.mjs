#!/usr/bin/env node
/**
 * doctor.mjs — detecta (e com --fix restaura) arquivos CORROMPIDOS no working tree.
 *
 * Contexto: em 2026-06-10 o working tree foi corrompido DUAS vezes (19 e depois 26 arquivos
 * truncados — cortados no meio de palavra, com padding de espaços ou bytes NUL), sempre em
 * arquivos recém-escritos, enquanto o conteúdo commitado permaneceu íntegro. Causa provável:
 * interferência de sincronização de nuvem/antivírus na pasta do repo (ver docs/PROTECAO-CORRUPCAO.md).
 *
 * O que faz:
 *   1. Lista arquivos com conteúdo diferente do HEAD (git diff --ignore-cr-at-eol).
 *   2. Classifica cada um:
 *      - CORROMPIDO: contém byte NUL, OU é um PREFIXO do conteúdo do HEAD cortado NO MEIO de uma
 *        linha (truncamento), tolerando padding de espaços/tabs no fim (assinaturas observadas).
 *        Prefixo que termina em fronteira LIMPA de linha ('\n' final) é EDIÇÃO legítima — apagar
 *        código do fim de um arquivo produz exatamente essa forma (falso positivo já ocorrido).
 *      - EDITADO: qualquer outra diferença — é trabalho seu; o doctor NUNCA toca nesses.
 *   3. Sem --fix: reporta e sai com código 1 se houver corrompidos (uso em hook/CI).
 *      Com --fix: sobrescreve os corrompidos IN-PLACE com o conteúdo do HEAD (sem unlink,
 *      técnica que funciona mesmo quando `git restore` falha com EPERM) e re-verifica.
 *
 * Uso:  npm run doctor        # só diagnóstico (exit 1 se houver corrupção)
 *       npm run doctor:fix    # diagnóstico + restauração dos corrompidos
 *       DOCTOR_ALLOW=caminho/a.ts,caminho/b.ts npm run doctor
 *         # bypass GRANULAR p/ falso positivo pontual (não desliga o hook inteiro como --no-verify)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FIX = process.argv.includes('--fix');
// Bypass granular p/ falso positivo: lista de caminhos (relativos ao repo, separados por vírgula)
// que o doctor trata como edição legítima nesta execução. Preferível ao `git commit --no-verify`,
// que desliga o gate INTEIRO.
const ALLOW = new Set(
  (process.env.DOCTOR_ALLOW ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\\/g, '/'))
    .filter(Boolean),
);

function git(args, asBuffer = false) {
  return execFileSync('git', args, {
    encoding: asBuffer ? 'buffer' : 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'], // silencia stderr (ex.: "path not in HEAD" p/ arquivos novos)
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
}

// Normaliza EOL p/ comparar conteúdo (o repo usa .gitattributes text=auto; CRLF local é esperado).
const norm = (buf) => buf.toString('utf8').replace(/\r\n/g, '\n');

let changed;
try {
  changed = git(['--no-optional-locks', 'diff', '--ignore-cr-at-eol', '--name-only', 'HEAD'])
    .split('\n').filter(Boolean);
} catch (e) {
  console.error('❌ doctor: não consegui rodar git diff (repo git presente?):', e.message);
  process.exit(2);
}

if (!changed.length) {
  console.log('✅ doctor: working tree íntegro — nenhum arquivo difere do HEAD em conteúdo.');
  process.exit(0);
}

const corrupted = [];
const edited = [];

for (const f of changed) {
  if (ALLOW.has(f)) { edited.push(`${f} (DOCTOR_ALLOW — não classifico)`); continue; }
  if (!existsSync(f)) { edited.push(`${f} (apagado — não toco)`); continue; }
  let headBuf;
  try { headBuf = git(['show', `HEAD:${f}`], true); }
  catch { edited.push(`${f} (novo no index — não toco)`); continue; }

  const diskBuf = readFileSync(f);
  const hasNul = diskBuf.includes(0);
  const disk = norm(diskBuf);
  const head = norm(headBuf);
  // Assinatura de truncamento: disco é prefixo do HEAD (ignorando padding de espaços/tabs no fim)
  // E o corte cai no MEIO de uma linha (sem '\n' final). Prefixo terminando em fronteira limpa de
  // linha é apagar-código-do-fim — edição legítima, não corrupção (falso positivo já ocorrido:
  // remoção de dead code no fim de candidaturas.ts bloqueou o commit).
  const diskTrimmed = disk.replace(/[ \t]+$/s, '');
  const cleanLineBoundary = disk.endsWith('\n') && disk === diskTrimmed;
  const isTruncated = disk.length < head.length && head.startsWith(diskTrimmed) && !cleanLineBoundary;

  if (hasNul || isTruncated) {
    corrupted.push({ f, motivo: hasNul ? 'bytes NUL' : `truncado (${diskBuf.length}B de ${headBuf.length}B)` });
  } else {
    edited.push(f);
  }
}

if (edited.length) {
  console.log(`✏  Modificados de verdade (edição sua — o doctor não toca): ${edited.length}`);
  for (const f of edited) console.log(`   • ${f}`);
}

if (!corrupted.length) {
  console.log('✅ doctor: nenhuma assinatura de corrupção. Diferenças acima (se houver) são edições legítimas.');
  process.exit(0);
}

console.log(`\n🔴 doctor: ${corrupted.length} arquivo(s) com ASSINATURA DE CORRUPÇÃO (truncamento/NUL):`);
for (const { f, motivo } of corrupted) console.log(`   • ${f} — ${motivo}`);

if (!FIX) {
  console.log('\n   Rode `npm run doctor:fix` para restaurar do HEAD (não toca nos editados).');
  process.exit(1);
}

console.log('\n🔧 Restaurando do HEAD (sobrescrita in-place, sem unlink)…');
let falhas = 0;
for (const { f } of corrupted) {
  try {
    writeFileSync(f, git(['show', `HEAD:${f}`], true));
    console.log(`   ✔ ${f}`);
  } catch (e) {
    falhas++;
    console.error(`   ✖ ${f}: ${e.message}`);
  }
}

// Re-verificação
const after = git(['--no-optional-locks', 'diff', '--ignore-cr-at-eol', '--name-only', 'HEAD'])
  .split('\n').filter(Boolean)
  .filter((f) => corrupted.some((c) => c.f === f));
if (falhas || after.length) {
  console.error(`\n❌ doctor: ${falhas + after.length} arquivo(s) ainda com problema — verifique manualmente.`);
  process.exit(1);
}
console.log('\n✅ doctor: todos os corrompidos restaurados e re-verificados contra o HEAD.');
