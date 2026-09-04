import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import deepMerge from './deepMerge.ts'
import sortDependencies from './sortDependencies.ts'

/**
 * Shape of the default export of a `*.data.mjs` template data file.
 * These files live in `template/`, stay plain JavaScript and are loaded at
 * runtime through a dynamic `import()`, so they are never part of the bundle
 * or of the type-check graph.
 */
export type GetData = (options: {
  oldData: Record<string, unknown>
}) => Record<string, unknown> | Promise<Record<string, unknown>>

export type DataStore = Record<string, Record<string, unknown>>

export type RenderCallback = (dataStore: DataStore) => void | Promise<void>

// JSON files that are deep-merged (instead of overwritten) when a later
// template fragment also provides them. `package.json` additionally gets its
// dependency sections sorted; tsconfig.json joins the merge list so the
// `client` fragment can contribute `types`/`include`.
const MERGEABLE_JSON = new Set(['package.json', 'tsconfig.json', 'extensions.json', 'settings.json'])

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
}

function writeJson(file: string, value: Record<string, unknown>): void {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

/**
 * Renders a template folder to the target directory by recursively copying,
 * with overlay rules:
 *   - `package.json` / `tsconfig.json` / `.vscode/*.json` are deep-merged
 *   - `_filename` is renamed to `.filename` (npm-publish-safe dotfiles)
 *   - `_gitignore` content is appended to an existing `.gitignore`
 *   - `*.data.mjs` files register a callback that feeds the shared dataStore
 *     used by the later EJS rendering pass
 */
function renderTemplate(src: string, dest: string, callbacks: RenderCallback[]): void {
  const stats = fs.statSync(src)

  if (stats.isDirectory()) {
    // skip node_modules
    if (path.basename(src) === 'node_modules') {
      return
    }

    fs.mkdirSync(dest, { recursive: true })
    for (const file of fs.readdirSync(src)) {
      renderTemplate(path.resolve(src, file), path.resolve(dest, file), callbacks)
    }
    return
  }

  const filename = path.basename(src)

  if (filename === 'package.json' && fs.existsSync(dest)) {
    // merge instead of overwriting
    const pkg = sortDependencies(deepMerge(readJson(dest), readJson(src)) as Parameters<typeof sortDependencies>[0])
    writeJson(dest, pkg)
    return
  }

  if (MERGEABLE_JSON.has(filename) && fs.existsSync(dest)) {
    // merge instead of overwriting (no dependency sorting)
    writeJson(dest, deepMerge(readJson(dest), readJson(src)))
    return
  }

  if (filename.startsWith('_')) {
    // rename `_file` to `.file`
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
  }

  if (filename === '_gitignore' && fs.existsSync(dest)) {
    // append to existing .gitignore
    const existing = fs.readFileSync(dest, 'utf8')
    const newGitignore = fs.readFileSync(src, 'utf8')
    fs.writeFileSync(dest, `${existing}\n${newGitignore}`)
    return
  }

  // data file for EJS templates
  if (filename.endsWith('.data.mjs')) {
    // use dest path (without the .data.mjs suffix) as the key for the data store
    dest = dest.replace(/\.data\.mjs$/, '')

    // Add a callback to the array for late usage when template files are being processed
    callbacks.push(async dataStore => {
      const getData = (await import(pathToFileURL(src).toString())).default as GetData

      // Though current `getData` are all sync, we still retain the possibility of async
      dataStore[dest] = await getData({
        oldData: dataStore[dest] || {}
      })
    })

    return // skip copying the data file
  }

  fs.copyFileSync(src, dest)
}

export default renderTemplate
