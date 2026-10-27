import { expect, test, type Page } from '@playwright/test'
import { sonyFixture } from './fixtures/sony.js'

const { investigation } = sonyFixture
const { initial, moreRelationships, moreRecords } = investigation

async function selectSonyMatch(page: Page) {
  await page.goto('/analyst')
  const projectEntitySelect = page.getByTestId('investigation-project-entity')
  await expect(
    projectEntitySelect.getByRole('option', { name: investigation.projectEntityLabel }),
  ).toBeAttached()
  await projectEntitySelect.selectOption(investigation.projectEntityId)
  const resolvedEntitySelect = page.getByTestId('investigation-entity')
  await expect(
    resolvedEntitySelect.getByRole('option', { name: investigation.resolvedEntityLabel }),
  ).toBeAttached()
  await resolvedEntitySelect.selectOption(investigation.resolvedEntityId)
}

async function mockProjectApis(page: Page, entities = sonyFixture.entities.initial) {
  await page.route('**/api/projects', (route) => route.fulfill({ json: sonyFixture.projects }))
  await page.route('**/api/projects/*/entities', (route) => route.fulfill({ json: entities }))
}

test('investigates a selected Sony project entity and loads more Sayari data', async ({ page }) => {
  const projectEntityRequests: string[] = []
  const entityRequests: { pathname: string; next: string | null }[] = []

  await page.route('**/api/projects', (route) => route.fulfill({ json: sonyFixture.projects }))
  await page.route('**/api/projects/*/entities', async (route) => {
    const { pathname } = new URL(route.request().url())
    projectEntityRequests.push(pathname)
    expect(pathname).toMatch(/^\/api\/projects\/[^/]+\/entities$/)
    const response = pathname.includes(`/${sonyFixture.projectIds.sony}/`)
      ? sonyFixture.entities.initial
      : { entities: [] }
    await route.fulfill({ json: response })
  })
  await page.route('**/api/entities/**', async (route) => {
    const url = new URL(route.request().url())
    const entityPath = `/api/entities/${investigation.resolvedEntityId}`
    entityRequests.push({ pathname: url.pathname, next: url.searchParams.get('next') })

    if (url.pathname === entityPath) {
      await route.fulfill({ json: structuredClone(initial) })
    } else if (url.pathname === `${entityPath}/relationships`) {
      await route.fulfill({ json: moreRelationships })
    } else if (url.pathname === `${entityPath}/records`) {
      await route.fulfill({ json: moreRecords })
    } else {
      await route.fulfill({
        status: 404,
        json: { error: { message: 'Unexpected entity API path.' } },
      })
    }
  })

  await page.goto('/analyst')

  const projectSelect = page.getByTestId('investigation-project')
  await expect(projectSelect.getByRole('option')).toHaveText(
    sonyFixture.projects.projects.map(({ label }) => label),
  )
  await projectSelect.selectOption(sonyFixture.projectIds.alternate)
  await projectSelect.selectOption(sonyFixture.projectIds.sony)

  const projectEntitySelect = page.getByTestId('investigation-project-entity')
  await expect(
    projectEntitySelect.getByRole('option', { name: investigation.projectEntityLabel }),
  ).toBeAttached()
  await projectEntitySelect.selectOption(investigation.projectEntityId)

  const resolvedEntitySelect = page.getByTestId('investigation-entity')
  await expect(
    resolvedEntitySelect.getByRole('option', { name: investigation.resolvedEntityLabel }),
  ).toBeAttached()
  await resolvedEntitySelect.selectOption(investigation.resolvedEntityId)

  const profile = initial.profile
  await expect(page.getByTestId('entity-label')).toHaveText(profile.label)
  await expect(page.getByText(profile.countries.join(', '), { exact: true })).toBeVisible()
  await expect(page.getByText(profile.registrationDate!, { exact: true })).toBeVisible()
  await expect(page.getByText(profile.companyType!, { exact: true })).toBeVisible()
  await expect(page.getByText(profile.latestStatus!, { exact: true })).toBeVisible()
  await expect(
    page.getByText(`${profile.identifiers[0]!.label}: ${profile.identifiers[0]!.value}`),
  ).toBeVisible()

  const firstRisk = initial.risks[0]!
  await expect(page.getByText(firstRisk.label, { exact: true })).toBeVisible()
  await expect(page.getByText('High', { exact: true }).first()).toBeVisible()

  const relationships = page.getByRole('region', { name: 'Related entities' })
  await expect(relationships.locator('ul > li')).toHaveCount(initial.relationships.length)
  await expect(relationships).toContainText(
    `${initial.relationshipCount} direct relationships recorded.`,
  )
  await page.getByTestId('show-more-relationships').click()
  await expect(relationships.locator('ul > li')).toHaveCount(
    initial.relationships.length + moreRelationships.relationships.length,
  )
  await expect(relationships.locator('ul > li > div > p:first-child')).toHaveText([
    ...initial.relationships.map(({ label }) => label),
    ...moreRelationships.relationships.map(({ label }) => label),
  ])
  await expect(relationships).toContainText(
    `${moreRelationships.relationshipCount} direct relationships recorded.`,
  )

  const records = page
    .getByRole('heading', { name: 'Supporting records' })
    .locator('xpath=../../..')
  await expect(records.locator('ul > li')).toHaveCount(initial.records.length)
  await expect(records).toContainText(`${initial.recordCount} records reference this entity.`)
  await page.getByTestId('show-more-records').click()
  await expect(records.locator('ul > li')).toHaveCount(
    initial.records.length + moreRecords.records.length,
  )
  await expect(records.locator('ul > li > p:first-child')).toHaveText([
    ...initial.records.map(({ label }) => label),
    ...moreRecords.records.map(({ label }) => label),
  ])
  await expect(records).toContainText(`${moreRecords.recordCount} records reference this entity.`)

  expect(projectEntityRequests).toContain(
    `/api/projects/${sonyFixture.projectIds.alternate}/entities`,
  )
  expect(projectEntityRequests).toContain(`/api/projects/${sonyFixture.projectIds.sony}/entities`)
  expect(entityRequests).toContainEqual({
    pathname: `/api/entities/${investigation.resolvedEntityId}/relationships`,
    next: initial.nextRelationship!,
  })
  expect(entityRequests).toContainEqual({
    pathname: `/api/entities/${investigation.resolvedEntityId}/records`,
    next: initial.nextRecord!,
  })
})

