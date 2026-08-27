# Skumetra — Latest Handoff

**Updated:** 2026-08-27
**Locked promise:** Skumetra helps Amazon sellers detect supplier stock and
cost changes before they cause unprofitable or unavailable sales.

## Branch and pull request

- Active work: PR #12, branch `automation/claude-development-system`.
- Base: `main` at `4e6138f` when the PR #12 completion work began.
- PR #12 must remain unmerged until its exact head, complete diff, independent
  review, fresh GitHub checks, and Vercel preview are all accepted by the owner.
- Use `git rev-parse HEAD`, `git status`, and the live PR state rather than
  copying a potentially stale feature-branch SHA from this document.
- Never modify or merge Dependabot PRs as part of this work.
- A local-only `docs/private` branch may exist in an owner checkout. Never push,
  merge, rename, or delete it.

## Current release and milestone

Release 1 (Public Validation Site) is live and functionally complete. The
current repository task is the event-driven Claude development architecture in
PR #12. It changes engineering coordination, not product scope or production
behavior.

## PR #12 architecture

The repository-side implementation provides:

- one authorised issue → one deterministic
  `claude/issue-<number>-<slug>` branch → one active PR;
- consumption of `ready-for-claude`, deterministic resume, and ambiguity
  refusal;
- complete-file scope inspection and protected-path enforcement;
- a separate planner/QA/security/scope review followed by exact-SHA CI,
  Dependency Review, CodeQL, and Vercel gating;
- at most two eligible automatic remediation cycles on the existing PR;
- `owner-review` only after every gate succeeds;
- owner merge authority through an exact `/approve-merge` comment interpreted
  by a default-branch `issue_comment` workflow;
- an internal `approved-to-merge` marker bound to the approved head SHA;
- merge by normal merge commit with GitHub's expected-SHA guard;
- completion only after exact deployment, read-only production smoke, and the
  non-weakening required-check union pass on the exact `main` merge SHA.

The production smoke performs GET-only checks for `/api/version`, `/`,
`/pilot`, `/privacy`, `/terms`, and the `www` redirect. It never submits the
pilot form or creates an applicant record.

## Owner experience after activation

1. Create or approve a public/synthetic issue.
2. Add `ready-for-claude`.
3. Wait for `owner-review`.
4. Review the complete PR and preview.
5. Comment `/approve-merge` on the PR.
6. Automation merges and marks the issue complete only after post-merge gates.

GitHub is the handoff layer. No routine copying of Claude reports or long
authorisation commands is required.

## One-time setup deliberately not performed

After PR #12 is reviewed and merged, the owner may configure exactly one of the
official static credentials:

- `ANTHROPIC_API_KEY`, or
- `CLAUDE_CODE_OAUTH_TOKEN`.

The value must be entered directly in GitHub Actions secrets, never pasted into
chat, an issue, or a PR. Repository label synchronisation is also deferred until
the owner separately authorises that setup. No credential, label, merge,
deployment, runtime, private-data, or live-data operation was performed while
building PR #12.

## Resume from here

1. Read `PROJECT_INDEX.md`, this file, `CURRENT_STATUS.md`, and
   `CLAUDE_AUTOMATION.md`.
2. Confirm the exact PR #12 head and complete diff.
3. Re-run all repository verification rather than trusting historical counts.
4. Inspect fresh CI, Dependency Review, CodeQL, and Vercel results for that
   exact SHA.
5. If clean, hand PR #12 to the owner for review without merging it or doing
   one-time setup.

## Safety reminders

- Do not broaden the locked product promise.
- Do not invent deterministic financial formulas or make product/legal/data
  decisions.
- Do not use real seller data in public automation.
- Do not weaken required checks, tests, scanners, scope guards, or permissions.
- Do not use `pull_request_target`.
- Do not merge PR #12 during its implementation/review handoff.
