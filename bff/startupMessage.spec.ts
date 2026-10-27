import { describe, expect, it } from 'vitest'
import { startupMessage } from './startupMessage.ts'

describe('startupMessage', () => {
  it('shows the UI and API URLs in production', () => {
    expect(startupMessage('0.0.0.0', 8787, true)).toBe(
      [
        'Entity Analysis is running',
        '  Web UI:    http://localhost:8787',
        '  API (BFF): http://localhost:8787/api',
      ].join('\n'),
    )
  })

  it('keeps development output BFF-only', () => {
    expect(startupMessage('127.0.0.1', 8787, false)).toBe(
      'Sayari BFF listening on http://127.0.0.1:8787',
    )
  })

  it('formats IPv6 addresses for browser URLs', () => {
    expect(startupMessage('::1', 8787, true)).toContain('http://[::1]:8787')
  })
})
