import { SayariError, SayariTimeoutError } from '@sayari/sdk'
import type { Response } from 'express'
import { UpstreamPayloadError, UpstreamTransportError } from './sayariRequest.ts'

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

  if (error instanceof UpstreamPayloadError) {
    sendError(response, 502, { code: 'UPSTREAM_INVALID_RESPONSE', message: fallbackMessage })
    return
  }
  if (error instanceof SayariTimeoutError) {
    sendError(response, 504, { code: 'UPSTREAM_TIMEOUT', message: fallbackMessage })
    return
  }
  if (error instanceof UpstreamTransportError) {
    const timeout = isTimeout(error.cause)
    sendError(response, timeout ? 504 : 503, {
      code: timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      message: fallbackMessage,
    })
    return
  }

  if (error instanceof SayariError) {
    if (error.statusCode === 408 || (error.statusCode === undefined && isTimeout(error.cause))) {
      sendError(response, 504, { code: 'UPSTREAM_TIMEOUT', message: fallbackMessage })
      return
    }
    if (error.statusCode === undefined) {
      sendError(response, 503, { code: 'UPSTREAM_UNAVAILABLE', message: fallbackMessage })
      return
    }
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
    const unavailable = error.statusCode === 503 || error.statusCode === 520
    sendError(response, unavailable ? 503 : 502, {
      code: unavailable ? 'UPSTREAM_UNAVAILABLE' : 'UPSTREAM_ERROR',
      message: fallbackMessage,
    })
    return
  }

  sendError(response, 500, {
    code: 'INTERNAL_ERROR',
    message: fallbackMessage,
  })
}

function isTimeout(error: unknown): boolean {
  const visited = new Set<object>()
  let current = error
  while (current && typeof current === 'object' && !visited.has(current)) {
    if ('name' in current && current.name === 'TimeoutError') return true
    visited.add(current)
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}

export function sendNotFound(response: Response) {
  sendError(response, 404, {
    code: 'ROUTE_NOT_FOUND',
    message: 'No API route matches this request.',
  })
}
