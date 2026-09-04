import { buildLocaleEntries } from './locale-entries.data.mjs'

export default function getData({ oldData }) {
  const dict = Object.fromEntries(
    buildLocaleEntries(oldData).map((entry) => [entry.key, entry.en]),
  )
  return {
    ...oldData,
    jsonText: `${JSON.stringify(dict, null, 2)}\n`,
  }
}
