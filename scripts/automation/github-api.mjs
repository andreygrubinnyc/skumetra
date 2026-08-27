/**
 * Pagination-safe GitHub reads used by the automation workflows.
 *
 * These helpers deliberately own no policy. They make complete reads; the
 * pure decisions stay in automation-core.mjs.
 */
import { evaluateRequiredChecks, requiredCheckUnion } from './automation-core.mjs'

const PER_PAGE = 100

async function collectPages(fetchPage, pickItems) {
  const all = []
  for (let page = 1; ; page++) {
    const response = await fetchPage(page)
    const items = pickItems(response.data)
    all.push(...items)
    if (items.length < PER_PAGE) return all
  }
}

export function listAllPullFiles(github, { owner, repo, pullNumber }) {
  return collectPages(
    (page) => github.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: PER_PAGE, page }),
    (data) => data,
  )
}

export function listAllPullsForHead(github, { owner, repo, branch }) {
  return collectPages(
    (page) => github.rest.pulls.list({
      owner, repo, head: `${owner}:${branch}`, state: 'all', per_page: PER_PAGE, page,
    }),
    (data) => data,
  )
}

export function listAllMatchingRefs(github, { owner, repo, prefix }) {
  return collectPages(
    (page) => github.rest.git.listMatchingRefs({ owner, repo, ref: `heads/${prefix}`, per_page: PER_PAGE, page }),
    (data) => data,
  )
}

export function listAllCheckRuns(github, { owner, repo, ref }) {
  return collectPages(
    (page) => github.rest.checks.listForRef({ owner, repo, ref, per_page: PER_PAGE, page }),
    (data) => data.check_runs,
  )
}

export function listAllStatuses(github, { owner, repo, ref }) {
  return collectPages(
    (page) => github.rest.repos.listCommitStatusesForRef({ owner, repo, ref, per_page: PER_PAGE, page }),
    (data) => data,
  )
}

export async function listRulesetRequiredChecks(github, { owner, repo, branch }) {
  const rules = await collectPages(
    (page) => github.request('GET /repos/{owner}/{repo}/rules/branches/{branch}', {
      owner, repo, branch, per_page: PER_PAGE, page,
    }),
    (data) => data,
  )
  return rules
    .filter((rule) => rule.type === 'required_status_checks')
    .flatMap((rule) => rule.parameters?.required_status_checks ?? [])
    .map((check) => check.context)
    .filter(Boolean)
}

export async function nonWeakeningRequiredChecks(github, { owner, repo, branch, baseline, warn = () => {} }) {
  let rulesetChecks = []
  try {
    rulesetChecks = await listRulesetRequiredChecks(github, { owner, repo, branch })
  } catch (error) {
    warn(`Could not read branch rules; retaining the full baseline. ${error.message}`)
  }
  return requiredCheckUnion({ baseline, rulesetChecks })
}

export async function checkResultsForRef(github, { owner, repo, ref }) {
  const [runs, statuses] = await Promise.all([
    listAllCheckRuns(github, { owner, repo, ref }),
    listAllStatuses(github, { owner, repo, ref }),
  ])
  // startedAt is carried through so evaluateRequiredChecks can tell a retry
  // from the run it replaced. Two runs of the same check on one SHA are normal
  // now: a Claude branch push and the pull-request synchronize it causes both
  // produce one.
  return [
    ...runs.map((run) => ({
      name: run.name, status: run.status, conclusion: run.conclusion, startedAt: run.started_at,
    })),
    ...statuses.map((status) => ({
      name: status.context,
      status: 'completed',
      conclusion: status.state === 'success' ? 'success' : status.state,
      startedAt: status.updated_at,
    })),
  ]
}

export async function waitForRequiredChecks({
  github, owner, repo, ref, requiredChecks, timeoutMs = 30 * 60 * 1000,
  pollMs = 30_000, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onPending = () => {},
}) {
  const deadline = Date.now() + timeoutMs
  let verdict = { state: 'pending', failed: [], pending: requiredChecks.map((name) => ({ name, reason: 'not reported' })), passed: [] }
  while (Date.now() < deadline) {
    const checkResults = await checkResultsForRef(github, { owner, repo, ref })
    verdict = evaluateRequiredChecks({ requiredChecks, checkResults })
    if (verdict.state !== 'pending') return verdict
    onPending(verdict)
    await sleep(pollMs)
  }
  return verdict
}
