import * as fs from 'node:fs'
import * as path from 'node:path'

export interface Language {
  pluginName: { message: string; invalid: string }
  overwrite: { message: string }
  shapes: { message: string; hint: string; options: Record<string, string> }
  ui: { message: string; hint: string; options: Record<string, string> }
  style: { message: string; hint: string; options: Record<string, string> }
  errors: { cancelled: string }
  infos: { scaffolding: string; done: string }
}

/**
 * Locale detection. This generator ships only en-US and zh-Hans; anything
 * else falls back to en-US.
 */
function linkLocale(locale: string): string {
  // The C locale is common in containerized environments but is not a valid
  // language tag for the Intl API, so map it to 'en-US'.
  if (locale === 'C') {
    return 'en-US'
  }

  let linkedLocale = locale
  try {
    linkedLocale = Intl.getCanonicalLocales(locale)[0] ?? locale
  } catch {
    linkedLocale = locale
  }

  switch (linkedLocale) {
    case 'zh-TW':
    case 'zh-HK':
    case 'zh-MO':
    case 'zh-CN':
    case 'zh-SG':
    case 'zh':
      return 'zh-Hans'
    default:
      return locale
  }
}

function getLocale(): string {
  const shellLocale =
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    'en-US'

  return linkLocale(shellLocale.split('.')[0]!.replace('_', '-'))
}

export default async function getLanguage(localesRoot: string): Promise<Language> {
  const locale = getLocale()

  const languageFilePath = path.resolve(localesRoot, `${locale}.json`)
  const fallbackPath = path.resolve(localesRoot, 'en-US.json')

  const file = fs.existsSync(languageFilePath) ? languageFilePath : fallbackPath
  return JSON.parse(await fs.promises.readFile(file, 'utf8')) as Language
}
