import { defineConfig } from 'vite'
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
})
