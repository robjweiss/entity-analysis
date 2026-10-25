import type { SayariClient } from '@sayari/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getEntityInvestigation, getMoreEntityRecords, getMoreEntityRelationships } from './entities.ts'

const summary = {
  id: 'entity-1', label: 'Example Supplier', type: 'company', countries: ['JPN'], sanctioned: true,
  pep: false, closed: false, registrationDate: 'Registered 2020-01-01', companyType: 'Kabushiki Kaisha',
  latestStatus: { status: 'active' }, identifiers: [{ label: 'Registration number', value: '123' }],
  addresses: ['1 Example Street, Tokyo'], sourceCount: { registry: { label: 'Japan Registry', count: 4 } },
  attributes: {
    name: { data: [{ properties: { value: 'Example Supplier' } }] },
    businessPurpose: { data: [{ properties: { value: 'Electronic components' } }] },
  },
  risk: {
    sanctioned: { level: 'critical', value: true },
    cpi_score: { level: 'relevant', value: 71 },
  },
}

const entity = {
  relationships: {
    size: { count: 11 }, next: 'more', data: [{
      target: { id: 'related-1', label: 'Example Holdings', countries: ['JPN'], sanctioned: false, pep: true },
      types: { has_shareholder: [] },
    }],
  },
  referencedBy: {
    size: { count: 12 }, next: 'more', data: [{
      type: 'about', record: { id: 'record-1', label: 'Company Record', source: 'registry', publicationDate: '2026-01-01', acquisitionDate: '2026-01-02', sourceUrl: 'https://example.com' },
    }],
  },
}

function createClient() {
  return {
    client: {
      entity: {
        entitySummary: vi.fn<() => Promise<typeof summary>>().mockResolvedValue(summary),
        getEntity: vi.fn<() => Promise<typeof entity>>().mockResolvedValue(entity),
      },
      auth: {
        getToken: vi.fn<() => Promise<{ accessToken: string; expiresIn: number }>>().mockResolvedValue({
          accessToken: 'test-token',
          expiresIn: 3600,
        }),
      },
    } as unknown as SayariClient,
  }
}

beforeEach(() => {
  vi.stubEnv('SAYARI_CLIENT_ID', 'client-id')
  vi.stubEnv('SAYARI_CLIENT_SECRET', 'client-secret')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [
    { id: 'sanctioned', label: 'Sanctioned', description: 'Sanctions-list signal.' },
    { id: 'cpi_score', label: 'CPI Score', description: 'Country-context score.' },
  ] }))))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('entity investigation Sayari gateway', () => {
  it('uses the SDK entity methods with bounded relationship and record requests', async () => {
    const { client } = createClient()
    await getEntityInvestigation(client, 'entity-1')

    expect(client.entity.getEntity).toHaveBeenCalledWith('entity-1', expect.objectContaining({ relationshipsLimit: 10, referencedByLimit: 10 }))
  })

  it('returns risk labels, severity, and descriptions without raw API values', async () => {
    const { client } = createClient()

    const result = await getEntityInvestigation(client, 'entity-1')

    expect(result.risks).toEqual([
      { id: 'sanctioned', label: 'Sanctioned', description: 'Sanctions-list signal.', level: 'critical' },
      { id: 'cpi_score', label: 'CPI Score', description: 'Country-context score.', level: 'relevant' },
    ])
  })

  it('maps relationship and record previews with their pagination state', async () => {
    const { client } = createClient()

    const result = await getEntityInvestigation(client, 'entity-1')

    expect(result).toMatchObject({
      relationshipCount: 11, nextRelationship: 'more', recordCount: 12, nextRecord: 'more',
      relationships: [{ label: 'Example Holdings', types: ['Has Shareholder'], pep: true }],
      records: [{ label: 'Company Record', type: 'about', acquisitionDate: '2026-01-02' }],
    })
  })

  it('uses the Sayari relationship cursor for the next bounded page', async () => {
    const { client } = createClient()

    await getMoreEntityRelationships(client, 'entity-1', 'opaque-next-token')

    expect(client.entity.getEntity).toHaveBeenCalledWith('entity-1', expect.objectContaining({
      relationshipsLimit: 10,
      relationshipsNext: 'opaque-next-token',
      attributesNameLimit: 1,
      referencedByLimit: 1,
    }))
  })

  it('uses the Sayari referenced-record cursor for the next bounded page', async () => {
    const { client } = createClient()

    const result = await getMoreEntityRecords(client, 'entity-1', 'opaque-record-token')

    expect(client.entity.getEntity).toHaveBeenCalledWith('entity-1', expect.objectContaining({
      referencedByLimit: 10,
      referencedByNext: 'opaque-record-token',
      relationshipsLimit: 1,
    }))
    expect(result.records).toEqual([{
      id: 'record-1', label: 'Company Record', type: 'about',
      publicationDate: '2026-01-01', acquisitionDate: '2026-01-02',
    }])
  })
})
