import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { describe, it, expect } from 'vitest'
import {
  scanTextForSecrets,
  scanPathForForbidden,
  scanTextForPersonalData,
  shouldSkip,
  toPosix,
} from './scan-core.mjs'
import { scanWorkflow, parseJobs } from './scan-workflows.mjs'
import { redact, looksLikePlaceholder } from './patterns.mjs'
import { isAllowed, ALLOWLIST, validateAllowlist } from './allowlist.mjs'

/**
 * Every credential-shaped string below is SYNTHETIC and invalid. They exist
 * only to prove the detector fires. Never put a real credential in a test.
 */
const FAKE = {
  // A structurally-valid but meaningless AWS-style id.
  aws: 'AKIA' + 'Q'.repeat(16),
  githubToken: 'ghp_' + 'b'.repeat(36),
  supabaseSecret: 'sb_secret_' + 'c'.repeat(32),
  stripe: 'sk_live_' + 'd'.repeat(24),
  privateKey: '-----BEGIN RSA PRIVATE KEY-----',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'e'.repeat(20) + '.' + 'f'.repeat(20),
  connString: 'postgres://appuser:s3cretpassword@db.internal:5432/skumetra',
}

describe('secret detection', () => {
  it.each([
    ['AWS access key', FAKE.aws, 'aws-access-key'],
    ['GitHub token', FAKE.githubToken, 'github-token'],
    ['Supabase secret key', FAKE.supabaseSecret, 'supabase-secret'],
    ['Stripe live key', FAKE.stripe, 'stripe-secret'],
    ['private key header', FAKE.privateKey, 'private-key'],
    ['JWT-shaped credential', FAKE.jwt, 'jwt'],
    ['connection string with password', FAKE.connString, 'connection-string'],
  ])('blocks a synthetic %s', (_label, value, expectedId) => {
    const findings = scanTextForSecrets(`const x = "${value}"`, 'src/example.ts')
    expect(findings.map((f) => f.patternId)).toContain(expectedId)
  })

  it('reports the line number of the finding', () => {
    const text = ['line one', 'line two', `const k = "${FAKE.aws}"`].join('\n')
    const [finding] = scanTextForSecrets(text, 'src/example.ts')
    expect(finding.line).toBe(3)
  })

  it('never echoes the full secret back', () => {
    const findings = scanTextForSecrets(`const k = "${FAKE.githubToken}"`, 'src/example.ts')
    expect(findings).not.toHaveLength(0)
    for (const f of findings) {
      expect(f.redacted).not.toBe(FAKE.githubToken)
      expect(f.redacted).toContain('*')
      expect(JSON.stringify(f)).not.toContain(FAKE.githubToken)
    }
  })

  it('allows documentation placeholders', () => {
    const placeholders = [
      'SUPABASE_SERVICE_ROLE_KEY=',
      'password: "your-password-here"',
      'api_key: "<PASTE_YOUR_KEY>"',
      'token: "example-token-value"',
    ]
    for (const line of placeholders) {
      expect(scanTextForSecrets(line, 'docs/setup.md')).toHaveLength(0)
    }
  })

  it('does not flag an empty env template value', () => {
    const env = ['NEXT_PUBLIC_SITE_URL=https://skumetra.com', 'SUPABASE_SERVICE_ROLE_KEY='].join('\n')
    expect(scanTextForSecrets(env, '.env.example')).toHaveLength(0)
  })

  it('ignores a short quoted value that is not credential-shaped', () => {
    expect(scanTextForSecrets('password: "abc"', 'src/x.ts')).toHaveLength(0)
  })
})

describe('forbidden paths', () => {
  it.each([
    ['docs/private/validation/README.md', 'private-docs'],
    ['skumetra-private-validation.bundle', 'git-bundle'],
    ['.env.local', 'env-real'],
    ['uploads/seller-export.csv', 'uploads'],
    ['pilot-data.json', 'pilot-data'],
    ['notes/PJM-migration.md', 'employer'],
  ])('blocks %s', (path, expectedId) => {
    expect(scanPathForForbidden(path).map((f) => f.patternId)).toContain(expectedId)
  })

  it.each([
    'src/lib/calc/safe-price.ts',
    'docs/project/TESTING_AND_SECURITY.md',
    '.env.example',
    'README.md',
    'src/data/landing-sample-data.ts',
  ])('allows public file %s', (path) => {
    expect(scanPathForForbidden(path)).toHaveLength(0)
  })
})

