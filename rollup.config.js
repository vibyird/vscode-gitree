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

const languages = []
for (const file of await fs.readdir('l10n')) {
  const match = file.match(/^bundle\.l10n\.([\w-]+)\.json$/)
  if (!match) {
    continue
  }
  const language = match[1]
  try {
    const path = `l10n/${file}`
    const stat = await fs.stat(path)
    if (stat.isFile()) {
      await fs.access(path, fs.constants.R_OK)
      languages.push(language)
    }
  } catch (_) {}
}

const pages = []
for (const file of await fs.readdir('src/web/pages')) {
  const match = file.match(/^([\w-]+)\.svelte$/)
  if (!match) {
    continue
  }
  const page = match[1]
  try {
    const path = `src/web/pages/${file}`
    const stat = await fs.stat(path)
    if (stat.isFile()) {
      await fs.access(path, fs.constants.R_OK)
      pages.push(page)
    }
  } catch (_) {}
}

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
        quietDeps: true,
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
        quietDeps: true,
      }),
      swc(),
      assets([`${page}.js`, `${page}.css`]),
    ],
  })),
]
