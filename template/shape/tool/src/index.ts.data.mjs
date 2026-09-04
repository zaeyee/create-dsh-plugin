export default function getData({ oldData }) {
  const greeting = oldData.needsConfig ? '${configSource().greeting}' : 'Hello'
  return {
    ...oldData,
    imports: [...oldData.imports, "import { defineTool } from '@deepseek-ai/dsh-tools'"],
    calls: [...oldData.calls, `  ctx.tools.register(
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
            text: \`👋 \${result.content.map(block => (block.type === 'text' ? block.text : '')).join('')}\`
          }
        ]
      }),
      async execute(args) {
        return \`${greeting}, \${args.name}!\`
      }
    })
  )`],
  }
}
