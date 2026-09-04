/**
 * Session-header action (conversation.session.header.actions slot): a button
 * in the action row beside the conversation title. Session-level list;
 * entries render in ascending order (negative values are reserved for the
 * static session context).
 * Reference: ui-agent-preset / ui-jobs / ui-subagent all register buttons here.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface HeaderActionProps extends PropsRuntime<'conversation.session.header.actions'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** A toggle-able session-header button. */
export function HeaderAction({ t }: HeaderActionProps) {
  const [lit, setLit] = useState(false)
  return (
    <button type="button" className="dtpl-btn" aria-pressed={lit} onClick={() => setLit(!lit)}>
      <span className="dtpl-sidebar-dot">{lit ? '●' : '○'}</span>
      <span>{t('headerActions.label')}</span>
    </button>
  )
}

/** Register the demo button on `conversation.session.header.actions`. */
export function registerHeaderAction(ctx: ClientContext): void {
  ctx.slots.inject('conversation.session.header.actions', () =>
    ctx.slots.register(
      { name: 'conversation.session.header.actions', id: NAMESPACE, order: 30, locale: NAMESPACE },
      HeaderAction
    )
  )
}
