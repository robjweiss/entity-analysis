import { ref, watch, type Ref } from 'vue'
import { getEntityInvestigation, getEntityRecords, getEntityRelationships } from '@/api/entities'
import type { EntityInvestigation } from '@shared/api/entities'

export function useEntityInvestigation(matchId: Ref<string>) {
  const investigation = ref<EntityInvestigation>()
  const loading = ref(false)
  const error = ref('')
  const relationshipsLoading = ref(false)
  const relationshipsError = ref('')
  const recordsLoading = ref(false)
  const recordsError = ref('')
  let activeController: AbortController | undefined

  watch(
    matchId,
    async (id, _old, onCleanup) => {
      investigation.value = undefined
      loading.value = false
      error.value = ''
      relationshipsError.value = ''
      recordsError.value = ''
      relationshipsLoading.value = false
      recordsLoading.value = false
      if (!id) return

      const controller = new AbortController()
      activeController = controller
      onCleanup(() => controller.abort())
      loading.value = true
      try {
        const result = await getEntityInvestigation(id, { signal: controller.signal })
        if (!controller.signal.aborted) investigation.value = result
      } catch (requestError) {
        if (!controller.signal.aborted) error.value = (requestError as Error).message
      } finally {
        if (!controller.signal.aborted) loading.value = false
      }
    },
    { immediate: true },
  )

  async function loadMoreRelationships() {
    const current = investigation.value
    const cursor = current?.nextRelationship
    const controller = activeController
    if (
      !current ||
      !cursor ||
      !controller ||
      controller.signal.aborted ||
      relationshipsLoading.value
    )
      return

    relationshipsLoading.value = true
    relationshipsError.value = ''
    try {
      const page = await getEntityRelationships(current.profile.id, cursor, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || investigation.value !== current) return
      current.relationships.push(...page.relationships)
      current.relationshipCount = page.relationshipCount
      current.nextRelationship = page.nextRelationship
    } catch (requestError) {
      if (!controller.signal.aborted) relationshipsError.value = (requestError as Error).message
    } finally {
      if (!controller.signal.aborted) relationshipsLoading.value = false
    }
  }

  async function loadMoreRecords() {
    const current = investigation.value
    const cursor = current?.nextRecord
    const controller = activeController
    if (!current || !cursor || !controller || controller.signal.aborted || recordsLoading.value)
      return

    recordsLoading.value = true
    recordsError.value = ''
    try {
      const page = await getEntityRecords(current.profile.id, cursor, { signal: controller.signal })
      if (controller.signal.aborted || investigation.value !== current) return
      current.records.push(...page.records)
      current.recordCount = page.recordCount
      current.nextRecord = page.nextRecord
    } catch (requestError) {
      if (!controller.signal.aborted) recordsError.value = (requestError as Error).message
    } finally {
      if (!controller.signal.aborted) recordsLoading.value = false
    }
  }

  return {
    investigation,
    loading,
    error,
    relationshipsLoading,
    relationshipsError,
    recordsLoading,
    recordsError,
    loadMoreRelationships,
    loadMoreRecords,
  }
}
