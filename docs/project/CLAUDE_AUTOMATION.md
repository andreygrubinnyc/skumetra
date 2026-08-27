# Claude development automation

**Owner:** Andrey Grubin · **Status:** Repository architecture implemented;
owner App/credential/label setup not performed; workflows not yet exercised
end to end · **Last verified:** 2026-08-27

## Owner flow

1. Create a public, tightly scoped GitHub issue.
2. Add `ready-for-claude` to authorise that issue.
3. Wait until its single PR has `owner-review`.
4. Review the complete diff and Vercel preview.
5. Comment exactly `/approve-merge` on that PR.
6. Automation merges the exact reviewed SHA, verifies the exact merge commit on
   `main`, waits for that commit in production, runs read-only smoke checks,
   then closes the issue and deletes only its Claude branch.

No routine report relaying, task-output copying, or long approval command is
part of the flow. GitHub is the handoff surface.

## State machine

```text
issue + ready-for-claude                    owner decision 1
  → consume ready-for-claude
  → claude-in-progress
  → claude/issue-<number>-<five-word-slug>
  → one same-repository PR to main
  → complete scope check
  → independent planner/QA/security/scope review
  → CI + audit + e2e + Dependency Review + CodeQL + Vercel
  → at most two eligible automatic remediation cycles
  → owner-review                             only when everything passes
  → exact /approve-merge PR comment          owner decision 2
  → internal approved-to-merge bound to current head SHA
  → re-check exact SHA + required-check union
  → normal merge commit with expected SHA
  → exact production deployment
  → read-only /, /pilot, /privacy, /terms and www redirect smoke
  → exact main-commit required-check union
  → completed + close issue + allow-listed branch deletion
```

The pull request is opened by the workflow, not by the model. The official
action pushes a branch and posts a "Create a PR" link; it has no
pull-request-creating tool (verified in `src/entrypoints/update-comment-link.ts`
and the file-ops MCP server at the pinned SHA). The `establish` step therefore
opens exactly one pull request deterministically — preferring the branch name
the action reports over the predicted one, since the action falls back to its
timestamped default when the templated name is already taken — and refuses when
the branch has no commits ahead of `main`. Leaving this to the model would also
leave the title, the base and the issue link to it.

Any missing, pending, partial, failed, or inconclusive implementation/review
result goes to `automation-failed`, never `owner-review`. A genuine product or
scope decision goes to `blocked-owner-decision`. A failed post-merge gate uses
`production-verification-failed`, leaves the issue and branch open, and performs
no rollback or automatic retry.

## Deterministic issue identity and resume

The pinned official `anthropics/claude-code-action` supports both:

```yaml
branch_prefix: claude/
branch_name_template: '{{prefix}}{{entityType}}-{{entityNumber}}-{{description}}'
```

The action defines `description` as the first five whitespace-delimited title
words, lower-cased and sanitized to kebab-case. `claudeBranchName()` implements
that same algorithm and a regression test compares the workflow inputs with the
pure-code constants. The guard queries GitHub's matching-ref endpoint and a
head-filtered, paginated PR list. It starts only when neither exists, resumes an
existing branch/PR, and refuses closed, merged, wrong-branch, or ambiguous
states instead of guessing.

The start label is consumed before Claude runs. Per-issue concurrency is serial
and a queued duplicate event sees the consumed label and exits quietly.

## Review and remediation

The implementation session plans and implements only the issue. A separate
Claude session then independently reviews the plan, full diff, tests, security,
and scope. It fixes clear in-scope findings on the same branch. A structured
result is required; missing/invalid output is failure, not success.

External failures eligible for automatic correction are lint, typecheck, unit,
build, e2e/accessibility, security, Dependency Review, CodeQL, and Vercel.
Each correction uses the existing PR and issue branch. It must not weaken or
skip tests, scanners, required checks, permissions, scope guards, or product
constraints. Two cycles are the hard maximum. Unknown failures, a genuine owner
decision, or exhaustion stop without another model attempt.

