import { describe, expect, it, vi } from 'vitest'
import {
  listAllCheckRuns,
  listAllMatchingRefs,
  listAllPullFiles,
  listAllPullsForHead,
  listAllStatuses,
} from './github-api.mjs'

function paged(items, shape = (data) => data) {
  return vi.fn(async ({ page }) => ({ data: shape(items.slice((page - 1) * 100, page * 100)) }))
}

describe('pagination-safe GitHub reads', () => {
  it('reads every PR file instead of silently stopping at 100 or 300', async () => {
    const files = Array.from({ length: 305 }, (_, i) => ({ filename: `file-${i}` }))
    const listFiles = paged(files)
    const result = await listAllPullFiles({ rest: { pulls: { listFiles } } }, {
      owner: 'a', repo: 'b', pullNumber: 1,
    })
    expect(result).toHaveLength(305)
    expect(listFiles).toHaveBeenCalledTimes(4)
  })

  it('uses a deterministic head filter and still paginates PR history', async () => {
    const pulls = Array.from({ length: 101 }, (_, i) => ({ number: i + 1 }))
    const list = paged(pulls)
    const result = await listAllPullsForHead({ rest: { pulls: { list } } }, {
      owner: 'andrey', repo: 'skumetra', branch: 'claude/issue-42-task',
    })
    expect(result).toHaveLength(101)
    expect(list.mock.calls[0][0].head).toBe('andrey:claude/issue-42-task')
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('paginates matching refs, check runs, and commit statuses', async () => {
    const refs = Array.from({ length: 101 }, (_, i) => ({ ref: `refs/heads/claude/issue-42-${i}` }))
    const runs = Array.from({ length: 205 }, (_, i) => ({ name: `check-${i}` }))
    const statuses = Array.from({ length: 102 }, (_, i) => ({ context: `status-${i}` }))
    const listMatchingRefs = paged(refs)
    const listForRef = paged(runs, (check_runs) => ({ check_runs }))
    const listCommitStatusesForRef = paged(statuses)
    const github = {
      rest: {
        git: { listMatchingRefs },
        checks: { listForRef },
        repos: { listCommitStatusesForRef },
      },
    }
    expect(await listAllMatchingRefs(github, { owner: 'a', repo: 'b', prefix: 'claude/issue-42-' })).toHaveLength(101)
    expect(await listAllCheckRuns(github, { owner: 'a', repo: 'b', ref: 'a'.repeat(40) })).toHaveLength(205)
    expect(await listAllStatuses(github, { owner: 'a', repo: 'b', ref: 'a'.repeat(40) })).toHaveLength(102)
  })
})
