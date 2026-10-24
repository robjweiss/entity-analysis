import express from 'express'
import { sendNotFound } from './httpErrors.ts'
import projectRoutes from './routes/projects.ts'

export function createApp() {
  const app = express()

  app.use('/api/projects', projectRoutes)
  app.use('/api', (_request, response) => sendNotFound(response))

  return app
}
