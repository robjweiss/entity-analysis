import { ref, watch, type Ref } from 'vue'
import { listProjectEntities } from '@/api/projects'
import type { EntityPage } from '@shared/api/projects'
import {
  emptyProjectEntityFilters,
  normalizeProjectEntityFilters,
  type ProjectEntityFilters,
} from '@/lib/projectEntityFilters'

type Cursor = { next?: string; prev?: string }

export function useProjectEntities(selectedProjectId: Ref<string>) {
  const filters = ref(emptyProjectEntityFilters())
  const entityPage = ref<EntityPage>()
  const entityCursor = ref<Cursor>({})
  const entityLoading = ref(false)
  const entityError = ref('')
  watch(
    selectedProjectId,
    () => {
      entityCursor.value = {}
    },
    { flush: 'sync' },
  )

  watch(
    [selectedProjectId, filters, entityCursor],
    async ([projectId, appliedFilters, cursor], _old, onCleanup) => {
      const controller = new AbortController()
      onCleanup(() => controller.abort())
      entityPage.value = undefined
      entityError.value = ''
      if (!projectId) {
        entityLoading.value = false
        return
      }
      entityLoading.value = true
      try {
        const page = await listProjectEntities(
          projectId,
          { ...appliedFilters, ...cursor },
          {
            signal: controller.signal,
          },
        )
        if (!controller.signal.aborted) entityPage.value = page
      } catch (error) {
        if (!controller.signal.aborted) entityError.value = (error as Error).message
      } finally {
        if (!controller.signal.aborted) entityLoading.value = false
      }
    },
    { immediate: true },
  )

  function applyFilters(draftFilters: ProjectEntityFilters) {
    filters.value = normalizeProjectEntityFilters(draftFilters)
    entityCursor.value = {}
  }

  function changePage(cursor: Cursor) {
    entityCursor.value = cursor
  }

  return {
    entityPage,
    entityLoading,
    entityError,
    applyFilters,
    changePage,
  }
}
