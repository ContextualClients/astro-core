import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

type Entries = Record<string, string>
type PackageJson = Record<string, unknown>
type ManagedField = { field: string, type: "entries" | "string" }

const managedFields: ManagedField[] = [
  { field: "dependencies", type: "entries" },
  { field: "devDependencies", type: "entries" },
  { field: "scripts", type: "entries" },
  { field: "engines", type: "entries" },
  { field: "type", type: "string" },
]

const [ancestorPath, ourPath, theirPath] = process.argv.slice(2)
const [basePackage, ourPkgJson, theirPkgJson] = [ancestorPath, ourPath, theirPath]
  .map(path => JSON.parse(readFileSync(path, "utf8")) as PackageJson)

const mergeEntries = (field: string, conflicts: string[]): unknown => {
  const base = (basePackage[field] ?? {}) as Entries
  const ours = (ourPkgJson[field] ?? {}) as Entries
  const theirs = (theirPkgJson[field] ?? {}) as Entries
  const merged: Entries = { ...ours }

  for (const name of new Set([...Object.keys(base), ...Object.keys(theirs)])) {
    if (ours[name] === theirs[name]) continue
    if (ours[name] !== base[name]) {
      if (theirs[name] !== base[name]) conflicts.push(`${field}.${name}`)
    } else if (theirs[name] === undefined) {
      delete merged[name]
    } else {
      merged[name] = theirs[name]
    }
  }
  return Object.keys(merged).length || field in ourPkgJson ? merged : undefined
}

const mergeValue = (field: string, conflicts: string[]): unknown => {
  const base = basePackage[field]
  const ours = ourPkgJson[field]
  const theirs = theirPkgJson[field]

  if (ours === theirs || theirs === base) return ours
  if (ours === base) return theirs
  conflicts.push(field)
  return ours
}

const mergeManifest = (): [PackageJson, string[]] => {
  const conflicts: string[] = []
  const manifest: PackageJson = { ...ourPkgJson }
  for (const { field, type } of managedFields) {
    manifest[field] = type === "entries" ? mergeEntries(field, conflicts) : mergeValue(field, conflicts)
  }
  return [manifest, conflicts]
}

const manifestWithFieldsFrom = (sourcePkgJson: PackageJson): PackageJson => {
  const manifest: PackageJson = { ...ourPkgJson }
  for (const { field } of managedFields) {
    manifest[field] = sourcePkgJson[field]
  }
  return manifest
}

const writeManifest = (path: string, pkgJson: PackageJson): void =>
  writeFileSync(path, JSON.stringify(pkgJson, null, 2) + "\n")

const [manifest, conflicts] = mergeManifest()

if (!conflicts.length) {
  writeManifest(ourPath, manifest)
  process.exit(0)

} else {
  writeManifest(ancestorPath, manifestWithFieldsFrom(basePackage))
  writeManifest(ourPath, manifestWithFieldsFrom(ourPkgJson))
  writeManifest(theirPath, manifestWithFieldsFrom(theirPkgJson))

  console.error(`package.json: cannot reconcile ${conflicts.join(", ")}`)
  const { status } = spawnSync(
    "git",
    ["merge-file", "-L", "ours", "-L", "base", "-L", "theirs", ourPath, ancestorPath, theirPath],
    { stdio: "inherit" },
  )
  process.exit(status ?? 1)
}
