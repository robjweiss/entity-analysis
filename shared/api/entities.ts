export type EntityInvestigation = {
  profile: {
    id: string
    label: string
    type: string
    countries: string[]
    registrationDate?: string
    companyType?: string
    latestStatus?: string
    sanctioned: boolean
    pep: boolean
    closed: boolean
    identifiers: { label: string; value: string }[]
    names: string[]
    addresses: string[]
    businessPurposes: string[]
    sources: { label: string; count: number }[]
  }
  risks: { id: string; label: string; description?: string; level: 'critical' | 'high' | 'elevated' | 'relevant' }[]
  relationships: { id: string; label: string; countries: string[]; types: string[]; sanctioned: boolean; pep: boolean }[]
  relationshipCount: number
  nextRelationship?: string
  records: { id: string; label: string; type: string; publicationDate?: string; acquisitionDate?: string }[]
  recordCount: number
  nextRecord?: string
}
