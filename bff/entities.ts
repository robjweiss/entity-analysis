import type { SayariClient } from '@sayari/sdk'
import { SayariEnvironment, SayariError } from '@sayari/sdk'
import { getAccessToken } from './sayari.ts'
import { entityRiskOntologyEntrySchema, riskFactorOntologyResponseSchema } from './sayariSchemas.ts'
import type { EntityInvestigation } from '#shared/api/entities'

export type { EntityInvestigation } from '#shared/api/entities'

function mapRecordPage(entity: Awaited<ReturnType<SayariClient['entity']['getEntity']>>) {
  const page = entity.referencedBy
  return {
    records: (page?.data ?? []).map(({ record, type }) => ({
      id: record.id,
      label: record.label,
      type,
      publicationDate: record.publicationDate,
      acquisitionDate: record.acquisitionDate,
    })),
    recordCount: page?.size.count ?? page?.data.length ?? 0,
    nextRecord: typeof page?.next === 'string' ? page.next : undefined,
  }
}

function mapRelationshipPage(entity: Awaited<ReturnType<SayariClient['entity']['getEntity']>>) {
  const page = entity.relationships
  return {
    relationships: (page?.data ?? []).map((relationship) => ({
      id: relationship.target.id,
      label: relationship.target.label,
      countries: relationship.target.countries,
      types: Object.keys(relationship.types).map(displayLabel),
      sanctioned: relationship.target.sanctioned,
      pep: relationship.target.pep,
    })),
    relationshipCount: page?.size.count ?? page?.data.length ?? 0,
    nextRelationship: typeof page?.next === 'string' ? page.next : undefined,
  }
}

function displayLabel(id: string) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const severityOrder = { critical: 4, high: 3, elevated: 2, relevant: 1 } as const
type RiskLevel = keyof typeof severityOrder

function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && value in severityOrder
}

async function getRiskOntology(client: SayariClient) {
  // SDK 0.1.44 rejects some live ontology objects, so parse only the label and
  // description fields used by the investigation view.
  const token = await getAccessToken(client)
  const response = await fetch(new URL('/v1/ontology/risk_factors', SayariEnvironment.Production), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new SayariError({ statusCode: response.status })
  const body: unknown = await response.json()
  const ontologyResult = riskFactorOntologyResponseSchema.safeParse(body)
  if (!ontologyResult.success) throw new Error('Unexpected Sayari risk-factor ontology response.')

  return new Map(
    ontologyResult.data.data.flatMap((risk) => {
      const result = entityRiskOntologyEntrySchema.safeParse(risk)
      return result.success ? [[result.data.id, result.data] as const] : []
    }),
  )
}

export async function getEntityInvestigation(client: SayariClient, id: string): Promise<EntityInvestigation> {
  const [summary, entity, ontology] = await Promise.all([
    client.entity.entitySummary(id),
    client.entity.getEntity(id, {
      attributesNameLimit: 10,
      attributesAddressLimit: 10,
      attributesBusinessPurposeLimit: 10,
      relationshipsLimit: 10,
      referencedByLimit: 10,
    }),
    getRiskOntology(client),
  ])

  const attributes = summary.attributes
  const values = (attribute: unknown) => {
    const data = (attribute as { data?: { properties?: { value?: unknown } }[] } | undefined)?.data
    return Array.isArray(data)
      ? data.map((item) => item.properties?.value).filter((value): value is string => typeof value === 'string')
      : []
  }
  const relationshipPage = mapRelationshipPage(entity)
  const recordPage = mapRecordPage(entity)
  const risks = Object.entries(summary.risk ?? {})
    .flatMap(([id, risk]) => {
      const item = risk as { level?: unknown }
      if (!isRiskLevel(item.level)) return []
      const definition = ontology.get(id)
      return [{
        id,
        label: definition?.label || displayLabel(id),
        description: definition?.description,
        level: item.level,
      }]
    })
    .sort((left, right) => severityOrder[right.level] - severityOrder[left.level] || left.label.localeCompare(right.label))

  return {
    profile: {
      id: summary.id,
      label: summary.label,
      type: summary.type,
      countries: summary.countries,
      registrationDate: summary.registrationDate,
      companyType: summary.companyType,
      latestStatus: summary.latestStatus?.status,
      sanctioned: summary.sanctioned,
      pep: summary.pep,
      closed: summary.closed,
      identifiers: summary.identifiers.map(({ label, value }) => ({ label, value })),
      names: values(attributes?.name),
      addresses: summary.addresses ?? [],
      businessPurposes: values(attributes?.businessPurpose),
      sources: Object.values(summary.sourceCount ?? []).map(({ label, count }) => ({ label, count })).sort((left, right) => right.count - left.count),
    },
    risks,
    relationships: relationshipPage.relationships,
    relationshipCount: relationshipPage.relationshipCount,
    nextRelationship: relationshipPage.nextRelationship,
    records: recordPage.records,
    recordCount: recordPage.recordCount,
    nextRecord: recordPage.nextRecord,
  }
}

export async function getMoreEntityRelationships(client: SayariClient, id: string, next: string) {
  const entity = await client.entity.getEntity(id, {
    attributesAdditionalInformationLimit: 1,
    attributesAddressLimit: 1,
    attributesBusinessPurposeLimit: 1,
    attributesCompanyTypeLimit: 1,
    attributesCountryLimit: 1,
    attributesIdentifierLimit: 1,
    attributesNameLimit: 1,
    attributesStatusLimit: 1,
    relationshipsLimit: 10,
    relationshipsNext: next,
    possiblySameAsLimit: 1,
    referencedByLimit: 1,
  })
  return mapRelationshipPage(entity)
}

export async function getMoreEntityRecords(client: SayariClient, id: string, next: string) {
  const entity = await client.entity.getEntity(id, {
    attributesAdditionalInformationLimit: 1,
    attributesAddressLimit: 1,
    attributesBusinessPurposeLimit: 1,
    attributesCompanyTypeLimit: 1,
    attributesCountryLimit: 1,
    attributesIdentifierLimit: 1,
    attributesNameLimit: 1,
    attributesStatusLimit: 1,
    relationshipsLimit: 1,
    possiblySameAsLimit: 1,
    referencedByLimit: 10,
    referencedByNext: next,
  })
  return mapRecordPage(entity)
}
