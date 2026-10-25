<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { EntityDetail, EntityPage, ProjectPage } from '../../bff/projects.ts'

type Cursor = { next?: string; prev?: string }
type Entity = EntityPage['entities'][number]
type RiskSeverity = NonNullable<Entity['riskSeverity']>

const riskSeverityLabels: Record<RiskSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  elevated: 'Elevated',
  relevant: 'Relevant',
}

const projectPage = ref<ProjectPage>()
const projectCursor = ref<Cursor>({})
const selectedProjectId = ref('')
const projectLoading = ref(false)
const projectError = ref('')

const name = ref('')
const country = ref('')
const riskCategory = ref('')
const filters = ref({ name: '', country: '', riskCategory: '' })
const entityPage = ref<EntityPage>()
const entityCursor = ref<Cursor>({})
const entityLoading = ref(false)
const entityError = ref('')

const selectedEntity = ref<Entity>()
const entityDetail = ref<EntityDetail>()
const detailLoading = ref(false)
const detailError = ref('')

const pageCountLabel = computed(() => {
  const count = entityPage.value?.entities.length ?? 0
  return `${count} ${count === 1 ? 'entity' : 'entities'} on this page`
})

function queryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  return query.size ? `?${query}` : ''
}

async function request<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? 'Unable to load data. Please try again.')
  }
  return response.json() as Promise<T>
}

