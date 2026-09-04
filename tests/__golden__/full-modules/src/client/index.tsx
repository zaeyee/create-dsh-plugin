/**
 * Client half entry: assemble the selected UI surfaces and export the
 * inject / apply the cordis loader needs. Each surface is its own module
 * register functions run in order inside apply.
 *
 * Registration options carry `locale: NAMESPACE`, which puts the framework-
 * synthesized typed `t` seat on every surface component's props; the zh/en
 * dictionaries live in locales/ (contract in locales.ts). styles.css is
 * side-effect imported here and injected at build time by the CSS plugin
 * (see vite.config.ts); class names are plain globals.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { registerAssistantAction } from './assistant-actions.tsx'
import { registerCommandView } from './commandview.tsx'
import { registerComposerDock } from './composer-dock.tsx'
import { registerConfigCard } from './config-card.tsx'
import { registerGeneralItem } from './general-item.tsx'
import { registerHeaderAction } from './header-actions.tsx'
import { registerHeaderUtility } from './header-utilities.tsx'
import { registerInputDock } from './input-dock.tsx'
import { registerInputLeft } from './input-left.tsx'
import { registerInputRight } from './input-right.tsx'
import { NS, dictionaries } from './locales.ts'
import { registerPluginsTab } from './plugins-tab.tsx'
import { registerSettingsAction } from './settings-action.tsx'
import { registerShellOverlay } from './shell-overlay.tsx'
import { registerSidebarAction } from './sidebar-action.tsx'
import './styles.css'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-smoke-full-mods': keyof typeof dictionaries.zh
  }
}

/** All dictionary keys of this namespace (for surface modules' typed t calls). */
export type LocaleKey = keyof typeof dictionaries.zh

/** Required services: slots (render seats) + locale (typed dictionaries). */
export const inject = ['slots', 'locale']

/** Client plugin body: register dictionaries, then surfaces in order. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const disposers = [ctx.locale.register(NS, 'zh', dictionaries.zh), ctx.locale.register(NS, 'en', dictionaries.en)]
    return () => disposers.forEach(dispose => dispose())
  }, 'dsh-smoke-full-mods: dictionaries')
  registerShellOverlay(ctx)
  registerConfigCard(ctx)
  registerSidebarAction(ctx)
  registerInputDock(ctx)
  registerHeaderUtility(ctx)
  registerInputLeft(ctx)
  registerInputRight(ctx)
  registerCommandView(ctx)
  registerGeneralItem(ctx)
  registerPluginsTab(ctx)
  registerSettingsAction(ctx)
  registerHeaderAction(ctx)
  registerComposerDock(ctx)
  registerAssistantAction(ctx)
}
