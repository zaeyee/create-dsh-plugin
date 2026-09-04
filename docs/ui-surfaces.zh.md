# UI 表面

本插件浏览器半边的每个表面都是增量插槽条目：新的 `id` 加在官方条目旁边，
不替换任何东西。下表列出本生成器可输出的全部表面；只有选中的会出现在
`src/client/`。声明这些插槽的 harness 内部包未发布 npm 类型，其
kind/scope 元数据在 `types.d.ts` 中本地声明。

| 表面              | 插槽                                    | 类型 / 作用域   | 渲染内容                                                                                                                              |
| ----------------- | --------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| shell-overlay     | `shell.overlay`                         | list / root     | 可关闭的浮动 pill，固定右下角；层本身点击穿透，条目自行恢复指针事件。唯一对着已发布的 `dsh-client-ui-layout` 类型面编码的表面。       |
| config-card       | `settings.plugin.item`                  | list / root     | 设置 → 插件 → Configurable 里的一张配置卡片，编辑本插件的 settings 命名空间（暂存表单；依赖 host 半边 config 形状的 settings 接线）。 |
| sidebar-action    | `sidebar.footer.action`                 | list / root     | 左栏底部"设置"旁的按钮；接收栏宽状态 `wide`，窄栏（rail）时退化为状态点。                                                             |
| input-dock        | `conversation.input.dock`               | list / session  | 输入卡片上方的状态条；条目自己用 `--dsh-composer-*` 变量处理宽度与居中。                                                              |
| header-utilities  | `conversation.session.header.utilities` | list / session  | 会话标题右侧的工具徽标。                                                                                                              |
| input-left        | `conversation.input.left`               | list / session  | 输入卡工具行左端的常驻小控件。                                                                                                        |
| input-right       | `conversation.input.right`              | list / session  | 输入卡工具行右端的常驻小控件。                                                                                                        |
| commandview       | `conversation.chat.commandview`         | keyed / session | `/dsh-demo` 命令的自定义渲染行，按命令名 keyed；与 host 半边的 commands 形状配对。未注册的命令走通用卡片兜底。                        |
| general-item      | `settings.general.item`                 | list / root     | 设置 → 通用 里的一行偏好；行完全自包含。                                                                                              |
| plugins-tab       | `settings.plugins.tab`                  | list / root     | 设置 → 插件 里的一个新标签页；注册项的 `label` 即标签文字。                                                                           |
| settings-action   | `settings.action`                       | list / root     | 设置面板内容列头部的操作按钮。                                                                                                        |
| header-actions    | `conversation.session.header.actions`   | list / session  | 会话标题旁操作行里的按钮。                                                                                                            |
| composer-dock     | `conversation.composer.dock`            | list / session  | 输入卡片内部（footer）的一行状态文字；宽度继承卡片列约束。                                                                            |
| assistant-actions | `conversation.chat.assistant-actions`   | list / session  | 每条 AI 回复消息操作条上的按钮。                                                                                                      |

## 多语言

每个注册都声明 `locale: NAMESPACE`，框架因此为每个表面组件合成强类型的
`t` 座位；zh/en 词典在 `src/client/index.tsx` 统一注册一次。键都在同一
命名空间里（见那里的 `LocaleNamespaceMap`）。

## 设置暴露限制

harness 的 Web 网关只把白名单内的 settings 命名空间暴露给设置面板
（harness 源码中的 `WEB_SETTINGS_NAMESPACES`）。本插件的命名空间不在名单
时，配置卡片会渲染"未暴露"的说明状态而不是消失——host 半边不受影响
（工具仍实时读取配置）。
