import { test, expect } from '@playwright/test'
import { sonyFixture } from './fixtures/sony.js'

const changes = sonyFixture.riskChanges

const expectExposure = async (
  page: import('@playwright/test').Page,
  exposure: typeof sonyFixture.exposure.sony,
) => {
  await expect(page.getByTestId('project-total')).toHaveText(
    `Project entities: ${exposure.total.count}`,
  )
  for (const key of ['sanctions', 'forcedLabor', 'exportControls', 'adverseMedia'] as const) {
    await expect(page.getByTestId(`theme-${key}`)).toContainText(
      `${exposure.categories[key].count} of ${exposure.total.count} project entities`,
    )
  }
}

test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/exposure')) {
        const exposure = url.pathname.includes(`/${sonyFixture.projectIds.alternate}/`)
          ? sonyFixture.exposure.alternate
          : sonyFixture.exposure.sony
        await route.fulfill({ json: exposure })
      } else if (url.pathname.endsWith('/risk-changes')) {
        await route.fulfill({ json: sonyFixture.riskChanges })
      } else if (url.pathname === '/api/projects') {
        await route.fulfill({ json: sonyFixture.projects })
      } else if (url.pathname.endsWith('/entities')) {
        await route.fulfill({ json: { entities: [] } })
      } else {
        await route.fulfill({ json: {} })
      }
    },
  )
})

test('shows whole-project scope and overlapping risk themes with exact bars', async ({ page }) => {
  await page.goto('/executive')

  await expectExposure(page, sonyFixture.exposure.sony)
  await expect(page.getByTestId('theme-sanctions').getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '50',
  )
  await expect(page.getByTestId('theme-sanctions').getByText('50%')).toBeVisible()
  await expect(
    page.getByText(/Categories overlap; these four themes are not an exhaustive breakdown/),
  ).toBeVisible()
})

// eslint-disable-next-line playwright/expect-expect -- Assertions are delegated to expectExposure.
test('switches project scope between Sony projects and displays each fixture exposure', async ({
  page,
}) => {
  await page.goto('/executive')

  await expectExposure(page, sonyFixture.exposure.sony)
  await page.getByTestId('exposure-project').selectOption(sonyFixture.projectIds.alternate)
  await expectExposure(page, sonyFixture.exposure.alternate)
  await page.getByTestId('exposure-project').selectOption(sonyFixture.projectIds.sony)
  await expectExposure(page, sonyFixture.exposure.sony)
})

test('supports the next project page', async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith('/api/projects'),
    async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname !== '/api/projects') {
        await route.fallback()
        return
      }
      await route.fulfill({
        json: url.searchParams.has('next')
          ? { projects: [{ id: 'third', label: 'Third unit' }], prev: 'previous-page' }
          : { projects: [sonyFixture.projects.projects[0]], next: 'next-page' },
      })
    },
  )
  await page.goto('/executive')

  await expect(page.getByTestId('project-total')).toBeVisible()
  await page.getByRole('button', { name: 'Next projects' }).click()
  await expect(page.getByTestId('exposure-project')).toHaveValue('third')
})

