# UI Surfaces

Every browser-half surface of this plugin is an additive slot entry: a fresh
`id` is added beside the shipped entries instead of replacing anything. The
table lists every surface this generator can emit; only the selected ones are
present in `src/client/`. Slot kind/scope metadata for seats whose declaring
harness packages are not published as npm types lives in `types.d.ts`.

| Surface           | Slot                                    | Kind / scope    | What it renders                                                                                                                                                                              |
| ----------------- | --------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shell-overlay     | `shell.overlay`                         | list / root     | Dismissible floating pill, fixed bottom-right; the layer is click-through, the entry opts back into pointer events. The one seat typed against the published `dsh-client-ui-layout` surface. |
| config-card       | `settings.plugin.item`                  | list / root     | A card in Settings → Plugins → Configurable editing this plugin's settings namespace (staged form; needs the config shape's settings wiring on the host half).                               |
| sidebar-action    | `sidebar.footer.action`                 | list / root     | A button at the left-column foot beside Settings; receives the column's `wide` state and degrades to a dot on the rail.                                                                      |
| input-dock        | `conversation.input.dock`               | list / session  | A status strip above the input card; entry handles its own width/centering against the `--dsh-composer-*` variables.                                                                         |
| header-utilities  | `conversation.session.header.utilities` | list / session  | A right-aligned utility badge next to the conversation title.                                                                                                                                |
| input-left        | `conversation.input.left`               | list / session  | A small persistent control at the left end of the composer tool row.                                                                                                                         |
| input-right       | `conversation.input.right`              | list / session  | A small persistent control at the right end of the composer tool row.                                                                                                                        |
| commandview       | `conversation.chat.commandview`         | keyed / session | A custom render row for the `/dsh-demo` command, keyed by command name; pairs with the host half's commands shape. Unregistered commands fall back to the generic card.                      |
| general-item      | `settings.general.item`                 | list / root     | One preference row in Settings → General; rows are fully self-contained.                                                                                                                     |
| plugins-tab       | `settings.plugins.tab`                  | list / root     | One extra tab in Settings → Plugins; the registration `label` is the tab text.                                                                                                               |
| settings-action   | `settings.action`                       | list / root     | An action button in the settings panel's content-column header.                                                                                                                              |
| header-actions    | `conversation.session.header.actions`   | list / session  | A button in the action row beside the conversation title.                                                                                                                                    |
| composer-dock     | `conversation.composer.dock`            | list / session  | One status line inside the composer card footer; width inherits the card column.                                                                                                             |
| assistant-actions | `conversation.chat.assistant-actions`   | list / session  | A button on every assistant reply's action strip.                                                                                                                                            |

## Locale

Every registration declares `locale: NAMESPACE`, so the framework synthesizes
the typed `t` seat on each surface component; the zh/en dictionaries are
registered once in `src/client/index.tsx`. Keys live in a single namespace
(see `LocaleNamespaceMap` there).

## Settings exposure caveat

The harness web gateway only exposes whitelisted settings namespaces to the
settings panel (`WEB_SETTINGS_NAMESPACES` in the harness source). When this
plugin's namespace is not on the list, the config card renders a
"not exposed" status with remedies instead of disappearing — and the host
half is unaffected (tools still read the config live).
