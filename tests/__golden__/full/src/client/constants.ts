/**
 * Shared identity constants for the client half. When renaming, keep
 * package.json `name`, src/index.ts `name`, cordis.patch.yml `id`/`name`
 * and this file in sync (see the generated README).
 */

/** Plugin identity: settings namespace, slot entry ids, style tag marker. */
export const NAMESPACE = 'dsh-smoke-full' as const

/**
 * Demo command name (without the leading slash): the host half's commands
 * module registers the command under this name and the commandview surface
 * keys its custom render row by the same literal. The host half keeps its
 * own copy of the constant — the two halves ship as separate bundles.
 */
export const DEMO_COMMAND_NAME = 'dsh-demo' as const
