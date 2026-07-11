# Auditoria técnica completa e profissional — CRP Design System / TIS

**Data da auditoria:** 11 de julho de 2026  
**Repositório local:** `C:\Users\frank\Videos\crp_ds`  
**Repositório remoto analisado:** `luuuster/crp-tis`  
**Branch local auditada:** `franklin`, commit `b71e423`  
**Branch principal remota:** `main`, commit observado `21df8e3`  
**Responsável pelo relatório:** Codex  
**Natureza:** auditoria estática, dinâmica, de qualidade, segurança, acessibilidade, entrega e governança

> Este documento é deliberadamente detalhado. Ele explica não apenas **o que** está errado, mas **por que importa**, **qual é a evidência**, **como corrigir** e **como confirmar que a correção ficou pronta**.

---

## 1. Conclusão executiva

O repositório possui uma base técnica significativamente melhor do que a de um protótipo comum: há um design system automatizado, validações próprias, 350 testes automatizados passando entre pacote raiz e aplicação, quatro temas, exportadores para Figma e Token Studio, testes de acessibilidade, Playwright, Changesets, Dependabot, licença e documentação considerável. Os testes unitários, lint, builds e auditorias de dependências passaram localmente. Não encontrei segredo óbvio versionado nem vulnerabilidade conhecida reportada pelo `npm audit`.

Contudo, **o projeto ainda não está pronto para produção com dados reais ou para operar como plataforma de recrutamento pública**. Os maiores riscos não são erros de TypeScript ou dependências vulneráveis; são problemas de arquitetura de entrega, governança e fronteiras de segurança:

1. O repositório é público, embora o arquivo de segurança afirme que ele é privado, e existem endereços Gmail aparentemente reais em dados de demonstração. Isso cria risco de privacidade e falsa premissa operacional.
2. O último pipeline da `main` está vermelho, os quatro últimos pipelines de `push` observados também falharam e o release não consegue abrir a PR de versão por falta de permissão na configuração do GitHub.
3. As rotas amigáveis das aplicações secundárias dependem de reescritas que existiam apenas no servidor de desenvolvimento. Uma build publicada sem configuração externa entrega o aplicativo errado em `/acesso`, `/painel`, `/componentes` e `/userflow`. Uma correção local surgiu durante esta auditoria para as rotas de documentação no `vite preview`, mas isso ainda não define o comportamento do servidor de produção e não resolve as rotas do candidato.
4. Autenticação, autorização, CAPTCHA e dados são inteiramente simulados no cliente. Qualquer pessoa pode contornar o “login” por `localStorage`; isso é válido para demonstração, mas é um bloqueador absoluto de produção.
5. A suíte E2E do último `main` teve **32 falhas e 94 sucessos**. Parte das falhas é dívida de testes após a mudança da página Componentes, mas há falhas reais de contraste e acessibilidade.
6. Após o login, as oito páginas principais são montadas simultaneamente por `forceMount`. Isso descarrega e mantém toda a aplicação no DOM, cria oito elementos `<main>` e reduz o benefício do code splitting.
7. A cobertura é razoável em linhas, mas baixa em decisões e funções: **67,98% de linhas, 61,16% de statements, 46,82% de funções e 46,34% de branches**. Fluxos do gerador de vagas e partes do pipeline estão praticamente sem cobertura.
8. O plugin de ícones do Figma aceita um JSON escolhido pelo usuário e injeta o SVG recebido com `innerHTML`, sem sanitização estrutural suficiente. É uma fronteira de confiança mal definida.

### Veredito

| Contexto de uso | Situação | Decisão recomendada |
|---|---:|---|
| Demonstração interna sem dados reais | Aceitável com ressalvas | Pode continuar, deixando explícito que tudo é mock |
| Portfólio público | Aceitável após higienização | Remover dados pessoais, corrigir documentação e deixar CI verde |
| Pacote de tokens/design system | Próximo de publicável | Definir estratégia de versão/release e reduzir ruído das verificações |
| Aplicação de recrutamento em produção | Não aprovada | Bloquear até existir backend, autenticação, autorização, privacidade e deploy correto |
| Tratamento de CPF, currículo e dados de candidatos reais | Não aprovado | Exige arquitetura de segurança e conformidade antes de qualquer coleta |

---

## 2. Escopo e método

### 2.1 O que foi examinado

- Estrutura completa do repositório, arquivos rastreados e principais artefatos.
- Pacote raiz de tokens e seus scripts de geração/validação.
- Aplicação React/Vite de recrutadores, candidato e hub de documentação.
- Plugins Figma, extensão Chrome e páginas de preview.
- Workflows GitHub Actions, Changesets, Dependabot e estado recente do GitHub.
- Dependências, vulnerabilidades conhecidas, segredos e superfícies de injeção.
- Testes unitários, E2E, acessibilidade, contraste e cobertura.
- Build de produção, divisão de chunks, rotas e comportamento no navegador.
- Documentação, coerência entre documentação e código, políticas e governança.

### 2.2 Dimensão observada

Foram inventariados aproximadamente **416 arquivos do projeto**, desconsiderando `node_modules`, builds e resultados temporários, somando cerca de **62.775 linhas de texto/configuração**. A composição principal inclui:

