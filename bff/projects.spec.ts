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

const riskSummaryResponse = {
  data: {
    project_entity_id: 'entity-1',
    project_id: 'project-1',
    risk_factors: [{
      id: 'sanctioned', label: 'Sanctioned', value: true, level: 'critical',
      risk_categories: [{ id: 'sanctions', label: 'Sanctions' }],
      source_entity_ids: ['source-1'],
      network_paths: [[{
        sayari_entity_id: 'network-1', sayari_entity_label: 'Network entity',
        relationship_type: 'owned_by', shares: { percentage: 0.5 },
      }]],
      metadata: [], risk_intelligence: [],
    }],
  },
  filters: {},
}

function mockDetailResponses(
  changes: object = { filters: {}, limit: 100, data: {} },
  summaryStatus = 200,
  changesStatus = 200,
) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const isSummary = String(input).includes('/risk_summary')
    return new Response(JSON.stringify(isSummary ? riskSummaryResponse : changes), {
      status: isSummary ? summaryStatus : changesStatus,
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function createClient() {
  const getProjects = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: [{ id: 'project-1', label: 'Supplier review' }], next: 'next-project',
  })
  const client = { project: { getProjects } } as unknown as SayariClient

  return { client, getProjects }
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

  it('uses raw Sayari endpoints for incompatible detail response schemas', async () => {
    const fetchMock = mockDetailResponses()
    await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(fetchMock.mock.calls.map(([input, init]) => ({
      url: String(input),
      authorization: new Headers(init?.headers).get('Authorization'),
    }))).toEqual([
      {
        url: 'https://api.sayari.com/v1/projects/project-1/entities/entity-1/risk_summary',
        authorization: 'Bearer test-token',
      },
      {
        url: 'https://api.sayari.com/v1/projects/project-1/entities/entity-1/changes/risk?limit=100',
        authorization: 'Bearer test-token',
      },
    ])
  })

  it('maps factor severity and source paths into details', async () => {
    mockDetailResponses()
    const response = await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(response.riskFactors).toEqual([{
      id: 'sanctioned', label: 'Sanctioned', level: 'critical',
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      sourceEntityIds: ['source-1'], networkPaths: [[{
        sayariEntityId: 'network-1', sayariEntityLabel: 'Network entity',
        relationshipType: 'owned_by', relationshipStatus: undefined, former: undefined,
        firstObserved: undefined, lastObserved: undefined, startDate: undefined,
        shares: { percentage: 0.5, numShares: undefined, monetaryValue: undefined },
      }]],
    }])
  })

  it('treats an empty risk-change data object as no recorded changes', async () => {
    mockDetailResponses()
    const response = await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(response.riskChanges).toEqual([])
  })

  it('maps non-empty risk changes and their cursor', async () => {
    mockDetailResponses({
      filters: {}, limit: 100,
      data: {
        project_id: 'project-1', project_entity_id: 'entity-1',
        risk_factors: [{ id: 'sanctioned', timestamp: '2026-10-20', change_type: 'added' }],
      },
      next: 'next-change',
    })
    const response = await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(response).toEqual(expect.objectContaining({
      riskChanges: [{ id: 'sanctioned', timestamp: '2026-10-20', changeType: 'added' }],
      nextRiskChange: 'next-change',
    }))
  })

  it('preserves the upstream HTTP status for BFF error handling', async () => {
    mockDetailResponses(undefined, 429)
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(getProjectEntityDetail('project-1', 'entity-1', 'test-token'))
      .rejects.toMatchObject({ statusCode: 429 })

    expect(log).toHaveBeenCalledWith('Sayari project entity risk_summary request failed', {
      errorType: 'SayariError', statusCode: 429,
    })
  })
})
