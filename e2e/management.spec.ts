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
                  countries: ['JPN', 'USA'],
                  riskCategories: [{ id: 'sanctions', label: 'Sanctions' }],
                  riskFactors: [{ id: 'sanctioned', label: 'Sanctioned' }],
                  riskSeverity: 'critical',
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

test('shows human-readable risk factors in the entity list', async ({ page }) => {
  await page.goto('/management')

  await expect(page.getByTestId('priority-queue-risk-factors')).toContainText('Sanctioned')
})

test('keeps country codes out of the overview', async ({ page }) => {
  await page.goto('/management')

  await expect(page.getByTestId('priority-queue-entity-entity-1')).not.toContainText(/JPN|USA/)
})

test('opens entity risk details from the named button', async ({ page }) => {
  await page.goto('/management')
  await page.getByRole('button', { name: 'Review risk details for Example supplier' }).click()

  await expect(page.getByRole('dialog')).toContainText('JPN, USA')
})

test('opens entity risk details from the named button with Enter', async ({ page }) => {
  await page.goto('/management')
  await page.getByRole('button', { name: 'Review risk details for Example supplier' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog').getByText('Critical')).toBeVisible()
})

test('opens entity risk details from the named button with Space', async ({ page }) => {
  await page.goto('/management')
  await page.getByRole('button', { name: 'Review risk details for Example supplier' }).focus()
  await page.keyboard.press('Space')

  await expect(page.getByRole('dialog').getByText('Critical')).toBeVisible()
})
