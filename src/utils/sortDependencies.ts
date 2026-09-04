type PackageJsonLike = Record<string, unknown> & {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

/**
 * Sort each dependency section of a package.json alphabetically.
 */
export default function sortDependencies(packageJson: PackageJsonLike): PackageJsonLike {
  const sorted: PackageJsonLike = {}

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const

  for (const depType of depTypes) {
    const section = packageJson[depType]
    if (section) {
      sorted[depType] = {}

      Object.keys(section)
        .sort()
        .forEach(name => {
          sorted[depType]![name] = section[name]
        })
    }
  }

  return {
    ...packageJson,
    ...sorted
  }
}