Every PR-file read is fully paginated. Check runs and commit statuses are also
fully paginated and evaluated against the exact current head SHA.

## Owner approval and merge

The protected merge workflow uses default-branch `issue_comment: created`, not
`pull_request_target` and not a PR-supplied workflow definition. Only a comment
whose trimmed body is exactly `/approve-merge` is considered. The commenter
must have `write`, `maintain`, or `admin` permission.

Before recording approval, automation fetches the current PR and requires:

- open, non-draft, same-repository PR to `main`;
- `claude/issue-<number>-<slug>` head, never Dependabot;
- `claude-managed` and `owner-review`;
- no blocked or failure label.

Automation then adds the internal `approved-to-merge` state and binds it to the
current head SHA. `validatePullRequest()` requires all three positive labels:
`claude-managed`, `owner-review`, and `approved-to-merge`. Required checks are
the union of the repository baseline and main's ruleset, so a ruleset can add a
requirement but cannot weaken the baseline. Immediately before merge, the PR is
fetched again. A changed head removes approval and owner-review, posts
`OWNER RE-APPROVAL REQUIRED`, and does not merge. GitHub's merge API also
receives the exact expected SHA as a final server-side binding.

## Post-merge gates

Completion is atomic across three distinct gates:

1. `/api/version` reports the exact merge commit in production.
2. Read-only smoke verifies `/`, `/pilot`, `/privacy`, `/terms`, and the
   `www`→apex redirect while scanning public HTML for secret indicators.
3. The non-weakening CI/security/e2e/Dependency Review/CodeQL union passes on
   the exact merge commit on `main`.

The smoke script never submits the pilot form and contains no POST request.
Only all three successes permit `completed`, issue closure, or branch deletion.

## Labels

| Label | Meaning | Applied by |
| --- | --- | --- |
| `ready-for-claude` | Authorise implementation of this issue | owner |
| `claude-in-progress` | One active issue run | automation |
| `claude-managed` | PR belongs to this system | automation |
| `owner-review` | All internal/external gates passed; owner may review | automation |
| `approved-to-merge` | Internal record of an accepted comment and bound SHA | automation |
| `blocked-owner-decision` | A genuine decision or ambiguous state stopped work | automation/owner |
| `automation-failed` | Pre-merge automation failed or was inconclusive | automation |
| `production-verification-failed` | Merge landed but a post-merge gate failed | automation |
| `completed` | Exact merge commit verified through production | automation |
| `private-no-automation` | Real/private data; public automation is prohibited | owner |

`node scripts/automation/sync-labels.mjs` creates/corrects these labels but
never deletes any other label. Owner-side label and credential setup is a
separate protected step and has not been performed as part of PR #12.

## The trust boundary

The model works on the pull-request branch. The code that decides whether that
branch passes never comes from it.

Every authorisation, scope, readiness, remediation-budget, required-check,
approval and terminal-state decision imports its implementation from a checkout
of `main`, in one of exactly two shapes:

- **The whole workspace is `main`.** `guard` and `finalize` check out
  `ref: main` — explicitly, never the implicit default — and import from
  `GITHUB_WORKSPACE`. No model step runs in those jobs.
- **A separate trusted clone.** `implement`, `review-and-remediate` and
  `verify-production` have a workspace the model may have written to, so they
  also check out `ref: main` into `path: .trusted-policy` and import from
  `TRUSTED_POLICY`. `review-gate.mjs` resolves `automation-core.mjs` and
  `github-api.mjs` relatively, so its whole dependency chain comes from the same
  trusted clone.

The clone is re-taken immediately before **every** decision step, not once per
job. Claude holds Write on the workspace between two gate steps, so a copy
taken at the top of the job could be edited by the change it is about to judge;
`actions/checkout` replaces the directory each time.

`.trusted-policy/` is git-ignored and eslint-ignored so a run working in the
same workspace cannot commit or lint it.

