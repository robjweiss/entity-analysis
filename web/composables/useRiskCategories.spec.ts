import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { useRiskCategories } from './useRiskCategories'

afterEach(() => vi.unstubAllGlobals())

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function mountComposable() {
  let state!: ReturnType<typeof useRiskCategories>
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useRiskCategories()
        return () => h('div')
      },
    }),
  )
  return { wrapper, state }
}

describe('useRiskCategories', () => {
  it('exposes loading until the options request resolves', async () => {
    const pending = deferred<{ ok: boolean; json: () => Promise<object> }>()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => pending.promise),
    )
    const { wrapper, state } = mountComposable()
    await flushPromises()

    expect(state.riskCategoriesLoading.value).toBe(true)

    pending.resolve({
      ok: true,
      json: () => Promise.resolve({ categories: [{ id: 'sanctions', label: 'Sanctions' }] }),
    })
    await flushPromises()

    expect(state.riskCategories.value).toEqual([{ id: 'sanctions', label: 'Sanctions' }])
    wrapper.unmount()
  })

  it('settles with an empty option list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ categories: [] }) })),
    )
    const { wrapper, state } = mountComposable()
    await flushPromises()

    expect(state.riskCategoriesLoading.value).toBe(false)
    expect(state.riskCategories.value).toEqual([])
    wrapper.unmount()
  })

  it('exposes request errors and supports retry', async () => {
    let attempts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        attempts += 1
        return Promise.resolve(
          attempts === 1
            ? {
                ok: false,
                json: () => Promise.resolve({ error: { message: 'Categories unavailable.' } }),
              }
            : {
                ok: true,
                json: () =>
                  Promise.resolve({ categories: [{ id: 'sanctions', label: 'Sanctions' }] }),
              },
        )
      }),
    )
    const { wrapper, state } = mountComposable()
    await flushPromises()

    expect(state.riskCategoriesError.value).toBe('Categories unavailable.')

    await state.loadRiskCategories()

    expect(state.riskCategories.value).toEqual([{ id: 'sanctions', label: 'Sanctions' }])
    wrapper.unmount()
  })

  it('aborts the in-flight request when the composable host unmounts', async () => {
    const pending = deferred<{ ok: boolean; json: () => Promise<object> }>()
    const fetchMock = vi.fn<
      (_input: string, _init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<object> }>
    >(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = mountComposable()
    await flushPromises()
    const signal = fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal | undefined

    wrapper.unmount()

    expect(signal?.aborted).toBe(true)
  })
})
