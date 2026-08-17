import { describe, it, expect } from 'vitest'
import {
  scanTextForSecrets,
  scanPathForForbidden,
  scanTextForPersonalData,
  shouldSkip,
  toPosix,
} from './scan-core.mjs'
import { scanWorkflow } from './scan-workflows.mjs'
import { redact, looksLikePlaceholder } from './patterns.mjs'
import { isAllowed } from './allowlist.mjs'

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

  it('allows synthetic sample domains used in fixtures', () => {
    expect(scanTextForPersonalData('jordan@northline.com', 'tests/e2e/x.spec.ts')).toHaveLength(0)
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

  it('matches directory prefixes but not partial names', () => {
    expect(isAllowed('scripts/security/patterns.mjs', 'aws-access-key')).toBe(true)
    expect(isAllowed('scripts/security-notes.md', 'aws-access-key')).toBe(false)
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
