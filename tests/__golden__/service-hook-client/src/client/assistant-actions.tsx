/**
 * Message actions (conversation.chat.assistant-actions slot): one "save"
 * button on every assistant reply's action strip. Session-level list; the
 * owner passes the addressed message's messageId (this demo does not consume
 * it — it only demoes the button seat).
 * Reference: ui-message-feedback (id 'feedback').
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface AssistantActionProps extends PropsRuntime<'conversation.chat.assistant-actions'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** A per-message "save" button (local state, independent per message). */
export function AssistantAction({ t }: AssistantActionProps) {
  const [saved, setSaved] = useState(false)
  return (
    <button type="button" className="dtpl-btn" aria-pressed={saved} onClick={() => setSaved(!saved)}>
      <span>{saved ? t('assistantActions.saved') : t('assistantActions.save')}</span>
    </button>
  )
}

/** Register the demo button on `conversation.chat.assistant-actions`. */
export function registerAssistantAction(ctx: ClientContext): void {
  ctx.slots.inject('conversation.chat.assistant-actions', () =>
    ctx.slots.register(
      { name: 'conversation.chat.assistant-actions', id: NAMESPACE, order: 30, locale: NAMESPACE },
      AssistantAction
    )
  )
}
