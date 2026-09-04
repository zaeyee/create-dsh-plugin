/**
 * Plugins-page tab (settings.plugins.tab slot): one extra tab inside
 * Settings → Plugins. Root-level list; the option's label is the tab text (a
 * plain string or a locale-following thunk — this demo uses the namespace as
 * a locale-neutral label), and id/order decide position. The tab content
 * itself renders through the typed `t` seat.
 * Reference: ui-settings-plugin-inventory (the plugin inventory tab, id 'all').
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NAMESPACE } from './constants.ts'

export interface PluginsTabProps extends PropsRuntime<'settings.plugins.tab'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** Tab content: a couple of explanatory lines. */
export function PluginsTab({ t }: PluginsTabProps) {
  return (
    <div className="dtpl-tab-content">
      <p>{t('pluginsTab.line1')}</p>
      <p>{t('pluginsTab.line2')}</p>
    </div>
  )
}

/** Register the demo tab on `settings.plugins.tab`. */
export function registerPluginsTab(ctx: ClientContext): void {
  ctx.slots.inject('settings.plugins.tab', () =>
    ctx.slots.register(
      { name: 'settings.plugins.tab', id: NAMESPACE, order: 30, label: NAMESPACE, locale: NAMESPACE },
      PluginsTab
    )
  )
}
