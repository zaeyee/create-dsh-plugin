export default function getData({ oldData }) {
  return {
    ...oldData,
    imports: [...oldData.imports, "import { registerDemoCommand, registerHelloCommand } from './commands.ts'"],
    calls: [
      ...oldData.calls,
      `  registerHelloCommand(ctx)
  registerDemoCommand(ctx)`,
    ],
  }
}
