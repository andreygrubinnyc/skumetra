/**
 * Shared scanning engine used by every Skumetra security scanner.
 *
 * Pure functions where possible so the behaviour is directly testable without
 * touching the filesystem or the network. No scanner here makes a network
 * request — local gates must work offline.
 */
import { readFileSync, readdirSync, openSync, fstatSync, closeSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { isAllowed } from './allowlist.mjs'
import {
  SECRET_PATTERNS,
  FORBIDDEN_PATH_PATTERNS,
  PERSONAL_DATA_PATTERNS,
  ALLOWED_EMAIL_DOMAINS,
  IGNORED_DIRS,
  IGNORED_EXTENSIONS,
  looksLikePlaceholder,
  redact,
} from './patterns.mjs'

export const EXIT_OK = 0
export const EXIT_FINDINGS = 1
export const EXIT_ERROR = 2

/**
 * Converts any path to POSIX form.
 *
 * Replaces backslashes unconditionally rather than splitting on the host's
 * `sep` — otherwise a Windows-style path handed to a scanner running on
 * macOS/Linux would pass through unnormalised and silently miss path rules.
 */
export function toPosix(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '')
}

/**
 * Scans text for credential patterns.
 * @returns {{patternId:string,label:string,line:number,redacted:string}[]}
 */
export function scanTextForSecrets(text, filePath = '') {
  const findings = []
  const lines = String(text).split(/\r?\n/)

  for (const { id, label, regex } of SECRET_PATTERNS) {
    if (isAllowed(filePath, id)) continue
    lines.forEach((line, i) => {
      // Fresh regex per line: /g regexes are stateful via lastIndex.
      const re = new RegExp(regex.source, regex.flags)
      let m
      while ((m = re.exec(line)) !== null) {
        const value = m[0]
        if (looksLikePlaceholder(value)) continue
        findings.push({ patternId: id, label, line: i + 1, redacted: redact(value) })
        if (m.index === re.lastIndex) re.lastIndex++ // guard zero-length matches
      }
    })
  }
  return findings
}

/**
 * Flags paths that must never enter the public repository.
 * @returns {{patternId:string,label:string}[]}
 */
export function scanPathForForbidden(filePath) {
  const file = toPosix(filePath)
  return FORBIDDEN_PATH_PATTERNS.filter(({ regex }) => regex.test(file)).map(({ id, label }) => ({
    patternId: id,
    label,
  }))
}

/**
 * Scans for personal data. Applied only where such data would signal a leak.
 * Emails on allowed domains (the public project domain, synthetic sample
 * domains) are not findings — the public repo legitimately contains them.
 */
export function scanTextForPersonalData(text, filePath = '') {
  const findings = []
  const lines = String(text).split(/\r?\n/)

  for (const { id, label, regex } of PERSONAL_DATA_PATTERNS) {
    if (isAllowed(filePath, id)) continue
    lines.forEach((line, i) => {
      const re = new RegExp(regex.source, regex.flags)
      let m
      while ((m = re.exec(line)) !== null) {
        const value = m[0]
        // UI placeholders ("you@yourstore.com") and doc examples are not
        // personal data — nobody is identified by them.
        if (looksLikePlaceholder(value)) {
          if (m.index === re.lastIndex) re.lastIndex++
          continue
        }
        if (id === 'email') {
          const domain = value.split('@')[1]?.toLowerCase() ?? ''
          if (ALLOWED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
            if (m.index === re.lastIndex) re.lastIndex++
            continue
          }
        }
        findings.push({ patternId: id, label, line: i + 1, redacted: redact(value) })
        if (m.index === re.lastIndex) re.lastIndex++
      }
    })
  }
  return findings
}

/** True when a path should not be read (generated, vendored, or binary). */
export function shouldSkip(relPath) {
  const p = toPosix(relPath)
  if (p.split('/').some((seg) => IGNORED_DIRS.has(seg))) return true
  return IGNORED_EXTENSIONS.has(extname(p).toLowerCase())
}

/** Recursively lists scannable files under `root`. */
export function listFiles(root, base = root) {
  const out = []
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(root, entry.name)
    const rel = toPosix(relative(base, full))
    if (shouldSkip(rel)) continue
    if (entry.isDirectory()) out.push(...listFiles(full, base))
    else if (entry.isFile()) out.push(rel)
  }
  return out
}

/**
 * Reads a file as UTF-8, returning null for unreadable or oversized files.
 *
 * Opens the file once and both sizes and reads that *same file descriptor*.
 * Calling `statSync(path)` and then `readFileSync(path)` re-resolves the path,
 * leaving a window in which the file could be swapped between the check and
 * the read — so the size limit could be bypassed and different bytes scanned
 * than were measured.
 */
export function readTextFile(absPath, maxBytes = 2_000_000) {
  let fd
  try {
    fd = openSync(absPath, 'r')
    if (fstatSync(fd).size > maxBytes) return null
    return readFileSync(fd, 'utf8')
  } catch {
    return null
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd)
      } catch {
        // Nothing useful to do if the descriptor is already gone.
      }
    }
  }
}

/** Formats findings for humans. Values are already redacted upstream. */
export function formatFindings(title, findings) {
  if (findings.length === 0) return ''
  const lines = [`\n${title}`]
  for (const f of findings) {
    const where = f.line ? `${f.file}:${f.line}` : f.file
    const detail = f.redacted ? ` — ${f.redacted}` : ''
    lines.push(`  ✖ [${f.patternId}] ${f.label}  ${where}${detail}`)
  }
  return lines.join('\n')
}
