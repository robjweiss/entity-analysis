<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import { getProjectExposure, getProjectRiskChanges, listProjects } from '@/api/projects'
import type { ProjectExposure, ProjectPage, ProjectRiskChanges } from '@shared/api/projects'

type ProjectPagination = { next?: string; prev?: string }
type Category = keyof ProjectExposure['categories']

const themes: { key: Category; label: string }[] = [
  { key: 'sanctions', label: 'Sanctions' },
  { key: 'forcedLabor', label: 'Forced labor' },
  { key: 'exportControls', label: 'Export controls' },
  { key: 'adverseMedia', label: 'Adverse media' },
]

const projectPage = ref<ProjectPage>()
const projectPagination = ref<ProjectPagination>({})
const selectedProjectId = ref('')
const projectLoading = ref(false)
const projectError = ref('')

const exposure = ref<ProjectExposure>()
const changes = ref<ProjectRiskChanges>()
const exposureLoading = ref(false)
const changesLoading = ref(false)
const moreLoading = ref(false)
const exposureError = ref('')
const changesError = ref('')
const moreError = ref('')
const visibleChangeCount = ref(5)
const changesList = ref<HTMLUListElement>()
let activeController: AbortController | undefined

const selectedProject = computed(() =>
  projectPage.value?.projects.find((project) => project.id === selectedProjectId.value),
)
const visibleChanges = computed(
  () => changes.value?.changes.slice(0, visibleChangeCount.value) ?? [],
)
const canShowMore = computed(() =>
  Boolean(
    changes.value &&
    (visibleChangeCount.value < changes.value.changes.length || changes.value.next),
  ),
)

function countText(count: ProjectExposure['total']) {
  return `${count.qualifier === 'gte' ? 'at least ' : ''}${count.count.toLocaleString()}`
}

function categoryText(key: Category) {
  if (!exposure.value) return ''
  const category = exposure.value.categories[key]
  const total = exposure.value.total
  return `${countText(category)} of ${countText(total)} project entities`
}

function categoryPercent(key: Category) {
  if (!exposure.value) return undefined
  const { total, categories } = exposure.value
  const category = categories[key]
  if (total.qualifier !== 'eq' || category.qualifier !== 'eq' || total.count === 0) return undefined
  return Math.min(100, (category.count / total.count) * 100)
}

