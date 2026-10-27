import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AnalystView from './AnalystView.vue'
import type { EntityInvestigation } from '@shared/api/entities'

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

type RequestHandler = (
  input: string,
  init?: RequestInit,
) => MockResponse | Promise<MockResponse> | undefined

function apiResponse(body: unknown, ok = true): MockResponse {
  return { ok, json: () => Promise.resolve(body) }
}

function createDefaultResponse(input: string): MockResponse {
  if (input === '/api/projects')
    return apiResponse({
      projects: [
        { id: 'project-1', label: 'Review' },
        { id: 'project-2', label: 'Alternate review' },
      ],
    })
  if (input.endsWith('/entities'))
    return apiResponse({
      entities: [
        {
          id: 'project-entity-1',
          label: 'Supplier',
          countries: [],
          riskCategories: [],
          riskFactors: [],
          matches: [
            { id: 'entity-1', label: 'First supplier' },
            { id: 'entity-2', label: 'Second supplier' },
          ],
        },
      ],
    })
  if (input.includes('/relationships'))
    return apiResponse({
      relationships: [],
      relationshipCount: investigation.relationshipCount,
      nextRelationship: undefined,
    })
  if (input.includes('/records'))
    return apiResponse({
      records: [],
      recordCount: investigation.recordCount,
      nextRecord: undefined,
    })
  const entityId = input.split('/')[3] ?? 'entity-1'
  const initial = {
    ...structuredClone(investigation),
    records: [{ id: 'record-1', label: 'Existing record', type: 'about' }],
  }
  return apiResponse({
    ...initial,
    profile: { ...investigation.profile, id: entityId, label: `Investigation ${entityId}` },
  })
}

async function mountInvestigationView(handler: RequestHandler = () => undefined) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: RequestInit) =>
      Promise.resolve(handler(input, init) ?? createDefaultResponse(input)),
    ),
  )
  const wrapper = mount(AnalystView)
  await flushPromises()
  await wrapper.get('[data-testid="investigation-project-entity"]').setValue('project-entity-1')
  return wrapper
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, reject, resolve }
}

