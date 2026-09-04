import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { registerDemoCommand, registerHelloCommand } from './commands.ts'

/** Plugin display name. This root export is mandatory for dsh host loading. */
export const name = 'dsh-golden-shc'
export interface Config {
  /** Greeting prefix used by the greet tool. */
  greeting: string
  /** Demo retry budget; surfaces in the heartbeat log line. */
  maxRetries: number
  /** Verbose logging for events and the heartbeat. */
  verbose?: boolean
}
export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
  maxRetries: Schema.number().default(3),
  verbose: Schema.boolean().default(false)
})

/** Default output is a minimal hello plugin; selected shapes append focused demos. */
export function apply(ctx: Context, config: Config): void {
  ctx.effect(() => {
    console.log(`[${name}] hello`)
    return () => console.log(`[${name}] disposed`)
  })

  let configSource: () => Config = () => config
  installSettingsSection(ctx, settingsNamespace('dsh-golden-shc'), Config, config, {
    // Receives the current authoritative config source (the settings namespace
    // resolution when the service exists, otherwise the composition entry).
    setSource: current => {
      configSource = current
    },
    // All fields are read at their use sites; no registration rebuild needed.
    onChange: () => {}
  })

  ctx.effect(() => {
    const timer = setInterval(() => {
      if (configSource().verbose) console.log(`[${name}] heartbeat (maxRetries=${configSource().maxRetries})`)
    }, 60_000)
    return () => clearInterval(timer)
  })

  registerHelloCommand(ctx)
  registerDemoCommand(ctx)
}
