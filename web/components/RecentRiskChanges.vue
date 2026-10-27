<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ProjectRiskChanges } from '@shared/api/projects'
type ProjectRiskChange = ProjectRiskChanges['changes'][number]

const props = defineProps<{
  loading: boolean
  error: string
  moreError: string
  loaded: boolean
  hasNextPage: boolean
  visibleChanges: ProjectRiskChange[]
  canShowMore: boolean
  loadingMore: boolean
}>()
const emit = defineEmits<{ showMore: [] }>()
const list = ref<HTMLUListElement>()
watch(
  () => props.visibleChanges.length,
  async (length, previousLength) => {
    if (previousLength === undefined || previousLength === 0 || length <= previousLength) return
    await nextTick()
    if (list.value) list.value.scrollTop = list.value.scrollHeight
  },
)

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
</script>

<template>
  <p v-if="loading" role="status">Loading recent changes…</p>
  <Alert v-else-if="error" variant="destructive"
    ><AlertDescription>{{ error }}</AlertDescription></Alert
  >
  <template v-else-if="loaded">
    <p v-if="!visibleChanges.length" class="text-sm text-muted-foreground">
      {{
        hasNextPage
          ? 'No risk changes returned on this page.'
          : 'No risk changes returned for this period.'
      }}
    </p>
    <ul
      ref="list"
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
      :disabled="loadingMore"
      @click="emit('showMore')"
    >
      {{ loadingMore ? 'Loading more changes…' : 'Show more changes' }}
    </Button>
  </template>
</template>
