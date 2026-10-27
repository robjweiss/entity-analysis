import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { SayariError, SayariTimeoutError } from '@sayari/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const nativeFetch = globalThis.fetch

const sayari = vi.hoisted(() => ({
  getProjects: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getAccessToken: vi.fn<(...args: unknown[]) => Promise<string>>(),
  getProjectEntityRiskSummary: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getProjectEntityRiskChanges: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getEntity: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

vi.mock('../sayari.ts', () => ({
  getAccessToken: sayari.getAccessToken,
  getSayariClient: () => ({
    project: { getProjects: sayari.getProjects },
    entity: { getEntity: sayari.getEntity },
    projectEntity: {
      getProjectEntityRiskSummary: sayari.getProjectEntityRiskSummary,
      getProjectEntityRiskChanges: sayari.getProjectEntityRiskChanges,
    },
  }),
}))

import { createApp } from '../app.ts'

async function requestApp(path: string) {
  const server = createServer(createApp())
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`)
  } finally {
    await new Promise<void>((resolve, reject) =>
      (server as Server).close((error) => (error ? reject(error) : resolve())),
    )
  }
}

function stubEntityApi(status = 200) {
  const requests: string[] = []
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).startsWith('https://api.sayari.com/')) {
      requests.push(String(input))
      const url = String(input)
      const body = url.endsWith('/risk_summary')
        ? { data: { risk_factors: [] } }
        : url.includes('/changes/risk?')
          ? { data: {} }
          : { data: [], size: { count: 0, qualifier: 'eq' } }
      return Promise.resolve(new Response(status === 429 ? null : JSON.stringify(body), { status }))
    }
    return nativeFetch(input, init)
  })
  return requests
}

beforeEach(() => {
  vi.resetAllMocks()
  sayari.getProjects.mockResolvedValue({ data: [] })
  sayari.getAccessToken.mockResolvedValue('test-token')
  sayari.getProjectEntityRiskSummary.mockResolvedValue({ data: { riskFactors: [] } })
  sayari.getProjectEntityRiskChanges.mockResolvedValue({ data: { riskFactors: [] } })
  sayari.getEntity.mockResolvedValue({
    relationships: {
      data: [
        {
          target: {
            id: 'related-1',
            label: 'Related entity',
            countries: ['JPN'],
            sanctioned: false,
            pep: false,
          },
          types: { has_director: [] },
        },
      ],
      size: { count: 11, qualifier: 'eq' },
      next: 'next-cursor',
    },
    referencedBy: {
      data: [
        {
          type: 'about',
          record: {
            id: 'record-1',
            label: 'Company record',
            source: 'registry',
            publicationDate: '2026-01-01',
          },
        },
      ],
      size: { count: 12, qualifier: 'eq' },
      next: 'next-record-cursor',
    },
  })
  stubEntityApi()
})

afterEach(() => vi.unstubAllGlobals())

describe('project routes', () => {
  it('serves a page of project labels', async () => {
    sayari.getProjects.mockResolvedValue({
      data: [{ id: 'abc', label: 'Supplier review' }],
      next: 'more',
      prev: 'back',
    })
    const response = await requestApp('/api/projects?next=cursor')

    expect(await response.json()).toEqual({
      projects: [{ id: 'abc', label: 'Supplier review' }],
      next: 'more',
      prev: 'back',
    })
  })

  it('supports previous-page project pagination', async () => {
    await requestApp('/api/projects?prev=cursor')

    expect(sayari.getProjects).toHaveBeenCalledWith({
      archived: false,
      limit: 100,
      next: undefined,
      prev: 'cursor',
    })
  })

  it('passes supported entity filters and pagination to Sayari', async () => {
    const requests = stubEntityApi()
    const response = await requestApp(
      '/api/projects/abc/entities?name=bank&country=JPN&riskCategory=sanctions&next=cursor',
    )

    expect({
      status: response.status,
      query: Object.fromEntries(new URL(requests[0]!).searchParams),
    }).toEqual({
      status: 200,
      query: {
        limit: '25',
        'filter[label][fuzzy]': 'bank',
        'filter[country]': 'JPN',
        'filter[risk_category]': 'sanctions',
        next: 'cursor',
      },
    })
  })

  it('serves the exposure counts for the selected project', async () => {
    const requests = stubEntityApi()
    const response = await requestApp('/api/projects/abc/exposure')

    expect({
      status: response.status,
      body: await response.json(),
      requests: requests.length,
    }).toEqual({
      status: 200,
      body: {
        total: { count: 0, qualifier: 'eq' },
        categories: Object.fromEntries(
          ['sanctions', 'forcedLabor', 'exportControls', 'adverseMedia'].map((key) => [
            key,
            { count: 0, qualifier: 'eq' },
          ]),
        ),
      },
      requests: 5,
    })
  })

  it('serves an empty recent-change response', async () => {
    const response = await requestApp('/api/projects/abc/risk-changes')

    expect(await response.json()).toMatchObject({ changes: [], hasMore: false })
  })

  it.each(['exposure?unexpected=value', 'risk-changes?unexpected=value'])(
    'rejects unsupported %s query parameters',
    async (route) => {
      const response = await requestApp(`/api/projects/abc/${route}`)

      expect(response.status).toBe(400)
    },
  )

  it('requires a snapshot time when paginating recent changes', async () => {
    const response = await requestApp('/api/projects/abc/risk-changes?next=upstream-cursor')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Provide both "next" and "asOf" to load more changes.',
          parameter: 'next',
        },
      },
    })
  })

  it.each(['exposure', 'risk-changes'])('rejects invalid %s project identifiers', async (route) => {
    const response = await requestApp(`/api/projects/%20abc/${route}`)

    expect(response.status).toBe(400)
  })

  it.each(['exposure', 'risk-changes'])(
    'maps %s rate limits to retryable errors',
    async (route) => {
      stubEntityApi(429)
      const response = await requestApp(`/api/projects/abc/${route}`)

      expect((await response.json()).error.code).toBe('UPSTREAM_RATE_LIMITED')
    },
  )

  it('surfaces malformed exposure counts as errors', async () => {
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).startsWith('https://api.sayari.com/')
        ? Promise.resolve(new Response(JSON.stringify({ data: [] })))
        : nativeFetch(input, init),
    )

    const response = await requestApp('/api/projects/abc/exposure')

    expect(response.status).toBe(502)
  })

  it('returns a client-safe 502 for malformed nested project entity data', async () => {
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).startsWith('https://api.sayari.com/')
        ? Promise.resolve(new Response(JSON.stringify({
            data: [{
              project_entity_id: 'entity-1',
              label: 'Example entity',
              countries: [1],
              risk_categories: [],
              risk_factors: [],
            }],
          })))
        : nativeFetch(input, init),
    )

    const response = await requestApp('/api/projects/abc/entities')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 502,
      body: {
        error: {
          code: 'UPSTREAM_INVALID_RESPONSE',
          message: 'Unable to load project entities. Please try again shortly.',
        },
      },
    })
  })

  it('maps entity-list rate limits to a retryable BFF error', async () => {
    stubEntityApi(429)
    const response = await requestApp('/api/projects/abc/entities')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 503,
      body: {
        error: {
          code: 'UPSTREAM_RATE_LIMITED',
          message: 'Sayari is temporarily rate limiting requests. Please try again shortly.',
        },
      },
    })
  })

  it('rejects ambiguous pagination with a corrective message', async () => {
    const response = await requestApp('/api/projects/abc/entities?next=one&prev=two')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Use either "next" or "prev" pagination, not both.',
        },
      },
    })
  })

  it('rejects malformed country filters', async () => {
    const response = await requestApp('/api/projects/abc/entities?country=Japan')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: '"country" must be a recognized ISO 3166-1 alpha-3 code, such as JPN.',
          parameter: 'country',
        },
      },
    })
  })

  it('rejects unknown three-letter country codes', async () => {
    const response = await requestApp('/api/projects/abc/entities?country=QQQ')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: '"country" must be a recognized ISO 3166-1 alpha-3 code, such as JPN.',
          parameter: 'country',
        },
      },
    })
  })

  it('explains when a query parameter has multiple values', async () => {
    const response = await requestApp('/api/projects/abc/entities?name=bank&name=company')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: '"name" must be provided as a single value.',
          parameter: 'name',
        },
      },
    })
  })

  it('explains when a query parameter is too long', async () => {
    const longName = 'x'.repeat(501)
    const response = await requestApp(`/api/projects/abc/entities?name=${longName}`)

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: '"name" must be no longer than 500 characters.',
          parameter: 'name',
        },
      },
    })
  })

  it('loads entity details from the requested project', async () => {
    const requests = stubEntityApi()
    const response = await requestApp('/api/projects/abc/entities/entity-1')

    expect(requests).toEqual([
      'https://api.sayari.com/v1/projects/abc/entities/entity-1/risk_summary',
      'https://api.sayari.com/v1/projects/abc/entities/entity-1/changes/risk?limit=100',
    ])
    expect(response.status).toBe(200)
  })

  it('loads the next relationship page with the provided Sayari cursor', async () => {
    const response = await requestApp('/api/entities/entity-1/relationships?next=next-cursor')

    expect(sayari.getEntity).toHaveBeenCalledWith(
      'entity-1',
      expect.objectContaining({
        relationshipsLimit: 10,
        relationshipsNext: 'next-cursor',
      }),
    )
    expect(await response.json()).toMatchObject({
      relationships: [{ id: 'related-1', label: 'Related entity', types: ['Has Director'] }],
      relationshipCount: 11,
      nextRelationship: 'next-cursor',
    })
  })

  it('loads the next supporting-record page with its Sayari cursor', async () => {
    const response = await requestApp('/api/entities/entity-1/records?next=record-cursor')

    expect(sayari.getEntity).toHaveBeenCalledWith(
      'entity-1',
      expect.objectContaining({
        referencedByLimit: 10,
        referencedByNext: 'record-cursor',
      }),
    )
    expect(await response.json()).toMatchObject({
      records: [{ id: 'record-1', label: 'Company record', type: 'about' }],
      recordCount: 12,
      nextRecord: 'next-record-cursor',
    })
  })

  it('classifies unknown SDK errors as internal failures without exposing details', async () => {
    sayari.getProjects.mockRejectedValue(new Error('upstream credentials'))
    const response = await requestApp('/api/projects')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 500,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to load projects. Please try again shortly.',
        },
      },
    })
  })

  it('rejects an invalid project path identifier', async () => {
    const response = await requestApp('/api/projects/%20abc/entities')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message:
            '"projectId" must be a non-empty identifier with no surrounding whitespace and no more than 500 characters.',
          parameter: 'projectId',
        },
      },
    })
  })

  it('rejects unsupported query parameters with the supported names', async () => {
    const response = await requestApp('/api/projects/abc/entities?contry=JPN')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message:
            'Unsupported query parameter "contry". Supported parameters: name, country, riskCategory, next, prev.',
          parameter: 'contry',
        },
      },
    })
  })

  it('maps Sayari not-found errors to a client-safe not-found response', async () => {
    sayari.getProjects.mockRejectedValue(
      new SayariError({ message: 'private upstream detail', statusCode: 404 }),
    )
    const response = await requestApp('/api/projects')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 404,
      body: {
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested Sayari project or entity was not found.',
        },
      },
    })
  })

  it('maps Sayari rate limits to a retryable service response', async () => {
    sayari.getProjects.mockRejectedValue(new SayariError({ statusCode: 429 }))
    const response = await requestApp('/api/projects')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 503,
      body: {
        error: {
          code: 'UPSTREAM_RATE_LIMITED',
          message: 'Sayari is temporarily rate limiting requests. Please try again shortly.',
        },
      },
    })
  })

  it.each([
    {
      name: 'local timeout-shaped exception',
      status: 500,
      code: 'INTERNAL_ERROR',
      setup: () =>
        sayari.getProjects.mockRejectedValue(new DOMException('local timeout', 'TimeoutError')),
      path: '/api/projects',
    },
    {
      name: 'malformed upstream payload',
      status: 502,
      code: 'UPSTREAM_INVALID_RESPONSE',
      path: '/api/projects/abc/exposure',
      setup: () =>
        vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
          String(input).startsWith('https://api.sayari.com/')
            ? Promise.resolve(
                new Response(JSON.stringify({ size: { count: -1, qualifier: 'eq' } })),
              )
            : nativeFetch(input, init),
        ),
    },
    {
      name: 'null upstream JSON',
      status: 502,
      code: 'UPSTREAM_INVALID_RESPONSE',
      path: '/api/projects/abc/entities/entity-1',
      setup: () =>
        vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
          String(input).startsWith('https://api.sayari.com/')
            ? Promise.resolve(new Response('null'))
            : nativeFetch(input, init),
        ),
    },
    {
      name: 'malformed upstream JSON',
      status: 502,
      code: 'UPSTREAM_INVALID_RESPONSE',
      path: '/api/projects/abc/exposure',
      setup: () =>
        vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
          String(input).startsWith('https://api.sayari.com/')
            ? Promise.resolve(new Response('{'))
            : nativeFetch(input, init),
        ),
    },
    {
      name: 'transport failure',
      status: 503,
      code: 'UPSTREAM_UNAVAILABLE',
      setup: () =>
        vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
          String(input).startsWith('https://api.sayari.com/')
            ? Promise.reject(new TypeError('socket failed'))
            : nativeFetch(input, init),
        ),
      path: '/api/projects/abc/exposure',
    },
    {
      name: 'actual timeout',
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
      setup: () =>
        vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
          String(input).startsWith('https://api.sayari.com/')
            ? Promise.reject(new DOMException('timed out', 'TimeoutError'))
            : nativeFetch(input, init),
        ),
      path: '/api/projects/abc/exposure',
    },
    ...[401, 500].map((upstreamStatus) => ({
      name: `upstream HTTP ${upstreamStatus}`,
      status: 502,
      code: 'UPSTREAM_ERROR',
      setup: () =>
        sayari.getProjects.mockRejectedValue(new SayariError({ statusCode: upstreamStatus })),
      path: '/api/projects',
    })),
    {
      name: 'upstream validation rejection',
      status: 400,
      code: 'UPSTREAM_REJECTED_REQUEST',
      setup: () => sayari.getProjects.mockRejectedValue(new SayariError({ statusCode: 422 })),
      path: '/api/projects',
    },
    {
      name: 'upstream service unavailable',
      status: 503,
      code: 'UPSTREAM_UNAVAILABLE',
      setup: () => sayari.getProjects.mockRejectedValue(new SayariError({ statusCode: 503 })),
      path: '/api/projects',
    },
    {
      name: 'upstream request timeout',
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
      setup: () => sayari.getProjects.mockRejectedValue(new SayariError({ statusCode: 408 })),
      path: '/api/projects',
    },
    {
      name: 'SDK timeout',
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
      setup: () => sayari.getProjects.mockRejectedValue(new SayariTimeoutError('timeout')),
      path: '/api/projects',
    },
    {
      name: 'SDK connection error',
      status: 503,
      code: 'UPSTREAM_UNAVAILABLE',
      setup: () => sayari.getProjects.mockRejectedValue(new SayariError({ statusCode: 520 })),
      path: '/api/projects',
    },
    {
      name: 'SDK unknown transport failure',
      status: 503,
      code: 'UPSTREAM_UNAVAILABLE',
      setup: () =>
        sayari.getProjects.mockRejectedValue(new SayariError({ message: 'private fetch detail' })),
      path: '/api/projects',
    },
  ])('maps $name to the expected response', async ({ setup, path, status, code }) => {
    setup()
    const response = await requestApp(path)

    expect({ status: response.status, code: (await response.json()).error.code }).toEqual({
      status,
      code,
    })
  })

  it('does not return private exception details in error responses', async () => {
    sayari.getProjects.mockRejectedValue(new Error('private config detail'))
    const response = await requestApp('/api/projects')

    expect(JSON.stringify(await response.json())).not.toContain('private config detail')
  })
})
