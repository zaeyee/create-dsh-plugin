/**
 * Config card (settings.plugin.item slot): registers a card in
 * Settings → Plugins → Configurable so greeting / maxRetries / verbose can be
 * edited in the GUI.
 *
 * Data path: the host half (the config shape's installSettingsSection)
 * registers the config as a settings namespace (the cordis.yml config is the
 * composition base layer); this module binds that namespace through the
 * settingsScope service, reads the resolved value, renders the form, and
 * writes user edits into the user settings document (revision-fenced); the
 * host half reads the resolved namespace value live, so saves take effect
 * immediately.
 *
 * Out-of-the-box note: the card renders in every state. The harness web
 * gateway only exposes whitelisted settings namespaces to the settings panel
 * (WEB_SETTINGS_NAMESPACES); when a third-party namespace is not on the list,
 * settings.describe answers settings-not-exposed — the card then renders an
 * explanatory status instead of silently disappearing. The restriction only
 * affects the card's editability, never the host half (the greet tool still
 * reads config live).
 *
 * UI structure mirrors the harness built-in settings cards
 * (ui-settings-plugins: WebSearchCard / PluginCard / ValueField / card-form).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChangeEvent, ReactElement } from 'react'
import type { LocaleKey } from './index.tsx'
import type { SettingsScopeBinderLike, SettingsScopeLike } from './types.ts'
import { useEffect, useReducer, useState } from 'react'
import { NAMESPACE } from './constants.ts'

// ---- field declarations ----

type FieldKind = 'text' | 'number' | 'checkbox'

interface FieldSpec {
  field: string
  kind: FieldKind
  labelKey: LocaleKey
  hintKey: LocaleKey
  /** Hint shown while the draft is invalid (number fields use it). */
  invalidKey?: LocaleKey
}

const FIELDS: readonly FieldSpec[] = [
  {
    field: 'greeting',
    kind: 'text',
    labelKey: 'configCard.fieldGreeting.label',
    hintKey: 'configCard.fieldGreeting.hint'
  },
  {
    field: 'maxRetries',
    kind: 'number',
    labelKey: 'configCard.fieldMaxRetries.label',
    hintKey: 'configCard.fieldMaxRetries.hint',
    invalidKey: 'configCard.fieldMaxRetries.invalid'
  },
  {
    field: 'verbose',
    kind: 'checkbox',
    labelKey: 'configCard.fieldVerbose.label',
    hintKey: 'configCard.fieldVerbose.hint'
  }
]

// ---- staged form model (semantics mirror the harness card-form) ----

/** One staged edit: text fields hold {edit|clear}, checkbox fields hold {toggle}. */
type StagedEdit = { kind: 'edit'; text: string } | { kind: 'clear' } | { kind: 'toggle'; value: boolean }

/** Render state of one field (consumed by the field row). */
interface FieldState {
  /** Draft / current value of text-like fields. */
  text?: string
  /** Checked state of checkbox-like fields. */
  checked?: boolean
  /** Whether saving would leave a user-layer override (the "overridden" badge). */
  overridden: boolean
  /** The draft is not an acceptable value for this field. */
  invalid: boolean
}

/** Card-level state (mirrors the harness PluginCard's CardShell). */
interface CardShell {
  /** Namespace snapshot status; only 'ready' renders the editable form, others render a status card. */
  status: 'loading' | 'ready' | 'unavailable'
  /** Whether editing is possible (status === 'ready'). */
  available: boolean
  writable: boolean
  dirty: boolean
  invalid: boolean
  saving: boolean
  failed: boolean
}

/** One write a save would perform; run === undefined marks an invalid draft. */
interface PlannedWrite {
  field: string
  run: (() => Promise<boolean>) | undefined
}

/** Staged form: edits only touch drafts, Save is the single write point; after saving the accepted host result is read back. */
class CardForm {
  private readonly staged = new Map<string, StagedEdit>()
  private readonly listeners = new Set<() => void>()
  private saving = false
  private failed = false

  constructor(private readonly scope: SettingsScopeLike) {
    scope.subscribe(() => this.publish())
  }

