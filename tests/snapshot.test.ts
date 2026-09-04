import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * Full-combination snapshot matrix: generate a project for every possible
 * shape subset (2^7 = 128) and, for subsets containing `client`, six style/UI
 * variants — 448 projects in total — then assert structure for each of them.
 */
import { test, expect } from 'vite-plus/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const SHAPES = ['config', 'commands', 'tool', 'events', 'service', 'hook', 'client']
const SURFACES = [
  'shell-overlay',
  'config-card',
  'sidebar-action',
  'input-dock',
  'header-utilities',
  'input-left',
  'input-right',
  'commandview',
  'general-item',
  'plugins-tab',
  'settings-action',
  'header-actions',
  'composer-dock',
  'assistant-actions'
]
const UI_VARIANTS = [[], ['shell-overlay'], ['config-card', 'commandview'], SURFACES] as string[][]
// Styling authoring variants, sampled per client combo: the four UI variants
// under native, plus modules at both UI extremes.
const STYLE_VARIANTS = [
  ...UI_VARIANTS.map(ui => ({ ui, style: 'native' })),
  { ui: [] as string[], style: 'modules' },
  { ui: SURFACES as string[], style: 'modules' }
]

function fullCombination(arr: string[]): string[][] {
  const combinations: string[][] = []
  for (let i = 0; i < 1 << arr.length; i++) {
    const combination: string[] = []
    for (let j = 0; j < arr.length; j++) {
      if (i & (1 << j)) combination.push(arr[j]!)
    }
    combinations.push(combination)
  }
  return combinations
}

const combos: Array<{ shapes: string[]; ui: string[]; style: string }> = []
for (const shapes of fullCombination(SHAPES)) {
  if (shapes.includes('client')) {
    for (const variant of STYLE_VARIANTS) combos.push({ shapes, ...variant })
  } else {
    combos.push({ shapes, ui: [], style: 'native' })
  }
}

