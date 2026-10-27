import { SayariEnvironment } from '@sayari/sdk'
import type { ProjectExposure, ProjectRiskChanges } from '#shared/api/projects'
import { RequestValidationError } from './httpErrors.ts'
import { fetchUpstreamJson, UpstreamPayloadError } from './sayariRequest.ts'
import { getRiskFactors } from './projects.ts'
import {
  projectExposureCountResponseSchema,
  projectWideRiskChangesSchema,
} from './projectSchemas.ts'

async function requestSayari(url: URL, token: string): Promise<unknown> {
  return fetchUpstreamJson<unknown>(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
}

export async function getProjectExposure(
  projectId: string,
  token: string,
): Promise<ProjectExposure> {
  const categories = {
    sanctions: 'sanctions',
    forcedLabor: 'forced_labor',
    exportControls: 'export_controls',
    adverseMedia: 'adverse_media',
  } as const
  const loadCount = async (category?: string) => {
    const url = new URL(
      `/v1/projects/${encodeURIComponent(projectId)}/entities`,
      SayariEnvironment.Production,
    )
    url.searchParams.set('limit', '1')
    if (category) url.searchParams.set('filter[risk_category]', category)
    const body = await requestSayari(url, token)
    const result = projectExposureCountResponseSchema.safeParse(body)
    if (!result.success) throw new UpstreamPayloadError('Unexpected Sayari project entity count response.')
    return result.data.size
  }

  const [total, sanctions, forcedLabor, exportControls, adverseMedia] = await Promise.all([
    loadCount(),
    ...Object.values(categories).map(loadCount),
  ])
  return { total, categories: { sanctions, forcedLabor, exportControls, adverseMedia } }
}

export async function getProjectRiskChanges(
  projectId: string,
  token: string,
  now = new Date(),
  pagination: { next?: string; asOf?: string } = {},
): Promise<ProjectRiskChanges> {
  if (Boolean(pagination.next) !== Boolean(pagination.asOf)) {
    throw new RequestValidationError('Provide both "next" and "asOf" to load more changes.', 'next')
  }
  const to = pagination.asOf ?? now.toISOString()
  if (!Number.isFinite(Date.parse(to)) || new Date(to).toISOString() !== to ||
    Date.parse(to) > now.getTime()) {
    throw new RequestValidationError('"asOf" must be a valid past ISO timestamp.', 'asOf')
  }
  const from = new Date(Date.parse(to) - 7 * 86400000).toISOString()
  const url = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/entities/changes/risk`,
    SayariEnvironment.Production,
  )
  url.searchParams.set('limit', '6')
  url.searchParams.set('sort.date', 'desc')
  // Use calendar dates and enforce the precise rolling window on factor timestamps below.
  url.searchParams.set('filter.from', from.slice(0, 10))
  url.searchParams.set('filter.to', to.slice(0, 10))
  if (pagination.next) url.searchParams.set('next', pagination.next)

  const response = await requestSayari(url, token)
  const result = projectWideRiskChangesSchema.safeParse(response)
  if (!result.success) throw new UpstreamPayloadError('Unexpected Sayari project risk changes response.')
  const body = result.data
  const groups = body.data.risk_changes
  if (groups === undefined && Object.keys(body.data).length === 0) {
    const next = typeof body.next === 'string' && body.next ? body.next : undefined
    return { from, to, changes: [], hasMore: Boolean(next), next }
  }
  if (!groups) throw new UpstreamPayloadError('Unexpected Sayari project risk changes response.')

  const changes: ProjectRiskChanges['changes'] = []
  for (const group of groups) {
    for (const factor of group.risk_factors) {
      if (
        Date.parse(factor.timestamp) < Date.parse(from) ||
        Date.parse(factor.timestamp) > Date.parse(to)
      )
        continue
      changes.push({
        projectEntityId: group.project_entity_id,
        ...(group.label && { entityName: group.label }),
        factor: factor.id,
        changeType: factor.change_type,
        timestamp: factor.timestamp,
      })
    }
  }
  changes.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  const labels = changes.length ? await getRiskFactors(token) : new Map<string, { label: string }>()
  const display = changes.map((change) => {
    const label = labels.get(change.factor)?.label
    return { ...change, ...(label && { factorLabel: label }) }
  })
  const upcoming = typeof body.next === 'string' && body.next ? body.next : undefined
  return {
    from,
    to,
    changes: display,
    hasMore: Boolean(upcoming),
    next: upcoming,
  }
}
