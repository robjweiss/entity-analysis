<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import ProjectPicker from '@/components/ProjectPicker.vue'
import EntityRiskDetailSheet from '@/components/EntityRiskDetailSheet.vue'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listProjectEntities } from '@/api/projects'
import type { EntityPage } from '@shared/api/projects'
import { useProjectSelection } from '@/composables/useProjectSelection'
import { riskLevelLabels } from '@/lib/riskLevelLabels'

type Entity = EntityPage['entities'][number]
type Cursor = { next?: string; prev?: string }

const {
  projectPage,
  projectPagination: projectCursor,
  selectedProjectId,
  projectLoading,
  projectError,
} = useProjectSelection()

const draftFilters = ref({ name: '', country: '', riskCategory: '' })
const filters = ref({ name: '', country: '', riskCategory: '' })
const entityPage = ref<EntityPage>()
const entityCursor = ref<Cursor>({})
const entityLoading = ref(false)
const entityError = ref('')

const selectedEntity = ref<Entity>()
const projectModel = computed({
  get: () => selectedProjectId.value,
  set: (projectId: string) => {
    selectedProjectId.value = projectId
    entityCursor.value = {}
  },
})
const detailOpen = computed({
  get: () => Boolean(selectedEntity.value),
  set: (open: boolean) => {
    if (!open) selectedEntity.value = undefined
  },
})

const pageCountLabel = computed(() => {
  const count = entityPage.value?.entities.length ?? 0
  return `${count} ${count === 1 ? 'entity' : 'entities'} on this page`
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
    try {
      const page = await listProjectEntities(
        selectedProjectId.value,
        { ...filters.value, ...entityCursor.value },
        { signal: controller.signal },
      )
      if (!controller.signal.aborted) entityPage.value = page
    } catch (error) {
      if (!controller.signal.aborted) entityError.value = (error as Error).message
    } finally {
      if (!controller.signal.aborted) entityLoading.value = false
    }
  },
  { immediate: true },
)

function applyFilters() {
  filters.value = {
    name: draftFilters.value.name.trim(),
    country: draftFilters.value.country.trim().toUpperCase(),
    riskCategory: draftFilters.value.riskCategory.trim(),
  }
  entityCursor.value = {}
}

function clearFilters() {
  draftFilters.value = { name: '', country: '', riskCategory: '' }
  applyFilters()
}

function changeProjectPage(cursor: Cursor) {
  projectCursor.value = cursor
  entityCursor.value = {}
}
</script>

<template>
  <section aria-labelledby="page-title" class="mx-auto flex max-w-7xl flex-col gap-6">
    <div>
      <h1 id="page-title" class="text-2xl font-semibold tracking-tight">Risk Breakdown</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Review risk signals across entities in a project.
      </p>
    </div>

    <Card class="gap-0 py-0">
      <CardContent class="grid gap-3 py-4">
        <ProjectPicker
          v-model="projectModel"
          :page="projectPage"
          :loading="projectLoading"
          :error="projectError"
          test-id="priority-queue-project"
          @pagination="changeProjectPage"
        />

        <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="applyFilters">
          <label class="grid gap-1.5 text-sm font-medium sm:col-span-3">
            Search entity name
            <InputGroup>
              <InputGroupAddon>
                <Search class="size-4" />
              </InputGroupAddon>
              <InputGroupInput v-model="draftFilters.name" data-testid="priority-queue-search" />
            </InputGroup>
          </label>
          <label class="grid gap-1.5 text-sm font-medium">
            Country (3-letter code)
            <Input
              v-model="draftFilters.country"
              data-testid="priority-queue-country-filter"
              placeholder="JPN"
              maxlength="3"
            />
          </label>
          <label class="grid gap-1.5 text-sm font-medium">
            Risk category ID
            <Input
              v-model="draftFilters.riskCategory"
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
          <TableCaption class="sr-only">Risk breakdown entities</TableCaption>
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
                  {{ riskLevelLabels[entity.riskSeverity] }}
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

  <EntityRiskDetailSheet
    v-model:open="detailOpen"
    :entity="selectedEntity"
    :project-id="selectedProjectId"
  />
</template>
