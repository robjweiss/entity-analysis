<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/native-select'
import type { EntityInvestigation } from '@shared/api/entities'
import type { EntityPage, ProjectPage } from '@shared/api/projects'

type RiskLevel = EntityInvestigation['risks'][number]['level']

const riskLevelLabels: Record<RiskLevel, string> = {
  critical: 'Critical',
  high: 'High',
  elevated: 'Elevated',
  relevant: 'Relevant',
}

const projects = ref<ProjectPage>()
const projectId = ref('')
const projectEntities = ref<EntityPage>()
const projectEntityId = ref('')
const matchId = ref('')
const investigation = ref<EntityInvestigation>()
const projectLoading = ref(false)
const entityLoading = ref(false)
const loading = ref(false)
const relationshipsLoading = ref(false)
const relationshipsError = ref('')
const recordsLoading = ref(false)
const recordsError = ref('')
const error = ref('')
const selectedProjectEntity = computed(() =>
  projectEntities.value?.entities.find((entity) => entity.id === projectEntityId.value),
)
const matches = computed(() => selectedProjectEntity.value?.matches ?? [])
const profileFacts = computed(() => {
  const profile = investigation.value?.profile
  if (!profile) return []
  return [
    { label: 'Status', value: profile.latestStatus },
    { label: 'Registration', value: profile.registrationDate },
    { label: 'Company type', value: profile.companyType },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value))
})

async function request<T>(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? 'Unable to load data. Please try again.')
  }
  return response.json() as Promise<T>
}

async function requestInvestigation(id: string, signal: AbortSignal) {
  const response = await fetch(`/api/entities/${encodeURIComponent(id)}`, { signal })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(
      body?.error?.message ?? 'Unable to load entity investigation. Please try again.',
    )
  }
  return response.json() as Promise<EntityInvestigation>
}

watch(
  projectId,
  async (id, _old, onCleanup) => {
    projectEntities.value = undefined
    projectEntityId.value = ''
    matchId.value = ''
    investigation.value = undefined
    error.value = ''
    if (!id) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    entityLoading.value = true
    try {
      projectEntities.value = await request<EntityPage>(
        `/api/projects/${encodeURIComponent(id)}/entities`,
        controller.signal,
      )
    } catch (requestError) {
      if (!controller.signal.aborted) error.value = (requestError as Error).message
    } finally {
      if (!controller.signal.aborted) entityLoading.value = false
    }
  },
  { immediate: true },
)

watch(projectEntityId, () => {
  matchId.value = ''
  investigation.value = undefined
  error.value = ''
})

