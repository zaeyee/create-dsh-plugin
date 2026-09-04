/**
 * Session-header utility badge (conversation.session.header.utilities slot):
 * a right-aligned utility badge next to the conversation title. Session-level
 * list; separate from header.actions (the action button row) so the title's
 * interactive space stays uncrowded.
 * Reference: ui-conversation declares this slot at runtime (no built-in
 * entries — an open additive seat).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NAMESPACE } from './constants.ts'

export interface HeaderUtilityProps extends PropsRuntime<'conversation.session.header.utilities'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** Right-aligned utility badge showing the first 8 chars of the session id. */
export function HeaderUtility({ t, sessionId }: HeaderUtilityProps) {
  const short = sessionId === undefined ? '—' : sessionId.slice(0, 8)
  return (
    <span className="dtpl-header-util">
      {t('headerUtilities.label')} · {short}
    </span>
  )
}

/** Register the demo utility badge on `conversation.session.header.utilities`. */
export function registerHeaderUtility(ctx: ClientContext): void {
  ctx.slots.inject('conversation.session.header.utilities', () =>
    ctx.slots.register(
      { name: 'conversation.session.header.utilities', id: NAMESPACE, order: 30, locale: NAMESPACE },
      HeaderUtility
    )
  )
}
