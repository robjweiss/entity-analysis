import { ref, watch } from 'vue'
import { listProjects } from '@/api/projects'
import type { ProjectPage } from '@shared/api/projects'

type ProjectPagination = { next?: string; prev?: string }

export function useProjectSelection() {
  const projectPage = ref<ProjectPage>()
  const projectPagination = ref<ProjectPagination>({})
  const selectedProjectId = ref('')
  const projectLoading = ref(false)
  const projectError = ref('')

  watch(
    projectPagination,
    async (pagination, _old, onCleanup) => {
      const controller = new AbortController()
      onCleanup(() => controller.abort())
      projectLoading.value = true
      projectError.value = ''
      projectPage.value = undefined
      selectedProjectId.value = ''
      try {
        const page = await listProjects(pagination, { signal: controller.signal })
        if (controller.signal.aborted) return
        projectPage.value = page
        selectedProjectId.value = page.projects[0]?.id ?? ''
      } catch (error) {
        if (!controller.signal.aborted) projectError.value = (error as Error).message
      } finally {
        if (!controller.signal.aborted) projectLoading.value = false
      }
    },
    { immediate: true },
  )

  return { projectPage, projectPagination, selectedProjectId, projectLoading, projectError }
}
