import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
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

describe('BFF app', () => {
  it('returns JSON for an unknown API route', async () => {
    const response = await requestApp('/api/sayari/debug/countries')

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 404,
      body: { error: { code: 'ROUTE_NOT_FOUND', message: 'No API route matches this request.' } },
    })
  })
})
