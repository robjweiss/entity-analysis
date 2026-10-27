export type ProjectEntityFilters = { name: string; country: string; riskCategory: string }

export const emptyProjectEntityFilters = (): ProjectEntityFilters => ({
  name: '',
  country: '',
  riskCategory: '',
})

export function normalizeProjectEntityFilters(filters: ProjectEntityFilters): ProjectEntityFilters {
  return {
    name: filters.name.trim(),
    country: filters.country.trim().toUpperCase(),
    riskCategory: filters.riskCategory.trim(),
  }
}