  /** Subscribe to form changes (draft edits or snapshot refresh); returns a disposer. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Card-level state. */
  shell(): CardShell {
    const snapshot = this.scope.getSnapshot()
    const plan = this.plan()
    return {
      status: snapshot.status,
      available: snapshot.status === 'ready',
      writable: snapshot.writable,
      dirty: plan.length > 0,
      invalid: plan.some(item => item.run === undefined),
      saving: this.saving,
      failed: this.failed
    }
  }

  /** Render state of one field. */
  fieldState(field: string): FieldState {
    const spec = this.spec(field)
    const staged = this.staged.get(field)
    const section = this.sectionValue()
    const stored = this.stored(field)
    if (spec.kind === 'checkbox') {
      if (staged === undefined) return { checked: section[field] === true, overridden: stored, invalid: false }
      if (staged.kind === 'toggle') return { checked: staged.value, overridden: true, invalid: false }
      return { checked: section[field] === true, overridden: false, invalid: false }
    }
    if (staged === undefined) {
      return { text: this.format(spec, section[field]), overridden: stored, invalid: false }
    }
    if (staged.kind === 'clear') {
      return { text: this.format(spec, section[field]), overridden: false, invalid: false }
    }
    // Text fields only stage { kind: 'edit' } (toggle belongs to checkboxes, returned above).
    if (staged.kind !== 'edit') {
      return { text: '', overridden: false, invalid: false }
    }
    const parsed = this.parse(spec, staged.text)
    return { text: staged.text, overridden: parsed?.kind === 'set', invalid: parsed === undefined }
  }

  /** Stage one text edit. */
  edit(field: string, text: string): void {
    this.staged.set(field, { kind: 'edit', text })
    this.failed = false
    this.publish()
  }

  /** Stage one checkbox toggle. */
  toggle(field: string, value: boolean): void {
    this.staged.set(field, { kind: 'toggle', value })
    this.failed = false
    this.publish()
  }

  /** Stage one clear: save will unset, the field falls back to the composition base layer. */
  resetField(field: string): void {
    this.staged.set(field, { kind: 'clear' })
    this.failed = false
    this.publish()
  }

  /** Drop all staged edits. */
  discard(): void {
    if (this.staged.size === 0 && !this.failed) return
    this.staged.clear()
    this.failed = false
    this.publish()
  }

  /**
   * Write every staged edit, then read back the accepted host result.
   * On failure the drafts stay so the user can fix them instead of retyping.
   */
  async save(): Promise<void> {
    const plan = this.plan()
    const writes = plan.flatMap(item => (item.run === undefined ? [] : [item.run]))
    if (plan.length === 0 || this.saving || writes.length !== plan.length) return
    this.saving = true
    this.failed = false
    this.publish()
    let landed = true
    for (const write of writes) {
      landed = (await write()) && landed
    }
    if (landed) this.staged.clear()
    this.saving = false
    this.failed = !landed
    this.publish()
  }

  /** The writes one save would perform, in staging order. */
  private plan(): PlannedWrite[] {
    const plan: PlannedWrite[] = []
    for (const [field, staged] of this.staged) {
      const spec = this.spec(field)
      if (staged.kind === 'toggle') {
        plan.push({ field, run: () => this.store(field, staged.value) })
        continue
      }
      if (staged.kind === 'clear') {
        if (this.stored(field)) plan.push({ field, run: () => this.clear(field) })
        continue
      }
      if (staged.text === this.format(spec, this.sectionValue()[field])) continue
      const parsed = this.parse(spec, staged.text)
      if (parsed === undefined) plan.push({ field, run: undefined })
      else if (parsed.kind === 'clear') plan.push({ field, run: () => this.clear(field) })
      else plan.push({ field, run: () => this.store(field, parsed.value) })
    }
    return plan
  }

  private async store(field: string, value: unknown): Promise<boolean> {
    await this.scope.set(field, value)
    return this.stored(field) && this.sectionValue()[field] === value
  }

  private async clear(field: string): Promise<boolean> {
    await this.scope.unset(field)
    return !this.stored(field)
  }

  private sectionValue(): Record<string, unknown> {
    const value = this.scope.getSnapshot().value
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  }

