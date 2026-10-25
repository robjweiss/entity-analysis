import { Router, type Request, type Response } from 'express'
import { RequestValidationError, sendRouteError } from '../httpErrors.ts'
import { getEntityInvestigation, getMoreEntityRecords, getMoreEntityRelationships } from '../entities.ts'
import { getSayariClient } from '../sayari.ts'

export async function getEntityDetails(request: Request<{ entityId: string }>, response: Response) {
  try {
    if (Object.keys(request.query).length) {
      throw new RequestValidationError('This endpoint does not support query parameters.')
    }
    const entityId = request.params.entityId
    if (!entityId || entityId !== entityId.trim() || entityId.length > 500) {
      throw new RequestValidationError('"entityId" must be a non-empty identifier with no surrounding whitespace and no more than 500 characters.', 'entityId')
    }
    response.json(await getEntityInvestigation(getSayariClient(), entityId))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load entity investigation. Please try again shortly.')
  }
}

export async function getEntityRelationships(request: Request<{ entityId: string }>, response: Response) {
  try {
    const unsupported = Object.keys(request.query).find((key) => key !== 'next')
    if (unsupported) {
      throw new RequestValidationError(`Unsupported query parameter "${unsupported}". Supported parameters: next.`, unsupported)
    }
    const entityId = request.params.entityId
    if (!entityId || entityId !== entityId.trim() || entityId.length > 500) {
      throw new RequestValidationError('"entityId" must be a non-empty identifier with no surrounding whitespace and no more than 500 characters.', 'entityId')
    }
    const next = request.query.next
    if (typeof next !== 'string' || !next.trim() || next.length > 4096) {
      throw new RequestValidationError('"next" must be a non-empty pagination token no longer than 4096 characters.', 'next')
    }
    response.json(await getMoreEntityRelationships(getSayariClient(), entityId, next))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load more relationships. Please try again shortly.')
  }
}

export async function getEntityRecords(request: Request<{ entityId: string }>, response: Response) {
  try {
    const unsupported = Object.keys(request.query).find((key) => key !== 'next')
    if (unsupported) {
      throw new RequestValidationError(`Unsupported query parameter "${unsupported}". Supported parameters: next.`, unsupported)
    }
    const entityId = request.params.entityId
    if (!entityId || entityId !== entityId.trim() || entityId.length > 500) {
      throw new RequestValidationError('"entityId" must be a non-empty identifier with no surrounding whitespace and no more than 500 characters.', 'entityId')
    }
    const next = request.query.next
    if (typeof next !== 'string' || !next.trim() || next.length > 4096) {
      throw new RequestValidationError('"next" must be a non-empty pagination token no longer than 4096 characters.', 'next')
    }
    response.json(await getMoreEntityRecords(getSayariClient(), entityId, next))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load more supporting records. Please try again shortly.')
  }
}

const router = Router()
router.get('/:entityId/relationships', getEntityRelationships)
router.get('/:entityId/records', getEntityRecords)
router.get('/:entityId', getEntityDetails)
export default router
