import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import { optimizeImports } from 'carbon-preprocess-svelte'
import scss from 'rollup-plugin-scss'
import svelte from 'rollup-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'
import { assets } from './build/rollup.js'

const languages = ['zh-cn']
const views = ['panel', 'settings']

const replaceEnv = replace({
  include: 'src/**/constants.{ts,js}',
  values: {
    'process.env.L10N': JSON.stringify(languages.join(',')),
  },
  preventAssignment: true,
})

export default [
  {
    input: 'src/main.ts',
    output: {
      file: 'extension.js',
      inlineDynamicImports: true,
    },
    plugins: [replaceEnv, resolve(), typescript()],
    external: ['vscode'],
  },
  {
    input: 'src/utils/webview.ts',
    output: {
      dir: 'assets',
      assetFileNames: '[name][extname]',
    },
    plugins: [
      resolve({ browser: true }),
      typescript(),
      scss({
        name: 'webview.css',
      }),
      assets(['webview.js', 'webview.css']),
    ],
  },
  ...views.map((view) => {
    return {
      input: `src/views/${view}/App.svelte`,
      output: {
        dir: 'assets',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: true,
      },
      plugins: [
        replaceEnv,
        resolve({
          browser: true,
          dedupe: ['svelte'],
        }),
        svelte({
          preprocess: [sveltePreprocess(), optimizeImports()],
        }),
        typescript(),
        scss({
          name: 'App.css',
        }),
        assets({
          'App.js': `${view}.js`,
          'App.css': `${view}.css`,
        }),
      ],
      external: ['webview'],
    }
  }),
]
