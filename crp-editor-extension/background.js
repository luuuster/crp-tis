// Clique no ícone = liga/desliga o inspetor na aba ativa (activeTab + scripting, sem host fixo).
// Se já estiver injetado, manda fechar; senão injeta match.js → tokens.js → inspector.js.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    const [{ result: aberto }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => Boolean(window.__crpInspector),
    });
    if (aberto) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__crpClose && window.__crpClose(),
      });
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/match.js', 'tokens.js', 'content/inspector.js'],
      });
    }
  } catch (e) {
    // páginas chrome://, a Web Store e PDFs bloqueiam injeção — silencioso de propósito.
    console.warn('CRP Inspector não pôde injetar nesta página:', e.message);
  }
});
