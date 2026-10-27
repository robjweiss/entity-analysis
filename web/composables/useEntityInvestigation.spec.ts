import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import type { EntityInvestigation } from '@shared/api/entities'
import { useEntityInvestigation } from './useEntityInvestigation'

type Response = { ok: boolean; json: () => Promise<unknown> }
type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
function response(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function investigation(
  id: string,
  nextRelationship?: string,
  nextRecord?: string,
): EntityInvestigation {
  return {
    profile: {
      id,
      label: id,
      type: 'company',
      countries: [],
      sanctioned: false,
      pep: false,
      closed: false,
      identifiers: [],
      names: [],
      addresses: [],
      businessPurposes: [],
      sources: [],
    },
    risks: [],
    relationships: [
      {
        id: 'r1',
        label: 'Initial relation',
        countries: [],
        types: [],
        sanctioned: false,
        pep: false,
      },
    ],
    relationshipCount: 1,
    nextRelationship,
    records: [{ id: 'd1', label: 'Initial record', type: 'filing' }],
    recordCount: 1,
    nextRecord,
  }
}
function host(initialId = 'one') {
  const id = ref(initialId)
  let state!: ReturnType<typeof useEntityInvestigation>
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useEntityInvestigation(id)
        return () => h('div')
      },
    }),
  )
  return { id, state, wrapper }
}
enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('useEntityInvestigation', () => {
  it('loads the selected entity and settles loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(response(investigation('one')))),
    )
    const { state, wrapper } = host()
    await flushPromises()
    expect([state.investigation.value?.profile.id, state.loading.value]).toEqual(['one', false])
    wrapper.unmount()
  })

  it.each(['relationships', 'records'] as const)(
    'does not request %s without an investigation',
    async (kind) => {
      const fetchMock = vi.fn<Fetch>(() => Promise.resolve(response(investigation('one'))))
      vi.stubGlobal('fetch', fetchMock)
      const { state, wrapper } = host('')
      await (kind === 'records' ? state.loadMoreRecords() : state.loadMoreRelationships())
      expect(fetchMock).not.toHaveBeenCalled()
      wrapper.unmount()
    },
  )

  it.each(['relationships', 'records'] as const)(
    'does not request %s when a loaded investigation has no cursor',
    async (kind) => {
      const fetchMock = vi.fn<Fetch>(() => Promise.resolve(response(investigation('one'))))
      vi.stubGlobal('fetch', fetchMock)
      const { state, wrapper } = host()
      await flushPromises()
      await (kind === 'records' ? state.loadMoreRecords() : state.loadMoreRelationships())
      expect(fetchMock).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    },
  )

  it.each(['relationships', 'records'] as const)(
    'appends %s pages, updates count/cursor and ignores duplicate in-flight requests',
    async (kind) => {
      const page = deferred<Response>()
      const fetchMock = vi.fn<Fetch>((input) =>
        String(input).endsWith('/api/entities/one')
          ? Promise.resolve(response(investigation('one', 'rel-next', 'record-next')))
          : page.promise,
      )
      vi.stubGlobal('fetch', fetchMock)
      const { state, wrapper } = host()
      await flushPromises()
      const load = kind === 'records' ? state.loadMoreRecords : state.loadMoreRelationships
      const first = load()
      await load()
      expect(fetchMock).toHaveBeenCalledTimes(2)
      page.resolve(
        response(
          kind === 'records'
            ? {
                records: [{ id: 'd2', label: 'Next record', type: 'report' }],
                recordCount: 9,
                nextRecord: 'record-last',
              }
            : {
                relationships: [
                  {
                    id: 'r2',
                    label: 'Next relation',
                    countries: [],
                    types: [],
                    sanctioned: false,
                    pep: false,
                  },
                ],
                relationshipCount: 8,
                nextRelationship: 'rel-last',
              },
        ),
      )
      await first
      expect(
        kind === 'records'
          ? [
              state.investigation.value?.records.at(-1)?.id,
              state.investigation.value?.recordCount,
              state.investigation.value?.nextRecord,
            ]
          : [
              state.investigation.value?.relationships.at(-1)?.id,
              state.investigation.value?.relationshipCount,
              state.investigation.value?.nextRelationship,
            ],
      ).toEqual(kind === 'records' ? ['d2', 9, 'record-last'] : ['r2', 8, 'rel-last'])
      wrapper.unmount()
    },
  )

  it.each(['relationships', 'records'] as const)(
    'allows retry after %s pagination failure',
    async (kind) => {
      let pageAttempts = 0
      vi.stubGlobal(
        'fetch',
        vi.fn<Fetch>((input) =>
          String(input).endsWith('/api/entities/one')
            ? Promise.resolve(response(investigation('one', 'rel-next', 'record-next')))
            : Promise.resolve(
                ++pageAttempts === 1
                  ? response({ error: { message: 'temporary failure' } }, false)
                  : response(
                      kind === 'records'
                        ? { records: [], recordCount: 1 }
                        : { relationships: [], relationshipCount: 1 },
                    ),
              ),
        ),
      )
      const { state, wrapper } = host()
      await flushPromises()
      const load: () => Promise<void> =
        kind === 'records' ? state.loadMoreRecords : state.loadMoreRelationships
      await load()
      expect(kind === 'records' ? state.recordsError.value : state.relationshipsError.value).toBe(
        'temporary failure',
      )
      await load()
      expect(
        kind === 'records'
          ? [state.recordsError.value, state.investigation.value?.records.length]
          : [state.relationshipsError.value, state.investigation.value?.relationships.length],
      ).toEqual(['', 1])
      wrapper.unmount()
    },
  )

  it.each(['success', 'failure'] as const)(
    'ignores stale investigation %s after switching entities',
    async (outcome) => {
      const first = deferred<Response>()
      const fetchMock = vi.fn<Fetch>((input) =>
        String(input).includes('/one')
          ? first.promise
          : Promise.resolve(response(investigation('two'))),
      )
      vi.stubGlobal('fetch', fetchMock)
      const { id, state, wrapper } = host()
      await flushPromises()
      id.value = 'two'
      await flushPromises()
      if (outcome === 'success') first.resolve(response(investigation('stale')))
      else first.reject(new Error('stale error'))
      await flushPromises()
      expect([state.investigation.value?.profile.id, state.error.value]).toEqual(['two', ''])
      wrapper.unmount()
    },
  )

  it('aborts an outstanding entity request on unmount', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn<Fetch>(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = host()
    const signal = fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal
    wrapper.unmount()
    expect(signal.aborted).toBe(true)
  })

  it.each(['relationships', 'records'] as const)(
    'uses the entity profile id and cursor for %s pages',
    async (kind) => {
      const fetchMock = vi.fn<Fetch>((input) =>
        String(input).endsWith('/one')
          ? Promise.resolve(response(investigation('profile-id', 'rel cursor', 'record cursor')))
          : Promise.resolve(
              response(
                kind === 'records'
                  ? { records: [], recordCount: 1 }
                  : { relationships: [], relationshipCount: 1 },
              ),
            ),
      )
      vi.stubGlobal('fetch', fetchMock)
      const { state, wrapper } = host()
      await flushPromises()
      await (kind === 'records' ? state.loadMoreRecords() : state.loadMoreRelationships())
      expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe(
        kind === 'records'
          ? '/api/entities/profile-id/records?next=record+cursor'
          : '/api/entities/profile-id/relationships?next=rel+cursor',
      )
      wrapper.unmount()
    },
  )

  it.each([
    ['success', 'relationships'],
    ['failure', 'relationships'],
    ['success', 'records'],
    ['failure', 'records'],
  ] as const)(
    'ignores a late %s %s-page response after switching entities',
    async (outcome, kind) => {
      const page = deferred<Response>()
      const fetchMock = vi.fn<Fetch>((input) => {
        const url = String(input)
        if (url.endsWith('/one'))
          return Promise.resolve(response(investigation('one', 'rel', 'record')))
        if (url.includes('/one/')) return page.promise
        return Promise.resolve(response(investigation('two')))
      })
      vi.stubGlobal('fetch', fetchMock)
      const { id, state, wrapper } = host()
      await flushPromises()
      const loading = kind === 'records' ? state.loadMoreRecords() : state.loadMoreRelationships()
      id.value = 'two'
      await flushPromises()
      if (outcome === 'success')
        page.resolve(
          response(
            kind === 'records'
              ? { records: [{ id: 'late', label: 'Late', type: 'filing' }], recordCount: 2 }
              : {
                  relationships: [
                    {
                      id: 'late',
                      label: 'Late',
                      countries: [],
                      types: [],
                      sanctioned: false,
                      pep: false,
                    },
                  ],
                  relationshipCount: 2,
                },
          ),
        )
      else page.reject(new Error('late page failure'))
      await loading
      expect([
        state.investigation.value?.profile.id,
        state.investigation.value?.records.map((record) => record.id),
        state.investigation.value?.relationships.map((relationship) => relationship.id),
        state.recordsError.value,
        state.relationshipsError.value,
      ]).toEqual(['two', ['d1'], ['r1'], '', ''])
      wrapper.unmount()
    },
  )

  it.each([
    ['success', 'relationships'],
    ['failure', 'relationships'],
    ['success', 'records'],
    ['failure', 'records'],
  ] as const)('ignores late %s %s pagination after unmount', async (outcome, kind) => {
    const page = deferred<Response>()
    vi.stubGlobal(
      'fetch',
      vi.fn<Fetch>((input) =>
        String(input).endsWith('/one')
          ? Promise.resolve(response(investigation('one', 'rel', 'record')))
          : page.promise,
      ),
    )
    const { state, wrapper } = host()
    await flushPromises()
    const loading = kind === 'records' ? state.loadMoreRecords() : state.loadMoreRelationships()
    wrapper.unmount()
    if (outcome === 'success')
      page.resolve(
        response(
          kind === 'records'
            ? { records: [{ id: 'late', label: 'Late', type: 'filing' }], recordCount: 99 }
            : {
                relationships: [
                  {
                    id: 'late',
                    label: 'Late',
                    countries: [],
                    types: [],
                    sanctioned: false,
                    pep: false,
                  },
                ],
                relationshipCount: 99,
              },
        ),
      )
    else page.reject(new Error('late failure'))
    await loading
    expect([
      state.investigation.value?.records.map((record) => record.id),
      state.investigation.value?.relationships.map((relationship) => relationship.id),
      state.investigation.value?.recordCount,
      state.investigation.value?.relationshipCount,
      state.recordsError.value,
      state.relationshipsError.value,
    ]).toEqual([['d1'], ['r1'], 1, 1, '', ''])
  })
})
