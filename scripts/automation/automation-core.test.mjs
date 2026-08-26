import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  LABELS, MAX_REMEDIATION_CYCLES,
  authorizeActor, validateTaskIssue, checkProtectedPaths, isProtectedPath,
  validatePullRequest, checkApprovalSha, evaluateRequiredChecks,
  claudeBranchName, isBranchDeletable, canRemediate, issueNumberFromBranch,
} from './automation-core.mjs'
import { LABEL_DEFINITIONS } from './labels.mjs'

const REQUIRED = [
  'Lint, typecheck, test, build',
  'Security scans and dependency audit',
  'End-to-end and accessibility tests',
  'Dependency review',
  'CodeQL analysis',
]
const ok = (name) => ({ name, status: 'completed', conclusion: 'success' })

describe('actor authorisation', () => {
  it.each(['write', 'maintain', 'admin'])('allows %s permission', (permission) => {
    expect(authorizeActor({ permission, actor: 'andreygrubinnyc' }).ok).toBe(true)
  })

  it.each(['read', 'triage', 'none', undefined, ''])('rejects %s permission', (permission) => {
    expect(authorizeActor({ permission, actor: 'stranger' }).ok).toBe(false)
  })

  it('rejects when no actor is supplied', () => {
    expect(authorizeActor({ permission: 'admin' }).ok).toBe(false)
  })

  it('explains why it rejected, without leaking anything sensitive', () => {
    const r = authorizeActor({ permission: 'triage', actor: 'stranger' })
    expect(r.reason).toContain('triage')
    expect(r.reason).toContain('write, maintain or admin')
  })
})

describe('task issue validation', () => {
  const base = { labels: [LABELS.READY], body: 'Data classification: Public / synthetic only', state: 'open' }

  it('allows an authorised public issue', () => {
    expect(validateTaskIssue(base).ok).toBe(true)
  })

  it('refuses an issue without the start label', () => {
    expect(validateTaskIssue({ ...base, labels: [] }).ok).toBe(false)
  })

  it('refuses an issue labelled private-no-automation', () => {
    const r = validateTaskIssue({ ...base, labels: [LABELS.READY, LABELS.PRIVATE] })
    expect(r.ok).toBe(false)
    expect(r.privateTask).toBe(true)
  })

  it('refuses a private-data issue even when the label was never applied', () => {
    // The label can be forgotten; the form answer cannot.
    const r = validateTaskIssue({
      ...base,
      body: 'Data classification: Private / real seller data involved',
    })
    expect(r.ok).toBe(false)
    expect(r.privateTask).toBe(true)
  })

  it('refuses while an owner decision is outstanding', () => {
    expect(validateTaskIssue({ ...base, labels: [LABELS.READY, LABELS.BLOCKED] }).ok).toBe(false)
  })

  it('refuses a closed or completed issue', () => {
    expect(validateTaskIssue({ ...base, state: 'closed' }).ok).toBe(false)
    expect(validateTaskIssue({ ...base, labels: [LABELS.READY, LABELS.COMPLETED] }).ok).toBe(false)
  })

  it('accepts label objects as well as strings', () => {
    expect(validateTaskIssue({ ...base, labels: [{ name: LABELS.READY }] }).ok).toBe(true)
  })
})

