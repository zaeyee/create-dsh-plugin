/**
 * General-settings preference row (settings.general.item slot): one row inside
 * Settings → General. Root-level list — one entry is one row; the row is
 * self-contained (label, current value and write path are all its own — see
 * the built-in language / appearance / composer-enter rows). This demo is a
 * local-state toggle; it does NOT touch the settings namespace (that data
 * path belongs to the config card).
 * Reference: ui-settings-general declares this slot at runtime.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface GeneralItemProps extends PropsRuntime<'settings.general.item'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** One "demo preference" row (local state; demoes the self-contained row style). */
export function GeneralItem({ t }: GeneralItemProps) {
  const [enabled, setEnabled] = useState(false)
  return (
    <label className="dtpl-general-row">
      <span>{t('generalItem.label')}</span>
      <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} />
    </label>
  )
}

/** Register the demo preference row on `settings.general.item`. */
export function registerGeneralItem(ctx: ClientContext): void {
  ctx.slots.inject('settings.general.item', () =>
    ctx.slots.register({ name: 'settings.general.item', id: NAMESPACE, order: 30, locale: NAMESPACE }, GeneralItem)
  )
}
