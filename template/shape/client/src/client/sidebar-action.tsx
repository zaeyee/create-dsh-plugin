/**
 * Sidebar-foot action (sidebar.footer.action slot): a demo button beside
 * Settings at the bottom of the left column. Root-level list — one entry is
 * one button; the owner passes only the column's wide/narrow state, and the
 * component decides between the full label and the icon-only rail form.
 * Reference: ui-sidebar declares this slot at runtime (no built-in entries —
 * an open additive seat).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface SidebarActionProps extends PropsRuntime<'sidebar.footer.action'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** Sidebar-foot button: full label in the wide column, status dot only on the rail. */
export function SidebarAction({ t, wide }: SidebarActionProps) {
  const [lit, setLit] = useState(false)
  return (
    <button type="button" className="dtpl-sidebar-action" aria-pressed={lit} onClick={() => setLit(!lit)}>
      <span className="dtpl-sidebar-dot">{lit ? '●' : '○'}</span>
      {wide === false ? null : <span>{t('sidebarAction.label')}</span>}
    </button>
  )
}

/** Register the demo button on `sidebar.footer.action`. */
export function registerSidebarAction(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register({ name: 'sidebar.footer.action', id: NAMESPACE, order: 30, locale: NAMESPACE }, SidebarAction)
  )
}
