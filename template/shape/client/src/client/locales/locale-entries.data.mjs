// Shared dictionary table for the locale JSON data files. The `.data.mjs`
// suffix keeps this helper out of the generated project (renderTemplate never
// copies data files); zh.json / en.json data modules import the builder.
export function buildLocaleEntries({ surfaces, name }) {
  const on = (surface) => Boolean(surfaces && surfaces[surface])
  const entries = []

  if (on('shell-overlay')) {
    entries.push(
      { key: 'shellOverlay.text', zh: `Hello from ${name}`, en: `Hello from ${name}` },
      { key: 'shellOverlay.close', zh: '关闭', en: 'Close' },
    )
  }
  if (on('config-card')) {
    entries.push(
      { key: 'configCard.description', zh: '示例插件的配置：greeting / maxRetries / verbose', en: 'Plugin config: greeting / maxRetries / verbose' },
      { key: 'configCard.unsaved', zh: '未保存', en: 'Unsaved' },
      { key: 'configCard.fieldGreeting.label', zh: '打招呼文案', en: 'Greeting text' },
      { key: 'configCard.fieldGreeting.hint', zh: 'greet 工具返回时使用的前缀文案。', en: 'Prefix used by the greet tool reply.' },
      { key: 'configCard.fieldMaxRetries.label', zh: '最大重试次数', en: 'Max retries' },
      { key: 'configCard.fieldMaxRetries.hint', zh: '非负整数；用于示例心跳日志。', en: 'Non-negative integer; used by the demo heartbeat log.' },
      { key: 'configCard.fieldMaxRetries.invalid', zh: '必须是非负整数', en: 'Must be a non-negative integer' },
      { key: 'configCard.fieldVerbose.label', zh: '打印调试日志', en: 'Verbose logging' },
      { key: 'configCard.fieldVerbose.hint', zh: '开启后插件在事件与心跳时输出日志。', en: 'Log events and the heartbeat when enabled.' },
      { key: 'configCard.readOnly', zh: '当前设置文档只读（memory 模式或只读 provider）', en: 'The settings document is read-only (memory mode or a read-only provider)' },
      { key: 'configCard.saveFailed', zh: '保存失败，草稿已保留，请修正后重试', en: 'Save failed; drafts kept — fix and retry' },
      { key: 'configCard.discard', zh: '放弃', en: 'Discard' },
      { key: 'configCard.save', zh: '保存', en: 'Save' },
      { key: 'configCard.saving', zh: '保存中…', en: 'Saving…' },
      { key: 'configCard.overridden', zh: '已覆盖', en: 'Overridden' },
      { key: 'configCard.reset', zh: '重置', en: 'Reset' },
      { key: 'configCard.invalidValue', zh: '无效的值', en: 'Invalid value' },
      { key: 'configCard.unmounted.title', zh: '配置卡片未挂载', en: 'Config card not mounted' },
      { key: 'configCard.unmounted.body', zh: '设置服务（settingsScope）未提供；web profile（dsh-web-app）自带该服务，请用 dsh web 启动。', en: 'The settings service (settingsScope) is absent; the web profile (dsh-web-app) ships it — start with dsh web.' },
      { key: 'configCard.loading.title', zh: '正在读取配置…', en: 'Reading config…' },
      { key: 'configCard.loading.body', zh: '命名空间数据到达后本卡片会自动切换为可编辑状态。', en: 'The card switches to editable once the namespace data arrives.' },
      { key: 'configCard.notExposed.title', zh: '配置命名空间 {ns} 未对 Web 暴露', en: 'Config namespace {ns} is not exposed to the web' },
      { key: 'configCard.notExposed.body', zh: 'harness 的 Web 网关只向设置面板暴露白名单内的 settings 命名空间（WEB_SETTINGS_NAMESPACES），本命名空间不在名单里，因此 `settings.describe` 回答 settings-not-exposed。host 半边不受影响：greet 工具仍实时读取配置。', en: "The harness web gateway only exposes whitelisted settings namespaces to the settings panel (WEB_SETTINGS_NAMESPACES); this namespace is not on the list, so `settings.describe` answers settings-not-exposed. The host half is unaffected: the greet tool still reads config live." },
      { key: 'configCard.notExposed.remedy', zh: '要让本卡片可编辑：在 harness 的 WEB_SETTINGS_NAMESPACES 里加一行 {ns} 后重建/重启 harness；或等 harness 把暴露声明移进 settings.register()（源码注释标注的 deferred work）。', en: 'To make this card editable: add {ns} to the harness WEB_SETTINGS_NAMESPACES list and rebuild/restart the harness; or wait for the harness to move the exposure declaration into settings.register() (deferred work noted in source).' },
    )
  }
  if (on('sidebar-action')) {
    entries.push({ key: 'sidebarAction.label', zh: '模板示例操作', en: 'Demo action' })
  }
  if (on('input-dock')) {
    entries.push(
      { key: 'inputDock.label', zh: '模板输入区 Dock', en: 'Demo input dock' },
      { key: 'inputDock.waiting', zh: '（等待会话）', en: '(awaiting session)' },
      { key: 'inputDock.note', zh: '（conversation.input.dock 插槽示例）', en: '(conversation.input.dock demo)' },
    )
  }
  if (on('header-utilities')) {
    entries.push({ key: 'headerUtilities.label', zh: '模板工具位', en: 'Demo utility' })
  }
  if (on('input-left')) {
    entries.push({ key: 'inputLeft.label', zh: '模板左', en: 'Demo left' })
  }
  if (on('input-right')) {
    entries.push({ key: 'inputRight.label', zh: '模板右', en: 'Demo right' })
  }
  if (on('commandview')) {
    entries.push(
      { key: 'commandview.running', zh: '执行中…', en: 'Running…' },
      { key: 'commandview.done', zh: '完成', en: 'Done' },
    )
  }
  if (on('general-item')) {
    entries.push({ key: 'generalItem.label', zh: '模板示例开关', en: 'Demo preference' })
  }
  if (on('plugins-tab')) {
    entries.push(
      { key: 'pluginsTab.line1', zh: '这是一个 settings.plugins.tab 示例标签页。', en: 'A demo settings.plugins.tab tab.' },
      { key: 'pluginsTab.line2', zh: '插件页的每个 tab 是一个插槽条目（id + order + label），与 Configurable / 插件清单 并列。', en: 'Each plugins-page tab is a slot entry (id + order + label), alongside Configurable / inventory.' },
    )
  }
  if (on('settings-action')) {
    entries.push(
      { key: 'settingsAction.label', zh: '模板按钮', en: 'Demo button' },
      { key: 'settingsAction.lit', zh: '模板按钮 · 已点亮', en: 'Demo button · lit' },
    )
  }
  if (on('header-actions')) {
    entries.push({ key: 'headerActions.label', zh: '模板', en: 'Demo' })
  }
  if (on('composer-dock')) {
    entries.push({ key: 'composerDock.text', zh: '模板状态条（conversation.composer.dock）', en: 'Demo status strip (conversation.composer.dock)' })
  }
  if (on('assistant-actions')) {
    entries.push(
      { key: 'assistantActions.save', zh: '收藏 ☆', en: 'Save ☆' },
      { key: 'assistantActions.saved', zh: '已收藏 ★', en: 'Saved ★' },
    )
  }
  return entries
}

// RenderTemplate registers a callback per `.data.mjs`; this shared module has
// no destination of its own, so its default export is a pass-through.
export default function getData({ oldData }) {
  return oldData
}
