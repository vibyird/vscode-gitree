import { access, constants, readdir, stat } from 'fs/promises'
import { resolve } from 'path'
import { compileString } from 'sass'

export async function scan({ dir, search, replace }) {
  const list = []
  for (const file of await readdir(dir)) {
    const match = file.match(search)
    if (!match) {
      continue
    }
    const item = replace(match)
    const path = resolve(dir, file)
    try {
      const stats = await stat(path)
      if (stats.isFile()) {
        await access(path, constants.R_OK)
        list.push(item)
      }
    } catch (_) {}
  }
  return list
}

export const sass = {
  renderSync({ data, includePaths, sourceMap }) {
    const { css, sourceMap: map } = compileString(data, {
      loadPaths: includePaths,
      quietDeps: true,
      sourceMap,
    })
    return {
      css: Buffer.from(css),
      map: map ? Buffer.from(JSON.stringify(map)) : undefined,
    }
  },
}

export function assets(names = []) {
  return {
    name: 'assets',
    generateBundle(_, bundle) {
      const emptyFiles = []
      // force empty file
      for (const name of names) {
        if (bundle[name]) {
          continue
        }
        if (name.endsWith('.js')) {
          emptyFiles.push({
            type: 'prebuilt-chunk',
            fileName: `js/${name}`,
            code: '',
          })
          delete bundle[name]
        } else if (name.endsWith('.css')) {
          emptyFiles.push({
            type: 'asset',
            fileName: `css/${name}`,
            source: '',
          })
        }
      }
      const files = []
      // move to js and css directory
      for (const [name, item] of Object.entries(bundle)) {
        if (name.endsWith('.js.map')) {
          files.push({
            type: 'asset',
            fileName: `js/${name}`,
            source: item.source,
          })
          delete bundle[name]
        } else if (name.endsWith('.js')) {
          files.push({
            type: 'prebuilt-chunk',
            fileName: `js/${name}`,
            code: item.code,
          })
          delete bundle[name]
        } else if (name.endsWith('.css') || name.endsWith('.css.map')) {
          files.push({
            type: 'asset',
            fileName: `css/${name}`,
            source: item.source,
          })
          delete bundle[name]
        }
      }
      // emit files
      ;[...files, ...emptyFiles].map((file) => this.emitFile(file))
    },
  }
}