function percentText(value: number) {
  if (value > 0 && value < 0.1) return '<0.1%'
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)}%`
}

function factorLabel(id: string) {
  return id.replace(/_/g, ' ')
}

function dateLabel(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp))
}

async function showMore() {
  const current = changes.value
  if (!current || moreLoading.value) return
  moreError.value = ''
  if (visibleChangeCount.value < current.changes.length) {
    visibleChangeCount.value = Math.min(visibleChangeCount.value + 5, current.changes.length)
    await nextTick()
    if (changesList.value) changesList.value.scrollTop = changesList.value.scrollHeight
    return
  }
  if (!current.next || !activeController) return

  moreLoading.value = true
  const controller = activeController
  try {
    const page = await getProjectRiskChanges(
      selectedProjectId.value,
      { next: current.next, asOf: current.to },
      { signal: controller.signal },
    )
    if (controller.signal.aborted) return
    changes.value = { ...page, changes: [...current.changes, ...page.changes] }
    visibleChangeCount.value = Math.min(visibleChangeCount.value + 5, changes.value.changes.length)
    await nextTick()
    if (changesList.value) changesList.value.scrollTop = changesList.value.scrollHeight
  } catch (error) {
    if (!controller.signal.aborted) moreError.value = (error as Error).message
  } finally {
    if (!controller.signal.aborted) moreLoading.value = false
  }
}

watch(
  projectPagination,
  async (pagination, _old, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    projectLoading.value = true
    projectError.value = ''
    projectPage.value = undefined
    selectedProjectId.value = ''
    try {
      const page = await listProjects(pagination, { signal: controller.signal })
      if (controller.signal.aborted) return
      projectPage.value = page
      selectedProjectId.value = page.projects[0]?.id ?? ''
    } catch (error) {
      if (!controller.signal.aborted) projectError.value = (error as Error).message
    } finally {
      if (!controller.signal.aborted) projectLoading.value = false
    }
  },
  { immediate: true },
)

watch(selectedProjectId, (projectId, _old, onCleanup) => {
  const controller = new AbortController()
  activeController = controller
  onCleanup(() => controller.abort())
  exposure.value = undefined
  changes.value = undefined
  visibleChangeCount.value = 5
  moreLoading.value = false
  moreError.value = ''
  exposureError.value = ''
  changesError.value = ''
  exposureLoading.value = Boolean(projectId)
  changesLoading.value = Boolean(projectId)
  if (!projectId) return

  void getProjectExposure(projectId, { signal: controller.signal })
    .then((result) => {
      if (!controller.signal.aborted) exposure.value = result
    })
    .catch((error) => {
      if (!controller.signal.aborted) exposureError.value = (error as Error).message
    })
    .finally(() => {
      if (!controller.signal.aborted) exposureLoading.value = false
    })

  void getProjectRiskChanges(projectId, {}, { signal: controller.signal })
    .then((result) => {
      if (!controller.signal.aborted) changes.value = result
    })
    .catch((error) => {
      if (!controller.signal.aborted) changesError.value = (error as Error).message
    })
    .finally(() => {
      if (!controller.signal.aborted) changesLoading.value = false
    })
})
</script>

<template>
  <section aria-labelledby="page-title" class="mx-auto flex max-w-5xl flex-col gap-6">
    <header>
      <h1 id="page-title" class="text-2xl font-semibold tracking-tight">Exposure Snapshot</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        One project at a time · whole-project risk signals
      </p>
    </header>

    <section aria-label="Project selection">
      <Card>
        <CardContent class="grid gap-3">
          <label class="grid gap-1.5 text-sm font-medium">
            Project
            <NativeSelect
              v-model="selectedProjectId"
              data-testid="exposure-project"
              :disabled="projectLoading || !projectPage?.projects.length"
              class="w-full"
            >
              <NativeSelectOption
                v-for="project in projectPage?.projects"
                :key="project.id"
                :value="project.id"
              >
                {{ project.label }}
              </NativeSelectOption>
            </NativeSelect>
          </label>
          <p v-if="projectLoading" role="status">Loading projects…</p>
          <Alert v-else-if="projectError" variant="destructive">
            <AlertDescription>{{ projectError }}</AlertDescription>
          </Alert>
          <p v-else-if="!projectPage?.projects.length" class="text-sm text-muted-foreground">
            No projects available on this page.
          </p>
          <div v-if="projectPage?.next || projectPage?.prev" class="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              :disabled="!projectPage.prev"
              @click="projectPagination = { prev: projectPage.prev }"
            >
              Previous projects
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!projectPage.next"
              @click="projectPagination = { next: projectPage.next }"
            >
              Next projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>

    <template v-if="selectedProject">
      <div class="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="scope-title" class="md:col-span-2">
          <Card>
            <CardHeader>
              <h2 id="scope-title" class="text-lg font-semibold">
                Project scope · {{ selectedProject.label }}
              </h2>
            </CardHeader>
            <CardContent>
              <p v-if="exposureLoading" role="status">Loading project exposure…</p>
              <Alert v-else-if="exposureError" variant="destructive">
                <AlertDescription>{{ exposureError }}</AlertDescription>
              </Alert>
              <template v-else-if="exposure">
                <p data-testid="project-total" class="text-2xl font-semibold">
                  Project entities: {{ countText(exposure.total) }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                  Entities in this project; not necessarily reviewed, approved, or confirmed
                  suppliers.
                </p>
              </template>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="themes-title">
          <Card>
            <CardHeader>
              <h2 id="themes-title" class="text-lg font-semibold">Selected risk themes</h2>
              <p class="text-sm text-muted-foreground">
                Categories overlap; these four themes are not an exhaustive breakdown.
              </p>
            </CardHeader>
            <CardContent>
              <p v-if="exposureLoading" role="status">Loading risk themes…</p>
              <Alert v-else-if="exposureError" variant="destructive">
                <AlertDescription>Risk-theme counts unavailable.</AlertDescription>
              </Alert>
              <ul v-else-if="exposure" class="grid gap-5">
                <li
                  v-for="theme in themes"
                  :key="theme.key"
                  :data-testid="`theme-${theme.key}`"
                  class="grid gap-2"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span class="font-medium">{{ theme.label }}</span>
                    <Badge v-if="categoryPercent(theme.key) !== undefined" variant="muted">
                      {{ percentText(categoryPercent(theme.key)!) }}
                    </Badge>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ categoryText(theme.key) }}</span>
                  <Progress
                    v-if="categoryPercent(theme.key) !== undefined"
                    class="h-3"
                    :model-value="categoryPercent(theme.key)"
                    :aria-label="`${theme.label}: ${categoryText(theme.key)}`"
                  />
                  <span v-else class="text-xs text-muted-foreground">
                    {{
                      exposure.total.count === 0 && exposure.total.qualifier === 'eq'
                        ? 'No project entities to compare.'
                        : 'Proportion unavailable: count is not exact.'
                    }}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="changes-title">
          <Card>
            <CardHeader>
              <h2 id="changes-title" class="text-lg font-semibold">Recent risk changes</h2>
              <p class="text-sm text-muted-foreground">
                Risk-factor additions and removals in the last seven days.
              </p>
            </CardHeader>
            <CardContent>
              <p v-if="changesLoading" role="status">Loading recent changes…</p>
              <Alert v-else-if="changesError" variant="destructive">
                <AlertDescription>{{ changesError }}</AlertDescription>
              </Alert>
              <template v-else-if="changes">
                <p v-if="!changes.changes.length" class="text-sm text-muted-foreground">
                  {{
                    changes.next
                      ? 'No risk changes returned on this page.'
                      : 'No risk changes returned for this period.'
                  }}
                </p>
                <ul
                  ref="changesList"
                  v-else
                  aria-label="Recent risk changes"
                  tabindex="0"
                  class="mt-4 max-h-80 divide-y overflow-y-auto pr-2"
                >
                  <li
                    v-for="(change, index) in visibleChanges"
                    :key="`${change.projectEntityId}-${change.factor}-${change.timestamp}-${index}`"
                    class="grid gap-2 py-3 text-sm"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="font-medium">{{
                        change.entityName || `Project entity ${change.projectEntityId}`
                      }}</span>
                      <time class="text-xs text-muted-foreground" :datetime="change.timestamp">{{
                        dateLabel(change.timestamp)
                      }}</time>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <Badge variant="muted">Signal {{ change.changeType }}</Badge>
                      <span>{{ change.factorLabel || factorLabel(change.factor) }}</span>
                    </div>
                  </li>
                </ul>
                <p v-if="moreError" role="alert" class="mt-3 text-sm">{{ moreError }}</p>
                <Button
                  v-if="canShowMore"
                  variant="outline"
                  size="sm"
                  class="mt-3"
                  :disabled="moreLoading"
                  @click="showMore"
                >
                  {{ moreLoading ? 'Loading more changes…' : 'Show more changes' }}
                </Button>
              </template>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="follow-up-title">
        <Card>
          <CardHeader>
            <h2 id="follow-up-title" class="font-semibold">Follow up</h2>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Open Risk Breakdown and select a project there to review entities.
            </p>
            <Button as-child variant="outline" class="mt-3">
              <RouterLink to="/management">Go to Risk Breakdown</RouterLink>
            </Button>
          </CardContent>
        </Card>
      </section>
    </template>
  </section>
</template>
