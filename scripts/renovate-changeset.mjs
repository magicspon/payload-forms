#!/usr/bin/env node

/**
 * Writes a patch changeset for a runtime dependency update.
 *
 * Runs as a Renovate `postUpgradeTasks` command, scoped to `dependencies` only —
 * see the matching packageRule in renovate.json. devDependency, lockfile and
 * GitHub Actions updates deliberately get no changeset, so merging them
 * publishes nothing.
 *
 * Usage: node scripts/renovate-changeset.mjs <depName> [newValue]
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const [depName, newValue] = process.argv.slice(2)

if (!depName) {
  console.error('renovate-changeset: missing <depName> argument')
  process.exit(1)
}

const { name } = JSON.parse(await readFile('package.json', 'utf8'))

// '@atlaskit/pragmatic-drag-and-drop' -> 'atlaskit-pragmatic-drag-and-drop'
const slug = depName
  .replace(/^@/, '')
  .replace(/[^a-z0-9]+/gi, '-')
  .toLowerCase()

const summary = newValue ? `Update ${depName} to ${newValue}` : `Update ${depName}`
const file = join('.changeset', `renovate-${slug}.md`)

await mkdir('.changeset', { recursive: true })
await writeFile(file, `---\n'${name}': patch\n---\n\n${summary}\n`, 'utf8')

console.log(`renovate-changeset: wrote ${file} (${summary})`)
