/**
 * Detection patterns for the Skumetra security scanners.
 *
 * Design rules for anything added here:
 *   - Prefer high-confidence, structural patterns (fixed prefixes, known
 *     shapes) over loose keyword matching. A scanner that cries wolf gets
 *     bypassed, and a bypassed scanner protects nothing.
 *   - No nested unbounded quantifiers — those risk catastrophic backtracking
 *     on minified or generated files. Bound every repetition.
 *   - Every finding is reported with the value redacted (see redact()).
 */

/** Truncates a match so a real credential never reaches logs or CI output. */
export function redact(value) {
  const s = String(value)
  if (s.length <= 8) return '*'.repeat(s.length)
  return `${s.slice(0, 4)}${'*'.repeat(Math.min(s.length - 8, 24))}${s.slice(-4)}`
}

/**
 * Credential patterns. `id` is stable so the allowlist can reference it.
 */
export const SECRET_PATTERNS = [
  {
    id: 'private-key',
    label: 'Private key block',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    id: 'aws-access-key',
    label: 'AWS access key id',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: 'github-token',
    label: 'GitHub token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,255}\b/g,
  },
  {
    id: 'supabase-secret',
    label: 'Supabase secret key',
    regex: /\bsb_secret_[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    id: 'supabase-publishable',
    label: 'Supabase publishable key',
    regex: /\bsb_publishable_[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    id: 'jwt',
    label: 'JWT-shaped credential',
    // Header segment of a JWT: {"alg": ... base64url-encodes to eyJhbGciOi...
    regex: /\beyJhbGciOi[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  },
  {
    id: 'openai-key',
    label: 'OpenAI API key',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: 'stripe-secret',
    label: 'Stripe secret key',
    regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: 'vercel-token',
    label: 'Vercel token',
    regex: /\bvercel_[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: 'slack-token',
    label: 'Slack token',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: 'connection-string',
    label: 'Connection string with embedded credentials',
    // postgres://user:password@host — only flags when a password is present.
    regex: /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:/@]{1,64}:[^\s:/@]{1,128}@[^\s/]{1,255}/g,
  },
  {
    id: 'password-assignment',
    label: 'Password assigned a literal value',
    // Only a quoted literal of real length; ignores empty and short values.
    regex: /\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"'\s]{8,}["']/gi,
  },
]

/**
 * Values that look like credentials but are documentation placeholders.
 * Matched case-insensitively against the *matched text*.
 */
export const PLACEHOLDER_HINTS = [
  'your',
  'example',
  'placeholder',
  'changeme',
  'change_me',
  'xxx',
  'todo',
  'redacted',
  'dummy',
  'fake',
  'sample',
  '<',
  'paste',
  'here',
  'test-only',
  'notarealkey',
]

/** True when a matched value is obviously a placeholder rather than a credential. */
export function looksLikePlaceholder(match) {
  const lower = String(match).toLowerCase()
  return PLACEHOLDER_HINTS.some((hint) => lower.includes(hint))
}

/**
 * Paths that must never be committed to the public repository.
 * Checked against the repo-relative POSIX path.
 */
export const FORBIDDEN_PATH_PATTERNS = [
  { id: 'private-docs', label: 'Private documentation', regex: /(^|\/)docs\/private\// },
  { id: 'git-bundle', label: 'Git bundle / backup', regex: /\.(bundle|pack)$/ },
  { id: 'env-real', label: 'Populated environment file', regex: /(^|\/)\.env(\.|$)(?!example)/ },
  { id: 'prospect-tracker', label: 'Prospect / applicant tracker', regex: /(prospect|applicant|interview)[-_]?(tracker|notes|records?)\b/i },
  { id: 'seller-files', label: 'Seller or supplier data file', regex: /(^|\/)(seller|supplier|participant)[-_]?(files?|data)\//i },
  { id: 'pilot-data', label: 'Pilot operational data', regex: /(^|\/)pilot-data\.json$/ },
  { id: 'uploads', label: 'Uploads directory', regex: /(^|\/)uploads\// },
  { id: 'employer', label: 'Employer-system material', regex: /\b(pjm|prudential)\b/i },
]

/**
 * Personal-data patterns. These are only applied in contexts where such data
 * would indicate a leak (see scan-public-boundary), never repo-wide — the
 * public repo legitimately contains the owner's name and fictional samples.
 */
export const PERSONAL_DATA_PATTERNS = [
  { id: 'email', label: 'Email address', regex: /\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}\b/g },
  { id: 'phone', label: 'Phone number', regex: /\b(?:\+1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g },
  { id: 'profile-url', label: 'Social profile URL', regex: /\b(?:linkedin\.com\/in|facebook\.com|twitter\.com|x\.com|instagram\.com)\/[A-Za-z0-9._-]{2,64}\b/g },
]

/** Emails that are intentionally public or clearly synthetic. */
export const ALLOWED_EMAIL_DOMAINS = ['skumetra.com', 'example.com', 'example.org', 'northline.com', 'noreply.github.com']

/** Directories never worth scanning — generated, vendored, or binary. */
export const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  'out',
  'build',
  'coverage',
  'test-results',
  'playwright-report',
  'blob-report',
  '.vercel',
  '.turbo',
])

/** Extensions that are binary or generated; scanning them is noise. */
export const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.icns',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.zip', '.gz', '.tar', '.mp4', '.mov', '.webm',
  '.tsbuildinfo', '.lockb',
])
