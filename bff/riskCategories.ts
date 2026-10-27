import { SayariEnvironment } from '@sayari/sdk'
import type { RiskCategoryOptions } from '#shared/api/riskCategories'
import { UpstreamPayloadError, fetchUpstreamJson } from './sayariRequest.ts'
import { riskCategoryOntologyResponseSchema } from './sayariSchemas.ts'

function displayLabel(id: string) {
  const label = id.replace(/_/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export async function getRiskCategoryOptions(token: string): Promise<RiskCategoryOptions> {
  const url = new URL('/v1/ontology/risk_factors', SayariEnvironment.Production)
  const body = await fetchUpstreamJson<unknown>(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })

  // SDK 0.1.44 rejects live ontology records with omitted do_not_render_metadata;
  // this endpoint only needs the wire-level category IDs.
  const result = riskCategoryOntologyResponseSchema.safeParse(body)
  if (!result.success) {
    throw new UpstreamPayloadError('Unexpected Sayari risk-factor ontology response.')
  }

  const ids = new Set(result.data.data.flatMap(({ categories }) => categories))
  const categories = [...ids]
    .map((id) => ({ id, label: displayLabel(id) }))
    .sort((left, right) => left.label.localeCompare(right.label))

  return { categories }
}
