import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SayariDebugView from './SayariDebugView.vue'

describe('SayariDebugView', () => {
  const fetchResponse = vi.fn<() => Promise<Response>>()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchResponse)
  })

  it('shows a successful connection result after the test button is clicked', async () => {
    fetchResponse.mockResolvedValue(Response.json({ returned: 1, totalCount: 250 }))
    const wrapper = mount(SayariDebugView)

    await wrapper.get('[data-testid="sayari-test-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="sayari-test-success"]').text()).toContain('Total available: 250.')
  })

  it('shows an error when the browser request fails', async () => {
    fetchResponse.mockRejectedValue(new TypeError('Failed to fetch'))
    const wrapper = mount(SayariDebugView)

    await wrapper.get('[data-testid="sayari-test-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="sayari-test-error"]').text()).toContain('Failed to fetch')
  })
})