test('shows recent additions and removals without assuming an unnamed entity is a supplier', async ({
  page,
}) => {
  await page.route(`**/api/projects/${sonyFixture.projectIds.sony}/risk-changes`, (route) =>
    route.fulfill({
      json: {
        ...changes,
        hasMore: true,
        next: 'sayari-next-token',
        changes: [
          {
            projectEntityId: 'supplier-1',
            entityName: 'Supplier A',
            factor: 'forced_labor',
            changeType: 'added',
            timestamp: '2026-10-24T12:00:00Z',
          },
          {
            projectEntityId: 'supplier-2',
            factor: 'pep',
            changeType: 'removed',
            timestamp: '2026-10-23T12:00:00Z',
          },
        ],
      },
    }),
  )
  await page.goto('/executive')

  await expect(page.getByText('Supplier A')).toBeVisible()
  await expect(page.getByText('Signal added')).toBeVisible()
  await expect(page.getByText('Signal removed')).toBeVisible()
  await expect(page.getByText('forced labor', { exact: true })).toBeVisible()
  await expect(page.getByText('Oct 24, 2026')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show more changes' })).toBeVisible()
})

test('shows more risk changes from the Sony fixture', async ({ page }) => {
  await page.goto('/executive')

  const list = page.getByRole('list', { name: 'Recent risk changes' })
  await expect(list.locator('li')).toHaveCount(5)
  expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  expect(await list.evaluate((element) => element.scrollTop)).toBe(0)
  await page.getByRole('button', { name: 'Show more changes' }).click()

  await expect(list.locator('li')).toHaveCount(10)
  const revealedChange = sonyFixture.riskChanges.changes[5]
  const revealedItem = list.locator('li').nth(5)
  await expect(revealedItem).toContainText(revealedChange.entityName!)
  await expect(revealedItem).toContainText(revealedChange.factorLabel!)
  await expect(revealedItem).toContainText(`Signal ${revealedChange.changeType}`)
})

test('reveals loaded changes five at a time without growing the scroll area', async ({ page }) => {
  let requests = 0
  await page.route(`**/api/projects/${sonyFixture.projectIds.sony}/risk-changes`, async (route) => {
    requests += 1
    await route.fulfill({
      json: {
        ...changes,
        next: undefined,
        hasMore: false,
        changes: Array.from({ length: 9 }, (_, i) => ({
          projectEntityId: `entity-${i}`,
          factor: `signal_${i}`,
          changeType: 'added',
          timestamp: '2026-10-24T12:00:00Z',
        })),
      },
    })
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
  await page.route(
    `**/api/projects/${sonyFixture.projectIds.sony}/risk-changes**`,
    async (route) => {
      requestUrl = route.request().url()
      const firstChange = sonyFixture.riskChanges.changes[0]
      const nextChange = sonyFixture.riskChanges.changes[5]
      const isNextPage = new URL(route.request().url()).searchParams.has('next')
      await route.fulfill({
        json: {
          ...sonyFixture.riskChanges,
          changes: [isNextPage ? nextChange : firstChange],
          next: isNextPage ? undefined : 'sayari-next-token',
          hasMore: !isNextPage,
        },
      })
    },
  )
  await page.goto('/executive')
  await expect(page.getByText(sonyFixture.riskChanges.changes[0].entityName!)).toBeVisible()
  await page.getByRole('button', { name: 'Show more changes' }).click()

  await expect(page.getByText(sonyFixture.riskChanges.changes[5].factorLabel!)).toBeVisible()
  expect(Object.fromEntries(new URL(requestUrl).searchParams)).toEqual({
    next: 'sayari-next-token',
    asOf: sonyFixture.riskChanges.to,
  })
})

test('does not show a misleading bar for an inexact count', async ({ page }) => {
  await page.route(`**/api/projects/${sonyFixture.projectIds.sony}/exposure`, (route) =>
    route.fulfill({
      json: {
        ...sonyFixture.exposure.sony,
        categories: {
          ...sonyFixture.exposure.sony.categories,
          sanctions: { count: 6, qualifier: 'gte' },
        },
      },
    }),
  )
  await page.goto('/executive')

  await expect(page.getByTestId('theme-sanctions')).toContainText(
    'at least 6 of 10 project entities',
  )
  await expect(page.getByTestId('theme-sanctions').getByRole('progressbar')).toHaveCount(0)
  await expect(page.getByTestId('theme-sanctions').getByText('60%')).toHaveCount(0)
})

test('reports empty risk changes without a safety verdict', async ({ page }) => {
  await page.route(`**/api/projects/${sonyFixture.projectIds.sony}/risk-changes`, (route) =>
    route.fulfill({
      json: {
        ...changes,
        changes: [],
        next: undefined,
        hasMore: false,
      },
    }),
  )
  await page.goto('/executive')

  await expect(page.getByText('No risk changes returned for this period.')).toBeVisible()
})

test('reports an empty current page when another risk-change page is available', async ({
  page,
}) => {
  await page.route(`**/api/projects/${sonyFixture.projectIds.sony}/risk-changes`, (route) =>
    route.fulfill({
      json: {
        ...changes,
        changes: [],
        next: 'next-page',
        hasMore: true,
      },
    }),
  )
  await page.goto('/executive')

  await expect(page.getByText('No risk changes returned on this page.')).toBeVisible()
})

test('shows loading and error states without inventing counts', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(`**/api/projects/${sonyFixture.projectIds.sony}/exposure`, async (route) => {
    await pending
    await route.fulfill({ status: 502, json: { error: { message: 'Exposure unavailable.' } } })
  })
  await page.goto('/executive')
  await expect(page.getByText('Loading project exposure…')).toBeVisible()
  release()

  await expect(page.getByRole('alert').filter({ hasText: 'Exposure unavailable.' })).toBeVisible()
  await expect(page.getByTestId('project-total')).toHaveCount(0)
})

test('does not show the follow-up panel for a selected project', async ({ page }) => {
  await page.goto('/executive')
  await expect(page.getByTestId('project-total')).toBeVisible()

  await expect(page.getByRole('region', { name: 'Follow up', exact: true })).toHaveCount(0)
})
