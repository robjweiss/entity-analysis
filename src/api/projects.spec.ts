import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProjectEntityDetail,
  getProjectExposure,
  getProjectRiskChanges,
  listProjectEntities,
  listProjects,
} from './projects'

describe('project API client', () => {
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

  it.each([
    {
      description: 'projects without pagination',
      call: () => listProjects(),
      url: '/api/projects',
    },
    {
      description: 'projects with a next cursor',
      call: () => listProjects({ next: 'next /?' }),
      url: '/api/projects?next=next+%2F%3F',
    },
    {
      description: 'projects with a previous cursor',
      call: () => listProjects({ prev: 'previous' }),
      url: '/api/projects?prev=previous',
    },
  ])('requests $description', async ({ call, url }) => {
    const fetch = stubFetch()

    await call()

    expect(fetch).toHaveBeenCalledWith(url, { signal: undefined })
  })

  it('forwards the optional abort signal from request options', async () => {
    const fetch = stubFetch()
    const controller = new AbortController()

    await listProjects({}, { signal: controller.signal })

    expect(fetch).toHaveBeenCalledWith('/api/projects', { signal: controller.signal })
  })

  it('encodes project ids and includes entity filters and a next cursor', async () => {
    const fetch = stubFetch()

    await listProjectEntities('project/a ?', {
      name: 'Acme & Sons',
      country: 'JPN',
      riskCategory: 'forced labor',
      next: 'cursor/+',
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/projects/project%2Fa%20%3F/entities?name=Acme+%26+Sons&country=JPN&riskCategory=forced+labor&next=cursor%2F%2B',
      { signal: undefined },
    )
  })

  it('includes a previous cursor for project entities', async () => {
    const fetch = stubFetch()

    await listProjectEntities('project', { prev: 'prior' })

    expect(fetch).toHaveBeenCalledWith('/api/projects/project/entities?prev=prior', {
      signal: undefined,
    })
  })

  it('omits empty entity filters and pagination from the URL', async () => {
    const fetch = stubFetch()

    await listProjectEntities('project', { name: '', country: undefined, next: '' })

    expect(fetch).toHaveBeenCalledWith('/api/projects/project/entities', { signal: undefined })
  })

  it('encodes both project and entity ids for entity details', async () => {
    const fetch = stubFetch()

    await getProjectEntityDetail('project/one', 'entity two')

    expect(fetch).toHaveBeenCalledWith('/api/projects/project%2Fone/entities/entity%20two', {
      signal: undefined,
    })
  })

  it('requests project exposure at its BFF endpoint', async () => {
    const fetch = stubFetch()

    await getProjectExposure('project one')

    expect(fetch).toHaveBeenCalledWith('/api/projects/project%20one/exposure', {
      signal: undefined,
    })
  })

  it.each([
    { description: 'no pagination', pagination: {}, query: '' },
    {
      description: 'a next cursor and as-of timestamp',
      pagination: { next: 'cursor/1', asOf: '2026-10-25T12:00:00.000Z' },
      query: '?next=cursor%2F1&asOf=2026-10-25T12%3A00%3A00.000Z',
    },
  ])('requests risk changes with $description', async ({ pagination, query }) => {
    const fetch = stubFetch()

    await getProjectRiskChanges('project', pagination)

    expect(fetch).toHaveBeenCalledWith(`/api/projects/project/risk-changes${query}`, {
      signal: undefined,
    })
  })
})
