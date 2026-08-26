# Claude development automation

How a work item goes from an idea to verified production, and where Andrey's
two decisions sit.

## The flow

```
Andrey writes an issue  (or asks Claude to write one)
        │
        ▼
Andrey adds  ready-for-claude              ← DECISION 1
        │
        ▼
guard job: is the labeller authorised? is the issue public and unblocked?
        │  (fails closed — the label is removed and the issue is commented on)
        ▼
Claude plans, implements, writes tests, runs the local gates, opens a PR
        │
        ▼
scope guard: did the change stay inside what the issue authorised?
        │
        ▼
CI runs: lint · typecheck · unit · build · security scans · audit · e2e ·
         dependency review · CodeQL
        │
        ▼
PR is labelled  claude-managed  +  owner-review
        │
        ▼
Andrey reviews once and adds  approved-to-merge          ← DECISION 2
        │
        ▼
merge job: authorised actor? eligible PR? head still at the approved SHA?
           all required checks green?
        │
        ▼
merge commit — GitHub refuses it if the head moved since approval
        │
        ▼
Vercel deploys to production
        │
        ▼
smoke test waits for that exact commit to be live, then verifies the site
        │
        ├─ pass → issue commented, labelled completed, closed; branch deleted
        └─ fail → issue labelled production-verification-failed and raised.
                  No automatic rollback. This is Andrey's decision.
```

Two labels. Everything else is automation reporting its own state.

## Where the decisions actually live

`scripts/automation/automation-core.mjs` holds every security-relevant decision
as a pure function with no I/O. The workflows call those functions; they do not
re-implement the logic in YAML, and they do not delegate it to the model.

This is deliberate. A guard expressed as an instruction in a prompt is a guard
that can be talked out of by a sufficiently persuasive issue body. A guard
expressed as `if (!names.includes('approved-to-merge')) return fail(...)`
cannot be. Every one of these functions is unit tested in
`automation-core.test.mjs`, including the cases where it must refuse.

| Function | Refuses when |
| --- | --- |
| `authorizeActor` | the actor lacks write/maintain/admin, or the permission could not be read |
| `validateTaskIssue` | no `ready-for-claude`, or the task involves private data, or a decision is outstanding |
| `checkProtectedPaths` | an ordinary issue changes the security or automation system |
| `validatePullRequest` | fork, cross-repo, Dependabot, wrong base, wrong branch shape, missing label, draft |
| `checkApprovalSha` | the head moved after approval |
| `evaluateRequiredChecks` | a required check failed, or has not reported |
| `isBranchDeletable` | the branch is anything other than a `claude/issue-<n>-<slug>` branch |
| `canRemediate` | the automatic fix budget is exhausted |

## The labels

| Label | Meaning | Applied by |
| --- | --- | --- |
| `ready-for-claude` | Implement this issue | **Andrey** |
| `approved-to-merge` | Merge the reviewed commit | **Andrey** |
| `claude-in-progress` | Implementation under way | automation |
| `claude-managed` | PR produced by automation | automation |
| `owner-review` | Waiting on decision two | automation |
| `blocked-owner-decision` | Stopped; needs a decision | either |
| `automation-failed` | Automation could not finish | automation |
| `production-verification-failed` | Merged, but production did not verify | automation |
| `completed` | Merged and verified live | automation |
| `private-no-automation` | Involves real data; never automate | Andrey |

Apply them to the repository with:

```bash
node scripts/automation/sync-labels.mjs --dry-run
node scripts/automation/sync-labels.mjs
```

It creates and corrects; it never deletes.

## Design decisions worth knowing

**Approval binds to a commit, not to a branch.** The SHA present when
`approved-to-merge` is applied is passed to GitHub's merge API as its `sha`
parameter. If anything is pushed to the branch afterwards, GitHub itself
refuses the merge. A stale label cannot ship unreviewed code, and this does not
depend on the workflow behaving correctly.

