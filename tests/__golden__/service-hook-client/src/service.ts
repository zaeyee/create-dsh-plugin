import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    greetingService: GreetingService
  }
}

/**
 * Demo service provider (class-form plugin). Other plugins consume it via
 * inject: ['greetingService']; the ctx typing comes from the declaration
 * merging above. Exported through the "./service" subpath; the matching
 * cordis.patch.yml row is generated commented-out-ready.
 */
export class GreetingService extends Service {
  /** Services this half depends on; it loads once they are ready. */
  static inject = ['tools']

  constructor(ctx: Context) {
    super(ctx, 'greetingService')
  }

  /** Public method: record one event. */
  record(event: string): void {
    console.log(`[greetingService] ${event}`)
  }
}

export default GreetingService
