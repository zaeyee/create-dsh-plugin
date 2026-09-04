export default function getData({ oldData }) {
  const name = oldData.name
  return {
    ...oldData,
    imports: ["import type { Context } from '@deepseek-ai/cordis'"],
    declares: [],
    calls: [`  ctx.effect(() => {
    console.log(\`[\${name}] hello\`)
    return () => console.log(\`[\${name}] disposed\`)
  })`],
  }
}
