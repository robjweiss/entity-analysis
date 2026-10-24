import type { SayariClient } from '@sayari/sdk'
import { describe, expect, it, vi } from 'vitest'
import { getProjectEntities, getProjectEntityDetail, getProjects } from './projects.ts'

function createClient() {
  const getProjects = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: [{ id: 'project-1', label: 'Supplier review' }], next: 'next-project',
  })
  const getProjectEntities = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: [{
      projectEntityId: 'entity-1', label: 'Example supplier', countries: ['JPN'],
      riskCategories: [{ id: 'sanctions', label: 'Sanctions', riskFactors: ['sanctioned'] }],
      riskFactors: [{ id: 'sanctioned' }], upstream: { products: ['8536'] },
    }],
    nextToken: 'next-entity', size: { count: 1, qualifier: 'eq' },
  })
  const getProjectEntityRiskSummary = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: { riskFactors: [{
      id: 'sanctioned', label: 'Sanctioned', level: 'critical',
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      sourceEntityIds: ['source-1'], networkPaths: [[]],
    }] },
  })
  const getProjectEntityRiskChanges = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
    data: { riskFactors: [{ id: 'sanctioned', timestamp: '2026-10-20', changeType: 'added' }] },
    next: 'next-change',
  })
  const client = {
    project: { getProjects },
    projectEntity: { getProjectEntities, getProjectEntityRiskSummary, getProjectEntityRiskChanges },
  } as unknown as SayariClient

  return { client, getProjects, getProjectEntities, getProjectEntityRiskSummary, getProjectEntityRiskChanges }
}

describe('priority queue Sayari gateway', () => {
  it('loads unarchived projects with an upstream cursor', async () => {
    const { client, getProjects: getProjectsMock } = createClient()
    await getProjects(client, { next: 'cursor' })

    expect(getProjectsMock).toHaveBeenCalledWith({ archived: false, limit: 100, next: 'cursor', prev: undefined })
  })

  it('returns project labels and the next cursor', async () => {
    const { client } = createClient()

    expect(await getProjects(client)).toEqual({
      projects: [{ id: 'project-1', label: 'Supplier review' }], next: 'next-project', prev: undefined,
    })
  })

  it('passes partner filters to the SDK', async () => {
    const { client, getProjectEntities: getProjectEntitiesMock } = createClient()
    await getProjectEntities(client, 'project-1', {
      name: 'supplier', country: 'JPN', riskCategory: 'sanctions', next: 'cursor',
    })

    expect(getProjectEntitiesMock).toHaveBeenCalledWith('project-1', {
      limit: 25, next: 'cursor', prev: undefined,
      filter: { label: { fuzzy: ['supplier'] }, country: ['JPN'], riskCategory: ['sanctions'] },
    })
  })

  it('maps entity list fields without implying an overall severity', async () => {
    const { client } = createClient()
    const response = await getProjectEntities(client, 'project-1', {})

    expect(response.entities).toEqual([{
      id: 'entity-1', label: 'Example supplier', countries: ['JPN'],
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      riskFactors: ['sanctioned'], upstreamProducts: ['8536'],
    }])
  })

  it('loads summary and risk changes for a selected entity', async () => {
    const { client, getProjectEntityRiskSummary } = createClient()
    await getProjectEntityDetail(client, 'project-1', 'entity-1')

    expect(getProjectEntityRiskSummary).toHaveBeenCalledWith('project-1', 'entity-1', { filter: {} })
  })

  it('maps factor severity and source paths into details', async () => {
    const { client } = createClient()
    const response = await getProjectEntityDetail(client, 'project-1', 'entity-1')

    expect(response.riskFactors).toEqual([{
      id: 'sanctioned', label: 'Sanctioned', level: 'critical',
      riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
      sourceEntityIds: ['source-1'], networkPaths: [[]],
    }])
  })

  it('returns a cursor when risk changes have more pages', async () => {
    const { client } = createClient()
    const response = await getProjectEntityDetail(client, 'project-1', 'entity-1')

    expect(response.nextRiskChange).toBe('next-change')
  })
})
