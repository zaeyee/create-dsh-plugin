/**
 * Composer-top dock (conversation.input.dock slot): a status strip above the
 * input card. Session-level list — the framework standard props carry the
 * resolved sessionId; live data should go through the framework hooks
 * (props.useSession), never component-side subscriptions.
 * Layout note: the slot renders as a full-width row; width and centering are
 * the entry's own job (styles.ts aligns with the input card via the
 * --dsh-composer-* variables, like the built-in QueueDock).
 * Reference: ui-goal's GoalDock uses this slot (id 'goal', order 10).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NAMESPACE } from './constants.ts'

export interface InputDockProps extends PropsRuntime<'conversation.input.dock'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** Status strip above the input card showing the framework-resolved session id. */
export function InputDock({ t, sessionId }: InputDockProps) {
  return (
    <div className="dtpl-dock">
      <span>{t('inputDock.label')}</span>
      <span className="dtpl-dock-id">{sessionId ?? t('inputDock.waiting')}</span>
      <span>{t('inputDock.note')}</span>
    </div>
  )
}

/** Register the demo status strip on `conversation.input.dock`. */
export function registerInputDock(ctx: ClientContext): void {
  ctx.slots.inject('conversation.input.dock', () =>
    ctx.slots.register({ name: 'conversation.input.dock', id: NAMESPACE, order: 30, locale: NAMESPACE }, InputDock)
  )
}
