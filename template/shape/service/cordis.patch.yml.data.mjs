export default function getData({ oldData }) {
  return {
    ...oldData,
    patchRows: [...oldData.patchRows, `    - id: ${oldData.pluginId}-service
      name: '${oldData.name}/service'`],
  }
}
