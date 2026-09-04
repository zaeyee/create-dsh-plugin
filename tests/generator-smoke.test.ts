import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from 'vite-plus/test'

const root = fileURLToPath(new URL('..', import.meta.url))

const run = (args: string[]) =>
  spawnSync(process.execPath, ['src/index.ts', ...args], {
    cwd: root,
    encoding: 'utf8'
  })
const runOk = (args: string[]) => {
  const output = run(args)
  assert.equal(output.status, 0, output.stderr || output.stdout)
  return output
}
const makeTarget = (prefix: string) => mkdtempSync(join(tmpdir(), prefix))

// ---------- golden comparison ----------
const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v as Record<string, unknown>)
            .sort()
            .map(k => [k, sortKeys((v as Record<string, unknown>)[k])])
        )
      : v
const semanticJsonEqual = (a: string, b: string) =>
  JSON.stringify(sortKeys(JSON.parse(a))) === JSON.stringify(sortKeys(JSON.parse(b)))
// Tolerate trailing whitespace differences only (EJS files end with a newline,
// the legacy generator sometimes did not).
const normalizeText = (s: string) =>
  s
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\s+$/, '')
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  )

const GOLDEN_COMBOS: Array<[string, string, string[]]> = [
  ['default', 'dsh-smoke-simple', []],
  ['tool', 'dsh-golden-tool', ['--with', 'tool']],
  ['config-tool', 'dsh-golden-config-tool', ['--with', 'config,tool']],
  ['commands-tool', 'dsh-golden-commands-tool', ['--with', 'commands,tool']],
  ['full', 'dsh-smoke-full', ['--with', 'config,commands,tool,events,service,hook,client', '--ui', 'all']],
  [
    'full-modules',
    'dsh-smoke-full-mods',
    ['--with', 'config,commands,tool,events,service,hook,client', '--ui', 'all', '--style', 'modules']
  ],
  ['service-hook-client', 'dsh-golden-shc', ['--with', 'service,hook,client', '--ui', 'all']],
  // config-card auto-couples the config shape (settings wiring) even though
  // --with only lists client — the golden captures the implied shape.
  ['config-card-client', 'dsh-golden-ccc', ['--with', 'client', '--ui', 'config-card']]
]

test('generated projects match the golden baseline', { timeout: 120_000 }, () => {
  const tmpRoot = makeTarget('dsh-create-golden-')
  for (const [combo, name, flags] of GOLDEN_COMBOS) {
    const fresh = join(tmpRoot, combo)
    runOk([fresh, '--name', name, ...flags])

    const goldenDir = resolve(root, 'tests/__golden__', combo)
    const goldenFiles = walk(goldenDir)
      .map(p => relative(goldenDir, p))
      .sort()
    const freshFiles = walk(fresh)
      .map(p => relative(fresh, p))
      .sort()
    assert.deepStrictEqual(freshFiles, goldenFiles, `${combo}: generated file tree mismatch`)

    for (const rel of goldenFiles) {
      const golden = readFileSync(join(goldenDir, rel), 'utf8')
      const generated = readFileSync(join(fresh, rel), 'utf8')
      const ok = rel.endsWith('.json')
        ? semanticJsonEqual(golden, generated)
        : normalizeText(golden) === normalizeText(generated)
      assert.ok(ok, `${combo}/${rel}: content mismatch\n--- golden ---\n${golden}\n--- generated ---\n${generated}`)
    }
  }
  rmSync(tmpRoot, { recursive: true, force: true })
})

