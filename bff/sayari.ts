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
