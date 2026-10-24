import { createApp } from './app.ts'
import { getSayariClient } from './sayari.ts'

const port = Number(process.env.PORT ?? 8787)
const app = createApp({
  getCountries: () => getSayariClient().ontology.getCountries(),
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Sayari BFF listening on http://127.0.0.1:${port}`)
})
