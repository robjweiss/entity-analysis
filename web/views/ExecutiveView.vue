<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import RecentRiskChanges from '@/components/RecentRiskChanges.vue'
import ProjectPicker from '@/components/ProjectPicker.vue'
import { getProjectExposure } from '@/api/projects'
import type { ProjectExposure } from '@shared/api/projects'
import { useProjectSelection } from '@/composables/useProjectSelection'
import { useProjectRiskChanges } from '@/composables/useProjectRiskChanges'

type Category = keyof ProjectExposure['categories']

const themes: { key: Category; label: string }[] = [
  { key: 'sanctions', label: 'Sanctions' },
  { key: 'forcedLabor', label: 'Forced labor' },
  { key: 'exportControls', label: 'Export controls' },
  { key: 'adverseMedia', label: 'Adverse media' },
]

const { projectPage, projectPagination, selectedProjectId, projectLoading, projectError } =
  useProjectSelection()

const exposure = ref<ProjectExposure>()
const exposureLoading = ref(false)
const exposureError = ref('')
const {
  changes: riskChangeResponse,
  loading: riskChangesLoading,
  loadingMore: riskChangesLoadingMore,
  error: riskChangesError,
  moreError: riskChangesMoreError,
  visibleChanges,
  canShowMore,
  showMore: showMoreRiskChanges,
} = useProjectRiskChanges(selectedProjectId)

const selectedProject = computed(() =>
  projectPage.value?.projects.find((project) => project.id === selectedProjectId.value),
)
function countText(count: ProjectExposure['total']) {
  return `${count.qualifier === 'gte' ? 'at least ' : ''}${count.count.toLocaleString()}`
}

function percentText(value: number) {
  if (value > 0 && value < 0.1) return '<0.1%'
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)}%`
}

const themeRows = computed(() => {
  const currentExposure = exposure.value
  if (!currentExposure) return []
  return themes.map((theme) => {
    const { total, categories } = currentExposure
    const category = categories[theme.key]
    const displayCount = `${countText(category)} of ${countText(total)} project entities`
    const percent =
      total.qualifier === 'eq' && category.qualifier === 'eq' && total.count > 0
        ? Math.min(100, (category.count / total.count) * 100)
        : undefined
    return {
      ...theme,
      countText: displayCount,
      percent,
      percentLabel: percent === undefined ? undefined : percentText(percent),
      unavailableReason:
        percent === undefined
          ? total.qualifier === 'eq' && total.count === 0
            ? 'No project entities to compare.'
            : 'Proportion unavailable: count is not exact.'
          : '',
    }
  })
})

watch(selectedProjectId, (projectId, _old, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  exposure.value = undefined
  exposureError.value = ''
  exposureLoading.value = Boolean(projectId)
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
          <ProjectPicker
            v-model="selectedProjectId"
            :page="projectPage"
            :loading="projectLoading"
            :error="projectError"
            test-id="exposure-project"
            button-variant="outline"
            @pagination="projectPagination = $event"
          />
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
                  v-for="theme in themeRows"
                  :key="theme.key"
                  :data-testid="`theme-${theme.key}`"
                  class="grid gap-2"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span class="font-medium">{{ theme.label }}</span>
                    <Badge v-if="theme.percentLabel" variant="muted">
                      {{ theme.percentLabel }}
                    </Badge>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ theme.countText }}</span>
                  <Progress
                    v-if="theme.percent !== undefined"
                    class="h-3"
                    :model-value="theme.percent"
                    :aria-label="`${theme.label}: ${theme.countText}`"
                  />
                  <span v-else class="text-xs text-muted-foreground">
                    {{ theme.unavailableReason }}
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
              <RecentRiskChanges
                :loaded="Boolean(riskChangeResponse)"
                :has-next-page="Boolean(riskChangeResponse?.next)"
                :loading="riskChangesLoading"
                :loading-more="riskChangesLoadingMore"
                :error="riskChangesError"
                :more-error="riskChangesMoreError"
                :visible-changes="visibleChanges"
                :can-show-more="canShowMore"
                @show-more="showMoreRiskChanges"
              />
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
