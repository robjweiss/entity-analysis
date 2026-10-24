export const riskLevels = ['critical', 'high', 'elevated', 'relevant'] as const

export type RiskLevel = (typeof riskLevels)[number]

export type RiskChange = {
  factor: string
  changedAt: string
  type: 'added' | 'removed'
}

export type PriorityQueuePartner = {
  id: string
  name: string
  department: string
  countries: string[]
  products: string[]
  riskCategories: string[]
  riskFactors: string[]
  highestRiskLevel: RiskLevel
  riskChanges: RiskChange[]
}
