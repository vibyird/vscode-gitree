// import globals from 'globals'
import neostandard from 'neostandard'
import svelte from 'eslint-plugin-svelte'

export default [
  ...neostandard({
    ignores: ['dist/**/*'],
    noStyle: true,
    ts: true,
  }),
  ...svelte.configs.recommended,
  ...svelte.configs.prettier,
  // {
  //   languageOptions: {
  //     globals: {
  //       ...globals.browser,
  //       ...globals.node, // Add this if you are using SvelteKit in non-SPA mode
  //     },
  //   },
  // },
  {
    rules: {
      // Override or add rule settings here, such as:
      // 'svelte/rule-name': 'error'
    },
  },
]
