/**
 * Deterministic control logic for the Skumetra Claude automation system.
 *
 * Every security-relevant decision lives here as a pure function so it can be
 * tested directly. Workflows call these rather than embedding judgement in
 * shell or in a prompt: a guard expressed only as an instruction to a model is
 * a guard that can be talked out of. These cannot.
 *
 * No I/O, no network, no process access — inputs in, decision out.
 */

/** Labels that drive the automation state machine. */
export const LABELS = {
  READY: 'ready-for-claude',
  IN_PROGRESS: 'claude-in-progress',
  MANAGED: 'claude-managed',
  OWNER_REVIEW: 'owner-review',
  APPROVED: 'approved-to-merge',
  BLOCKED: 'blocked-owner-decision',
  AUTOMATION_FAILED: 'automation-failed',
  PRODUCTION_FAILED: 'production-verification-failed',
  COMPLETED: 'completed',
  PRIVATE: 'private-no-automation',
}

/** Repository permissions that carry engineering authority. */
export const AUTHORIZED_PERMISSIONS = new Set(['write', 'maintain', 'admin'])

/** Paths that define the security/automation system itself. */
export const PROTECTED_PATHS = [
  '.github/workflows/',
  '.github/dependabot.yml',
  '.githooks/',
  'scripts/security/',
  'scripts/automation/',
  'CLAUDE.md',
  'SECURITY.md',
  'docs/project/TESTING_AND_SECURITY.md',
]

/** Issue labels that authorise touching the protected paths above. */
export const INFRASTRUCTURE_LABELS = new Set(['security', 'automation-system'])

/** Claude-managed branches. Anchored: a suffix match would be forgeable. */
export const CLAUDE_BRANCH_RE = /^claude\/issue-\d+-[a-z0-9][a-z0-9-]*$/

/** Exact inputs supported by anthropics/claude-code-action v1.0.206. */
export const CLAUDE_BRANCH_PREFIX = 'claude/'
export const CLAUDE_BRANCH_TEMPLATE = '{{prefix}}{{entityType}}-{{entityNumber}}-{{description}}'

/** Checks that may be corrected automatically without changing product scope. */
export const REMEDIABLE_CHECK_RE =
  /(lint|typecheck|test|build|end-to-end|accessibility|codeql|dependenc|vercel|security)/i

/** Minimum PR checks. Repository rulesets may only add to this list. */
export const PR_REQUIRED_CHECKS = [
  'Lint, typecheck, test, build',
  'Security scans and dependency audit',
  'End-to-end and accessibility tests',
  'Dependency review',
  'CodeQL analysis',
  'Vercel',
]

/** Checks that run on the exact merge commit on main. */
export const MAIN_REQUIRED_CHECKS = [
  'Lint, typecheck, test, build',
  'Security scans and dependency audit',
  'End-to-end and accessibility tests',
  'Dependency review',
  'CodeQL analysis',
]

/** Maximum automatic fix cycles before handing back to a human. */
export const MAX_REMEDIATION_CYCLES = 2

