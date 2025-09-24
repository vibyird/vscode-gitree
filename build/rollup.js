export function assets(names = []) {
  return {
    name: 'assets',
    generateBundle(_, bundle) {
      const emptyFiles = []
      // force empty css file
      for (const name of names) {
        if (bundle[name]) {
          continue
        }
        if (name.endsWith('.css')) {
          emptyFiles.push({
            type: 'asset',
            fileName: `css/${name}`,
            source: '@charset "UTF-8";',
          })
        }
      }
      const files = []
      // move to js and css directory
      for (const [name, item] of Object.entries(bundle)) {
        if (name.endsWith('.js')) {
          files.push({
            type: 'prebuilt-chunk',
            fileName: `js/${name}`,
            code: item.code,
          })
          delete bundle[name]
        } else if (name.endsWith('.css')) {
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
