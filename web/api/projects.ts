import type {
  EntityDetail,
  EntityPage,
  ProjectExposure,
  ProjectPage,
  ProjectRiskChanges,
} from '@shared/api/projects'
import { requestJson } from './request'

type RequestOptions = { signal?: AbortSignal }
type ProjectPagination = { next?: string; prev?: string }
type EntityParams = {
  name?: string
  country?: string
  riskCategory?: string
  next?: string
  prev?: string
}
type RiskChangePagination = { next?: string; asOf?: string }

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

export function listProjects(
  pagination: ProjectPagination = {},
  options: RequestOptions = {},
): Promise<ProjectPage> {
  return requestJson(withQuery('/api/projects', pagination), options.signal)
}

export function listProjectEntities(
  projectId: string,
  params: EntityParams = {},
  options: RequestOptions = {},
): Promise<EntityPage> {
  const path = `/api/projects/${encodeURIComponent(projectId)}/entities`
  return requestJson(withQuery(path, params), options.signal)
}

export function getProjectEntityDetail(
  projectId: string,
  entityId: string,
  options: RequestOptions = {},
): Promise<EntityDetail> {
  return requestJson(
    `/api/projects/${encodeURIComponent(projectId)}/entities/${encodeURIComponent(entityId)}`,
    options.signal,
  )
}

export function getProjectExposure(
  projectId: string,
  options: RequestOptions = {},
): Promise<ProjectExposure> {
  return requestJson(`/api/projects/${encodeURIComponent(projectId)}/exposure`, options.signal)
}

export function getProjectRiskChanges(
  projectId: string,
  pagination: RiskChangePagination = {},
  options: RequestOptions = {},
): Promise<ProjectRiskChanges> {
  const path = `/api/projects/${encodeURIComponent(projectId)}/risk-changes`
  return requestJson(withQuery(path, pagination), options.signal)
}
