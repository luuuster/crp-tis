// Anel de foco padrão para elementos não-shadcn (links, botões-ícone "crus", cards focáveis).
// Centralizado aqui pra não duplicar entre as telas — usa o token --ring (cor da marca).
//
// Usa o utilitário `focus-ring` (definido UMA vez em index.css via @utility) — anel de OUTLINE que
// nunca colide com `ring` de repouso. Ver o comentário em index.css para o porquê do outline.
export const focusRing = 'rounded-sm focus-visible:focus-ring'

// Variante p/ focáveis sobre SUPERFÍCIE COLORIDA (bg-primary, ex.: sidebar): anel claro
// (--primary-foreground) que tem contraste sobre o azul — o --ring (azul) sumiria. Ver index.css.
export const focusRingOnPrimary = 'rounded-sm focus-visible:focus-ring-on-primary'
