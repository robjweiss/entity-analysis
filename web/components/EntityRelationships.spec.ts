import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { EntityInvestigation } from '@shared/api/entities'
import EntityRelationships from './EntityRelationships.vue'

const wrappers: VueWrapper[] = []
const relationship: EntityInvestigation['relationships'][number] = {
  id: 'related-1',
  label: 'Example Director',
  types: ['Director', 'Shareholder'],
  countries: ['Japan', 'Canada'],
  sanctioned: true,
  pep: true,
}

function render(
  options: {
    relationships?: EntityInvestigation['relationships']
    hasMore?: boolean
    loading?: boolean
    error?: string
  } = {},
) {
  const wrapper = mount(EntityRelationships, {
    props: {
      relationships: options.relationships ?? [relationship],
      count: 3,
      hasMore: options.hasMore ?? false,
      loading: options.loading ?? false,
      error: options.error ?? '',
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('EntityRelationships', () => {
  it('joins relationship types and countries for display', () => {
    expect(render().text()).toContain('Director, Shareholder · Japan, Canada')
  })

  it('omits the country segment when no countries are known', () => {
    expect(render({ relationships: [{ ...relationship, countries: [] }] }).text()).not.toContain(
      '·',
    )
  })

  it.each([
    ['sanctioned', 'Sanctioned'],
    ['pep', 'PEP'],
  ] as const)('shows the %s badge when enabled', (key, badge) => {
    expect(
      render({
        relationships: [{ ...relationship, sanctioned: false, pep: false, [key]: true }],
      }).text(),
    ).toContain(badge)
  })

  it.each([
    ['sanctioned', 'Sanctioned'],
    ['pep', 'PEP'],
  ] as const)('omits the %s badge when disabled', (key, badge) => {
    expect(render({ relationships: [{ ...relationship, [key]: false }] }).text()).not.toContain(
      badge,
    )
  })

  it('shows the empty relationship state', () => {
    expect(render({ relationships: [] }).text()).toContain('No direct relationships returned.')
  })

  it('shows pagination errors', () => {
    expect(render({ error: 'Unable to load relationships' }).get('[role="alert"]').text()).toBe(
      'Unable to load relationships',
    )
  })

  it('omits the pagination control when there is no next page', () => {
    expect(render().find('[data-testid="show-more-relationships"]').exists()).toBe(false)
  })

  it('emits loadMore when the user requests more relationships', async () => {
    const wrapper = render({ hasMore: true })
    await wrapper.get('[data-testid="show-more-relationships"]').trigger('click')
    expect(wrapper.emitted('loadMore')).toHaveLength(1)
  })

  it('disables pagination while relationships are loading', () => {
    expect(
      render({ hasMore: true, loading: true })
        .get('[data-testid="show-more-relationships"]')
        .attributes('disabled'),
    ).toBeDefined()
  })

  it('shows a loading label while fetching more relationships', () => {
    expect(
      render({ hasMore: true, loading: true })
        .get('[data-testid="show-more-relationships"]')
        .text(),
    ).toBe('Loading relationships…')
  })
})
