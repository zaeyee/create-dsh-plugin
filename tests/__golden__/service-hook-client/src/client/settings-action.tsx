/**
 * Settings-panel header action (settings.action slot): an action button in
 * the settings panel's content-column header, before the close button.
 * Root-level list; registrants own visibility, behavior, copy and failure
 * presentation.
 * Reference: ui-settings-general declares this slot at runtime.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface SettingsActionProps extends PropsRuntime<'settings.action'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** A toggle-able header action button (local state; demoes the button seat). */
export function SettingsAction({ t }: SettingsActionProps) {
  const [armed, setArmed] = useState(false)
  return (
    <button type="button" className="dtpl-btn" aria-pressed={armed} onClick={() => setArmed(!armed)}>
      <span>{armed ? t('settingsAction.lit') : t('settingsAction.label')}</span>
    </button>
  )
}

/** Register the demo action button on `settings.action`. */
export function registerSettingsAction(ctx: ClientContext): void {
  ctx.slots.inject('settings.action', () =>
    ctx.slots.register({ name: 'settings.action', id: NAMESPACE, order: 30, locale: NAMESPACE }, SettingsAction)
  )
}
