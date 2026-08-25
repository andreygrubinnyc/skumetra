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
 *   3. No third-party personal data appears in tracked files — in *every*
 *      tracked file, with no whole-file exemptions. Documentation and the
 *      scanners themselves are scanned like everything else; a blind spot in
 *      the files most likely to quote a real address is the worst place to
 *      have one. Narrow, value-level rules (the public project domain,
 *      reserved documentation domains, placeholders, the owner's published
 *      attribution) handle the legitimate cases instead.
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
    if (shouldSkip(rel)) continue
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
