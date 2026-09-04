import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'

// Client CSS：自包含 bundle 不能外挂样式文件——.css 在构建期编译为
// "运行时 <style> 注入模块"（原样注入，类名即所写）。注入的标签带
// data-plugin / data-plugin-css 标记，client-modules 的 claimStyles
// 据此随插件卸载回收。

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** dsh-css-inject：.css → 原样运行时注入模块（正常全局 CSS，零改写）。 */
export const createDshCssPlugin = (id: string) => ({
  name: 'dsh-css-inject',
  resolveId(source: string, importer: string | undefined) {
    if (!source.endsWith('.css') || source.endsWith('.module.css') || importer === undefined) return null
    return CSS_VIRTUAL_PREFIX + resolvePath(dirname(importer), source) + CSS_VIRTUAL_SUFFIX
  },
  async load(virtualId: string) {
    if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
    const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
    // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
    this.addWatchFile(fileId)
    const css = await readFile(fileId, 'utf8')
    const tagId = `${id}/${basename(fileId)}`
    return [
      `const css = ${JSON.stringify(css)};`,
      `const tagId = ${JSON.stringify(tagId)};`,
      "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
      "  const tag = document.createElement('style');",
      `  tag.dataset.plugin = ${JSON.stringify(id)};`,
      '  tag.dataset.pluginCss = tagId;',
      '  tag.textContent = css;',
      '  document.head.appendChild(tag);',
      '}',
      'export {};'
    ].join('\n')
  }
})
