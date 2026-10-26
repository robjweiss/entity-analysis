<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EntityDetail, EntityPage, ProjectPage } from '@shared/api/projects'

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

    <Card class="gap-0 py-0">
      <CardContent class="grid gap-3 py-4">
        <label class="grid gap-1.5 text-sm font-medium">
          Project
          <NativeSelect
            v-model="selectedProjectId"
            data-testid="priority-queue-project"
            :disabled="projectLoading || !projectPage?.projects.length"
          >
            <option v-for="project in projectPage?.projects" :key="project.id" :value="project.id">
              {{ project.label }}
            </option>
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
            type="button"
            size="sm"
            :disabled="!projectPage.prev"
            @click="projectCursor = { prev: projectPage.prev }"
          >
            Previous projects
          </Button>
          <Button
            type="button"
            size="sm"
            :disabled="!projectPage.next"
            @click="projectCursor = { next: projectPage.next }"
          >
            Next projects
          </Button>
        </div>

        <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="applyFilters">
          <label class="grid gap-1.5 text-sm font-medium sm:col-span-3">
            Search entity name
            <InputGroup>
              <InputGroupAddon>
                <Search class="size-4" />
              </InputGroupAddon>
              <InputGroupInput v-model="name" data-testid="priority-queue-search" />
            </InputGroup>
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
            <Button type="submit" size="sm">Apply filters</Button>
            <Button type="button" size="sm" variant="ghost" @click="clearFilters">
              Clear filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Card class="gap-0 py-0">
      <CardHeader class="flex items-center justify-between border-b py-3">
        <h2 class="font-medium">Entities requiring review</h2>
        <p
          v-if="entityPage"
          data-testid="priority-queue-count"
          class="text-sm text-muted-foreground"
        >
          {{ pageCountLabel }}
        </p>
      </CardHeader>
      <CardContent class="p-0">
        <p v-if="entityLoading" role="status" class="px-4 py-12 text-center">Loading entities…</p>
        <Alert v-else-if="entityError" variant="destructive" class="m-4">
          <AlertDescription>{{ entityError }}</AlertDescription>
        </Alert>
        <p
          v-else-if="entityPage && !entityPage.entities.length"
          class="px-4 py-12 text-center text-sm text-muted-foreground"
        >
          No entities match these filters.
        </p>
        <Table v-else-if="entityPage" class="min-w-[44rem] text-left">
          <TableCaption class="sr-only">Priority queue entities</TableCaption>
          <TableHeader class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <TableRow>
              <TableHead scope="col" class="px-4 py-3">Entity</TableHead>
              <TableHead scope="col" class="px-4 py-3">Risk severity</TableHead>
              <TableHead scope="col" class="px-4 py-3">Risk categories</TableHead>
              <TableHead scope="col" class="px-4 py-3">Risk factors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="entity in entityPage.entities"
              :key="entity.id"
              :data-testid="`priority-queue-entity-${entity.id}`"
            >
              <TableCell class="px-4 py-3">
                <Button
                  type="button"
                  variant="link"
                  class="h-auto p-0 font-medium"
                  :aria-label="`Review risk details for ${entity.label}`"
                  @click="selectedEntity = entity"
                >
                  {{ entity.label }}
                </Button>
              </TableCell>
              <TableCell class="px-4 py-3">
                <Badge v-if="entity.riskSeverity" :variant="entity.riskSeverity">
                  {{ riskSeverityLabels[entity.riskSeverity] }}
                </Badge>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell class="px-4 py-3">
                <span class="flex flex-wrap gap-1.5">
                  <Badge
                    v-for="category in entity.riskCategories"
                    :key="category.id"
                    variant="muted"
                  >
                    {{ category.label }}
                  </Badge>
                </span>
              </TableCell>
              <TableCell class="px-4 py-3" data-testid="priority-queue-risk-factors">
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
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter v-if="entityPage?.next || entityPage?.prev" class="justify-end gap-3 py-3">
        <Button
          type="button"
          size="sm"
          :disabled="!entityPage.prev"
          @click="entityCursor = { prev: entityPage.prev }"
        >
          Previous entities
        </Button>
        <Button
          type="button"
          size="sm"
          :disabled="!entityPage.next"
          @click="entityCursor = { next: entityPage.next }"
        >
          Next entities
        </Button>
      </CardFooter>
    </Card>
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
        <Alert v-else-if="detailError" variant="destructive">
          <AlertDescription>{{ detailError }}</AlertDescription>
        </Alert>
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
                  <Badge data-testid="risk-factor-level" :variant="factor.level" class="shrink-0">
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
