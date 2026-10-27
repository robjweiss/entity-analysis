import express from 'express'
import { resolve } from 'node:path'
import { sendNotFound } from './httpErrors.ts'
import projectRoutes from './routes/projects.ts'
import entityRoutes from './routes/entities.ts'
import riskCategoryRoutes from './routes/riskCategories.ts'

export function createApp({ staticDirectory }: { staticDirectory?: string } = {}) {
  const app = express()

  app.use('/api/projects', projectRoutes)
  app.use('/api/entities', entityRoutes)
  app.use('/api/risk-categories', riskCategoryRoutes)
  app.use('/api', (_request, response) => sendNotFound(response))

  if (staticDirectory) {
    app.use(express.static(staticDirectory))
    app.get('/{*path}', (request, response, next) => {
      if (!request.accepts('html') || request.path.startsWith('/assets/')) return next()
      response.sendFile(resolve(staticDirectory, 'index.html'))
    })
  }

  return app
}
