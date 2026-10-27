import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEntityInvestigation, getEntityRecords, getEntityRelationships } from './entities'

describe('entity API client', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubFetch() {
    const fetch = vi
      .fn<(input: string, init?: RequestInit) => Promise<unknown>>()
      .mockResolvedValue({
        ok: true,
        json: vi.fn<() => Promise<unknown>>().mockResolvedValue({}),
      })
    vi.stubGlobal('fetch', fetch)
    return fetch
  }

  it('encodes the entity id for an investigation request', async () => {
    const fetch = stubFetch()

    await getEntityInvestigation('entity/id ?')

    expect(fetch).toHaveBeenCalledWith('/api/entities/entity%2Fid%20%3F', { signal: undefined })
  })

  it('forwards the optional abort signal from request options', async () => {
    const fetch = stubFetch()
    const controller = new AbortController()

    await getEntityInvestigation('entity', { signal: controller.signal })

    expect(fetch).toHaveBeenCalledWith('/api/entities/entity', { signal: controller.signal })
  })

  it('uses the investigation-specific fallback error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: string) => Promise<unknown>>().mockResolvedValue({
        ok: false,
        json: vi.fn<() => Promise<unknown>>().mockRejectedValue(new SyntaxError('Invalid JSON')),
      }),
    )

    await expect(getEntityInvestigation('entity')).rejects.toThrow(
      'Unable to load entity investigation. Please try again.',
    )
  })

  it.each([
    {
      description: 'relationships',
      call: () => getEntityRelationships('entity/id', 'next /?'),
      url: '/api/entities/entity%2Fid/relationships?next=next+%2F%3F',
    },
    {
      description: 'records',
      call: () => getEntityRecords('entity/id', 'next /?'),
      url: '/api/entities/entity%2Fid/records?next=next+%2F%3F',
    },
  ])('requests paginated $description', async ({ call, url }) => {
    const fetch = stubFetch()

    await call()

    expect(fetch).toHaveBeenCalledWith(url, { signal: undefined })
  })
})