function normalise(p) {
  return String(p ?? '').replace(/\\/g, '/').replace(/^\.\//, '')
}

function labelNames(labels = []) {
  return labels.map((l) => (typeof l === 'string' ? l : l?.name)).filter(Boolean)
}

/* ------------------------------------------------------------------ *
 * Actor authorisation
 * ------------------------------------------------------------------ */

/**
 * Whether an actor may grant Claude engineering authority.
 *
 * Applying a label is not itself authority — on a public repository anyone
 * with triage can add labels. The permission level is what matters.
 */
export function authorizeActor({ permission, actor } = {}) {
  if (!actor) return { ok: false, reason: 'No actor supplied.' }
  if (!AUTHORIZED_PERMISSIONS.has(permission)) {
    return {
      ok: false,
      reason: `Actor ${actor} has permission "${permission ?? 'none'}"; write, maintain or admin is required.`,
    }
  }
  return { ok: true, reason: `Actor ${actor} has ${permission} permission.` }
}

/* ------------------------------------------------------------------ *
 * Task (issue) validation
 * ------------------------------------------------------------------ */

/** Issue body marker produced by the task form's data-classification field. */
const PRIVATE_DATA_MARKER = /private\s*\/\s*real seller data involved/i

/**
 * Whether an issue may enter the public automation system.
 *
 * Refuses on the private-data classification whether it is expressed as a
 * label or only in the form body — the label can be forgotten, the answer
 * cannot.
 */
export function validateTaskIssue({ labels = [], body = '', state = 'open' } = {}) {
  const names = labelNames(labels)

  if (state !== 'open') return { ok: false, reason: 'Issue is not open.' }

  if (names.includes(LABELS.PRIVATE)) {
    return { ok: false, reason: `Issue carries ${LABELS.PRIVATE}; automation must not operate.`, privateTask: true }
  }
  if (PRIVATE_DATA_MARKER.test(body)) {
    return {
      ok: false,
      reason: 'Issue is classified as involving private/real seller data; automation must not operate.',
      privateTask: true,
    }
  }
  if (names.includes(LABELS.BLOCKED)) {
    return { ok: false, reason: `Issue is ${LABELS.BLOCKED}; an owner decision is outstanding.` }
  }
  if (names.includes(LABELS.COMPLETED)) {
    return { ok: false, reason: 'Issue is already completed.' }
  }
  if (!names.includes(LABELS.READY)) {
    return { ok: false, reason: `Issue lacks ${LABELS.READY}; work is not authorised.` }
  }
  return { ok: true, reason: 'Issue is authorised for automated implementation.' }
}

/* ------------------------------------------------------------------ *
 * Protected-path scope guard
 * ------------------------------------------------------------------ */

/** True when a changed path belongs to the security/automation system. */
export function isProtectedPath(file) {
  const f = normalise(file)
  return PROTECTED_PATHS.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p))
}

/**
 * Whether a change set is permitted for the issue that authorised it.
 *
 * An ordinary product issue must not quietly rewrite the guards that constrain
 * it. Touching those paths requires an issue explicitly labelled as
 * security/automation work.
 */
export function checkProtectedPaths({ files = [], issueLabels = [] } = {}) {
  const violations = files.filter(isProtectedPath).map(normalise)
  if (violations.length === 0) return { ok: true, violations: [] }

  const names = labelNames(issueLabels)
  const authorised = names.some((n) => INFRASTRUCTURE_LABELS.has(n))
  if (authorised) {
    return {
      ok: true,
      violations: [],
      note: `Protected paths changed under an infrastructure-labelled issue: ${violations.join(', ')}`,
    }
  }
  return {
    ok: false,
    violations,
    reason:
      `This change touches the security/automation system (${violations.join(', ')}) but the issue is ` +
      `not labelled ${[...INFRASTRUCTURE_LABELS].join(' or ')}. Ordinary product work must not alter its own guards.`,
  }
}

/** Whether implementation may advance to the independent-review job. */
export function validateImplementationHandoff({
  claudeSucceeded = false,
  openPullRequests = 0,
  scopeOk = false,
} = {}) {
  if (!claudeSucceeded) return { ok: false, reason: 'Claude implementation failed or was inconclusive.' }
  if (openPullRequests !== 1) {
    return { ok: false, reason: `Expected one open pull request; found ${openPullRequests}.` }
  }
  if (!scopeOk) return { ok: false, reason: 'The complete pull request is outside the authorised issue scope.' }
  return { ok: true, reason: 'Implementation is eligible for independent review.' }
}

/* ------------------------------------------------------------------ *
 * Pull-request eligibility
 * ------------------------------------------------------------------ */

/**
 * Whether a PR may be merged by the approval automation.
 *
 * Deliberately strict and explicit. Each condition closes a distinct path:
 * forks and cross-repo PRs run untrusted code, Dependabot PRs are not Claude
 * work items, and the branch pattern prevents an arbitrary branch from being
 * merged by applying a label to it.
 */