  private stored(field: string): boolean {
    const user = this.scope.getSnapshot().user
    return typeof user === 'object' && user !== null && Object.prototype.hasOwnProperty.call(user, field)
  }

  private spec(field: string): FieldSpec {
    const spec = FIELDS.find(candidate => candidate.field === field)
    if (spec === undefined) throw new Error(`card has no field ${field}`)
    return spec
  }

  private format(spec: FieldSpec, value: unknown): string {
    if (spec.kind === 'number') return typeof value === 'number' ? String(value) : ''
    return typeof value === 'string' ? value : ''
  }

  private parse(spec: FieldSpec, text: string): { kind: 'set'; value: unknown } | { kind: 'clear' } | undefined {
    if (spec.kind === 'number') {
      if (text === '') return undefined
      const value = Number(text)
      if (!Number.isInteger(value) || value < 0) return undefined
      return { kind: 'set', value }
    }
    if (text === '') return { kind: 'clear' }
    return { kind: 'set', value: text }
  }

  private publish(): void {
    for (const listener of this.listeners) listener()
  }
}

// ---- registration ----

/**
 * Register the config card on `settings.plugin.item`.
 * settingsScope is an optional capability of the settings UI; when absent the
 * card renders the unmounted status instead of disappearing.
 */
export function registerConfigCard(ctx: ClientContext): void {
  let form: CardForm | undefined
  const settingsScope: SettingsScopeBinderLike | null | undefined = ctx.get('settingsScope')
  if (settingsScope == null) {
    console.warn(`[${NAMESPACE}] settingsScope service absent; the config card shows the unmounted state`)
  } else {
    form = new CardForm(settingsScope.bind({ namespace: NAMESPACE }))
  }

  ctx.slots.inject('settings.plugin.item', () =>
    ctx.slots.register(
      { name: 'settings.plugin.item', id: NAMESPACE, order: 30, label: NAMESPACE, locale: NAMESPACE },
      props => <ConfigCard {...props} form={form} />
    )
  )
}

// ---- card UI ----

export interface ConfigCardProps extends PropsRuntime<'settings.plugin.item'> {
  form: CardForm | undefined
  t: TranslateNS<typeof NAMESPACE>
}

/**
 * Config card: collapsible header + staged form + save/discard.
 *
 * Hook discipline: every hook (useReducer / useState / useEffect) must sit
 * before ANY early return — when the namespace flips from loading to ready
 * the component re-renders; a useState placed after an "unavailable → return
 * null" would change the hook count between renders and React throws
 * "Rendered more hooks than during the previous render", crashing the card.
 *
 * State matrix (the card ALWAYS renders, never silently disappears):
 * - form undefined: the settingsScope service is not mounted (non-web
 *   profile) → render the unmounted explanation;
 * - status 'loading': still reading the namespace → render the reading note;
 * - status 'unavailable': the namespace is not exposed to the web (the
 *   harness WEB_SETTINGS_NAMESPACES whitelist, see the header comment) or the
 *   settings service is not registered → render the not-exposed explanation
 *   with two remedies;
 * - status 'ready': render the editable form.
 */
