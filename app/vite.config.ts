import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// O app consome o pacote @crp/design-tokens (linkado via file:..). O dist fica na RAIZ do
// repo (fora da raiz do app), então liberamos o fs do dev-server p/ o diretório pai.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  server: {
    fs: { allow: [resolve(import.meta.dirname, '..')] },
  },
  // Testes (Vitest): jsdom + Testing Library. css:false não processa Tailwind nos testes
  // (mais rápido e sem ruído) — os testes checam COMPORTAMENTO, não pixels.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
