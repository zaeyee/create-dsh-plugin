import { defineConfig } from 'vite-plus'

// Snapshot-style assets: template fragments and golden baselines must never be
// reformatted or linted — their bytes are asserted by the test suite. `tmp/`
// is a scratch target for ad-hoc generator runs (node src/index.ts tmp …).
const IGNORED = ['template/**', 'tests/__golden__/**', 'tmp/**']

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  pack: {
    dts: { tsgo: true },
    exports: true
  },
  lint: {
    ignorePatterns: IGNORED,
    options: { typeAware: true, typeCheck: true }
  },
  fmt: {
    ignorePatterns: IGNORED,
    semi: false,
    printWidth: 120,
    singleQuote: true,
    arrowParens: 'avoid',
    trailingComma: 'none',
    htmlWhitespaceSensitivity: 'ignore',
    sortImports: {
      newlinesBetween: false,
      groups: [
        'type-builtin',
        'type-external',
        'type-internal',
        'type-subpath',
        'type-parent',
        'type-sibling',
        'type-index',
        'value-builtin',
        'value-external',
        'value-internal',
        'value-subpath',
        'value-parent',
        'value-sibling',
        'value-index',
        'named-import',
        'side_effect',
        'side_effect_style',
        'unknown'
      ]
    }
  }
})