describe('personal data boundary', () => {
  it('blocks a third-party email in a tracked file', () => {
    const findings = scanTextForPersonalData('contact: buyer@somerandomseller.net', 'docs/x.md')
    expect(findings.map((f) => f.patternId)).toContain('email')
  })

  it('allows the public project domain', () => {
    expect(scanTextForPersonalData('hello@skumetra.com', 'README.md')).toHaveLength(0)
  })

  it('allows reserved documentation domains used in fixtures', () => {
    expect(scanTextForPersonalData('jordan@example.com', 'tests/e2e/x.spec.ts')).toHaveLength(0)
    expect(scanTextForPersonalData('jordan@example.org', 'tests/e2e/x.spec.ts')).toHaveLength(0)
  })

  it('detects an ordinary externally-owned domain that merely looks fictional', () => {
    // northline.com is a real registrable domain owned by someone. Treating it
    // as universally fictional would let a genuine third-party address through.
    const findings = scanTextForPersonalData('person@northline.com', 'docs/x.md')
    expect(findings.map((f) => f.patternId)).toContain('email')
  })

  it('allows a UI placeholder email — nobody is identified by it', () => {
    const line = 'placeholder="you@yourstore.com"'
    expect(scanTextForPersonalData(line, 'src/components/pilot/form.tsx')).toHaveLength(0)
  })

  it('does not flag the public owner attribution already in the docs', () => {
    const line = '**Owner:** Andrey Grubin · **Status:** Active'
    expect(scanTextForPersonalData(line, 'docs/project/RELEASE_PLAN.md')).toHaveLength(0)
  })

  it('blocks a phone number and a social profile URL', () => {
    const ids = scanTextForPersonalData(
      'call 555-123-4567 or see linkedin.com/in/someprospect',
      'docs/x.md',
    ).map((f) => f.patternId)
    expect(ids).toContain('phone')
    expect(ids).toContain('profile-url')
  })

  it('redacts personal values in output', () => {
    const [f] = scanTextForPersonalData('buyer@somerandomseller.net', 'docs/x.md')
    expect(f.redacted).not.toBe('buyer@somerandomseller.net')
    expect(f.redacted).toContain('*')
  })
})

describe('allowlist', () => {
  it('is narrow: an arbitrary source file gets no exemption', () => {
    expect(isAllowed('src/app/page.tsx', 'aws-access-key')).toBe(false)
  })

  it('exempts only the declared path and pattern', () => {
    expect(isAllowed('.env.example', 'password-assignment')).toBe(true)
    expect(isAllowed('.env.example', 'aws-access-key')).toBe(false)
  })

  it('matches an exact path only — no prefix, no partial name', () => {
    // patterns.mjs is exempt for connection-string and nothing else.
    expect(isAllowed('scripts/security/patterns.mjs', 'connection-string')).toBe(true)
    expect(isAllowed('scripts/security/patterns.mjs', 'aws-access-key')).toBe(false)
    // A similarly-named file outside the entry gets nothing.
    expect(isAllowed('scripts/security-notes.md', 'connection-string')).toBe(false)
    expect(isAllowed('scripts/security/patterns.mjs.bak', 'connection-string')).toBe(false)
  })
})

describe('skip rules', () => {
  it.each(['node_modules/pkg/index.js', '.next/static/chunk.js', 'public/logo.png', '.git/config'])(
    'skips %s',
    (p) => expect(shouldSkip(p)).toBe(true),
  )

  it('does not skip real source', () => {
    expect(shouldSkip('src/lib/calc/safe-price.ts')).toBe(false)
  })

  it('normalises Windows separators', () => {
    expect(toPosix('src\\lib\\x.ts')).toBe('src/lib/x.ts')
  })
})

