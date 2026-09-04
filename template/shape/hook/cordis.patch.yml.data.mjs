export default function getData({ oldData }) {
  return {
    ...oldData,
    patchRows: [...oldData.patchRows, `    - id: ${oldData.pluginId}-hook
      name: '${oldData.name}/hook'`],
  }
}
