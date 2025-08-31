import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import scss from 'rollup-plugin-scss'
import { optimizeImports } from 'carbon-preprocess-svelte'

export default {
  input: 'src/webviews/tree/index.ts',
  output: {
    dir: 'dist/webviews/tree',
    format: 'iife',
    assetFileNames: '[name][extname]',
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({
      browser: true,
      exportConditions: ['default', 'module', 'import', 'svelte'],
      extensions: ['.mjs', '.js', '.json', '.node', '.svelte'],
    }),
    typescript(),
    svelte({
      preprocess: [optimizeImports()],
    }),
    scss({
      name: 'index.css',
    }),
  ],
}
