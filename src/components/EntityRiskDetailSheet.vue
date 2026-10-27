<script setup lang="ts">
import { ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getProjectEntityDetail } from '@/api/projects'
import type { EntityDetail, EntityPage } from '@shared/api/projects'
import { riskLevelLabels } from '@/lib/riskLevelLabels'

type Entity = EntityPage['entities'][number]
const props = defineProps<{ projectId: string; entity?: Entity }>()
const open = defineModel<boolean>('open', { required: true })
const entityDetail = ref<EntityDetail>()
const detailLoading = ref(false)
const detailError = ref('')

watch(
  [() => props.projectId, () => props.entity, open],
  async ([projectId, entity, isOpen], _old, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    entityDetail.value = undefined
    detailError.value = ''
    if (!entity || !isOpen || !projectId) {
      detailLoading.value = false
      return
    }
    detailLoading.value = true
    try {
      const detail = await getProjectEntityDetail(projectId, entity.id, {
        signal: controller.signal,
      })
      if (!controller.signal.aborted) entityDetail.value = detail
    } catch (error) {
      if (!controller.signal.aborted) detailError.value = (error as Error).message
    } finally {
      if (!controller.signal.aborted) detailLoading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader v-if="entity">
        <SheetTitle>{{ entity.label }}</SheetTitle>
        <SheetDescription>{{ entity.countries.join(', ') }}</SheetDescription>
      </SheetHeader>
      <div v-if="entity" class="grid gap-6 px-4 pb-6">
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
                  <Badge data-testid="risk-factor-level" :variant="factor.level" class="shrink-0">{{
                    riskLevelLabels[factor.level]
                  }}</Badge>
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
