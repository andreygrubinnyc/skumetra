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
  if (!CLAUDE_BRANCH_RE.test(headRef)) {
    return fail(`Head branch "${headRef}" does not match the claude/issue-<n>-<slug> scheme.`)
  }
  if (names.includes(LABELS.BLOCKED)) return fail(`Pull request carries ${LABELS.BLOCKED}.`)
  if (names.includes(LABELS.AUTOMATION_FAILED)) return fail(`Pull request carries ${LABELS.AUTOMATION_FAILED}.`)
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
  for (const r of checkResults) {
    // Keep the most decisive result when a check reports more than once.
    const existing = byName.get(r.name)
    if (!existing || existing.conclusion == null) byName.set(r.name, r)
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

/* ------------------------------------------------------------------ *
 * Branch naming and cleanup
 * ------------------------------------------------------------------ */

/** Deterministic Claude branch name for an issue. */
export function claudeBranchName(issueNumber, title = '') {
  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 5)
    .join('-') || 'task'
  return `claude/issue-${issueNumber}-${slug}`
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
