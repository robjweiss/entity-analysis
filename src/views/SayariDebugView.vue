<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
const errorMessage = ref('')
const result = ref<{ returned: number; totalCount: number }>()

async function testConnection() {
  isLoading.value = true
  errorMessage.value = ''
  result.value = undefined

  try {
    const response = await fetch('/api/sayari/debug/countries')

    if (!response.ok) {
      throw new Error('The Sayari service could not complete the request.')
    }

    result.value = await response.json() as { returned: number; totalCount: number }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errorMessage.value = message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section aria-labelledby="page-title" class="max-w-2xl space-y-4">
    <div class="space-y-2">
      <h1 id="page-title" class="text-2xl font-semibold tracking-tight">Sayari API Test</h1>
      <p class="text-sm text-muted-foreground">
        Run a read-only request through the local Sayari service to check browser-to-service
        connectivity and Sayari authentication.
      </p>
      <p class="text-sm font-medium text-amber-700">
        Temporary debug example — replace this page with the implemented Sayari-backed features.
      </p>
    </div>

    <button
      type="button"
      data-testid="sayari-test-button"
      :disabled="isLoading"
      class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      @click="testConnection"
    >
      {{ isLoading ? 'Testing connection…' : 'Test Sayari connection' }}
    </button>

    <p v-if="errorMessage" role="alert" data-testid="sayari-test-error" class="text-sm text-destructive">
      Request failed: {{ errorMessage }}
    </p>

    <div
      v-if="result"
      role="status"
      data-testid="sayari-test-success"
      class="space-y-1 rounded-md border p-4 text-sm"
    >
      <p class="font-medium">Connection successful</p>
      <p class="text-muted-foreground">Returned {{ result.returned }} countries.</p>
      <p class="text-muted-foreground">Total available: {{ result.totalCount }}.</p>
    </div>
  </section>
</template>
