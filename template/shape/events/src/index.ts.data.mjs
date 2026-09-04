export default function getData({ oldData }) {
  const name = oldData.name
  const pluginId = oldData.pluginId
  const listener = oldData.needsConfig
    ? `  ctx.on('${pluginId}/ready', ({ id }) => {
    if (configSource().verbose) console.log(\`[${name}] ready: \${id}\`)
  })`
    : `  ctx.on('${pluginId}/ready', ({ id }) => console.log(\`[${name}] ready: \${id}\`))`
  return {
    ...oldData,
    declares: [...oldData.declares, `declare module '@deepseek-ai/cordis' {
  interface Events {
    '${pluginId}/ready': (payload: { id: string }) => void
  }
}`],
    calls: [...oldData.calls, listener],
  }
}
