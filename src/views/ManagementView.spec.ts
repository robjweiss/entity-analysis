import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ManagementView from './ManagementView.vue'

const projects = { projects: [{ id: 'project-1', label: 'Supplier review' }] }
const entity = {
  id: 'entity-1',
  label: 'Example supplier',
  countries: ['JPN'],
  riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
  riskFactors: [{ id: 'sanctioned', label: 'Sanctioned' }],
  riskSeverity: 'critical',
}
const entities = { entities: [entity] }
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

function mockApi(entityPage: object = entities, projectData: object = projects) {
  const fetchMock = vi.fn<(input: string) => Promise<{ ok: boolean; json: () => Promise<object> }>>(
    (input) => {
      const data = input.includes('/entities/')
        ? detail
        : input.includes('/entities')
          ? entityPage
          : projectData
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('ManagementView', () => {
  it('loads the first project and its entities', async () => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[data-testid="priority-queue-count"]').text()).toBe('1 entity on this page')
  })

  it('keeps the project selector as a native select control', async () => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[data-testid="priority-queue-project"]').element.tagName).toBe('SELECT')
  })

  it('names the risk breakdown table with a caption', async () => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('table caption').text()).toBe('Risk breakdown entities')
  })

  it.each([
    { name: 'entity', text: 'Entity' },
    { name: 'risk severity', text: 'Risk severity' },
    { name: 'risk categories', text: 'Risk categories' },
    { name: 'risk factors', text: 'Risk factors' },
  ])('scopes the $name table header to its column', async ({ text }) => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.findAll('th[scope="col"]').some((header) => header.text() === text)).toBe(true)
  })

  it('renders the entity maximum risk severity', async () => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[data-testid="priority-queue-entity-entity-1"]').text()).toContain(
      'Critical',
    )
  })

  it('renders human-readable risk factors in the entity list', async () => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[data-testid="priority-queue-risk-factors"]').text()).toContain(
      'Sanctioned',
    )
  })

  it('summarizes risk factors beyond the first two', async () => {
    mockApi({
      entities: [
        {
          ...entity,
          riskFactors: [
            { id: 'sanctioned', label: 'Sanctioned' },
            { id: 'export_controls', label: 'Export controls' },
            { id: 'forced_labor', label: 'Forced labor' },
          ],
        },
      ],
    })
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[data-testid="priority-queue-risk-factors"]').text()).toContain('+1 more')
  })

  it('keeps country codes out of the entity list', async () => {
    mockApi({
      entities: [{ ...entity, countries: ['JPN', 'USA'] }],
    })
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[data-testid="priority-queue-entity-entity-1"]').text()).not.toMatch(
      /JPN|USA/,
    )
  })

  it('keeps all country codes in the entity detail sheet', async () => {
    mockApi({
      entities: [{ ...entity, countries: ['JPN', 'USA'] }],
    })
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper
      .get('button[aria-label="Review risk details for Example supplier"]')
      .trigger('click')

    expect(document.body.textContent).toContain('JPN, USA')
  })

  it.each([
    { field: 'priority-queue-search', value: ' supplier ', query: 'name=supplier' },
    { field: 'priority-queue-country-filter', value: 'jpn', query: 'country=JPN' },
    {
      field: 'priority-queue-category-filter',
      value: 'sanctions',
      query: 'riskCategory=sanctions',
    },
  ])('sends $field to the BFF', async ({ field, value, query }) => {
    const fetchMock = mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper.get(`[data-testid="${field}"]`).setValue(value)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(fetchMock.mock.calls.some(([url]) => url.includes(query))).toBe(true)
  })

  it('clears applied filters on the server', async () => {
    const fetchMock = mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()
    await wrapper.get('[data-testid="priority-queue-search"]').setValue('supplier')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    await wrapper.get('button[type="button"]').trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects/project-1/entities')
  })

  it('requests the next page with a BFF cursor', async () => {
    const fetchMock = mockApi({ ...entities, next: 'next-page' })
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next entities')!
      .trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects/project-1/entities?next=next-page')
  })

  it('loads entities from the selected project', async () => {
    const fetchMock = mockApi(entities, {
      projects: [
        { id: 'project-1', label: 'Supplier review' },
        { id: 'project-2', label: 'Second project' },
      ],
    })
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper.get('[data-testid="priority-queue-project"]').setValue('project-2')
    await flushPromises()

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects/project-2/entities')
  })

  it('loads another page of projects with its cursor', async () => {
    const fetchMock = mockApi(entities, { ...projects, next: 'next-project' })
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next projects')!
      .trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.some(([url]) => url === '/api/projects?next=next-project')).toBe(
      true,
    )
  })

  it('fetches risk details when an entity opens', async () => {
    const fetchMock = mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper
      .get('button[aria-label="Review risk details for Example supplier"]')
      .trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects/project-1/entities/entity-1')
  })

  it('renders the fetched factor level as a severity badge in the detail sheet', async () => {
    mockApi()
    const wrapper = mount(ManagementView)
    await flushPromises()

    await wrapper
      .get('button[aria-label="Review risk details for Example supplier"]')
      .trigger('click')
    await flushPromises()

    expect(document.body.querySelector('[data-testid="risk-factor-level"]')?.textContent).toBe(
      'Critical',
    )
  })

  it('shows the empty state returned by the BFF', async () => {
    mockApi({ entities: [] })
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.text()).toContain('No entities match these filters.')
  })

  it('shows a server error instead of an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) =>
        Promise.resolve(
          input.includes('/entities')
            ? {
                ok: false,
                json: () =>
                  Promise.resolve({ error: { message: 'Unable to load project entities.' } }),
              }
            : { ok: true, json: () => Promise.resolve(projects) },
        ),
      ),
    )
    const wrapper = mount(ManagementView)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load project entities.')
  })
})
