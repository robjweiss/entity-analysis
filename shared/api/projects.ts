export type RiskLevel = 'critical' | 'high' | 'elevated' | 'relevant'

export type ProjectPage = {
  projects: { id: string; label: string }[]
  next?: string
  prev?: string
}

export type ProjectCount = { count: number; qualifier: 'eq' | 'gte' }

export type ProjectExposure = {
  total: ProjectCount
  categories: {
    sanctions: ProjectCount
    forcedLabor: ProjectCount
    exportControls: ProjectCount
    adverseMedia: ProjectCount
  }
}

export type ProjectRiskChanges = {
  from: string
  to: string
  changes: {
    projectEntityId: string
    entityName?: string
    factor: string
    changeType: 'added' | 'removed'
    timestamp: string
  }[]
  hasMore: boolean
}

export type EntityPage = {
  entities: {
    id: string
    label: string
    countries: string[]
    riskCategories: { id: string; label: string }[]
    riskFactors: { id: string; label: string }[]
    riskSeverity?: RiskLevel
    matches?: { id: string; label: string }[]
  }[]
  next?: string
  prev?: string
}

export type EntityDetail = {
  riskFactors: {
    id: string
    label: string
    level: RiskLevel
    riskCategories: { id: string; label: string }[]
    sourceEntityIds: string[]
    networkPaths: {
      sayariEntityId: string
      sayariEntityLabel: string
      relationshipType: string
      relationshipStatus?: string
      former?: boolean
      firstObserved?: string
      lastObserved?: string
      startDate?: string
      shares?: {
        percentage?: number | null
        numShares?: number | null
        monetaryValue?: number | null
      }
    }[][]
  }[]
  riskChanges: {
    id: string
    timestamp: string
    changeType: 'added' | 'removed'
  }[]
  nextRiskChange?: string
}
