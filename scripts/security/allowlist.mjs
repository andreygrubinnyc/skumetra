/**
 * Narrow allowlist for the security scanners.
 *
 * Design constraints, enforced by `validateAllowlist()` and covered by tests:
 *
 *   1. **Exact file paths only.** No directory prefixes. A directory entry
 *      would silently exempt every file added to that directory later,
 *      including ones nobody reviewed.
 *   2. **Explicit pattern ids only.** No `'*'` wildcard. An entry must name
 *      each pattern it exempts, so widening it is a visible diff.
 *   3. **A written reason on every entry.** If you cannot state one that
 *      survives review, the finding is probably real.
 *
 * The entries below were derived by running the detectors against this
 * directory with no allowlist at all and exempting only what actually fired.
 * Six of the eight files here need no exemption whatsoever and have none.
 */

/**
 * @typedef {object} AllowEntry
 * @property {string} path      Exact repo-relative POSIX file path.
 * @property {string[]} patterns Explicit pattern ids exempted for that file.
 * @property {string} reason    Why this is safe. Required.
 */

/** @type {AllowEntry[]} */
export const ALLOWLIST = [
  {
    path: 'scripts/security/patterns.mjs',
    patterns: ['connection-string'],
    reason:
      'The connection-string detector carries an inline comment illustrating the URI shape ' +
      'it matches (scheme, then credentials, then host). It is documentation, not a credential. ' +
      'Deliberately described here rather than written literally, so this file needs no ' +
      'exemption of its own.',
  },
  {
    path: 'scripts/security/scan-core.test.mjs',
    patterns: ['private-key', 'connection-string', 'email', 'phone', 'profile-url'],
    reason:
      'Synthetic fixtures proving each detector fires. The key-shaped fixtures are built by ' +
      'string concatenation so they never appear literally and need no exemption; these five ' +
      'must appear literally for the assertions to be meaningful. All values are invented.',
  },
  {
    path: '.env.example',
    patterns: ['password-assignment'],
    reason: 'Template documents variable names with no populated values.',
  },
  {
    path: 'docs/project/TESTING_AND_SECURITY.md',
    patterns: ['password-assignment'],
    reason: 'Security documentation describes credential categories in prose.',
  },
  {
    path: 'SECURITY.md',
    patterns: ['password-assignment'],
    reason: 'Security policy describes credential categories in prose.',
  },
]

/** Normalises a path for comparison. */
function norm(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '')
}

/**
 * Structural validation of the allowlist itself.
 *
 * Runs at module load so a malformed or over-broad entry fails loudly at the
 * first scan rather than quietly disabling detection. Returns the list of
 * problems so tests can assert on it directly.
 */
export function validateAllowlist(list = ALLOWLIST) {
  const problems = []
  for (const entry of list) {
    const path = norm(entry.path ?? '')
    if (!path) problems.push('entry with no path')
    if (path.endsWith('/')) {
      problems.push(`directory-wide entry is not permitted: "${path}"`)
    }
    if (!Array.isArray(entry.patterns) || entry.patterns.length === 0) {
      problems.push(`entry "${path}" must list at least one pattern id`)
    } else if (entry.patterns.includes('*')) {
      problems.push(`wildcard pattern exemption is not permitted: "${path}"`)
    }
    if (!entry.reason || String(entry.reason).trim().length < 20) {
      problems.push(`entry "${path}" needs a written reason`)
    }
  }
  return problems
}

const problems = validateAllowlist()
if (problems.length > 0) {
  throw new Error(`Invalid security allowlist:\n  - ${problems.join('\n  - ')}`)
}

/**
 * Returns true when `patternId` is explicitly allowed for `filePath`.
 * Matching is exact-path only — never a prefix, never a substring.
 */
export function isAllowed(filePath, patternId) {
  const file = norm(filePath)
  return ALLOWLIST.some(
    (entry) => norm(entry.path) === file && entry.patterns.includes(patternId),
  )
}

/** Exposed for tests and for documenting the active exemptions. */
export function describeAllowlist() {
  return ALLOWLIST.map((e) => `${e.path} [${e.patterns.join(', ')}] — ${e.reason}`)
}