test('shows when a project entity has no resolved matches', async ({ page }) => {
  const entities = structuredClone(sonyFixture.entities.initial)
  entities.entities[0]!.matches = []
  await mockProjectApis(page, entities)

  await page.goto('/analyst')
  await page.getByTestId('investigation-project-entity').selectOption(investigation.projectEntityId)

  await expect(
    page.getByText('No resolved Sayari matches are available for this project entity.'),
  ).toBeVisible()
  await expect(page.getByTestId('investigation-entity')).toBeDisabled()
})

test('clears stale investigation data when switching resolved entities', async ({ page }) => {
  const secondMatch = { id: 'another-entity', label: 'Another resolved entity' }
  const entities = structuredClone(sonyFixture.entities.initial)
  entities.entities[0]!.matches!.push(secondMatch)
  await mockProjectApis(page, entities)
  let releaseSecondInvestigation!: () => void
  let markSecondInvestigationRequested!: () => void
  const secondInvestigationGate = new Promise<void>((resolve) => {
    releaseSecondInvestigation = resolve
  })
  const secondInvestigationRequested = new Promise<void>((resolve) => {
    markSecondInvestigationRequested = resolve
  })
  await page.route('**/api/entities/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === `/api/entities/${investigation.resolvedEntityId}`) {
      await route.fulfill({ json: structuredClone(initial) })
      return
    }
    markSecondInvestigationRequested()
    await secondInvestigationGate
    const next = structuredClone(initial)
    next.profile = { ...next.profile, id: secondMatch.id, label: secondMatch.label }
    await route.fulfill({ json: next })
  })
  await selectSonyMatch(page)
  await expect(page.getByTestId('entity-label')).toHaveText(initial.profile.label)

  const matches = page.getByTestId('investigation-entity')
  await matches.selectOption(secondMatch.id)
  try {
    await secondInvestigationRequested
    await expect(page.getByTestId('entity-label')).toHaveCount(0)
  } finally {
    releaseSecondInvestigation()
  }
  await expect(page.getByTestId('entity-label')).toHaveText(secondMatch.label)
})

