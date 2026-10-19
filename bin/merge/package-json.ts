import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

type Entries = Record<string, string>
type PackageJson = Record<string, unknown>

const siteOwnedFields = ["name", "version", "description"]

const readManifest = (path: string): PackageJson => JSON.parse(readFileSync(path, "utf8"))

const [ancestorPath, ourPath, theirPath] = process.argv.slice(2)
const [basePackage, ourPkgJson, theirPkgJson] = [ancestorPath, ourPath, theirPath].map(readManifest)

const mergedFields = [...new Set([basePackage, ourPkgJson, theirPkgJson].flatMap(Object.keys))]
  .filter(field => !siteOwnedFields.includes(field))

const isEntries = (value: unknown): value is Entries =>
  typeof value === "object" && value !== null && !Array.isArray(value)
  && Object.values(value).every(entry => typeof entry === "string")

const entriesOf = (pkgJson: PackageJson, field: string): Entries => {
  const value = pkgJson[field]
  return isEntries(value) ? value : {}
}

const isSame = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

const mergeEntries = (field: string, conflicts: string[]): unknown => {
  const base = entriesOf(basePackage, field)
  const ours = entriesOf(ourPkgJson, field)
  const theirs = entriesOf(theirPkgJson, field)
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
  const templateRemoved = field in basePackage && !(field in theirPkgJson)
  return Object.keys(merged).length || (field in ourPkgJson && !templateRemoved) ? merged : undefined
}

const mergeValue = (field: string, conflicts: string[]): unknown => {
  const base = basePackage[field]
  const ours = ourPkgJson[field]
  const theirs = theirPkgJson[field]

  if (isSame(ours, theirs) || isSame(theirs, base)) return ours
  if (isSame(ours, base)) return theirs
  conflicts.push(field)
  return ours
}

const mergeField = (field: string, conflicts: string[]): unknown =>
  [basePackage, ourPkgJson, theirPkgJson].every(pkgJson => pkgJson[field] === undefined || isEntries(pkgJson[field]))
    ? mergeEntries(field, conflicts)
    : mergeValue(field, conflicts)

const mergeManifest = (): [PackageJson, string[]] => {
  const conflicts: string[] = []
  const manifest: PackageJson = { ...ourPkgJson }
  for (const field of mergedFields) {
    manifest[field] = mergeField(field, conflicts)
  }
  return [manifest, conflicts]
}

const manifestWithFieldsFrom = (sourcePkgJson: PackageJson): PackageJson => {
  const manifest: PackageJson = { ...ourPkgJson }
  for (const field of mergedFields) {
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
