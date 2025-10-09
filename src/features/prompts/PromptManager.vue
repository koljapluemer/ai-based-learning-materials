<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PromptRecord } from '../../entities/app-db'
import type { PromptRepository } from '../../entities/prompts/prompts'
import { Edit2, Plus, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  repository: PromptRepository
}>()

const prompts = ref<PromptRecord[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  content: '',
  outputShape: 'simple-flashcards'
})

const hasPrompts = computed(() => prompts.value.length > 0)

const resetForm = () => {
  form.value = {
    name: '',
    content: '',
    outputShape: 'simple-flashcards'
  }
  editingId.value = null
}

const loadPrompts = async () => {
  loading.value = true
  error.value = null
  try {
    prompts.value = await props.repository.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load prompts'
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!form.value.name.trim() || !form.value.content.trim()) {
    error.value = 'Name and prompt content are required'
    return
  }
  saving.value = true
  error.value = null
  try {
    if (editingId.value) {
      await props.repository.update(editingId.value, {
        name: form.value.name.trim(),
        content: form.value.content.trim(),
        outputShape: form.value.outputShape as 'simple-flashcards'
      })
    } else {
      await props.repository.create({
        name: form.value.name.trim(),
        content: form.value.content.trim(),
        outputShape: form.value.outputShape as 'simple-flashcards'
      })
    }
    await loadPrompts()
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save prompt'
  } finally {
    saving.value = false
  }
}

const editPrompt = (prompt: PromptRecord) => {
  editingId.value = prompt.id
  form.value = {
    name: prompt.name,
    content: prompt.content,
    outputShape: prompt.outputShape
  }
}

const deletePrompt = async (prompt: PromptRecord) => {
  const confirmed = window.confirm(`Delete prompt "${prompt.name}"?`)
  if (!confirmed) {
    return
  }
  saving.value = true
  error.value = null
  try {
    await props.repository.remove(prompt.id)
    await loadPrompts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Delete failed'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadPrompts()
})
</script>

<template>
  <section class="grid gap-6 md:grid-cols-[1.4fr_1fr]">
    <div class="rounded-box bg-base-100 p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-base-content">Prompt Library</h2>
        <span class="text-sm text-base-content/70">{{ prompts.length }} total</span>
      </div>

      <div v-if="error" class="alert alert-error mb-4">
        <span>{{ error }}</span>
      </div>

      <div v-if="loading" class="flex items-center gap-2 text-base-content/70">
        <span class="loading loading-spinner loading-sm" />
        Loading prompts…
      </div>

      <div v-else-if="!hasPrompts" class="text-base-content/70">
        No prompts yet. Add one using the form.
      </div>

      <ul v-else class="flex flex-col gap-4">
        <li
          v-for="prompt in prompts"
          :key="prompt.id"
          class="rounded-box border border-base-200 bg-base-100 p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-base-content">
                {{ prompt.name }}
              </h3>
              <p class="mt-2 whitespace-pre-line text-sm text-base-content/80">
                {{ prompt.content }}
              </p>
              <span class="badge badge-outline mt-3 uppercase">
                {{ prompt.outputShape }}
              </span>
            </div>
            <div class="flex gap-2">
              <button
                class="btn btn-ghost btn-sm"
                type="button"
                :disabled="saving"
                @click="editPrompt(prompt)"
              >
                <Edit2 class="h-4 w-4" />
              </button>
              <button
                class="btn btn-ghost btn-sm text-error"
                type="button"
                :disabled="saving"
                @click="deletePrompt(prompt)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div class="rounded-box bg-base-100 p-6 shadow-sm">
      <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-base-content">
        <Plus class="h-5 w-5" />
        {{ editingId ? 'Update prompt' : 'Add prompt' }}
      </h2>
      <form class="flex flex-col gap-4" @submit.prevent="submitForm">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Name</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input input-bordered"
            placeholder="Flashcards for chapter 1"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Prompt</span>
          </label>
          <textarea
            v-model="form.content"
            class="textarea textarea-bordered h-40"
            placeholder="Describe how you want the AI to transform the materials"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Output shape</span>
          </label>
          <select v-model="form.outputShape" class="select select-bordered">
            <option value="simple-flashcards">Simple Flashcards</option>
          </select>
          <p class="mt-2 text-xs text-base-content/70">
            Generates an array of flashcards with <code>{"{"}front, back{"}"}</code> fields.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ editingId ? 'Update Prompt' : 'Create Prompt' }}
          </button>
          <button
            v-if="editingId"
            class="btn btn-ghost"
            type="button"
            :disabled="saving"
            @click="resetForm"
          >
            Cancel edit
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
