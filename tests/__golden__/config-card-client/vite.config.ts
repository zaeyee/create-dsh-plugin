import { existsSync } from 'node:fs'
import { defineConfig } from 'vite-plus'
import { createDshCssPlugin } from './css-plugin.ts'
import { name } from './package.json'

/** Host 半边：Node 库，输出 lib/，供 cordis.yml 插件行按包名加载 */
const host = {
  entry: ['src/index.ts', 'src/service.ts', 'src/hook.ts'].filter(existsSync),
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: true,
  clean: true,
  fixedExtension: false,
  deps: {
    neverBundle: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-tools',
      '@deepseek-ai/dsh-settings',
      '@deepseek-ai/schemastery'
    ]
  }
}

const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime']

/** Client 半边：浏览器配置卡片 bundle，输出 lib/client.js */
const client = {
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  clean: false,
  sourcemap: true,
  deps: {
    neverBundle: CLIENT_EXTERNALS,
    alwaysBundle: (id: string) => !CLIENT_EXTERNALS.includes(id)
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production')
  },
  outputOptions: {
    // 固定产物名 lib/client.js，与 package.json exports["./client"] 对应。
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: "${name}", factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });'
  },
  plugins: [createDshCssPlugin(name)]
}
export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  // 数组形式：先构建 Node 库（clean），再产出 client bundle（clean 关闭，避免互相清掉）。
  pack: [host, client],
  lint: {
    options: { typeAware: true, typeCheck: true }
  },
  fmt: {
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
