import { describe, it, expect, afterEach } from 'vitest'
import { GET } from './route'

const ORIGINAL = process.env.VERCEL_GIT_COMMIT_SHA

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA
  else process.env.VERCEL_GIT_COMMIT_SHA = ORIGINAL
})

async function body() {
  return await GET().json()
}

describe('GET /api/version', () => {
  it('reports the deployed commit', async () => {
    const sha = 'a'.repeat(40)
    process.env.VERCEL_GIT_COMMIT_SHA = sha
    expect(await body()).toEqual({ commit: sha })
  })

  it('reports null rather than an empty string when the variable is absent', async () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA
    expect(await body()).toEqual({ commit: null })
  })

  it('refuses to echo a value that is not a commit SHA', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = '<script>alert(1)</script>'
    expect(await body()).toEqual({ commit: null })
  })

  it('exposes nothing beyond the commit', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'b'.repeat(40)
    expect(Object.keys(await body())).toEqual(['commit'])
  })

  it('is never cached', () => {
    expect(GET().headers.get('cache-control')).toContain('no-store')
  })
})
