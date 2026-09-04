# 增量模式技术方案：`--add` / `--remove`

> 状态：设计稿（待评审）
> 关联：README「Generate a plugin」、`template/` 片段架构、`tests/__golden__/` 基线体系
> 日期：2026-10

## 1. 背景与目标

生成器目前是 **scaffold-once** 模型：目标目录非空即报错，
`--force` 会清空重建。用户在项目演化期想补一个 shape / UI 面，只能走
"并排生成 + diff 移植"的手工流程。

本方案为已生成的项目提供一等公民的增量能力：

- **G1** `--add`：向已有项目叠加 shape / UI 表面；
- **G2** `--remove`：从已有项目摘除 shape / UI 表面；
- **G3** **汇流保证（confluence）**：对未被用户修改的项目，
  `generate(A) → add(B\A)` 的最终产物与 `generate(B)` **字节级一致**；
  `remove` 同理反向成立；
- **G4** 对已被用户修改的项目，尽力合并而非拒绝；无法安全合并时**完整失败**，
  绝不产出半成品状态。

## 2. 非目标

- 不支持跨生成器版本的字节级升级（模板演进后旧项目的 pristine 检测天然失败，
  自动落入合并路径，见 §10 风险 R2）；
- 不支持重命名插件（`--add` 模式下 manifest 名与 `package.json` 名不一致即报错）；
- 不做依赖安装（提醒用户 `pnpm install`，与现有 outro 行为一致）；
- 不处理 `.git` / `node_modules` / `lib` / `dist` / lockfile（一律视为非生成器资产）。

## 3. 核心洞察：三份树 + 统一管线

增量操作的本质困难：`src/index.ts`、`cordis.patch.yml` 渲染后是纯文本，
`.data.mjs` 数据链已不存在，无法"重放追加"。

**解法：生成器拥有完美确定性（golden 体系已证明），因此任意历史组合都能重演。**
于是一次 `--add` 可以构造出三份树：

| 树         | 含义                     | 来源                                              |
| ---------- | ------------------------ | ------------------------------------------------- |
| **base**   | 用户生成项目时的原始产物 | 用 manifest 记录的组合 × 当前模板，重演到临时目录 |
| **theirs** | 目标组合的应有产物       | 用（组合 ∪ 新增）重演到临时目录                   |
| **ours**   | 用户磁盘上的现状         | 扫描目标目录（排除非生成器资产）                  |

有了三份树，所有文件操作统一退化为经典问题：

- `ours == base`（pristine）→ **直接取 theirs**（快路径，保证 G3）；
- JSON 文件 → 语义 `deepMerge`（复用 `renderTemplate` 既有能力）；
- 其余文本文件 → **三向行级合并（diff3）**，冲突即止（G4）；
- theirs 新增文件 → 复制；base 有而 theirs 无 → 删除（仅限 base 证明归属生成器的文件）。

> **决策记录**：早期草案对 `src/index.ts` 采用"锚点式插入"（import 块后插入、
> apply 尾部插入）。评审后弃用——锚点对用户重排脆弱，且需为每个 shape 维护
> 与 `.data.mjs` 重复的静态片段表（双源漂移）。三向合并把"shape 贡献了什么"
> 的知识唯一锚定在模板本身，零重复。

## 4. 用户接口

### 4.1 语法

```sh
node src/index.ts <target> --add <items>      # items = 逗号分隔的 shape 和/或 surface
node src/index.ts <target> --remove <items>
node src/index.ts <target> --add <items> --dry-run
node src/index.ts <target> --add <items> --keep-temp   # 保留 base/theirs 临时树供手工合并
```

**shape 名与 surface 名两两不相交**（`config/commands/tool/...` vs
`shell-overlay/config-card/...`），因此 `--add` 无需区分两类，可混写：

```sh
node src/index.ts ../my-plugin --add commands,client,shell-overlay
node src/index.ts ../my-plugin --add config-card        # 自动联动 config（复用现有规则）
node src/index.ts ../my-plugin --remove hook,assistant-actions
```

`--add` 模式下 `--name` 可省略（取 manifest）；若显式给出必须与 manifest 一致。

### 4.2 行为矩阵

| 场景                      | 行为                                                          |
| ------------------------- | ------------------------------------------------------------- |
| target 无 manifest        | 报错：非本生成器产出或由旧版产出，给出并排 diff 手工流程指引  |
| target 为空目录 + `--add` | 报错：请走正常生成流程                                        |
| `--name` 与 manifest 不符 | 报错（不支持重命名）                                          |
| `--add` 项已在项目中      | 幂等：该项从增量集合剔除，集合为空则打印"nothing to do"退出 0 |
| `--remove` 项不在项目中   | 同上，幂等                                                    |
| `--remove` 导致组合为空   | 允许，退化为 default（hello-only）组合                        |
| pristine 项目             | 快路径整体替换（G3 成立）                                     |
| 用户改过生成文件          | 三向合并；有冲突 → 中止并列出冲突文件与手工合并指引           |
| `--force` + manifest      | 维持现状语义：清空重建，manifest 重置为新组合                 |

