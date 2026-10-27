import { afterEach, describe, expect, it, vi } from 'vitest'
import { listRiskCategories } from './riskCategories'

afterEach(() => vi.unstubAllGlobals())

describe('listRiskCategories', () => {
  it('requests and returns the risk category options', async () => {
    const fetchMock = vi
      .fn<
        (input: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<object> }>
      >()
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ categories: [{ id: 'sanctions', label: 'Sanctions' }] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listRiskCategories()).resolves.toEqual({
      categories: [{ id: 'sanctions', label: 'Sanctions' }],
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/risk-categories', expect.anything())
  })
})
