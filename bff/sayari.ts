import { SayariClient } from '@sayari/sdk'

export function createSayariClient() {
  const clientId = process.env.SAYARI_CLIENT_ID
  const clientSecret = process.env.SAYARI_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SAYARI_CLIENT_ID and SAYARI_CLIENT_SECRET must be configured.')
  }

  return new SayariClient({ clientId, clientSecret })
}

let client: SayariClient | undefined

export function getSayariClient() {
  client ??= createSayariClient()
  return client
}

const accessTokens = new WeakMap<SayariClient, { value: string; expiresAt: number }>()

export async function getAccessToken(client: SayariClient) {
  const cached = accessTokens.get(client)
  if (cached && Date.now() < cached.expiresAt) return cached.value

  const clientId = process.env.SAYARI_CLIENT_ID
  const clientSecret = process.env.SAYARI_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('SAYARI_CLIENT_ID and SAYARI_CLIENT_SECRET must be configured.')
  }

  const token = await client.auth.getToken({ clientId, clientSecret })
  accessTokens.set(client, {
    value: token.accessToken,
    expiresAt: Date.now() + Math.max(0, token.expiresIn - 60) * 1000,
  })
  return token.accessToken
}
