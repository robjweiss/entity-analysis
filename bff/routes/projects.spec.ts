import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { SayariError } from '@sayari/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const nativeFetch = globalThis.fetch

const sayari = vi.hoisted(() => ({
  getProjects: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getAccessToken: vi.fn<(...args: unknown[]) => Promise<string>>(),
  getProjectEntityRiskSummary: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getProjectEntityRiskChanges: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

vi.mock('../sayari.ts', () => ({
  getAccessToken: sayari.getAccessToken,
  getSayariClient: () => ({
    project: { getProjects: sayari.getProjects },
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
      return Promise.resolve(
        new Response(
          status === 429 ? null : JSON.stringify(body),
          { status },
        ),
      )
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

  it('does not expose upstream project errors', async () => {
    sayari.getProjects.mockRejectedValue(new Error('upstream credentials'))
    const response = await requestApp('/api/projects')

    expect(await response.json()).toEqual({
      error: {
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'Unable to load projects. Please try again shortly.',
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
})
