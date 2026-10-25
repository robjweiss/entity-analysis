import type { SayariClient } from '@sayari/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProjectEntities, getProjectEntityDetail, getProjects } from './projects.ts'

const entityResponse = {
  limit: 25,
  data: [{
    project_entity_id: 'entity-1', label: 'Example supplier',
    attributes: { name: { match_resolution: true, values: [{ value: 'Example supplier' }] } },
    countries: ['JPN'], risk_categories: [{ id: 'sanctions', label: 'Sanctions' }],
    risk_factors: [{ id: 'sanctioned' }], upstream: { products: ['8536'] },
  }],
  next: 'next-entity', prev: 'prev-entity', size: { count: 1, qualifier: 'eq' },
}

function mockEntityResponse(body: object = entityResponse, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function createClient() {
  const getProjects = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: [{ id: 'project-1', label: 'Supplier review' }], next: 'next-project',
  })
  const getProjectEntityRiskSummary = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: { riskFactors: [{
      id: 'sanctioned', label: 'Sanctioned', level: 'critical',
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      sourceEntityIds: ['source-1'], networkPaths: [[]],
    }] },
  })
  const getProjectEntityRiskChanges = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: { riskFactors: [{ id: 'sanctioned', timestamp: '2026-10-20', changeType: 'added' }] },
    next: 'next-change',
  })
  const client = {
    project: { getProjects },
    projectEntity: { getProjectEntityRiskSummary, getProjectEntityRiskChanges },
  } as unknown as SayariClient

  return { client, getProjects, getProjectEntityRiskSummary, getProjectEntityRiskChanges }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('priority queue Sayari gateway', () => {
  it('loads unarchived projects with an upstream cursor', async () => {
    const { client, getProjects: getProjectsMock } = createClient()
    await getProjects(client, { next: 'cursor' })

    expect(getProjectsMock).toHaveBeenCalledWith({ archived: false, limit: 100, next: 'cursor', prev: undefined })
  })

  it('returns project labels and the next cursor', async () => {
    const { client } = createClient()

    expect(await getProjects(client)).toEqual({
      projects: [{ id: 'project-1', label: 'Supplier review' }], next: 'next-project', prev: undefined,
    })
  })

  it('sends filters and pagination directly to the Sayari entity endpoint', async () => {
    const fetchMock = mockEntityResponse()
    await getProjectEntities('project-1', {
      name: 'supplier', country: 'JPN', riskCategory: 'sanctions', next: 'cursor',
    }, 'test-token')

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(Object.fromEntries(url.searchParams)).toEqual({
      limit: '25', 'filter[label][fuzzy]': 'supplier', 'filter[country]': 'JPN',
      'filter[risk_category]': 'sanctions', next: 'cursor',
    })
  })

  it('maps the live entity shape without parsing unused attributes', async () => {
    mockEntityResponse()
    const response = await getProjectEntities('project-1', {}, 'test-token')

    expect(response.entities).toEqual([{
      id: 'entity-1', label: 'Example supplier', countries: ['JPN'],
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      riskFactors: ['sanctioned'], upstreamProducts: ['8536'],
    }])
  })

  it('uses the API next cursor rather than the SDK next_token field', async () => {
    mockEntityResponse()

    expect((await getProjectEntities('project-1', {}, 'test-token')).next).toBe('next-entity')
  })

  it('uses the API previous cursor', async () => {
    mockEntityResponse()

    expect((await getProjectEntities('project-1', {}, 'test-token')).prev).toBe('prev-entity')
  })

  it('omits the unused upstream total from the BFF response', async () => {
    mockEntityResponse()

    expect(await getProjectEntities('project-1', {}, 'test-token')).not.toHaveProperty('size')
  })

  it('passes the SDK bearer token to the API', async () => {
    const fetchMock = mockEntityResponse()
    await getProjectEntities('project-1', {}, 'test-token')

    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer test-token')
  })

  it('rejects malformed API entity responses', async () => {
    mockEntityResponse({ data: 'not a list' })

    await expect(getProjectEntities('project-1', {}, 'test-token')).rejects.toThrow('Unexpected Sayari entity response.')
  })

  it('preserves the upstream HTTP status for BFF error handling', async () => {
    mockEntityResponse({}, 429)

    await expect(getProjectEntities('project-1', {}, 'test-token')).rejects.toMatchObject({ statusCode: 429 })
  })

  it('loads summary and risk changes for a selected entity', async () => {
    const { client, getProjectEntityRiskSummary } = createClient()
    await getProjectEntityDetail(client, 'project-1', 'entity-1')

    expect(getProjectEntityRiskSummary).toHaveBeenCalledWith('project-1', 'entity-1', { filter: {} })
  })

  it('maps factor severity and source paths into details', async () => {
    const { client } = createClient()
    const response = await getProjectEntityDetail(client, 'project-1', 'entity-1')

    expect(response.riskFactors).toEqual([{
      id: 'sanctioned', label: 'Sanctioned', level: 'critical',
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      sourceEntityIds: ['source-1'], networkPaths: [[]],
    }])
  })

  it('returns a cursor when risk changes have more pages', async () => {
    const { client } = createClient()
    const response = await getProjectEntityDetail(client, 'project-1', 'entity-1')

    expect(response.nextRiskChange).toBe('next-change')
  })
})
