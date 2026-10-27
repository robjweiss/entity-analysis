import { test, expect } from '@playwright/test'
import { sonyFixture } from './fixtures/sony.js'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/risk-categories', (route) =>
    route.fulfill({ json: { categories: [{ id: 'sanctions', label: 'Sanctions' }] } }),
  )
  await page.route(/\/api\/projects(?:\/|\?|$)/, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entities')) {
      await route.fulfill({ json: { entities: [] } })
    } else if (path === '/api/projects') {
      await route.fulfill({ json: sonyFixture.projects })
    } else {
      await route.continue()
    }
  })
})

test('redirects the root route to the exposure snapshot', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/executive$/)
})

const views = [
  { title: 'Exposure Snapshot', path: '/executive' },
  { title: 'Risk Breakdown', path: '/management' },
  { title: 'Entity Investigation', path: '/analyst' },
]

const viewTransitions = views.flatMap((source) =>
  views
    .filter((destination) => destination.path !== source.path)
    .map((destination) => ({ source, destination })),
)

for (const { source, destination } of viewTransitions) {
  test(`navigates from ${source.title} to ${destination.title}`, async ({ page }) => {
    await page.goto(source.path)
    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: destination.title })
      .click()
    await expect(page).toHaveURL(new RegExp(`${destination.path}$`))
  })
}

test('does not show a workspace switcher in the header', async ({ page }) => {
  await page.goto('/executive')
  await expect(page.getByTestId('role-switcher')).toHaveCount(0)
})
