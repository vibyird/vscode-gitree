import neostandard from 'neostandard'
import svelte from 'eslint-plugin-svelte'
import ts from 'typescript-eslint'

export default [
  ...neostandard({
    ignores: ['extension.js', 'assets/**/*'],
    noStyle: true,
    ts: true,
  }),
  ...svelte.configs.recommended,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        l10n: true,
        runtime: true,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
      },
    },
  },
]