### 4.3 输出

沿用现有风格，先打印**执行计划**再应用：

```
plan: +CREATE  src/commands.ts
plan: +CREATE  src/client/index.tsx (+11 surface modules, 2 shared)
plan: ~MERGE   src/index.ts          (imports +2, apply body +3)
plan: ~MERGE   package.json          (deps: dsh-tools, dsh-settings; exports +2)
plan: ~MERGE   cordis.patch.yml      (+1 row)
plan: ~KEEP    README.md             (user-modified, advisory)
applied 9 files. next: pnpm install && pnpm check
```

## 5. 清单（Manifest）

写入生成项目 `package.json` 的 `dsh` 字段内（该字段已存在，随 npm 发布无害，
用户可见、JSON 语义稳定、不新增 dotfile）：

```jsonc
// package.json（生成产物）
{
  "name": "dsh-my-plugin",
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "generator": {
      // ← 新增：增量模式的唯一事实来源
      "version": "0.2.0", //    生成器版本（package.json version）
      "shapes": ["config", "tool"],
      "surfaces": ["shell-overlay"]
    }
  }
}
```

- 由 base 片段提供骨架 `{}`，生成流程末尾（README 之后）写入终值；
- `--add/--remove` 成功后原子更新；
- `deepMerge`/`sortDependencies` 不会破坏它（对象合并、非依赖段）。

**注意**：本特性上线前的历史项目没有 manifest，`--add` 一律走 §4.2 的报错指引
（诚实拒绝优于猜测检测——按文件存在性推断组合会被 auto-couple 与用户自建文件欺骗）。

## 6. 管线详细设计

新增 `src/incremental/` 模块，`renderTemplate` 与模板体系**零改动**。

```
src/incremental/
  manifest.ts    # readManifest(target) / writeManifest —— dsh.generator 读写
  regen.ts       # regen(combo, name) → 临时目录树（spawn 自身：node src/index.ts <tmp> …）
  trees.ts       # scanTree(dir) → Map<relPath, bytes>；排除 .git/node_modules/lib/dist/lockfile
  plan.ts        # buildPlan(base, theirs, ours, manifest) → FileOp[]
  merge.ts       # diff3LineMerge(base, ours, theirs) → Merged | Conflict   （Phase 2）
  apply.ts       # applyPlan(target, ops) —— 两阶段：全部就绪后一次性落盘
```

### 6.1 路由（`src/index.ts` 入口处）

```
解析 argv
  └─ 有 --add/--remove？
       ├─ readManifest(target) 失败 → 报错指引（§4.2）
       ├─ 校验 --name 一致性、items 合法性（复用 SHAPES/UI_SURFACES 校验）
       ├─ 目标组合 = manifest ∪/-- items，再过 auto-couple 规则（config-card⇒config 等）
       └─ 进入增量管线（下述）
  └─ 否则 → 现有生成流程（末尾追加 writeManifest）
```

### 6.2 重演与计划构建

```
base   = scanTree(regen(manifestCombo,  name))    // 临时目录 A
theirs = scanTree(targetCombo,     name))         // 临时目录 B
ours   = scanTree(target)

对 base ∪ theirs ∪ ours 的每个相对路径归类：
  theirs == base（字节）          → KEEP（本次增量不涉及）
  ours 未见                       → CREATE（复制 theirs）
  ours == base                    → REPLACE/DELETE（按 theirs 有无）   ← pristine 快路径
  ours ≠ base ∧ theirs ≠ base     →
      JSON？ → 语义 deepMerge(base→theirs 的 delta 应用到 ours)
      advisory？ → KEEP + 提示（见 §6.3）
      其他文本 → diff3LineMerge（Phase 1 先降级为：报冲突指引手工；Phase 2 完整实现）
advisory 且 ours 未见 → CREATE
base 有 ∧ theirs 无 ∧ ours == base → DELETE
```

**归属安全性**：DELETE 只作用于 `ours == base` 的文件——字节级证明该文件仍是
生成器产物，绝无误删用户文件的可能。用户在生成器目录下自建的新文件
（如 `src/client/my-surface.tsx`）不在 base 中，永远 KEEP。

### 6.3 文件分类

| 类别     | 文件                                                                                                              | ours 被修改时的策略                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| core     | `src/**`、`package.json`、`tsconfig.json`、`cordis.patch.yml`、`test/smoke.mjs`、`tsdown.config.ts`、`types.d.ts` | 三向合并（JSON 走语义合并）                                                                              |
| advisory | `README.md`、`docs/ui-surfaces*.md`                                                                               | **保留用户版** + 输出提示（这些文件天然会被用户改写：README 补充说明）；`--dry-run` 可查看新版供手工参考 |

