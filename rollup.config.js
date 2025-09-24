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

const webviews = []
for (const file of await fs.readdir('src/webviews')) {
  const match = file.match(/^([\w-]+)\.svelte$/)
  if (!match) {
    continue
  }
  const webview = match[1]
  try {
    const path = `src/webviews/${file}`
    const stat = await fs.stat(path)
    if (stat.isFile()) {
      await fs.access(path, fs.constants.R_OK)
      webviews.push(webview)
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
  ...webviews.map((webview) => ({
    input: `src/webviews/${webview}.svelte`,
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
        name: `${webview}.css`,
      }),
      swc(),
      assets([`${webview}.js`, `${webview}.css`]),
    ],
  })),
]
