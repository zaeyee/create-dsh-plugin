#!/usr/bin/env node
/**
 * @zaeyee/create-dsh-plugin — generate a small, installable DSH plugin from selected
 * shapes: template fragment overlay + JSON deep merge + `.data.mjs` EJS data
 * chaining.
 *
 * Usage:
 *   node src/index.ts <target> --name dsh-my-plugin
 *   node src/index.ts <target> --name dsh-my-plugin \
 *     --with config,commands,tool,events,service,hook,client --ui all
 *   npm create dsh <target> -- --name dsh-my-plugin ...
 *
 * Runs in interactive mode when no --name is provided.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { intro, outro, text, confirm, multiselect, select, isCancel, cancel } from '@clack/prompts'
import ejs from 'ejs'
import picocolors from 'picocolors'
import { preOrderDirectoryTraverse, postOrderDirectoryTraverse } from './utils/directoryTraverse.ts'
import generateReadme from './utils/generateReadme.ts'
import getLanguage, { type Language } from './utils/getLanguage.ts'
import renderTemplate, { type DataStore, type RenderCallback } from './utils/renderTemplate.ts'

const { green, bold } = picocolors

const SHAPES = ['config', 'commands', 'tool', 'events', 'service', 'hook', 'client'] as const
const UI_SURFACES = [
  'shell-overlay',
  'config-card',
  'sidebar-action',
  'input-dock',
  'header-utilities',
  'input-left',
  'input-right',
  'commandview',
  'general-item',
  'plugins-tab',
  'settings-action',
  'header-actions',
  'composer-dock',
  'assistant-actions'
] as const
const UIS = [...UI_SURFACES, 'all'] as const
const STYLES = ['native', 'modules'] as const

const USAGE = `usage: create-dsh <target> --name <npm-package-name> [--with config,commands,tool,events,service,hook,client] [--ui <surface>[,<surface>...]|all] [--style native|modules]
       npm create @zaeyee/dsh-plugin <target> -- --name <npm-package-name> [--with ...] [--ui ...] [--style ...]

UI surfaces: ${UI_SURFACES.join(', ')}
--ui all selects every surface. config-card implies the config shape;
commandview implies the commands shape.
--style picks the client styling authoring format (requires --with client):
native (default) authors a plain styles.css with global dtpl-* classes;
modules authors styles.module.css with hashed scoped classes (adds lightningcss).

Runs in interactive mode when --name is not provided.`

function isValidName(name: string): boolean {
  return /^(@[a-z0-9-]+\/)?[a-z][a-z0-9-]*$/.test(name)
}

function toValidName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/^[._-]+/, '')
}

async function unwrapPrompt<T>(maybeCancelPromise: Promise<T | symbol>, language: Language): Promise<T> {
  const result = await maybeCancelPromise

  if (isCancel(result)) {
    cancel(`✖ ${language.errors.cancelled}`)
    process.exit(0)
  }
  return result as T
}

async function init(): Promise<void> {
  const cwd = process.cwd()
  const args = process.argv.slice(2)

  let argv
  let positionals: string[]
  try {
    ;({ values: argv, positionals } = parseArgs({
      args,
      options: {
        name: { type: 'string' },
        with: { type: 'string' },
        ui: { type: 'string' },
        style: { type: 'string' },
        force: { type: 'boolean' },
        help: { type: 'boolean' },
        version: { type: 'boolean' }
      },
      strict: true,
      allowPositionals: true
    }))
  } catch (error) {
    console.error(`${(error as Error).message}\n${USAGE}`)
    process.exit(1)
  }

  if (argv.help) {
    console.log(USAGE)
    process.exit(0)
  }

  if (argv.version) {
    const cliPackageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      name: string
      version: string
    }
    console.log(`${cliPackageJson.name} v${cliPackageJson.version}`)
    process.exit(0)
  }

  const language = await getLanguage(fileURLToPath(new URL('../locales', import.meta.url)))

  // Any --name provided means fully-specified non-interactive mode (CI friendly).
  const nonInteractive = Boolean(argv.name)
  let targetArg = positionals[0]
  let name: string
  let shapes: string[] = []
  let uiSelected: string[] = []
  let styleMode = 'native'

  if (nonInteractive) {
    if (!targetArg) {
      console.error(USAGE)
      process.exit(1)
    }
    name = argv.name!
    shapes = (argv.with ?? '').split(',').filter(Boolean)
    uiSelected = (argv.ui ?? '').split(',').filter(Boolean)
    styleMode = argv.style ?? 'native'
  } else {
    intro('@zaeyee/create-dsh-plugin')

    const suggested = toValidName(targetArg ?? 'dsh-my-plugin')
    name = (
      await unwrapPrompt(
        text({
          message: language.pluginName.message,
          placeholder: suggested,
          defaultValue: suggested,
          validate: value => (isValidName(value ?? '') ? undefined : language.pluginName.invalid)
        }),
        language
      )
    ).trim()

    if (!targetArg) {
      targetArg = name.replace(/^@[^/]+\//, '')
    }

    shapes = await unwrapPrompt(
      multiselect({
        message: `${language.shapes.message} ${language.shapes.hint}`,
        options: SHAPES.map(shape => ({ value: shape, label: language.shapes.options[shape]! })),
        required: false
      }),
      language
    )

    // The UI surface question only makes sense with the client shape.
    if (shapes.includes('client')) {
      uiSelected = await unwrapPrompt(
        multiselect({
          message: `${language.ui.message} ${language.ui.hint}`,
          options: UI_SURFACES.map(surface => ({
            value: surface,
            label: language.ui.options[surface]!
          })),
          required: false
        }),
        language
      )
      styleMode = await unwrapPrompt(
        select({
          message: `${language.style.message} ${language.style.hint}`,
          options: STYLES.map(mode => ({
            value: mode,
            label: language.style.options[mode]!
          })),
          initialValue: 'native'
        }),
        language
      )
    }
  }

  // ---- validation (parity with the original generator) ----
  if (!isValidName(name)) {
    console.error(`invalid --name "${name}"`)
    process.exit(1)
  }
  for (const shape of shapes) {
    if (!SHAPES.includes(shape as (typeof SHAPES)[number])) {
      console.error(`unknown shape "${shape}"; allowed: ${SHAPES.join(', ')}`)
      process.exit(1)
    }
  }
  for (const surface of uiSelected) {
    if (!UIS.includes(surface as (typeof UIS)[number])) {
      console.error(`unknown UI surface "${surface}"; allowed: ${UIS.join(', ')}`)
      process.exit(1)
    }
  }
  if (uiSelected.length > 0 && !shapes.includes('client')) {
    console.error('--ui requires --with client')
    process.exit(1)
  }
  if (!STYLES.includes(styleMode as (typeof STYLES)[number])) {
    console.error(`unknown style mode "${styleMode}"; allowed: ${STYLES.join(', ')}`)
    process.exit(1)
  }
  if (styleMode !== 'native' && !shapes.includes('client')) {
    console.error('--style requires --with client')
    process.exit(1)
  }

  // Expand the `all` alias, then auto-couple dependent shapes.
  if (uiSelected.includes('all')) {
    uiSelected = [...UI_SURFACES]
  }
  const selected = new Set(shapes)
  const implied: string[] = []
  if (uiSelected.includes('config-card') && !selected.has('config')) {
    selected.add('config')
    implied.push('config (settings wiring for config-card)')
  }
  if (uiSelected.includes('commandview') && !selected.has('commands')) {
    selected.add('commands')
    implied.push('commands (host half for commandview)')
  }
  for (const note of implied) {
    console.log(`note: --ui selection implies shape ${note}`)
  }

  // ---- target directory ----
  const target = path.resolve(cwd, targetArg!)
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    if (argv.force) {
      // proceed and empty below
    } else if (!nonInteractive) {
      const shouldOverwrite = await unwrapPrompt(
        confirm({
          message: language.overwrite.message,
          initialValue: false
        }),
        language
      )
      if (!shouldOverwrite) {
        cancel(`✖ ${language.errors.cancelled}`)
        process.exit(0)
      }
    } else {
      console.error(`target is not empty: ${target}`)
      process.exit(1)
    }
  }

  const pluginId = name.replace(/^@[^/]+\//, '')
  const clientEnabled = selected.has('client')
  const surfaces = Object.fromEntries(UI_SURFACES.map(surface => [surface, uiSelected.includes(surface)]))

  if (fs.existsSync(target)) {
    postOrderDirectoryTraverse(
      target,
      dir => fs.rmSync(dir, { recursive: true }),
      file => fs.unlinkSync(file)
    )
  } else {
    fs.mkdirSync(target, { recursive: true })
  }

  console.log(`\n${language.infos.scaffolding} ${target}...`)

  // ---- scaffold: minimal package.json, then overlay template fragments ----
  const root = target
  fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify({ name, version: '0.1.0' }, null, 2))

  const templateRoot = fileURLToPath(new URL('../template', import.meta.url))
  const callbacks: RenderCallback[] = []

  // Seed callback: inject user data into the shared dataStore BEFORE any
  // `.data.mjs` callback runs, so EJS templates and data files can read
  // name/pluginId/feature flags.
  callbacks.push(async (dataStore: DataStore) => {
    const seed = {
      name,
      pluginId,
      target,
      needsConfig: selected.has('config'),
      needsCommands: selected.has('commands'),
      needsTool: selected.has('tool'),
      needsEvents: selected.has('events'),
      needsService: selected.has('service'),
      needsHook: selected.has('hook'),
      clientEnabled,
      styleMode,
      surfaces
    }
    for (const rel of [
      'src/index.ts',
      'cordis.patch.yml',
      'test/smoke.mjs',
      'src/service.ts',
      'src/hook.ts',
      'src/client/index.tsx',
      'src/client/constants.ts',
      'src/client/locales/zh.json',
      'src/client/locales/en.json',
      'vite.config.ts',
      'pnpm-workspace.yaml'
    ]) {
      dataStore[path.resolve(root, rel)] = { ...seed }
    }
  })

  const render = function render(templateName: string): void {
    renderTemplate(path.resolve(templateRoot, templateName), root, callbacks)
  }

  // Render base template
  render('base')

  // Overlay each selected shape fragment
  for (const shape of SHAPES) {
    if (selected.has(shape)) {
      render(`shape/${shape}`)
    }
  }

  // Overlay the styling fragment (authoring format for the client half CSS)
  if (clientEnabled) {
    render(`style/${styleMode}`)
  }

  // An external data store for callbacks to share data
  const dataStore: DataStore = {}
  // Process callbacks (seed first, then `.data.mjs` chains in render order)
  for (const cb of callbacks) {
    await cb(dataStore)
  }

  // EJS template rendering pass
  preOrderDirectoryTraverse(
    root,
    () => {},
    filepath => {
      if (filepath.endsWith('.ejs')) {
        const template = fs.readFileSync(filepath, 'utf8')
        const dest = filepath.replace(/\.ejs$/, '')
        const content = ejs.render(template, dataStore[dest] ?? {})
        fs.writeFileSync(dest, content)
        fs.unlinkSync(filepath)
      }
    }
  )

  // Prune client surface modules the user did not select: the client fragment
  // ships every surface file; only the chosen ones survive generation.
  if (clientEnabled) {
    for (const surface of UI_SURFACES) {
      if (!surfaces[surface]) {
        const file = path.resolve(root, 'src/client', `${surface}.tsx`)
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      }
    }
  }

  // README generation
  fs.writeFileSync(
    path.resolve(root, 'README.md'),
    generateReadme({
      name,
      shapes: [...selected],
      surfaces: uiSelected,
      clientEnabled
    })
  )

  // ---- outro ----
  const shapesLine = selected.size === 0 ? 'hello only' : [...selected].join(', ')
  if (nonInteractive) {
    console.log(`created ${name} at ${target}`)
    console.log(`shapes: ${shapesLine}`)
    if (clientEnabled) {
      const surfacesLine = uiSelected.length === 0 ? 'none' : uiSelected.join(', ')
      console.log(`ui surfaces: ${surfacesLine}`)
    }
    console.log('next: cd target && pnpm install && pnpm check')
  } else {
    outro(
      `${language.infos.done}\n\n` +
        `   ${bold(green(`cd ${targetArg}`))}\n` +
        `   ${bold(green('pnpm install'))}\n` +
        `   ${bold(green('pnpm check'))}`
    )
  }
}

init().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
