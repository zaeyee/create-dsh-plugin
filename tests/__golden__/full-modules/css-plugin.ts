import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import { transform } from 'lightningcss'

// Client CSS 双通道：自包含 bundle 不能外挂样式文件——CSS 在构建期编译为
// "运行时 <style> 注入模块"。注入的标签带 data-plugin / data-plugin-css
// 标记，client-modules 的 claimStyles 据此随插件卸载回收。
// · 普通 .css：原样注入（正常全局 CSS，类名即所写）
// · *.module.css：CSS Modules——lightningcss 变换（类名 hash + minify），
//   额外导出类名映射（import classes from './x.module.css'，标准用法）

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

const styleInjectionModule = (id: string, fileId: string, css: string, classMap?: Readonly<Record<string, string>>) => {
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
    "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
    "  const tag = document.createElement('style');",
    `  tag.dataset.plugin = ${JSON.stringify(id)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}'
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

/** dsh-css-inject（modules 档）：.css 原样注入；*.module.css 经 lightningcss 加 hash 类名映射。 */
export const createDshCssPlugin = (id: string) => ({
  name: 'dsh-css-inject',
  resolveId(source: string, importer: string | undefined) {
    if (!source.endsWith('.css') || importer === undefined) return null
    return CSS_VIRTUAL_PREFIX + resolvePath(dirname(importer), source) + CSS_VIRTUAL_SUFFIX
  },
  async load(virtualId: string) {
    if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
    const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
    // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
    this.addWatchFile(fileId)
    const source = await readFile(fileId)
    if (!fileId.endsWith('.module.css')) {
      return styleInjectionModule(id, fileId, source.toString())
    }
    const { code, exports: cssExports } = transform({
      filename: fileId,
      code: source,
      cssModules: { pattern: '[hash]_[local]' },
      minify: true
    })
    const classMap: Record<string, string> = {}
    const exportEntries = Object.entries(cssExports ?? {}).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0
    )
    for (const [local, exp] of exportEntries) classMap[local] = exp.name
    return styleInjectionModule(id, fileId, code.toString(), classMap)
  }
})
