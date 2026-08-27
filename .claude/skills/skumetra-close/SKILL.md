---
name: skumetra-close
description: Close out a Skumetra work item after a merge — verify production, update the durable documentation, and leave the project resumable. Use after a PR merges, or when the owner asks to wrap up a session.
---

# Close out a work item

A merge is not the end of the item. The item is done when production is
verified and the next session can pick up without this conversation.

## 1. Verify production

```bash
node scripts/automation/production-smoke.mjs --expect-commit <merge sha>
```

This waits for the merged commit to actually be serving before it checks
anything, so a pass means the new deployment was verified rather than the old
one being re-tested.

If it fails: **do not roll back and do not work around it silently.** Report
the failure with its output, label the issue
`production-verification-failed`, and raise it with the owner as a decision.

## 2. Update the durable documentation

These two files are how the project survives losing this transcript:

- `docs/project/CURRENT_STATUS.md` — where the project now is
- `docs/project/LATEST_HANDOFF.md` — what just happened and what is next

Follow `docs/project/DOCUMENTATION_MAINTENANCE.md` for the full checklist. Add
to `docs/project/DECISION_LOG.md` if a decision was made that a future session
would otherwise have to re-derive.

Business-sensitive material — pricing hypotheses, validation targets, kill
criteria, internal risks, sensitive decision context, credential-handling
detail — does not go in any of these. It goes on the local-only `docs/private`
branch.

## 3. Close the issue

The merge automation normally does this. Verify rather than assume:

```bash
gh issue view <number> --json state,labels
```

It should be closed and labelled `completed`, with `ready-for-claude`,
`claude-in-progress` and `owner-review` removed. If automation did not get
there, do it manually and note why it did not.

## 4. Clean up

Only branches matching `claude/issue-<n>-<slug>` are ever deletable, and only
after the merge is confirmed. Never delete `main`, a `dependabot/*` branch, or
anything under `validation/*` or `docs/private`.

```bash
git fetch --prune
git branch -d <branch>
```

## 5. Report

State: what merged, the commit SHA, that production verified (or did not),
what documentation was updated, and what the next work item is.
