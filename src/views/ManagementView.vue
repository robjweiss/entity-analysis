<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
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
import type { EntityPage } from '@shared/api/projects'
import { useProjectSelection } from '@/composables/useProjectSelection'
import { useProjectEntities } from '@/composables/useProjectEntities'
import { useRiskCategories } from '@/composables/useRiskCategories'
import { riskLevelLabels } from '@/lib/riskLevelLabels'
import { emptyProjectEntityFilters } from '@/lib/projectEntityFilters'

type Entity = EntityPage['entities'][number]
const {
  projectPage,
  projectPagination: projectCursor,
  selectedProjectId,
  projectLoading,
  projectError,
} = useProjectSelection()

const { entityPage, entityLoading, entityError, applyFilters, changePage } =
  useProjectEntities(selectedProjectId)
const { riskCategories, riskCategoriesLoading, riskCategoriesError, loadRiskCategories } =
  useRiskCategories()

const draftFilters = ref(emptyProjectEntityFilters())
const selectedEntity = ref<Entity>()
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
  entityPage,
  (page) => {
    if (!page) selectedEntity.value = undefined
  },
  { flush: 'sync' },
)

function clearFilters() {
  draftFilters.value = emptyProjectEntityFilters()
  applyFilters(draftFilters.value)
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
          v-model="selectedProjectId"
          :page="projectPage"
          :loading="projectLoading"
          :error="projectError"
          test-id="priority-queue-project"
          @pagination="projectCursor = $event"
        />

        <form class="grid gap-3 sm:grid-cols-3" @submit.prevent="applyFilters(draftFilters)">
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
          <div class="grid content-start gap-1.5">
            <label for="priority-queue-category-filter" class="text-sm font-medium">
              Risk category
            </label>
            <NativeSelect
              id="priority-queue-category-filter"
              v-model="draftFilters.riskCategory"
              data-testid="priority-queue-category-filter"
              :disabled="
                riskCategoriesLoading || riskCategoriesError !== '' || !riskCategories.length
              "
            >
              <NativeSelectOption value="">All risk categories</NativeSelectOption>
              <NativeSelectOption
                v-for="category in riskCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.label }}
              </NativeSelectOption>
            </NativeSelect>
            <p v-if="riskCategoriesLoading" role="status" class="text-sm text-muted-foreground">
              Loading risk categories…
            </p>
            <div v-else-if="riskCategoriesError" role="alert" class="text-sm text-destructive">
              <p>{{ riskCategoriesError }}</p>
              <Button type="button" size="sm" variant="outline" @click="loadRiskCategories">
                Retry loading categories
              </Button>
            </div>
            <p v-else-if="!riskCategories.length" class="text-sm text-muted-foreground">
              No risk categories available.
            </p>
          </div>
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
        <Table v-else-if="entityPage" class="min-w-[44rem] table-fixed text-left">
          <TableCaption class="sr-only">Risk breakdown entities</TableCaption>
          <TableHeader class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <TableRow>
              <TableHead scope="col" class="w-56 px-4 py-3">Entity</TableHead>
              <TableHead scope="col" class="w-32 whitespace-normal px-4 py-3"
                >Risk severity</TableHead
              >
              <TableHead scope="col" class="w-40 whitespace-normal px-4 py-3"
                >Risk categories</TableHead
              >
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
                  class="h-auto max-w-full justify-start whitespace-normal p-0 text-left font-medium [overflow-wrap:anywhere]"
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
                    class="max-w-full whitespace-normal [overflow-wrap:anywhere]"
                  >
                    {{ category.label }}
                  </Badge>
                </span>
              </TableCell>
              <TableCell class="px-4 py-3" data-testid="priority-queue-risk-factors">
                <div v-if="entity.riskFactors.length" class="grid min-w-0 gap-1.5">
                  <Badge variant="muted" class="min-w-0 max-w-full justify-self-start">
                    <span class="truncate">{{ entity.riskFactors[0]?.label }}</span>
                  </Badge>
                  <Button
                    type="button"
                    variant="link"
                    class="h-auto justify-self-start p-0 text-muted-foreground"
                    :aria-label="`View all ${entity.riskFactors.length} risk factors for ${entity.label}`"
                    @click="selectedEntity = entity"
                  >
                    {{
                      entity.riskFactors.length > 1
                        ? `+${entity.riskFactors.length - 1} more`
                        : 'View details'
                    }}
                  </Button>
                </div>
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
          @click="changePage({ prev: entityPage.prev })"
        >
          Previous entities
        </Button>
        <Button
          type="button"
          size="sm"
          :disabled="!entityPage.next"
          @click="changePage({ next: entityPage.next })"
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
