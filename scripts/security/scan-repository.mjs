#!/usr/bin/env node
/**
 * Full-repository security scan.
 *
 * Checks every tracked, scannable file for credential patterns and for paths
 * that must never enter the public repository.
 *
 * Usage:  node scripts/security/scan-repository.mjs [--root <dir>]
 * Exit:   0 clean · 1 findings · 2 error
 */
import { join } from 'node:path'
import process from 'node:process'
import {
  EXIT_OK, EXIT_FINDINGS, EXIT_ERROR,
  listFiles, readTextFile, scanTextForSecrets, scanPathForForbidden, formatFindings,
} from './scan-core.mjs'

function parseRoot(argv) {
  const i = argv.indexOf('--root')
  return i !== -1 && argv[i + 1] ? argv[i + 1] : process.cwd()
}

function main() {
  const root = parseRoot(process.argv)
  const files = listFiles(root)

  const secretFindings = []
  const pathFindings = []

  for (const rel of files) {
    for (const hit of scanPathForForbidden(rel)) {
      pathFindings.push({ ...hit, file: rel })
    }
    const text = readTextFile(join(root, rel))
    if (text === null) continue
    for (const hit of scanTextForSecrets(text, rel)) {
      secretFindings.push({ ...hit, file: rel })
    }
  }

  const total = secretFindings.length + pathFindings.length
  if (total === 0) {
    console.log(`✔ Repository scan clean — ${files.length} files checked.`)
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
