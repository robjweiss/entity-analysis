import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.ts'

async function requestApp(sayari: Parameters<typeof createApp>[0]) {
  const server = createServer(createApp(sayari))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo

  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/sayari/debug/countries`)
  } finally {
    await new Promise<void>((resolve, reject) =>
      (server as Server).close((error) => (error ? reject(error) : resolve())),
    )
  }
}

describe('Sayari BFF', () => {
  it('returns a read-only countries summary', async () => {
    const getCountries = vi.fn<() => Promise<{ data: unknown[]; totalCount: number }>>().mockResolvedValue({
      data: [{ id: 'USA' }],
      totalCount: 252,
    })
    const response = await requestApp({ getCountries })

    expect(await response.json()).toEqual({ returned: 1, totalCount: 252 })
  })

  it('does not expose an upstream error', async () => {
    const getCountries = vi.fn<() => Promise<{ data: unknown[]; totalCount: number }>>().mockRejectedValue(
      new Error('upstream failure'),
    )
    const response = await requestApp({ getCountries })

    expect(await response.json()).toEqual({ error: 'The Sayari request failed.' })
  })
})
