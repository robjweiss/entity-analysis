import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app.ts'

async function requestApp(path: string, staticDirectory?: string, headers?: HeadersInit) {
  const server = createServer(createApp({ staticDirectory }))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { headers })
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

describe('production frontend hosting', () => {
  let staticDirectory: string
  const html = '<!doctype html><html><body>Prototype</body></html>'

  beforeAll(async () => {
    staticDirectory = await mkdtemp(join(tmpdir(), 'entity-analysis-static-'))
    await mkdir(join(staticDirectory, 'assets'))
    await writeFile(join(staticDirectory, 'index.html'), html)
    await writeFile(join(staticDirectory, 'assets', 'app.js'), 'console.log("prototype")')
  })

  afterAll(async () => {
    await rm(staticDirectory, { recursive: true, force: true })
  })

  it.each(['/', '/executive', '/management', '/analyst/entity-123'])(
    'serves the UI for a direct visit to %s',
    async (path) => {
      const response = await requestApp(path, staticDirectory)
      expect({ status: response.status, body: await response.text() }).toEqual({
        status: 200,
        body: html,
      })
    },
  )

  it('serves frontend assets', async () => {
    const response = await requestApp('/assets/app.js', staticDirectory)
    expect({ status: response.status, body: await response.text() }).toEqual({
      status: 200,
      body: 'console.log("prototype")',
    })
  })

  it('does not turn unknown API routes into frontend pages', async () => {
    const response = await requestApp('/api/missing', staticDirectory)
    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 404,
      body: { error: { code: 'ROUTE_NOT_FOUND', message: 'No API route matches this request.' } },
    })
  })

  it('returns 404 for missing assets instead of HTML', async () => {
    const response = await requestApp('/assets/missing.js', staticDirectory)
    expect(response.status).toBe(404)
  })

  it('does not serve the UI for requests that do not accept HTML', async () => {
    const response = await requestApp('/missing', staticDirectory, { Accept: 'application/json' })
    expect(response.status).toBe(404)
  })

  it('does not serve the UI when static hosting is disabled', async () => {
    const response = await requestApp('/executive')
    expect(response.status).toBe(404)
  })
})
