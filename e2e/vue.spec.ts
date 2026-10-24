import { test, expect } from '@playwright/test'

test('redirects the root route to the executive workspace', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/executive$/)
})

const workspaces = [
  { role: 'executive', path: '/executive' },
  { role: 'management', path: '/management' },
  { role: 'analyst', path: '/analyst' },
]

const workspaceTransitions = workspaces.flatMap((source) =>
  workspaces
    .filter((destination) => destination.role !== source.role)
    .map((destination) => ({ source, destination })),
)

for (const { source, destination } of workspaceTransitions) {
  test(`switches from ${source.role} to ${destination.role}`, async ({ page }) => {
    await page.goto(source.path)
    await page.getByTestId('role-switcher').click()
    await page.getByTestId(`role-option-${destination.role}`).click()
    await expect(page).toHaveURL(new RegExp(`${destination.path}$`))
  })
}
