// Captcha MOCK compartilhado entre a inscrição pública e a 2ª etapa do processo. Código sem caracteres
// ambíguos (I/O/0/1); o valor é TEXTO real (legível por leitor de tela via aria-label) — acessível, mas
// NÃO é proteção real. No produto, entraria um captcha de verdade (com alternativa acessível).
// Math.random só roda no runtime do app.
export const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const genCaptcha = () => Array.from({ length: 6 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('')
// Inclinação fixa por posição (look de captcha sem aleatoriedade — estável entre renders).
export const CAPTCHA_TILT = ['-rotate-6', 'rotate-3', '-rotate-3', 'rotate-6', '-rotate-2', 'rotate-2']
