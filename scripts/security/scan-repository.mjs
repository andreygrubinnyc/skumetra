#!/usr/bin/env node
/**
 * Full-repository security scan.
 *
 * Scans **Git-tracked** files for credential patterns and for paths that must
 * never enter the public repository.
 *
 * Tracked, not "every file on disk". A developer's ignored `.env.local` holds
 * real development credentials by design — that is what `.gitignore` is for.
 * Walking the filesystem would fail the scan (and therefore `verify:push`) for
 * a correctly-configured machine, which trains people to bypass the gate. What
 * matters is whether a secret is *committed*, and `git ls-files` answers
 * exactly that. A force-added `.env.local` becomes tracked and is still caught.
 *
 * Runs entirely offline: `git ls-files` reads the local index.
 *
 * Usage:  node scripts/security/scan-repository.mjs [--root <dir>]
 * Exit:   0 clean · 1 findings · 2 error
 */
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import process from 'node:process'
import {
  EXIT_OK, EXIT_FINDINGS, EXIT_ERROR,
  readTextFile, scanTextForSecrets, scanPathForForbidden, shouldSkip,
  formatFindings, toPosix,
} from './scan-core.mjs'

function parseRoot(argv) {
  const i = argv.indexOf('--root')
  return i !== -1 && argv[i + 1] ? argv[i + 1] : process.cwd()
}

/**
 * Every file Git tracks, including staged additions not yet committed.
 * Throws rather than returning an empty list: a scan that silently checks
 * nothing is worse than one that fails loudly.
 */
function trackedFiles(root) {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  })
  return out.split('\0').filter(Boolean).map(toPosix)
}

function main() {
  const root = parseRoot(process.argv)

  let files
  try {
    files = trackedFiles(root)
  } catch (error) {
    console.error(
      'Could not list Git-tracked files:',
      error?.message ?? error,
      '\nThe repository scan needs a Git repository. It does not fall back to a',
      'filesystem walk, because that would scan ignored files that are meant to',
      'hold local credentials.',
    )
    return EXIT_ERROR
  }

  const secretFindings = []
  const pathFindings = []

  for (const rel of files) {
    for (const hit of scanPathForForbidden(rel)) {
      pathFindings.push({ ...hit, file: rel })
    }
    if (shouldSkip(rel)) continue
    const text = readTextFile(join(root, rel))
    if (text === null) continue
    for (const hit of scanTextForSecrets(text, rel)) {
      secretFindings.push({ ...hit, file: rel })
    }
  }

  const total = secretFindings.length + pathFindings.length
  if (total === 0) {
    console.log(`✔ Repository scan clean — ${files.length} tracked file(s) checked.`)
    return EXIT_OK
  }

  console.error(formatFindings('Credential findings:', secretFindings))
  console.error(formatFindings('Forbidden paths:', pathFindings))
  console.error(
    `\n${total} finding(s). Values above are redacted.\n` +
      'Remove the content, then re-run. If a finding is a false positive, add a\n' +
      'narrow entry with a written reason to scripts/security/allowlist.mjs.\n',
  )
  return EXIT_FINDINGS
}

try {
  process.exit(main())
} catch (error) {
  console.error('Repository scan failed to run:', error?.message ?? error)
  process.exit(EXIT_ERROR)
}
