import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { ProjectPage } from '@shared/api/projects'
import ProjectPicker from './ProjectPicker.vue'

const wrappers: VueWrapper[] = []
const page: ProjectPage = {
  projects: [
    { id: 'project-1', label: 'Supplier review' },
    { id: 'project-2', label: 'Adverse media' },
  ],
  next: 'next-cursor',
}

function render(
  options: { page?: ProjectPage; loading?: boolean; error?: string; modelValue?: string } = {},
) {
  const wrapper = mount(ProjectPicker, {
    props: {
      page: options.page ?? page,
      loading: options.loading ?? false,
      error: options.error ?? '',
      testId: 'project-picker',
      modelValue: options.modelValue ?? 'project-1',
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('ProjectPicker', () => {
  it('gives loading state precedence over errors and empty results', () => {
    const wrapper = render({
      page: { projects: [] },
      loading: true,
      error: 'Project request failed',
    })
    expect(wrapper.get('[role="status"]').text()).toBe('Loading projects…')
  })

  it('shows an error before the empty-page state', () => {
    const wrapper = render({ page: { projects: [] }, error: 'Project request failed' })
    expect({
      hasError: wrapper.text().includes('Project request failed'),
      hasEmptyState: wrapper.text().includes('No projects available on this page.'),
    }).toEqual({ hasError: true, hasEmptyState: false })
  })

  it('shows the empty-page state when there are no projects', () => {
    const wrapper = render({ page: { projects: [] } })
    expect({
      hasEmptyState: wrapper.text().includes('No projects available on this page.'),
      hasError: wrapper.find('[role="alert"]').exists(),
    }).toEqual({ hasEmptyState: true, hasError: false })
  })

  it('emits the previous cursor when requested', async () => {
    const wrapper = render({ page: { ...page, prev: 'previous-cursor' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('pagination')?.[0]).toEqual([{ prev: 'previous-cursor' }])
  })

  it('emits the next cursor when requested', async () => {
    const wrapper = render()
    await wrapper.get('button:last-of-type').trigger('click')
    expect(wrapper.emitted('pagination')?.[0]).toEqual([{ next: 'next-cursor' }])
  })

  it('disables previous pagination when there is no previous cursor', () => {
    expect(render().get('button').attributes('disabled')).toBeDefined()
  })

  it('disables next pagination when there is no next cursor', () => {
    const wrapper = render({ page: { projects: page.projects, prev: 'previous-cursor' } })
    expect(wrapper.findAll('button').at(1)?.attributes('disabled')).toBeDefined()
  })

  it.each([
    { loading: true, page, description: 'loading' },
    { loading: false, page: { projects: [] }, description: 'no projects' },
  ])('disables selection while $description', ({ loading, page: projectsPage }) => {
    expect(
      render({ loading, page: projectsPage }).get('select').attributes('disabled'),
    ).toBeDefined()
  })

  it('updates the selected project through the native select', async () => {
    const wrapper = render()
    await wrapper.get('select').setValue('project-2')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['project-2'])
  })
})
