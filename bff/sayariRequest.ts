import { SayariError } from '@sayari/sdk'

export class UpstreamPayloadError extends Error {}
export class UpstreamTransportError extends Error {}

export async function fetchUpstreamJson<T>(url: URL, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    throw new UpstreamTransportError('Sayari request failed.', { cause: error })
  }
  if (!response.ok) throw new SayariError({ statusCode: response.status })
  try {
    return (await response.json()) as T
  } catch (error) {
    throw new UpstreamPayloadError('Invalid Sayari response.', { cause: error })
  }
}
