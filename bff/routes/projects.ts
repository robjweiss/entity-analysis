import { Sayari } from '@sayari/sdk'
import { Router, type Request, type Response } from 'express'
import { RequestValidationError, sendRouteError } from '../httpErrors.ts'
import { getProjectEntities, getProjectEntityDetail, getProjects } from '../projects.ts'
import { getSayariClient } from '../sayari.ts'

const countryCodes = new Set<string>(Object.values(Sayari.Country))
const queryLimits = { cursor: 4096, filter: 500 }

function isCountry(value: string): value is Sayari.Country {
  return countryCodes.has(value)
}

function validateSupportedQuery(request: Request, supported: string[]) {
  const unsupported = Object.keys(request.query).find((key) => !supported.includes(key))
  if (unsupported) {
    throw new RequestValidationError(
      `Unsupported query parameter "${unsupported}". Supported parameters: ${supported.join(', ')}.`,
      unsupported,
    )
  }
}

function queryValue(parameter: string, value: unknown, maxLength = queryLimits.filter): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new RequestValidationError(`"${parameter}" must be provided as a single value.`, parameter)
  }

  const normalizedValue = value.trim()
  if (normalizedValue.length > maxLength) {
    throw new RequestValidationError(
      `"${parameter}" must be no longer than ${maxLength} characters.`, parameter,
    )
  }

  return normalizedValue || undefined
}

function pathId(parameter: string, value: string): string {
  if (!value || !value.trim() || value.length > queryLimits.filter || value !== value.trim()) {
    throw new RequestValidationError(
      `"${parameter}" must be a non-empty identifier with no surrounding whitespace and no more than ${queryLimits.filter} characters.`,
      parameter,
    )
  }

  return value
}

function countryValue(value: unknown): Sayari.Country | undefined {
  const country = queryValue('country', value)
  if (!country) return undefined
  if (!isCountry(country)) {
    throw new RequestValidationError(
      '"country" must be a recognized ISO 3166-1 alpha-3 code, such as JPN.',
      'country',
    )
  }
  return country
}

function paginationCursors(request: Request) {
  const next = queryValue('next', request.query.next, queryLimits.cursor)
  const prev = queryValue('prev', request.query.prev, queryLimits.cursor)
  if (next && prev) {
    throw new RequestValidationError('Use either "next" or "prev" pagination, not both.')
  }
  return { next, prev }
}

export async function listProjects(request: Request, response: Response) {
  try {
    validateSupportedQuery(request, ['next', 'prev'])
    response.json(await getProjects(getSayariClient(), paginationCursors(request)))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load projects. Please try again shortly.')
  }
}

export async function listProjectEntities(request: Request<{ projectId: string }>, response: Response) {
  try {
    validateSupportedQuery(request, ['name', 'country', 'riskCategory', 'next', 'prev'])
    const projectId = pathId('projectId', request.params.projectId)
    const name = queryValue('name', request.query.name)
    const country = countryValue(request.query.country)
    const riskCategory = queryValue('riskCategory', request.query.riskCategory)
    const cursors = paginationCursors(request)

    response.json(await getProjectEntities(getSayariClient(), projectId, {
      name, country, riskCategory, ...cursors,
    }))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load project entities. Please try again shortly.')
  }
}

export async function getProjectEntityDetails(
  request: Request<{ projectId: string; entityId: string }>,
  response: Response,
) {
  try {
    validateSupportedQuery(request, [])
    const projectId = pathId('projectId', request.params.projectId)
    const entityId = pathId('entityId', request.params.entityId)
    response.json(await getProjectEntityDetail(getSayariClient(), projectId, entityId))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load entity risk details. Please try again shortly.')
  }
}

const router = Router()
router.get('/', listProjects)
router.get('/:projectId/entities', listProjectEntities)
router.get('/:projectId/entities/:entityId', getProjectEntityDetails)

export default router
