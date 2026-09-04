/**
 * Global floating layer (shell.overlay slot): a dismissible demo pill on the
 * frame-wide overlay. Root-level list — one entry is one floating element.
 * Layout note: the layer is a bare inset:0 frame with no entry layout, so
 * entries position themselves (toast-style fixed bottom-right via styles.ts)
 * and bring a close button to avoid covering anything. The layer itself is
 * click-through; entries opt back into pointer events.
 * Reference: ui-layout declares this slot; it is the one additive seat with a
 * published type surface, so PropsRuntime resolves against the real package.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface ShellOverlayProps extends PropsRuntime<'shell.overlay'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** Demo pill on the `shell.overlay` layer with a dismiss button. */
export function ShellOverlay({ t }: ShellOverlayProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="dtpl-overlay" role="status">
      <span>{t('shellOverlay.text')}</span>
      <button
        type="button"
        className="dtpl-overlay-close"
        aria-label={t('shellOverlay.close')}
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  )
}

/** Register the demo pill on `shell.overlay`. */
export function registerShellOverlay(ctx: ClientContext): void {
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register({ name: 'shell.overlay', id: NAMESPACE, order: 30, locale: NAMESPACE }, ShellOverlay)
  )
}