test(`snapshot matrix: ${combos.length} combinations verified`, { timeout: 600_000 }, () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'dsh-create-snapshot-'))
  let index = 0

  for (const { shapes, ui, style } of combos) {
    index += 1
    const name = `dsh-snap-${String(index).padStart(3, '0')}`
    const target = join(tmpRoot, name)
    const args = [target, '--name', name]
    if (shapes.length > 0) args.push('--with', shapes.join(','))
    if (ui.length > 0) args.push('--ui', ui.join(','))
    if (style !== 'native') args.push('--style', style)

    const output = spawnSync(process.execPath, ['src/index.ts', ...args], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.equal(output.status, 0, output.stderr || output.stdout)

    // The CLI auto-couples dependent shapes for coupled surfaces.
    const effective = new Set(shapes)
    if (ui.includes('config-card')) effective.add('config')
    if (ui.includes('commandview')) effective.add('commands')
    const has = (shape: string) => effective.has(shape)
    const hasSurface = (surface: string) => ui.includes(surface)
    const clientEnabled = has('client')
    const read = (rel: string) => readFileSync(join(target, rel), 'utf8')

    // ---- file presence ----
    assert.ok(existsSync(join(target, 'src/index.ts')), 'src/index.ts always generated')
    assert.equal(existsSync(join(target, 'src/service.ts')), has('service'), 'service file iff service')
    assert.equal(existsSync(join(target, 'src/hook.ts')), has('hook'), 'hook file iff hook')
    assert.equal(existsSync(join(target, 'src/commands.ts')), has('commands'), 'commands file iff commands')
    assert.equal(existsSync(join(target, 'src/client/index.tsx')), clientEnabled, 'client entry iff client')
    assert.equal(existsSync(join(target, 'types.d.ts')), clientEnabled, 'types.d.ts iff client')

    assert.ok(existsSync(join(target, 'pnpm-workspace.yaml')), 'supply-chain allowlist always generated')
    const allowlist = read('pnpm-workspace.yaml')
    assert.ok(allowlist.includes("'@deepseek-ai/cordis@4.0.1'"), 'cordis always allowlisted')
    assert.equal(allowlist.includes("'@deepseek-ai/dsh-tools@0.1.0-rc.8'"), has('tool') || has('hook'))
    const modulesStyle = style === 'modules'
    assert.equal(allowlist.includes('allowBuilds:'), modulesStyle, 'allowBuilds iff modules style')

    // client surface modules exist exactly for the selected surfaces
    if (clientEnabled) {
      for (const surface of SURFACES) {
        assert.equal(
          existsSync(join(target, 'src/client', `${surface}.tsx`)),
          hasSurface(surface),
          `surface module ${surface} iff selected`
        )
      }
      assert.ok(existsSync(join(target, 'src/client/constants.ts')), 'client constants')
      assert.ok(existsSync(join(target, 'src/client/styles.css')), 'client stylesheet')
      assert.ok(existsSync(join(target, 'src/client/css.d.ts')), 'client css ambient types')
      assert.equal(
        existsSync(join(target, 'src/client/styles.module.css')),
        false,
        'no module stylesheet in the demo surfaces (users add their own)'
      )
      assert.ok(existsSync(join(target, 'src/client/types.ts')), 'client types')
      assert.ok(existsSync(join(target, 'src/client/locales.ts')), 'client locale contract')
      assert.ok(existsSync(join(target, 'src/client/locales/zh.json')), 'client zh dictionary')
      assert.ok(existsSync(join(target, 'src/client/locales/en.json')), 'client en dictionary')
      const viteConfig = read('vite.config.ts')
      assert.equal(viteConfig.includes("from './css-plugin.ts'"), true, 'client vite config imports the css plugin')
      assert.equal(viteConfig.includes('CLIENT_EXTERNALS'), true, 'client pack config present')
      const cssPlugin = read('css-plugin.ts')
      assert.equal(cssPlugin.includes('dsh-css-inject'), true, 'inject plugin always present')
      assert.equal(cssPlugin.includes('lightningcss'), modulesStyle, 'modules transform iff modules style')
      assert.equal(
        (JSON.parse(read('package.json')).devDependencies.lightningcss ?? undefined) !== undefined,
        modulesStyle,
        'lightningcss devDep iff modules style'
      )
    } else {
      const viteConfig = read('vite.config.ts')
      assert.equal(viteConfig.includes('css-plugin'), false, 'no css plugin without the client shape')
      assert.equal(viteConfig.includes('CLIENT_EXTERNALS'), false, 'no client pack config without the client shape')
      assert.equal(existsSync(join(target, 'css-plugin.ts')), false, 'no css plugin file without the client shape')
    }

    // no template leftovers
    const leftovers = readdirSync(target, { recursive: true }).filter(
      entry => String(entry).endsWith('.ejs') || String(entry).endsWith('.data.mjs')
    )
    assert.deepStrictEqual(leftovers, [], 'no .ejs / .data.mjs leftovers')
    assert.ok(!existsSync(join(target, '.vscode')), 'no .vscode emitted')

    // ---- package.json ----
    const pkg = JSON.parse(read('package.json'))
    assert.equal(pkg.name, name)
    assert.equal(pkg.dependencies['@deepseek-ai/schemastery'] !== undefined, has('config') || has('hook'))
    assert.equal(pkg.dependencies['@deepseek-ai/dsh-settings'] !== undefined, has('config'))
    assert.equal(pkg.dependencies['@deepseek-ai/dsh-tools'] !== undefined, has('tool'))
    assert.equal(pkg.exports['./service'] !== undefined, has('service'))
    assert.equal(pkg.exports['./hook'] !== undefined, has('hook'))
    assert.equal(pkg.exports['./client'] !== undefined, clientEnabled)
    assert.equal(pkg.peerDependencies.react !== undefined, clientEnabled)
    assert.equal(pkg.devDependencies.react !== undefined, clientEnabled)
    assert.equal(pkg.dsh.client !== undefined, clientEnabled)
    if (clientEnabled) {
      assert.equal(pkg.dsh.client.inject, undefined, 'client declares platform only')
    }

    // ---- src/index.ts ----
    const indexTs = read('src/index.ts')
    assert.equal(indexTs.includes("export const inject = ['tools']"), has('tool'))
    assert.equal(indexTs.includes('export function apply(ctx: Context, config: Config): void'), has('config'))
    assert.equal(
      indexTs.includes('export function apply(ctx: Context, _config: Record<string, never> = {})'),
      !has('config')
    )
    assert.equal(indexTs.includes("import Schema from '@deepseek-ai/schemastery'"), has('config'))
    assert.equal(indexTs.includes("import { defineTool } from '@deepseek-ai/dsh-tools'"), has('tool'))
    assert.equal(
      indexTs.includes("import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'"),
      has('config')
    )
    assert.equal(indexTs.includes('installSettingsSection(ctx, settingsNamespace'), has('config'))
    assert.equal(indexTs.includes("declare module '@deepseek-ai/cordis' {"), has('events'))
    assert.equal(indexTs.includes(`'${name}/ready'`), has('events'))
    assert.equal(
      indexTs.includes("import { registerDemoCommand, registerHelloCommand } from './commands.ts'"),
      has('commands')
    )
    assert.equal(indexTs.includes('registerDemoCommand(ctx)'), has('commands'))
    assert.equal(indexTs.includes('presentResult: (_args, result) => ({'), has('tool'))
    // cross-shape wiring: tool greeting reads the live config source only with config
    const expectedGreeting = has('config') ? '${configSource().greeting}' : 'Hello'
    assert.equal(indexTs.includes(`        return \`${expectedGreeting}, \${args.name}!\``), has('tool'))

    // ---- cordis.patch.yml ----
    const patch = read('cordis.patch.yml')
    const expectedRows = 1 + (has('service') ? 1 : 0) + (has('hook') ? 1 : 0)
    assert.equal((patch.match(/- id:/g) ?? []).length, expectedRows)
    assert.ok(patch.includes(`- id: ${name}\n      name: '${name}'`))
    if (has('service')) assert.ok(patch.includes(`- id: ${name}-service\n      name: '${name}/service'`))
    if (has('hook')) assert.ok(patch.includes(`- id: ${name}-hook\n      name: '${name}/hook'`))
    assert.equal(patch.includes("greeting: 'Hello from"), has('config'), 'config block iff config')

    // ---- tsconfig.json ----
    const tsconfig = JSON.parse(read('tsconfig.json'))
    expect(tsconfig.compilerOptions.types).toStrictEqual(
      clientEnabled ? ['node', 'react', 'react-dom/client'] : ['node']
    )
    expect(tsconfig.include).toStrictEqual(
      clientEnabled ? ['src/**/*.ts', 'src/**/*.tsx', 'types.d.ts'] : ['src/**/*.ts', 'src/**/*.tsx']
    )

    // ---- smoke.mjs ----
    const smoke = read('test/smoke.mjs')
    assert.equal(smoke.includes(`assert.equal(root.name, '${name}')`), true)
    assert.equal(smoke.includes("'tool shape registers greet'"), has('tool'))
    assert.equal(smoke.includes("'hello command registered'"), has('commands'))
    assert.equal(smoke.includes("'composition entry is the settings base layer'"), has('config'))
    assert.equal(smoke.includes("'tools/pre-execute listener registered'"), has('hook'))

    // ---- client index.tsx ----
    if (clientEnabled) {
      const clientTs = read('src/client/index.tsx')
      assert.equal(clientTs.includes('registerShellOverlay(ctx)'), hasSurface('shell-overlay'))
      assert.equal(clientTs.includes('registerConfigCard(ctx)'), hasSurface('config-card'))
      assert.equal(clientTs.includes('registerCommandView(ctx)'), hasSurface('commandview'))
      assert.equal(clientTs.includes('registerAssistantAction(ctx)'), hasSurface('assistant-actions'))
      const registerCalls = (clientTs.match(/^  register\w+\(ctx\)$/gm) ?? []).length
      assert.equal(registerCalls, ui.length, 'one register call per selected surface')
    }

    rmSync(target, { recursive: true, force: true })
  }

  rmSync(tmpRoot, { recursive: true, force: true })
})
