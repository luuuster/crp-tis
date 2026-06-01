# Changesets

Este diretório controla o versionamento (semver) do `@crp/design-tokens`.

**Regra de versão (importante):**
- **major** → renomear ou remover um token do contrato (quebra os front-ends).
- **minor** → adicionar um token novo.
- **patch** → mudar o valor de um token existente.

Ao alterar tokens, crie um changeset:

```bash
npx changeset
```

Escolha o bump conforme a regra acima e descreva a mudança. O CI gera o changelog e publica.
Docs: https://github.com/changesets/changesets
