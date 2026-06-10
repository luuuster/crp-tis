// ESLint flat config — foco em BUGS e A11Y, não em estilo (sem Prettier de propósito:
// reformatar 60+ arquivos shadcn geraria diff gigante sem valor p/ um repo-vitrine).
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'scripts/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // tsc (strict, noUnusedLocals) já cobre isso melhor; evita duplicar ruído:
      '@typescript-eslint/no-unused-vars': 'off',
      // padrão shadcn: interfaces vazias p/ extensão futura
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    // shadcn vendorizado: padrões do upstream disparam regras de compiler/a11y de wrapper.
    // Mexer neles aumentaria o diff vs upstream; o uso REAL é validado nas páginas + axe.test.
    // (Este bloco vem DEPOIS do geral de propósito — flat config: o último que casa vence.)
    files: ['src/components/ui/**'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'jsx-a11y/anchor-has-content': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
    },
  },
)
