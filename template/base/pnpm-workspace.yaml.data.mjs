// Exact-version allowlist for pnpm's minimumReleaseAge supply-chain defense.
// The entries track the package.json fragments' pins — keep them in sync when
// bumping versions.
export default function getData({ oldData }) {
  const entries = ["'@deepseek-ai/cordis@4.0.1'"]
  if (oldData.clientEnabled) {
    entries.push(
      "'@deepseek-ai/dsh-client-locale@0.1.0-rc.8'",
      "'@deepseek-ai/dsh-client-runtime@0.1.0-rc.8'",
      "'@deepseek-ai/dsh-client-ui-layout@0.1.0-rc.8'",
      "'@deepseek-ai/dsh-client-ui-slots@0.1.0-rc.8'",
    )
  }
  if (oldData.needsConfig) {
    entries.push("'@deepseek-ai/dsh-settings@0.1.0-rc.8'")
  }
  if (oldData.needsTool || oldData.needsHook) {
    entries.push("'@deepseek-ai/dsh-tools@0.1.0-rc.8'")
  }
  if (oldData.needsConfig || oldData.needsHook) {
    entries.push("'@deepseek-ai/schemastery@3.18.1'")
  }
  entries.sort()
  return {
    ...oldData,
    excludeEntries: entries,
  }
}
