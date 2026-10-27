import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { EntityInvestigation } from '@shared/api/entities'
import EntityRecords from './EntityRecords.vue'

const wrappers: VueWrapper[] = []
const record: EntityInvestigation['records'][number] = {
  id: 'record-1',
  label: 'Regulatory filing',
  type: 'about',
  publicationDate: '2024-03-04',
  acquisitionDate: '2024-03-05',
}

function render(
  options: {
    records?: EntityInvestigation['records']
    hasMore?: boolean
    loading?: boolean
    error?: string
  } = {},
) {
  const wrapper = mount(EntityRecords, {
    props: {
      records: options.records ?? [record],
      count: 12,
      hasMore: options.hasMore ?? false,
      loading: options.loading ?? false,
      error: options.error ?? '',
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('EntityRecords', () => {
  it.each([
    { type: 'about', expected: 'About this entity' },
    { type: 'mention', expected: 'Mentions this entity' },
  ])('describes a $type record accurately', ({ type, expected }) => {
    expect(render({ records: [{ ...record, type }] }).text()).toContain(expected)
  })

  it.each([
    {
      publicationDate: '2024-03-04',
      acquisitionDate: '2024-03-05',
      expected: 'About this entity · Published 2024-03-04 · Collected 2024-03-05',
    },
    {
      publicationDate: '2024-03-04',
      acquisitionDate: undefined,
      expected: 'About this entity · Published 2024-03-04',
    },
    {
      publicationDate: undefined,
      acquisitionDate: '2024-03-05',
      expected: 'About this entity · Collected 2024-03-05',
    },
    { publicationDate: undefined, acquisitionDate: undefined, expected: 'About this entity' },
  ])('renders only available record dates', ({ expected, ...dates }) => {
    const wrapper = render({ records: [{ ...record, ...dates }] })
    expect(wrapper.get('li p:nth-of-type(2)').text().replace(/\s+/g, ' ').trim()).toBe(expected)
  })

  it('shows the empty state when no records are returned', () => {
    expect(render({ records: [] }).text()).toContain('No records returned.')
  })

  it('shows an error without a more-results cursor', () => {
    expect(render({ error: 'Records unavailable' }).get('[role="alert"]').text()).toBe(
      'Records unavailable',
    )
  })

  it('does not render an error when no error was reported', () => {
    expect(render().find('[role="alert"]').exists()).toBe(false)
  })

  it('does not show pagination without more results', () => {
    expect(
      render({ error: 'Records unavailable' }).find('[data-testid="show-more-records"]').exists(),
    ).toBe(false)
  })

  it('emits loadMore when the user requests more records', async () => {
    const wrapper = render({ hasMore: true })
    await wrapper.get('[data-testid="show-more-records"]').trigger('click')
    expect(wrapper.emitted('loadMore')).toHaveLength(1)
  })

  it('disables pagination while records are loading', () => {
    expect(
      render({ hasMore: true, loading: true })
        .get('[data-testid="show-more-records"]')
        .attributes('disabled'),
    ).toBeDefined()
  })

  it('shows a loading label while fetching more records', () => {
    expect(
      render({ hasMore: true, loading: true }).get('[data-testid="show-more-records"]').text(),
    ).toBe('Loading records…')
  })
})
