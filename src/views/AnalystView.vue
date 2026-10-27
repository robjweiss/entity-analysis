<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/native-select'
import { listProjectEntities, listProjects } from '@/api/projects'
import type { EntityPage, ProjectPage } from '@shared/api/projects'
import { useEntityInvestigation } from '@/composables/useEntityInvestigation'
import EntityProfileSummary from '@/components/EntityProfileSummary.vue'
import EntityRelationships from '@/components/EntityRelationships.vue'
import EntityRecords from '@/components/EntityRecords.vue'
import { riskLevelLabels } from '@/lib/riskLevelLabels'

const projects = ref<ProjectPage>()
const projectId = ref('')
const projectEntities = ref<EntityPage>()
const projectEntityId = ref('')
const matchId = ref('')
const projectLoading = ref(false)
const entityLoading = ref(false)
const projectError = ref('')
const {
  investigation,
  loading,
  error,
  relationshipsLoading,
  relationshipsError,
  recordsLoading,
  recordsError,
  loadMoreRelationships,
  loadMoreRecords,
} = useEntityInvestigation(matchId)
const selectedProjectEntity = computed(() =>
  projectEntities.value?.entities.find((entity) => entity.id === projectEntityId.value),
)
const matches = computed(() => selectedProjectEntity.value?.matches ?? [])
watch(
  projectId,
  async (id, _old, onCleanup) => {
    projectEntities.value = undefined
    projectEntityId.value = ''
    matchId.value = ''
    projectError.value = ''
    entityLoading.value = false
    if (!id) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    entityLoading.value = true
    try {
      const page = await listProjectEntities(id, {}, { signal: controller.signal })
      if (!controller.signal.aborted) projectEntities.value = page
    } catch (requestError) {
      if (!controller.signal.aborted) projectError.value = (requestError as Error).message
    } finally {
      if (!controller.signal.aborted) entityLoading.value = false
    }
  },
  { immediate: true },
)

watch(projectEntityId, () => {
  matchId.value = ''
  projectError.value = ''
})

watch(
  projects,
  (page) => {
    projectId.value = page?.projects[0]?.id ?? ''
  },
  { once: true },
)

async function loadProjects() {
  const controller = new AbortController()
  onUnmounted(() => controller.abort())
  projectLoading.value = true
  projectError.value = ''
  try {
    const page = await listProjects({}, { signal: controller.signal })
    if (!controller.signal.aborted) projects.value = page
  } catch (requestError) {
    if (!controller.signal.aborted) projectError.value = (requestError as Error).message
  } finally {
    if (!controller.signal.aborted) projectLoading.value = false
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
    <Alert v-else-if="error || projectError" variant="destructive">
      <AlertDescription class="text-destructive">{{ error || projectError }}</AlertDescription>
    </Alert>
    <p
      v-else-if="!investigation"
      class="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground"
    >
      Select a project and resolved entity to begin an investigation.
    </p>

    <template v-else>
      <EntityProfileSummary :profile="investigation.profile" />

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

          <EntityRelationships
            :relationships="investigation.relationships"
            :count="investigation.relationshipCount"
            :has-more="Boolean(investigation.nextRelationship)"
            :loading="relationshipsLoading"
            :error="relationshipsError"
            @load-more="loadMoreRelationships"
          />
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
          <EntityRecords
            :records="investigation.records"
            :count="investigation.recordCount"
            :has-more="Boolean(investigation.nextRecord)"
            :loading="recordsLoading"
            :error="recordsError"
            @load-more="loadMoreRecords"
          />

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
