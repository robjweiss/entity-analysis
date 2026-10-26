import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProjectExposure, getProjectRiskChanges } from './exposure.ts'

const count = (value: unknown) => ({ data: [{ project_entity_id: 'one' }], size: value })
const exact = (value: number) => ({ count: value, qualifier: 'eq' })

function stubResponses(responses: unknown[], status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => new Response(
    JSON.stringify(String(input).includes('/ontology/risk_factors') ? { data: [
      { id: 'exports_bis_high_priority_items_critical_components_indirect', label: 'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List', level: 'high' },
    ] } : responses.shift()), { status },
  ))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('project exposure', () => {
  it('requests a bounded unfiltered total and four category counts with a server-side token', async () => {
    const fetchMock = stubResponses([12, 3, 2, 1, 0].map((value) => count(exact(value))))
    await getProjectExposure('a/b', 'secret')

    expect(fetchMock.mock.calls.map(([input, init]) => ({
      path: new URL(String(input)).pathname,
      query: Object.fromEntries(new URL(String(input)).searchParams),
      authorization: new Headers(init?.headers).get('Authorization'),
    }))).toEqual([
      { path: '/v1/projects/a%2Fb/entities', query: { limit: '1' }, authorization: 'Bearer secret' },
      ...['sanctions', 'forced_labor', 'export_controls', 'adverse_media'].map((category) => ({
        path: '/v1/projects/a%2Fb/entities',
        query: { limit: '1', 'filter[risk_category]': category }, authorization: 'Bearer secret',
      })),
    ])
  })

  it('uses whole-project counts rather than the length of returned data', async () => {
    stubResponses([12, 3, 2, 1, 0].map((value) => count(exact(value))))

    expect(await getProjectExposure('project-1', 'token')).toEqual({
      total: exact(12),
      categories: {
        sanctions: exact(3), forcedLabor: exact(2), exportControls: exact(1), adverseMedia: exact(0),
      },
    })
  })

  it('preserves inexact qualifiers without turning estimates into exact counts', async () => {
    stubResponses([count({ count: 1000, qualifier: 'gte' }), ...Array.from({ length: 4 }, () => count(exact(0)))])

    expect((await getProjectExposure('project-1', 'token')).total).toEqual({ count: 1000, qualifier: 'gte' })
  })

  it.each([undefined, { count: 1 }, { count: -1, qualifier: 'eq' },
    { count: 1.5, qualifier: 'eq' }, { count: 1, qualifier: 'unknown' }])(
    'rejects a missing or malformed count: %j', async (size) => {
      stubResponses([count(size), ...Array.from({ length: 4 }, () => count(exact(0)))])

      await expect(getProjectExposure('project-1', 'token')).rejects.toThrow('Unexpected Sayari project entity count response.')
    },
  )

  it('rejects a malformed filtered count', async () => {
    stubResponses([count(exact(10)), count({}), ...Array.from({ length: 3 }, () => count(exact(0)))])

    await expect(getProjectExposure('project-1', 'token')).rejects.toThrow('Unexpected Sayari project entity count response.')
  })

  it('propagates upstream errors', async () => {
    stubResponses([{}], 429)

    await expect(getProjectExposure('project-1', 'token')).rejects.toMatchObject({ statusCode: 429 })
  })
})

