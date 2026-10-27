const displayHost = (host: string) => {
  if (host === '0.0.0.0' || host === '::') return 'localhost'
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
}

export const startupMessage = (host: string, port: number, production: boolean) => {
  const url = `http://${displayHost(host)}:${port}`
  if (!production) return `Sayari BFF listening on http://${host}:${port}`

  return [
    'Entity Analysis is running',
    `  Web UI:    ${url}`,
    `  API (BFF): ${url}/api`,
  ].join('\n')
}
