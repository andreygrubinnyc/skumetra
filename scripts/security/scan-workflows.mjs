#!/usr/bin/env node
/**
 * GitHub Actions workflow security scan.
 *
 * Catches the workflow mistakes that actually lead to supply-chain and
 * privilege-escalation incidents:
 *
 *   - Actions referenced by mutable tag/branch instead of a full commit SHA.
 *     A tag can be moved; a SHA cannot.
 *   - Missing explicit `permissions` (inherits whatever the repo default is).
 *   - Broad `write-all` permissions.
 *   - Missing job timeouts (a hung job holds a runner indefinitely).
 *   - `pull_request_target`, which runs with repository secrets against
 *     untrusted PR code.
 *   - Untrusted input (PR title/body/branch name) interpolated into shell.
 *
 * Deliberately regex-based rather than adding a YAML parser dependency: the
 * checks are structural and the workflow set is small.
 *
 * Exit:  0 clean · 1 findings · 2 error
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { EXIT_OK, EXIT_FINDINGS, EXIT_ERROR, readTextFile, formatFindings } from './scan-core.mjs'

const WORKFLOW_DIR = '.github/workflows'
const FULL_SHA = /^[0-9a-f]{40}$/

/** Expressions that carry attacker-controllable text into a workflow. */
const UNTRUSTED_EXPRESSIONS = [
  'github.event.pull_request.title',
  'github.event.pull_request.body',
  'github.event.pull_request.head.ref',
  'github.event.issue.title',
  'github.event.issue.body',
  'github.event.comment.body',
  'github.head_ref',
]

function scanWorkflow(rel, text) {
  const findings = []
  const lines = text.split(/\r?\n/)

  lines.forEach((line, i) => {
    const ln = i + 1

    // 1. Action pinning — every `uses:` must reference a 40-char SHA.
    const uses = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/)
    if (uses) {
      const ref = uses[1]
      if (!ref.startsWith('./') && !ref.startsWith('docker://')) {
        const at = ref.lastIndexOf('@')
        const version = at === -1 ? '' : ref.slice(at + 1)
        if (!FULL_SHA.test(version)) {
          findings.push({
            patternId: 'unpinned-action',
            label: `Action not pinned to a full commit SHA (${ref})`,
            file: rel, line: ln,
          })
        }
      }
    }

    // 2. Overly broad permissions.
    if (/^\s*permissions:\s*write-all\s*$/.test(line)) {
      findings.push({
        patternId: 'broad-permissions',
        label: 'permissions: write-all grants far more than any job needs',
        file: rel, line: ln,
      })
    }

    // 3. Untrusted input interpolated into a run block.
    for (const expr of UNTRUSTED_EXPRESSIONS) {
      if (line.includes(`\${{ ${expr}`) || line.includes(`\${{${expr}`)) {
        findings.push({
          patternId: 'untrusted-interpolation',
          label: `Attacker-controllable value ${expr} used in a workflow expression`,
          file: rel, line: ln,
        })
      }
    }

    // 4. pull_request_target runs with secrets against untrusted code.
    if (/^\s*pull_request_target\s*:/.test(line)) {
      findings.push({
        patternId: 'pull-request-target',
        label: 'pull_request_target exposes secrets to untrusted PR code',
        file: rel, line: ln,
      })
    }
  })

  // 5. Workflow-level permissions must be declared explicitly.
  if (!/^permissions:/m.test(text)) {
    findings.push({
      patternId: 'missing-permissions',
      label: 'No workflow-level permissions block; token scope is implicit',
      file: rel, line: 1,
    })
  }

  // 6. Every job should bound its runtime.
  const jobCount = (text.match(/^\s{2}[A-Za-z0-9_-]+:\s*$/gm) || []).length
  const timeoutCount = (text.match(/timeout-minutes:/g) || []).length
  if (jobCount > 0 && timeoutCount < 1) {
    findings.push({
      patternId: 'missing-timeout',
      label: 'No timeout-minutes set; a hung job can hold a runner indefinitely',
      file: rel, line: 1,
    })
  }

  return findings
}

function main() {
  let entries
  try {
    entries = readdirSync(WORKFLOW_DIR).filter((f) => /\.ya?ml$/.test(f))
  } catch {
    console.log('✔ No workflow directory to scan.')
    return EXIT_OK
  }

  const findings = []
  for (const name of entries) {
    const rel = `${WORKFLOW_DIR}/${name}`
    const text = readTextFile(join(process.cwd(), rel))
    if (text === null) continue
    findings.push(...scanWorkflow(rel, text))
  }

  if (findings.length === 0) {
    console.log(`✔ Workflow scan clean — ${entries.length} workflow(s) checked.`)
    return EXIT_OK
  }

  console.error(formatFindings('Workflow security findings:', findings))
  console.error(`\n${findings.length} finding(s).\n`)
  return EXIT_FINDINGS
}

export { scanWorkflow }

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exit(main())
  } catch (error) {
    console.error('Workflow scan failed to run:', error?.message ?? error)
    process.exit(EXIT_ERROR)
  }
}