export function validatePullRequest({
  labels = [],
  headRef = '',
  baseRef = '',
  headRepoFullName = '',
  baseRepoFullName = '',
  authorLogin = '',
  isFork = false,
  draft = false,
  state = 'open',
} = {}) {
  const names = labelNames(labels)
  const fail = (reason) => ({ ok: false, reason })

  if (state !== 'open') return fail('Pull request is not open.')
  if (draft) return fail('Pull request is a draft.')
  if (isFork || (headRepoFullName && baseRepoFullName && headRepoFullName !== baseRepoFullName)) {
    return fail('Pull request originates from a fork or another repository.')
  }
  if (baseRef !== 'main') return fail(`Pull request targets "${baseRef}", not main.`)
  if (/^dependabot\//.test(headRef) || /^dependabot(\[bot\])?$/i.test(authorLogin)) {
    return fail('Dependabot pull requests are out of scope for this automation.')
  }
  if (!names.includes(LABELS.MANAGED)) return fail(`Pull request lacks ${LABELS.MANAGED}.`)
  if (!names.includes(LABELS.OWNER_REVIEW)) return fail(`Pull request lacks ${LABELS.OWNER_REVIEW}.`)
  if (!CLAUDE_BRANCH_RE.test(headRef)) {
    return fail(`Head branch "${headRef}" does not match the claude/issue-<n>-<slug> scheme.`)
  }
  if (names.includes(LABELS.BLOCKED)) return fail(`Pull request carries ${LABELS.BLOCKED}.`)
  if (names.includes(LABELS.AUTOMATION_FAILED)) return fail(`Pull request carries ${LABELS.AUTOMATION_FAILED}.`)
  if (names.includes(LABELS.PRODUCTION_FAILED)) return fail(`Pull request carries ${LABELS.PRODUCTION_FAILED}.`)
  if (!names.includes(LABELS.APPROVED)) return fail(`Pull request lacks ${LABELS.APPROVED}.`)

  return { ok: true, reason: 'Pull request is eligible for approved merge.' }
}

/* ------------------------------------------------------------------ *
 * Approval binding
 * ------------------------------------------------------------------ */

/**
 * Binds an approval to the exact commit that was reviewed.
 *
 * Without this, a PR approved at one commit could have anything pushed to it
 * afterwards and still merge on the strength of a stale label. Approval is for
 * a diff, not for a branch name.
 */
export function checkApprovalSha({ approvedSha, currentSha } = {}) {
  if (!approvedSha || !currentSha) {
    return { ok: false, reason: 'Both the approved and current head SHAs are required.' }
  }
  if (approvedSha !== currentSha) {
    return {
      ok: false,
      staleApproval: true,
      reason: 'The pull request head changed after approval; fresh owner approval is required.',
      approvedSha,
      currentSha,
    }
  }
  return { ok: true, reason: 'Approved SHA matches the current head.', sha: currentSha }
}

/* ------------------------------------------------------------------ *
 * Required checks
 * ------------------------------------------------------------------ */

/**
 * Evaluates the repository's required checks against observed results.
 *
 * `pending` is returned separately from `failed` so the caller can wait rather
 * than treating "not finished" as "not passing". A required check that never
 * reported is pending, never an implicit pass.
 */
export function evaluateRequiredChecks({ requiredChecks = [], checkResults = [] } = {}) {
  const byName = new Map()
  const done = (r) => (r.status ?? 'completed') === 'completed' && r.conclusion != null
  for (const r of checkResults) {
    // A check reports more than once whenever a run is retried, and now
    // routinely: a Claude branch push and the pull-request synchronize it
    // causes both produce a run of the same name on the same SHA. Prefer a
    // finished result over a running one, and the newer of two finished ones —
    // otherwise a stale failure permanently masks the success that fixed it and
    // remediation could never clear a check it had already failed once.
    const existing = byName.get(r.name)
    if (!existing) { byName.set(r.name, r); continue }
    if (!done(existing) && done(r)) { byName.set(r.name, r); continue }
    if (done(existing) && done(r) && String(r.startedAt ?? '') > String(existing.startedAt ?? '')) {
      byName.set(r.name, r)
    }
  }

  const failed = []
  const pending = []
  const passed = []

  for (const name of requiredChecks) {
    const result = byName.get(name)
    if (!result) { pending.push({ name, reason: 'not reported' }); continue }
    const status = result.status ?? 'completed'
    const conclusion = result.conclusion ?? null
    if (status !== 'completed' || conclusion == null) { pending.push({ name, reason: status }); continue }
    if (conclusion === 'success') passed.push(name)
    else failed.push({ name, conclusion })
  }

  if (failed.length > 0) return { state: 'failed', failed, pending, passed }
  if (pending.length > 0) return { state: 'pending', failed, pending, passed }
  return { state: 'success', failed, pending, passed }
}

