import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import scss from 'rollup-plugin-scss'
import { optimizeImports } from 'carbon-preprocess-svelte'

const configs = []
for (const webview of ['graph', 'settings']) {
  configs.push({
    input: `src/views/web/${webview}/main.ts`,
    output: {
      name: 'app',
      file: `dist/webviews/${webview}/index.js`,
      format: 'iife',
      assetFileNames: '[name][extname]',
      inlineDynamicImports: true,
    },
    plugins: [
      resolve({
        browser: true,
        dedupe: ['svelte'],
      }),
      typescript(),
      svelte({
        preprocess: [optimizeImports()],
      }),
      scss({
        name: 'index.css',
      }),
    ],
  })
}

export default [
  {
    input: `src/extension.ts`,
    output: {
      file: `dist/extension.js`,
      format: 'cjs',
      inlineDynamicImports: true,
    },
    plugins: [resolve(), typescript()],
    external: ['vscode'],
  },
  ...configs,
]
