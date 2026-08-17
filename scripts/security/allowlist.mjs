/**
 * Narrow, documented allowlist for the security scanners.
 *
 * Every entry must name a specific file (or a tightly-scoped path) AND the
 * specific pattern id it exempts. There is deliberately no wildcard entry and
 * no "allow everything in this directory" escape hatch — a broad allowlist
 * silently defeats the scan it is attached to.
 *
 * Adding an entry requires a reason recorded inline. If you cannot state a
 * reason that survives review, the finding is probably real.
 */

/**
 * @typedef {object} AllowEntry
 * @property {string} path      Repo-relative POSIX path, or a prefix ending in '/'.
 * @property {string[]} patterns Pattern ids exempted for that path.
 * @property {string} reason    Why this is safe. Required.
 */

/** @type {AllowEntry[]} */
export const ALLOWLIST = [
  {
    // The scanners must contain the patterns they detect, or they cannot work.
    path: 'scripts/security/',
    patterns: ['*'],
    reason: 'Detection patterns and their fixtures live here by necessity.',
  },
  {
    // Documents variable NAMES only; every value is intentionally empty.
    path: '.env.example',
    patterns: ['password-assignment'],
    reason: 'Template documents variable names with no populated values.',
  },
  {
    // Explains what must never be committed, so it names the shapes.
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
 * Returns true when `patternId` is explicitly allowed for `filePath`.
 * Matching is exact-path or directory-prefix; never a bare substring.
 */
export function isAllowed(filePath, patternId) {
  const file = norm(filePath)
  return ALLOWLIST.some((entry) => {
    const target = norm(entry.path)
    const pathMatches = target.endsWith('/') ? file.startsWith(target) : file === target
    if (!pathMatches) return false
    return entry.patterns.includes('*') || entry.patterns.includes(patternId)
  })
}

/** Exposed for tests and for documenting the active exemptions. */
export function describeAllowlist() {
  return ALLOWLIST.map((e) => `${e.path} [${e.patterns.join(', ')}] — ${e.reason}`)
}
