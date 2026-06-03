/**
 * CRP Design System — guard de ativação para controles aria-disabled.
 *
 * Framework-agnóstico, auto-instalável e idempotente. Um único listener delegado em
 * fase de CAPTURA bloqueia a ativação (clique do mouse E teclado — Enter/Espaço disparam
 * 'click') de qualquer elemento marcado com [aria-disabled="true"].
 *
 * Por quê: o DS usa aria-disabled (NÃO o atributo nativo `disabled`) para disabled/loading,
 * de modo que o botão continue FOCÁVEL e descobrível pelo leitor de tela (anuncia
 * "desabilitado"/"ocupado"). Como aria-disabled é só semântica, o navegador ainda dispara o
 * clique — este guard é o que torna o controle realmente INERTE, em qualquer app.
 *
 * Uso:
 *   import "@crp/design-tokens/components/button.js";   // ESM, auto-instala
 *   <script src=".../components/button.js"></script>     // browser/global, auto-instala
 *
 * Idempotente: marca-se em window e não registra o listener duas vezes.
 * SSR-safe: não faz nada se não houver document.
 */

(function () {
  if (typeof document === 'undefined') return; // SSR / ambiente sem DOM

  var FLAG = '__crpAriaDisabledGuard__';
  var target = typeof window !== 'undefined' ? window : globalThis;
  if (target[FLAG]) return; // já instalado nesta página
  target[FLAG] = true;

  function isAriaDisabled(node) {
    // sobe a árvore até achar um ancestral aria-disabled="true" (cobre clique no ícone/span interno)
    if (!node || typeof node.closest !== 'function') return null;
    return node.closest('[aria-disabled="true"]');
  }

  function guard(e) {
    var hit = isAriaDisabled(e.target);
    if (hit) {
      e.preventDefault();        // cancela a ação default
      e.stopImmediatePropagation(); // impede QUALQUER handler do app (mesmo já registrados)
    }
  }

  // Fase de captura (true): roda ANTES dos handlers do app, garantindo o bloqueio.
  // 'click' cobre mouse e a ativação por teclado (Enter/Espaço em <button>/[role=button]).
  document.addEventListener('click', guard, true);
})();
