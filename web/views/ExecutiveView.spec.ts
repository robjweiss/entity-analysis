import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ExecutiveView from './ExecutiveView.vue'

const projects = {
  projects: [
    { id: 'project-1', label: 'Supplier review' },
    { id: 'project-2', label: 'Other unit' },
  ],
}
const eq = (count: number) => ({ count, qualifier: 'eq' })
const exposure = {
  total: eq(10),
  categories: { sanctions: eq(4), forcedLabor: eq(3), exportControls: eq(2), adverseMedia: eq(1) },
}
const changes = {
  from: '2026-10-18T12:00:00.000Z',
  to: '2026-10-25T12:00:00.000Z',
  hasMore: true,
  changes: [
    {
      projectEntityId: 'one',
      entityName: 'Example supplier',
      factor: 'forced_labor',
      changeType: 'added',
      timestamp: '2026-10-24T00:00:00Z',
    },
    {
      projectEntityId: 'two',
      factor: 'pep',
      changeType: 'removed',
      timestamp: '2026-10-23T00:00:00Z',
    },
  ],
}

function mockApi(
  options: {
    projects?: object
    exposure?: object
    changes?: object
    nextChanges?: object
    nextError?: boolean
    error?: string
  } = {},
) {
  const fetchMock = vi.fn<(input: string) => Promise<{ ok: boolean; json: () => Promise<object> }>>(
    (input) => {
      const endpoint = input.includes('/exposure')
        ? 'exposure'
        : input.includes('/risk-changes')
          ? 'changes'
          : 'projects'
      if (options.error === endpoint) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: `${endpoint} failed` } }),
        })
      }
      if (endpoint === 'changes' && input.includes('?next=') && options.nextError) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Unable to load more changes.' } }),
        })
      }
      const data =
        endpoint === 'changes' && input.includes('?next=')
          ? (options.nextChanges ?? options.changes ?? changes)
          : (options[endpoint] ?? { projects, exposure, changes }[endpoint])
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('ExecutiveView', () => {
  it('does not show the follow-up panel for a selected project', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Follow up')
  })

  it('shows the whole-project scope without implying supplier confirmation', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[data-testid="project-total"]').text()).toBe('Project entities: 10')
  })

  it.each([
    ['sanctions', 4],
    ['forcedLabor', 3],
    ['exportControls', 2],
    ['adverseMedia', 1],
  ])('shows the %s theme against the same whole-project denominator', async (key, count) => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get(`[data-testid="theme-${key}"]`).text()).toContain(
      `${count} of 10 project entities`,
    )
  })

  it('renders a shadcn progress bar for an exact category and total', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(
      wrapper
        .get('[data-testid="theme-sanctions"] [role="progressbar"]')
        .attributes('aria-valuenow'),
    ).toBe('40')
  })

  it('shows the exact proportion in a badge beside the risk theme', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[data-testid="theme-sanctions"] [data-slot="badge"]').text()).toBe('40%')
  })

  it('explains overlapping and non-exhaustive themes', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Categories overlap; these four themes are not an exhaustive breakdown.',
    )
  })

  it.each(['total', 'sanctions'] as const)(
    'omits bars when the %s count is inexact',
    async (key) => {
      mockApi({
        exposure: {
          ...exposure,
          ...(key === 'total'
            ? { total: { count: 10, qualifier: 'gte' } }
            : {
                categories: { ...exposure.categories, sanctions: { count: 4, qualifier: 'gte' } },
              }),
        },
      })
      const wrapper = mount(ExecutiveView)
      await flushPromises()

      expect(wrapper.find('[data-testid="theme-sanctions"] [role="progressbar"]').exists()).toBe(
        false,
      )
    },
  )

  it('omits the percentage badge when a count is inexact', async () => {
    mockApi({ exposure: { ...exposure, total: { count: 10, qualifier: 'gte' } } })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.find('[data-testid="theme-sanctions"] [data-slot="badge"]').exists()).toBe(false)
  })

  it('does not divide by zero when a project has no entities', async () => {
    mockApi({
      exposure: {
        total: eq(0),
        categories: Object.fromEntries(Object.keys(exposure.categories).map((key) => [key, eq(0)])),
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[data-testid="theme-sanctions"]').text()).toContain(
      'No project entities to compare.',
    )
  })

  it.each([
    { count: 10, total: 10, expected: '100%' },
    { count: 0, total: 10, expected: '0%' },
    { count: 1, total: 10000, expected: '<0.1%' },
    { count: 20, total: 10, expected: '100%' },
  ])('formats exact theme proportions ($count/$total)', async ({ count, total, expected }) => {
    mockApi({
      exposure: {
        ...exposure,
        total: eq(total),
        categories: { ...exposure.categories, sanctions: eq(count) },
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[data-testid="theme-sanctions"] [data-slot="badge"]').text()).toBe(expected)
  })

  it('keeps risk changes visible when exposure fails', async () => {
    mockApi({ error: 'exposure' })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[aria-label="Recent risk changes"]').text()).toContain('Example supplier')
  })

  it('keeps exposure visible when risk changes fail', async () => {
    mockApi({ error: 'changes' })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[data-testid="project-total"]').text()).toBe('Project entities: 10')
  })

  it('shows the entity name when available for a change', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.get('[aria-labelledby="changes-title"] li .font-medium').text()).toBe(
      'Example supplier',
    )
  })

  it('labels removal as a risk signal change rather than the removal of an entity', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(
      wrapper.findAll('[data-slot="badge"]').some((badge) => badge.text() === 'Signal removed'),
    ).toBe(true)
  })

  it('prefers the official Sayari label to a formatted risk-factor identifier', async () => {
    mockApi({
      changes: {
        ...changes,
        changes: [
          {
            ...changes.changes[0],
            factorLabel: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
          },
        ],
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).toContain('Product-relevant Supplier Network with Xinjiang-Based Entity')
  })

  it('shows only five recent changes initially even when Sayari returns more factors', async () => {
    mockApi({
      changes: {
        ...changes,
        changes: Array.from({ length: 9 }, (_, i) => ({
          ...changes.changes[0],
          factor: `factor_${i}`,
        })),
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.findAll('[aria-label="Recent risk changes"] li')).toHaveLength(5)
  })

  it('reveals five more already-loaded changes without another API request', async () => {
    const fetchMock = mockApi({
      changes: {
        ...changes,
        changes: Array.from({ length: 9 }, (_, i) => ({
          ...changes.changes[0],
          factor: `factor_${i}`,
        })),
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show more changes')!
      .trigger('click')

    expect({
      visible: wrapper.findAll('[aria-label="Recent risk changes"] li').length,
      requests: fetchMock.mock.calls.length,
    }).toEqual({ visible: 9, requests: 3 })
  })

  it('loads the next Sayari page when all locally loaded changes have been revealed', async () => {
    const fetchMock = mockApi({
      changes: { ...changes, next: 'upstream-next' },
      nextChanges: {
        ...changes,
        changes: [{ ...changes.changes[0], factor: 'next_page_factor' }],
        next: undefined,
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show more changes')!
      .trigger('click')
    await flushPromises()

    expect(
      Object.fromEntries(
        new URL(fetchMock.mock.calls.at(-1)?.[0] ?? '', 'http://localhost').searchParams,
      ),
    ).toEqual({
      next: 'upstream-next',
      asOf: '2026-10-25T12:00:00.000Z',
    })
  })

  it('appends a newly fetched page to the visible changes', async () => {
    mockApi({
      changes: { ...changes, next: 'upstream-next' },
      nextChanges: {
        ...changes,
        changes: [{ ...changes.changes[0], factor: 'new_signal' }],
        next: undefined,
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show more changes')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="Recent risk changes"]').text()).toContain('new signal')
  })

  it('keeps visible changes when loading the next page fails', async () => {
    mockApi({ changes: { ...changes, next: 'upstream-next' }, nextError: true })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show more changes')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load more changes.')
  })

  it('retains existing changes and retries a failed next page', async () => {
    const fetchMock = mockApi({
      changes: { ...changes, next: 'upstream-next' },
      nextError: true,
      nextChanges: { ...changes, changes: [{ ...changes.changes[0], factor: 'retried' }] },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    fetchMock.mockImplementation((input) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            input.includes('?next=')
              ? { ...changes, changes: [{ ...changes.changes[0], factor: 'retried' }] }
              : { projects, exposure, changes },
          ),
      }),
    )
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="Recent risk changes"]').text()).toContain('retried')
  })

  it('keeps the original snapshot across multiple page transitions', async () => {
    const fetchMock = mockApi({
      changes: { ...changes, next: 'page-one' },
      nextChanges: {
        ...changes,
        next: 'page-two',
        changes: [{ ...changes.changes[0], factor: 'page_one' }],
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(
      new URL(fetchMock.mock.calls.at(-1)?.[0] ?? '', 'http://localhost').searchParams.get('asOf'),
    ).toBe(changes.to)
  })

  it.each(['success', 'failure'] as const)(
    'ignores a stale initial %s after switching projects',
    async (outcome) => {
      let resolveOld!: (response: { ok: boolean; json: () => Promise<object> }) => void
      const fetchMock = vi.fn<
        (input: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<object> }>
      >((input) => {
        if (input.includes('/risk-changes') && input.includes('project-1'))
          return new Promise((resolve) => {
            resolveOld = resolve
          })
        if (input.includes('/risk-changes'))
          return Promise.resolve({ ok: true, json: () => Promise.resolve(changes) })
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(input.includes('/exposure') ? exposure : projects),
        })
      })
      vi.stubGlobal('fetch', fetchMock)
      const wrapper = mount(ExecutiveView)
      await flushPromises()
      await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')
      await flushPromises()
      resolveOld(
        outcome === 'success'
          ? {
              ok: true,
              json: () =>
                Promise.resolve({
                  ...changes,
                  changes: [{ ...changes.changes[0], entityName: 'Stale result' }],
                }),
            }
          : { ok: false, json: () => Promise.resolve({ error: { message: 'Stale failure' } }) },
      )
      await flushPromises()

      expect(wrapper.get('[aria-label="Recent risk changes"]').text()).not.toContain('Stale')
    },
  )

  it.each(['switch', 'unmount'] as const)('aborts a pending initial feed on %s', async (action) => {
    let initialSignal: AbortSignal | undefined
    const fetchMock = vi.fn<
      (
        input: string,
        init?: { signal?: AbortSignal },
      ) => Promise<{ ok: boolean; json: () => Promise<object> }>
    >((input, init) => {
      if (input.includes('/risk-changes')) {
        initialSignal ??= init?.signal
        return new Promise(() => undefined)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(input.includes('/exposure') ? exposure : projects),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    if (action === 'switch')
      await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')
    else wrapper.unmount()
    await flushPromises()

    expect(initialSignal?.aborted).toBe(true)
  })

  it.each([
    { action: 'switch', outcome: 'success' },
    { action: 'switch', outcome: 'failure' },
    { action: 'unmount', outcome: 'success' },
    { action: 'unmount', outcome: 'failure' },
  ] as const)(
    'aborts a pending page on $action and ignores stale $outcome',
    async ({ action, outcome }) => {
      let pageSignal: AbortSignal | undefined
      let resolvePage!: (response: { ok: boolean; json: () => Promise<object> }) => void
      const fetchMock = vi.fn<
        (
          input: string,
          init?: { signal?: AbortSignal },
        ) => Promise<{ ok: boolean; json: () => Promise<object> }>
      >((input, init) => {
        if (input.includes('?next=')) {
          pageSignal = init?.signal
          return new Promise((resolve) => {
            resolvePage = resolve
          })
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              input.includes('/exposure')
                ? exposure
                : input.includes('/risk-changes')
                  ? { ...changes, next: 'cursor' }
                  : projects,
            ),
        })
      })
      vi.stubGlobal('fetch', fetchMock)
      const wrapper = mount(ExecutiveView)
      await flushPromises()
      await wrapper.find('button').trigger('click')
      if (action === 'switch')
        await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')
      else wrapper.unmount()
      await flushPromises()
      resolvePage(
        outcome === 'success'
          ? {
              ok: true,
              json: () =>
                Promise.resolve({
                  ...changes,
                  changes: [{ ...changes.changes[0], entityName: 'Stale page' }],
                }),
            }
          : {
              ok: false,
              json: () => Promise.resolve({ error: { message: 'Stale page failure' } }),
            },
      )
      await flushPromises()

      expect(pageSignal?.aborted).toBe(true)
      const staleState =
        action === 'switch'
          ? {
              changes: wrapper.get('[aria-label="Recent risk changes"]').text().includes('Stale'),
              error: wrapper
                .findAll('[role="alert"]')
                .some((alert) => alert.text().includes('Stale')),
            }
          : { changes: false, error: false }
      expect(staleState).toEqual({ changes: false, error: false })
    },
  )

  it('resets revealed changes when a different project is selected', async () => {
    mockApi({
      changes: {
        ...changes,
        changes: Array.from({ length: 9 }, (_, i) => ({
          ...changes.changes[0],
          factor: `factor_${i}`,
        })),
      },
    })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show more changes')!
      .trigger('click')
    await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')
    await flushPromises()

    expect(wrapper.findAll('[aria-label="Recent risk changes"] li')).toHaveLength(5)
  })

  it('uses the project entity identifier when no name is available', async () => {
    mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).toContain('Project entity two')
  })

  it('shows a truthful empty state for changes', async () => {
    mockApi({ changes: { ...changes, changes: [], hasMore: false } })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).toContain('No risk changes returned for this period.')
  })

  it('reports an empty page when a next-page cursor remains', async () => {
    mockApi({ changes: { ...changes, changes: [], next: 'next-page' } })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).toContain('No risk changes returned on this page.')
  })

  it('clears the empty-page state while a newly selected project is loading', async () => {
    let resolveSecond!: (response: { ok: boolean; json: () => Promise<object> }) => void
    const fetchMock = vi.fn<
      (input: string) => Promise<{ ok: boolean; json: () => Promise<object> }>
    >((input) => {
      if (input.includes('/risk-changes') && input.includes('project-2'))
        return new Promise((resolve) => {
          resolveSecond = resolve
        })
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            input.includes('/risk-changes')
              ? { ...changes, changes: [], next: undefined }
              : input.includes('/exposure')
                ? exposure
                : projects,
          ),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')

    expect(wrapper.get('[aria-labelledby="changes-title"]').text()).not.toContain(
      'No risk changes returned',
    )

    resolveSecond({ ok: true, json: () => Promise.resolve({ ...changes, changes: [] }) })
    await flushPromises()
  })

  it('requests both endpoints for a newly selected project', async () => {
    const fetchMock = mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')
    await flushPromises()

    expect(
      fetchMock.mock.calls
        .slice(-2)
        .map(([url]) => url)
        .sort(),
    ).toEqual(['/api/projects/project-2/exposure', '/api/projects/project-2/risk-changes'].sort())
  })

  it('supports paginating the project selector', async () => {
    const fetchMock = mockApi({ projects: { ...projects, next: 'cursor' } })
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next projects')!
      .trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.some(([url]) => url === '/api/projects?next=cursor')).toBe(true)
  })

  it('selects the first project returned on a newly loaded page', async () => {
    const fetchMock = mockApi({
      projects: { ...projects, next: 'cursor' },
    })
    const originalFetch = fetchMock.getMockImplementation()!
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    fetchMock.mockImplementation((input) =>
      input.includes('?next=')
        ? Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [{ id: 'project-3', label: 'Next project' }] }),
          })
        : originalFetch(input),
    )
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next projects')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="exposure-project"]').element).toHaveProperty(
      'value',
      'project-3',
    )
  })

  it.each(['projects', 'exposure', 'changes'])(
    'reports a %s API error without presenting an empty state',
    async (error) => {
      mockApi({ error })
      const wrapper = mount(ExecutiveView)
      await flushPromises()

      expect(
        wrapper.findAll('[role="alert"]').some((alert) => alert.text() === `${error} failed`),
      ).toBe(true)
    },
  )

  it('shows a loading state while project data is pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<() => Promise<never>>(() => new Promise(() => undefined)),
    )
    const wrapper = mount(ExecutiveView)

    expect(wrapper.get('[role="status"]').text()).toBe('Loading projects…')
  })

  it('shows the no-projects state', async () => {
    mockApi({ projects: { projects: [] } })
    const wrapper = mount(ExecutiveView)
    await flushPromises()

    expect(wrapper.text()).toContain('No projects available on this page.')
  })
})