describe('workflow scanning', () => {
  const pinned = '0'.repeat(40)

  it('flags an action pinned only to a tag', () => {
    const wf = ['name: CI', 'permissions:', '  contents: read', 'jobs:', '  a:', '    timeout-minutes: 10', '    steps:', '      - uses: actions/checkout@v4'].join('\n')
    expect(scanWorkflow('.github/workflows/x.yml', wf).map((f) => f.patternId)).toContain('unpinned-action')
  })

  it('accepts a full 40-character SHA pin', () => {
    const wf = ['name: CI', 'permissions:', '  contents: read', 'jobs:', '  a:', '    timeout-minutes: 10', '    steps:', `      - uses: actions/checkout@${pinned} # v4.2.2`].join('\n')
    expect(scanWorkflow('.github/workflows/x.yml', wf).map((f) => f.patternId)).not.toContain('unpinned-action')
  })

  it('flags write-all permissions', () => {
    const wf = ['name: CI', 'permissions: write-all', 'jobs:', '  a:', '    timeout-minutes: 5', '    steps: []'].join('\n')
    expect(scanWorkflow('.github/workflows/x.yml', wf).map((f) => f.patternId)).toContain('broad-permissions')
  })

  it('flags a missing permissions block', () => {
    const wf = ['name: CI', 'jobs:', '  a:', '    timeout-minutes: 5', '    steps: []'].join('\n')
    expect(scanWorkflow('.github/workflows/x.yml', wf).map((f) => f.patternId)).toContain('missing-permissions')
  })

  it('flags a missing job timeout', () => {
    const wf = ['name: CI', 'permissions:', '  contents: read', 'jobs:', '  build:', '    steps: []'].join('\n')
    expect(scanWorkflow('.github/workflows/x.yml', wf).map((f) => f.patternId)).toContain('missing-timeout')
  })

  it('flags pull_request_target and untrusted interpolation', () => {
    const wf = [
      'name: Risky', 'on:', '  pull_request_target:', 'permissions:', '  contents: read',
      'jobs:', '  a:', '    timeout-minutes: 5', '    steps:',
      '      - run: echo "${{ github.event.pull_request.title }}"',
    ].join('\n')
    const ids = scanWorkflow('.github/workflows/x.yml', wf).map((f) => f.patternId)
    expect(ids).toContain('pull-request-target')
    expect(ids).toContain('untrusted-interpolation')
  })
})

describe('redaction helper', () => {
  it('keeps only a short prefix and suffix', () => {
    const out = redact('abcdefghijklmnopqrstuvwxyz')
    expect(out.startsWith('abcd')).toBe(true)
    expect(out.endsWith('wxyz')).toBe(true)
    expect(out).toContain('*')
    expect(out).not.toContain('efghijklmnop')
  })

  it('fully masks a short value', () => {
    expect(redact('abc')).toBe('***')
  })

  it('recognises placeholder text', () => {
    expect(looksLikePlaceholder('your-key-here')).toBe(true)
    expect(looksLikePlaceholder('AKIA' + 'Q'.repeat(16))).toBe(false)
  })
})

/**
 * Review finding 1: the allowlist previously exempted every pattern for the
 * whole `scripts/security/` directory, which disabled secret scanning for any
 * file added there. These lock the narrow replacement in place.
 */
