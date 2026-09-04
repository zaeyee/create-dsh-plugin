export default function getData({ oldData }) {
  return {
    ...oldData,
    patchRows: [`    - id: ${oldData.pluginId}
      name: '${oldData.name}'`],
  }
}
