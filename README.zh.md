# create-dsh

> DeepSeek Harness（DSH）插件脚手架生成器——按需选择能力，产出严格类型、开箱可构建的插件项目。

[![npm: create-dsh](https://img.shields.io/npm/v/create-dsh.svg)](https://www.npmjs.com/package/create-dsh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node: ≥22.18](https://img.shields.io/badge/node-%E2%89%A522.18-green.svg)](#环境要求)

[English](README.md) | 中文

## 特性

- 🧩 **7 个可组合形状**——GUI 可改的实时配置、斜杠命令、带渲染意图的模型工具、类型化事件、可单独挂载的服务、权限门钩子、浏览器半边
- 🖥 **14 个可选 UI 表面**——基于插槽，框架合成强类型 `t`，自带中英词典
- 🎨 **两种 CSS 方案**——普通全局 CSS（零额外依赖）或 lightningcss 的 CSS Modules
- ⚡ **Vite+ 工具链**——单份 `vite.config.ts` 驱动双端构建、格式/lint/类型检查、git hooks
- ✅ **产物经过验证**——生成的项目开箱通过严格 tsc、双端构建与运行时冒烟；生成器自身有 448 组形状/样式组合的快照矩阵
- 🌐 **双语 CLI**——交互提示跟随系统语言（en-US / zh-Hans）

## 环境要求

- Node.js ≥ 22.18
- pnpm ≥ 11

## 快速开始

```sh
# 非交互（CI 友好）：生成最小可安装的宿主插件
npm create dsh@latest my-plugin -- --name dsh-my-plugin

# 按需组合能力
npm create dsh@latest my-plugin -- --name dsh-my-plugin \
  --with config,commands,tool,events,service,hook,client \
  --ui all

# 交互模式：不带 --name
npm create dsh@latest
```

然后：

```sh
cd my-plugin
pnpm install && pnpm build && pnpm check
```

目标目录必须为空（或使用 `--force`）。

## 用法

```sh
create-dsh <target> --name <npm包名> [--with <形状列表>] [--ui <表面列表>|all] [--style native|modules] [--force]
```

### 形状（`--with`，逗号分隔）

| 形状       | 产出                                                          |
| ---------- | ------------------------------------------------------------- |
| `config`   | Schemastery 配置 + 实时 settings 命名空间（GUI 可改、免重启） |
| `commands` | `/hello` 与 `/dsh-demo` 斜杠命令（可选子插件）                |
| `tool`     | 带类型的 `greet` 模型工具，含 `presentResult` 渲染意图        |
| `events`   | 类型化的 `<plugin>/ready` Cordis 事件                         |
| `service`  | 可单独挂载的 `GreetingService` 类半插件                       |
| `hook`     | `tools/pre-execute` 权限门（`denyTools` 配置）                |
| `client`   | 经 DSH ModuleLoader 信封的浏览器半边                          |

### UI 表面（`--ui`，需 `client`）

`shell-overlay` · `config-card` · `sidebar-action` · `input-dock` · `header-utilities` · `input-left` · `input-right` · `commandview` · `general-item` · `plugins-tab` · `settings-action` · `header-actions` · `composer-dock` · `assistant-actions`

自动联动：`config-card` 自动补 `config`；`commandview` 自动补 `commands`；`--ui all` 全选。完整插槽表见 [docs/ui-surfaces.md](docs/ui-surfaces.md)。

### 样式（`--style`，需 `client`）

| 档位      | 行为                                                         |
| --------- | ------------------------------------------------------------ |
| `native`  | 普通全局 `styles.css`，类名即所写即所用，零额外依赖          |
| `modules` | native 基础上支持 `*.module.css`：lightningcss hash 作用域类 |

## 产物内容

- 宿主半边：ESM 入口（按需 `index` / `service` / `hook`）+ `.d.ts`、严格 tsconfig、覆盖实时配置/命令注册/权限门的冒烟测试
- 浏览器半边：`window.__ModuleLoader__.load()` 信封内的自包含 CJS bundle；样式编译为运行时 `<style>` 注入，随插件生命周期回收
- 供应链就绪的 `pnpm-workspace.yaml`（catalog 锁版 + 可选 `minimumReleaseAge` 白名单）

## 自定义产物

模板在 `template/`（基础骨架 + 每个形状/样式一个片段）。改片段 → 重新生成 → 审查 diff：

```sh
node src/index.ts ../preview --name dsh-preview --with <shapes>
git diff tests/__golden__   # 重建基线后
```

规划中的 `--add` 增量模式见 [docs/incremental-add-design.md](docs/incremental-add-design.md)。

## 开发本仓库

```sh
pnpm install
vp test run    # 单测 + golden 基线 + 448 组合矩阵 + 格式守护
vp check       # 格式 + lint（type-aware）+ 类型检查
vp pack        # 单文件 bin
```

`template/` 与 `tests/__golden__/` 是字节级快照资产，已排除出格式化。

## 许可证

[MIT](./LICENSE)
