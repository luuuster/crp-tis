# Auditoria — CRP Design System
### 2026-06-10 · rev. 3 · verificação pós-saneamento da rev. 2

> **ERRATA:** o achado #1 ("corrupção recorrente do working tree") foi posteriormente diagnosticado
> como **artefato da visão do sandbox da ferramenta de auditoria**, não corrupção real do disco —
> o mesmo arquivo, lido no mesmo instante, estava completo no Windows e truncado no sandbox.
> Os arquivos do repositório nunca estiveram corrompidos. Detalhes e proteções (doctor + hook):
> `docs/PROTECAO-CORRUPCAO.md`. Os demais achados e verificações desta auditoria permanecem válidos.

## Veredito

**Os 16 achados reais da rev. 2 foram corrigidos — todos verificados no código, um a um.** O HEAD
está integralmente verde no gate mais completo até agora. O único problema restante no projeto é o
mesmo de antes, e ele **voltou a acontecer: a corrupção do working tree é RECORRENTE** (segunda
ocorrência hoje, agora maior). Detalhes e plano de diagnóstico abaixo.

**Gate completo no HEAD (`19180df`), ambiente limpo:**

| Verificação | Resultado |
|---|---|
| `npm run build` | ✅ |
| `npm run check` | ✅ |
| `npm run audit:dark -- --strict` | ✅ |
| `export:figma` + `verify-figma` | ✅ (com log de gamut novo) |
| `npm test` (raiz) | ✅ 75/75 (4 testes novos) |
| `tsc --noEmit` + `vitest` (app) | ✅ 18/18 |

## Status dos 19 achados da rev. 2

| # | Achado | Status | Verificação |
|---|---|---|---|
| 1 | Working tree corrompido | 🔴 **RECORRENTE** | ver abaixo — voltou em 26 arquivos |
| 2 | Gamut sRGB silencioso | ✅ | `export:figma` loga `Gamut: 117/290…`; README §"Gamut de cor (sRGB × P3)" |
| 3 | token-studio/tokens.json stale | ✅ | CI gera + publica artifact; nota de regeneração no README |
| 4 | Drift ignora modo ausente | ✅ | `missingModes()` (code.js:634, usado em :689) + teste novo |
| 5 | `npm test` falha em clone limpo | ✅ | `pretest` → `check-icon-bundles.mjs`; testei o negativo: mensagem clara + exit 1 |
| 6 | Conversão de cor duplicada | ✅ | `build/lib/color.mjs` importado por export-figma e verify-figma |
| 7 | OKLCH decimal vs % | ✅ | 0 valores decimais restantes; **neutralidade provada**: 48 cores reformatadas, 0 divergência de RGB no dist |
| 8 | `find(isDefault)` sem guarda | ✅ | export-figma.mjs:231–232 com mensagem nomeada + exit 1 |
| 9 | depth>10 silencioso | ✅ | `console.warn` com nome da var (lib/css.mjs:33) |
| 10 | `setVariableCodeSyntax` engolido | ✅ | `stats.codeSyntaxErrors` + log se >0 (code.js:371, 444) |
| 11 | Promessas sem guarda de unmount | ✅ | `mountedRef` em Login (:55–67) e Register (:86–113) |
| 12 | Sem engines/packageManager | ✅ | nos dois package.json |
| 13 | CI sem cache npm | ✅ | `cache: npm` + dependency-path nos 2 jobs |
| 14 | dist/primitives.css intermediário | ✅ | removido ao fim do build (build-tokens.mjs:149); dist limpo |
| 15 | settings.local.json não ignorado | ✅ | .gitignore:18 |
| 16 | Logos com `=` no nome | ✅ | renomeados p/ `logo-full-*.svg`, zero referências antigas |
| 17 | Prefixo 'CRP/' hardcoded | ✅ | `COLLECTION_PREFIX` (code.js:34) |
| 18 | minifySvg por regex | ⚪ descartado | entrada controlada + coberto por bundle.test — aceito |
| 19 | ErrorBoundary sem telemetria | ⚪ descartado | caminho de produção documentado — aceito |

Não encontrei regressões nos diffs novos: o gate cobre as áreas alteradas (a prova de neutralidade
do #7 e o teste negativo do #5 foram executados explicitamente nesta auditoria).

## 🔴 O único problema restante: a corrupção do disco VOLTOU — e é recorrente

No momento desta auditoria (13:4x), o working tree tem **26 arquivos truncados** vs HEAD
(−470 linhas; na rev. 2 eram 19 arquivos/−327). Não é o resíduo de antes: os pontos de truncamento
**mudaram** (`build-tokens.mjs` agora corta em outra linha) e a lista **inclui arquivos
criados/editados hoje** (`LoginPage.tsx` −223 bytes, `.gitignore` −7 bytes, `lib/css.mjs`). Ou seja:
**o padrão é "arquivo recém-escrito aparece truncado no disco depois"**. O git continua íntegro —
os commits capturaram o conteúdo completo antes do corte.

Isso descarta "acidente único" e aponta para algo no ambiente que interfere em escrita de arquivos
nessa pasta. Suspeitos clássicos, em ordem: **sincronização de nuvem** (a pasta está em
`C:\Users\frank\Videos`, que o OneDrive costuma sincronizar com "Arquivos sob Demanda"), antivírus
com varredura on-write, ou a camada de sincronização da própria ferramenta que edita os arquivos.

**Diagnóstico em 2 passos (faça antes de qualquer outra coisa):**
1. Num terminal do Windows, direto na pasta: `npm run build`.
   - Se **passar**: o arquivo real no seu disco está bom, e o truncamento está na *visão* sincronizada
     (placeholder de nuvem) — o problema é do sync, não do disco.
   - Se **falhar** com SyntaxError: o disco está truncado de verdade → `git restore .` resolve
     (o HEAD tem tudo), mas a causa precisa ser eliminada.
2. Verifique se `C:\Users\frank\Videos` está sob OneDrive/Backup do Windows (Configurações do
   OneDrive → Sincronização e backup). Se estiver, **mova o repositório para fora da pasta
   sincronizada** (ex.: `C:\dev\crp_ds`) — repositório git + sync de nuvem é receita conhecida
   para exatamente este sintoma.

Enquanto isso, a prática que está te salvando é commitar com frequência — o histórico do git foi a
cópia íntegra nas duas ocorrências.

### Lembrete operacional
Após o restore, rode `npm run export:ts` local se for importar no Token Studio — o bundle no disco
ainda é o das 02:59 (o CI agora gera o artifact atualizado a cada push).

## Conclusão

Ciclo fechado: das três auditorias de hoje, **todos os 30+ achados de código foram corrigidos e
verificados** — contraste de estados compostos fatal, fontes únicas em `build/lib/`, plugin com
auditoria honesta (modos ausentes), DX de clone limpo, formato de token normalizado com prova de
neutralidade. O código não tem pendência aberta. O que resta é um problema de **ambiente**, não de
projeto — e os 2 passos acima identificam o culpado.
