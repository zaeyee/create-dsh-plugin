// The toolchain formatter's import order: type imports first, then value
// imports alphabetically by specifier (relative modules sort together), and
// side-effect imports last. Keeping the emission sorted keeps generated
// output fmt-clean.
const importSource = (line) => (line.match(/from '([^']+)'/) ?? [])[1] ?? ''

export default function getData({ oldData }) {
  const S = oldData.surfaces ?? {}
  const on = (surface) => Boolean(S[surface])

  const registers = []
  const valueImports = ["import { NS, dictionaries } from './locales.ts'"]

  if (on('shell-overlay')) {
    valueImports.push("import { registerShellOverlay } from './shell-overlay.tsx'")
    registers.push('  registerShellOverlay(ctx)')
  }
  if (on('config-card')) {
    valueImports.push("import { registerConfigCard } from './config-card.tsx'")
    registers.push('  registerConfigCard(ctx)')
  }
  if (on('sidebar-action')) {
    valueImports.push("import { registerSidebarAction } from './sidebar-action.tsx'")
    registers.push('  registerSidebarAction(ctx)')
  }
  if (on('input-dock')) {
    valueImports.push("import { registerInputDock } from './input-dock.tsx'")
    registers.push('  registerInputDock(ctx)')
  }
  if (on('header-utilities')) {
    valueImports.push("import { registerHeaderUtility } from './header-utilities.tsx'")
    registers.push('  registerHeaderUtility(ctx)')
  }
  if (on('input-left')) {
    valueImports.push("import { registerInputLeft } from './input-left.tsx'")
    registers.push('  registerInputLeft(ctx)')
  }
  if (on('input-right')) {
    valueImports.push("import { registerInputRight } from './input-right.tsx'")
    registers.push('  registerInputRight(ctx)')
  }
  if (on('commandview')) {
    valueImports.push("import { registerCommandView } from './commandview.tsx'")
    registers.push('  registerCommandView(ctx)')
  }
  if (on('general-item')) {
    valueImports.push("import { registerGeneralItem } from './general-item.tsx'")
    registers.push('  registerGeneralItem(ctx)')
  }
  if (on('plugins-tab')) {
    valueImports.push("import { registerPluginsTab } from './plugins-tab.tsx'")
    registers.push('  registerPluginsTab(ctx)')
  }
  if (on('settings-action')) {
    valueImports.push("import { registerSettingsAction } from './settings-action.tsx'")
    registers.push('  registerSettingsAction(ctx)')
  }
  if (on('header-actions')) {
    valueImports.push("import { registerHeaderAction } from './header-actions.tsx'")
    registers.push('  registerHeaderAction(ctx)')
  }
  if (on('composer-dock')) {
    valueImports.push("import { registerComposerDock } from './composer-dock.tsx'")
    registers.push('  registerComposerDock(ctx)')
  }
  if (on('assistant-actions')) {
    valueImports.push("import { registerAssistantAction } from './assistant-actions.tsx'")
    registers.push('  registerAssistantAction(ctx)')
  }

  // 入口以副作用导入挂载全局样式表（构建期由 dsh-css-inject 插件编译为
  // 注入模块；modules 档下用户自加的 *.module.css 由各组件自行 import）。
  const sideEffectImports = ["import './styles.css'"]

  const clientImports = [
    "import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'",
    ...[...valueImports].sort((a, b) => importSource(a).localeCompare(importSource(b))),
    ...sideEffectImports
  ]

  return {
    ...oldData,
    clientImports,
    registers,
  }
}
