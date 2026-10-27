import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestJson } from './request'

const response = (ok: boolean, body: unknown) => ({
  ok,
  json: vi.fn<() => Promise<unknown>>().mockResolvedValue(body),
})

describe('requestJson', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the parsed successful response', async () => {
    const body = { value: 'result' }
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: string) => Promise<unknown>>().mockResolvedValue(response(true, body)),
    )

    await expect(requestJson('/api/test')).resolves.toEqual(body)
  })

  it('uses the API error message when a request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<(input: string) => Promise<unknown>>()
        .mockResolvedValue(response(false, { error: { message: 'Specific failure' } })),
    )

    await expect(requestJson('/api/test')).rejects.toThrow('Specific failure')
  })

  it.each([
    { description: 'a missing error message', body: { error: {} } },
    { description: 'malformed error JSON', body: new SyntaxError('Invalid JSON') },
  ])('uses the default fallback for $description', async ({ body }) => {
    const json =
      body instanceof Error
        ? vi.fn<() => Promise<unknown>>().mockRejectedValue(body)
        : vi.fn<() => Promise<unknown>>().mockResolvedValue(body)
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: string) => Promise<unknown>>().mockResolvedValue({ ok: false, json }),
    )

    await expect(requestJson('/api/test')).rejects.toThrow('Unable to load data. Please try again.')
  })

  it('forwards the optional abort signal', async () => {
    const fetch = vi
      .fn<(input: string, init?: RequestInit) => Promise<unknown>>()
      .mockResolvedValue(response(true, {}))
    const controller = new AbortController()
    vi.stubGlobal('fetch', fetch)

    await requestJson('/api/test', controller.signal)

    expect(fetch).toHaveBeenCalledWith('/api/test', { signal: controller.signal })
  })
})
