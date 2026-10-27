<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { ProjectPage } from '@shared/api/projects'

defineProps<{
  page?: ProjectPage
  loading: boolean
  error: string
  testId: string
  buttonVariant?: 'default' | 'outline'
}>()

const selectedProjectId = defineModel<string>({ required: true })
const emit = defineEmits<{ pagination: [pagination: { next?: string; prev?: string }] }>()
</script>

<template>
  <label class="grid gap-1.5 text-sm font-medium">
    Project
    <NativeSelect
      v-model="selectedProjectId"
      :data-testid="testId"
      :disabled="loading || !page?.projects.length"
      class="w-full"
    >
      <NativeSelectOption v-for="project in page?.projects" :key="project.id" :value="project.id">
        {{ project.label }}
      </NativeSelectOption>
    </NativeSelect>
  </label>
  <p v-if="loading" role="status">Loading projects…</p>
  <Alert v-else-if="error" variant="destructive">
    <AlertDescription>{{ error }}</AlertDescription>
  </Alert>
  <p v-else-if="!page?.projects.length" class="text-sm text-muted-foreground">
    No projects available on this page.
  </p>
  <div v-if="page?.next || page?.prev" class="flex gap-3">
    <Button
      type="button"
      :variant="buttonVariant"
      size="sm"
      :disabled="!page.prev"
      @click="emit('pagination', { prev: page.prev })"
    >
      Previous projects
    </Button>
    <Button
      type="button"
      :variant="buttonVariant"
      size="sm"
      :disabled="!page.next"
      @click="emit('pagination', { next: page.next })"
    >
      Next projects
    </Button>
  </div>
</template>
