/** Plain stylesheet import: compiled to a side-effect style-tag injector. */
declare module '*.css'

/** CSS Modules import: compiled to a style-tag injector that also exports
 * the hashed class-name map. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