describe('protected-path scope guard', () => {
  it.each([
    '.github/workflows/ci.yml',
    '.github/dependabot.yml',
    '.githooks/pre-push',
    'scripts/security/patterns.mjs',
    'scripts/automation/automation-core.mjs',
    'CLAUDE.md',
    'SECURITY.md',
    'docs/project/TESTING_AND_SECURITY.md',
  ])('recognises %s as protected', (f) => expect(isProtectedPath(f)).toBe(true))

  it.each(['src/app/page.tsx', 'docs/project/RELEASE_PLAN.md', 'README.md', 'scripts/setup-hooks.mjs'])(
    'treats %s as ordinary',
    (f) => expect(isProtectedPath(f)).toBe(false),
  )

  it('blocks an ordinary issue from changing a workflow', () => {
    const r = checkProtectedPaths({
      files: ['src/app/page.tsx', '.github/workflows/ci.yml'],
      issueLabels: ['enhancement'],
    })
    expect(r.ok).toBe(false)
    expect(r.violations).toEqual(['.github/workflows/ci.yml'])
  })

  it.each(['security', 'automation-system'])('permits a %s-labelled issue to change protected paths', (label) => {
    const r = checkProtectedPaths({
      files: ['.github/workflows/ci.yml', 'scripts/security/patterns.mjs'],
      issueLabels: [label],
    })
    expect(r.ok).toBe(true)
  })

  it('allows ordinary product changes through untouched', () => {
    const r = checkProtectedPaths({ files: ['src/app/page.tsx'], issueLabels: ['enhancement'] })
    expect(r.ok).toBe(true)
    expect(r.violations).toEqual([])
  })

  it('normalises Windows separators before matching', () => {
    expect(isProtectedPath('scripts\\security\\patterns.mjs')).toBe(true)
  })
})

describe('pull-request eligibility', () => {
  const base = {
    labels: [LABELS.MANAGED, LABELS.APPROVED],
    headRef: 'claude/issue-42-import-column-preview',
    baseRef: 'main',
    headRepoFullName: 'andreygrubinnyc/skumetra',
    baseRepoFullName: 'andreygrubinnyc/skumetra',
    authorLogin: 'andreygrubinnyc',
    isFork: false, draft: false, state: 'open',
  }

  it('accepts a correct Claude-managed same-repo PR', () => {
    expect(validatePullRequest(base).ok).toBe(true)
  })

  it('rejects a Dependabot PR by branch and by actor', () => {
    expect(validatePullRequest({ ...base, headRef: 'dependabot/npm_and_yarn/zod-4.4.3' }).ok).toBe(false)
    expect(validatePullRequest({ ...base, authorLogin: 'dependabot[bot]' }).ok).toBe(false)
  })

  it('rejects a fork PR', () => {
    expect(validatePullRequest({ ...base, isFork: true }).ok).toBe(false)
    expect(validatePullRequest({ ...base, headRepoFullName: 'someone/skumetra' }).ok).toBe(false)
  })

  it('rejects a PR targeting a branch other than main', () => {
    expect(validatePullRequest({ ...base, baseRef: 'develop' }).ok).toBe(false)
  })

  it('rejects a PR without claude-managed', () => {
    expect(validatePullRequest({ ...base, labels: [LABELS.APPROVED] }).ok).toBe(false)
  })

  it('rejects a PR without approved-to-merge', () => {
    expect(validatePullRequest({ ...base, labels: [LABELS.MANAGED] }).ok).toBe(false)
  })

  it('rejects a non-Claude branch name even when labelled', () => {
    expect(validatePullRequest({ ...base, headRef: 'main' }).ok).toBe(false)
    expect(validatePullRequest({ ...base, headRef: 'feature/whatever' }).ok).toBe(false)
    // Suffix forgery must not pass an anchored pattern.
    expect(validatePullRequest({ ...base, headRef: 'evil/claude/issue-1-x' }).ok).toBe(false)
  })

  it('rejects a blocked or failed PR', () => {
    expect(validatePullRequest({ ...base, labels: [...base.labels, LABELS.BLOCKED] }).ok).toBe(false)
    expect(validatePullRequest({ ...base, labels: [...base.labels, LABELS.AUTOMATION_FAILED] }).ok).toBe(false)
  })

  it('rejects a draft or closed PR', () => {
    expect(validatePullRequest({ ...base, draft: true }).ok).toBe(false)
    expect(validatePullRequest({ ...base, state: 'closed' }).ok).toBe(false)
  })
})

