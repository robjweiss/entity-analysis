import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { ProjectRiskChanges } from '@shared/api/projects'
import RecentRiskChanges from './RecentRiskChanges.vue'

const wrappers: VueWrapper[] = []
const change: ProjectRiskChanges['changes'][number] = {
  projectEntityId: 'entity-1',
  entityName: 'Example supplier',
  factor: 'forced_labor',
  changeType: 'added',
  timestamp: '2026-10-24T00:00:00.000Z',
}

function render(
  options: {
    changes?: ProjectRiskChanges['changes']
    loading?: boolean
    error?: string
    moreError?: string
    loaded?: boolean
    hasNextPage?: boolean
    canShowMore?: boolean
    loadingMore?: boolean
  } = {},
) {
  const wrapper = mount(RecentRiskChanges, {
    props: {
      loading: options.loading ?? false,
      error: options.error ?? '',
      moreError: options.moreError ?? '',
      loaded: options.loaded ?? true,
      hasNextPage: options.hasNextPage ?? false,
      visibleChanges: options.changes ?? [change],
      canShowMore: options.canShowMore ?? false,
      loadingMore: options.loadingMore ?? false,
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('RecentRiskChanges', () => {
  it('uses the entity name when available', () => {
    expect(render().text()).toContain('Example supplier')
  })

  it('falls back to the project entity identifier', () => {
    expect(render({ changes: [{ ...change, entityName: undefined }] }).text()).toContain(
      'Project entity entity-1',
    )
  })

  it('formats factor identifiers when no display label is available', () => {
    expect(render().text()).toContain('forced labor')
  })

  it('prefers the supplied factor label', () => {
    expect(
      render({ changes: [{ ...change, factorLabel: 'Forced labor exposure' }] }).text(),
    ).toContain('Forced labor exposure')
  })

  it('formats timestamps using the UTC calendar date and runtime locale', () => {
    const timestamp = '2026-10-23T23:30:00-02:00'
    const expected = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(timestamp))
    const wrapper = render({ changes: [{ ...change, timestamp }] })
    expect(wrapper.get('time').text()).toBe(expected)
  })

  it('shows loading before an existing error', () => {
    const wrapper = render({ loading: true, error: 'Changes unavailable' })
    expect({
      status: wrapper.get('[role="status"]').text(),
      hasError: wrapper.find('[role="alert"]').exists(),
      hasResults: wrapper.find('[aria-label="Recent risk changes"]').exists(),
    }).toEqual({ status: 'Loading recent changes…', hasError: false, hasResults: false })
  })

  it('shows the initial error instead of loaded results', () => {
    const wrapper = render({ error: 'Changes unavailable' })
    expect({
      error: wrapper.get('[role="alert"]').text(),
      hasResults: wrapper.find('[aria-label="Recent risk changes"]').exists(),
    }).toEqual({ error: 'Changes unavailable', hasResults: false })
  })

  it('does not show loaded results before loading completes', () => {
    expect(render({ loaded: false }).find('[aria-label="Recent risk changes"]').exists()).toBe(
      false,
    )
  })

  it.each([
    { hasNextPage: false, expected: 'No risk changes returned for this period.' },
    { hasNextPage: true, expected: 'No risk changes returned on this page.' },
  ])('distinguishes an empty page from an empty period', ({ hasNextPage, expected }) => {
    expect(render({ changes: [], hasNextPage }).text()).toContain(expected)
  })

  it('shows an error from loading more while retaining results', () => {
    const wrapper = render({ moreError: 'More changes unavailable' })
    expect({
      error: wrapper.get('[role="alert"]').text(),
      hasResults: wrapper.find('[aria-label="Recent risk changes"]').exists(),
    }).toEqual({ error: 'More changes unavailable', hasResults: true })
  })

  it('emits showMore when the user requests more changes', async () => {
    const wrapper = render({ canShowMore: true })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('showMore')).toHaveLength(1)
  })

  it('disables show more while another page is loading', () => {
    expect(
      render({ canShowMore: true, loadingMore: true }).get('button').attributes('disabled'),
    ).toBeDefined()
  })

  it('shows a loading label while fetching more changes', () => {
    expect(render({ canShowMore: true, loadingMore: true }).get('button').text()).toBe(
      'Loading more changes…',
    )
  })
})
