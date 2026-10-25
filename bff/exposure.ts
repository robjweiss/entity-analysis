import { SayariEnvironment, SayariError } from '@sayari/sdk'
import type { ProjectCount, ProjectExposure, ProjectRiskChanges } from '#shared/api/projects'

async function requestSayari(url: URL, token: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new SayariError({ statusCode: response.status })
  return response.json()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCount(value: unknown): ProjectCount {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.count) ||
    (value.count as number) < 0 ||
    (value.qualifier !== 'eq' && value.qualifier !== 'gte')
  ) {
    throw new Error('Unexpected Sayari project entity count response.')
  }
  return { count: value.count as number, qualifier: value.qualifier }
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
    if (!isRecord(body)) throw new Error('Unexpected Sayari project entity count response.')
    return parseCount(body.size)
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
): Promise<ProjectRiskChanges> {
  const to = now.toISOString()
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const url = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/entities/changes/risk`,
    SayariEnvironment.Production,
  )
  url.searchParams.set('limit', '6')
  url.searchParams.set('sort.date', 'desc')
  // Use calendar dates and enforce the precise rolling window on factor timestamps below.
  url.searchParams.set('filter.from', from.slice(0, 10))
  url.searchParams.set('filter.to', to.slice(0, 10))

  const body = await requestSayari(url, token)
  if (
    !isRecord(body) ||
    !isRecord(body.data) ||
    (body.next !== undefined && body.next !== null && typeof body.next !== 'string')
  ) {
    throw new Error('Unexpected Sayari project risk changes response.')
  }
  const groups = body.data.risk_changes
  if (groups === undefined && Object.keys(body.data).length === 0) {
    return { from, to, changes: [], hasMore: false }
  }
  if (!Array.isArray(groups)) throw new Error('Unexpected Sayari project risk changes response.')

  const changes: ProjectRiskChanges['changes'] = []
  for (const group of groups) {
    if (
      !isRecord(group) ||
      typeof group.project_entity_id !== 'string' ||
      !Array.isArray(group.risk_factors) ||
      (group.label !== undefined && typeof group.label !== 'string')
    ) {
      throw new Error('Unexpected Sayari project risk changes response.')
    }
    for (const factor of group.risk_factors) {
      if (
        !isRecord(factor) ||
        typeof factor.id !== 'string' ||
        typeof factor.timestamp !== 'string' ||
        !Number.isFinite(Date.parse(factor.timestamp)) ||
        (factor.change_type !== 'added' && factor.change_type !== 'removed')
      ) {
        throw new Error('Unexpected Sayari project risk changes response.')
      }
      if (
        Date.parse(factor.timestamp) < Date.parse(from) ||
        Date.parse(factor.timestamp) > now.getTime()
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
  return {
    from,
    to,
    changes: changes.slice(0, 5),
    hasMore: changes.length > 5 || (!!body.next && changes.length > 0),
  }
}