### 6.4 两阶段提交（G4 的机制保证）

1. **Plan 阶段**：所有合并结果先在内存/临时 staging 完整算出；任一文件冲突
   → 打印冲突清单 + `--keep-temp` 指引（base/theirs 已留在缓存目录，可直接
   `git merge-file` 或比对）→ **退出码 1，磁盘零改动**；
2. **Apply 阶段**：按计划一次性落盘（CREATE/REPLACE/DELETE/manifest 更新），
   成功后打印汇总与 `pnpm install && pnpm check` 提示。

### 6.5 三向行级合并（Phase 2）

- 零依赖实现经典 diff3（Myers diff + 三方区域归并），约 200 行；
- ours 与 theirs 对同一行区间都有改动 → 冲突，写入标记版到 staging 并计入冲突清单；
- JSON 永远不走文本合并（见 §6.2）；
- 交互式 `--add`（无 items 参数、目标含 manifest 时弹 multiselect，只列
  未启用项）归入 Phase 2 一并交付。

## 7. 错误码与文案

| 退出码 | 场景                                                      |
| ------ | --------------------------------------------------------- |
| 0      | 成功 / nothing to do                                      |
| 1      | 参数错误、无 manifest、名称不符、非空非生成目录、合并冲突 |

`locales/{en-US,zh-Hans}.json` 新增 `addMode` 文案组（plan 前缀、冲突指引、
advisory 提示等），双语同步。

## 8. 测试方案

新增 `tests/incremental.test.ts`，重点验证 G3/G4：

1. **汇流矩阵（核心不变量）**：
   - 抽样组合对 A ⊆ B：`generate(A) → add(B\A)` ≡ `generate(B)`
     （复用 golden 对比器：JSON 语义化 + 文本规范化）；
   - 反向：`generate(B) → remove(B\A)` ≡ `generate(A)`；
   - 采样：default→每个单 shape→full 的链、随机配对、全单 shape→full，
     约 40–60 对（重演 3 份树 × ~90ms，预计 <20s）；
2. **manifest**：生成即写入、add 后正确更新、auto-couple 联动入 manifest；
3. **pristine 快路径**：add 前后用户文件 mtime 不变（KEEP 未触发写）；
4. **用户修改路径**（Phase 2）：对 index.ts 注入"用户加了 import / 加了调用 /
   重排 import 顺序"三类变异，断言合并正确；构造同区间双改 → 断言退出码 1、
   目标目录零改动；
5. **错误路径**：无 manifest、名称不符、空目录 `--add`、幂等 nothing-to-do；
6. **e2e**：default → `--add tool,client --ui all` 后离线 tsc + tsdown + smoke
   （复用现有一命令式 e2e 流程）；
7. 既有 320 组合矩阵与 7 套 golden 回归不受影响（生成流程仅追加 manifest 写入，
   golden 需一次性重建——注意同步重建以纳入 `dsh.generator` 字段）。

## 9. 分期与工作量

| 阶段    | 内容                                                                                             | 预估      |
| ------- | ------------------------------------------------------------------------------------------------ | --------- |
| Phase 1 | manifest + 重演 + 计划 + pristine 快路径 + 两阶段提交 + `--remove` + 汇流/错误测试 + golden 重建 | ~1 天     |
| Phase 2 | diff3 合并 + 冲突清单 + advisory 策略精调 + 交互式 add + 用户变异测试                            | ~1–1.5 天 |

Phase 1 独立可用且已覆盖最大价值场景（刚生成、尚未大改的项目）；
Phase 2 解决"改过之后再加"。

## 10. 风险与对策

| #   | 风险                                               | 对策                                                                                                                                                          |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | 用户在 `src/` 深度改写后 add                       | Phase 1 诚实拒绝并给出三份树的手工合并指引；Phase 2 diff3；README 建议在 git 干净状态下 add                                                                   |
| R2  | 生成器模板演进 → 旧项目 base 失配（pristine 恒假） | manifest.version ≠ 当前版本时显式告警；base 仍用当前模板重演（合并语义依旧成立，只是用户"未改"的文件也可能被模板更新覆盖为 theirs——这通常正是期望的升级行为） |
| R3  | `pnpm-lock.yaml` 变化                              | 视为用户资产 KEEP；提示 `pnpm install` 自然更新                                                                                                               |
| R4  | 重演双倍生成开销                                   | 单次生成 ~90ms，两棵树 <200ms，可忽略；重演子进程复用 `node src/index.ts`，行为与用户路径完全同源（无第二条代码路径）                                         |
| R5  | manifest 被用户误删                                | `--add` 报错指引；不做启发式恢复                                                                                                                              |

```

```