watch(
  matchId,
  async (id, _old, onCleanup) => {
    investigation.value = undefined
    error.value = ''
    relationshipsError.value = ''
    recordsError.value = ''
    if (!id) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    try {
      investigation.value = await requestInvestigation(id, controller.signal)
    } catch (requestError) {
      if (!controller.signal.aborted) error.value = (requestError as Error).message
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)

async function loadMoreRelationships() {
  const current = investigation.value
  const cursor = current?.nextRelationship
  if (!current || !cursor || relationshipsLoading.value) return

  relationshipsLoading.value = true
  relationshipsError.value = ''
  try {
    const page = await request<
      Pick<EntityInvestigation, 'relationships' | 'relationshipCount' | 'nextRelationship'>
    >(
      `/api/entities/${encodeURIComponent(current.profile.id)}/relationships?${new URLSearchParams({ next: cursor })}`,
      new AbortController().signal,
    )
    current.relationships.push(...page.relationships)
    current.relationshipCount = page.relationshipCount
    current.nextRelationship = page.nextRelationship
  } catch (requestError) {
    relationshipsError.value = (requestError as Error).message
  } finally {
    relationshipsLoading.value = false
  }
}

async function loadMoreRecords() {
  const current = investigation.value
  const cursor = current?.nextRecord
  if (!current || !cursor || recordsLoading.value) return

  recordsLoading.value = true
  recordsError.value = ''
  try {
    const page = await request<Pick<EntityInvestigation, 'records' | 'recordCount' | 'nextRecord'>>(
      `/api/entities/${encodeURIComponent(current.profile.id)}/records?${new URLSearchParams({ next: cursor })}`,
      new AbortController().signal,
    )
    current.records.push(...page.records)
    current.recordCount = page.recordCount
    current.nextRecord = page.nextRecord
  } catch (requestError) {
    recordsError.value = (requestError as Error).message
  } finally {
    recordsLoading.value = false
  }
}

watch(
  projects,
  (page) => {
    projectId.value = page?.projects[0]?.id ?? ''
  },
  { once: true },
)

async function loadProjects() {
  const controller = new AbortController()
  projectLoading.value = true
  error.value = ''
  try {
    projects.value = await request<ProjectPage>('/api/projects', controller.signal)
  } catch (requestError) {
    error.value = (requestError as Error).message
  } finally {
    projectLoading.value = false
  }
}

void loadProjects()
</script>

<template>
  <section aria-labelledby="page-title" class="mx-auto grid max-w-7xl gap-6">
    <div>
      <h1 id="page-title" class="text-2xl font-semibold tracking-tight">Entity Investigation</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Review an entity’s identity, risk signals, direct relationships, and supporting records.
      </p>
    </div>

    <Card class="w-full min-w-0 max-w-2xl">
      <CardContent class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label class="grid min-w-0 gap-1.5 text-sm font-medium"
          >Project
          <NativeSelect
            v-model="projectId"
            data-testid="investigation-project"
            :disabled="projectLoading || !projects?.projects.length"
            class="w-full max-w-full"
          >
            <option v-for="project in projects?.projects" :key="project.id" :value="project.id">
              {{ project.label }}
            </option>
          </NativeSelect>
        </label>
        <label class="grid min-w-0 gap-1.5 text-sm font-medium"
          >Project entity
          <NativeSelect
            v-model="projectEntityId"
            data-testid="investigation-project-entity"
            :disabled="entityLoading || !projectEntities?.entities.length"
            class="w-full max-w-full"
          >
            <option value="" disabled>Select a project entity</option>
            <option v-for="entity in projectEntities?.entities" :key="entity.id" :value="entity.id">
              {{ entity.label }}
            </option>
          </NativeSelect>
        </label>
        <label class="grid min-w-0 gap-1.5 text-sm font-medium sm:col-span-2"
          >Resolved Sayari entity
          <NativeSelect
            v-model="matchId"
            data-testid="investigation-entity"
            :disabled="!matches.length"
            class="w-full max-w-full"
          >
            <option value="" disabled>Select a resolved entity</option>
            <option v-for="match in matches" :key="match.id" :value="match.id">
              {{ match.label }}
            </option>
          </NativeSelect>
        </label>
        <p v-if="projectLoading" class="text-sm text-muted-foreground sm:col-span-2">
          Loading projects…
        </p>
        <p v-else-if="entityLoading" class="text-sm text-muted-foreground sm:col-span-2">
          Loading project entities…
        </p>
        <p
          v-else-if="projectEntityId && !matches.length"
          class="text-sm text-muted-foreground sm:col-span-2"
        >
          No resolved Sayari matches are available for this project entity.
        </p>
      </CardContent>
    </Card>

    <p v-if="loading" role="status" class="py-12 text-center text-sm text-muted-foreground">
      Loading entity investigation…
    </p>
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription class="text-destructive">{{ error }}</AlertDescription>
    </Alert>
    <p
      v-else-if="!investigation"
      class="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground"
    >
      Select a project and resolved entity to begin an investigation.
    </p>

    <template v-else>
      <Card class="gap-0 py-5">
        <header class="grid gap-4 px-5 sm:grid-cols-[1fr_auto]">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 data-testid="entity-label" class="text-xl font-semibold">
                {{ investigation.profile.label }}
              </h2>
              <Badge variant="muted">{{ investigation.profile.type }}</Badge>
              <Badge v-if="investigation.profile.sanctioned" variant="critical">Sanctioned</Badge>
              <Badge v-if="investigation.profile.pep" variant="elevated">PEP</Badge>
              <Badge v-if="investigation.profile.closed" variant="muted">Closed</Badge>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ investigation.profile.countries.join(', ') || 'No countries recorded' }}
            </p>
            <dl v-if="profileFacts.length" class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div v-for="fact in profileFacts" :key="fact.label">
                <dt class="inline text-muted-foreground">{{ fact.label }}:</dt>
                <dd class="inline">{{ fact.value }}</dd>
              </div>
            </dl>
          </div>
          <p class="font-mono text-xs text-muted-foreground">{{ investigation.profile.id }}</p>
        </header>
      </Card>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
        <div class="grid gap-6">
          <section aria-labelledby="risk-heading">
            <Card class="gap-0 py-0">
              <CardHeader class="border-b px-5 py-4">
                <h2 id="risk-heading" class="font-medium">Risk signals</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  Current Sayari risk factors, ordered by severity.
                </p>
              </CardHeader>
              <CardContent class="p-0">
                <p v-if="!investigation.risks.length" class="p-5 text-sm text-muted-foreground">
                  No recorded risk factors.
                </p>
                <ul v-else class="divide-y">
                  <li
                    v-for="risk in investigation.risks"
                    :key="risk.id"
                    class="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-start"
                  >
                    <div>
                      <p class="font-medium">{{ risk.label }}</p>
                      <p v-if="risk.description" class="mt-1 text-sm text-muted-foreground">
                        {{ risk.description }}
                      </p>
                    </div>
                    <Badge :variant="risk.level" class="w-fit sm:justify-self-end">{{
                      riskLevelLabels[risk.level]
                    }}</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="relationships-heading">
            <Card class="gap-0 py-0">
              <CardHeader class="border-b px-5 py-4">
                <h2 id="relationships-heading" class="font-medium">Related entities</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ investigation.relationshipCount }} direct relationships recorded.
                </p>
              </CardHeader>
              <CardContent class="p-0">
                <p
                  v-if="!investigation.relationships.length"
                  class="p-5 text-sm text-muted-foreground"
                >
                  No direct relationships returned.
                </p>
                <ul v-else class="divide-y">
                  <li
                    v-for="relationship in investigation.relationships"
                    :key="relationship.id"
                    class="flex items-start justify-between gap-4 p-5"
                  >
                    <div>
                      <p class="font-medium">{{ relationship.label }}</p>
                      <p class="mt-1 text-sm text-muted-foreground">
                        {{ relationship.types.join(', ')
                        }}<template v-if="relationship.countries.length">
                          · {{ relationship.countries.join(', ') }}</template
                        >
                      </p>
                    </div>
                    <div class="flex gap-1">
                      <Badge v-if="relationship.sanctioned" variant="critical">Sanctioned</Badge
                      ><Badge v-if="relationship.pep" variant="elevated">PEP</Badge>
                    </div>
                  </li>
                </ul>
              </CardContent>
              <CardFooter
                v-if="investigation.nextRelationship || relationshipsError"
                class="grid justify-items-center gap-2 bg-transparent px-5 py-3"
              >
                <p v-if="relationshipsError" role="alert" class="text-sm text-destructive">
                  {{ relationshipsError }}
                </p>
                <Button
                  v-if="investigation.nextRelationship"
                  variant="outline"
                  size="sm"
                  data-testid="show-more-relationships"
                  :disabled="relationshipsLoading"
                  @click="loadMoreRelationships"
                >
                  {{ relationshipsLoading ? 'Loading relationships…' : 'Show more relationships' }}
                </Button>
              </CardFooter>
            </Card>
          </section>
        </div>

        <aside class="grid content-start gap-6">
          <section>
            <Card class="gap-0 py-5">
              <CardContent class="px-5">
                <h2 class="font-medium">Profile</h2>
                <div class="mt-4 grid gap-4 text-sm">
                  <div>
                    <h3 class="text-muted-foreground">Identifiers</h3>
                    <p v-if="!investigation.profile.identifiers.length" class="mt-1">—</p>
                    <ul v-else class="mt-1 grid gap-1">
                      <li
                        v-for="identifier in investigation.profile.identifiers"
                        :key="`${identifier.label}-${identifier.value}`"
                      >
                        {{ identifier.label }}:
                        <span class="font-medium">{{ identifier.value }}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 class="text-muted-foreground">Names and aliases</h3>
                    <p class="mt-1">{{ investigation.profile.names.join(', ') || '—' }}</p>
                  </div>
                  <div>
                    <h3 class="text-muted-foreground">Addresses</h3>
                    <ul v-if="investigation.profile.addresses.length" class="mt-1 grid gap-1">
                      <li
                        v-for="address in investigation.profile.addresses.slice(0, 3)"
                        :key="address"
                      >
                        {{ address }}
                      </li>
                    </ul>
                    <p v-else class="mt-1">—</p>
                  </div>
                  <div>
                    <h3 class="text-muted-foreground">Business purpose</h3>
                    <p class="mt-1">
                      {{ investigation.profile.businessPurposes.join(', ') || '—' }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card class="gap-0 py-0">
              <CardHeader class="border-b px-5 py-4">
                <h2 class="font-medium">Supporting records</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ investigation.recordCount }} records reference this entity.
                </p>
              </CardHeader>
              <CardContent class="p-0">
                <p v-if="!investigation.records.length" class="p-5 text-sm text-muted-foreground">
                  No records returned.
                </p>
                <ul v-else class="divide-y">
                  <li v-for="record in investigation.records" :key="record.id" class="p-4 text-sm">
                    <p class="font-medium">{{ record.label }}</p>
                    <p class="mt-1 text-muted-foreground">
                      {{ record.type === 'about' ? 'About this entity' : 'Mentions this entity'
                      }}<template v-if="record.publicationDate">
                        · Published {{ record.publicationDate }}</template
                      ><template v-if="record.acquisitionDate">
                        · Collected {{ record.acquisitionDate }}</template
                      >
                    </p>
                  </li>
                </ul>
              </CardContent>
              <CardFooter
                v-if="investigation.nextRecord || recordsError"
                class="grid justify-items-center gap-2 bg-transparent px-5 py-3"
              >
                <p v-if="recordsError" role="alert" class="text-sm text-destructive">
                  {{ recordsError }}
                </p>
                <Button
                  v-if="investigation.nextRecord"
                  variant="outline"
                  size="sm"
                  data-testid="show-more-records"
                  :disabled="recordsLoading"
                  @click="loadMoreRecords"
                >
                  {{ recordsLoading ? 'Loading records…' : 'Show more records' }}
                </Button>
              </CardFooter>
            </Card>
          </section>

          <section>
            <Card class="gap-0 py-5">
              <CardContent class="px-5">
                <h2 class="font-medium">Data sources</h2>
                <ul class="mt-3 grid gap-2 text-sm">
                  <li
                    v-for="source in investigation.profile.sources.slice(0, 5)"
                    :key="source.label"
                    class="flex justify-between gap-3"
                  >
                    <span>{{ source.label }}</span
                    ><span class="text-muted-foreground">{{ source.count }}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>
