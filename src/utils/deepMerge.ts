const isObject = (val: unknown): val is Record<string, unknown> => Boolean(val) && typeof val === 'object'

const mergeArrayWithDedupe = <T>(a: T[], b: T[]): T[] => Array.from(new Set([...a, ...b]))

/**
 * Recursively merge the content of the new object into the existing one.
 * Arrays are merged with dedupe; plain objects are merged recursively.
 */
export default function deepMerge(
  target: Record<string, unknown>,
  obj: Record<string, unknown>
): Record<string, unknown> {
  for (const key of Object.keys(obj)) {
    const oldVal = target[key]
    const newVal = obj[key]

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      target[key] = mergeArrayWithDedupe(oldVal, newVal)
    } else if (isObject(oldVal) && isObject(newVal)) {
      target[key] = deepMerge(oldVal, newVal)
    } else {
      target[key] = newVal
    }
  }

  return target
}
