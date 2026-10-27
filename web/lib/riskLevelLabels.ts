import type { RiskLevel } from '@shared/api/projects'

export const riskLevelLabels: Record<RiskLevel, string> = {
  critical: 'Critical',
  high: 'High',
  elevated: 'Elevated',
  relevant: 'Relevant',
}
