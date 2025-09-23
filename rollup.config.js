import alias from '@rollup/plugin-alias'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import swc from '@rollup/plugin-swc'
import { optimizeImports } from 'carbon-preprocess-svelte'
import fs from 'fs/promises'
import path from 'path'
import scss from 'rollup-plugin-scss'
import svelte from 'rollup-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'
import { assets } from './build/rollup.js'

const languages = (await fs.readdir('l10n')).map((file) => file.replace('bundle.l10n.', '').replace('.json', ''))

const views = await fs.readdir('src/views')

const plugins = [
  alias({
    entries: [
      {
        find: '@',
        replacement: path.resolve('src'),
      },
    ],
  }),
  replace({
    include: 'src/**/constants.{ts,js}',
    values: {
      'process.env.L10N': JSON.stringify(languages.join(',')),
    },
    preventAssignment: true,
  }),
]

export default [
  {
    input: 'src/main.ts',
    output: {
      file: 'extension.js',
    },
    plugins: [
      ...plugins,
      resolve({
        extensions: ['.mjs', '.js', '.ts'],
      }),
      swc(),
    ],
    external: ['vscode'],
  },
  {
    input: 'src/utils/runtime.ts',
    output: {
      dir: 'assets',
      assetFileNames: '[name][extname]',
    },
    plugins: [
      ...plugins,
      resolve({
        extensions: ['.mjs', '.js', '.ts'],
        browser: true,
      }),
      scss({
        name: 'runtime.css',
      }),
      swc(),
      assets(['runtime.js', 'runtime.css']),
    ],
  },
  ...views.map((view) => ({
    input: `src/views/${view}/App.svelte`,
    output: {
      dir: 'assets',
      assetFileNames: '[name][extname]',
    },
    plugins: [
      ...plugins,
      resolve({
        extensions: ['.mjs', '.js', '.ts', '.svelte'],
        browser: true,
        dedupe: ['svelte'],
      }),
      svelte({
        preprocess: [sveltePreprocess(), optimizeImports()],
      }),
      scss({
        name: 'App.css',
      }),
      swc(),
      assets({
        'App.js': `${view}.js`,
        'App.css': `${view}.css`,
      }),
    ],
  })),
]