/**
 * Builds the non-weakening union used by review and merge gates.
 *
 * The repository baseline is always present. Rulesets may add requirements,
 * but removing a ruleset entry can never weaken the baseline.
 */
export function requiredCheckUnion({ baseline = [], rulesetChecks = [] } = {}) {
  return [...new Set([...baseline, ...rulesetChecks].filter(Boolean))]
}

/* ------------------------------------------------------------------ *
 * Branch naming and cleanup
 * ------------------------------------------------------------------ */

/** Exact description algorithm used by the pinned official action. */
export function claudeBranchDescription(title = '') {
  if (!String(title).trim()) return ''
  return String(title)
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Deterministic Claude branch name for an issue. */
export function claudeBranchName(issueNumber, title = '') {
  const slug = claudeBranchDescription(title)
  return `${CLAUDE_BRANCH_PREFIX}issue-${issueNumber}-${slug}`
}

/**
 * Plans deterministic branch/PR handling for one issue.
 *
 * `matchingBranches` must come from GitHub's matching-refs endpoint and
 * `pullRequests` from a head-filtered, paginated query. The function refuses
 * ambiguity instead of guessing which work item to resume.
 */
export function planIssueWork({ issueNumber, title = '', matchingBranches = [], pullRequests = [] } = {}) {
  const branch = claudeBranchName(issueNumber, title)
  if (!claudeBranchDescription(title)) {
    return { ok: false, state: 'invalid-title', branch, reason: 'Issue title cannot produce a safe branch slug.' }
  }
  const branches = [...new Set(matchingBranches.filter(Boolean))]
  const exactPulls = pullRequests.filter((pr) => pr?.headRef === branch)
  const openPulls = exactPulls.filter((pr) => pr.state === 'open')

  if (branches.some((name) => name !== branch)) {
    return {
      ok: false,
      state: 'ambiguous',
      branch,
      reason: `A different branch already claims issue #${issueNumber}; refusing to create or guess another.`,
    }
  }
  if (branches.length > 1 || openPulls.length > 1 || exactPulls.length > 1) {
    return { ok: false, state: 'ambiguous', branch, reason: 'More than one branch or pull request claims this issue.' }
  }
  if (openPulls.length === 1) {
    return { ok: true, state: 'resume-pr', branch, pullRequest: openPulls[0] }
  }
  const merged = exactPulls.find((pr) => pr.merged)
  if (merged) {
    return { ok: false, state: 'merged', branch, pullRequest: merged, reason: 'The issue branch already has a merged pull request.' }
  }
  const closed = exactPulls.find((pr) => pr.state === 'closed')
  if (closed) {
    return {
      ok: false,
      state: 'closed',
      branch,
      pullRequest: closed,
      reason: 'The issue branch has a closed, unmerged pull request; owner direction is required.',
    }
  }
  if (branches.includes(branch)) return { ok: true, state: 'resume-branch', branch }
  return { ok: true, state: 'start', branch }
}

/** Exact, whitespace-tolerant owner command accepted on a PR conversation. */
export function validateApprovalCommand({ body = '', isPullRequest = false } = {}) {
  if (!isPullRequest) return { ok: false, reason: 'The approval comment is not on a pull request.' }
  if (String(body).trim() !== '/approve-merge') {
    return { ok: false, reason: 'Comment is not the exact /approve-merge command.' }
  }
  return { ok: true, reason: 'Exact approval command received.' }
}

/**
 * Whether automation may delete a branch.
 *
 * Allow-list, not deny-list: anything that is not a recognised Claude task
 * branch is refused, so a new branch category can never become deletable by
 * omission.
 */
export function isBranchDeletable(branch) {
  const b = String(branch ?? '')
  if (!b) return { ok: false, reason: 'No branch supplied.' }
  if (b === 'main') return { ok: false, reason: 'main is never deletable.' }
  if (b.startsWith('dependabot/')) return { ok: false, reason: 'Dependabot branches are not managed by this automation.' }
  if (b.startsWith('validation/') || b.startsWith('docs/private')) {
    return { ok: false, reason: 'Private local-only branches must never be touched.' }
  }
  if (!CLAUDE_BRANCH_RE.test(b)) return { ok: false, reason: `"${b}" is not a Claude-managed task branch.` }
  return { ok: true, reason: `${b} is a merged Claude task branch and may be deleted.` }
}

/**
 * The issue number a Claude branch was created for.
 *
 * More reliable than parsing "closes #n" out of a pull-request body: the
 * branch name is generated by this module and validated before use, whereas
 * the body is prose that a run can forget to write.
 *
 * @returns {number|null}
 */
export function issueNumberFromBranch(branch) {
  const m = String(branch ?? '').match(/^claude\/issue-(\d+)-/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

/* ------------------------------------------------------------------ *
 * Remediation budget
 * ------------------------------------------------------------------ */

/** Whether another automatic fix attempt is permitted. */
export function canRemediate(cycles, max = MAX_REMEDIATION_CYCLES) {
  const used = Number(cycles ?? 0)
  return { ok: used < max, used, remaining: Math.max(0, max - used) }
}


/**
 * Decides the next review action without allowing a model to expand scope or
 * reinterpret a failed gate.
 */
export function decideReviewGate({
  scopeOk = false,
  internalReview = 'failed',
  checkVerdict = { state: 'pending', failed: [], pending: [] },
  cycles = 0,
} = {}) {
  if (!scopeOk) return { state: 'blocked', reason: 'The pull request is outside the authorised issue scope.' }
  if (internalReview === 'owner-decision') {
    return { state: 'blocked', reason: 'Internal review found a genuine owner decision.' }
  }
  if (internalReview !== 'pass') {
    return { state: 'failed', reason: 'Internal planner/QA/security/scope review did not pass conclusively.' }
  }
  if (checkVerdict.state === 'success') return { state: 'owner-review', reason: 'Every review and required check passed.' }
  if (checkVerdict.state === 'pending') {
    return { state: 'failed', reason: 'One or more required checks are missing or still pending.' }
  }

  const failures = checkVerdict.failed ?? []
  const ineligible = failures.filter((f) => !REMEDIABLE_CHECK_RE.test(f.name ?? ''))
  if (ineligible.length > 0) {
    return { state: 'failed', reason: 'A failed required check is not eligible for automatic remediation.', ineligible }
  }
  const budget = canRemediate(cycles)
  if (!budget.ok) {
    const observed = failures.map((failure) => `${failure.name} (${failure.conclusion ?? 'failed'})`).join(', ')
    return {
      state: 'failed',
      reason: `The two-cycle automatic remediation budget is exhausted${observed ? `; still failing: ${observed}` : ''}.`,
      failures,
    }
  }
  return { state: 'remediate', reason: 'Eligible checks failed inside the remediation budget.', cycle: budget.used + 1 }
}

/** Completion is atomic: all three post-merge gates must pass. */
export function evaluatePostMergeGate({ mainChecks = 'pending', deployment = 'pending', smoke = 'pending' } = {}) {
  const states = { mainChecks, deployment, smoke }
  const failed = Object.entries(states).filter(([, value]) => value === 'failed').map(([name]) => name)
  const pending = Object.entries(states).filter(([, value]) => value !== 'success' && value !== 'failed').map(([name]) => name)
  if (failed.length) return { state: 'failed', failed, pending }
  if (pending.length) return { state: 'pending', failed, pending }
  return { state: 'success', failed, pending }
}

/** Exact production identity check; an empty or shortened SHA never matches. */
export function exactDeploymentMatches(expected, observed) {
  return /^[0-9a-f]{40}$/.test(String(expected ?? '')) && expected === observed
}

/** Pure minimum page gate used by the read-only production smoke. */
export function evaluatePageSmoke({ status = 0, body = '', requiredText = [] } = {}) {
  const missing = requiredText.filter((text) => !String(body).includes(text))
  return { ok: status === 200 && missing.length === 0, status, missing }
}

/** Pure canonical-host redirect gate; substring matches are not sufficient. */
export function evaluateApexRedirect({ status = 0, location = '', apexHost = '' } = {}) {
  let destination = null
  try {
    destination = new URL(location)
  } catch {
    return { ok: false, reason: 'Redirect Location is not an absolute URL.' }
  }
  const ok = [301, 307, 308].includes(status) &&
    destination.protocol === 'https:' && destination.hostname === apexHost
  return { ok, status, destination: destination.href }
}