Five structural tests in `automation-core.test.mjs` enforce this. Each has been
verified to fail when the property is broken: removing `finalize`'s checkout,
pointing a gate at `GITHUB_WORKSPACE`, letting a model step run after the last
trusted clone, restoring `github_token` on a Claude step, and granting
`id-token: write` to a job that does not call the action.

## Authentication and permissions

Anthropic authentication and GitHub identity are two separate things.

**Anthropic:** either `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`. Both
optional inputs are supplied, and a preflight step fails the job when neither is
present.

**GitHub identity: the official Claude GitHub App.** No `github_token` input is
passed to the action. Verified against `src/github/token.ts` at the pinned SHA
`1f291e1cfe0f5fc21db2aef19af844591600ade7`: `setupGitHubToken()` returns a
supplied token immediately if there is one, and otherwise calls
`core.getIDToken()` and exchanges the result at
`api.anthropic.com/api/github/github-app-token-exchange` for a Claude GitHub App
installation token. `id-token: write` is therefore genuinely required, and is
granted only on the two jobs that call the action — `implement` and
`review-and-remediate`. It confers no repository write on its own. Every other
job, and the workflow default, stays at least privilege.

This is not a preference about credentials. GitHub does not start a workflow run
for an event created with the repository's own `GITHUB_TOKEN`. Under the
previous configuration the action pushed as `GITHUB_TOKEN`, so no CI, CodeQL or
dependency review ever ran on a Claude branch, no required check ever reported,
and the gate would have waited for something that could not arrive. The App is a
distinct identity, so its pushes do start workflows.

Two consequences worth knowing:

- **CI is triggered by the App's push, not by the pull request.** The pull
  request is opened deterministically by the workflow using `GITHUB_TOKEN`, and
  that event *is* suppressed. `ci.yml`, `codeql.yml` and `dependency-review.yml`
  therefore also run on `push` to `claude/issue-*`. Check runs attach to the
  pushed SHA, which is exactly what the pull request's required checks are
  evaluated against. Once a pull request exists, a later push produces both a
  `push` run and a `synchronize` run for the same SHA;
  `evaluateRequiredChecks` keeps the newest completed result per check name.
- **The App token exchange requires these workflows to be on the default
  branch.** The pinned action treats `workflow_not_found_on_default_branch` as a
  skip. Until PR #12 merges, the action will skip rather than run — which is
  also why none of this can be exercised end to end beforehand.

A personal access token would also work and is deliberately not the recommended
path: it binds automation to one person's account and carries that person's full
access.

Never paste or request a credential in an issue, a pull request, or a chat.

## One-time owner setup, after PR #12 merges

Three steps, all owner-only. None has been performed, and nothing in this pull
request performs them.

1. **Install the official Claude GitHub App on `andreygrubinnyc/skumetra`** —
   <https://github.com/apps/claude>. This is what gives the action a GitHub
   identity whose pushes start CI.
2. **Configure exactly one Anthropic credential** as a repository secret under
   *Settings → Secrets and variables → Actions*: either `ANTHROPIC_API_KEY`
   (<https://console.anthropic.com/settings/keys>) or
   `CLAUDE_CODE_OAUTH_TOKEN` for a Claude subscription.
3. **Sync the labels**: `node scripts/automation/sync-labels.mjs`
   (`--dry-run` first to see what it would create).

`GITHUB_TOKEN` is provided by Actions automatically; nothing is needed for it.

Until steps 1 and 2 are done the system fails closed: the guard runs, the
implementation job stops at the credential preflight, and nothing unsafe
happens.

## What has and has not been exercised

The decision logic is unit tested, including every refusal path and the
structural properties above. The workflows themselves have **not** run end to
end: they are not on `main` yet, no Anthropic credential is configured, the
Claude GitHub App is not installed, and the labels do not exist. PR #12's own
green checks are evidence about this repository's ordinary CI, not about these
automation paths.

## Local verification

```bash
npx vitest run scripts/automation/automation-core.test.mjs scripts/automation/github-api.test.mjs
npm run security:workflows
node scripts/automation/production-smoke.mjs
node scripts/automation/production-smoke.mjs --expect-commit <full-sha>
```