test('clears a completed investigation when switching projects', async ({ page }) => {
  await mockProjectApis(page)
  await page.route(`**/api/entities/${investigation.resolvedEntityId}`, (route) =>
    route.fulfill({ json: structuredClone(initial) }),
  )
  await selectSonyMatch(page)
  await expect(page.getByTestId('entity-label')).toHaveText(initial.profile.label)

  await page.getByTestId('investigation-project').selectOption(sonyFixture.projectIds.alternate)

  await expect(page.getByTestId('entity-label')).toHaveCount(0)
})

test('shows investigation API errors', async ({ page }) => {
  await mockProjectApis(page)
  await page.route(`**/api/entities/${investigation.resolvedEntityId}`, (route) =>
    route.fulfill({ status: 500, json: { error: { message: 'Investigation unavailable.' } } }),
  )
  await selectSonyMatch(page)

  await expect(page.getByText('Investigation unavailable.', { exact: true })).toBeVisible()
  await expect(page.getByTestId('entity-label')).toHaveCount(0)
})

test('shows failures when loading more relationships and records', async ({ page }) => {
  await mockProjectApis(page)
  await page.route('**/api/entities/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === `/api/entities/${investigation.resolvedEntityId}`) {
      await route.fulfill({ json: structuredClone(initial) })
    } else {
      const message = pathname.endsWith('/relationships')
        ? 'Relationships unavailable.'
        : 'Records unavailable.'
      await route.fulfill({ status: 500, json: { error: { message } } })
    }
  })
  await selectSonyMatch(page)

  await page.getByTestId('show-more-relationships').click()
  await expect(page.getByText('Relationships unavailable.', { exact: true })).toBeVisible()
  await page.getByTestId('show-more-records').click()
  await expect(page.getByText('Records unavailable.', { exact: true })).toBeVisible()
})

test('shows only the newly selected match when an earlier investigation responds late', async ({
  page,
}) => {
  let releaseFirstResponse!: () => void
  const firstResponse = new Promise<void>((resolve) => {
    releaseFirstResponse = resolve
  })
  const projectEntity = structuredClone(
    sonyFixture.entities.initial.entities.find(({ id }) => id === investigation.projectEntityId)!,
  )
  projectEntity.matches.push({ id: 'second-resolved-entity', label: 'Second resolved entity' })

  await page.route('**/api/projects', (route) => route.fulfill({ json: sonyFixture.projects }))
  await page.route('**/api/projects/*/entities', (route) =>
    route.fulfill({ json: { entities: [projectEntity] } }),
  )
  await page.route('**/api/entities/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === `/api/entities/${investigation.resolvedEntityId}`) {
      await firstResponse
      await route.fulfill({ json: structuredClone(initial) })
    } else if (url.pathname === '/api/entities/second-resolved-entity') {
      await route.fulfill({
        json: {
          ...structuredClone(initial),
          profile: {
            ...initial.profile,
            id: 'second-resolved-entity',
            label: 'Second resolved entity',
          },
        },
      })
    }
  })

  await page.goto('/analyst')
  await page.getByTestId('investigation-project-entity').selectOption(investigation.projectEntityId)
  const resolvedEntitySelect = page.getByTestId('investigation-entity')
  await resolvedEntitySelect.selectOption(investigation.resolvedEntityId)
  await expect(page.getByRole('status')).toContainText('Loading entity investigation')
  await resolvedEntitySelect.selectOption('second-resolved-entity')
  releaseFirstResponse()

  await expect(page.getByTestId('entity-label')).toHaveText('Second resolved entity')
})
