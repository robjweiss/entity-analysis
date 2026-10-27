import { Router, type Request, type Response } from 'express'
import { sendRouteError } from '../httpErrors.ts'
import { getRiskCategoryOptions } from '../riskCategories.ts'
import { getAccessToken, getSayariClient } from '../sayari.ts'

export async function listRiskCategories(_request: Request, response: Response) {
  try {
    response.json(await getRiskCategoryOptions(await getAccessToken(getSayariClient())))
  } catch (error) {
    sendRouteError(response, error, 'Unable to load risk categories. Please try again shortly.')
  }
}

const router = Router()
router.get('/', listRiskCategories)
export default router