describe('approval bound to the exact SHA', () => {
  const sha = 'a'.repeat(40)

  it('permits a merge when the head is unchanged', () => {
    expect(checkApprovalSha({ approvedSha: sha, currentSha: sha }).ok).toBe(true)
  })

  it('blocks a merge when the head changed after approval', () => {
    const r = checkApprovalSha({ approvedSha: sha, currentSha: 'b'.repeat(40) })
    expect(r.ok).toBe(false)
    expect(r.staleApproval).toBe(true)
    expect(r.approvedSha).toBe(sha)
  })

  it('refuses when either SHA is missing rather than assuming a match', () => {
    expect(checkApprovalSha({ approvedSha: sha }).ok).toBe(false)
    expect(checkApprovalSha({ currentSha: sha }).ok).toBe(false)
    expect(checkApprovalSha({}).ok).toBe(false)
  })
})

describe('required-check verification', () => {
  it('continues when every required check succeeded', () => {
    const r = evaluateRequiredChecks({ requiredChecks: REQUIRED, checkResults: REQUIRED.map(ok) })
    expect(r.state).toBe('success')
  })

  it('blocks when a required check failed', () => {
    const results = REQUIRED.map(ok)
    results[1] = { name: REQUIRED[1], status: 'completed', conclusion: 'failure' }
    const r = evaluateRequiredChecks({ requiredChecks: REQUIRED, checkResults: results })
    expect(r.state).toBe('failed')
    expect(r.failed[0].name).toBe(REQUIRED[1])
  })

  it('waits when a required check is still running', () => {
    const results = REQUIRED.map(ok)
    results[2] = { name: REQUIRED[2], status: 'in_progress', conclusion: null }
    expect(evaluateRequiredChecks({ requiredChecks: REQUIRED, checkResults: results }).state).toBe('pending')
  })

  it('treats a check that never reported as pending, never as an implicit pass', () => {
    const r = evaluateRequiredChecks({ requiredChecks: REQUIRED, checkResults: REQUIRED.slice(0, 4).map(ok) })
    expect(r.state).toBe('pending')
    expect(r.pending[0].name).toBe('CodeQL analysis')
  })

  it('reports failure ahead of pending when both are present', () => {
    const results = [
      { name: REQUIRED[0], status: 'completed', conclusion: 'failure' },
      { name: REQUIRED[1], status: 'in_progress', conclusion: null },
    ]
    expect(evaluateRequiredChecks({ requiredChecks: REQUIRED, checkResults: results }).state).toBe('failed')
  })

  it('does not treat extra unrelated successful checks as satisfying a requirement', () => {
    const r = evaluateRequiredChecks({
      requiredChecks: REQUIRED,
      checkResults: [...REQUIRED.slice(0, 4).map(ok), ok('Vercel')],
    })
    expect(r.state).toBe('pending')
  })
})

describe('branch naming and cleanup', () => {
  it('builds a deterministic branch name', () => {
    // Five words of the title, kebab-cased.
    expect(claudeBranchName(42, 'Import column preview for supplier files'))
      .toBe('claude/issue-42-import-column-preview-for-supplier')
    expect(claudeBranchName(7, '')).toBe('claude/issue-7-task')
  })

  it('produces a name its own validator accepts', () => {
    const name = claudeBranchName(42, 'Add supplier cost delta badge')
    expect(validatePullRequest({
      labels: [LABELS.MANAGED, LABELS.APPROVED], headRef: name, baseRef: 'main',
      headRepoFullName: 'a/b', baseRepoFullName: 'a/b', authorLogin: 'andreygrubinnyc',
    }).ok).toBe(true)
  })

  it('allows deleting a merged Claude task branch', () => {
    expect(isBranchDeletable('claude/issue-42-import-column-preview').ok).toBe(true)
  })

  it.each([
    ['main', 'main'],
    ['a Dependabot branch', 'dependabot/npm_and_yarn/zod-4.4.3'],
    ['a private validation branch', 'validation/pilot-readiness-package'],
    ['a private docs branch', 'docs/private'],
    ['an unrelated branch', 'security/repository-hardening'],
    ['an empty name', ''],
  ])('never deletes %s', (_label, branch) => {
    expect(isBranchDeletable(branch).ok).toBe(false)
  })
})

