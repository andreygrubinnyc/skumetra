# Security Policy

Skumetra is an early-stage project. This policy describes how to report a
vulnerability and what to expect in return. It deliberately makes no
compliance or certification claims — none have been obtained.

## Reporting a vulnerability

**Preferred: [open a private security advisory](https://github.com/andreygrubinnyc/skumetra/security/advisories/new).**
GitHub's private vulnerability reporting is enabled on this repository, so the
report stays confidential between you and the maintainer while it is being
addressed.

If you cannot use that, email the project address published on
[skumetra.com](https://skumetra.com): `hello@skumetra.com`.

Please **do not** open a public issue for a security problem, and please do not
include real customer, seller, or supplier data in a report.

Helpful reports usually include what you found, the steps to reproduce it, the
affected URL or file, and what an attacker could achieve with it.

## What to expect

This is a solo-maintained project, so response is best-effort rather than
contractual. The intent is to acknowledge a report within a few business days,
confirm or dismiss it with reasoning, and credit reporters who want credit.

No bug-bounty programme exists and no payment is offered.

## Scope

**In scope:** this repository, and the production site at `https://skumetra.com`
including the pilot application endpoint.

**Out of scope:** findings that require a compromised device or account,
social-engineering of the maintainer, volumetric denial-of-service, automated
scanner output with no demonstrated impact, and issues in third-party platforms
(GitHub, Vercel, Supabase) — please report those to the platform directly.

## Data handling

The public application collects Founding Seller Pilot applications: name,
email, business name, and structured qualification answers. It does not
request Amazon passwords, API credentials, or Amazon customer information, and
it does not process payments.

Please do not send credentials of any kind when reporting. If you believe a
credential has been exposed, say so without including the value itself.

## Supported versions

Only the currently deployed `main` branch is supported. There are no
maintained release branches.
