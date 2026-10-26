import { SayariEnvironment, SayariError, type SayariClient } from '@sayari/sdk'
import type { Sayari } from '@sayari/sdk'
import type { EntityDetail, EntityPage, ProjectPage } from '#shared/api/projects'
import {
  projectEntityListSchema,
  projectEntityRiskChangesSchema,
  projectEntityRiskSummarySchema,
} from './projectSchemas.ts'
import { projectRiskFactorOntologyResponseSchema } from './sayariSchemas.ts'

export type EntityFilters = {
  name?: string
  country?: Sayari.Country
  riskCategory?: string
  next?: string
  prev?: string
}

type RiskFactorMetadata = { label: string; level: Sayari.RiskLevel }

const riskSeverityOrder: Record<Sayari.RiskLevel, number> = {
  critical: 4,
  high: 3,
  elevated: 2,
  relevant: 1,
}
export async function getRiskFactors(token: string): Promise<Map<string, RiskFactorMetadata>> {
  const url = new URL('/v1/ontology/risk_factors', SayariEnvironment.Production)
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new SayariError({ statusCode: response.status })
  const body: unknown = await response.json()
  const ontologyResult = projectRiskFactorOntologyResponseSchema.safeParse(body)
  if (!ontologyResult.success) {
    throw new Error('Unexpected Sayari risk-factor ontology response.')
  }

  const riskFactors = new Map<string, RiskFactorMetadata>()
  for (const factor of ontologyResult.data.data) {
    riskFactors.set(factor.id, {
      label: factor.label || factor.id.replace(/_/g, ' '),
      level: factor.level,
    })
  }
  return riskFactors
}

function maximumRiskSeverity(
  riskFactors: { id: string }[],
  ontology: Map<string, RiskFactorMetadata>,
): Sayari.RiskLevel | undefined {
  return riskFactors.reduce<Sayari.RiskLevel | undefined>((maximum, { id }) => {
    const level = ontology.get(id)?.level
    if (!level || (maximum && riskSeverityOrder[level] <= riskSeverityOrder[maximum]))
      return maximum
    return level
  }, undefined)
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

  // The SDK parser rejects live ontology records that omit do_not_render_metadata.
  // Fetch and narrowly parse the wire response until its schema is corrected.
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new SayariError({ statusCode: response.status })
  const body: unknown = await response.json()
  const pageResult = projectEntityListSchema.safeParse(body)
  if (!pageResult.success) throw new Error('Unexpected Sayari entity response.')
  const page = pageResult.data
  const riskFactorOntology = await getRiskFactors(token)

  return {
    entities: page.data.map((entity) => {
      const mappedEntity: EntityPage['entities'][number] = {
        id: entity.project_entity_id,
        label: entity.label,
        countries: entity.countries,
        riskCategories: entity.risk_categories.map(({ id, label }) => ({ id, label })),
        riskFactors: entity.risk_factors.map(({ id }) => ({
          id,
          label: riskFactorOntology.get(id)?.label ?? id.replace(/_/g, ' '),
        })),
        riskSeverity: maximumRiskSeverity(entity.risk_factors, riskFactorOntology),
      }
      const matches = (Array.isArray(entity.matches) ? entity.matches : []).filter(
        (match): match is { sayari_entity_id: string; label: string } =>
          typeof match === 'object' &&
          match !== null &&
          !Array.isArray(match) &&
          typeof match.sayari_entity_id === 'string' &&
          typeof match.label === 'string',
      )
      if (matches.length) {
        mappedEntity.matches = matches.map((match) => ({
          id: match.sayari_entity_id,
          label: match.label,
        }))
      }

      return mappedEntity
    }),
    next: page.next ?? undefined,
    prev: page.prev ?? undefined,
  }
}

export async function getProjectEntityDetail(
  projectId: string,
  entityId: string,
  token: string,
): Promise<EntityDetail> {
  // SDK 0.1.44 rejects live responses here (boolean factor values, incomplete
  // network paths, and empty risk-change data). Parse only the fields we use.
  const fetchEndpoint = async (endpoint: string, url: URL): Promise<unknown> => {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(60_000),
      })
      if (!response.ok) throw new SayariError({ statusCode: response.status })
      const body: unknown = await response.json()
      return body
    } catch (error) {
      console.error(`Sayari project entity ${endpoint} request failed`, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        statusCode: error instanceof SayariError ? error.statusCode : undefined,
      })
      throw error
    }
  }

  // An explicit filter={} returns 422; the SDK's empty filter serializes to no query parameter.
  const summaryUrl = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/entities/${encodeURIComponent(entityId)}/risk_summary`,
    SayariEnvironment.Production,
  )
  const changesUrl = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/entities/${encodeURIComponent(entityId)}/changes/risk`,
    SayariEnvironment.Production,
  )
  changesUrl.searchParams.set('limit', '100')

  const [summaryBody, changesBody] = await Promise.all([
    fetchEndpoint('risk_summary', summaryUrl),
    fetchEndpoint('risk_changes', changesUrl),
  ])
  const summaryResult = projectEntityRiskSummarySchema.safeParse(summaryBody)
  if (!summaryResult.success) throw new Error('Unexpected Sayari risk summary response.')
  const changesResult = projectEntityRiskChangesSchema.safeParse(changesBody)
  if (!changesResult.success) throw new Error('Unexpected Sayari risk changes response.')
  const summary = summaryResult.data
  const changes = changesResult.data

  const riskFactors = summary.data?.risk_factors
  if (!Array.isArray(riskFactors)) throw new Error('Unexpected Sayari risk summary response.')

  return {
    riskFactors: riskFactors.map((factor) => ({
      id: factor.id,
      label: factor.label,
      level: factor.level,
      riskCategories: (factor.risk_categories ?? []).map(({ id, label }) => ({ id, label })),
      sourceEntityIds: factor.source_entity_ids ?? [],
      networkPaths: (factor.network_paths ?? []).map((path) =>
        path.map((entity) => ({
          sayariEntityId: entity.sayari_entity_id,
          sayariEntityLabel: entity.sayari_entity_label,
          relationshipType: entity.relationship_type,
          relationshipStatus: entity.relationship_status,
          former: entity.former,
          firstObserved: entity.first_observed,
          lastObserved: entity.last_observed,
          startDate: entity.start_date,
          shares: entity.shares ? {
            percentage: entity.shares.percentage ?? undefined,
            numShares: entity.shares.num_shares ?? undefined,
            monetaryValue: entity.shares.monetary_value ?? undefined,
          } : undefined,
        })),
      ),
    })),
    riskChanges: (changes.data?.risk_factors ?? []).map(({ id, timestamp, change_type }) => ({
      id,
      timestamp,
      changeType: change_type,
    })),
    nextRiskChange: changes.next ?? undefined,
  }
}