// ---------- structural smoke (kept from the legacy test) ----------
test('structural smoke for minimal and full selections', { timeout: 60_000 }, () => {
  const simple = makeTarget('dsh-template-simple-')
  runOk([simple, '--name', 'dsh-smoke-simple'])
  const simplePkg = JSON.parse(readFileSync(join(simple, 'package.json'), 'utf8'))
  expect(simplePkg.name).toBe('dsh-smoke-simple')
  expect(simplePkg.dsh.client).toBeUndefined()
  expect(existsSync(join(simple, 'src/client'))).toBe(false)
  expect(existsSync(join(simple, 'src/index.ts'))).toBe(true)

  const full = makeTarget('dsh-template-full-')
  runOk([full, '--name', 'dsh-smoke-full', '--with', 'config,commands,tool,events,service,hook,client', '--ui', 'all'])
  const fullPkg = JSON.parse(readFileSync(join(full, 'package.json'), 'utf8'))
  expect(fullPkg.dsh.client.platform).toBe('web')
  expect(existsSync(join(full, 'src/client/index.tsx'))).toBe(true)
  expect(existsSync(join(full, 'src/client/config-card.tsx'))).toBe(true)
  expect(existsSync(join(full, 'src/client/commandview.tsx'))).toBe(true)
  expect(existsSync(join(full, 'src/commands.ts'))).toBe(true)
  expect(existsSync(join(full, 'src/service.ts'))).toBe(true)
  expect(existsSync(join(full, 'src/hook.ts'))).toBe(true)
  expect(readFileSync(join(full, 'vite.config.ts'), 'utf8')).toMatch(/window\.__ModuleLoader__\.load/)
  expect(readFileSync(join(full, 'types.d.ts'), 'utf8')).toMatch(/dsh-client-ui-layout\/client/)

  rmSync(simple, { recursive: true, force: true })
  rmSync(full, { recursive: true, force: true })
})

// ---------- scoped package names ----------
test('scoped package names strip the scope for the plugin id', { timeout: 60_000 }, () => {
  const scoped = makeTarget('dsh-template-scoped-')
  runOk([scoped, '--name', '@my-scope/dsh-scoped', '--with', 'events,service'])
  const index = readFileSync(join(scoped, 'src/index.ts'), 'utf8')
  expect(index).toMatch(/export const name = 'dsh-scoped'/)
  expect(index).toMatch(/'dsh-scoped\/ready'/)
  const patch = readFileSync(join(scoped, 'cordis.patch.yml'), 'utf8')
  expect(patch).toMatch(/- id: dsh-scoped-service/)
  expect(patch).toMatch(/name: '@my-scope\/dsh-scoped\/service'/)
  rmSync(scoped, { recursive: true, force: true })
})

// ---------- error paths (legacy behavior parity) ----------
test('error paths keep the legacy semantics', { timeout: 60_000 }, () => {
  const failing = (args: string[], message: RegExp) => {
    const output = run(args)
    assert.notEqual(output.status, 0, `expected failure: ${args.join(' ')}`)
    assert.match(output.stderr, message)
  }
  failing(['--name', 'dsh-x'], /usage:/) // --name without target → usage error (interactive mode starts when --name is absent)
  failing(['/tmp/x-dest-irrelevant', '--name', 'BAD NAME'], /invalid --name/)
  failing([join(tmpdir(), 'dsh-unknown-shape'), '--name', 'dsh-x', '--with', 'nope'], /unknown shape "nope"/)
  failing([join(tmpdir(), 'dsh-bad-ui'), '--name', 'dsh-x', '--ui', 'nope'], /unknown UI surface "nope"/)
  failing(
    [join(tmpdir(), 'dsh-ui-no-client'), '--name', 'dsh-x', '--ui', 'shell-overlay'],
    /--ui requires --with client/
  )

  // non-empty target without --force fails
  const nonEmpty = makeTarget('dsh-template-nonempty-')
  writeFileSync(join(nonEmpty, 'keep.txt'), 'data')
  failing([nonEmpty, '--name', 'dsh-x'], /target is not empty/)
  // ...but succeeds with --force (and empties the directory)
  runOk([nonEmpty, '--name', 'dsh-x', '--force'])
  expect(existsSync(join(nonEmpty, 'keep.txt'))).toBe(false)
  expect(existsSync(join(nonEmpty, 'package.json'))).toBe(true)
  rmSync(nonEmpty, { recursive: true, force: true })
})
