---
name: skumetra-resume
description: Rebuild full Skumetra project context at the start of a session, or after a break, without relying on chat history. Use when the owner says "where were we", "catch up", or starts a session cold.
---

# Resume work on Skumetra

The project is designed to survive losing every transcript. Everything needed
is in the repository and in GitHub state. Reconstruct from those, not from
memory, and never from an assumption about what a previous session did.

## 1. Read the durable record

```bash
cat PROJECT_INDEX.md
cat docs/project/CURRENT_STATUS.md
cat docs/project/LATEST_HANDOFF.md
cat docs/project/DECISION_LOG.md
```

`CURRENT_STATUS.md` and `LATEST_HANDOFF.md` are the two that matter most. If
they contradict the code, the code is right and the documents are stale — say
so rather than working from the stale version.

## 2. Read the live state

```bash
git status --short
git log --oneline -15
git branch -a
gh pr list --state open
gh issue list --state open --limit 30
gh run list --limit 10
```

Note anything carrying `blocked-owner-decision`, `automation-failed` or
`production-verification-failed` — those are waiting on a human and are the
first thing to raise.

## 3. Confirm production is healthy

```bash
node scripts/automation/production-smoke.mjs
```

If this fails, that is the headline. Report it before anything else.

## 4. Never touch these

Branches under `validation/*` and `docs/private` exist only on the owner's
machine. Do not push them, merge them, reference them in a public issue or
pull request, or copy their contents anywhere public. If context seems to be
missing and one of these branches would have it, say that the context is
local-only rather than reaching for it.

## 5. Report

Give the owner, in this order and in a few lines each:

1. Where the project is against the current release
2. What is waiting on their decision, if anything
3. Whether production is healthy
4. The single most useful next step

Then stop. Do not start work; wait for the decision.
