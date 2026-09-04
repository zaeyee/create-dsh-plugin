# create-dsh-plugin

> Scaffolding generator for DeepSeek Harness (DSH) plugins — pick the capabilities you need, get a strict-typed, build-ready project.

[![npm: @zaeyee/create-dsh-plugin](https://img.shields.io/npm/v/@zaeyee/create-dsh-plugin.svg)](https://www.npmjs.com/package/@zaeyee/create-dsh-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node: ≥22.18](https://img.shields.io/badge/node-%E2%89%A522.18-green.svg)](#requirements)

English | [中文](README.zh.md)

## Features

- 🧩 **7 composable shapes** — GUI-editable config with live settings, slash commands, a model tool with render intent, typed events, a separately mountable service, a permission-gate hook, and a browser client half.
- 🖥 **14 opt-in UI surfaces** — slots-based surfaces with framework-synthesized typed `t` props and zh/en dictionaries.
- 🎨 **Two CSS setups** — plain global CSS (zero extra deps), or CSS Modules support via lightningcss.
- ⚡ **Vite+ toolchain** — one `vite.config.ts` drives dual host/browser builds, format/lint/type checks, and git hooks.
- ✅ **Verified output** — generated projects pass strict tsc, dual builds, and runtime smoke tests out of the box; the generator itself is snapshot-tested across 448 shape/style combinations.
- 🌐 **Bilingual CLI** — interactive prompts follow your locale (en-US / zh-Hans).

## Requirements

- Node.js ≥ 22.18
- pnpm ≥ 11

## Quick start

```sh
# Non-interactive (CI friendly): minimal installable host plugin
npm create @zaeyee/dsh-plugin@latest my-plugin -- --name dsh-my-plugin

# Compose capabilities as needed
npm create @zaeyee/dsh-plugin@latest my-plugin -- --name dsh-my-plugin \
  --with config,commands,tool,events,service,hook,client \
  --ui all

# Interactive mode: omit --name
npm create @zaeyee/dsh-plugin@latest
```

Then:

```sh
cd my-plugin
pnpm install && pnpm build && pnpm check
```

The target directory must be empty (or pass `--force`).

## Usage

```sh
create-dsh <target> --name <npm-package-name> [--with <shapes>] [--ui <surfaces>|all] [--style native|modules] [--force]
```

### Shapes (`--with`, comma-separated)

| Shape      | What you get                                                            |
| ---------- | ----------------------------------------------------------------------- |
| `config`   | Schemastery config + live settings namespace (GUI-editable, no restart) |
| `commands` | `/hello` and `/dsh-demo` slash commands (optional sub-plugin)           |
| `tool`     | Typed `greet` model tool with `presentResult` render intent             |
| `events`   | Typed `<plugin>/ready` Cordis event                                     |
| `service`  | Separately mountable `GreetingService` class half                       |
| `hook`     | `tools/pre-execute` permission gate (`denyTools` config)                |
| `client`   | Browser half via the DSH ModuleLoader envelope                          |

### UI surfaces (`--ui`, requires `client`)

`shell-overlay` · `config-card` · `sidebar-action` · `input-dock` · `header-utilities` · `input-left` · `input-right` · `commandview` · `general-item` · `plugins-tab` · `settings-action` · `header-actions` · `composer-dock` · `assistant-actions`

Auto-coupling: `config-card` implies `config`; `commandview` implies `commands`; `--ui all` selects every surface. See [docs/ui-surfaces.md](docs/ui-surfaces.md) for the full slot table.

### Styling (`--style`, requires `client`)

| Mode      | Behavior                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `native`  | Plain global `styles.css`; class names are used exactly as written. Zero extra deps. |
| `modules` | native, plus `*.module.css` support: hashed scoped classes via lightningcss.         |

## What you get

- Host half: ESM entries (`index` / `service` / `hook` as selected) with `.d.ts`, strict tsconfig, and a smoke test covering live settings, command registration, and the permission gate.
- Client half: a self-contained CJS bundle in the `window.__ModuleLoader__.load()` envelope; styles are compiled to runtime `<style>` injection with plugin-lifecycle reclamation.
- Supply-chain-ready `pnpm-workspace.yaml` (catalog pins + optional `minimumReleaseAge` allowlist).

## Customizing the output

Templates live in `template/` (base skeleton + one fragment per shape/style). Edit a fragment, regenerate, and review the diff:

```sh
node src/index.ts ../preview --name dsh-preview --with <shapes>
git diff tests/__golden__   # after rebuilding baselines
```

See [docs/incremental-add-design.md](docs/incremental-add-design.md) for the planned `--add` mode.

## Developing

```sh
pnpm install
vp test run    # unit + golden baselines + 448-combination matrix + format guard
vp check       # format + lint (type-aware) + type check
vp pack        # single-file bin
```

`template/` and `tests/__golden__/` are byte-level snapshot assets and are excluded from formatting.

## License

[MIT](./LICENSE)
