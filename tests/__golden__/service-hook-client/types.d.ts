/**
 * Client type surface: load the REAL official declaration merges (ui-layout's
 * slot declarations incl. shell.overlay, the runtime's ctx merges and session
 * standard props, the locale service), then locally declare the additive seats
 * whose declaring packages (ui-sidebar / ui-conversation / ui-settings-*) are
 * harness-internal and not published as npm type surfaces. The metadata below
 * mirrors those runtime declarations (kind / scope / owner / keyed props) so
 * registrations and PropsRuntime resolve exactly as they do in the harness.
 */
import '@deepseek-ai/dsh-client-ui-layout/client'
import '@deepseek-ai/dsh-client-runtime/client'
import '@deepseek-ai/dsh-client-locale/client'

/**
 * Minimal shape of a command lifecycle node (subset of dsh-client-runtime's
 * CommandNode): enough for the commandview custom row to render line + status.
 */
export interface CommandNodeLike {
  /** Command name; null when the run falls outside the node window. */
  name: string | null
  /** Raw text after the command name (incl. separating whitespace); null when absent. */
  args: string | null
  /** Settled outcome (command/done); null while executing. */
  outcome: { kind: 'success' | 'error'; text?: string } | null
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Sidebar-foot action row (declared at runtime by ui-sidebar). */
    'sidebar.footer.action': { kind: 'list'; scope: 'root'; owner: { wide?: boolean } }
    /** Status strip above the composer card (declared at runtime by ui-conversation). */
    'conversation.input.dock': { kind: 'list'; scope: 'session' }
    /** Composer tool-row left-end control (declared at runtime by ui-conversation). */
    'conversation.input.left': { kind: 'list'; scope: 'session' }
    /** Composer tool-row right-end control (declared at runtime by ui-conversation). */
    'conversation.input.right': { kind: 'list'; scope: 'session' }
    /** Status line inside the composer card footer (declared at runtime by ui-conversation). */
    'conversation.composer.dock': { kind: 'list'; scope: 'session' }
    /** Session-header right-aligned utility badge (declared at runtime by ui-conversation). */
    'conversation.session.header.utilities': { kind: 'list'; scope: 'session' }
    /** Session-header action button row (declared at runtime by ui-conversation). */
    'conversation.session.header.actions': { kind: 'list'; scope: 'session' }
    /** Keyed slash-command render row; the owner passes the command node per key. */
    'conversation.chat.commandview': {
      kind: 'keyed'
      scope: 'session'
      keyProps: { [command: string]: { node?: CommandNodeLike } }
    }
    /** Per-assistant-message action strip (declared at runtime by ui-conversation). */
    'conversation.chat.assistant-actions': { kind: 'list'; scope: 'session' }
    /** One preference row in Settings → General (declared at runtime by ui-settings-general). */
    'settings.general.item': { kind: 'list'; scope: 'root' }
    /** One tab in Settings → Plugins (declared at runtime by the Plugins section owner). */
    'settings.plugins.tab': { kind: 'list'; scope: 'root' }
    /** Settings-panel content-column header action (declared at runtime by ui-settings-general). */
    'settings.action': { kind: 'list'; scope: 'root' }
    /** One config card in Settings → Plugins → Configurable (declared at runtime by ui-settings-plugins). */
    'settings.plugin.item': { kind: 'list'; scope: 'root' }
  }
}
