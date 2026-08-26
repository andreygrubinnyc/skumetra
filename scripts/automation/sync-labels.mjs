#!/usr/bin/env node
/**
 * Creates or updates the automation labels on GitHub.
 *
 * Additive by design: it creates what is missing and corrects the colour and
 * description of what exists. It never deletes a label, because labels not in
 * this list belong to the maintainer, not to this script.
 *
 * Requires an authenticated `gh` CLI. Run it once when setting the system up,
 * and again after changing labels.mjs.
 *
 * Usage:  node scripts/automation/sync-labels.mjs [--dry-run]
 * Exit:   0 success · 1 one or more labels could not be synced · 2 could not run
 */
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { LABEL_DEFINITIONS } from './labels.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

let existing
try {
  existing = new Map(
    JSON.parse(gh(['label', 'list', '--limit', '200', '--json', 'name,color,description']))
      .map((l) => [l.name, l]),
  )
} catch (error) {
  console.error('Could not list labels. Is `gh` installed and authenticated?')
  console.error(error?.stderr?.toString?.() ?? error?.message ?? error)
  process.exit(2)
}

let failures = 0
for (const label of LABEL_DEFINITIONS) {
  const current = existing.get(label.name)
  const matches =
    current &&
    current.color?.toLowerCase() === label.color &&
    (current.description ?? '') === label.description

  if (matches) {
    console.log(`= ${label.name}`)
    continue
  }

  const verb = current ? 'update' : 'create'
  if (DRY_RUN) {
    console.log(`${current ? '~' : '+'} ${label.name} (${verb}, dry run)`)
    continue
  }

  try {
    gh([
      'label', 'create', label.name,
      '--color', label.color,
      '--description', label.description,
      ...(current ? ['--force'] : []),
    ])
    console.log(`${current ? '~' : '+'} ${label.name}`)
  } catch (error) {
    failures++
    console.error(`! ${label.name}: ${error?.stderr?.toString?.().trim() ?? error?.message ?? error}`)
  }
}

console.log(`\n${LABEL_DEFINITIONS.length} label(s) processed, ${failures} failure(s).`)
process.exit(failures === 0 ? 0 : 1)
