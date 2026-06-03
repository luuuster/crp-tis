# Usabilidade e Heurísticas — Referência crp

> As 10 heurísticas de Nielsen aplicadas ao crp / TalentAI.

**Link canônico:** [Nielsen Norman — 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

---

## As 10 heurísticas de Nielsen no crp

| # | Heurística | Intent | No crp / TalentAI |
|---|-----------|--------|-------------------|
| 1 | **Visibilidade do status do sistema** | O sistema sempre informa o que está acontecendo, em tempo razoável. | `aria-busy` no Button durante loading; toasts com `role="status"`; skeleton/spinner em carregamentos; barra de progresso em fluxos multi-step. |
| 2 | **Correspondência entre sistema e mundo real** | Usa linguagem do usuário, não jargão técnico. Informação em ordem natural e lógica. | Labels em pt-BR; termos de RH ("vaga", "candidato", "etapa") em vez de termos técnicos; ícones Lucide reconhecíveis para ações comuns. |
| 3 | **Controle e liberdade do usuário** | Saídas claras para ações acidentais — desfazer, cancelar, voltar. | Botão "Cancelar" sempre visível em modais/dialogs; confirmação antes de ações destrutivas (excluir vaga); `Esc` fecha modais (Radix). |
| 4 | **Consistência e padrões** | Mesmas palavras, situações e ações significam a mesma coisa. | Tokens semânticos (`crp-bg-primary`) garantem consistência visual; vocabulário de botões padronizado (`Salvar`, `Cancelar`, `Excluir`); mesma hierarquia de heading por tela. |
| 5 | **Prevenção de erros** | Melhor que boas mensagens de erro é evitar que o erro aconteça. | Validação inline no `Field` antes do submit; regras de senha visíveis durante digitação (`PasswordInput`); desabilitar submit enquanto form é inválido; mascaras em campos formatados. |
| 6 | **Reconhecimento em vez de memorização** | Objetos, ações e opções visíveis. O usuário não precisa lembrar informação entre telas. | Labels sempre visíveis (nunca só placeholder); breadcrumbs em fluxos; filtros inline em tabelas (valor do filtro visível). |
| 7 | **Flexibilidade e eficiência de uso** | Atalhos para usuários experientes sem atrapalhar novatos. | Atalhos de teclado em ações frequentes (kanban); busca rápida; bulk actions em tabelas de candidatos. |
| 8 | **Design estético e minimalista** | Sem informação irrelevante ou raramente necessária competindo com o essencial. | Tokens de spacing e tipografia do crp; hierarchy visual (heading > body > caption); progressive disclosure em formulários longos. |
| 9 | **Ajudar usuários a reconhecer, diagnosticar e recuperar de erros** | Mensagens de erro em linguagem simples, indicando o problema e sugerindo solução. | `FieldError` com texto + ícone (nunca só cor); mensagem acionável ("Informe um e-mail válido", não "Inválido"); `role="alert"` em erros. |
| 10 | **Ajuda e documentação** | Se necessário, documentação fácil de buscar, focada na tarefa, com passos concretos. | Tooltips em ações com ícone-only; empty states com orientação ("Nenhum candidato. Crie sua primeira vaga."); onboarding contextual. |

---

## Princípios complementares

### Lei de Jakob
> Usuários passam a maior parte do tempo em **outros** produtos digitais. Expectativas vêm de lá.

No crp: manter padrões conhecidos de SaaS B2B — sidebar, tabelas filtráveis, modais para CRUD, botão primário à direita.

### Lei de Fitts
> Tempo para alcançar um alvo depende de distância e tamanho.

No crp: touch target minimo 44px (decisão cravada em `DECISOES-DE-DESIGN.md`); ações primárias maiores e mais próximas do foco do usuário.

### Carga cognitiva
> Minimizar informação que o usuário precisa processar ao mesmo tempo.

No crp: progressive disclosure; agrupamento visual com spacing tokens; tipografia hierárquica (title > text > caption > label).

---

## Quando usar este documento

- Revisão de fluxo de tela (login, cadastro, kanban)
- Avaliação de feedback ao usuário (erros, loading, estados vazios)
- Decisão sobre vocabulário de botões/labels
- Qualquer dúvida sobre "isso está intuitivo?"
