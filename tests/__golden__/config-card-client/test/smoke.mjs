import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as root from '../lib/index.js'

assert.equal(root.name, 'dsh-golden-ccc')
assert.equal(typeof root.apply, 'function')

// ---------- host root: apply() on a minimal ctx ----------
// effect doubles do NOT run the callbacks (the config heartbeat owns a real
// setInterval that would keep the process alive).
const registered = []
const registeredCommands = []
const baseCtx = {
  effect: () => () => {},
  on: () => () => {},
  inject: (names, callback) => {
    if (names.includes('commands'))
      callback({ commands: { register: definition => registeredCommands.push(definition) } })
    return () => {}
  },
  tools: { register: definition => registered.push(definition) }
}
const config = { greeting: 'Hi', maxRetries: 5, verbose: false }
root.apply(baseCtx, config)
assert.equal(root.inject, undefined)
// ---------- config shape: settings namespace wiring, live reads ----------
// installSettingsSection injects ['settings']; when the service never
// arrives the composition entry stays the config source (fallback parity).
{
  let liveValue = { greeting: 'Hey', maxRetries: 3, verbose: false }
  const settingsCtx = {
    settings: {
      register(namespace, schema, options) {
        assert.equal(namespace, 'dsh-golden-ccc')
        assert.equal(options.base, config, 'composition entry is the settings base layer')
        return { get: () => liveValue, watch: () => () => {} }
      }
    },
    effect: () => () => {}
  }
  const liveRegistered = []
  const liveCtx = {
    tools: { register: definition => liveRegistered.push(definition) },
    on: () => () => {},
    effect: () => () => {},
    inject: (names, callback) => {
      if (names.includes('settings')) callback(settingsCtx)
      if (names.includes('commands')) callback({ commands: { register: () => {} } })
      return () => {}
    }
  }
  root.apply(liveCtx, config)
}

console.log('ok: host root imports and selected shapes apply')

// ---------- client half: ModuleLoader envelope + surface registrations ----------
if (existsSync(new URL('../lib/client.js', import.meta.url))) {
  const nodeRequire = createRequire(import.meta.url)
  const react = nodeRequire('react')
  let entry
  globalThis.window = {
    __ModuleLoader__: {
      load: value => {
        entry = value
      }
    }
  }
  new Function(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'))()
  assert.equal(entry.id, 'dsh-golden-ccc')
  const table = entry.factory(specifier => {
    if (specifier === 'react') return react
    if (specifier === 'react/jsx-runtime') return nodeRequire('react/jsx-runtime')
    throw new Error(`unexpected runtime import: ${specifier}`)
  })
  assert.equal(typeof table.apply, 'function')
  const calls = { locale: [], entries: [] }
  table.apply({
    effect: fn => fn(),
    get: () => undefined,
    locale: {
      register: (ns, locale, dictionary) => {
        calls.locale.push({ ns, locale, dictionary })
        return () => {}
      }
    },
    sessions: { open: () => {} },
    slots: {
      inject: (_name, register) => register(),
      register: (options, component) => calls.entries.push({ options, component })
    }
  })
  assert.equal(calls.locale.length, 2, 'zh + en dictionaries registered')
  const expected = ['settings.plugin.item']
  const actual = calls.entries.map(registration => registration.options.name).sort()
  assert.deepEqual(actual, [...expected].sort(), 'exactly the selected UI surfaces registered')
  for (const registration of calls.entries) {
    assert.equal(typeof registration.component, 'function')
  }
  // Runtime render proof: styles.css is injected as written, so a rendered
  // surface must carry its literal dtpl-* class name.
  if (calls.entries.length > 0) {
    const { renderToString } = nodeRequire('react-dom/server')
    const html = renderToString(react.createElement(calls.entries[0].component, { t: key => key }))
    const renderedClass = (html.match(/class="([^"]+)"/) ?? [])[1]
    assert.ok(renderedClass, 'surface component renders with a class name')
    assert.ok(renderedClass.startsWith('dtpl-'), `surface renders its literal class name (got ${renderedClass})`)
  }
  console.log(`ok: client envelope materializes and registers ${expected.length} surface(s)`)
}
console.log('ALL CHECKS PASSED')
