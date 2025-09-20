export function assets(
  replaces,
  options = {
    forceEmptyCss: true,
  },
) {
  return {
    name: 'assets',
    generateBundle(_, bundle) {
      if (Array.isArray(replaces)) {
        const newReplaces = {}
        for (const config of replaces) {
          newReplaces[config] = config
        }
        replaces = newReplaces
      }
      for (const [name, newName] of Object.entries(replaces)) {
        const item = bundle[name]
        delete bundle[name]
        if (item) {
          if (name.endsWith('.js')) {
            this.emitFile({
              type: 'prebuilt-chunk',
              fileName: `js/${newName}`,
              code: item.code,
            })
            delete bundle[name]
          } else if (name.endsWith('.css')) {
            this.emitFile({
              type: 'asset',
              fileName: `css/${newName}`,
              source: item.source,
            })
            delete bundle[name]
          }
        } else if (options.forceEmptyCss) {
          if (name.endsWith('.css')) {
            this.emitFile({
              type: 'asset',
              fileName: `css/${newName}`,
              source: '@charset "UTF-8";',
            })
          }
        }
      }
    },
  }
}
