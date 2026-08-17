#!/usr/bin/env node
/**
 * Public/private boundary scan.
 *
 * The Skumetra repository is deliberately public and sanitized, while seller,
 * prospect, and internal validation material is kept out of Git entirely. This
 * scanner enforces that split:
 *
 *   1. No forbidden path is tracked (private docs, bundles, uploads, .env).
 *   2. No local-only branch content has leaked into tracked files.
 *   3. No third-party personal data appears in tracked files. The owner's own
 *      published attribution and the project domain are explicitly allowed —
 *      those are intentionally public.
 *
 * Exit:  0 clean · 1 findings · 2 error
 */
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import process from 'node:process'
import {
  EXIT_OK, EXIT_FINDINGS, EXIT_ERROR,
  readTextFile, scanPathForForbidden, scanTextForPersonalData, shouldSkip, formatFindings, toPosix,
} from './scan-core.mjs'

/** Files that legitimately reference private *locations* without containing private data. */
const BOUNDARY_DOC_EXEMPT = new Set([
  'scripts/security/patterns.mjs',
  'scripts/security/allowlist.mjs',
  'scripts/security/scan-public-boundary.mjs',
  'scripts/security/scan-core.mjs',
  'docs/project/TESTING_AND_SECURITY.md',
  'CLAUDE.md',
  'SECURITY.md',
])

function trackedFiles(root) {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  })
  return out.split('\0').filter(Boolean).map(toPosix)
}

function main() {
  const root = process.cwd()
  let files
  try {
    files = trackedFiles(root)
  } catch (error) {
    console.error('Could not list tracked files:', error?.message ?? error)
    return EXIT_ERROR
  }

  const pathFindings = []
  const personalFindings = []

  for (const rel of files) {
    for (const hit of scanPathForForbidden(rel)) {
      pathFindings.push({ ...hit, file: rel })
    }
    if (shouldSkip(rel) || BOUNDARY_DOC_EXEMPT.has(rel)) continue
    const text = readTextFile(join(root, rel))
    if (text === null) continue
    for (const hit of scanTextForPersonalData(text, rel)) {
      personalFindings.push({ ...hit, file: rel })
    }
  }

  const total = pathFindings.length + personalFindings.length
  if (total === 0) {
    console.log(`✔ Public/private boundary intact — ${files.length} tracked file(s) checked.`)
    return EXIT_OK
  }

  console.error(formatFindings('Private paths tracked in a public repository:', pathFindings))
  console.error(formatFindings('Third-party personal data in tracked files:', personalFindings))
  console.error(
    `\n${total} boundary finding(s). Values above are redacted.\n` +
      'Private validation material, seller/supplier data, and third-party personal\n' +
      'details must stay outside this repository entirely.\n',
  )
  return EXIT_FINDINGS
}

try {
  process.exit(main())
} catch (error) {
  console.error('Boundary scan failed to run:', error?.message ?? error)
  process.exit(EXIT_ERROR)
}
