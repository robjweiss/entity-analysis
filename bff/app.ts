import express from 'express'

export type SayariGateway = {
  getCountries: () => Promise<{ data: unknown[]; totalCount: number }>
}

export function createApp(sayari: SayariGateway) {
  const app = express()

  // Temporary debug/example endpoint. Replace with feature-specific read routes
  // as the Sayari-backed product functionality is implemented.
  app.get('/api/sayari/debug/countries', async (_request, response) => {
    try {
      const countries = await sayari.getCountries()

      response.json({
        returned: countries.data.length,
        totalCount: countries.totalCount,
      })
    } catch {
      response.status(502).json({ error: 'The Sayari request failed.' })
    }
  })

  return app
}
