import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ProjectPicker from '@/components/ProjectPicker.vue'
import { useProjectSelection } from './useProjectSelection'

type ApiResponse = { ok: boolean; json: () => Promise<unknown> }

function mountPicker(errorHandler?: (error: unknown) => void) {
  return mount(
    defineComponent({
      setup() {
        const selection = useProjectSelection()
        return () =>
          h('div', [
            h(ProjectPicker, {
              modelValue: selection.selectedProjectId.value,
              'onUpdate:modelValue': (value: string) => {
                selection.selectedProjectId.value = value
              },
              page: selection.projectPage.value,
              loading: selection.projectLoading.value,
              error: selection.projectError.value,
              testId: 'project-picker',
              onPagination: (value: { next?: string; prev?: string }) => {
                selection.projectPagination.value = value
              },
            }),
            h('p', { 'data-testid': 'selected-project' }, selection.selectedProjectId.value),
          ])
      },
    }),
    { global: { config: { errorHandler } } },
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('useProjectSelection with ProjectPicker', () => {
  it('requests the next cursor and selects the first project on the returned page', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<ApiResponse>>((input) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            input.includes('next=')
              ? { projects: [{ id: 'second-page-first', label: 'Second page' }] }
              : { projects: [{ id: 'first-page', label: 'First page' }], next: 'cursor-next' },
          ),
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mountPicker()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next projects')!
      .trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/projects?next=cursor-next')
    expect(wrapper.get('[data-testid="selected-project"]').text()).toBe('second-page-first')
  })

  it('aborts a pending project request when the picker host unmounts', async () => {
    let requestSignal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: string, init: { signal?: AbortSignal }) => {
        requestSignal = init.signal
        return new Promise(() => undefined)
      }),
    )
    const wrapper = mountPicker()

    wrapper.unmount()

    expect(requestSignal?.aborted).toBe(true)
  })

  it('keeps project selections independent between picker instances', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<() => Promise<ApiResponse>>(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              projects: [
                { id: 'project-one', label: 'Project one' },
                { id: 'project-two', label: 'Project two' },
              ],
            }),
        }),
      ),
    )
    const firstPicker = mountPicker()
    const secondPicker = mountPicker()
    await flushPromises()

    await firstPicker.get('[data-testid="project-picker"]').setValue('project-two')

    expect(secondPicker.get('[data-testid="project-picker"]').element).toHaveProperty(
      'value',
      'project-one',
    )
    firstPicker.unmount()
    secondPicker.unmount()
  })

  it.each(['success', 'failure'] as const)(
    'ignores a late project request %s after the picker host unmounts',
    async (outcome) => {
      let resolveRequest:
        ((value: { ok: boolean; json: () => Promise<object> }) => void) | undefined
      let rejectRequest: ((reason: Error) => void) | undefined
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise((resolve, reject) => {
              resolveRequest = resolve
              rejectRequest = reject
            }),
        ),
      )
      const errorHandler = vi.fn<() => void>()
      const wrapper = mountPicker(errorHandler)
      wrapper.unmount()

      if (outcome === 'success') {
        resolveRequest?.({ ok: true, json: () => Promise.resolve({ projects: [] }) })
      } else {
        rejectRequest?.(new Error('late failure'))
      }
      await flushPromises()

      expect(errorHandler).not.toHaveBeenCalled()
    },
  )
})
