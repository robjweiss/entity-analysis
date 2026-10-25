import { SayariEnvironment, SayariError, type SayariClient } from '@sayari/sdk'
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

type SayariEntityPage = {
  data: {
    project_entity_id: string
    label: string
    countries: string[]
    risk_categories: { id: string; label: string }[]
    risk_factors: { id: string }[]
    upstream: { products: string[] }
  }[]
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
  projectId: string,
  filters: EntityFilters,
  token: string,
): Promise<EntityPage> {
  // @sayari/sdk@0.1.44 rejects the live entity-list response: attributes.*.values
  // contain { value } objects, not strings, and the cursor is "next", not "next_token".
  // Request only this endpoint directly until its SDK schema matches the API.
  const url = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/entities`,
    SayariEnvironment.Production,
  )
  url.searchParams.set('limit', '25')
  if (filters.name) url.searchParams.set('filter[label][fuzzy]', filters.name)
  if (filters.country) url.searchParams.set('filter[country]', filters.country)
  if (filters.riskCategory) url.searchParams.set('filter[risk_category]', filters.riskCategory)
  if (filters.next) url.searchParams.set('next', filters.next)
  if (filters.prev) url.searchParams.set('prev', filters.prev)

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new SayariError({ statusCode: response.status })
  const page = (await response.json()) as SayariEntityPage
  if (!Array.isArray(page?.data)) throw new Error('Unexpected Sayari entity response.')

  return {
    entities: page.data.map((entity) => ({
      id: entity.project_entity_id,
      label: entity.label,
      countries: entity.countries,
      riskCategories: entity.risk_categories.map(({ id, label }) => ({ id, label })),
      riskFactors: entity.risk_factors.map(({ id }) => id),
      upstreamProducts: entity.upstream.products,
    })),
    next: page.next,
    prev: page.prev,
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