describe('project risk changes', () => {
  const now = new Date('2026-10-25T12:00:00.000Z')

  it('requests the rolling week newest first with a bounded limit', async () => {
    const fetchMock = stubResponses([{ data: {} }])
    await getProjectRiskChanges('a/b', 'secret', now)

    expect({
      path: new URL(String(fetchMock.mock.calls[0]?.[0])).pathname,
      query: Object.fromEntries(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams),
      authorization: new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization'),
    }).toEqual({
      path: '/v1/projects/a%2Fb/entities/changes/risk',
      query: {
        limit: '6', 'sort.date': 'desc',
        'filter.from': '2026-10-18', 'filter.to': '2026-10-25',
      },
      authorization: 'Bearer secret',
    })
  })

  it('handles the observed empty data object', async () => {
    stubResponses([{ data: {} }])

    expect(await getProjectRiskChanges('project-1', 'token', now)).toEqual({
      from: '2026-10-18T12:00:00.000Z', to: '2026-10-25T12:00:00.000Z',
      changes: [], hasMore: false,
    })
  })

  it('normalizes a nullable project-wide changes cursor to no next page', async () => {
    stubResponses([{ data: {}, next: null }])

    expect((await getProjectRiskChanges('project-1', 'token', now)).next).toBeUndefined()
  })

  it('excludes factors outside the precise seven-day window even when Sayari includes their calendar day', async () => {
    stubResponses([{ data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [
      { id: 'old', timestamp: '2026-10-18T11:59:59Z', change_type: 'added' },
      { id: 'recent', timestamp: '2026-10-18T12:00:00Z', change_type: 'added' },
      { id: 'future', timestamp: '2026-10-25T12:00:01Z', change_type: 'added' },
    ] }] } }])

    expect((await getProjectRiskChanges('project-1', 'token', now)).changes.map((change) => change.factor)).toEqual(['recent'])
  })

  it('preserves Sayari pagination even when a page has no in-window factors', async () => {
    stubResponses([{ data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [
      { id: 'old', timestamp: '2026-10-18T11:59:59Z', change_type: 'added' },
    ] }] }, next: 'sayari-next-token' }])

    expect((await getProjectRiskChanges('project-1', 'token', now)).next).toBe('sayari-next-token')
  })

  it('flattens and sorts all factor additions and removals from a bounded Sayari page', async () => {
    stubResponses([{ data: { project_id: 'project-1', risk_changes: [
      { project_entity_id: 'one', label: 'Example supplier', risk_factors: [
        { id: 'sanctioned', timestamp: '2026-10-20T00:00:00Z', change_type: 'added' },
        { id: 'pep', timestamp: '2026-10-21T00:00:00Z', change_type: 'removed' },
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `factor_${i}`, timestamp: `2026-10-2${i + 1}T00:00:00Z`, change_type: 'added',
        })),
      ] },
    ] } }])

    const result = await getProjectRiskChanges('project-1', 'token', now)
    expect(result.changes).toEqual([
      { projectEntityId: 'one', entityName: 'Example supplier', factor: 'factor_3', changeType: 'added', timestamp: '2026-10-24T00:00:00Z' },
      { projectEntityId: 'one', entityName: 'Example supplier', factor: 'factor_2', changeType: 'added', timestamp: '2026-10-23T00:00:00Z' },
      { projectEntityId: 'one', entityName: 'Example supplier', factor: 'pep', changeType: 'removed', timestamp: '2026-10-21T00:00:00Z' },
      { projectEntityId: 'one', entityName: 'Example supplier', factor: 'factor_1', changeType: 'added', timestamp: '2026-10-22T00:00:00Z' },
      { projectEntityId: 'one', entityName: 'Example supplier', factor: 'factor_0', changeType: 'added', timestamp: '2026-10-21T00:00:00Z' },
      { projectEntityId: 'one', entityName: 'Example supplier', factor: 'sanctioned', changeType: 'added', timestamp: '2026-10-20T00:00:00Z' },
    ].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)))
  })

  it('uses one ontology request for human-readable labels rather than a call per factor', async () => {
    const fetchMock = stubResponses([{ data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [
      { id: 'exports_bis_high_priority_items_critical_components_indirect', timestamp: '2026-10-24', change_type: 'added' },
      { id: 'unknown_factor', timestamp: '2026-10-23', change_type: 'removed' },
    ] }] } }])

    const result = await getProjectRiskChanges('project-1', 'token', now)
    expect({
      requests: fetchMock.mock.calls.length,
      label: result.changes[0]?.factorLabel,
      fallback: result.changes[1]?.factorLabel,
    }).toEqual({
      requests: 2,
      label: 'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      fallback: undefined,
    })
  })

  it('returns every factor from one upstream group for the UI to reveal incrementally', async () => {
    const groups = { data: { risk_changes: [{ project_entity_id: 'one', risk_factors: Array.from({ length: 9 }, (_, i) => ({
      id: `factor_${i}`, timestamp: `2026-10-24T00:00:0${9 - i}Z`, change_type: 'added',
    })) }] } }
    stubResponses([groups])

    expect((await getProjectRiskChanges('project-1', 'token', now)).changes.map((change) => change.factor)).toEqual(
      Array.from({ length: 9 }, (_, i) => `factor_${i}`),
    )
  })

  it('forwards Sayari pagination with the original seven-day window', async () => {
    const firstPage = { data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [
      { id: 'first', timestamp: '2026-10-24', change_type: 'added' },
    ] }] }, next: 'upstream-next' }
    const secondPage = { data: { risk_changes: [{ project_entity_id: 'two', risk_factors: [
      { id: 'second', timestamp: '2026-10-23', change_type: 'removed' },
    ] }] } }
    const fetchMock = stubResponses([firstPage, secondPage])
    const first = await getProjectRiskChanges('project-1', 'token', now)
    await getProjectRiskChanges('project-1', 'token', new Date('2026-10-27T12:00:00.000Z'), {
      next: first.next, asOf: first.to,
    })

    expect(Object.fromEntries(new URL(String(fetchMock.mock.calls[2]?.[0])).searchParams)).toEqual({
      limit: '6', 'sort.date': 'desc', 'filter.from': '2026-10-18',
      'filter.to': '2026-10-25', next: 'upstream-next',
    })
  })

  it.each([
    { next: 'sayari-next-token' }, { asOf: '2026-10-25T12:00:00.000Z' },
    { next: 'sayari-next-token', asOf: 'invalid' },
    { next: 'sayari-next-token', asOf: '2026-10-27T12:00:00.000Z' },
  ])('rejects incomplete or invalid upstream pagination parameters: %j', async (pagination) => {
      stubResponses([])

      await expect(getProjectRiskChanges('project-1', 'token', now, pagination)).rejects.toMatchObject({
        name: 'RequestValidationError',
      })
  })

  it('indicates a next page even when fewer than five factors are present', async () => {
    stubResponses([{ data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [
      { id: 'pep', timestamp: '2026-10-24', change_type: 'removed' },
    ] }] }, next: 'sayari-next-token' }])

    expect((await getProjectRiskChanges('project-1', 'token', now)).hasMore).toBe(true)
  })

  it.each([{ data: null }, { data: { risk_changes: 'invalid' } },
    { data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [{ id: 'pep', timestamp: 'invalid', change_type: 'added' }] }] } },
    { data: { risk_changes: [{ project_entity_id: 1, risk_factors: [] }] } },
    { data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [{ id: 'pep', timestamp: '2026-10-24', change_type: 'unknown' }] }] } },
    { data: { risk_changes: [{ project_entity_id: 'one', risk_factors: [{ id: 'pep', timestamp: '2026-10-24', change_type: 'added' }] }] }, next: 4 },
  ])('rejects malformed changes instead of silently showing an empty state', async (body) => {
    stubResponses([body])

    await expect(getProjectRiskChanges('project-1', 'token', now)).rejects.toThrow('Unexpected Sayari project risk changes response.')
  })

  it('propagates upstream errors', async () => {
    stubResponses([{}], 429)

    await expect(getProjectRiskChanges('project-1', 'token', now)).rejects.toMatchObject({ statusCode: 429 })
  })
})
