import express from 'express'
import { sendNotFound } from './httpErrors.ts'
import projectRoutes from './routes/projects.ts'
import entityRoutes from './routes/entities.ts'

export function createApp() {
  const app = express()

  app.use('/api/projects', projectRoutes)
  app.use('/api/entities', entityRoutes)
  app.use('/api', (_request, response) => sendNotFound(response))

  return app
}
