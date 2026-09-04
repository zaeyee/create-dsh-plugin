/**
 * Minimal structural types for the config card's settings data path. Runtime
 * instances all come from ctx services (cordis ctx.get); importing nothing
 * from @deepseek-ai client packages here avoids cross-plugin value imports.
 * Full contracts: dsh-client-runtime's SettingsScope / SettingsScopeBinder.
 */

/** Synchronous snapshot of one settings namespace (subset of SettingsScopeSnapshot). */
export interface SettingsSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  /** Last schema-resolved value (schema defaults → base → user layer); undefined before the first accepted value. */
  value: unknown
  /** Raw stored user layer; a field present here counts as "user-overridden". */
  user: unknown
  /** Whether the host document is writable (memory mode is never writable). */
  writable: boolean
}

/** Minimal face of a browser-side settings scope (subset of dsh-client-runtime SettingsScope). */
export interface SettingsScopeLike {
  getSnapshot(): SettingsSnapshot
  /** Observe snapshot replacement; returns a disposer removing the listener. */
  subscribe(listener: () => void): () => void
  /** Write one field (revision-fenced; failed writes re-read the host state). */
  set(field: string, value: unknown): Promise<void>
  /** Clear one field so it inherits the composition base layer again. */
  unset(field: string): Promise<void>
}

/** Minimal face of the settingsScope service (dsh-client-ui-settings SettingsScopeBinder). */
export interface SettingsScopeBinderLike {
  bind(spec: { namespace: string }): SettingsScopeLike
}

// The settings binder runs in the browser half and its providing package
// (dsh-client-ui-settings) is not part of this template's dependency set, so
// the ctx typing arrives via a local declaration merge; the runtime instance
// comes from ctx.
declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Browser settings scope binder (provided at runtime by dsh-client-ui-settings). */
    settingsScope: SettingsScopeBinderLike
  }
}