describe('allowlist is structurally narrow', () => {
  it('passes its own structural validation', () => {
    expect(validateAllowlist()).toEqual([])
  })

  it('contains no directory-wide entry', () => {
    for (const entry of ALLOWLIST) {
      expect(entry.path.endsWith('/')).toBe(false)
    }
  })

  it('contains no wildcard pattern exemption', () => {
    for (const entry of ALLOWLIST) {
      expect(entry.patterns).not.toContain('*')
    }
  })

  it('grants scripts/security/ no blanket exemption', () => {
    expect(isAllowed('scripts/security/scan-repository.mjs', 'aws-access-key')).toBe(false)
    expect(isAllowed('scripts/security/scan-staged.mjs', 'github-token')).toBe(false)
    expect(isAllowed('scripts/security/scan-core.mjs', 'stripe-secret')).toBe(false)
    expect(isAllowed('scripts/security/allowlist.mjs', 'openai-key')).toBe(false)
  })

  it('still blocks a secret planted in an unrelated security file', () => {
    const planted = `const k = "AKIA${'Q'.repeat(16)}"`
    const findings = scanTextForSecrets(planted, 'scripts/security/scan-workflows.mjs')
    expect(findings.map((f) => f.patternId)).toContain('aws-access-key')
  })

  it('still blocks a secret in a NEW file added under scripts/security/', () => {
    const planted = `const t = "ghp_${'b'.repeat(36)}"`
    const findings = scanTextForSecrets(planted, 'scripts/security/some-future-helper.mjs')
    expect(findings.map((f) => f.patternId)).toContain('github-token')
  })

  it('exempts only the exact declared file and pattern', () => {
    // patterns.mjs may carry the connection-string example, nothing else.
    expect(isAllowed('scripts/security/patterns.mjs', 'connection-string')).toBe(true)
    expect(isAllowed('scripts/security/patterns.mjs', 'aws-access-key')).toBe(false)
  })

  it('rejects a directory or wildcard entry if one is ever reintroduced', () => {
    const bad = [
      { path: 'scripts/security/', patterns: ['aws-access-key'], reason: 'a sufficiently long reason' },
      { path: 'src/thing.ts', patterns: ['*'], reason: 'a sufficiently long reason' },
    ]
    const problems = validateAllowlist(bad)
    expect(problems.join(' ')).toMatch(/directory-wide/)
    expect(problems.join(' ')).toMatch(/wildcard/)
  })
})

/**
 * Review finding 2: the timeout rule previously passed if *any* single
 * timeout-minutes existed anywhere in the file, and counted keys under `on:`
 * as jobs.
 */
describe('per-job timeout enforcement', () => {
  const sha = '0'.repeat(40)
  const wf = (jobs) =>
    ['name: T', 'on:', '  pull_request:', '  push:', '    branches: [main]',
     'permissions:', '  contents: read', 'jobs:', ...jobs].join('\n')

  it('passes with one job that has a timeout', () => {
    const text = wf(['  build:', '    runs-on: ubuntu-latest', '    timeout-minutes: 10', '    steps: []'])
    expect(parseJobs(text).map((j) => [j.name, j.hasOwnTimeout])).toEqual([['build', true]])
    expect(scanWorkflow('w.yml', text).map((f) => f.patternId)).not.toContain('missing-timeout')
  })

  it('passes with two jobs that both have timeouts', () => {
    const text = wf([
      '  build:', '    runs-on: ubuntu-latest', '    timeout-minutes: 10', '    steps: []',
      '  test:', '    runs-on: ubuntu-latest', '    timeout-minutes: 20', '    steps: []',
    ])
    expect(parseJobs(text).map((j) => j.hasOwnTimeout)).toEqual([true, true])
    expect(scanWorkflow('w.yml', text).map((f) => f.patternId)).not.toContain('missing-timeout')
  })

  it('fails when one of two jobs is missing its timeout', () => {
    const text = wf([
      '  build:', '    runs-on: ubuntu-latest', '    timeout-minutes: 10', '    steps: []',
      '  untimed:', '    runs-on: ubuntu-latest', '    steps: []',
    ])
    expect(parseJobs(text).map((j) => [j.name, j.hasOwnTimeout])).toEqual([
      ['build', true],
      ['untimed', false],
    ])
    const findings = scanWorkflow('w.yml', text).filter((f) => f.patternId === 'missing-timeout')
    expect(findings).toHaveLength(1)
    expect(findings[0].label).toContain('untimed')
  })

  it('does not treat keys under on: or permissions: as jobs', () => {
    const text = wf(['  build:', '    runs-on: ubuntu-latest', '    timeout-minutes: 5', '    steps: []'])
    expect(parseJobs(text).map((j) => j.name)).toEqual(['build'])
  })

  it('does not count a step-level timeout as the job timeout', () => {
    const text = wf([
      '  build:', '    runs-on: ubuntu-latest', '    steps:',
      '      - name: slow', '        timeout-minutes: 5', `        uses: actions/checkout@${sha} # v4`,
    ])
    expect(parseJobs(text)[0].hasOwnTimeout).toBe(false)
  })

  it('stops at the next top-level key after jobs:', () => {
    const text = [
      'name: T', 'jobs:', '  build:', '    timeout-minutes: 5', '    steps: []',
      'concurrency:', '  group: x',
    ].join('\n')
    expect(parseJobs(text).map((j) => j.name)).toEqual(['build'])
  })

  it('returns no jobs when there is no jobs: block', () => {
    expect(parseJobs('name: T\non:\n  push:\n')).toEqual([])
  })

  it('reports every untimed job, not just the first', () => {
    const text = wf([
      '  a:', '    runs-on: ubuntu-latest', '    steps: []',
      '  b:', '    runs-on: ubuntu-latest', '    steps: []',
    ])
    const findings = scanWorkflow('w.yml', text).filter((f) => f.patternId === 'missing-timeout')
    expect(findings).toHaveLength(2)
  })

  it('accepts the repository real workflows as timed', () => {
    const real = readFileSync('.github/workflows/ci.yml', 'utf8')
    const jobs = parseJobs(real)
    expect(jobs.length).toBeGreaterThan(1)
    expect(jobs.every((j) => j.hasOwnTimeout)).toBe(true)
  })
})

