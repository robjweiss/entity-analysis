import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'

describe('App', () => {
  it.each([
    { path: '/executive', title: 'Exposure Snapshot' },
    { path: '/management', title: 'Priority Queue' },
    { path: '/analyst', title: 'Entity Investigation' },
  ])('renders $title at $path', async ({ path, title }) => {
    await router.push(path)
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    expect(wrapper.get('h1').text()).toBe(title)
  })
})
