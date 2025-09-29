import alias from '@rollup/plugin-alias'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import swc from '@rollup/plugin-swc'
import { optimizeImports } from 'carbon-preprocess-svelte'
import path from 'path'
import scss from 'rollup-plugin-scss'
import svelte from 'rollup-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'
import { assets, sass, scan } from './build/rollup.js'

const languages = await scan({
  dir: path.resolve('l10n'),
  search: /^bundle\.l10n\.([\w-]+)\.json$/,
  replace: ([, language]) => language,
})

const plugins = [
  alias({
    entries: [
      {
        find: '@',
        replacement: path.resolve('src'),
      },
      {
        find: '@web',
        replacement: path.resolve('src', 'web'),
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

const pages = await scan({
  dir: path.resolve('src', 'web', 'pages'),
  search: /^([\w-]+)\.svelte$/,
  replace: ([, page]) => page,
})

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
    input: 'src/web/main.ts',
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
        name: 'main.css',
        sass,
      }),
      swc(),
      assets(['main.js', 'main.css']),
    ],
  },
  ...pages.map((page) => ({
    input: `src/web/pages/${page}.svelte`,
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
        name: `${page}.css`,
        sass,
      }),
      swc(),
      assets([`${page}.js`, `${page}.css`]),
    ],
  })),
]
