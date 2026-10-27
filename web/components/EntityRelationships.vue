<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { EntityInvestigation } from '@shared/api/entities'

defineProps<{
  relationships: EntityInvestigation['relationships']
  count: EntityInvestigation['relationshipCount']
  hasMore: boolean
  loading: boolean
  error: string
}>()

defineEmits<{ loadMore: [] }>()
</script>

<template>
  <section aria-labelledby="relationships-heading">
    <Card class="gap-0 py-0">
      <CardHeader class="border-b px-5 py-4">
        <h2 id="relationships-heading" class="font-medium">Related entities</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ count }} direct relationships recorded.</p>
      </CardHeader>
      <CardContent class="p-0">
        <p v-if="!relationships.length" class="p-5 text-sm text-muted-foreground">
          No direct relationships returned.
        </p>
        <ul v-else class="divide-y">
          <li
            v-for="relationship in relationships"
            :key="relationship.id"
            class="flex items-start justify-between gap-4 p-5"
          >
            <div>
              <p class="font-medium">{{ relationship.label }}</p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ relationship.types.join(', ')
                }}<template v-if="relationship.countries.length">
                  · {{ relationship.countries.join(', ') }}</template
                >
              </p>
            </div>
            <div class="flex gap-1">
              <Badge v-if="relationship.sanctioned" variant="critical">Sanctioned</Badge
              ><Badge v-if="relationship.pep" variant="elevated">PEP</Badge>
            </div>
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
          data-testid="show-more-relationships"
          :disabled="loading"
          @click="$emit('loadMore')"
        >
          {{ loading ? 'Loading relationships…' : 'Show more relationships' }}
        </Button>
      </CardFooter>
    </Card>
  </section>
</template>
