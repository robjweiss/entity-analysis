import type { SayariClient } from '@sayari/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProjectEntities, getProjectEntityDetail, getProjects } from './projects.ts'

const entityResponse = {
  limit: 25,
  data: [{
    project_entity_id: 'entity-1', label: 'Example supplier',
    attributes: { name: { match_resolution: true, values: [{ value: 'Example supplier' }] } },
    countries: ['JPN'], risk_categories: [{ id: 'sanctions', label: 'Sanctions' }],
    risk_factors: [{ id: 'sanctioned' }],
  }],
  next: 'next-entity', prev: 'prev-entity', size: { count: 1, qualifier: 'eq' },
}

const riskFactorOntologyResponse = {
  data: [
    { id: 'sanctioned', label: 'Sanctioned', level: 'critical' },
    { id: 'adverse_media', label: 'Adverse media', level: 'high' },
    { id: 'country_risk', label: 'Country risk', level: 'relevant' },
  ],
}

function mockEntityResponse(
  body: object = entityResponse,
  status = 200,
  ontology: object = riskFactorOntologyResponse,
) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => new Response(
    JSON.stringify(String(input).includes('/ontology/risk_factors') ? ontology : body),
    { status },
  ))
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
  summary: object = riskSummaryResponse,
) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const isSummary = String(input).includes('/risk_summary')
    return new Response(JSON.stringify(isSummary ? summary : changes), {
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

describe('risk breakdown Sayari gateway', () => {
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
      riskFactors: [{ id: 'sanctioned', label: 'Sanctioned' }], riskSeverity: 'critical',
    }])
  })

  it('maps risk factor identifiers to labels from the existing ontology response', async () => {
    mockEntityResponse({
      ...entityResponse,
      data: [{ ...entityResponse.data[0], risk_factors: [{ id: 'adverse_media' }] }],
    })

    const response = await getProjectEntities('project-1', {}, 'test-token')

    expect(response.entities[0]?.riskFactors).toEqual([
      { id: 'adverse_media', label: 'Adverse media' },
    ])
  })

  it('uses the identifier fallback for missing risk labels and ignores unused ontology fields', async () => {
    mockEntityResponse(
      {
        ...entityResponse,
        data: [{ ...entityResponse.data[0], risk_factors: [{ id: 'adverse_media' }] }],
      },
      200,
      { data: [{ id: 'adverse_media', level: 'high', unused: { arbitrary: true } }] },
    )

    const response = await getProjectEntities('project-1', {}, 'test-token')

    expect(response.entities[0]?.riskFactors).toEqual([
      { id: 'adverse_media', label: 'adverse media' },
    ])
  })

  it('accepts an empty risk-factor ontology', async () => {
    mockEntityResponse(entityResponse, 200, { data: [] })

    const response = await getProjectEntities('project-1', {}, 'test-token')

    expect(response.entities[0]?.riskSeverity).toBeUndefined()
  })

  it.each([
    { data: [{ id: 'factor', level: 'unknown' }] },
    { data: [{ id: 1, level: 'high' }] },
    { data: [null] },
    { data: {} },
  ])('rejects malformed risk-factor ontology records: %j', async (ontology) => {
    mockEntityResponse(entityResponse, 200, ontology)

    await expect(getProjectEntities('project-1', {}, 'test-token')).rejects.toThrow(
      'Unexpected Sayari risk-factor ontology response.',
    )
  })

  it('keeps the Sayari access token in the server-side ontology request', async () => {
    const fetchMock = mockEntityResponse()
    await getProjectEntities('project-1', {}, 'server-only-token')

    const ontologyRequest = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/ontology/risk_factors'),
    )
    expect(new Headers(ontologyRequest?.[1]?.headers).get('Authorization')).toBe(
      'Bearer server-only-token',
    )
  })

  it('keeps each resolved Sayari match available for entity investigation', async () => {
    mockEntityResponse({
      ...entityResponse,
      data: [{
        ...entityResponse.data[0],
        matches: [
          { sayari_entity_id: 'sayari-1', label: 'First resolved entity' },
          { sayari_entity_id: 'sayari-2', label: 'Second resolved entity' },
        ],
      }],
    })

    const response = await getProjectEntities('project-1', {}, 'test-token')

    expect(response.entities[0]?.matches).toEqual([
      { id: 'sayari-1', label: 'First resolved entity' },
      { id: 'sayari-2', label: 'Second resolved entity' },
    ])
  })

  it('uses the highest ontology level across an entity risk factors', async () => {
    mockEntityResponse({
      ...entityResponse,
      data: [{
        ...entityResponse.data[0],
        risk_factors: [{ id: 'country_risk' }, { id: 'adverse_media' }],
      }],
    })

    const response = await getProjectEntities('project-1', {}, 'test-token')

    expect(response.entities[0]?.riskSeverity).toBe('high')
  })

  it('uses the API next cursor rather than the SDK next_token field', async () => {
    mockEntityResponse()

    expect((await getProjectEntities('project-1', {}, 'test-token')).next).toBe('next-entity')
  })

  it('uses the API previous cursor', async () => {
    mockEntityResponse()

    expect((await getProjectEntities('project-1', {}, 'test-token')).prev).toBe('prev-entity')
  })

  it('normalizes nullable entity cursors to the BFF optional cursor shape', async () => {
    mockEntityResponse({ ...entityResponse, next: null, prev: null })

    expect(await getProjectEntities('project-1', {}, 'test-token')).toMatchObject({
      next: undefined,
      prev: undefined,
    })
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

  it.each([
    { project_entity_id: 1 },
    { label: null },
    { countries: ['JPN', 1] },
    { risk_categories: [{ id: 'sanctions', label: null }] },
    { risk_factors: [{ id: 4 }] },
  ])('rejects malformed nested entity list fields: %j', async (malformed) => {
    mockEntityResponse({
      ...entityResponse,
      data: [{ ...entityResponse.data[0], ...malformed }],
    })

    await expect(getProjectEntities('project-1', {}, 'test-token'))
      .rejects.toThrow('Unexpected Sayari entity response.')
  })

  it('skips invalid optional entity matches without rejecting otherwise valid records', async () => {
    mockEntityResponse({
      ...entityResponse,
      data: [{ ...entityResponse.data[0], matches: [null, { sayari_entity_id: 'ok', label: 'Valid' }, { sayari_entity_id: 4, label: 'Invalid' }] }],
    })

    expect((await getProjectEntities('project-1', {}, 'test-token')).entities[0]?.matches)
      .toEqual([{ id: 'ok', label: 'Valid' }])
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

  it('accepts nullable share measurements and omits them from the mapped detail', async () => {
    const summary = {
      ...riskSummaryResponse,
      data: {
        ...riskSummaryResponse.data,
        risk_factors: [{
          ...riskSummaryResponse.data.risk_factors[0],
          network_paths: [[{
            ...riskSummaryResponse.data.risk_factors[0]!.network_paths![0]![0],
            shares: { percentage: null, num_shares: null, monetary_value: null },
          }]],
        }],
      },
    }
    mockDetailResponses({ data: {} }, 200, 200, summary)

    const response = await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(response.riskFactors[0]?.networkPaths[0]?.[0]?.shares).toEqual({
      percentage: undefined,
      numShares: undefined,
      monetaryValue: undefined,
    })
  })

  it('omits null network-path shares from the mapped detail', async () => {
    const summary = {
      ...riskSummaryResponse,
      data: {
        ...riskSummaryResponse.data,
        risk_factors: [{
          ...riskSummaryResponse.data.risk_factors[0],
          network_paths: [[{
            ...riskSummaryResponse.data.risk_factors[0]!.network_paths![0]![0],
            shares: null,
          }]],
        }],
      },
    }
    mockDetailResponses({ data: {} }, 200, 200, summary)

    const response = await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(response.riskFactors[0]?.networkPaths[0]?.[0]?.shares).toBeUndefined()
  })

  it('treats an empty risk-change data object as no recorded changes', async () => {
    mockDetailResponses()
    const response = await getProjectEntityDetail('project-1', 'entity-1', 'test-token')

    expect(response.riskChanges).toEqual([])
  })

  it.each([
    { risk_factors: [{ id: 3, label: 'Bad id', level: 'critical' }] },
    { risk_factors: [{ id: 'factor', label: 'Bad level', level: 'unknown' }] },
    { risk_factors: [{ id: 'factor', label: 'Factor', level: 'high', source_entity_ids: [1] }] },
    { risk_factors: [{ id: 'factor', label: 'Factor', level: 'high', network_paths: [[{ sayari_entity_id: 'entity' }]] }] },
  ])('rejects malformed nested risk summary fields: %j', async (data) => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => new Response(
      JSON.stringify(String(input).includes('/risk_summary') ? { data } : { data: {} }),
    ))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getProjectEntityDetail('project-1', 'entity-1', 'test-token'))
      .rejects.toThrow('Unexpected Sayari risk summary response.')
  })

  it('rejects malformed nested risk-change fields', async () => {
    mockDetailResponses({ data: { risk_factors: [{ id: 'factor', timestamp: 1, change_type: 'added' }] } })

    await expect(getProjectEntityDetail('project-1', 'entity-1', 'test-token'))
      .rejects.toThrow('Unexpected Sayari risk changes response.')
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
