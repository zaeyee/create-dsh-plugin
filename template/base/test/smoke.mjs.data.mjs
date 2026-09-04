export default function getData({ oldData }) {
  const SLOT = {
    'shell-overlay': 'shell.overlay',
    'config-card': 'settings.plugin.item',
    'sidebar-action': 'sidebar.footer.action',
    'input-dock': 'conversation.input.dock',
    'header-utilities': 'conversation.session.header.utilities',
    'input-left': 'conversation.input.left',
    'input-right': 'conversation.input.right',
    commandview: 'conversation.chat.commandview',
    'general-item': 'settings.general.item',
    'plugins-tab': 'settings.plugins.tab',
    'settings-action': 'settings.action',
    'header-actions': 'conversation.session.header.actions',
    'composer-dock': 'conversation.composer.dock',
    'assistant-actions': 'conversation.chat.assistant-actions',
  }
  const slots = Object.entries(oldData.surfaces ?? {})
    .filter(([, on]) => on)
    .map(([surface]) => SLOT[surface])
  // Emit the expected-slots array the way the toolchain formatter would:
  // inline when it fits the line budget, one per line otherwise.
  const inline = `const expected = [${slots.map((slot) => `'${slot}'`).join(', ')}]`
  const expectedSlots =
    inline.length <= 120
      ? inline
      : `const expected = [\n${slots.map((slot) => `    '${slot}'`).join(',\n')}\n  ]`
  return {
    ...oldData,
    needsToolGreeting: oldData.needsConfig ? 'Hi' : 'Hello',
    expectedSlots,
  }
}
