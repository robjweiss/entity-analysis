<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { EntityInvestigation } from '@shared/api/entities'

defineProps<{
  records: EntityInvestigation['records']
  count: EntityInvestigation['recordCount']
  hasMore: boolean
  loading: boolean
  error: string
}>()

defineEmits<{ loadMore: [] }>()
</script>

<template>
  <section>
    <Card class="gap-0 py-0">
      <CardHeader class="border-b px-5 py-4">
        <h2 class="font-medium">Supporting records</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ count }} records reference this entity.</p>
      </CardHeader>
      <CardContent class="p-0">
        <p v-if="!records.length" class="p-5 text-sm text-muted-foreground">No records returned.</p>
        <ul v-else class="divide-y">
          <li v-for="record in records" :key="record.id" class="p-4 text-sm">
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
        v-if="hasMore || error"
        class="grid justify-items-center gap-2 bg-transparent px-5 py-3"
      >
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <Button
          v-if="hasMore"
          variant="outline"
          size="sm"
          data-testid="show-more-records"
          :disabled="loading"
          @click="$emit('loadMore')"
        >
          {{ loading ? 'Loading records…' : 'Show more records' }}
        </Button>
      </CardFooter>
    </Card>
  </section>
</template>