| Extensão | Quantidade aproximada |
|---|---:|
| `.tsx` | 151 |
| `.json` | 81 |
| `.ts` | 78 |
| `.md` | 33 |
| `.mjs` | 31 |
| `.svg` | 13 |
| `.html` | 12 |
| `.js` | 11 |
| `.css` | 3 |

Arquivos especialmente grandes merecem atenção de manutenção: `figma-plugin/code.js` (1.157 linhas), `EntrevistasIA.tsx` (815), `sidebar.tsx` (724), `export-figma.mjs` (585), `Pipeline.tsx` (553), `Usuarios.tsx` (531) e `VagasList.tsx` (530).

### 2.3 Técnicas executadas

- Leitura estática e busca dirigida por padrões de risco.
- `npm ci`, lint, builds e suítes unitárias.
- Pipeline completo do pacote de tokens: build, doctor, check, modo escuro estrito, exportações e verificações.
- `npm audit` no pacote raiz e na aplicação.
- `npm pack --dry-run` para inspecionar o conteúdo publicável.
- Playwright local e inspeção do último workflow remoto.
- Medição V8 de cobertura.
- Renderização das entradas em servidores Vite separados e em `vite preview`.
- Inspeção de DOM, landmarks, overflow, recursos transferidos e console.
- Axe adicional em superfícies não alcançadas pela suíte oficial.
- Consulta read-only do repositório GitHub e API pública para runs, PRs e visibilidade.

### 2.4 Limitações

- Não há backend no repositório; portanto, não foi possível auditar banco, APIs, autenticação real, infraestrutura ou controles de nuvem.
- Não foi localizada configuração definitiva de CDN/hosting. As conclusões de rota representam o que o artefato presente no repositório faz sem uma camada externa não documentada.
- A proteção de branch não pôde ser lida conclusivamente com a credencial disponível. A API pública não mostrou rulesets, e o histórico prova que builds vermelhos chegam à `main`; por isso a conclusão correta é que o gate está **ineficaz**, mesmo que alguma regra privada exista.
- A conexão integrada de navegador não ficou disponível neste ambiente. Foi usado Playwright local como alternativa.
- Não houve teste com leitor de tela humano, pessoas usuárias reais, pentest invasivo, análise jurídica ou teste do runtime real do Figma.
- O worktree mudou durante a auditoria. Correções locais em CI, preview e E2E são analisadas como **remediação em andamento**, não como parte do último `main` remoto.
- A tentativa de repetir a matriz E2E completa depois dessas mudanças locais foi bloqueada pelo Windows com `EPERM` sobre um binário nativo `lightningcss` mantido em uso. Portanto, os números 94/32 são do último `main` remoto e as 11 falhas isoladas são da execução local anterior às remediações; não se afirma que o conjunto local novo esteja verde.

---

## 3. Classificação de severidade

| Nível | Interpretação |
|---|---|
| **Crítico** | Pode expor dados, impedir produção/entrega ou invalidar uma premissa central do sistema. Corrigir antes de produção. |
| **Alto** | Falha relevante de segurança, qualidade, acessibilidade ou arquitetura com impacto provável. Prioridade imediata. |
| **Médio** | Dívida concreta que reduz confiança, manutenção ou experiência; deve entrar no próximo ciclo. |
| **Baixo** | Melhoria de governança, consistência ou acabamento sem risco imediato. |

Resumo dos grupos de achados deste relatório:

| Severidade | Quantidade | Temas principais |
|---|---:|---|
| Crítico | 4 | exposição/privacidade, produção simulada, roteamento, entrega vermelha |
| Alto | 8 | E2E, acessibilidade, CI, performance, SVG, LGPD, cobertura |
| Médio | 10 | observabilidade, documentação, titles, tokens, arquivos grandes, release |
| Baixo | 5 | governança comunitária, higiene e acabamento |

As quantidades agrupam problemas relacionados para evitar inflar artificialmente o total.

---

## 4. Resultados dos gates automatizados

### 4.1 Pacote raiz / design tokens

| Gate | Resultado | Observação |
|---|---:|---|
| Instalação limpa | Passou | `npm ci` concluído |
| Build de tokens | Passou | 494 variáveis primitivas, 4 temas, 303 tokens de contrato/tema |
| Doctor | Passou | Reconheceu mudanças locais existentes |
| Check | Passou | Sem falha fatal |
| Dark strict | Passou | Validação estrita de modo escuro |
| Exportação Figma | Passou | 464 primitivas, 13 brand, 115 modes, 116 base |
| Verificação Figma | Passou com ruído | 44 avisos de tokens de estado ausentes no CSS |
| Token Studio | Passou | 19 sets, 859 tokens, 4 temas |
| Exportação de componentes | Passou | 322 variantes; somente uma tela Login exportada |
| Extensão | Passou | 4 temas, 49 cores, 7 raios e 17 papéis |
| Testes raiz | Passou | **139/139** |
| `npm audit` | Passou | 0 vulnerabilidades conhecidas |
| `npm pack --dry-run` | Passou | 14 arquivos; 76,1 kB compactados; 357,7 kB extraídos |

### 4.2 Aplicação

