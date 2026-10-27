<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { EntityInvestigation } from '@shared/api/entities'

const props = defineProps<{ profile: EntityInvestigation['profile'] }>()
const facts = computed(() =>
  [
    { label: 'Status', value: props.profile.latestStatus },
    { label: 'Registration', value: props.profile.registrationDate },
    { label: 'Company type', value: props.profile.companyType },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value)),
)
</script>

<template>
  <Card class="gap-0 py-5">
    <header class="grid gap-4 px-5 sm:grid-cols-[1fr_auto]">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 data-testid="entity-label" class="text-xl font-semibold">{{ profile.label }}</h2>
          <Badge variant="muted">{{ profile.type }}</Badge>
          <Badge v-if="profile.sanctioned" variant="critical">Sanctioned</Badge>
          <Badge v-if="profile.pep" variant="elevated">PEP</Badge>
          <Badge v-if="profile.closed" variant="muted">Closed</Badge>
        </div>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ profile.countries.join(', ') || 'No countries recorded' }}
        </p>
        <dl v-if="facts.length" class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div v-for="fact in facts" :key="fact.label">
            <dt class="inline text-muted-foreground">{{ fact.label }}:</dt>
            <dd class="inline">{{ fact.value }}</dd>
          </div>
        </dl>
      </div>
      <p class="font-mono text-xs text-muted-foreground">{{ profile.id }}</p>
    </header>
  </Card>
</template>
