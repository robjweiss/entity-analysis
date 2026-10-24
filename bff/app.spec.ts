import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { SayariError } from '@sayari/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sayari = vi.hoisted(() => ({
  getProjects: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getProjectEntities: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getProjectEntityRiskSummary: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getProjectEntityRiskChanges: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

vi.mock('./sayari.ts', () => ({
  getSayariClient: () => ({
    project: { getProjects: sayari.getProjects },
    projectEntity: {
      getProjectEntities: sayari.getProjectEntities,
      getProjectEntityRiskSummary: sayari.getProjectEntityRiskSummary,
      getProjectEntityRiskChanges: sayari.getProjectEntityRiskChanges,
    },
  }),
}))

import { createApp } from './app.ts'

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

beforeEach(() => {
  vi.resetAllMocks()
  sayari.getProjects.mockResolvedValue({ data: [] })
  sayari.getProjectEntities.mockResolvedValue({ data: [], size: { count: 0, qualifier: 'eq' } })
  sayari.getProjectEntityRiskSummary.mockResolvedValue({ data: { riskFactors: [] } })
  sayari.getProjectEntityRiskChanges.mockResolvedValue({ data: { riskFactors: [] } })
})

describe('Sayari BFF', () => {
  it('serves a page of project labels', async () => {
    sayari.getProjects.mockResolvedValue({
      data: [{ id: 'abc', label: 'Supplier review' }], next: 'more', prev: 'back',
    })
    const response = await requestApp('/api/projects?next=cursor')

    expect(await response.json()).toEqual({
      projects: [{ id: 'abc', label: 'Supplier review' }], next: 'more', prev: 'back',
    })
  })

  it('supports previous-page project pagination', async () => {
    await requestApp('/api/projects?prev=cursor')

    expect(sayari.getProjects).toHaveBeenCalledWith({ archived: false, limit: 100, next: undefined, prev: 'cursor' })
  })

  it('passes supported filters and pagination to the SDK', async () => {
    const response = await requestApp(
      '/api/projects/abc/entities?name=bank&country=JPN&riskCategory=sanctions&next=cursor',
    )

    expect(sayari.getProjectEntities).toHaveBeenCalledWith('abc', {
      limit: 25, next: 'cursor', prev: undefined,
      filter: { label: { fuzzy: ['bank'] }, country: ['JPN'], riskCategory: ['sanctions'] },
    })
    expect(response.status).toBe(200)
  })

  it('rejects ambiguous pagination with a corrective message', async () => {
    const response = await requestApp('/api/projects/abc/entities?next=one&prev=two')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: { code: 'INVALID_PARAMETER', message: 'Use either "next" or "prev" pagination, not both.' },
      },
    })
  })

  it('rejects malformed country filters with a corrective message', async () => {
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
    const response = await requestApp('/api/projects/abc/entities/entity-1')

    expect(sayari.getProjectEntityRiskSummary).toHaveBeenCalledWith('abc', 'entity-1', { filter: {} })
    expect(response.status).toBe(200)
  })

  it('does not expose upstream project errors', async () => {
    sayari.getProjects.mockRejectedValue(new Error('upstream credentials'))
    const response = await requestApp('/api/projects')

    expect(await response.json()).toEqual({
      error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Unable to load projects. Please try again shortly.' },
    })
  })

  it('rejects an invalid project path identifier', async () => {
    const response = await requestApp('/api/projects/%20abc/entities')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: {
        error: {
          code: 'INVALID_PARAMETER',
          message: '"projectId" must be a non-empty identifier with no surrounding whitespace and no more than 500 characters.',
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
          message: 'Unsupported query parameter "contry". Supported parameters: name, country, riskCategory, next, prev.',
          parameter: 'contry',
        },
      },
    })
  })

  it('maps Sayari not-found errors to a client-safe not-found response', async () => {
    sayari.getProjects.mockRejectedValue(new SayariError({ message: 'private upstream detail', statusCode: 404 }))
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

  it('returns JSON for the removed debug route', async () => {
    const response = await requestApp('/api/sayari/debug/countries')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 404,
      body: { error: { code: 'ROUTE_NOT_FOUND', message: 'No API route matches this request.' } },
    })
  })
})