| Gate | Resultado | Observação |
|---|---:|---|
| Instalação limpa | Passou | `npm ci` |
| ESLint | Passou | Sem erro reportado |
| Build Vite | Passou com aviso | Chunk compartilhado acima de 500 kB minificado |
| Testes unitários | Passou | **211/211 em 23 arquivos** |
| `npm audit` | Passou | 0 vulnerabilidades conhecidas |
| E2E do último `main` remoto | Falhou | **94 passaram; 32 falharam** |
| Cobertura | Medida, sem gate | 67,98% linhas; 46,34% branches |

Total de testes automatizados unitários aprovados nesta auditoria: **350**.

### 4.3 Cobertura detalhada

| Métrica | Coberto | Total | Percentual |
|---|---:|---:|---:|
| Linhas | 2.733 | 4.020 | **67,98%** |
| Statements | 3.018 | 4.934 | **61,16%** |
| Funções | 855 | 1.826 | **46,82%** |
| Branches | 1.457 | 3.144 | **46,34%** |

Leitura correta: a cobertura de linha pode parecer aceitável, mas menos da metade das decisões e funções foi exercitada. Um componente renderizado superficialmente pode marcar várias linhas como cobertas sem testar erros, limites, estados vazios ou interações.

Áreas de risco com cobertura muito baixa ou nula incluem componentes do `job-generator`, `ReviewStep`, campos do gerador, `EntrevistaFinalizada`, `roteiro.ts`, parte do dashboard e fluxos complexos de páginas administrativas.

---

## 5. Achados críticos

### CR-01 — Repositório público contradiz política “privada” e contém e-mails potencialmente pessoais

**Severidade:** Crítica  
**Confiança:** Alta  
**Evidência:** o GitHub informa visibilidade `public`; [`SECURITY.md`](SECURITY.md) declara “Repositório privado / protótipo”; [`EntrevistasIA.tsx`](app/src/pages/EntrevistasIA.tsx) contém `jairgoncol3456@gmail.com` e `jairgon3456@gmail.com`.

**Problema:** pessoas mantenedoras podem tomar decisões baseadas na falsa premissa de que o código está restrito. Endereços Gmail não usam o domínio reservado `example.com` e podem pertencer a uma pessoa real. Remover apenas do arquivo atual não remove o conteúdo do histórico Git.

**Impacto:** exposição de dado pessoal, spam, engenharia social, dano reputacional e possível obrigação de resposta a incidente. Se qualquer outro mock foi derivado de pessoas reais, o problema pode ser maior que os dois e-mails encontrados.

**Correção recomendada:**

1. Confirmar imediatamente se os e-mails pertencem a pessoas reais.
2. Substituir dados de demonstração por nomes fictícios e endereços `@example.com`.
3. Fazer varredura do histórico completo, releases, artifacts e forks.
4. Se forem dados reais, avaliar higienização do histórico com `git filter-repo`, comunicação aos titulares e rotação de qualquer identificador sensível relacionado.
5. Corrigir `SECURITY.md` para refletir a visibilidade verdadeira.
6. Adotar gerador central de fixtures sintéticas e uma verificação automática contra domínios pessoais nos mocks.

**Critério de aceite:** nenhum dado real ou plausivelmente real no HEAD, histórico avaliado, política coerente com a visibilidade e CI bloqueando reincidência.

### CR-02 — A aplicação não possui autenticação, autorização ou sessão de produção

**Severidade:** Crítica para produção; informativa para protótipo  
**Confiança:** Alta  
**Evidência:** [`LoginPage.tsx`](app/src/pages/LoginPage.tsx) compara credenciais fixas; [`App.tsx`](app/src/App.tsx) infere login pela view persistida; [`candidatoSessao.ts`](app/src/lib/candidatoSessao.ts) usa credenciais/localStorage; [`captcha.ts`](app/src/lib/captcha.ts) gera desafio apenas no cliente.

**Problema:** o cliente controla a própria identidade e autorização. Qualquer pessoa com DevTools pode editar `localStorage`, chamar páginas diretamente ou ler credenciais no bundle. O CAPTCHA local não oferece defesa contra automação e não existe servidor para validar senha, sessão ou permissão.

**Impacto:** se conectado a dados reais, acesso irrestrito a candidatos, CPF, currículos, entrevistas e operações administrativas.

**Correção recomendada:** manter o protótipo explicitamente isolado de dados reais. Para produção, implementar backend com autenticação adequada, hash forte de senha, MFA para perfis privilegiados, sessão segura em cookie `HttpOnly`, expiração/rotação, RBAC, checagem server-side por recurso, rate limiting, recuperação de conta segura e trilha de auditoria. CAPTCHA, se necessário, deve ser validado no servidor.

**Critério de aceite:** nenhum dado ou operação sensível depende de decisão de segurança tomada somente pelo navegador; testes provam negação de acesso horizontal e vertical.

### CR-03 — Rotas de produção podem entregar a aplicação errada

**Severidade:** Crítica  
**Confiança:** Alta para o artefato do repositório  
**Evidência:** a build gera `index.html`, `candidato.html` e `mapa.html`; as reescritas originais de [`vite.candidato.config.ts`](app/vite.candidato.config.ts) e [`vite.mapa.config.ts`](app/vite.mapa.config.ts) usam `configureServer`, válido em desenvolvimento. Em `vite preview`, `/acesso`, `/painel`, `/componentes` e `/userflow` retornaram inicialmente o HTML do recrutador.

