import type { RiskCategoryOptions } from '@shared/api/riskCategories'
import { requestJson } from './request'

export function listRiskCategories(
  options: { signal?: AbortSignal } = {},
): Promise<RiskCategoryOptions> {
  return requestJson('/api/risk-categories', options.signal)
}
