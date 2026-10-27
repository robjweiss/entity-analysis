import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { useProjectEntities } from './useProjectEntities'

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
  let state!: ReturnType<typeof useProjectEntities>
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useProjectEntities(projectId)
        return () => h('div')
      },
    }),
  )
  return { projectId, state, wrapper }
}
enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('useProjectEntities', () => {
  it('does not fetch without a selected project', async () => {
    const fetchMock = vi.fn<Fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = host('')
    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('requests a page cursor then resets pagination and normalizes filters when applying filters', async () => {
    const fetchMock = vi.fn<Fetch>(() => Promise.resolve(response({ entities: [] })))
    vi.stubGlobal('fetch', fetchMock)
    const { state, wrapper } = host()
    await flushPromises()
    state.changePage({ next: 'cursor' })
    await flushPromises()
    state.applyFilters({ name: '  Acme  ', country: '', riskCategory: '' })
    await flushPromises()
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects/project/entities?name=Acme')
    wrapper.unmount()
  })

  it.each(['success', 'failure'] as const)(
    'ignores stale %s when switching projects',
    async (outcome) => {
      const first = deferred<Response>()
      vi.stubGlobal(
        'fetch',
        vi.fn<Fetch>((url) =>
          String(url).includes('/one/')
            ? first.promise
            : Promise.resolve(
                response({
                  entities: [
                    {
                      id: 'current',
                      label: 'Current',
                      countries: [],
                      riskCategories: [],
                      riskFactors: [],
                    },
                  ],
                }),
              ),
        ),
      )
      const { projectId, state, wrapper } = host('one')
      await flushPromises()
      projectId.value = 'two'
      await flushPromises()
      if (outcome === 'success')
        first.resolve(
          response({
            entities: [
              { id: 'stale', label: 'Stale', countries: [], riskCategories: [], riskFactors: [] },
            ],
          }),
        )
      else first.reject(new Error('stale failure'))
      await flushPromises()
      expect([state.entityPage.value?.entities[0]?.id, state.entityError.value]).toEqual([
        'current',
        '',
      ])
      wrapper.unmount()
    },
  )

  it('aborts the active list request on unmount', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn<Fetch>(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = host()
    const signal = fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal
    wrapper.unmount()
    expect(signal.aborted).toBe(true)
  })

  it('resets a non-empty cursor when switching projects', async () => {
    const fetchMock = vi.fn<Fetch>(() => Promise.resolve(response({ entities: [] })))
    vi.stubGlobal('fetch', fetchMock)
    const { projectId, state, wrapper } = host('one')
    await flushPromises()
    state.changePage({ next: 'cursor' })
    await flushPromises()
    projectId.value = 'two'
    await flushPromises()
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe('/api/projects/two/entities')
    wrapper.unmount()
  })

  it('clears the initial request error after a successful project change', async () => {
    let attempts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn<Fetch>(() =>
        Promise.resolve(
          ++attempts === 1
            ? response({ error: { message: 'Project unavailable' } }, false)
            : response({ entities: [] }),
        ),
      ),
    )
    const { projectId, state, wrapper } = host('one')
    await flushPromises()
    expect(state.entityError.value).toBe('Project unavailable')
    projectId.value = 'two'
    await flushPromises()
    expect([state.entityError.value, state.entityLoading.value]).toEqual(['', false])
    wrapper.unmount()
  })
})
