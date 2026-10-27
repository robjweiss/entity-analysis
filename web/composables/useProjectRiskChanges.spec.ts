import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { useProjectRiskChanges } from './useProjectRiskChanges'

type Response = { ok: boolean; json: () => Promise<unknown> }
type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
const response = (body: unknown, ok = true): Response => ({ ok, json: () => Promise.resolve(body) })
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function host(initial = 'project') {
  const projectId = ref(initial)
  let state!: ReturnType<typeof useProjectRiskChanges>
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useProjectRiskChanges(projectId)
        return () => h('div')
      },
    }),
  )
  return { projectId, state, wrapper }
}
function changes(count: number, next?: string) {
  return {
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-02-01T00:00:00.000Z',
    hasMore: Boolean(next),
    next,
    changes: Array.from({ length: count }, (_, i) => ({
      projectEntityId: `${i}`,
      factor: 'sanctions',
      changeType: 'added' as const,
      timestamp: '2026-02-01T12:00:00.000Z',
    })),
  }
}
enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('useProjectRiskChanges', () => {
  it('reveals five local results at a time before fetching another page', async () => {
    const fetchMock = vi.fn<Fetch>(() => Promise.resolve(response(changes(12, 'next'))))
    vi.stubGlobal('fetch', fetchMock)
    const { state, wrapper } = host()
    await flushPromises()
    expect(state.visibleChanges.value).toHaveLength(5)
    await state.showMore()
    expect([state.visibleChanges.value.length, fetchMock.mock.calls.length]).toEqual([10, 1])
    wrapper.unmount()
  })

  it('does not request another page when the snapshot has no cursor', async () => {
    const fetchMock = vi.fn<Fetch>(() => Promise.resolve(response(changes(5))))
    vi.stubGlobal('fetch', fetchMock)
    const { state, wrapper } = host()
    await flushPromises()
    await state.showMore()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('requests the next page at the original snapshot and appends its results', async () => {
    const fetchMock = vi.fn<Fetch>((url) =>
      Promise.resolve(
        response(
          String(url).includes('next=')
            ? {
                ...changes(2),
                from: '2026-02-02T00:00:00.000Z',
                to: '2026-02-03T00:00:00.000Z',
              }
            : changes(5, 'next'),
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { state, wrapper } = host()
    await flushPromises()
    await state.showMore()
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      '/api/projects/project/risk-changes?next=next&asOf=2026-02-01T00%3A00%3A00.000Z',
    )
    expect([
      state.changes.value?.from,
      state.changes.value?.to,
      state.changes.value?.changes.length,
    ]).toEqual(['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z', 7])
    wrapper.unmount()
  })

  it('settles a failed next-page request and retries', async () => {
    let pages = 0
    vi.stubGlobal(
      'fetch',
      vi.fn<Fetch>((url) =>
        Promise.resolve(
          String(url).includes('next=') && ++pages === 1
            ? response({ error: { message: 'page failed' } }, false)
            : response(String(url).includes('next=') ? changes(1) : changes(5, 'next')),
        ),
      ),
    )
    const { state, wrapper } = host()
    await flushPromises()
    await state.showMore()
    expect([state.moreError.value, state.changes.value?.changes.length]).toEqual(['page failed', 5])
    await state.showMore()
    expect([state.moreError.value, state.changes.value?.changes.length]).toEqual(['', 6])
    wrapper.unmount()
  })

  it('ignores duplicate next-page requests while one is pending', async () => {
    const page = deferred<Response>()
    const fetchMock = vi.fn<Fetch>((url) =>
      String(url).includes('next=') ? page.promise : Promise.resolve(response(changes(5, 'next'))),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { state, wrapper } = host()
    await flushPromises()
    const first = state.showMore()
    await state.showMore()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    page.resolve(response(changes(1)))
    await first
    wrapper.unmount()
  })

  it.each(['success', 'failure'] as const)(
    'ignores stale next-page %s after switching projects',
    async (outcome) => {
      const page = deferred<Response>()
      const fetchMock = vi.fn<Fetch>((url) =>
        Promise.resolve(response(String(url).includes('/one/') ? changes(5, 'next') : changes(5))),
      )
      vi.stubGlobal('fetch', fetchMock)
      const { projectId, state, wrapper } = host('one')
      await flushPromises()
      // Switch to next-page response controlled by a deferred request.
      fetchMock.mockImplementation((url) =>
        String(url).includes('next=')
          ? page.promise
          : Promise.resolve(response(changes(5, 'next'))),
      )
      const showing = state.showMore()
      projectId.value = 'two'
      await flushPromises()
      if (outcome === 'success') page.resolve(response(changes(1)))
      else page.reject(new Error('late page failure'))
      await showing
      await flushPromises()
      expect([state.changes.value?.changes.length, state.moreError.value]).toEqual([5, ''])
      wrapper.unmount()
    },
  )

  it('does not fetch when no project is selected', async () => {
    const fetchMock = vi.fn<Fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = host('')
    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
