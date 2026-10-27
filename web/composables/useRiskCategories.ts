import { onMounted, onUnmounted, ref } from 'vue'
import { listRiskCategories } from '@/api/riskCategories'
import type { RiskCategory } from '@shared/api/riskCategories'

export function useRiskCategories() {
  const riskCategories = ref<RiskCategory[]>([])
  const riskCategoriesLoading = ref(true)
  const riskCategoriesError = ref('')
  let controller: AbortController | undefined

  async function loadRiskCategories() {
    controller?.abort()
    const requestController = new AbortController()
    controller = requestController
    riskCategoriesLoading.value = true
    riskCategoriesError.value = ''
    try {
      const result = await listRiskCategories({ signal: requestController.signal })
      if (!requestController.signal.aborted) riskCategories.value = result.categories
    } catch (error) {
      if (!requestController.signal.aborted) riskCategoriesError.value = (error as Error).message
    } finally {
      if (!requestController.signal.aborted) riskCategoriesLoading.value = false
    }
  }

  onMounted(loadRiskCategories)
  onUnmounted(() => controller?.abort())

  return { riskCategories, riskCategoriesLoading, riskCategoriesError, loadRiskCategories }
}
