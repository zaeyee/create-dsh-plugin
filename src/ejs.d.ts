/**
 * Minimal ambient declaration for `ejs` (v6). The package ships no types, and
 * `@types/ejs` targets the v3 API surface — this generator only uses
 * `ejs.render(template, data)`, so a local declaration avoids a version
 * mismatch.
 */
declare module 'ejs' {
  export interface RenderOptions {
    /** escapes the function name `<% %>` ... see ejs docs; unused here */
    [key: string]: unknown
  }

  export function render(template: string, data?: Record<string, unknown>, options?: RenderOptions): string

  const ejs: { render: typeof render }
  export default ejs
}
