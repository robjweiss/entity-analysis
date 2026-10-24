import { SayariError } from '@sayari/sdk'
import type { Response } from 'express'

export class RequestValidationError extends Error {
  readonly parameter?: string

  constructor(message: string, parameter?: string) {
    super(message)
    this.name = 'RequestValidationError'
    this.parameter = parameter
  }
}

type ApiError = {
  code: string
  message: string
  parameter?: string
}

function sendError(response: Response, status: number, error: ApiError) {
  response.status(status).json({ error })
}

export function sendRouteError(response: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof RequestValidationError) {
    sendError(response, 400, {
      code: 'INVALID_PARAMETER',
      message: error.message,
      ...(error.parameter && { parameter: error.parameter }),
    })
    return
  }

  if (error instanceof SayariError) {
    if (error.statusCode === 404) {
      sendError(response, 404, {
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested Sayari project or entity was not found.',
      })
      return
    }

    if (error.statusCode === 400 || error.statusCode === 422) {
      sendError(response, 400, {
        code: 'UPSTREAM_REJECTED_REQUEST',
        message: 'Sayari rejected the request. Check the supplied filters and try again.',
      })
      return
    }

    if (error.statusCode === 429) {
      sendError(response, 503, {
        code: 'UPSTREAM_RATE_LIMITED',
        message: 'Sayari is temporarily rate limiting requests. Please try again shortly.',
      })
      return
    }
  }

  sendError(response, 502, {
    code: 'UPSTREAM_UNAVAILABLE',
    message: fallbackMessage,
  })
}

export function sendNotFound(response: Response) {
  sendError(response, 404, {
    code: 'ROUTE_NOT_FOUND',
    message: 'No API route matches this request.',
  })
}
