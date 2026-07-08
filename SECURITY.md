# Política de segurança

- **Repositório privado / protótipo** — sem dados reais de usuários; todo conteúdo do app é mock determinístico.
- **Gate de CI:** `npm audit --audit-level=high` falha o build em vulnerabilidades **high/critical**.
  *Moderates* são avaliados caso a caso (ex.: devDependencies de release não expostas em runtime) e
  corrigidos quando há fix disponível sem breaking change.
- **Dependências:** Dependabot semanal (npm raiz + `app/`) e mensal (GitHub Actions), com grupos por
  família de peer-dependency — ver [.github/dependabot.yml](.github/dependabot.yml).
- **Relato:** abra uma issue privada ou contate o dono do repositório (@luuuster).
