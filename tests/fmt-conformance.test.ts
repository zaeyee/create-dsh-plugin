import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * Formatting conformance guard: everything the generator emits — except JSON,
 * which stays in its JSON.stringify canonical form — must be clean under the
 * toolchain formatter (vp fmt). This pins the template style discipline:
 * hand-written template fragments cannot drift from the formatter's rules
 * (import order, arrow parens, trailing commas, line wrapping), because any
 * drift fails here before it can reach a generated project.
 *
 * The probe stages copies of the golden baselines under an UNignored scratch
 * directory: `template/` and `tests/__golden__/` are byte-level snapshot
 * assets excluded from fmt by design (see vite.config.ts), so the copies are
 * what let the real formatter judge the rendered bytes.
 */
import { test } from 'vite-plus/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const goldenRoot = resolve(root, 'tests/__golden__')
const combos = readdirSync(goldenRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)

test(
  `generated output is fmt-clean across ${combos.length} golden combos (JSON excluded by design)`,
  { timeout: 120_000 },
  () => {
    assert.ok(combos.length > 0, 'golden baselines must exist')

    const scratch = join(root, '.tmp-fmt-guard')
    rmSync(scratch, { recursive: true, force: true })
    for (const combo of combos) {
      cpSync(resolve(goldenRoot, combo), join(scratch, combo), { recursive: true })
      // package.json / tsconfig.json are emitted via JSON.stringify (canonical
      // 2-space form). The formatter additionally sorts package.json keys and
      // collapses short JSON arrays — opinions we deliberately do not track,
      // so both files stay outside this guard.
      rmSync(join(scratch, combo, 'package.json'), { force: true })
      rmSync(join(scratch, combo, 'tsconfig.json'), { force: true })
    }

    try {
      const output = spawnSync('vp', ['fmt', '--list-different', scratch], {
        cwd: root,
        encoding: 'utf8',
        shell: true
      })
      assert.equal(output.status, 0, `vp fmt --list-different failed: ${output.stderr || output.stdout}`)
      const offenders = output.stdout
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
      assert.deepEqual(offenders, [], `generated files must be fmt-clean; offending files:\n${offenders.join('\n')}`)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
)
