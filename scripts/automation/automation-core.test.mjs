import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  LABELS, MAX_REMEDIATION_CYCLES, CLAUDE_BRANCH_PREFIX, CLAUDE_BRANCH_TEMPLATE,
  MAIN_REQUIRED_CHECKS,
  authorizeActor, validateTaskIssue, checkProtectedPaths, isProtectedPath,
  validateImplementationHandoff,
  validatePullRequest, checkApprovalSha, evaluateRequiredChecks, requiredCheckUnion,
  claudeBranchName, planIssueWork, validateApprovalCommand,
  isBranchDeletable, canRemediate, decideReviewGate, evaluatePostMergeGate,
  issueNumberFromBranch,
  exactDeploymentMatches, evaluatePageSmoke, evaluateApexRedirect,
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

/** Vitest runs from the package root; import.meta.url is not a file URL here. */
const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')

/**
 * Splits a workflow into [jobName, jobBody] pairs.
 *
 * Regex rather than a YAML parser on purpose: this repository deliberately
 * keeps its workflow checks dependency-free, and the properties asserted below
 * are textual ones — which ref a checkout names, which module path an import
 * resolves against.
 */
function jobsOf(yaml) {
  const lines = yaml.split('\n')
  const starts = []
  lines.forEach((line, i) => {
    const m = line.match(/^ {2}([A-Za-z_][A-Za-z0-9_-]*):\s*$/)
    if (m && !/^ {2}(on|jobs|permissions|concurrency|env|defaults)\s*:/.test(line)) starts.push([m[1], i])
  })
  const jobsLine = lines.findIndex((l) => /^jobs:\s*$/.test(l))
  return starts
    .filter(([, i]) => i > jobsLine)
    .map(([name, i], idx, all) => {
      const end = idx + 1 < all.length ? all[idx + 1][1] : lines.length
      return [name, lines.slice(i, end).join('\n')]
    })
}

/** Splits a job body into its steps. */
function stepsOf(jobBody) {
  return jobBody.split(/\n(?= {6}- name: )/).slice(1)
}

/** The `ref` and `path` a checkout step names, or null if it is not one. */
function checkoutOf(step) {
  if (!/uses:\s*actions\/checkout@/.test(step)) return null
  return {
    ref: step.match(/^\s*ref:\s*(\S+)\s*$/m)?.[1] ?? null,
    path: step.match(/^\s*path:\s*(\S+)\s*$/m)?.[1] ?? null,
  }
}

const POLICY_MODULE_RE = /\$\{process\.env\.([A-Z_]+)\}\/scripts\/automation\/(?:automation-core|github-api|review-gate)\.mjs/g

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
    labels: [LABELS.MANAGED, LABELS.OWNER_REVIEW, LABELS.APPROVED],
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
    expect(validatePullRequest({ ...base, labels: [LABELS.OWNER_REVIEW, LABELS.APPROVED] }).ok).toBe(false)
  })

  it('rejects a PR that has not reached owner-review', () => {
    expect(validatePullRequest({ ...base, labels: [LABELS.MANAGED, LABELS.APPROVED] }).ok).toBe(false)
  })

  it('rejects a PR without approved-to-merge', () => {
    expect(validatePullRequest({ ...base, labels: [LABELS.MANAGED, LABELS.OWNER_REVIEW] }).ok).toBe(false)
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
    expect(validatePullRequest({ ...base, labels: [...base.labels, LABELS.PRODUCTION_FAILED] }).ok).toBe(false)
  })

  it('rejects a draft or closed PR', () => {
    expect(validatePullRequest({ ...base, draft: true }).ok).toBe(false)
    expect(validatePullRequest({ ...base, state: 'closed' }).ok).toBe(false)
  })
})