/**
 * Review finding 3: the pre-commit staged scanner checked only credentials
 * and forbidden paths, so third-party personal data could be committed.
 * `scan-staged.mjs` now also runs the personal-data detector; these cover the
 * detector behaviour it relies on.
 */
describe('staged personal-data detection', () => {
  it.each([
    ['third-party email', 'owner: buyer@somerandomseller.net', 'email'],
    ['phone number', 'contact 555-123-4567', 'phone'],
    ['social profile URL', 'see linkedin.com/in/someprospect', 'profile-url'],
  ])('blocks a synthetic %s in staged content', (_label, line, expected) => {
    const findings = scanTextForPersonalData(line, 'docs/notes.md')
    expect(findings.map((f) => f.patternId)).toContain(expected)
  })

  it.each([
    ['the public project address', 'hello@skumetra.com'],
    ['a reserved documentation domain', 'jordan@example.com'],
    ['a UI placeholder', 'placeholder="you@yourstore.com"'],
    ['public owner attribution', '**Owner:** Andrey Grubin · **Status:** Active'],
    ['a docs example address', 'someone@example.com'],
  ])('allows %s', (_label, line) => {
    expect(scanTextForPersonalData(line, 'src/x.tsx')).toHaveLength(0)
  })

  it('redacts personal values rather than echoing them', () => {
    const [f] = scanTextForPersonalData('buyer@somerandomseller.net', 'docs/x.md')
    expect(f.redacted).not.toBe('buyer@somerandomseller.net')
    expect(f.redacted).toContain('*')
  })

  it('scan-staged wires all three detectors together', () => {
    const src = readFileSync('scripts/security/scan-staged.mjs', 'utf8')
    expect(src).toContain('scanTextForSecrets')
    expect(src).toContain('scanPathForForbidden')
    expect(src).toContain('scanTextForPersonalData')
  })
})

/**
 * Review finding 1: the repository scan walked the filesystem while claiming
 * to scan tracked files, so a normal ignored .env.local containing local dev
 * credentials would fail `security:scan` and therefore `verify:push`.
 *
 * These drive the real script in a throwaway Git repository so the behaviour
 * is proven end-to-end rather than asserted about a helper.
 */
