# Claude development automation

**Owner:** Andrey Grubin · **Status:** Repository architecture implemented;
owner credential/label setup not performed · **Last verified:** 2026-08-27

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

## Authentication and permissions

The pinned official action accepts either `ANTHROPIC_API_KEY` or
`CLAUDE_CODE_OAUTH_TOKEN`. The workflow supplies both optional secret inputs and
requires at least one, never both. Static API/OAuth authentication does not use
OIDC, so no job receives `id-token: write`. GitHub token permissions are empty
at workflow level and widened per job only for the reads/writes that job needs.

Do not paste or configure a credential through an issue, PR, chat, or automated
implementation task. Owner credential setup remains pending.

## Local verification

```bash
npx vitest run scripts/automation/automation-core.test.mjs scripts/automation/github-api.test.mjs
npm run security:workflows
node scripts/automation/production-smoke.mjs
node scripts/automation/production-smoke.mjs --expect-commit <full-sha>
```
