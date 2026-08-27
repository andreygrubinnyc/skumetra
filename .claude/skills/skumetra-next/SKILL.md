---
name: skumetra-next
description: Decide and open the next Skumetra work item as a properly-formed GitHub issue. Use when the owner asks "what's next", wants to start new work, or wants an issue written for something they've described.
---

# Start the next work item

The owner should make two decisions per work item and no more: label an issue
`ready-for-claude`, and review the resulting pull request. This skill produces
the issue so that the first decision is a genuine one — not a request for more
information.

## 1. Ground yourself in the current state

Read, in this order:

- `docs/project/CURRENT_STATUS.md` — where the project actually is
- `docs/project/LATEST_HANDOFF.md` — what the last session left behind
- `docs/project/RELEASE_PLAN.md` — what the current release is meant to contain
- `docs/project/PRODUCT_BASELINE.md` — the locked promise and the permanent exclusions

Then check what is already in flight:

```bash
gh issue list --state open --limit 30
gh pr list --state open --limit 20
```

Do not propose work that duplicates an open issue or an open pull request.

## 2. Choose

Prefer, in order:

1. Anything blocking the current release in `RELEASE_PLAN.md`
2. Anything labelled `blocked-owner-decision` that a decision would unblock
3. The smallest change that moves the current release forward

Reject outright, without asking:

- Anything that broadens the locked product promise
- Amazon SP-API automation, automatic Amazon changes, or AI-computed
  financial values — these are permanently excluded, not deferred
- Anything requiring real seller, supplier, prospect or applicant data

If the best next step needs an owner decision rather than an implementation,
open the issue with `blocked-owner-decision` and state the decision plainly.
Do not guess and build.

## 3. Write the issue

Use the `claude-task` form's fields: outcome, why now, acceptance criteria,
data classification, area, constraints, open questions.

Acceptance criteria are the contract. Write them as statements that can be
verified by a test, not as aspirations. "Import shows matched columns before
confirmation" is checkable; "import is clearer" is not.

Size the work so a single pull request can carry it. If it cannot, propose a
sequence of issues and say which one is first.

```bash
gh issue create --title "[task] ..." --body-file <file>
```

## 4. Hand it back

Report the issue number and URL, and state in one line what applying
`ready-for-claude` will cause to happen. **Do not apply the label yourself** —
that label is the owner's authorisation, and applying it on their behalf
defeats the point of having it.
