import type { SayariClient } from '@sayari/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSayariClient, getAccessToken } from './sayari.ts'

const credentials = { clientId: 'client-id', clientSecret: 'client-secret' }

function createClient(expiresIn = 3600) {
  const getToken = vi.fn<(_request: typeof credentials) => Promise<{ accessToken: string; expiresIn: number }>>()
    .mockResolvedValue({ accessToken: 'test-token', expiresIn })
  return { client: { auth: { getToken } } as unknown as SayariClient, getToken }
}

beforeEach(() => {
  vi.stubEnv('SAYARI_CLIENT_ID', 'client-id')
  vi.stubEnv('SAYARI_CLIENT_SECRET', 'client-secret')
})

afterEach(() => vi.unstubAllEnvs())

describe('Sayari authentication', () => {
  it('reads credentials privately for the SDK auth endpoint', async () => {
    const { client, getToken } = createClient()
    await getAccessToken(client)

    expect(getToken).toHaveBeenCalledWith(credentials)
  })

  it('reuses a valid bearer token for the same client', async () => {
    const { client, getToken } = createClient()
    await getAccessToken(client)
    await getAccessToken(client)

    expect(getToken).toHaveBeenCalledTimes(1)
  })

  it('refreshes the bearer token after it expires', async () => {
    const { client, getToken } = createClient(0)
    await getAccessToken(client)
    await getAccessToken(client)

    expect(getToken).toHaveBeenCalledTimes(2)
  })

  it('rejects missing credentials when constructing the SDK client', () => {
    vi.stubEnv('SAYARI_CLIENT_SECRET', '')

    expect(() => createSayariClient()).toThrow('SAYARI_CLIENT_ID and SAYARI_CLIENT_SECRET must be configured.')
  })
})
