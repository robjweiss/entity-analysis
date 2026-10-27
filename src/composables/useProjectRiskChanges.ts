import { computed, ref, watch, type Ref } from 'vue'
import { getProjectRiskChanges } from '@/api/projects'
import type { ProjectRiskChanges } from '@shared/api/projects'

export function useProjectRiskChanges(projectId: Ref<string>) {
  const changes = ref<ProjectRiskChanges>()
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')
  const moreError = ref('')
  const visibleCount = ref(5)
  let controller: AbortController | undefined

  const visibleChanges = computed(() => changes.value?.changes.slice(0, visibleCount.value) ?? [])
  const canShowMore = computed(() =>
    Boolean(
      changes.value && (visibleCount.value < changes.value.changes.length || changes.value.next),
    ),
  )

  watch(
    projectId,
    (id, _old, onCleanup) => {
      controller = new AbortController()
      const requestController = controller
      onCleanup(() => requestController.abort())
      changes.value = undefined
      visibleCount.value = 5
      loadingMore.value = false
      moreError.value = ''
      error.value = ''
      loading.value = Boolean(id)
      if (!id) return
      void getProjectRiskChanges(id, {}, { signal: requestController.signal })
        .then((result) => {
          if (!requestController.signal.aborted) changes.value = result
        })
        .catch((reason) => {
          if (!requestController.signal.aborted) error.value = (reason as Error).message
        })
        .finally(() => {
          if (!requestController.signal.aborted) loading.value = false
        })
    },
    { immediate: true },
  )

  async function showMore() {
    const current = changes.value
    if (!current || loadingMore.value) return
    moreError.value = ''
    if (visibleCount.value < current.changes.length) {
      visibleCount.value = Math.min(visibleCount.value + 5, current.changes.length)
      return
    }
    if (!current.next || !controller || controller.signal.aborted) return
    loadingMore.value = true
    const owner = controller
    try {
      const result = await getProjectRiskChanges(
        projectId.value,
        { next: current.next, asOf: current.to },
        { signal: owner.signal },
      )
      if (owner.signal.aborted) return
      changes.value = {
        ...result,
        from: current.from,
        to: current.to,
        changes: [...current.changes, ...result.changes],
      }
      visibleCount.value = Math.min(visibleCount.value + 5, changes.value.changes.length)
    } catch (reason) {
      if (!owner.signal.aborted) moreError.value = (reason as Error).message
    } finally {
      if (!owner.signal.aborted) loadingMore.value = false
    }
  }

  return { changes, loading, loadingMore, error, moreError, visibleChanges, canShowMore, showMore }
}
