<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SettingsRepository } from '../../entities/settings/settings'

const props = defineProps<{
  repository: SettingsRepository
}>()

const apiKey = ref('')
const loading = ref(false)
const saving = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const loadSettings = async () => {
  loading.value = true
  error.value = null
  try {
    const settings = await props.repository.get()
    apiKey.value = settings?.openAIApiKey ?? ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load settings'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  message.value = null
  error.value = null
  saving.value = true
  try {
    await props.repository.update({
      openAIApiKey: apiKey.value.trim() || null
    })
    message.value = 'API key saved'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save settings'
  } finally {
    saving.value = false
  }
}

const clearKey = async () => {
  apiKey.value = ''
  await saveSettings()
}

onMounted(async () => {
  await loadSettings()
})
</script>

<template>
  <section class="rounded-box bg-base-100 p-6 shadow-sm">
    <h2 class="mb-2 text-xl font-semibold text-base-content">OpenAI API</h2>
    <p class="mb-4 text-sm text-base-content/70">
      Store your API key locally. It never leaves your browser unless you sync with Dexie Cloud.
    </p>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/70">
      <span class="loading loading-spinner loading-sm" />
      Loading settings…
    </div>

    <form v-else class="flex flex-col gap-4" @submit.prevent="saveSettings">
      <div class="form-control">
        <label class="label">
          <span class="label-text">OpenAI API key</span>
        </label>
        <input
          v-model="apiKey"
          type="password"
          placeholder="sk-..."
          class="input input-bordered"
        />
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            Only stored locally in IndexedDB.
          </span>
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          Save key
        </button>
        <button class="btn btn-ghost" type="button" :disabled="saving" @click="clearKey">
          Remove key
        </button>
      </div>
      <div v-if="message" class="alert alert-success">
        <span>{{ message }}</span>
      </div>
      <div v-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </form>
  </section>
</template>
