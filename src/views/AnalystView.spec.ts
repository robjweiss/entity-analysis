import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AnalystView from './AnalystView.vue'

type MockResponse = { ok: boolean; json: () => Promise<unknown> }

const investigation = {
  profile: {
    id: 'entity-1',
    label: 'Example Supplier',
    type: 'company',
    countries: ['JPN'],
    sanctioned: true,
    pep: false,
    closed: false,
    identifiers: [],
    names: [],
    addresses: [],
    businessPurposes: [],
    sources: [],
  },
  risks: [
    {
      id: 'sanctioned',
      label: 'Sanctioned',
      level: 'critical',
      description: 'A risk signal.',
      value: 'Present',
    },
    {
      id: 'export_controls',
      label: 'Export controls',
      level: 'high',
      description: 'A numeric risk signal.',
      value: '5',
    },
  ],
  relationships: [
    {
      id: 'related-1',
      label: 'First Related Entity',
      countries: ['JPN'],
      types: ['Has Director'],
      sanctioned: false,
      pep: false,
    },
  ],
  relationshipCount: 11,
  nextRelationship: 'next-token',
  records: [],
  recordCount: 12,
  nextRecord: 'record-next-token',
}

afterEach(() => vi.unstubAllGlobals())

describe('AnalystView', () => {
  it('shows the project and entity selectors', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ projects: [] }) }),
    )
    const wrapper = mount(AnalystView)
    expect(wrapper.get('[data-testid="investigation-project"]')).toBeTruthy()
    expect(wrapper.get('[data-testid="investigation-project-entity"]')).toBeTruthy()
  })

  it.each(['investigation-project', 'investigation-project-entity', 'investigation-entity'])(
    'uses a native select for %s',
    (testId) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ projects: [] }) }),
      )
      const wrapper = mount(AnalystView)

      expect(wrapper.get(`[data-testid="${testId}"]`).element.tagName).toBe('SELECT')
    },
  )

  it('loads project entities before requesting the selected Sayari entity', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<MockResponse>>((input) => {
      if (input === '/api/projects')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
        })
      if (input === '/api/projects/project-1/entities')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              entities: [
                {
                  id: 'project-entity-1',
                  label: 'Input supplier',
                  countries: [],
                  riskCategories: [],
                  riskFactors: [],
                  matches: [{ id: 'entity-1', label: 'Example Supplier' }],
                },
              ],
            }),
        })
      return Promise.resolve({ ok: true, json: () => Promise.resolve(investigation) })
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(AnalystView)
    await flushPromises()

    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.get('[data-testid="entity-label"]').text()).toBe('Example Supplier')
  })

  it('shows the returned API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input === '/api/projects')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
          })
        if (input === '/api/projects/project-1/entities')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                entities: [
                  {
                    id: 'project-entity-1',
                    label: 'Input supplier',
                    countries: [],
                    riskCategories: [],
                    riskFactors: [],
                    matches: [{ id: 'missing', label: 'Missing supplier' }],
                  },
                ],
              }),
          })
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Entity was not found.' } }),
        })
      }),
    )
    const wrapper = mount(AnalystView)
    await flushPromises()

    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('missing')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Entity was not found.')
  })

  it('loads and appends more related entities when requested', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<MockResponse>>((input) => {
      if (input === '/api/projects')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
        })
      if (input === '/api/projects/project-1/entities')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              entities: [
                {
                  id: 'project-entity-1',
                  label: 'Input supplier',
                  countries: [],
                  riskCategories: [],
                  riskFactors: [],
                  matches: [{ id: 'entity-1', label: 'Example Supplier' }],
                },
              ],
            }),
        })
      if (input === '/api/entities/entity-1')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(structuredClone(investigation)),
        })
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            relationships: [
              {
                id: 'related-2',
                label: 'Second Related Entity',
                countries: ['USA'],
                types: ['Has Shareholder'],
                sanctioned: true,
                pep: false,
              },
            ],
            relationshipCount: 11,
            nextRelationship: undefined,
          }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(AnalystView)
    await flushPromises()
    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    await wrapper.get('[data-testid="show-more-relationships"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Second Related Entity')
  })

  it('shows resolved matches only for the selected project entity', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input === '/api/projects')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
          })
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              entities: [
                {
                  id: 'project-entity-1',
                  label: 'First supplier',
                  countries: [],
                  riskCategories: [],
                  riskFactors: [],
                  matches: [
                    { id: 'sayari-1', label: 'First legal entity' },
                    { id: 'sayari-2', label: 'Second legal entity' },
                  ],
                },
                {
                  id: 'project-entity-2',
                  label: 'Second supplier',
                  countries: [],
                  riskCategories: [],
                  riskFactors: [],
                  matches: [{ id: 'sayari-3', label: 'Third legal entity' }],
                },
              ],
            }),
        })
      }),
    )
    const wrapper = mount(AnalystView)
    await flushPromises()

    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')

    expect(wrapper.get('[data-testid="investigation-entity"]').text()).toContain(
      'First legal entity',
    )
    expect(wrapper.get('[data-testid="investigation-entity"]').text()).not.toContain(
      'Third legal entity',
    )
  })

  it('loads and appends more supporting records when requested', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<MockResponse>>((input) => {
      if (input === '/api/projects')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
        })
      if (input === '/api/projects/project-1/entities')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              entities: [
                {
                  id: 'project-entity-1',
                  label: 'Input supplier',
                  countries: [],
                  riskCategories: [],
                  riskFactors: [],
                  matches: [{ id: 'entity-1', label: 'Example Supplier' }],
                },
              ],
            }),
        })
      if (input === '/api/entities/entity-1')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(structuredClone(investigation)),
        })
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            records: [
              { id: 'record-2', label: 'Second source record', source: 'Registry', type: 'about' },
            ],
            recordCount: 12,
            nextRecord: undefined,
          }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(AnalystView)
    await flushPromises()
    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    await wrapper.get('[data-testid="show-more-records"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Second source record')
  })

  it('does not present a provider homepage or opaque source ID as a record link', async () => {
    const response = structuredClone({
      ...investigation,
      records: [
        {
          id: 'record-1',
          label: 'Company Record from Example Registry',
          type: 'about',
          publicationDate: '2026-09-15',
          source: 'opaque-source-id',
          sourceUrl: 'https://registry.example.com',
        },
      ],
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input === '/api/projects')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
          })
        if (input === '/api/projects/project-1/entities')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                entities: [
                  {
                    id: 'project-entity-1',
                    label: 'Input supplier',
                    countries: [],
                    riskCategories: [],
                    riskFactors: [],
                    matches: [{ id: 'entity-1', label: 'Example Supplier' }],
                  },
                ],
              }),
          })
        return Promise.resolve({ ok: true, json: () => Promise.resolve(response) })
      }),
    )
    const wrapper = mount(AnalystView)
    await flushPromises()
    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.find('a[href="https://registry.example.com"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('opaque-source-id')
    expect(wrapper.text()).toContain('About this entity · Published 2026-09-15')
  })

  it('displays risk details without their yes/no or numeric values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input === '/api/projects')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ projects: [{ id: 'project-1', label: 'Supplier review' }] }),
          })
        if (input === '/api/projects/project-1/entities')
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                entities: [
                  {
                    id: 'project-entity-1',
                    label: 'Input supplier',
                    countries: [],
                    riskCategories: [],
                    riskFactors: [],
                    matches: [{ id: 'entity-1', label: 'Example Supplier' }],
                  },
                ],
              }),
          })
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(structuredClone(investigation)),
        })
      }),
    )
    const wrapper = mount(AnalystView)
    await flushPromises()
    await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.text()).toContain('Risk signals')
    expect(wrapper.text()).toContain('A risk signal.')
    expect(wrapper.text()).not.toContain('Present')
    expect(wrapper.text()).not.toContain('Numeric value: 5')
  })
})