watch(
  projectCursor,
  async (cursor, _old, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    projectLoading.value = true
    projectError.value = ''
    projectPage.value = undefined
    selectedProjectId.value = ''
    try {
      const page = await request<ProjectPage>(
        `/api/projects${queryString(cursor)}`,
        controller.signal,
      )
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

watch([selectedProjectId, filters], () => {
  entityCursor.value = {}
})

watch(
  [selectedProjectId, filters, entityCursor],
  async (_values, _old, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    selectedEntity.value = undefined
    entityPage.value = undefined
    entityError.value = ''
    if (!selectedProjectId.value) {
      entityLoading.value = false
      return
    }
    entityLoading.value = true
    const url = `/api/projects/${encodeURIComponent(selectedProjectId.value)}/entities${queryString({ ...filters.value, ...entityCursor.value })}`
    try {
      const page = await request<EntityPage>(url, controller.signal)
      if (!controller.signal.aborted) entityPage.value = page
    } catch (error) {
      if (!controller.signal.aborted) entityError.value = (error as Error).message
    } finally {
      if (!controller.signal.aborted) entityLoading.value = false
    }
  },
  { immediate: true },
)

watch(selectedEntity, async (entity, _old, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  entityDetail.value = undefined
  detailError.value = ''
  if (!entity) {
    detailLoading.value = false
    return
  }
  detailLoading.value = true
  try {
    const detail = await request<EntityDetail>(
      `/api/projects/${encodeURIComponent(selectedProjectId.value)}/entities/${encodeURIComponent(entity.id)}`,
      controller.signal,
    )
    if (!controller.signal.aborted) entityDetail.value = detail
  } catch (error) {
    if (!controller.signal.aborted) detailError.value = (error as Error).message
  } finally {
    if (!controller.signal.aborted) detailLoading.value = false
  }
})

function applyFilters() {
  filters.value = {
    name: name.value.trim(),
    country: country.value.trim().toUpperCase(),
    riskCategory: riskCategory.value.trim(),
  }
}

function clearFilters() {
  name.value = ''
  country.value = ''
  riskCategory.value = ''
  applyFilters()
}
</script>

<template>
  <section aria-labelledby="page-title" class="mx-auto flex max-w-7xl flex-col gap-6">
    <div>
      <h1 id="page-title" class="text-2xl font-semibold tracking-tight">Priority Queue</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Review risk signals across entities in a project.
      </p>
    </div>

    <div class="grid gap-3 rounded-lg border bg-card p-4">
      <label class="grid gap-1.5 text-sm font-medium">
        Project
        <select
          v-model="selectedProjectId"
          data-testid="priority-queue-project"
          :disabled="projectLoading || !projectPage?.projects.length"
          class="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option v-for="project in projectPage?.projects" :key="project.id" :value="project.id">
            {{ project.label }}
          </option>
        </select>
      </label>
      <p v-if="projectLoading" role="status">Loading projects…</p>
      <p v-else-if="projectError" role="alert">{{ projectError }}</p>
      <p v-else-if="!projectPage?.projects.length" class="text-sm text-muted-foreground">
        No projects available on this page.
      </p>
      <div v-if="projectPage?.next || projectPage?.prev" class="flex gap-3">
        <button
          type="button"
          :disabled="!projectPage.prev"
          @click="projectCursor = { prev: projectPage.prev }"
        >
          Previous projects
        </button>
        <button
          type="button"
          :disabled="!projectPage.next"
          @click="projectCursor = { next: projectPage.next }"
        >
          Next projects
        </button>
      </div>

      <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="applyFilters">
        <label class="grid gap-1.5 text-sm font-medium sm:col-span-3">
          Search entity name
          <div class="relative">
            <Search
              class="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
            />
            <Input v-model="name" data-testid="priority-queue-search" class="pl-8" />
          </div>
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          Country (3-letter code)
          <Input
            v-model="country"
            data-testid="priority-queue-country-filter"
            placeholder="JPN"
            maxlength="3"
          />
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          Risk category ID
          <Input
            v-model="riskCategory"
            data-testid="priority-queue-category-filter"
            placeholder="sanctions"
          />
        </label>
        <div class="flex items-end gap-3">
          <button type="submit" class="h-8 text-sm font-medium">Apply filters</button>
          <button
            type="button"
            class="h-8 text-sm font-medium text-muted-foreground hover:text-foreground"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>
      </form>
    </div>

    <div class="overflow-hidden rounded-lg border bg-card">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h2 class="font-medium">Entities requiring review</h2>
        <p
          v-if="entityPage"
          data-testid="priority-queue-count"
          class="text-sm text-muted-foreground"
        >
          {{ pageCountLabel }}
        </p>
      </div>
      <p v-if="entityLoading" role="status" class="px-4 py-12 text-center">Loading entities…</p>
      <p v-else-if="entityError" role="alert" class="px-4 py-12 text-center">{{ entityError }}</p>
      <p
        v-else-if="entityPage && !entityPage.entities.length"
        class="px-4 py-12 text-center text-sm text-muted-foreground"
      >
        No entities match these filters.
      </p>
      <div v-else-if="entityPage" class="overflow-x-auto">
        <table aria-label="Priority queue entities" class="w-full min-w-[44rem] text-left text-sm">
          <thead class="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" class="px-4 py-3 font-medium">Entity</th>
              <th scope="col" class="px-4 py-3 font-medium">Risk severity</th>
              <th scope="col" class="px-4 py-3 font-medium">Risk categories</th>
              <th scope="col" class="px-4 py-3 font-medium">Risk factors</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="entity in entityPage.entities"
              :key="entity.id"
              :data-testid="`priority-queue-entity-${entity.id}`"
              :aria-label="`Open risk details for ${entity.label}`"
              tabindex="0"
              class="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
              @click="selectedEntity = entity"
              @keydown.enter.prevent="selectedEntity = entity"
              @keydown.space.prevent="selectedEntity = entity"
            >
              <td class="px-4 py-3">
                <span class="grid gap-1">
                  <span class="font-medium">{{ entity.label }}</span>
                </span>
              </td>
              <td class="px-4 py-3">
                <Badge
                  v-if="entity.riskSeverity"
                  :variant="entity.riskSeverity"
                >
                  {{ riskSeverityLabels[entity.riskSeverity] }}
                </Badge>
                <span v-else class="text-muted-foreground">—</span>
              </td>
              <td class="px-4 py-3">
                <span class="flex flex-wrap gap-1.5">
                  <Badge
                    v-for="category in entity.riskCategories"
                    :key="category.id"
                    variant="muted"
                  >
                    {{ category.label }}
                  </Badge>
                </span>
              </td>
              <td class="px-4 py-3" data-testid="priority-queue-risk-factors">
                <span v-if="entity.riskFactors.length" class="flex flex-wrap gap-1.5">
                  <Badge
                    v-for="factor in entity.riskFactors.slice(0, 2)"
                    :key="factor.id"
                    variant="muted"
                  >
                    {{ factor.label }}
                  </Badge>
                  <span v-if="entity.riskFactors.length > 2" class="text-muted-foreground">
                    +{{ entity.riskFactors.length - 2 }} more
                  </span>
                </span>
                <span v-else class="text-muted-foreground">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="entityPage?.next || entityPage?.prev"
        class="flex justify-end gap-3 border-t px-4 py-3"
      >
        <button
          type="button"
          :disabled="!entityPage.prev"
          @click="entityCursor = { prev: entityPage.prev }"
        >
          Previous entities
        </button>
        <button
          type="button"
          :disabled="!entityPage.next"
          @click="entityCursor = { next: entityPage.next }"
        >
          Next entities
        </button>
      </div>
    </div>
  </section>

  <Sheet
    :open="Boolean(selectedEntity)"
    @update:open="(open) => !open && (selectedEntity = undefined)"
  >
    <SheetContent class="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader v-if="selectedEntity">
        <SheetTitle>{{ selectedEntity.label }}</SheetTitle>
        <SheetDescription>{{ selectedEntity.countries.join(', ') }}</SheetDescription>
      </SheetHeader>
      <div v-if="selectedEntity" class="grid gap-6 px-4 pb-6">
        <p v-if="detailLoading" role="status">Loading risk details…</p>
        <p v-else-if="detailError" role="alert">{{ detailError }}</p>
        <template v-else-if="entityDetail">
          <div class="grid gap-2">
            <h2 class="text-sm font-medium">Risk factors</h2>
            <p v-if="!entityDetail.riskFactors.length" class="text-sm text-muted-foreground">
              No recorded risk factors.
            </p>
            <ul v-else class="grid gap-2">
              <li
                v-for="factor in entityDetail.riskFactors"
                :key="factor.id"
                class="rounded-md border p-3 text-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <span>{{ factor.label }}</span>
                  <Badge
                    data-testid="risk-factor-level"
                    :variant="factor.level"
                    class="shrink-0"
                  >
                    {{ riskSeverityLabels[factor.level] }}
                  </Badge>
                </div>
              </li>
            </ul>
          </div>
          <div class="grid gap-2">
            <h2 class="text-sm font-medium">Risk changes</h2>
            <p v-if="!entityDetail.riskChanges.length" class="text-sm text-muted-foreground">
              No recorded risk changes.
            </p>
            <ul v-else class="grid gap-2">
              <li
                v-for="change in entityDetail.riskChanges"
                :key="`${change.id}-${change.timestamp}`"
                class="rounded-md border p-3 text-sm"
              >
                {{ change.id }} · {{ change.changeType }} · {{ change.timestamp }}
              </li>
            </ul>
            <p v-if="entityDetail.nextRiskChange" class="text-sm text-muted-foreground">
              More changes are available.
            </p>
          </div>
        </template>
      </div>
    </SheetContent>
  </Sheet>
</template>