function ConfigCard({ form, t }: ConfigCardProps): ReactElement | null {
  const [, forceRender] = useReducer((count: number) => count + 1, 0)
  const [open, setOpen] = useState(false)
  useEffect(() => (form === undefined ? undefined : form.subscribe(forceRender)), [form])

  if (form === undefined) {
    return statusCard(t('configCard.unmounted.title'), t('configCard.unmounted.body'))
  }

  const shell = form.shell()
  if (!shell.available) {
    if (shell.status === 'unavailable') {
      return statusCard(
        t('configCard.notExposed.title', { ns: NAMESPACE }),
        t('configCard.notExposed.body'),
        t('configCard.notExposed.remedy', { ns: NAMESPACE })
      )
    }
    return statusCard(t('configCard.loading.title'), t('configCard.loading.body'))
  }

  const blocked = !shell.dirty || shell.invalid || shell.saving

  return (
    <li className={open ? 'dtpl-card dtpl-card-open' : 'dtpl-card'}>
      <button type="button" className="dtpl-header" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="dtpl-head-text">
          <span className="dtpl-name">{NAMESPACE}</span>
          <span className="dtpl-description">{t('configCard.description')}</span>
        </span>
        {shell.dirty ? <span className="dtpl-pending">{t('configCard.unsaved')}</span> : null}
        {chevron(open)}
      </button>
      {open ? (
        <div className="dtpl-body">
          {!shell.writable ? (
            <p className="dtpl-read-only" role="status">
              {t('configCard.readOnly')}
            </p>
          ) : null}
          {FIELDS.map(spec => renderField(form, spec, shell, t))}
          <div className="dtpl-footer">
            {shell.failed ? (
              <p className="dtpl-failed" role="status">
                {t('configCard.saveFailed')}
              </p>
            ) : null}
            <button
              type="button"
              className="dtpl-discard"
              disabled={!shell.dirty || shell.saving}
              onClick={() => form.discard()}
            >
              {t('configCard.discard')}
            </button>
            <button
              type="button"
              className="dtpl-save"
              disabled={blocked}
              onClick={() => {
                void form.save()
              }}
            >
              {shell.saving ? t('configCard.saving') : t('configCard.save')}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  )
}

/**
 * The same expand chevron as the built-in PluginCard (ui-primitives'
 * IconChevronDownOutline14): the identical 14×14 SVG inlined (viewBox and
 * path verbatim, fill follows currentColor via the dtpl-chevron style), so it
 * looks exactly like the built-in card. ui-primitives is not imported: the
 * browser-side platform package is not in this template's dependency set
 * (and would pull the whole markdown render tree); the inlined glyph adds
 * zero dependencies and zero drift risk.
 */
function chevron(open: boolean): ReactElement {
  return (
    <svg
      className={open ? 'dtpl-chevron dtpl-chevron-open' : 'dtpl-chevron'}
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Render a read-only status card (unmounted / loading / not exposed) — explain, never silently disappear. */
function statusCard(title: string, body: string, remedy?: string): ReactElement {
  return (
    <li className="dtpl-card">
      <div className="dtpl-status">
        <p className="dtpl-status-title">{title}</p>
        <p className="dtpl-status-body">{body}</p>
        {remedy === undefined ? null : <p className="dtpl-status-body">{remedy}</p>}
      </div>
    </li>
  )
}

/** Render one field row: label + override badge/reset + control + hint. */
function renderField(
  form: CardForm,
  spec: FieldSpec,
  shell: CardShell,
  t: TranslateNS<typeof NAMESPACE>
): ReactElement {
  const state = form.fieldState(spec.field)
  const disabled = !shell.writable

  let control: ReactElement
  if (spec.kind === 'checkbox') {
    control = (
      <input
        id={`dtpl-${spec.field}`}
        type="checkbox"
        checked={state.checked === true}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => form.toggle(spec.field, event.target.checked)}
      />
    )
  } else {
    control = (
      <input
        id={`dtpl-${spec.field}`}
        className={state.invalid ? 'dtpl-input dtpl-input-invalid' : 'dtpl-input'}
        type="text"
        {...(spec.kind === 'number' ? { inputMode: 'numeric' as const } : {})}
        {...(state.invalid ? { 'aria-invalid': true } : {})}
        value={state.text ?? ''}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => form.edit(spec.field, event.target.value)}
      />
    )
  }

  return (
    <div className="dtpl-field" key={spec.field}>
      <div className="dtpl-field-head">
        <label className="dtpl-label" htmlFor={`dtpl-${spec.field}`}>
          {t(spec.labelKey)}
        </label>
        {state.overridden ? (
          <span className="dtpl-badges">
            <span className="dtpl-badge">{t('configCard.overridden')}</span>
            <button
              type="button"
              className="dtpl-reset"
              disabled={disabled}
              onClick={() => form.resetField(spec.field)}
            >
              {t('configCard.reset')}
            </button>
          </span>
        ) : null}
      </div>
      {control}
      <p className={state.invalid ? 'dtpl-invalid' : 'dtpl-hint'}>
        {state.invalid ? t(spec.invalidKey ?? 'configCard.invalidValue') : t(spec.hintKey)}
      </p>
    </div>
  )
}
