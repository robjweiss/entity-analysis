import { test, expect } from '@playwright/test'

const eq = (count: number) => ({ count, qualifier: 'eq' })
const projects = { projects: [
  { id: 'one', label: 'First unit' }, { id: 'two', label: 'Second unit' },
], next: 'next-page' }
const exposure = {
  total: eq(10), categories: {
    sanctions: eq(6), forcedLabor: eq(5), exportControls: eq(3), adverseMedia: eq(2),
  },
}
const changes = {
  from: '2026-10-18T12:00:00.000Z', to: '2026-10-25T12:00:00.000Z', hasMore: true, next: 'sayari-next-token',
  changes: [{ projectEntityId: 'supplier-1', entityName: 'Supplier A', factor: 'forced_labor', changeType: 'added', timestamp: '2026-10-24T12:00:00Z' },
    { projectEntityId: 'supplier-2', factor: 'pep', changeType: 'removed', timestamp: '2026-10-23T12:00:00Z' }],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/projects**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/exposure')) {
      await route.fulfill({ json: url.pathname.includes('/two/') ? { ...exposure, total: eq(20) } : exposure })
    } else if (url.pathname.endsWith('/risk-changes')) {
      await route.fulfill({ json: url.searchParams.has('next')
        ? { ...changes, changes: [{ projectEntityId: 'supplier-3', factor: 'exports_bis_high_priority_items_critical_components_indirect', factorLabel: 'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List', changeType: 'added', timestamp: '2026-10-22T12:00:00Z' }], next: undefined, hasMore: false }
        : changes })
    } else {
      await route.fulfill({ json: url.searchParams.has('next')
        ? { projects: [{ id: 'third', label: 'Third unit' }], prev: 'previous-page' }
        : projects })
    }
  })
})

test('shows whole-project scope and overlapping risk themes with exact bars', async ({ page }) => {
  await page.goto('/executive')

  await expect(page.getByTestId('project-total')).toHaveText('Project entities: 10')
  await expect(page.getByTestId('theme-sanctions')).toContainText('6 of 10 project entities')
  await expect(page.getByTestId('theme-forcedLabor')).toContainText('5 of 10 project entities')
  await expect(page.getByTestId('theme-sanctions').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60')
  await expect(page.getByTestId('theme-sanctions').getByText('60%')).toBeVisible()
  await expect(page.getByText(/Categories overlap; these four themes are not an exhaustive breakdown/)).toBeVisible()
})

test('switches project scope and supports the next project page', async ({ page }) => {
  await page.goto('/executive')
  await expect(page.getByTestId('project-total')).toBeVisible()
  await page.getByTestId('exposure-project').selectOption('two')
  await expect(page.getByTestId('project-total')).toHaveText('Project entities: 20')
  await page.getByRole('button', { name: 'Next projects' }).click()
  await expect(page.getByTestId('exposure-project')).toHaveValue('third')
})

test('shows recent additions and removals without assuming an unnamed entity is a supplier', async ({ page }) => {
  await page.goto('/executive')

  await expect(page.getByText('Supplier A')).toBeVisible()
  await expect(page.getByText('Signal added')).toBeVisible()
  await expect(page.getByText('Signal removed')).toBeVisible()
  await expect(page.getByText('forced labor', { exact: true })).toBeVisible()
  await expect(page.getByText('Oct 24, 2026')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show more changes' })).toBeVisible()
})

test('reveals loaded changes five at a time without growing the scroll area', async ({ page }) => {
  let requests = 0
  await page.route('**/api/projects/one/risk-changes', async (route) => {
    requests += 1
    await route.fulfill({ json: { ...changes, next: undefined, hasMore: false, changes: Array.from({ length: 9 }, (_, i) => ({
      projectEntityId: `entity-${i}`, factor: `signal_${i}`, changeType: 'added', timestamp: '2026-10-24T12:00:00Z',
    })) } })
  })
  await page.goto('/executive')
  const list = page.getByRole('list', { name: 'Recent risk changes' })
  await expect(list.locator('li')).toHaveCount(5)
  await page.getByRole('button', { name: 'Show more changes' }).click()

  await expect(list.locator('li')).toHaveCount(9)
  expect(requests).toBe(1)
  expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
})

test('fetches Sayari’s next page only after loaded changes are exhausted', async ({ page }) => {
  let requestUrl = ''
  await page.route('**/api/projects/one/risk-changes?*', async (route) => {
    requestUrl = route.request().url()
    await route.fulfill({ json: { ...changes, changes: [{
      projectEntityId: 'supplier-3', factor: 'exports_bis_high_priority_items_critical_components_indirect',
      factorLabel: 'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      changeType: 'added', timestamp: '2026-10-22T12:00:00Z',
    }], next: undefined, hasMore: false } })
  })
  await page.goto('/executive')
  await expect(page.getByText('Supplier A')).toBeVisible()
  await page.getByRole('button', { name: 'Show more changes' }).click()

  await expect(page.getByText('Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List')).toBeVisible()
  expect(Object.fromEntries(new URL(requestUrl).searchParams)).toEqual({
    next: 'sayari-next-token', asOf: '2026-10-25T12:00:00.000Z',
  })
})

test('does not show a misleading bar for an inexact count', async ({ page }) => {
  await page.route('**/api/projects/one/exposure', (route) => route.fulfill({ json: {
    ...exposure, categories: { ...exposure.categories, sanctions: { count: 6, qualifier: 'gte' } },
  } }))
  await page.goto('/executive')

  await expect(page.getByTestId('theme-sanctions')).toContainText('at least 6 of 10 project entities')
  await expect(page.getByTestId('theme-sanctions').getByRole('progressbar')).toHaveCount(0)
  await expect(page.getByTestId('theme-sanctions').getByText('60%')).toHaveCount(0)
})

test('reports empty risk changes without a safety verdict', async ({ page }) => {
  await page.route('**/api/projects/one/risk-changes', (route) => route.fulfill({ json: {
    ...changes, changes: [], next: undefined, hasMore: false,
  } }))
  await page.goto('/executive')

  await expect(page.getByText('No risk changes returned for this period.')).toBeVisible()
})

test('shows loading and error states without inventing counts', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/projects/one/exposure', async (route) => {
    await pending
    await route.fulfill({ status: 502, json: { error: { message: 'Exposure unavailable.' } } })
  })
  await page.goto('/executive')
  await expect(page.getByText('Loading project exposure…')).toBeVisible()
  release()

  await expect(page.getByRole('alert').filter({ hasText: 'Exposure unavailable.' })).toBeVisible()
  await expect(page.getByTestId('project-total')).toHaveCount(0)
})

test('links to the Management queue without transferring the current project', async ({ page }) => {
  await page.goto('/executive')
  await expect(page.getByTestId('project-total')).toBeVisible()
  await page.getByRole('link', { name: 'Go to priority queue' }).click()

  await expect(page).toHaveURL(/\/management$/)
})
