#!/usr/bin/env node
/**
 * Points Git at the version-controlled hooks in .githooks/.
 *
 * Runs automatically from the `prepare` npm lifecycle script, so a fresh
 * clone gets working hooks after `npm install` with no extra step. Using
 * `core.hooksPath` keeps the hooks in version control and avoids adding a
 * hook-framework dependency for what is a one-line Git setting.
 *
 * Exits 0 in every non-repo situation (CI checkouts without .git, installs
 * inside a container, dependency installs) — failing here would break an
 * otherwise fine install for no security benefit.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import process from 'node:process'

const HOOKS_DIR = '.githooks'

function isGitRepo() {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

if (!existsSync(HOOKS_DIR)) {
  // Nothing to wire up (e.g. installed as a dependency).
  process.exit(0)
}

if (!isGitRepo()) {
  console.log('[hooks] Not a Git repository — skipping hook setup.')
  process.exit(0)
}

try {
  execFileSync('git', ['config', 'core.hooksPath', HOOKS_DIR], { stdio: 'ignore' })
  console.log(`[hooks] core.hooksPath set to ${HOOKS_DIR} (pre-commit, pre-push active).`)
} catch (error) {
  // Never fail an install over hook wiring.
  console.log('[hooks] Could not set core.hooksPath:', error?.message ?? error)
}
