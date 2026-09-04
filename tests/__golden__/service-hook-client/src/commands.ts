/**
 * Demo slash commands (host half): two contrasting examples —
 * - `/hello`: no arguments, replies "world", rendered by the framework's
 *   default GenericCommandCard row (demoes "zero-UI registration works");
 * - `/dsh-demo`: echoes the input, paired with the browser half's
 *   commandview surface (conversation.chat.commandview, keyed by command
 *   name) demoes a custom render row.
 *
 * Zero added dependencies: ctx.commands is the @deepseek-ai/dsh-commands
 * service; this module uses a minimal structural type + local declaration
 * merging, registered through ctx.inject(['commands']) as an optional
 * sub-plugin (silently skipped when the service is not composed). See
 * @deepseek-ai/dsh-commands for the full CommandDefinition /
 * CommandInvocation / CommandResult contract.
 */

import type { Context } from '@deepseek-ai/cordis'

/**
 * The demo command name (without the leading slash). The host half registers
 * the command under this name; when the commandview UI surface is selected,
 * the browser half keys its custom render row by the SAME literal — the two
 * halves are separate bundles, so the constant is duplicated on purpose.
 */
const DEMO_COMMAND_NAME = 'dsh-demo'

/** /hello command name (host half only; no custom render row). */
const HELLO_COMMAND_NAME = 'hello'

/** Minimal shape of a command invocation (subset of dsh-commands CommandInvocation). */
interface DemoCommandInvocation {
  /** Raw text after the command name (including separating whitespace). */
  readonly rawInput: string
}

/** Minimal shape of a command result (subset of dsh-commands CommandResult). */
interface DemoCommandResult {
  kind: 'success' | 'error'
  text?: string
}

/** Minimal shape of a command definition (subset of dsh-commands CommandDefinition). */
interface DemoCommandDefinition {
  readonly name: string
  readonly description: string
  readonly handler: (invocation: DemoCommandInvocation) => DemoCommandResult | Promise<DemoCommandResult>
}

/** Minimal face of the command registry (subset of dsh-commands CommandRuntime). */
interface CommandsLike {
  register(definition: DemoCommandDefinition): unknown
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Command registry (provided at runtime by @deepseek-ai/dsh-commands). */
    commands: CommandsLike
  }
}

/** Register the /hello command: silently skipped when the service is absent (optional sub-plugin). */
export function registerHelloCommand(ctx: Context): void {
  ctx.inject(['commands'], commandCtx => {
    commandCtx.commands.register({
      name: HELLO_COMMAND_NAME,
      description: 'Demo command: replies "world".',
      handler: () => ({ kind: 'success', text: 'world' })
    })
  })
}

/** Register the /dsh-demo command: silently skipped when the service is absent (optional sub-plugin). */
export function registerDemoCommand(ctx: Context): void {
  ctx.inject(['commands'], commandCtx => {
    commandCtx.commands.register({
      name: DEMO_COMMAND_NAME,
      description: 'Demo command: echoes the input verbatim.',
      handler: ({ rawInput }) => ({ kind: 'success', text: `echo: ${rawInput.trim() || '(no input)'}` })
    })
  })
}