describe('implementation handoff', () => {
  it('refuses failed Claude, missing or duplicate PRs, and scope failure', () => {
    expect(validateImplementationHandoff({ claudeSucceeded: false, openPullRequests: 1, scopeOk: true }).ok).toBe(false)
    expect(validateImplementationHandoff({ claudeSucceeded: true, openPullRequests: 0, scopeOk: true }).ok).toBe(false)
    expect(validateImplementationHandoff({ claudeSucceeded: true, openPullRequests: 2, scopeOk: true }).ok).toBe(false)
    expect(validateImplementationHandoff({ claudeSucceeded: true, openPullRequests: 1, scopeOk: false }).ok).toBe(false)
  })

  it('allows exactly one complete in-scope implementation into review', () => {
    expect(validateImplementationHandoff({ claudeSucceeded: true, openPullRequests: 1, scopeOk: true }).ok).toBe(true)
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

  it('unions ruleset requirements with the non-weakening baseline', () => {
    expect(requiredCheckUnion({ baseline: REQUIRED, rulesetChecks: ['Custom policy', REQUIRED[0]] }))
      .toEqual([...REQUIRED, 'Custom policy'])
    expect(requiredCheckUnion({ baseline: REQUIRED, rulesetChecks: [] })).toEqual(REQUIRED)
  })

  it('keeps Dependency review in the exact-main baseline', () => {
    expect(MAIN_REQUIRED_CHECKS).toContain('Dependency review')
  })
})

describe('branch naming and cleanup', () => {
  it('builds a deterministic branch name', () => {
    // Five words of the title, kebab-cased.
    expect(claudeBranchName(42, 'Import column preview for supplier files'))
      .toBe('claude/issue-42-import-column-preview-for-supplier')
    expect(claudeBranchName(7, 'Fix foo/bar now')).toBe('claude/issue-7-fix-foobar-now')
  })

  it('produces a name its own validator accepts', () => {
    const name = claudeBranchName(42, 'Add supplier cost delta badge')
    expect(validatePullRequest({
      labels: [LABELS.MANAGED, LABELS.OWNER_REVIEW, LABELS.APPROVED], headRef: name, baseRef: 'main',
      headRepoFullName: 'a/b', baseRepoFullName: 'a/b', authorLogin: 'andreygrubinnyc',
    }).ok).toBe(true)
  })

  it('keeps the pure builder aligned with the pinned action inputs', () => {
    expect(CLAUDE_BRANCH_PREFIX).toBe('claude/')
    expect(CLAUDE_BRANCH_TEMPLATE).toBe('{{prefix}}{{entityType}}-{{entityNumber}}-{{description}}')

    const workflow = readFileSync(join(process.cwd(), '.github/workflows/claude-issue-to-pr.yml'), 'utf8')
    expect(workflow).toContain(`branch_prefix: ${CLAUDE_BRANCH_PREFIX}`)
    expect(workflow).toContain(`branch_name_template: '${CLAUDE_BRANCH_TEMPLATE}'`)
    // Punctuation is removed inside each whitespace-delimited word rather
    // than converted into an additional word, exactly as upstream does.
    expect(claudeBranchName(7, 'Fix foo/bar now')).toBe('claude/issue-7-fix-foobar-now')
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

describe('one issue, one branch, one active pull request', () => {
  const issueNumber = 42
  const title = 'Import column preview for supplier files'
  const branch = claudeBranchName(issueNumber, title)

  it('starts once when no branch or pull request exists', () => {
    expect(planIssueWork({ issueNumber, title })).toMatchObject({ ok: true, state: 'start', branch })
  })

  it('rejects a title that cannot produce the action\'s required slug', () => {
    expect(planIssueWork({ issueNumber, title: '🚀 🚀' }).state).toBe('invalid-title')
  })

  it('resumes an existing branch without creating another', () => {
    expect(planIssueWork({ issueNumber, title, matchingBranches: [branch] }))
      .toMatchObject({ ok: true, state: 'resume-branch', branch })
  })

  it('resumes the only open pull request', () => {
    const pullRequest = { number: 9, headRef: branch, state: 'open', merged: false }
    expect(planIssueWork({ issueNumber, title, matchingBranches: [branch], pullRequests: [pullRequest] }))
      .toMatchObject({ ok: true, state: 'resume-pr', pullRequest })
  })

  it('fails closed for a wrong branch, duplicate PR, closed PR, or merged PR', () => {
    expect(planIssueWork({ issueNumber, title, matchingBranches: [`claude/issue-${issueNumber}-wrong`] }).ok).toBe(false)
    const open = { headRef: branch, state: 'open', merged: false }
    expect(planIssueWork({ issueNumber, title, matchingBranches: [branch], pullRequests: [open, open] }).state).toBe('ambiguous')
    expect(planIssueWork({ issueNumber, title, matchingBranches: [branch], pullRequests: [{ ...open, state: 'closed' }] }).state).toBe('closed')
    expect(planIssueWork({ issueNumber, title, matchingBranches: [branch], pullRequests: [{ ...open, state: 'closed', merged: true }] }).state).toBe('merged')
  })
})

describe('owner review and remediation gate', () => {
  const success = { state: 'success', failed: [], pending: [] }
  const failure = (name) => ({ state: 'failed', failed: [{ name, conclusion: 'failure' }], pending: [] })

  it('adds owner-review only after scope, internal review, and all checks pass', () => {
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: success, cycles: 0 }).state)
      .toBe('owner-review')
  })

  it('remediates eligible failures in cycles one and two, then stops', () => {
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: failure('Vercel'), cycles: 0 }))
      .toMatchObject({ state: 'remediate', cycle: 1 })
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: failure('CodeQL analysis'), cycles: 1 }))
      .toMatchObject({ state: 'remediate', cycle: 2 })
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: failure('Dependency review'), cycles: 2 }).state)
      .toBe('failed')
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: failure('Dependency review'), cycles: 2 }).reason)
      .toContain('Dependency review (failure)')
  })

  it('never bypasses pending, unknown, scope, or owner-decision failures', () => {
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: { state: 'pending' } }).state).toBe('failed')
    expect(decideReviewGate({ scopeOk: true, internalReview: 'pass', checkVerdict: failure('Unknown policy') }).state).toBe('failed')
    expect(decideReviewGate({ scopeOk: false, internalReview: 'pass', checkVerdict: success }).state).toBe('blocked')
    expect(decideReviewGate({ scopeOk: true, internalReview: 'owner-decision', checkVerdict: success }).state).toBe('blocked')
    expect(decideReviewGate({ scopeOk: true, internalReview: 'failed', checkVerdict: success }).state).toBe('failed')
  })
})

