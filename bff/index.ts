import { createApp } from './app.ts'
import { fileURLToPath } from 'node:url'
import { startupMessage } from './startupMessage.ts'

const port = Number(process.env.PORT ?? 8787)
const host = process.env.HOST ?? '127.0.0.1'
const app = createApp({
  staticDirectory:
    process.env.NODE_ENV === 'production'
      ? fileURLToPath(new URL('../dist', import.meta.url))
      : undefined,
})

app.listen(port, host, () => {
  console.log(startupMessage(host, port, process.env.NODE_ENV === 'production'))
})
