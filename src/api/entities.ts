import type { EntityInvestigation } from '@shared/api/entities'
import { requestJson } from './request'

type RequestOptions = { signal?: AbortSignal }
const investigationFallback = 'Unable to load entity investigation. Please try again.'

export function getEntityInvestigation(
  entityId: string,
  options: RequestOptions = {},
): Promise<EntityInvestigation> {
  return requestJson(
    `/api/entities/${encodeURIComponent(entityId)}`,
    options.signal,
    investigationFallback,
  )
}

export function getEntityRelationships(
  entityId: string,
  next: string,
  options: RequestOptions = {},
): Promise<Pick<EntityInvestigation, 'relationships' | 'relationshipCount' | 'nextRelationship'>> {
  const query = new URLSearchParams({ next })
  return requestJson(
    `/api/entities/${encodeURIComponent(entityId)}/relationships?${query}`,
    options.signal,
  )
}

export function getEntityRecords(
  entityId: string,
  next: string,
  options: RequestOptions = {},
): Promise<Pick<EntityInvestigation, 'records' | 'recordCount' | 'nextRecord'>> {
  const query = new URLSearchParams({ next })
  return requestJson(
    `/api/entities/${encodeURIComponent(entityId)}/records?${query}`,
    options.signal,
  )
}