**A check that never reported is pending, not passing.** `evaluateRequiredChecks`
distinguishes failed from pending precisely so that "we never heard from CodeQL"
cannot be read as "CodeQL was fine". If a required check does not report within
thirty minutes the merge is refused rather than assumed.

**The required-check list is a union.** The workflow reads main's ruleset and
unions it with a hardcoded baseline. Adding a check to the ruleset tightens the
automation automatically. Removing one from the ruleset cannot loosen it below
the baseline.

**Branch deletion is an allow-list.** Only `claude/issue-<n>-<slug>` is ever
deletable. `main`, `dependabot/*`, `validation/*` and `docs/private` are refused
by name, and so is anything else that does not match the pattern — a new branch
category can never become deletable by omission.

**Production verification waits for the right commit.** `/api/version` reports
the deployed commit SHA, and the smoke test blocks until it matches the merge
commit before checking anything else. Without that, every check could pass
against the deployment the merge was supposed to replace.

**Nothing is ever POSTed to the pilot form.** The application endpoint is the
one place on the site where a request creates a durable record about a real
person. The smoke test proves the route is deployed by confirming it rejects a
method it does not implement, which exercises routing without creating an
applicant record.

**Failure is never papered over.** A failed production verification labels the
issue, comments, and fails the run. There is no automatic rollback and no
retry-until-green. The merge is already on `main`; what to do about it is a
human decision.

## Known residual risk

The merge workflow triggers on `pull_request`, which means GitHub runs the
workflow definition from the head branch. A pull request could therefore ship a
modified version of the file that merges it.

`pull_request_target` would put the workflow definition on the base branch, but
it runs with repository secrets against untrusted code, and it is prohibited
for this repository. The compensating controls are:

1. Fork pull requests are rejected by `validatePullRequest`, and GitHub gives
   them a read-only token regardless, so a fork cannot merge itself.
2. Only an account with push access can create a same-repo head branch — an
   account that could merge directly anyway.
3. `main`'s ruleset is enforced by GitHub server-side. No workflow, however
   modified, can merge past a required check that has not passed.

The residual exposure is therefore an account with push access escalating to a
merge it would not otherwise perform. That is governed by the ruleset and by
who holds push access, not by this workflow. It is recorded here rather than
left implicit.

## One-time owner setup

The automation needs an Anthropic credential, which is not currently configured
on the repository. `gh api repos/andreygrubinnyc/skumetra/actions/secrets`
returns no secrets.

Until it is added, the guard job will run and the implementation job will fail
at the Claude step. Nothing unsafe happens in the meantime — the system fails
closed.

To add it (Andrey, not Claude — never paste a credential into an issue, a pull
request, or a chat):

1. Create an API key at <https://console.anthropic.com/settings/keys>.
2. Add it as a repository secret named `ANTHROPIC_API_KEY` under
   **Settings → Secrets and variables → Actions**.
3. Run `node scripts/automation/sync-labels.mjs` to create the ten labels.

`GITHUB_TOKEN` is provided by Actions automatically; nothing is needed for it.

## Running the pieces by hand

```bash
# Verify production right now
node scripts/automation/production-smoke.mjs

# Verify a specific commit actually reached production
node scripts/automation/production-smoke.mjs --expect-commit <sha>

# Exercise every guard
npx vitest run scripts/automation/automation-core.test.mjs
```

## Skills

| Skill | Use it for |
| --- | --- |
| `skumetra-resume` | Rebuilding context at the start of a session |
| `skumetra-next` | Deciding and writing the next work item |
| `skumetra-review` | Preparing a pull request for the single owner review |
| `skumetra-close` | Verifying production and updating the durable docs |

## Subagents

| Subagent | Use it for |
| --- | --- |
| `planner` | Turning an issue into a concrete, checkable plan |
| `implementer` | Carrying out an agreed plan with its tests |
| `qa-reviewer` | Whether it works and whether the tests would catch a regression |
| `security-reviewer` | Injection, exposure, secrets, personal data, boundaries |
| `scope-reviewer` | Whether the change stayed inside what the issue authorised |
