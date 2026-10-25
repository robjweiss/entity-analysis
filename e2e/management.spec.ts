import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/projects**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/entities/entity-1')) {
      await route.fulfill({
        json: {
          riskFactors: [
            {
              id: 'sanctioned',
              label: 'Sanctioned',
              level: 'critical',
              riskCategories: [],
              sourceEntityIds: [],
              networkPaths: [],
            },
          ],
          riskChanges: [{ id: 'sanctioned', timestamp: '2026-10-20', changeType: 'added' }],
        },
      })
    } else if (url.pathname.endsWith('/entities')) {
      await route.fulfill({
        json: {
          entities: url.searchParams.has('name')
            ? []
            : [
                {
                  id: 'entity-1',
                  label: 'Example supplier',
                  countries: ['JPN'],
                  riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
                  riskFactors: ['sanctioned'],
                  riskSeverity: 'critical',
                  upstreamProducts: ['8536'],
                },
              ],
        },
      })
    } else {
      await route.fulfill({ json: { projects: [{ id: 'project-1', label: 'Supplier review' }] } })
    }
  })
})

test('filters the project entities via the BFF', async ({ page }) => {
  await page.goto('/management')
  await expect(page.getByTestId('priority-queue-count')).toHaveText('1 entity on this page')

  await page.getByTestId('priority-queue-search').fill('missing')
  await page.getByRole('button', { name: 'Apply filters' }).click()

  await expect(page.getByText('No entities match these filters.')).toBeVisible()
})

test('shows the maximum entity risk severity', async ({ page }) => {
  await page.goto('/management')

  await expect(page.getByTestId('priority-queue-entity-entity-1')).toContainText('Critical')
})

test('opens entity risk details from the keyboard', async ({ page }) => {
  await page.goto('/management')
  await page.getByTestId('priority-queue-entity-entity-1').focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog')).toContainText('Sanctioned · critical')
})
