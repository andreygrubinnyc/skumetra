#!/usr/bin/env node
/**
 * Staged-content security scan — the pre-commit gate.
 *
 * Scans only what is actually staged, so it stays fast enough that nobody is
 * tempted to routinely bypass it. Reads staged *content* via `git show :file`
 * rather than the working tree, so partially-staged files are judged on what
 * would really be committed.
 *
 * Exit:  0 clean · 1 findings · 2 error
 */
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import {
  EXIT_OK, EXIT_FINDINGS, EXIT_ERROR,
  scanTextForSecrets, scanPathForForbidden, shouldSkip, formatFindings,
} from './scan-core.mjs'

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

/** Staged paths, excluding deletions (nothing to scan in a removed file). */
function stagedFiles() {
  const out = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])
  return out.split('\0').filter(Boolean)
}

/** Staged blob content for a path, or null when unreadable/binary. */
function stagedContent(file) {
  try {
    const buf = execFileSync('git', ['show', `:${file}`], { maxBuffer: 32 * 1024 * 1024 })
    if (buf.includes(0)) return null // binary
    return buf.toString('utf8')
  } catch {
    return null
  }
}

function main() {
  let files
  try {
    files = stagedFiles()
  } catch (error) {
    console.error('Could not read staged files:', error?.message ?? error)
    return EXIT_ERROR
  }

  if (files.length === 0) {
    console.log('✔ No staged files to scan.')
    return EXIT_OK
  }

  const secretFindings = []
  const pathFindings = []

  for (const file of files) {
    for (const hit of scanPathForForbidden(file)) {
      pathFindings.push({ ...hit, file })
    }
    if (shouldSkip(file)) continue
    const text = stagedContent(file)
    if (text === null) continue
    for (const hit of scanTextForSecrets(text, file)) {
      secretFindings.push({ ...hit, file })
    }
  }

  const total = secretFindings.length + pathFindings.length
  if (total === 0) {
    console.log(`✔ Staged scan clean — ${files.length} file(s) checked.`)
    return EXIT_OK
  }

  console.error(formatFindings('Credential findings in staged content:', secretFindings))
  console.error(formatFindings('Forbidden paths staged:', pathFindings))
  console.error(
    `\nCommit blocked: ${total} finding(s). Values above are redacted.\n` +
      'Unstage or remove the content, then commit again.\n',
  )
  return EXIT_FINDINGS
}

try {
  process.exit(main())
} catch (error) {
  console.error('Staged scan failed to run:', error?.message ?? error)
  process.exit(EXIT_ERROR)
}
