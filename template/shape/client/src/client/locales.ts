import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NAMESPACE } from './constants.ts'
import enJson from './locales/en.json'
import zhJson from './locales/zh.json'

/**
 * NAMESPACE dictionaries. The flat key-value data lives in
 * locales/{zh,en}.json (edited with i18n-ally); this module is the code
 * contract: NS, the translator seat type, and the zh-keyed completeness of en.
 */
export const NS = NAMESPACE

/** Translator seat type for this namespace. */
export type LocaleT = TranslateNS<typeof NS>

/** zh is the source of truth; en must cover exactly the same keys. */
export const dictionaries = {
  zh: zhJson,
  en: enJson as Record<keyof typeof zhJson, string>
} as const