describe('approval command', () => {
  it('accepts only /approve-merge on a pull request, with surrounding whitespace', () => {
    expect(validateApprovalCommand({ body: '  /approve-merge\n', isPullRequest: true }).ok).toBe(true)
    expect(validateApprovalCommand({ body: '/approve-merge please', isPullRequest: true }).ok).toBe(false)
    expect(validateApprovalCommand({ body: '/approve-merge', isPullRequest: false }).ok).toBe(false)
  })
})

describe('post-merge completion gate', () => {
  it('completes only when main checks, deployment, and smoke all pass', () => {
    expect(evaluatePostMergeGate({ mainChecks: 'success', deployment: 'success', smoke: 'success' }).state)
      .toBe('success')
  })

  it('distinguishes a main-check failure from an incomplete gate', () => {
    expect(evaluatePostMergeGate({ mainChecks: 'failed', deployment: 'success', smoke: 'success' }))
      .toMatchObject({ state: 'failed', failed: ['mainChecks'] })
    expect(evaluatePostMergeGate({ mainChecks: 'success', deployment: 'pending', smoke: 'pending' }).state)
      .toBe('pending')
  })
})

describe('read-only production smoke decisions', () => {
  const sha = 'a'.repeat(40)

  it('continues only for the exact full production SHA', () => {
    expect(exactDeploymentMatches(sha, sha)).toBe(true)
    expect(exactDeploymentMatches(sha, 'b'.repeat(40))).toBe(false)
    expect(exactDeploymentMatches(sha, sha.slice(0, 7))).toBe(false)
  })

  it('fails a missing Privacy or Terms identity', () => {
    expect(evaluatePageSmoke({ status: 200, body: '<h1>Privacy Policy</h1>', requiredText: ['Privacy Policy', 'Skumetra'] }).ok)
      .toBe(false)
    expect(evaluatePageSmoke({ status: 200, body: '<h1>Terms of Service</h1> Skumetra', requiredText: ['Terms of Service', 'Skumetra'] }).ok)
      .toBe(true)
    expect(evaluatePageSmoke({ status: 500, body: 'Skumetra Terms of Service', requiredText: ['Terms of Service', 'Skumetra'] }).ok)
      .toBe(false)
  })

  it('requires a redirect to the exact apex hostname', () => {
    expect(evaluateApexRedirect({ status: 308, location: 'https://skumetra.com/', apexHost: 'skumetra.com' }).ok).toBe(true)
    expect(evaluateApexRedirect({ status: 308, location: 'https://evil.example/?next=skumetra.com', apexHost: 'skumetra.com' }).ok).toBe(false)
    expect(evaluateApexRedirect({ status: 200, location: 'https://skumetra.com/', apexHost: 'skumetra.com' }).ok).toBe(false)
  })
})

