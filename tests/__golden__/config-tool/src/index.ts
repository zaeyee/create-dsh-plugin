import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'

/** Plugin display name. This root export is mandatory for dsh host loading. */
export const name = 'dsh-golden-config-tool'
export const inject = ['tools']
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
  installSettingsSection(ctx, settingsNamespace('dsh-golden-config-tool'), Config, config, {
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

  ctx.tools.register(
    defineTool({
      name: 'greet',
      description: 'Greet someone by name.',
      parameters: { name: { type: 'string', required: true, description: 'The name to greet' } },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
      // Result render intent (pure, replayable): prettify the model-visible
      // result text once more for UI display. Omitted falls back to a generic
      // card over the raw result content.
      presentResult: (_args, result) => ({
        card: 'generic',
        title: 'greet',
        content: [
          {
            type: 'text',
            text: `👋 ${result.content.map(block => (block.type === 'text' ? block.text : '')).join('')}`
          }
        ]
      }),
      async execute(args) {
        return `${configSource().greeting}, ${args.name}!`
      }
    })
  )
}