describe('AnalystView', () => {
  it.each([
    { kind: 'relationships', button: 'show-more-relationships', path: '/relationships' },
    { kind: 'records', button: 'show-more-records', path: '/records' },
  ])('aborts pending $kind pagination and ignores its later success', async ({ button, path }) => {
    const pending = deferred<MockResponse>()
    let pageSignal: AbortSignal | undefined
    const wrapper = await mountInvestigationView((input, init) => {
      if (input.includes(path)) {
        pageSignal = init?.signal ?? undefined
        return pending.promise
      }
      return undefined
    })
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()
    await wrapper.get(`[data-testid="${button}"]`).trigger('click')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-2')
    await flushPromises()
    pending.resolve(
      apiResponse({
        relationships: [{ ...investigation.relationships[0], id: 'stale', label: 'Stale page' }],
        relationshipCount: 99,
        records: [{ id: 'stale', label: 'Stale page', type: 'about' }],
        recordCount: 99,
      }),
    )
    await flushPromises()

    expect(pageSignal?.aborted).toBe(true)
    expect(wrapper.get('[data-testid="entity-label"]').text()).toBe('Investigation entity-2')
    expect(wrapper.text()).not.toContain('Stale page')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it.each([
    { kind: 'relationships', button: 'show-more-relationships', path: '/relationships' },
    { kind: 'records', button: 'show-more-records', path: '/records' },
  ])(
    'ignores a late $kind pagination failure after switching matches',
    async ({ button, path }) => {
      const pending = deferred<MockResponse>()
      const wrapper = await mountInvestigationView((input) =>
        input.includes(path) ? pending.promise : undefined,
      )
      await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
      await flushPromises()
      await wrapper.get(`[data-testid="${button}"]`).trigger('click')
      await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-2')
      await flushPromises()
      pending.resolve(apiResponse({ error: { message: 'Stale pagination failure.' } }, false))
      await flushPromises()

      expect(wrapper.get('[data-testid="entity-label"]').text()).toBe('Investigation entity-2')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    },
  )

  it.each([
    { kind: 'relationships', button: 'show-more-relationships', path: '/relationships' },
    { kind: 'records', button: 'show-more-records', path: '/records' },
  ])(
    'retains existing $kind and retries a failed page successfully',
    async ({ kind, button, path }) => {
      let pageRequests = 0
      const wrapper = await mountInvestigationView((input) => {
        if (!input.includes(path)) return undefined
        pageRequests += 1
        if (pageRequests === 1)
          return apiResponse({ error: { message: 'Temporary pagination failure.' } }, false)
        if (kind === 'relationships')
          return apiResponse({
            relationships: [
              { ...investigation.relationships[0], id: 'related-2', label: 'Retried relationship' },
            ],
            relationshipCount: 11,
            nextRelationship: undefined,
          })
        return apiResponse({
          records: [{ id: 'record-2', label: 'Retried record', type: 'about' }],
          recordCount: 12,
          nextRecord: undefined,
        })
      })
      await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
      await flushPromises()
      await wrapper.get(`[data-testid="${button}"]`).trigger('click')
      await flushPromises()
      expect(wrapper.get('[role="alert"]').text()).toBe('Temporary pagination failure.')

      await wrapper.get(`[data-testid="${button}"]`).trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain(
        kind === 'relationships' ? 'First Related Entity' : 'Existing record',
      )
      expect(wrapper.text()).toContain(
        kind === 'relationships' ? 'Retried relationship' : 'Retried record',
      )
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    },
  )

  it('aborts the initial projects request on unmount', async () => {
    const pending = deferred<MockResponse>()
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined
        return pending.promise
      }),
    )
    const wrapper = mount(AnalystView)

    wrapper.unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('aborts the project entities request on unmount', async () => {
    const pending = deferred<MockResponse>()
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string, init?: RequestInit) => {
        if (input === '/api/projects') return Promise.resolve(createDefaultResponse(input))
        signal = init?.signal ?? undefined
        return pending.promise
      }),
    )
    const wrapper = mount(AnalystView)
    await flushPromises()

    wrapper.unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('aborts an investigation request on unmount', async () => {
    const pending = deferred<MockResponse>()
    let signal: AbortSignal | undefined
    const wrapper = await mountInvestigationView((input, init) => {
      if (!input.includes('/api/entities/')) return undefined
      signal = init?.signal ?? undefined
      return pending.promise
    })
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')

    wrapper.unmount()

    expect(signal?.aborted).toBe(true)
  })

  it.each([
    { kind: 'relationships', button: 'show-more-relationships', path: '/relationships' },
    { kind: 'records', button: 'show-more-records', path: '/records' },
  ])('aborts pending $kind pagination on unmount', async ({ button, path }) => {
    const pending = deferred<MockResponse>()
    let signal: AbortSignal | undefined
    const wrapper = await mountInvestigationView((input, init) => {
      if (!input.includes(path)) return undefined
      signal = init?.signal ?? undefined
      return pending.promise
    })
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()
    await wrapper.get(`[data-testid="${button}"]`).trigger('click')

    wrapper.unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('ignores a stale project entities response after switching projects', async () => {
    const firstPage = deferred<MockResponse>()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input === '/api/projects') return Promise.resolve(createDefaultResponse(input))
        if (input === '/api/projects/project-1/entities') return firstPage.promise
        return Promise.resolve(
          apiResponse({
            entities: [
              {
                id: 'current-project-entity',
                label: 'Current project entity',
                countries: [],
                riskCategories: [],
                riskFactors: [],
                matches: [],
              },
            ],
          }),
        )
      }),
    )
    const wrapper = mount(AnalystView)
    await flushPromises()
    await wrapper.get('[data-testid="investigation-project"]').setValue('project-2')
    await flushPromises()
    firstPage.resolve(
      apiResponse({
        entities: [
          {
            id: 'stale-project-entity',
            label: 'Stale project entity',
            countries: [],
            riskCategories: [],
            riskFactors: [],
            matches: [],
          },
        ],
      }),
    )
    await flushPromises()

    expect(wrapper.get('[data-testid="investigation-project-entity"]').text()).toContain(
      'Current project entity',
    )
    expect(wrapper.get('[data-testid="investigation-project-entity"]').text()).not.toContain(
      'Stale project entity',
    )
  })

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

  it('stops showing loading when the selected match is cleared during a request', async () => {
    const pending = deferred<MockResponse>()
    let investigationSignal: AbortSignal | undefined
    const wrapper = await mountInvestigationView((input, init) => {
      if (!input.includes('/api/entities/')) return undefined
      investigationSignal = init?.signal ?? undefined
      return pending.promise
    })
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')

    expect(wrapper.get('[role="status"]').text()).toContain('Loading entity investigation')

    await wrapper.get('[data-testid="investigation-entity"]').setValue('')
    expect(investigationSignal?.aborted).toBe(true)
    pending.resolve(apiResponse(investigation))
    await flushPromises()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('shows a pagination error', async () => {
    const wrapper = await mountInvestigationView((input) =>
      input.includes('/relationships')
        ? apiResponse({ error: { message: 'Unable to load more relationships.' } }, false)
        : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()
    await wrapper.get('[data-testid="show-more-relationships"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load more relationships.')
  })

  it.each([
    { button: 'show-more-relationships', path: '/relationships', label: 'Loading relationships…' },
    { button: 'show-more-records', path: '/records', label: 'Loading records…' },
  ])('disables the $button while its page is loading', async ({ button, path, label }) => {
    const pending = deferred<MockResponse>()
    const wrapper = await mountInvestigationView((input) =>
      input.includes(path) ? pending.promise : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()
    await wrapper.get(`[data-testid="${button}"]`).trigger('click')

    expect(wrapper.get(`[data-testid="${button}"]`).text()).toBe(label)
    expect((wrapper.get(`[data-testid="${button}"]`).element as HTMLButtonElement).disabled).toBe(
      true,
    )
    pending.resolve(apiResponse({ relationships: [], records: [] }))
    await flushPromises()
  })

  it('hides pagination controls when both sections are exhausted', async () => {
    const response = {
      ...structuredClone(investigation),
      nextRelationship: undefined,
      nextRecord: undefined,
    }
    const wrapper = await mountInvestigationView((input) =>
      input === '/api/entities/entity-1' ? apiResponse(response) : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.find('[data-testid="show-more-relationships"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="show-more-records"]').exists()).toBe(false)
  })

  it('does not display a stale investigation response after selecting another match', async () => {
    const first = deferred<MockResponse>()
    const wrapper = await mountInvestigationView((input) =>
      input.endsWith('/entity-1') ? first.promise : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-2')
    await flushPromises()
    first.resolve(apiResponse(investigation))
    await flushPromises()

    expect(wrapper.get('[data-testid="entity-label"]').text()).toBe('Investigation entity-2')
  })

  it.each([
    { ancestor: 'investigation-project', next: 'project-2' },
    { ancestor: 'investigation-project-entity', next: '' },
  ])('clears a completed investigation when $ancestor changes', async ({ ancestor, next }) => {
    const wrapper = await mountInvestigationView()
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()
    await wrapper.get(`[data-testid="${ancestor}"]`).setValue(next)
    await flushPromises()

    expect(wrapper.find('[data-testid="entity-label"]').exists()).toBe(false)
  })

  it.each([
    { ancestor: 'investigation-project', next: 'project-2' },
    { ancestor: 'investigation-project-entity', next: '' },
  ])('aborts a pending investigation when $ancestor changes', async ({ ancestor, next }) => {
    const pending = deferred<MockResponse>()
    let signal: AbortSignal | undefined
    const wrapper = await mountInvestigationView((input, init) => {
      if (!input.endsWith('/entity-1')) return undefined
      signal = init?.signal ?? undefined
      return pending.promise
    })
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await wrapper.get(`[data-testid="${ancestor}"]`).setValue(next)

    expect(signal?.aborted).toBe(true)
  })

  it.each([
    { ancestor: 'investigation-project', next: 'project-2', outcome: 'success' },
    { ancestor: 'investigation-project', next: 'project-2', outcome: 'failure' },
    { ancestor: 'investigation-project-entity', next: '', outcome: 'success' },
    { ancestor: 'investigation-project-entity', next: '', outcome: 'failure' },
  ])(
    'ignores stale investigation results after changing $ancestor ($outcome)',
    async ({ ancestor, next, outcome }) => {
      const pending = deferred<MockResponse>()
      const wrapper = await mountInvestigationView((input) =>
        input.endsWith('/entity-1') ? pending.promise : undefined,
      )
      await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
      await wrapper.get(`[data-testid="${ancestor}"]`).setValue(next)
      await flushPromises()
      if (outcome === 'success') pending.resolve(apiResponse(investigation))
      else pending.reject(new Error('Stale investigation failure.'))
      await flushPromises()

      expect({
        investigation: wrapper.find('[data-testid="entity-label"]').exists(),
        error: wrapper.find('[role="alert"]').exists(),
        loading: wrapper.find('[role="status"]').exists(),
      }).toEqual({ investigation: false, error: false, loading: false })
    },
  )

  it('clears a project-entity request error when switching projects', async () => {
    const wrapper = await mountInvestigationView((input) =>
      input === '/api/projects/project-1/entities'
        ? apiResponse({ error: { message: 'Unable to load project entities.' } }, false)
        : undefined,
    )
    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load project entities.')

    await wrapper.get('[data-testid="investigation-project"]').setValue('project-2')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows a project-list request failure', async () => {
    const wrapper = await mountInvestigationView((input) =>
      input === '/api/projects'
        ? apiResponse({ error: { message: 'Unable to load projects.' } }, false)
        : undefined,
    )

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load projects.')
  })

  it('does not request project entities when the project list is empty', async () => {
    const requests: string[] = []
    await mountInvestigationView((input) => {
      requests.push(input)
      return input === '/api/projects' ? apiResponse({ projects: [] }) : undefined
    })

    expect(requests.some((input) => input.endsWith('/entities'))).toBe(false)
  })

  it('does not auto-select a match when the project entity page is empty', async () => {
    const wrapper = await mountInvestigationView((input) =>
      input.endsWith('/entities') ? apiResponse({ entities: [] }) : undefined,
    )

    expect(
      (wrapper.get('[data-testid="investigation-entity"]').element as HTMLSelectElement).value,
    ).toBe('')
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

  it('omits unavailable profile facts and displays fallback country and status badges', async () => {
    const response = structuredClone(investigation) as EntityInvestigation
    response.profile.countries = []
    response.profile.sanctioned = false
    response.profile.pep = true
    response.profile.closed = true
    const wrapper = await mountInvestigationView((input) =>
      input === '/api/entities/entity-1' ? apiResponse(response) : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.text()).toContain('No countries recorded')
    expect(wrapper.text()).toContain('PEP')
    expect(wrapper.text()).toContain('Closed')
    expect(wrapper.text()).not.toContain('Registration:')
    expect(wrapper.text()).not.toContain('Company type:')
    expect(wrapper.text()).not.toContain('Status:')
  })

  it('joins relationship types and countries and shows relationship status badges', async () => {
    const response = structuredClone(investigation) as EntityInvestigation
    response.relationships[0] = {
      ...response.relationships[0]!,
      countries: ['JPN', 'USA'],
      types: ['Has Director', 'Has Shareholder'],
      sanctioned: true,
      pep: true,
    }
    const wrapper = await mountInvestigationView((input) =>
      input === '/api/entities/entity-1' ? apiResponse(response) : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.text()).toContain('Has Director, Has Shareholder · JPN, USA')
    expect(wrapper.text()).toContain('Sanctioned')
    expect(wrapper.text()).toContain('PEP')
  })

  it('shows record descriptions with publication and acquisition dates and truncates addresses', async () => {
    const response = structuredClone(investigation) as EntityInvestigation
    response.profile.addresses = [
      'First address',
      'Second address',
      'Third address',
      'Hidden address',
    ]
    response.records = [
      {
        id: 'record-1',
        label: 'Company record',
        type: 'about',
        publicationDate: '2026-09-15',
        acquisitionDate: '2026-09-20',
      },
      { id: 'record-2', label: 'Mention record', type: 'mention' },
    ]
    const wrapper = await mountInvestigationView((input) =>
      input === '/api/entities/entity-1' ? apiResponse(response) : undefined,
    )
    await wrapper.get('[data-testid="investigation-entity"]').setValue('entity-1')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'About this entity · Published 2026-09-15 · Collected 2026-09-20',
    )
    expect(wrapper.text()).toContain('Mentions this entity')
    expect(wrapper.text()).toContain('Third address')
    expect(wrapper.text()).not.toContain('Hidden address')
  })
})
