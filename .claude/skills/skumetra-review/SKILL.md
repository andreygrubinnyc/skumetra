---
name: skumetra-review
description: Prepare a Skumetra pull request for the owner's single review decision — verification evidence, risk, and what to look at. Use before asking the owner to approve a PR, or when they ask "is this ready".
---

# Prepare a pull request for owner review

The owner reviews once. That review has to be worth making, which means the
mechanical questions must already be answered and the judgement questions must
be clearly stated.

## 1. Verify, do not assert

Run the real checks and report the real output:

```bash
npm run verify:push
```

A check that could not run — missing tool, no network, registry failure — is
**unverified**, not passed. Say so. Never describe a skipped check as green.

Then confirm CI agrees:

```bash
gh pr checks <number>
```

## 2. Check the scope

```bash
gh pr diff <number> --name-only
```

An ordinary product change must not touch `.github/workflows/`,
`.githooks/`, `scripts/security/`, `scripts/automation/`, `CLAUDE.md`,
`SECURITY.md`, or `docs/project/TESTING_AND_SECURITY.md`. If it does, the
issue must be labelled `security` or `automation-system`, and if it is not,
this is a finding — not something to explain away.

Confirm the diff matches the issue's acceptance criteria: nothing missing, and
nothing extra that was never asked for.

## 3. Review the substance

Focus on what tests do not catch:

- Does it actually satisfy the acceptance criteria, or only appear to?
- Financial values: still deterministic, never AI-computed?
- Any invented legal text, customers, testimonials, integrations,
  certifications, partnerships or traction? All are forbidden.
- Any real seller, supplier, prospect or applicant data? Any credential,
  token or private filesystem path?
- Any business-sensitive content that belongs on `docs/private` instead?
- Does the change alter the locked promise, pilot pricing, legal terms or
  product scope?

Use the `security-reviewer` and `scope-reviewer` subagents for the last three
when the diff is large enough that reading it once is not enough.

## 4. Write the review summary

Post a comment on the pull request containing:

- What changed, in two or three sentences
- Each acceptance criterion, and how it was verified
- Every check run and its actual result
- Any check that could not run
- Risks and anything deliberately left out
- The exact head SHA

State the SHA explicitly, because approval binds to it: applying
`approved-to-merge` authorises merging *that commit*. Anything pushed
afterwards voids the approval and the merge will be refused.

## 5. Hand it back

Say plainly whether you believe it is ready, and name the one thing most worth
the owner's attention. Then stop. **Do not apply `approved-to-merge`** — that
is the owner's second and final decision.
