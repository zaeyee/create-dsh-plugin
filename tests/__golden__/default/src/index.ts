import type { Context } from '@deepseek-ai/cordis'

/** Plugin display name. This root export is mandatory for dsh host loading. */
export const name = 'dsh-smoke-simple'

/** Default output is a minimal hello plugin; selected shapes append focused demos. */
export function apply(ctx: Context, _config: Record<string, never> = {}): void {
  ctx.effect(() => {
    console.log(`[${name}] hello`)
    return () => console.log(`[${name}] disposed`)
  })
}
