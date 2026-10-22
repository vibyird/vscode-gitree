import fs from 'fs/promises'
import path from 'path'
import { build as buildExtension } from 'rolldown'
import { build as buildPage } from 'vite'

const root = path.resolve(import.meta.dirname, '..')

// build for extension
const entry = 'src/main.ts'
console.log(`build extension ${entry}`)
await buildExtension({
  cwd: root,
  input: entry,
  platform: 'node',
  output: {
    file: 'extension.js',
  },
  external: ['vscode'],
})
console.log('  wirte to file extension.js')
console.log('')

// build for pages
const pattern = /\.(?:ts|js)$/
for (const filename of await fs.readdir(path.resolve(root, 'src', 'web', 'pages'))) {
  if (!pattern.test(filename)) {
    continue
  }
  const name = filename.replace(pattern, '')

  const filenames = []
  const track = {
    name: 'track-plugin',
    writeBundle(options, bundle) {
      filenames.push(...Object.keys(bundle))
    },
  }

  const entry = `src/web/pages/${filename}`
  console.log(`build page [${name}] ${entry}`)
  await buildPage({
    logLevel: 'silent',
    root,
    plugins: [track],
    build: {
      outDir: `assets/pages/${name}`,
      lib: {
        entry: { index: entry },
        formats: ['es'],
        fileName: 'index',
      },
    },
  })
  for (const filename of filenames) {
    console.log(`  wirte to file assets/pages/${name}/${filename}`)
  }
  console.log('')
}
