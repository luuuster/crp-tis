# Política de segurança

- **Repositório PÚBLICO / protótipo (mockup)** — sem dados reais de usuários; todo conteúdo do app é
  mock determinístico com identidades fictícias (e-mails `@example.com`). Não suba dado pessoal real
  em fixtures, código, histórico ou artifacts.
- **Gate de CI:** `npm audit --audit-level=high` falha o build em vulnerabilidades **high/critical**.
  *Moderates* são avaliados caso a caso (ex.: devDependencies de release não expostas em runtime) e
  corrigidos quando há fix disponível sem breaking change.
- **Dependências:** Dependabot semanal (npm raiz + `app/`) e mensal (GitHub Actions), com grupos por
  família de peer-dependency — ver [.github/dependabot.yml](.github/dependabot.yml).
- **Relato de vulnerabilidade:** use o reporte privado do GitHub — aba **Security → "Report a
  vulnerability"** (Private Vulnerability Reporting) — ou contate o dono do repositório (@luuuster).
  **Não** abra issue pública para vulnerabilidade.
