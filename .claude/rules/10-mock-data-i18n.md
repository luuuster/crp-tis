<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/10-mock-data-i18n.mdc — NÃO EDITAR AQUI.
     Edite o .mdc canônico e rode `npm run sync:rules`. O pretest reprova drift. -->

> **Quando aplicar:** Dados mock, privacidade e i18n — regras para TODO conteúdo fictício (pessoas, e-mails, documentos, telefones) e para as 4 línguas (pt-BR fonte editorial, en, es, pt-AO por override). O repositório é PÚBLICO — dado real é incidente. Aplicar ao criar/editar fixtures, personas, telas, locales ou testes.

# 10 — Dados mock, privacidade e i18n

> **Regra normativa.** O repo é público e simula recrutamento — o domínio mais sensível a PII.
> Gate executável: `npm run check:mock` (raiz) reprova e-mail fora dos domínios fictícios e
> CPF matematicamente válido.

## 1. Identidades fictícias (SEMPRE)

- **E-mail:** `@example.com` (pessoas). Exceções DECLARADAS e allowlistadas no gate:
  `@talentai.com` (domínio corporativo do produto fictício — login demo, equipe interna,
  placeholders corporativos) e `exemplo.com`/`ejemplo.com` em placeholder de locale pt/es.
  Qualquer outro domínio (gmail, hotmail, email.com, empresa.com, etc.) é PROIBIDO.
- **CPF:** NUNCA um CPF válido por dígito verificador. Use inválidos óbvios (`123.456.789-00`)
  ou máscara (`000.000.000-00`). Mesmo princípio para qualquer documento (BI/NIF no pt-AO).
- **Telefone:** números claramente fictícios; **NUNCA copiar** currículo, nome+empresa, e-mail ou
  caso de pessoa real (nem de relatórios/auditorias para dentro do app).
- **Fotos:** serviço de avatares fake (randomuser) + fallback de iniciais — já decidido, manter.

## 2. Qualidade do conteúdo mock

- **Persona consistente entre telas:** a mesma pessoa mantém nome/e-mail/vaga/histórico em
  Pipeline, Entrevistas, Candidatos e no lado do candidato.
- **Fixtures determinísticas:** nada de aleatório em render/teste; datas que afetam
  screenshot/teste são controladas (a tela deriva o mês DOS DADOS, não do relógio).
- Diversidade plausível de nomes/perfis, **sem estereótipos** (competência não segue gênero/origem).
- Dado simulado ≠ dado persistido: o que só existe para a demo fica distinguível no código.

## 3. i18n — 4 línguas

- **pt-BR é a fonte editorial** (a tipagem deriva dela); `en` e `es` têm paridade TOTAL de chaves
  (o teste `parity.test.ts` acusa); **pt-AO herda pt-BR por override** — só sobrepõe o que muda de
  facto (moeda, telefone, BI/NIF, "província", "ecrã"), preservando a paridade.
- **NUNCA concatenar frases traduzidas** (ordem gramatical varia); interpolar com placeholders.
- Microcopy ACIONÁVEL: erro diz o que fazer ("Informe um e-mail válido"), não só "Inválido".
- Texto de UI NUNCA hardcoded em componente — sempre chave de namespace; prosa mockada (bios,
  análises da IA) deliberadamente NÃO é traduzida.
- Layout tolera expansão de texto (en→pt/es cresce ~30%); teste visual nas 4 línguas quando mexer
  em chrome de navegação.
