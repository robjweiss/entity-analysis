import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ExecutiveView from './ExecutiveView.vue'

vi.mock('vue-router', () => ({ RouterLink: { template: '<a href="/management"><slot /></a>' } }))

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

  it('requests both endpoints for a newly selected project', async () => {
    const fetchMock = mockApi()
    const wrapper = mount(ExecutiveView)
    await flushPromises()
    await wrapper.get('[data-testid="exposure-project"]').setValue('project-2')
    await flushPromises()

    expect(fetchMock.mock.calls.slice(-2).map(([url]) => url)).toEqual([
      '/api/projects/project-2/exposure',
      '/api/projects/project-2/risk-changes',
    ])
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
