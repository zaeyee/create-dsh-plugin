export default function getData({ oldData }) {
  const rows = [...oldData.patchRows]
  rows[0] = rows[0] + `\n      config:\n        greeting: 'Hello from ${oldData.name}'\n        maxRetries: 3\n        verbose: false`
  return {
    ...oldData,
    patchRows: rows,
  }
}
