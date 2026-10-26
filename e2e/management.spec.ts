import { expect, test, type Page } from '@playwright/test'
import { sonyFixture } from './fixtures/sony.js'

const detailEntity = {
  id: 'synthetic-entity',
  label: 'Synthetic supplier',
  countries: ['JPN', 'USA'],
  riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
  riskFactors: [{ id: 'sanctioned', label: 'Sanctioned' }],
  riskSeverity: 'critical',
}

async function expectEntityLabels(page: Page, labels: string[]) {
  const rows = page.locator('[data-testid^="priority-queue-entity-"]')
  await expect(rows).toHaveCount(labels.length)
  await expect(rows.locator('button')).toHaveText(labels)
  await expect(page.getByTestId('priority-queue-count')).toHaveText(
    `${labels.length} ${labels.length === 1 ? 'entity' : 'entities'} on this page`,
  )
}

test.describe('Management with Sony fixture data', () => {
  const entityRequests: URL[] = []

  test.beforeEach(async ({ page }) => {
    entityRequests.length = 0
    await page.route(/\/api\/projects(?:\/|\?|$)/, async (route) => {
      const url = new URL(route.request().url())
      const entityDetailPath = /\/api\/projects\/[^/]+\/entities\/[^/]+$/.test(url.pathname)

      if (entityDetailPath) {
        await route.fulfill({ json: { riskFactors: [], riskChanges: [] } })
        return
      }

      if (url.pathname.endsWith('/entities')) {
        entityRequests.push(url)
        const projectId = url.pathname.split('/')[3]
        let response = sonyFixture.entities.initial

        if (projectId !== sonyFixture.projectIds.sony) {
          response = { entities: [] }
        } else if (url.searchParams.has('name')) {
          response = sonyFixture.entities.byName
        } else if (url.searchParams.has('country')) {
          response = sonyFixture.entities.byCountry
        }

        await route.fulfill({ json: response })
        return
      }

      await route.fulfill({ json: sonyFixture.projects })
    })
  })

  test('selects the Sony project and displays its fixture entities', async ({ page }) => {
    await page.goto('/management')

    const project = page.getByTestId('priority-queue-project')
    await expect(project.locator('option')).toHaveText(
      sonyFixture.projects.projects.map(({ label }) => label),
    )

    await project.selectOption(sonyFixture.projectIds.alternate)
    await expect(project).toHaveValue(sonyFixture.projectIds.alternate)
    await expectEntityLabels(page, [])

    await project.selectOption(sonyFixture.projectIds.sony)
    await expect(project).toHaveValue(sonyFixture.projectIds.sony)
    await expectEntityLabels(
      page,
      sonyFixture.entities.initial.entities.map(({ label }) => label),
    )
    expect(entityRequests.at(-1)?.pathname).toBe(
      `/api/projects/${sonyFixture.projectIds.sony}/entities`,
    )
  })

  test('filters Sony project entities by name', async ({ page }) => {
    await page.goto('/management')
    await page.getByTestId('priority-queue-search').fill('SK hynix')
    await page.getByRole('button', { name: 'Apply filters' }).click()

    const [expectedEntity] = sonyFixture.entities.byName.entities
    const expected = sonyFixture.entities.byName.entities.map(({ label }) => label)
    await expectEntityLabels(page, expected)
    const entityRow = page.getByTestId(`priority-queue-entity-${expectedEntity!.id}`)
    await expect(entityRow).toContainText('High')
    await expect(entityRow).toContainText(expectedEntity!.riskCategories[0]!.label)
    await expect(entityRow).toContainText(expectedEntity!.riskFactors[0]!.label)
    expect(entityRequests.at(-1)?.searchParams.get('name')).toBe('SK hynix')
    expect(entityRequests.at(-1)?.searchParams.has('country')).toBe(false)
  })

  test('filters Sony project entities by country code', async ({ page }) => {
    await page.goto('/management')
    await page.getByTestId('priority-queue-country-filter').fill('jpn')
    await page.getByRole('button', { name: 'Apply filters' }).click()

    const expected = sonyFixture.entities.byCountry.entities.map(({ label }) => label)
    await expectEntityLabels(page, expected)
    expect(entityRequests.at(-1)?.searchParams.get('country')).toBe('JPN')
    expect(entityRequests.at(-1)?.searchParams.has('name')).toBe(false)
  })
})

test.describe('Management entity risk details', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/projects(?:\/|\?|$)/, async (route) => {
      const url = new URL(route.request().url())

      if (url.pathname.endsWith('/entities/synthetic-entity')) {
        await route.fulfill({
          json: {
            riskFactors: [{ id: 'sanctioned', label: 'Sanctioned', level: 'critical' }],
            riskChanges: [{ id: 'sanctioned', timestamp: '2026-10-20', changeType: 'added' }],
          },
        })
      } else if (url.pathname.endsWith('/entities')) {
        await route.fulfill({ json: { entities: [detailEntity] } })
      } else {
        await route.fulfill({
          json: { projects: [{ id: 'synthetic-project', label: 'Synthetic review' }] },
        })
      }
    })
  })

  test('opens entity risk details from the named button', async ({ page }) => {
    await page.goto('/management')
    await page.getByRole('button', { name: 'Review risk details for Synthetic supplier' }).click()

    await expect(page.getByRole('dialog')).toContainText('JPN, USA')
  })

  test('opens entity risk details with Enter', async ({ page }) => {
    await page.goto('/management')
    await page.getByRole('button', { name: 'Review risk details for Synthetic supplier' }).focus()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('dialog').getByText('Critical')).toBeVisible()
  })

  test('opens entity risk details with Space', async ({ page }) => {
    await page.goto('/management')
    await page.getByRole('button', { name: 'Review risk details for Synthetic supplier' }).focus()
    await page.keyboard.press('Space')

    await expect(page.getByRole('dialog').getByText('Critical')).toBeVisible()
  })
})
