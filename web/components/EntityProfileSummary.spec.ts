import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { EntityInvestigation } from '@shared/api/entities'
import EntityProfileSummary from './EntityProfileSummary.vue'

const wrappers: VueWrapper[] = []
const profile: EntityInvestigation['profile'] = {
  id: 'entity-1',
  label: 'Example Company',
  type: 'Company',
  countries: ['Japan', 'France'],
  registrationDate: '2020-01-01',
  companyType: 'Private limited company',
  latestStatus: 'Active',
  sanctioned: true,
  pep: true,
  closed: true,
  identifiers: [],
  names: [],
  addresses: [],
  businessPurposes: [],
  sources: [],
}

function render(overrides: Partial<EntityInvestigation['profile']> = {}) {
  const wrapper = mount(EntityProfileSummary, { props: { profile: { ...profile, ...overrides } } })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('EntityProfileSummary', () => {
  it.each([
    ['Status', 'Active'],
    ['Registration', '2020-01-01'],
    ['Company type', 'Private limited company'],
  ])('shows the optional %s fact when present', (label, value) => {
    expect(
      render()
        .findAll('dl div')
        .some((fact) => fact.text().includes(label) && fact.text().includes(value)),
    ).toBe(true)
  })

  it('omits optional facts when none are provided', () => {
    const wrapper = render({
      latestStatus: undefined,
      registrationDate: undefined,
      companyType: undefined,
    })
    expect(wrapper.find('dl').exists()).toBe(false)
  })

  it('shows the supplied countries', () => {
    expect(render().text()).toContain('Japan, France')
  })

  it('uses the country fallback when none are supplied', () => {
    expect(render({ countries: [] }).text()).toContain('No countries recorded')
  })

  it.each([
    ['sanctioned', 'Sanctioned'],
    ['pep', 'PEP'],
    ['closed', 'Closed'],
  ] as const)('shows the %s badge when enabled', (key, label) => {
    expect(render({ sanctioned: false, pep: false, closed: false, [key]: true }).text()).toContain(
      label,
    )
  })

  it.each([
    ['sanctioned', 'Sanctioned'],
    ['pep', 'PEP'],
    ['closed', 'Closed'],
  ] as const)('omits the %s badge when disabled', (key, label) => {
    expect(render({ [key]: false }).text()).not.toContain(label)
  })
})