**Estado em andamento:** durante a auditoria apareceu uma mudança local em [`app/vite.config.ts`](app/vite.config.ts) adicionando `configurePreviewServer` para as rotas de documentação. Isso melhora o E2E local, mas `vite preview` não é uma configuração de produção e as rotas do candidato continuam exigindo regra equivalente.

**Impacto:** links públicos, refresh e deep links exibem o produto errado. Um candidato pode abrir `/acesso` e receber a tela de recrutador. Testes executados somente na raiz não detectam isso.

**Correção recomendada:** escolher e documentar uma arquitetura:

- Opção A: três deployments/origens independentes, cada um com seu `index.html`.
- Opção B: um único host com regras explícitas de rewrite: rotas de candidato → `candidato.html`; docs → `mapa.html`; recrutador → `index.html`.
- Opção C: migrar para um roteador real e uma única entrada, se os produtos compartilharem ciclo de vida.

Adicionar testes de produção que empacotem a aplicação e validem status, `<title>`, root esperado, assets e refresh de cada rota.

**Critério de aceite:** cada deep link entrega a entrada correta em ambiente publicado, inclusive após refresh, e essa propriedade é bloqueada por CI.

### CR-04 — A branch principal opera com pipeline vermelho e release quebrado

**Severidade:** Crítica de entrega  
**Confiança:** Alta  
**Evidência:** workflow mais recente da `main`: [GitHub Actions run 29153553448](https://github.com/luuuster/crp-tis/actions/runs/29153553448), com E2E falhando e release sem poder abrir PR. Os quatro últimos runs de `push` observados falharam.

O erro de Changesets é explícito: GitHub Actions não tem permissão de repositório para criar/aprovar pull requests. Mesmo declarando `pull-requests: write` no YAML, a configuração organizacional/do repositório ainda pode bloquear a ação.

**Estado em andamento:** há uma correção local não commitada que separa `release`, reduz permissões globais para leitura e o condiciona aos jobs `build`, `app` e `e2e`. É uma melhoria importante, mas ainda precisa:

- ser revisada e commitada;
- ter a permissão “Allow GitHub Actions to create and approve pull requests” habilitada, ou usar outro fluxo de release;
- passar com E2E verde;
- fixar Actions por SHA;
- demonstrar um release completo em ambiente controlado.

**Impacto:** o badge verde deixa de representar a realidade, mudanças quebradas chegam à principal, Dependabot fica congestionado e releases acumulam em uma branch órfã `changeset-release/main`.

**Critério de aceite:** `main` protegida por checks obrigatórios, release só após todos os gates verdes, PR de Changesets criada/publicada com sucesso e política de bypass restrita/auditada.

---

## 6. Achados de severidade alta

### AL-01 — Suíte E2E possui falhas reais e dívida de migração

No último `main`, 32 cenários falharam e 94 passaram. Vinte e uma falhas repetiam a expectativa antiga de encontrar “Componentes” no menu do recrutador, embora essa página tenha sido movida ao hub de documentação. Alterações locais já redirecionam esses testes para `/componentes`; elas ainda precisam ser validadas e integradas.

As 11 falhas restantes observadas na execução anterior foram:

- contraste dos dias externos ao mês em Entrevistas nos quatro pares marca/tema;
- contraste do selo “Em breve” do Charlie nos dois temas escuros;
- quatro expectativas obsoletas do botão “Agendar”;
- seletor i18n ambíguo entre “Português (Brasil)” e “Português (Angola)”.

Há dois tipos de problema e eles devem ser tratados separadamente:

1. **Teste obsoleto:** atualizar a intenção funcional, sem “forçar” a UI a voltar a um comportamento removido.
2. **Defeito real:** corrigir tokens/classes de contraste e provar a razão WCAG.

Critério: zero falhas e nenhum `skip` usado para esconder dívida.

### AL-02 — Violações de contraste WCAG

Em [`CalendarioMensal.tsx`](app/src/components/composicoes/CalendarioMensal.tsx), dias fora do mês usam `text-muted-foreground/60`. Razões observadas: **2,91:1** em claro e **3,30:1** em escuro, abaixo do requisito de 4,5:1 para texto normal.

Em [`StepBriefing.tsx`](app/src/pages/job-generator/StepBriefing.tsx), o selo “Em breve” ficou em **4,12:1** no escuro.

Corrigir no nível de token/variante, não com hex isolado por página. Validar todas as quatro combinações de marca e modo e manter teste automatizado com tolerância explícita.

### AL-03 — Aplicações secundárias não entram na matriz oficial de acessibilidade

O Playwright oficial usa a entrada principal e não cobre adequadamente candidato e docs como produtos independentes. Varreduras adicionais encontraram:

- candidato público: região rolável séria sem foco em [`InscricaoVaga.tsx`](app/src/pages/InscricaoVaga.tsx);
- documentação: diagramas/linhas horizontais roláveis não acessíveis ao teclado em [`MapaArquitetura.tsx`](app/src/pages/MapaArquitetura.tsx) e [`UserFlow.tsx`](app/src/pages/UserFlow.tsx);
- acesso do candidato: logo fora de landmark;
- Componentes: landmark duplicado por duas regiões de notificações, uma global e outra de demonstração.

Criar projetos Playwright por entrada, com web servers definidos, e rodar axe, contraste, foco visível, teclado e mobile em cada produto.

### AL-04 — Todas as páginas autenticadas são montadas ao mesmo tempo

[`App.tsx`](app/src/App.tsx) usa `forceMount` nos oito `TabsContent`. Depois do login foram observados oito `<main>`, oito tabpanels e chunks de todas as funcionalidades carregados. O code splitting só adia o custo total até o login; não o divide por navegação.

**Impactos:** bundle e hidratação maiores, efeitos de páginas ocultas, consumo de memória, múltiplos landmarks principais e maior probabilidade de estado/telemetria invisível executar.

**Correção:** roteador real ou renderização exclusiva da view ativa; estado que precisa sobreviver deve morar em store/contexto apropriado, não em páginas ocultas. Manter um único `<main>` visível/montado.

### AL-05 — Bundle compartilhado e custo pós-login excessivos

O build emitiu aviso de chunk acima de 500 kB. Principais artefatos minificados:

| Artefato | Minificado | Gzip aproximado |
|---|---:|---:|
| shared `ThemeToggles...js` | 527,69 kB | 168,08 kB |
| CSS compartilhado | 241,49 kB | 32,89 kB |
| chart | 342,42 kB | 102,55 kB |
| roteiro | 367,81 kB | 105,01 kB |
| mapa | 495,23 kB | 145,33 kB |

Na medição do navegador, o login transferiu aproximadamente 274 kB; após autenticar, o total chegou a aproximadamente 551 kB e 97 recursos. Definir budgets no CI, separar dependências por rota, importar gráficos somente onde usados e avaliar o custo dos catálogos de ícones/componentes.

### AL-06 — Upload de SVG no plugin Figma cruza fronteira de confiança sem sanitização suficiente

[`figma-plugin-icons/ui.html`](figma-plugin-icons/ui.html) aceita JSON escolhido pelo usuário, valida essencialmente a existência do array `icons` e renderiza `it.svg` via `innerHTML`. O mesmo SVG é enviado a [`figma-plugin-icons/code.js`](figma-plugin-icons/code.js) e processado por `figma.createNodeFromSvg`.

Verificar somente início/fim de `<svg>`, filho e `currentColor` não elimina `script`, `foreignObject`, atributos `on*`, URLs externas ou construções inesperadas. O comentário de “trusted” não torna um arquivo selecionado pelo usuário confiável.

**Correção:** schema estrito, parser seguro e whitelist de elementos/atributos; rejeitar scripts, eventos, `foreignObject`, referências externas e protocolos não permitidos. Melhor ainda: separar bundles internos assinados de importação arbitrária. Criar testes maliciosos inofensivos de regressão.

### AL-07 — Dados de recrutamento exigem desenho LGPD inexistente no protótipo

O produto modela CPF, telefone, currículo, entrevistas e histórico de candidatura. Antes de dados reais, é necessário documentar finalidade/base legal, minimização, transparência, consentimento quando aplicável, retenção e descarte, direitos do titular, operadores/suboperadores, controles de acesso, auditoria, criptografia, backup e resposta a incidente.

Uploads de currículo precisam de limite, verificação de tipo real, armazenamento privado, antivírus/sandbox, nomes aleatórios, URL temporária e política de expiração. Nada disso pode ser delegado apenas ao front-end.

### AL-08 — Não existe gate de cobertura nem foco suficiente em caminhos de risco

Não havia provedor/comando de cobertura configurado como gate. A medição revelou branches/funções abaixo de 47%, com módulos inteiros em 0%. Não se recomenda perseguir 100% indiscriminadamente; recomenda-se:

- baseline inicial sem reduzir os valores atuais;
- meta progressiva para 70% branches e 75–80% linhas;
- limiares mais altos para lógica pura, auth/autorização e transformações de dados;
- testes de integração para gerador, pipeline, erro/timeout, estados vazios e permissões;
- mutation testing seletivo em regras críticas.

---

## 7. Segurança e cadeia de suprimentos

### 7.1 Aspectos positivos

- `npm audit` reportou zero vulnerabilidades conhecidas nas duas árvores.
- Não foi encontrado `.env`, token, chave privada ou segredo óbvio rastreado.
- Extensão Chrome pede apenas `activeTab` e `scripting`, permissões relativamente contidas.
- Manifests Figma declaram ausência de acesso de rede.
- Dependabot está configurado e abriu PRs de atualização.

### 7.2 Permissões excessivas do workflow original

O workflow no último commit concedia globalmente `contents: write`, `packages: write` e `pull-requests: write`, inclusive a jobs de validação de PR. Instalações e scripts de dependência executam código; conceder escrita global aumenta o raio de impacto de comprometimento de supply chain.

A mudança local que estabelece `contents: read` global e escrita apenas no release segue o princípio correto. Completar com:

- `persist-credentials: false` nos checkouts de validação;
- ambiente protegido para publicação;
- aprovação/reviewer para release, se compatível com o fluxo;
- token de escopo mínimo;
- provenance/attestations do pacote.

### 7.3 Actions usam tags mutáveis

Foram observados `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-artifact@v7` e `changesets/action@v1`. Tags são convenientes, mas podem se mover. Em projeto público/publicável, fixar SHA completo e usar Dependabot para atualizá-lo reduz risco de substituição upstream.

### 7.4 Fonts externas e ausência de política de segurança de conteúdo

As páginas carregam Google Fonts externamente. Não há CSP nem configuração de headers de produção no repositório. Para produto de recrutamento, prefira fontes self-hosted e defina, no hosting, pelo menos:

- `Content-Security-Policy` restritiva;
- `frame-ancestors`/proteção contra clickjacking;
- `Referrer-Policy`;
- `X-Content-Type-Options: nosniff`;
- HSTS em HTTPS;
- `Permissions-Policy` mínima.

### 7.5 Reporting de vulnerabilidade incompleto

`SECURITY.md` sugere issue privada ou contato com `@luuuster`, mas não oferece canal inequívoco. Em repositório público, habilitar Private Vulnerability Reporting/Security Advisories e explicar SLA, versões suportadas e canal evita que uma vulnerabilidade seja publicada como issue comum.

### 7.6 `dangerouslySetInnerHTML`

O componente de gráfico também usa `dangerouslySetInnerHTML`, atualmente alimentado por configuração interna. Não é vulnerabilidade confirmada no uso atual, mas a confiança precisa ficar explícita. Se configuração passar a vir de API/usuário, validar tokens e não interpolar texto arbitrário em CSS.

---

## 8. CI/CD, release e GitHub

### 8.1 Estado do GitHub

- Repositório público, branch padrão `main`.
- Nenhuma tag observada.
- Nove PRs Dependabot abertas, incluindo updates de Actions, i18next, React Hook Form, ESLint, tipos Node e ícones.
- Nenhuma issue comum aberta no momento da consulta; o contador público inclui PRs.
- Branch `changeset-release/main` existente.
- Três changesets pendentes no repositório.

### 8.2 Estratégia de release ambígua

O pacote está `private: true` e versão `0.0.0`, mas há Changesets e job de publicação em GitHub Packages. Isso pode ser intencional, porém deve existir decisão registrada:

- pacote interno privado versionado no GitHub Packages;
- pacote público em registry;
- ou artefato apenas local, sem release automatizado.

Sem essa decisão, a automação falha de forma recorrente e as changesets acumulam.

### 8.3 Proteção da `main`

Não foi possível ler a regra privada de branch protection. A API pública não retornou rulesets, e pushes com CI vermelho aparecem na principal. Portanto, independentemente da configuração nominal, o controle não está alcançando o resultado esperado.

Configuração mínima recomendada:

- PR obrigatória;
- `build`, `app` e `e2e` obrigatórios e atualizados;
- branch atualizada antes de merge;
- conversa resolvida;
- bloqueio de force push/deleção;
- revisão de CODEOWNERS em arquivos sensíveis;
- bypass restrito, justificado e auditável.

### 8.4 Dependabot congestionado

Nove PRs abertas, várias com checks falhos, tornam cada atualização mais difícil. Primeiro estabilizar CI, depois agrupar upgrades compatíveis por ecossistema e manter atualizações de Actions separadas de runtime. Evitar merge automático enquanto os gates não forem confiáveis.

---

## 9. Arquitetura e manutenção

### 9.1 Três produtos dentro de uma aplicação Vite

O repositório entrega recrutador, candidato e documentação por três HTMLs e configurações de desenvolvimento distintas. Isso reduz duplicação, mas torna build, rota, E2E e deploy mais frágeis. Formalizar limites:

- `apps/recruiter`;
- `apps/candidate`;
- `apps/docs`;
- `packages/design-tokens`;
- `packages/ui`, se componentes realmente forem compartilháveis.

Uma migração para workspace não é urgente por estética; ela se justifica se eliminar rewrites implícitos e permitir pipelines/budgets independentes.

### 9.2 Arquivos grandes e muitas responsabilidades

Páginas acima de 500–800 linhas são sinais de alto acoplamento. Separar por responsabilidade, não por quantidade arbitrária:

- container/orquestração;
- hooks de estado e ações;
- validação/schema;
- componentes de seção;
- dados mock;
- lógica pura testável.

Não quebrar em dezenas de arquivos sem coesão. O objetivo é tornar mudanças locais previsíveis e testes focados.

### 9.3 Tratamento de erro e telemetria insuficientes

[`telemetry.ts`](app/src/lib/telemetry.ts) basicamente usa `console.error`; integração real está comentada. Não há correlação, métricas de falha, Web Vitals, tracing ou monitoramento de release.

Antes de produção: Error Boundaries por rota, identificador de erro amigável, coleta sem PII, sourcemaps privados, alertas, taxa de erro por versão e métricas de disponibilidade/latência.

### 9.4 Títulos de documento genéricos

As rotas `/acesso` e `/painel` compartilharam “Inscrição na vaga · TIS”; `/componentes` e `/userflow`, “Arquitetura · TIS”. Isso prejudica histórico, abas, leitores de tela e compartilhamento. Atualizar `document.title` e metadados por rota.

### 9.5 Verificação Figma contraditória

O verificador emitiu 44 avisos sobre variáveis de estado ausentes no CSS (`primary-90`, `secondary-80`, `destructive`, `input`, `ring` e outras) e depois declarou consistência de 100%.

Se forem tokens intencionalmente exclusivos do Figma, criar allowlist documentada e contá-los separadamente. Se deveriam existir no CSS, falhar o gate. Um verificador que sempre termina “verde” apesar de dezenas de diferenças perde valor operacional.

### 9.6 Conversão P3 para Figma

112 de 290 cores P3 foram limitadas/clamped na exportação. Pode ser limitação esperada, mas deve haver relatório de diferença perceptual e aprovação visual. Para cores de marca, usar ΔE/contraste como gate evita que um export “válido” mude a identidade visual silenciosamente.

---

## 10. Testes: interpretação profissional

### 10.1 O que está bom

- 139 testes do ecossistema de tokens/plugins passam.
- 211 testes da aplicação passam.
- Há testes de lógica pura com excelente cobertura em módulos como `candidatos.logic.ts`, `entrevistas.logic.ts` e builders.
- O projeto já possui ferramentas de axe, contraste e foco, algo acima da média.

### 10.2 O que falta

- Gate de cobertura.
- Matriz completa de entradas/rotas.
- Testes de produção/deep link.
- Estados vazios, falhas, timeout e recuperação em fluxos complexos.
- Contratos entre tokens exportados e consumidores.
- Testes de segurança do importador SVG.
- Orçamentos de bundle.
- Testes de autorização, que só serão possíveis com backend.

### 10.3 Estratégia recomendada

1. Corrigir e estabilizar o E2E atual.
2. Dividir Playwright em projetos `recruiter`, `candidate` e `docs`.
3. Marcar cenários críticos mínimos como smoke e rodá-los em toda PR.
4. Rodar matriz completa em merge/nightly se o tempo for alto.
5. Persistir traces apenas na primeira repetição e artifacts em falha.
6. Definir limiar de cobertura sem reduzir o baseline.
7. Medir flakiness; não mascarar com retries indiscriminados.

---

## 11. Documentação e coerência

### 11.1 Documentação desatualizada após mover Componentes

[`docs/ARQUITETURA-INFORMACAO.md`](docs/ARQUITETURA-INFORMACAO.md) e [`app/HANDOFF.md`](app/HANDOFF.md) ainda descrevem Componentes no aplicativo do recrutador. O código afirma que a página mudou para o hub de docs. Essa divergência causou diretamente parte das 32 falhas E2E.

Atualizar mapa de rotas, comandos/portas, screenshots, instruções de QA e HANDOFF na mesma PR da mudança arquitetural.

### 11.2 Contagens frágeis

O HANDOFF menciona 21 arquivos de teste, mas agora são 23. Contagens manuais envelhecem. Quando não forem essenciais, evitar números; quando forem, gerar automaticamente no CI/documentação.

### 11.3 Documentação operacional ausente

Faltam runbooks claros para:

- deploy e rollback de cada entrada;
- release do pacote;
- resposta a incidente;
- rotação de credencial;
- restauração/backup futuro;
- tratamento de falha do pipeline;
- classificação e remoção de dados pessoais.

---

## 12. Aspectos positivos que devem ser preservados

Uma auditoria profissional também registra controles eficazes:

- Automação de design tokens ampla e reproduzível.
- Quatro combinações de marca/tema exercitadas.
- Testes unitários numerosos e rápidos o suficiente para PR.
- Uso de TypeScript, lint e builds consistentes.
- Biblioteca de componentes com manifesto de acessibilidade.
- Licença, CODEOWNERS e template de PR presentes.
- Dependabot e Changesets já introduzidos.
- Permissões mínimas na extensão Chrome.
- Ausência de dependências vulneráveis conhecidas no momento da auditoria.
- Separação de lógica pura em partes do domínio, resultando em cobertura excelente nesses arquivos.

Esses ativos tornam a correção factível; não é necessário reescrever tudo.

---

## 13. Plano de remediação priorizado

### Fase 0 — Imediato, 0 a 48 horas

1. Confirmar e remover os dois Gmail; avaliar histórico Git.
2. Corrigir `SECURITY.md` para dizer que o repositório é público.
3. Não usar dados reais no protótipo.
4. Revisar as alterações locais de CI/E2E/preview, preservando autoria e escopo.
5. Corrigir os contrastes reais e os seletores/testes obsoletos.
6. Decidir se o release deve abrir PR e habilitar a permissão correspondente, ou desativá-lo até a decisão.
7. Exigir CI verde para merge na `main`.

### Fase 1 — Primeira semana

1. Documentar arquitetura de deploy e implementar rewrites de produção.
2. Criar smoke tests para todas as rotas amigáveis e três entradas.
3. Colocar candidato/docs na matriz axe/contraste/foco.
4. Corrigir regiões roláveis e landmarks.
5. Remover `forceMount` e montar apenas a página ativa.
6. Adicionar coverage V8 e baseline no CI.
7. Fixar Actions por SHA e completar mínimo privilégio.
8. Atualizar HANDOFF e arquitetura de informação.

### Fase 2 — Duas a quatro semanas

1. Refatorar páginas maiores por domínio/responsabilidade.
2. Implementar budgets de JS/CSS e otimização por rota.
3. Sanitizar importador SVG e criar corpus adversarial.
4. Definir estratégia de pacote/versionamento/release.
5. Resolver PRs Dependabot após estabilizar gates.
6. Configurar canal privado de vulnerabilidade.
7. Implementar observabilidade básica e Error Boundaries por produto.

### Fase 3 — Antes de qualquer produção com dados reais

1. Backend e banco desenhados com threat model.
2. Autenticação, MFA administrativo, RBAC e autorização por recurso.
3. Sessões seguras, rate limiting e auditoria.
4. Programa LGPD: inventário, base legal, retenção, direitos e contratos.
5. Pipeline seguro de currículo/upload.
6. Criptografia, secrets manager, backup e teste de restauração.
7. Pentest independente e correção dos achados.
8. SLOs, alertas, resposta a incidente e rollback ensaiado.
9. Revisão de acessibilidade humana WCAG 2.2 AA.

---

## 14. Checklist objetivo de prontidão para produção

O produto somente deve ser considerado pronto quando todos os itens aplicáveis estiverem verdadeiros:

- [ ] Nenhum dado real está em fixtures, código, histórico ou artifact público.
- [ ] Política de segurança corresponde à visibilidade do repositório.
- [ ] Todos os checks obrigatórios estão verdes na `main`.
- [ ] Branch protection impede merge quebrado.
- [ ] Deep links entregam a aplicação correta em produção.
- [ ] Recrutador, candidato e docs possuem E2E próprios.
- [ ] Contraste e navegação por teclado passam em todos os temas.
- [ ] Existe um único landmark principal por página.
- [ ] Autenticação e autorização são verificadas no servidor.
- [ ] CAPTCHA/antiabuso não depende do cliente.
- [ ] CPF, currículo e demais PII têm ciclo de vida documentado.
- [ ] Upload possui validação, isolamento e antimalware.
- [ ] Headers de segurança e CSP foram verificados no ambiente publicado.
- [ ] Segredos estão em cofre e possuem rotação.
- [ ] Cobertura tem baseline/gate e fluxos críticos estão exercitados.
- [ ] Bundle respeita budgets definidos.
- [ ] Logs não coletam PII e há monitoramento/alertas.
- [ ] Backup e restauração foram testados.
- [ ] Release e rollback foram ensaiados.
- [ ] Canal privado de reporte de vulnerabilidade funciona.
- [ ] Revisão LGPD, segurança e acessibilidade foi aprovada.

---

## 15. Recomendações por papel

### Para desenvolvimento

Priorizar correções estruturais: rotas, montagem de páginas, testes reais, sanitização SVG e separação da lógica. Não resolver acessibilidade apenas silenciando testes.

### Para design/design system

Revisar contraste em todos os temas, definir política para tokens exclusivos do Figma e validar visualmente conversões P3. Cada token de estado precisa ter fonte de verdade e consumidor documentados.

### Para DevOps/repositório

Restaurar confiabilidade da `main`, mínimo privilégio, Actions por SHA, branch protection, release funcional e configuração de hosting versionada.

### Para produto/jurídico

Decidir se o sistema é demonstração ou produto operacional. Se houver candidatos reais, tratar privacidade, retenção e direitos do titular como requisito de arquitetura, não texto posterior.

### Para segurança

Conduzir threat model quando backend/deploy existirem, revisar importação SVG, cadeia de suprimentos, autorização por recurso, upload e resposta a incidente.

---

## 16. Estado do worktree durante a auditoria

Já existiam alterações locais do usuário em:

- `build/export-components.mjs`;
- `figma-plugin-components/README.md`;
- `figma-plugin-components/pure.test.mjs`.

Durante a execução apareceram também mudanças não commitadas em:

- `.github/workflows/build-tokens.yml`;
- arquivos E2E relacionados a Componentes;
- `app/vite.config.ts`.

Nenhuma dessas alterações foi revertida ou sobrescrita por esta auditoria. O presente relatório é o único arquivo de produto criado intencionalmente pelo auditor. Resultados que se referem ao “último `main`” usam evidência remota; resultados locais posteriores são identificados como remediação em andamento.

---

## 17. Evidências reproduzíveis principais

Comandos equivalentes aos utilizados:

```powershell
# Pacote raiz
npm ci
npm run build
npm run doctor
npm run check
npm run check:dark:strict
npm run export:figma
npm run verify:figma
npm run export:token-studio
npm run export:components
npm run export:extension
npm test
npm audit
npm pack --dry-run

# Aplicação
Set-Location app
npm ci
npm run lint
npm test
npm run build
npx vitest run --coverage
npm run test:e2e
```

Versões locais observadas: Node.js 24.14.1, npm 11.11.0 e Git 2.52.0. O CI usa Node 22.

---

## 18. Conclusão final

O projeto tem **boa engenharia de design system e uma base de testes respeitável**, mas a confiança está fragmentada: o que é bem validado localmente não coincide com o que é publicado, as três aplicações não compartilham a mesma cobertura de qualidade, e o repositório/documentação assumem condições de privacidade e entrega que não existem na prática.

A prioridade não deve ser uma reescrita. A sequência correta é:

1. eliminar exposição e premissas falsas;
2. tornar a `main` confiável e verde;
3. fazer o artefato publicado rotear corretamente;
4. cobrir todas as entradas com acessibilidade/E2E;
5. reduzir montagem/bundle;
6. somente então construir a camada de produção segura para dados reais.

Se essa ordem for seguida, o repositório pode evoluir de um protótipo visual robusto para um produto operável sem desperdiçar seus ativos atuais. Até lá, deve continuar claramente rotulado e tecnicamente isolado como demonstração sem dados reais.

---

**Fim do relatório.**
