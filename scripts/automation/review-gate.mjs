/** Complete, exact-SHA pull-request gate shared by the three review passes. */
import {
  PR_REQUIRED_CHECKS,
  checkProtectedPaths,
  decideReviewGate,
} from './automation-core.mjs'
import {
  listAllPullFiles,
  nonWeakeningRequiredChecks,
  waitForRequiredChecks,
} from './github-api.mjs'

export async function runPullRequestGate({
  github,
  log = () => {},
  warn = () => {},
  owner,
  repo,
  pullNumber,
  issueNumber,
  expectedBranch,
  internalReview,
  cycles,
  timeoutMs = 30 * 60 * 1000,
}) {
  const [{ data: pr }, { data: issue }] = await Promise.all([
    github.rest.pulls.get({ owner, repo, pull_number: pullNumber }),
    github.rest.issues.get({ owner, repo, issue_number: issueNumber }),
  ])
  if (pr.state !== 'open' || pr.head.ref !== expectedBranch || pr.base.ref !== 'main') {
    return { state: 'failed', reason: 'The pull request identity changed during review.' }
  }

  const files = await listAllPullFiles(github, { owner, repo, pullNumber })
  const scope = checkProtectedPaths({
    files: files.map((file) => file.filename),
    issueLabels: issue.labels,
  })
  if (!scope.ok || internalReview !== 'pass') {
    return {
      ...decideReviewGate({ scopeOk: scope.ok, internalReview, cycles }),
      headSha: pr.head.sha,
      scope,
    }
  }

  const requiredChecks = await nonWeakeningRequiredChecks(github, {
    owner,
    repo,
    branch: 'main',
    baseline: PR_REQUIRED_CHECKS,
    warn,
  })
  log(`Required checks for ${pr.head.sha}: ${requiredChecks.join(', ')}`)
  const checkVerdict = await waitForRequiredChecks({
    github,
    owner,
    repo,
    ref: pr.head.sha,
    requiredChecks,
    timeoutMs,
    onPending: (verdict) => log(`Waiting on: ${verdict.pending.map((item) => item.name).join(', ')}`),
  })

  const { data: fresh } = await github.rest.pulls.get({ owner, repo, pull_number: pullNumber })
  if (fresh.head.sha !== pr.head.sha) {
    return {
      state: 'failed',
      reason: 'The pull request head changed while its checks were being evaluated.',
      headSha: fresh.head.sha,
      scope,
      checkVerdict,
    }
  }
  return {
    ...decideReviewGate({ scopeOk: true, internalReview, checkVerdict, cycles }),
    headSha: pr.head.sha,
    scope,
    checkVerdict,
    requiredChecks,
  }
}