describe('bounded remediation', () => {
  it('permits attempts up to the limit and then stops', () => {
    expect(canRemediate(0).ok).toBe(true)
    expect(canRemediate(1).ok).toBe(true)
    expect(canRemediate(MAX_REMEDIATION_CYCLES).ok).toBe(false)
    expect(canRemediate(99).ok).toBe(false)
  })

  it('reports the remaining budget', () => {
    expect(canRemediate(1).remaining).toBe(MAX_REMEDIATION_CYCLES - 1)
  })

  it('defaults to a bounded limit rather than unlimited', () => {
    expect(MAX_REMEDIATION_CYCLES).toBeLessThanOrEqual(3)
  })
})

describe('the issue template and the guards agree', () => {
  // Vitest runs from the package root; import.meta.url is not a file URL here.
  const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')

  it('rejects the exact classification string the task form produces', () => {
    const template = read('.github/ISSUE_TEMPLATE/claude-task.yml')
    const option = template.match(/^\s*-\s*(Private \/ .*)$/m)?.[1]
    expect(option, 'the private-data option disappeared from the task form').toBeTruthy()

    // GitHub renders a dropdown answer as its own line under the field heading.
    const renderedBody = `### Data classification\n\n${option}\n`
    const result = validateTaskIssue({ labels: [LABELS.READY], body: renderedBody })
    expect(result.ok).toBe(false)
    expect(result.privateTask).toBe(true)
  })

  it('defines every label the workflows and guards refer to', () => {
    const defined = new Set(LABEL_DEFINITIONS.map((l) => l.name))
    for (const name of Object.values(LABELS)) expect(defined).toContain(name)
    expect(defined.size).toBe(Object.keys(LABELS).length)
  })

  it('uses only labels that are actually defined in every workflow', () => {
    const defined = new Set(LABEL_DEFINITIONS.map((l) => l.name))
    for (const file of ['claude-issue-to-pr.yml', 'claude-approved-merge.yml']) {
      const yaml = read(`.github/workflows/${file}`)
      for (const [, name] of yaml.matchAll(/labels: \['([a-z-]+)'\]/g)) {
        expect(defined, `${file} uses an undefined label "${name}"`).toContain(name)
      }
      for (const [, name] of yaml.matchAll(/name: '([a-z-]+)',\s*\n/g)) {
        if (/^[a-z]+(-[a-z]+)+$/.test(name) && name.includes('-')) {
          // Only assert on strings that look like our label vocabulary.
          if (name.startsWith('claude') || name.startsWith('ready') || name.startsWith('owner') || name.startsWith('approved')) {
            expect(defined, `${file} removes an undefined label "${name}"`).toContain(name)
          }
        }
      }
    }
  })
})

describe('issue number from a branch', () => {
  it('reads the number a Claude branch was created for', () => {
    expect(issueNumberFromBranch('claude/issue-42-import-column-preview')).toBe(42)
    expect(issueNumberFromBranch('claude/issue-7-x')).toBe(7)
  })

  it('round-trips with the branch builder', () => {
    expect(issueNumberFromBranch(claudeBranchName(1234, 'Some task'))).toBe(1234)
  })

  it.each([
    'main',
    'dependabot/npm_and_yarn/zod-4.4.3',
    'validation/pilot-readiness-package',
    'claude/issue-abc-thing',
    'evil/claude/issue-1-x',
    '',
  ])('returns null for %s', (b) => expect(issueNumberFromBranch(b)).toBeNull())
})
