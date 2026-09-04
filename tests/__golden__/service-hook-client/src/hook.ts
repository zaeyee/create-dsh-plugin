import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

/** Plugin display name (used in diagnostics logs). */
export const name = 'dsh-golden-shc-hook'

/** Plugin config: tool names the model may not invoke. */
export interface Config {
  denyTools: string[]
}

/** Schemastery config schema: validation + defaults; invalid config fails loud. */
export const Config: Schema<Config> = Schema.object({
  denyTools: Schema.array(Schema.string()).default([])
})

/**
 * Permission gate: returning deny aborts the tool call; every other case MUST
 * call next() to hand the decision downstream (waterfall semantics: not
 * calling next() short-circuits the whole chain — that is interception,
 * do not use it by accident).
 */
export function apply(ctx: Context, config: Config): void {
  ctx.on('tools/pre-execute', async (exec: ToolExecution, next): Promise<PreToolDecision> => {
    if (config.denyTools.includes(exec.name)) {
      return { kind: 'deny', reason: `Tool "${exec.name}" is denied by policy.` }
    }
    return next()
  })
}
