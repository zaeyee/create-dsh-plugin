import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** Plugin display name. This root export is mandatory for dsh host loading. */
export const name = 'dsh-golden-tool'
export const inject = ['tools']

/** Default output is a minimal hello plugin; selected shapes append focused demos. */
export function apply(ctx: Context, _config: Record<string, never> = {}): void {
  ctx.effect(() => {
    console.log(`[${name}] hello`)
    return () => console.log(`[${name}] disposed`)
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
        return `Hello, ${args.name}!`
      }
    })
  )
}
