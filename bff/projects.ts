import type { SayariClient } from '@sayari/sdk'
import type { Sayari } from '@sayari/sdk'

export type ProjectPage = {
  projects: { id: string; label: string }[]
  next?: string
  prev?: string
}

export type EntityPage = {
  entities: {
    id: string
    label: string
    countries: string[]
    riskCategories: { id: string; label: string }[]
    riskFactors: string[]
    upstreamProducts: string[]
  }[]
  next?: string
  prev?: string
  size: Sayari.QualifiedCount
}

export type EntityDetail = {
  riskFactors: {
    id: string
    label: string
    level: Sayari.RiskLevel
    riskCategories: { id: string; label: string }[]
    sourceEntityIds: string[]
    networkPaths: Sayari.ProjectEntityRiskSummaryNetworkPath[][]
  }[]
  riskChanges: {
    id: string
    timestamp: string
    changeType: Sayari.RiskChangeFactorChangeType
  }[]
  nextRiskChange?: string
}

export type EntityFilters = {
  name?: string
  country?: Sayari.Country
  riskCategory?: string
  next?: string
  prev?: string
}

export async function getProjects(
  client: SayariClient,
  cursors: { next?: string; prev?: string } = {},
): Promise<ProjectPage> {
  const response = await client.project.getProjects({ archived: false, limit: 100, ...cursors })

  return {
    projects: response.data.map(({ id, label }) => ({ id, label })),
    next: response.next,
    prev: response.prev,
  }
}

export async function getProjectEntities(
  client: SayariClient,
  projectId: string,
  filters: EntityFilters,
): Promise<EntityPage> {
  const response = await client.projectEntity.getProjectEntities(projectId, {
    limit: 25,
    next: filters.next,
    prev: filters.prev,
    filter: {
      ...(filters.name && { label: { fuzzy: [filters.name] } }),
      ...(filters.country && { country: [filters.country] }),
      ...(filters.riskCategory && { riskCategory: [filters.riskCategory] }),
    },
  })

  return {
    entities: response.data.map((entity) => ({
      id: entity.projectEntityId,
      label: entity.label,
      countries: entity.countries,
      riskCategories: entity.riskCategories.map(({ id, label }) => ({ id, label })),
      riskFactors: entity.riskFactors.map(({ id }) => id),
      upstreamProducts: entity.upstream.products,
    })),
    next: response.nextToken,
    prev: response.prevToken,
    size: response.size,
  }
}

export async function getProjectEntityDetail(
  client: SayariClient,
  projectId: string,
  entityId: string,
): Promise<EntityDetail> {
  const [summary, changes] = await Promise.all([
    client.projectEntity.getProjectEntityRiskSummary(projectId, entityId, { filter: {} }),
    client.projectEntity.getProjectEntityRiskChanges(projectId, entityId, { limit: 100 }),
  ])

  return {
    riskFactors: summary.data.riskFactors.map((factor) => ({
      id: factor.id,
      label: factor.label,
      level: factor.level,
      riskCategories: factor.riskCategories.map(({ id, label }) => ({ id, label })),
      sourceEntityIds: factor.sourceEntityIds,
      networkPaths: factor.networkPaths,
    })),
    riskChanges: changes.data.riskFactors.map(({ id, timestamp, changeType }) => ({
      id,
      timestamp,
      changeType,
    })),
    nextRiskChange: changes.next,
  }
}