describe('the issue template and the guards agree', () => {
  // Vitest runs from the package root; import.meta.url is not a file URL here.

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

  it('keeps protected approval on the default-branch issue-comment event', () => {
    const yaml = read('.github/workflows/claude-approved-merge.yml')
    expect(yaml).toContain('issue_comment:')
    expect(yaml).toContain('types: [created]')
    expect(yaml).toContain("ref: main")
    expect(yaml).toContain('/approve-merge')
    expect(yaml).toContain('sha: approvedSha')
    expect(yaml).toContain('OWNER RE-APPROVAL REQUIRED')
    expect(yaml).not.toContain('pull_request_target')
  })

  it('uses the Claude GitHub App for Git identity and either static Anthropic credential', () => {
    // Anthropic authentication and GitHub identity are separate things. Either
    // official Anthropic credential is accepted; the GitHub identity is always
    // the App, never the repository token.
    const yaml = read('.github/workflows/claude-issue-to-pr.yml')
    expect(yaml).toContain('anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}')
    expect(yaml).toContain('claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}')
    expect(yaml).toContain('if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ]')
    // With no github_token input, setupGitHubToken() takes the OIDC route and
    // exchanges the token for a Claude GitHub App installation token. Passing
    // GITHUB_TOKEN would short-circuit that and its pushes would start no CI.
    expect(yaml).not.toContain('github_token: ${{ secrets.GITHUB_TOKEN }}')
  })

  it('grants id-token only to the jobs that call the Claude Action', () => {
    for (const file of ['claude-issue-to-pr.yml', 'claude-approved-merge.yml']) {
      for (const [name, body] of jobsOf(read(`.github/workflows/${file}`))) {
        const wantsOidc = body.includes('anthropics/claude-code-action@')
        const grantsOidc = /^\s*id-token:\s*write/m.test(body)
        expect(grantsOidc, `${file}:${name} — id-token: write belongs only on Claude Action jobs`)
          .toBe(wantsOidc)
      }
    }
  })

  it('consumes start authority and checks every continue-on-error Claude result', () => {
    const yaml = read('.github/workflows/claude-issue-to-pr.yml')
    expect(yaml.indexOf('await remove(issueNumber, policy.LABELS.READY)'))
      .toBeLessThan(yaml.indexOf('Run Claude on a new deterministic branch'))
    expect(yaml).toContain("CLAUDE_SUCCEEDED: ${{ steps.claude-new.outcome == 'success' || steps.claude-resume.outcome == 'success' }}")
    expect(yaml).toContain('ACTION_OUTCOME: ${{ steps.internal-review.outcome }}')
    expect(yaml).toContain('REMEDIATION_OUTCOME: ${{ steps.remediate-1.outcome }}')
    expect(yaml).toContain('REMEDIATION_OUTCOME: ${{ steps.remediate-2.outcome }}')
    expect(yaml).toContain('REVIEW_OUTCOME: ${{ steps.review-remediation-1.outcome }}')
    expect(yaml).toContain('REVIEW_OUTCOME: ${{ steps.review-remediation-2.outcome }}')
    expect(yaml).toContain('**AUTOMATION FAILED**')
    expect(yaml).toContain('Attempts:\\n2')
  })

  it('runs Dependency review for PRs, exact main pushes and Claude task branches', () => {
    const yaml = read('.github/workflows/dependency-review.yml')
    expect(yaml).toContain('pull_request:')
    expect(yaml).toContain("branches: [main, 'claude/issue-*']")
    expect(yaml).toContain('base-ref: ${{ steps.refs.outputs.base }}')
    expect(yaml).toContain('head-ref: ${{ github.sha }}')
    // A task branch is compared with main, not with its own previous tip: a
    // dependency added by an earlier commit on the branch must not slip past.
    expect(yaml).toContain('base=main')
  })

  it('puts every required check on the pushed Claude branch SHA', () => {
    // The pull request cannot trigger them — it is opened with GITHUB_TOKEN,
    // whose events GitHub suppresses — so the App's push has to.
    for (const file of ['ci.yml', 'codeql.yml', 'dependency-review.yml']) {
      expect(read(`.github/workflows/${file}`), file).toContain("branches: [main, 'claude/issue-*']")
    }
  })

  it('keeps production verification read-only and covers every public route', () => {
    const smoke = read('scripts/automation/production-smoke.mjs')
    for (const route of ['/api/version', '/pilot', '/privacy', '/terms']) expect(smoke).toContain(route)
    expect(smoke).toContain('www redirects to the apex domain')
    expect(smoke).not.toMatch(/method:\s*['"]POST['"]/)
  })
})

describe('policy is never read from the change it is judging', () => {
  // The model may hold Write on the pull-request branch. The deterministic code
  // that decides whether that branch passes may not come from it.
  const WORKFLOWS = ['claude-issue-to-pr.yml', 'claude-approved-merge.yml']

  const analyse = (file) =>
    jobsOf(read(`.github/workflows/${file}`)).map(([name, body]) => {
      const steps = stepsOf(body)
      const checkouts = steps.map(checkoutOf).filter(Boolean)
      const importing = steps
        .map((step, index) => ({ step, index, bases: [...step.matchAll(POLICY_MODULE_RE)].map((m) => m[1]) }))
        .filter((entry) => entry.bases.length > 0)
      return { file, name, steps, checkouts, importing }
    })

  const jobs = WORKFLOWS.flatMap(analyse)
  const deciding = jobs.filter((job) => job.importing.length > 0)

  it('finds the jobs that make decisions', () => {
    // Guards the guard: if this drops to nothing the assertions below pass
    // vacuously and would never notice a regression again.
    expect(deciding.length).toBeGreaterThanOrEqual(5)
  })

  it.each(jobs.filter((j) => j.importing.length).map((j) => [`${j.file}:${j.name}`, j]))(
    '%s has a checkout to import its policy from',
    (_label, job) => {
      // The failure this exists for: a terminal-decision job with no checkout
      // at all, whose import of automation-core.mjs throws ERR_MODULE_NOT_FOUND
      // on its first line, so no pull request can ever be labelled.
      expect(job.checkouts.length).toBeGreaterThan(0)
    },
  )

  it.each(jobs.filter((j) => j.importing.length).map((j) => [`${j.file}:${j.name}`, j]))(
    '%s imports policy only from a checkout of main',
    (_label, job) => {
      const trustedClone = job.checkouts.some((c) => c.ref === 'main' && c.path === '.trusted-policy')
      const workspaceIsMain =
        job.checkouts.length > 0 && job.checkouts.every((c) => c.ref === 'main' && c.path === null)

      for (const entry of job.importing) {
        for (const base of entry.bases) {
          if (base === 'TRUSTED_POLICY') {
            expect(trustedClone, `${job.name}: no "ref: main" checkout at .trusted-policy`).toBe(true)
            expect(entry.step, `${job.name}: step does not declare TRUSTED_POLICY`)
              .toContain('TRUSTED_POLICY: ${{ github.workspace }}/.trusted-policy')
          } else if (base === 'GITHUB_WORKSPACE') {
            // Only legitimate when the entire workspace is main and nothing the
            // model wrote can be in it.
            expect(workspaceIsMain, `${job.name}: imports from a workspace that is not exclusively main`)
              .toBe(true)
          } else {
            throw new Error(`${job.name}: policy imported from an unrecognised base "${base}"`)
          }
        }
      }
    },
  )

  it('re-clones the trusted policy after every model step, not once per job', () => {
    // Claude can write anywhere in the workspace between two gate steps,
    // including into .trusted-policy. A clone taken once at the top of the job
    // could therefore be edited by the change it is about to judge;
    // actions/checkout replaces the directory, so each decision reads main as
    // main actually is.
    for (const job of deciding) {
      for (const entry of job.importing) {
        if (!entry.bases.includes('TRUSTED_POLICY')) continue
        let seenTrustedCheckout = false
        for (let i = entry.index - 1; i >= 0; i--) {
          const step = job.steps[i]
          const checkout = checkoutOf(step)
          if (checkout && checkout.path === '.trusted-policy' && checkout.ref === 'main') {
            seenTrustedCheckout = true
            break
          }
          if (/uses:\s*anthropics\/claude-code-action@/.test(step)) break
        }
        expect(seenTrustedCheckout, `${job.file}:${job.name}: a model step runs after the last trusted clone`)
          .toBe(true)
      }
    }
  })

  it('never checks out a pull-request branch in a job that also decides', () => {
    for (const job of deciding) {
      const modelRefs = job.checkouts.filter((c) => c.ref !== 'main' && c.path === null)
      for (const checkout of modelRefs) {
        // A non-main primary checkout is only acceptable alongside a trusted
        // clone that the decisions actually import from.
        const trustedClone = job.checkouts.some((c) => c.ref === 'main' && c.path === '.trusted-policy')
        expect(trustedClone, `${job.file}:${job.name} checks out ${checkout.ref} with no trusted clone`).toBe(true)
        for (const entry of job.importing) {
          expect(entry.bases, `${job.file}:${job.name} decides from the checked-out branch`)
            .not.toContain('GITHUB_WORKSPACE')
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
