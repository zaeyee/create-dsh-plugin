/**
 * Composer-foot status strip (conversation.composer.dock slot): one line of
 * status text below the input card (still inside the card's width column).
 * Session-level list; unlike input.dock this slot renders INSIDE the composer
 * bar's footer and the width inherits the card column constraint — full
 * alignment with the built-in StatsLine: margin auto centering + centered
 * text (styles.ts), no own positioning needed.
 * Reference: ui-conversation's own StatsLine (id 'stats').
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NAMESPACE } from './constants.ts'

export interface ComposerDockProps extends PropsRuntime<'conversation.composer.dock'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** One line of status text below the input card. */
export function ComposerDock({ t }: ComposerDockProps) {
  return <div className="dtpl-composer-strip">{t('composerDock.text')}</div>
}

/** Register the demo status strip on `conversation.composer.dock`. */
export function registerComposerDock(ctx: ClientContext): void {
  ctx.slots.inject('conversation.composer.dock', () =>
    ctx.slots.register(
      { name: 'conversation.composer.dock', id: NAMESPACE, order: 30, locale: NAMESPACE },
      ComposerDock
    )
  )
}
