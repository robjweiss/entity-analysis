import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import EntityRiskDetailSheet from './EntityRiskDetailSheet.vue'
import type { EntityPage } from '@shared/api/projects'

const entity: EntityPage['entities'][number] = {
  id: 'entity-1',
  label: 'Example supplier',
  countries: ['JPN'],
  riskCategories: [],
  riskFactors: [],
  riskSeverity: 'critical',
}
const detail = {
  riskFactors: [
    {
      id: 'sanctioned',
      label: 'Sanctioned',
      level: 'critical',
      riskCategories: [],
      sourceEntityIds: [],
      networkPaths: [],
    },
  ],
  riskChanges: [{ id: 'sanctioned', timestamp: '2026-10-20', changeType: 'added' }],
}
type FetchResponse = { ok: boolean; json: () => Promise<object> }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function mockDetail(response: FetchResponse = { ok: true, json: () => Promise.resolve(detail) }) {
  const fetchMock = vi.fn<(input: string) => Promise<FetchResponse>>(() =>
    Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('EntityRiskDetailSheet', () => {
  it('loads details when mounted initially open', async () => {
    const fetchMock = mockDetail()
    mount(EntityRiskDetailSheet, { props: { projectId: 'project-1', entity, open: true } })
    await flushPromises()

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/projects/project-1/entities/entity-1')
  })

  it('shows loading while the detail request is pending', async () => {
    const pending = deferred<FetchResponse>()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => pending.promise),
    )
    mount(EntityRiskDetailSheet, {
      props: { projectId: 'project-1', entity, open: true },
    })
    await flushPromises()

    expect(document.body.querySelector('[role="dialog"] [role="status"]')?.textContent).toContain(
      'Loading risk details',
    )
  })

  it('aborts a pending detail request when the sheet closes', async () => {
    const pending = deferred<FetchResponse>()
    const fetchMock = vi.fn<
      (input: string, init?: { signal?: AbortSignal }) => Promise<FetchResponse>
    >(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(EntityRiskDetailSheet, {
      props: { projectId: 'project-1', entity, open: true },
    })
    await flushPromises()
    const signal = fetchMock.mock.calls[0]?.[1]?.signal

    await wrapper.setProps({ open: false })

    expect(signal?.aborted).toBe(true)
  })

  it('emits a closed model value when the sheet close control is clicked', async () => {
    mockDetail()
    const wrapper = mount(EntityRiskDetailSheet, {
      props: { projectId: 'project-1', entity, open: false },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })
    await flushPromises()
    document.body.querySelector<HTMLButtonElement>('[data-slot="sheet-close"]')!.click()
    await flushPromises()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('aborts a pending detail request when the sheet unmounts', async () => {
    const pending = deferred<FetchResponse>()
    const fetchMock = vi.fn<
      (input: string, init?: { signal?: AbortSignal }) => Promise<FetchResponse>
    >(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(EntityRiskDetailSheet, {
      props: { projectId: 'project-1', entity, open: true },
    })
    await flushPromises()
    const signal = fetchMock.mock.calls[0]?.[1]?.signal

    wrapper.unmount()

    expect(signal?.aborted).toBe(true)
  })

  it.each([
    { outcome: 'success', ok: true },
    { outcome: 'failure', ok: false },
  ])('ignores a stale detail $outcome after close and reopen', async ({ ok }) => {
    const first = deferred<FetchResponse>()
    const latestDetail = {
      riskFactors: [{ ...detail.riskFactors[0], id: 'current', label: 'Current response' }],
      riskChanges: [],
    }
    const responses = [
      first.promise,
      Promise.resolve({ ok: true, json: () => Promise.resolve(latestDetail) }),
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(() => responses.shift()!),
    )
    const wrapper = mount(EntityRiskDetailSheet, {
      props: { projectId: 'project-1', entity, open: true },
    })
    await flushPromises()
    await wrapper.setProps({ open: false })
    await flushPromises()
    await wrapper.setProps({ open: true })
    await flushPromises()

    first.resolve({
      ok,
      json: () => Promise.resolve(ok ? detail : { error: { message: 'Stale failure.' } }),
    })
    await flushPromises()

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.textContent).toContain('Current response')
    expect(dialog?.textContent).not.toContain('Sanctioned')
    expect(dialog?.textContent).not.toContain('Stale failure.')
  })

  it('shows the request error when the detail request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: string) => Promise<FetchResponse>>(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Detail unavailable.' } }),
        }),
      ),
    )
    mount(EntityRiskDetailSheet, { props: { projectId: 'project-1', entity, open: true } })
    await flushPromises()

    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'Detail unavailable.',
    )
  })

  it('shows the empty state returned by the BFF', async () => {
    mockDetail({ ok: true, json: () => Promise.resolve({ riskFactors: [], riskChanges: [] }) })
    mount(EntityRiskDetailSheet, { props: { projectId: 'project-1', entity, open: true } })
    await flushPromises()

    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'No recorded risk factors.',
    )
  })

  it('shows an empty state when the BFF has no recorded risk changes', async () => {
    mockDetail({
      ok: true,
      json: () => Promise.resolve({ riskFactors: detail.riskFactors, riskChanges: [] }),
    })
    mount(EntityRiskDetailSheet, { props: { projectId: 'project-1', entity, open: true } })
    await flushPromises()

    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'No recorded risk changes.',
    )
  })

  it('requests detail for the replacement entity and project', async () => {
    const fetchMock = mockDetail()
    const wrapper = mount(EntityRiskDetailSheet, {
      props: { projectId: 'project-1', entity, open: true },
    })
    await flushPromises()
    await wrapper.setProps({
      projectId: 'project-2',
      entity: { ...entity, id: 'entity-2', label: 'Replacement supplier' },
    })
    await flushPromises()

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects/project-2/entities/entity-2')
  })
})
