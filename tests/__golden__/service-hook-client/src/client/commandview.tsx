/**
 * Slash-command render row (conversation.chat.commandview slot): a custom
 * display row for the /dsh-demo demo command. This slot is keyed — dispatched
 * by command name, registered with `key: DEMO_COMMAND_NAME`; unregistered
 * command rows fall back to the GenericCommandCard renderer. The command
 * itself is registered by the host half (the commands shape's
 * registerDemoCommand) under the same name literal.
 * Reference: ui-conversation declares this slot at runtime (no built-in
 * entries — an open additive seat with a generic fallback).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { DEMO_COMMAND_NAME, NAMESPACE } from './constants.ts'

export interface CommandViewProps extends PropsRuntime<'conversation.chat.commandview', typeof DEMO_COMMAND_NAME> {
  t: TranslateNS<typeof NAMESPACE>
}

/** Custom row for /dsh-demo: full command line plus settle status. */
export function CommandRow({ t, node }: CommandViewProps) {
  const line = node === undefined || node.name === null ? `/${DEMO_COMMAND_NAME}` : `/${node.name}${node.args ?? ''}`
  const status = node?.outcome === null ? t('commandview.running') : (node?.outcome?.text ?? t('commandview.done'))
  return (
    <div className="dtpl-command">
      <span className="dtpl-command-line">{line}</span>
      <span className="dtpl-command-status">{status}</span>
    </div>
  )
}

/** Register the /dsh-demo render row on `conversation.chat.commandview`. */
export function registerCommandView(ctx: ClientContext): void {
  ctx.slots.inject('conversation.chat.commandview', () =>
    ctx.slots.register({ name: 'conversation.chat.commandview', key: DEMO_COMMAND_NAME, locale: NAMESPACE }, CommandRow)
  )
}
