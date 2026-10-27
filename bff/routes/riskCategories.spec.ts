import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const nativeFetch = globalThis.fetch
const sayari = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => Promise<string>>(),
}))

vi.mock('../sayari.ts', () => ({
  getAccessToken: sayari.getAccessToken,
  getSayariClient: () => ({}),
}))

import { createApp } from '../app.ts'

function stubUpstream(response: Response) {
  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    if (String(input).startsWith('https://api.sayari.com/')) return Promise.resolve(response)
    return nativeFetch(input, init)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function requestApp() {
  const server = createServer(createApp())
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo

  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/risk-categories`)
  } finally {
    await new Promise<void>((resolve, reject) =>
      (server as Server).close((error) => (error ? reject(error) : resolve())),
    )
  }
}

beforeEach(() => {
  sayari.getAccessToken.mockResolvedValue('test-token')
  stubUpstream(new Response(JSON.stringify({
    data: [
      { id: 'ignored', categories: ['sanctions'] },
      { categories: [
        'adverse_media', 'environmental_risk', 'export_controls', 'forced_labor',
        'political_exposure', 'regulatory_action', 'sanctions',
        'sanctions_and_export_control_lists', 'shell_company_risk',
      ] },
    ],
    total_count: 3,
  })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

describe('risk category options route', () => {
  it('returns deduplicated category IDs with humanized labels sorted by label', async () => {
    const response = await requestApp()

    expect(await response.json()).toEqual({ categories: [
      { id: 'adverse_media', label: 'Adverse media' },
      { id: 'environmental_risk', label: 'Environmental risk' },
      { id: 'export_controls', label: 'Export controls' },
      { id: 'forced_labor', label: 'Forced labor' },
      { id: 'political_exposure', label: 'Political exposure' },
      { id: 'regulatory_action', label: 'Regulatory action' },
      { id: 'sanctions', label: 'Sanctions' },
      { id: 'sanctions_and_export_control_lists', label: 'Sanctions and export control lists' },
      { id: 'shell_company_risk', label: 'Shell company risk' },
    ] })
  })

  it('returns an empty list when the ontology has no records', async () => {
    stubUpstream(new Response(JSON.stringify({ data: [], total_count: 0 })))

    const response = await requestApp()

    expect(await response.json()).toEqual({ categories: [] })
  })

  it('returns an empty list when ontology records have no categories', async () => {
    stubUpstream(new Response(JSON.stringify({ data: [{ categories: [] }], total_count: 1 })))

    const response = await requestApp()

    expect(await response.json()).toEqual({ categories: [] })
  })

  it('rejects malformed category data as an upstream payload error', async () => {
    stubUpstream(new Response(JSON.stringify({ data: [{ categories: [1] }] })))

    const response = await requestApp()

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 502,
      body: { error: {
        code: 'UPSTREAM_INVALID_RESPONSE',
        message: 'Unable to load risk categories. Please try again shortly.',
      } },
    })
  })

  it('sends the server-side access token to the ontology endpoint', async () => {
    const fetchMock = stubUpstream(new Response(JSON.stringify({ data: [] })))

    await requestApp()

    const [url, init] = fetchMock.mock.calls.find(([input]) => String(input).startsWith('https://api.sayari.com/'))!
    expect(String(url)).toBe('https://api.sayari.com/v1/ontology/risk_factors')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token')
  })

  it('maps upstream authorization failures without exposing upstream response details', async () => {
    stubUpstream(new Response('secret upstream detail', { status: 401 }))

    const response = await requestApp()

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 502,
      body: { error: {
        code: 'UPSTREAM_ERROR',
        message: 'Unable to load risk categories. Please try again shortly.',
      } },
    })
  })
})