describe('repository scan is Git-aware', () => {
  const SCANNER = resolve('scripts/security/scan-repository.mjs')
  const FAKE_AWS = 'AKIA' + 'Q'.repeat(16)

  /** Runs the real scanner against a temp repo. Returns { code, out }. */
  function runScan(setup) {
    const dir = mkdtempSync(join(tmpdir(), 'skumetra-scan-'))
    try {
      execFileSync('git', ['init', '-q'], { cwd: dir })
      execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir })
      execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir })
      setup(dir)
      const res = spawnSync(process.execPath, [SCANNER, '--root', dir], {
        cwd: dir, encoding: 'utf8',
      })
      return { code: res.status, out: `${res.stdout}${res.stderr}` }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  it('ignores an untracked, gitignored .env.local holding dev credentials', () => {
    const { code, out } = runScan((dir) => {
      writeFileSync(join(dir, '.gitignore'), '.env\n.env*.local\n')
      // Exactly what a correctly-configured developer machine looks like.
      writeFileSync(join(dir, '.env.local'), `AWS_KEY=${FAKE_AWS}\n`)
      writeFileSync(join(dir, 'index.js'), 'export const ok = true\n')
      execFileSync('git', ['add', '.gitignore', 'index.js'], { cwd: dir })
    })
    expect(code).toBe(0)
    expect(out).toContain('clean')
  })

  it('blocks a .env.local that has been force-added to the index', () => {
    const { code, out } = runScan((dir) => {
      writeFileSync(join(dir, '.gitignore'), '.env*.local\n')
      writeFileSync(join(dir, '.env.local'), `AWS_KEY=${FAKE_AWS}\n`)
      execFileSync('git', ['add', '-f', '.gitignore', '.env.local'], { cwd: dir })
    })
    expect(code).toBe(1)
    expect(out).toContain('env-real')
  })

  it('blocks a synthetic secret in a tracked source file', () => {
    const { code, out } = runScan((dir) => {
      writeFileSync(join(dir, 'app.js'), `const key = "${FAKE_AWS}"\n`)
      execFileSync('git', ['add', 'app.js'], { cwd: dir })
    })
    expect(code).toBe(1)
    expect(out).toContain('aws-access-key')
    // The value itself must never be echoed back.
    expect(out).not.toContain(FAKE_AWS)
  })

  it('fails loudly outside a Git repository rather than scanning nothing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skumetra-nogit-'))
    try {
      writeFileSync(join(dir, 'app.js'), 'export const ok = true\n')
      const res = spawnSync(process.execPath, [SCANNER, '--root', dir], {
        cwd: dir, encoding: 'utf8',
      })
      // 2 = error. Never 0, which would falsely report "clean".
      expect(res.status).toBe(2)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

/**
 * Review finding 2: the boundary scanner skipped personal-data detection
 * entirely for CLAUDE.md, SECURITY.md, the testing/security doc and the
 * scanner sources — the files most likely to end up quoting a real address.
 */
describe('no whole-file personal-data exemptions', () => {
  it('the exemption set is gone from the boundary scanner', () => {
    const src = readFileSync('scripts/security/scan-public-boundary.mjs', 'utf8')
    expect(src).not.toContain('BOUNDARY_DOC_EXEMPT')
  })

  it.each([
    ['CLAUDE.md', 'contact: buyer@somerandomseller.net', 'email'],
    ['SECURITY.md', 'reach me on 555-123-4567', 'phone'],
    ['docs/project/TESTING_AND_SECURITY.md', 'see linkedin.com/in/someprospect', 'profile-url'],
    ['scripts/security/scan-workflows.mjs', '// owner: buyer@somerandomseller.net', 'email'],
  ])('detects third-party personal data in %s', (file, line, expected) => {
    expect(scanTextForPersonalData(line, file).map((f) => f.patternId)).toContain(expected)
  })

  it.each([
    ['CLAUDE.md', 'Questions: hello@skumetra.com'],
    ['SECURITY.md', 'Email hello@skumetra.com'],
    ['docs/project/TESTING_AND_SECURITY.md', '**Owner:** Andrey Grubin · **Status:** Active'],
  ])('still allows the legitimate case in %s', (file, line) => {
    expect(scanTextForPersonalData(line, file)).toHaveLength(0)
  })

  it('documentation may reference a private path without bypassing detection', () => {
    // Naming the location is fine; it is content, not a path being tracked.
    const line = 'Business-sensitive material lives on the local-only docs/private branch.'
    expect(scanTextForPersonalData(line, 'CLAUDE.md')).toHaveLength(0)
  })
})
