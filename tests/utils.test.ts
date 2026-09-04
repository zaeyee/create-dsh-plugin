import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { test, expect } from 'vite-plus/test'
import deepMerge from '../src/utils/deepMerge.ts'
import { preOrderDirectoryTraverse, postOrderDirectoryTraverse } from '../src/utils/directoryTraverse.ts'
import renderTemplate, { type DataStore, type RenderCallback } from '../src/utils/renderTemplate.ts'
import sortDependencies from '../src/utils/sortDependencies.ts'

test('deepMerge merges objects recursively, dedupes arrays, overwrites scalars', () => {
  const target = {
    keep: 1,
    nested: { a: 1, list: [1, 2] },
    gone: 'old'
  }
  const source = {
    nested: { b: 2, list: [2, 3] },
    gone: 'new',
    added: true
  }
  expect(deepMerge(target, source)).toStrictEqual({
    keep: 1,
    nested: { a: 1, b: 2, list: [1, 2, 3] },
    gone: 'new',
    added: true
  })
})

test('sortDependencies sorts every dependency section alphabetically', () => {
  const sorted = sortDependencies({
    name: 'x',
    dependencies: { zoo: '1', ant: '1' },
    devDependencies: { tsdown: '1', typescript: '1' },
    peerDependencies: { react: '1' }
  })
  expect(Object.keys(sorted.dependencies!)).toStrictEqual(['ant', 'zoo'])
  expect(Object.keys(sorted.devDependencies!)).toStrictEqual(['tsdown', 'typescript'])
  expect(Object.keys(sorted.peerDependencies!)).toStrictEqual(['react'])
  expect(sorted.name).toBe('x')
})

test('renderTemplate: `_file` rename, JSON deep merge, data.mjs chaining', async () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-tpl-src-'))
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-tpl-dest-'))

  fs.writeFileSync(path.join(src, '_gitignore'), 'node_modules/\n')
  fs.mkdirSync(path.join(src, 'src'), { recursive: true })
  fs.writeFileSync(path.join(src, 'package.json'), JSON.stringify({ dependencies: { zoo: '^1' } }))
  fs.writeFileSync(
    path.join(src, 'src', 'index.ts.data.mjs'),
    'export default function getData({ oldData }) {\n  return { ...oldData, items: [...(oldData.items ?? []), "base"] }\n}\n'
  )

  // First render: plain copy + rename + data callback registration
  const callbacks: RenderCallback[] = []
  renderTemplate(src, path.join(dest, 'base'), callbacks)
  expect(fs.existsSync(path.join(dest, 'base', '.gitignore'))).toBe(true)
  expect(fs.existsSync(path.join(dest, 'base', 'src', 'index.ts.data.mjs'))).toBe(false)
  expect(callbacks.length).toBe(1)

  // Second render of a fragment with the same package.json → deep merge
  const frag = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-tpl-frag-'))
  fs.mkdirSync(path.join(frag, 'src'), { recursive: true })
  fs.writeFileSync(path.join(frag, 'package.json'), JSON.stringify({ dependencies: { ant: '^1' } }))
  fs.writeFileSync(
    path.join(frag, 'src', 'index.ts.data.mjs'),
    'export default function getData({ oldData }) {\n  return { ...oldData, items: [...oldData.items, "frag"] }\n}\n'
  )
  renderTemplate(frag, path.join(dest, 'base'), callbacks)

  const mergedPkg = JSON.parse(fs.readFileSync(path.join(dest, 'base', 'package.json'), 'utf8'))
  expect(mergedPkg.dependencies).toStrictEqual({ ant: '^1', zoo: '^1' })

  // data.mjs callbacks chain in render order via the shared dataStore
  const dataStore: DataStore = {}
  for (const cb of callbacks) await cb(dataStore)
  expect(dataStore[path.join(dest, 'base', 'src', 'index.ts')]!.items).toStrictEqual(['base', 'frag'])

  fs.rmSync(src, { recursive: true, force: true })
  fs.rmSync(frag, { recursive: true, force: true })
  fs.rmSync(dest, { recursive: true, force: true })
})

test('directoryTraverse visits pre-order and post-order correctly', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-traverse-'))
  fs.mkdirSync(path.join(root, 'sub'), { recursive: true })
  fs.writeFileSync(path.join(root, 'a.txt'), '')
  fs.writeFileSync(path.join(root, 'sub', 'b.txt'), '')

  const preOrder: string[] = []
  preOrderDirectoryTraverse(
    root,
    () => {},
    f => preOrder.push(path.relative(root, f))
  )
  expect(preOrder.sort()).toStrictEqual(['a.txt', path.join('sub', 'b.txt')])

  const postOrderDirs: string[] = []
  postOrderDirectoryTraverse(
    root,
    d => postOrderDirs.push(path.relative(root, d)),
    () => {}
  )
  // child dir must be visited (and removable) before its parent
  expect(postOrderDirs).toStrictEqual(['sub'])

  fs.rmSync(root, { recursive: true, force: true })
})
