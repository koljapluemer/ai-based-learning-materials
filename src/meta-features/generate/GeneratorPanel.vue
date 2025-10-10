<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { MaterialRepository } from '../../entities/materials/materials'
import type { PromptRepository } from '../../entities/prompts/prompts'
import type {
  SettingsRepository,
  SettingsRecord
} from '../../entities/settings/settings'
import type { MaterialRecord, PromptRecord } from '../../entities/app-db'
import { Download, RefreshCcw, Sparkles } from 'lucide-vue-next'
import { generateLearningMaterials, canGenerate } from './generator-service'
import { getOutputShapeDefinition } from './output-shapes'

const props = defineProps<{
  materialRepository: MaterialRepository
  promptRepository: PromptRepository
  settingsRepository: SettingsRepository
}>()

const prompts = ref<PromptRecord[]>([])
const materials = ref<MaterialRecord[]>([])
const settings = ref<SettingsRecord | undefined>()
const loading = ref(false)
const error = ref<string | null>(null)
const generating = ref(false)
const selectedPromptId = ref<string>('')
const selectedMaterialIds = ref<string[]>([])
const rawResult = ref<string | null>(null)
const resultJson = ref<unknown>(null)

const selectedPrompt = computed(() =>
  prompts.value.find((prompt) => prompt.id === selectedPromptId.value)
)

const selectedMaterials = computed(() =>
  materials.value.filter((material) => selectedMaterialIds.value.includes(material.id))
)

const outputShape = computed(() => {
  const prompt = selectedPrompt.value
  if (!prompt) {
    return null
  }
  return getOutputShapeDefinition(prompt.outputShape)
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const [promptList, materialList, currentSettings] = await Promise.all([
      props.promptRepository.list(),
      props.materialRepository.list(),
      props.settingsRepository.get()
    ])
    prompts.value = promptList
    materials.value = materialList
    settings.value = currentSettings
    if (!selectedPromptId.value) {
      const firstPrompt = promptList[0]
      if (firstPrompt) {
        selectedPromptId.value = firstPrompt.id
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data'
  } finally {
    loading.value = false
  }
}

const toggleMaterial = (id: string) => {
  if (selectedMaterialIds.value.includes(id)) {
    selectedMaterialIds.value = selectedMaterialIds.value.filter((current) => current !== id)
  } else {
    selectedMaterialIds.value = [...selectedMaterialIds.value, id]
  }
}

const downloadResult = () => {
  if (!rawResult.value) {
    return
  }
  const blob = new Blob([rawResult.value], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'learning-materials.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

const downloadCsv = () => {
  if (!resultJson.value || !outputShape.value?.convertToCsv) {
    return
  }
  try {
    const csvContent = outputShape.value.convertToCsv(resultJson.value)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'learning-materials.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'CSV conversion failed'
  }
}

const generate = async () => {
  error.value = null
  rawResult.value = null
  resultJson.value = null
  const apiKey = settings.value?.openAIApiKey ?? ''

  if (!selectedPrompt.value) {
    error.value = 'Select a prompt before generating'
    return
  }

  generating.value = true
  try {
    const result = await generateLearningMaterials({
      apiKey,
      prompt: selectedPrompt.value,
      materials: selectedMaterials.value
    })
    resultJson.value = result.json
    rawResult.value = JSON.stringify(result.json, null, 2)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Generation failed'
  } finally {
    generating.value = false
  }
}

const formatSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }
  const kb = size / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }
  return `${(kb / 1024).toFixed(1)} MB`
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <section>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <button
        class="btn btn-outline gap-2"
        type="button"
        :disabled="loading"
        @click="loadData"
      >
        <RefreshCcw class="h-4 w-4" />
        Reload data
      </button>
      <span
        v-if="settings && !canGenerate(settings)"
        class="badge badge-warning badge-outline"
      >
        Add your OpenAI API key in Settings to enable generation.
      </span>
      <span v-else-if="!settings"
        class="badge badge-outline"
      >
        Settings stored locally.
      </span>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div class="space-y-6">
        <section class="rounded-box bg-base-100 p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-base-content">Prompt</h2>

          <div v-if="!prompts.length" class="alert alert-warning">
            <span>Create a prompt first on the Prompts page.</span>
          </div>

          <div v-else class="form-control">
            <label class="label">
              <span class="label-text">Choose a prompt</span>
            </label>
            <select
              v-model="selectedPromptId"
              class="select select-bordered"
            >
              <option
                v-for="prompt in prompts"
                :key="prompt.id"
                :value="prompt.id"
              >
                {{ prompt.name }}
              </option>
            </select>

            <div
              v-if="selectedPrompt"
              class="mt-4 rounded-box border border-base-200 bg-base-100 p-4"
            >
              <h3 class="text-base font-semibold text-base-content">
                Instructions
              </h3>
              <p class="mt-2 whitespace-pre-line text-sm text-base-content/80">
                {{ selectedPrompt.content }}
              </p>
              <div v-if="outputShape" class="mt-3 text-xs text-base-content/70">
                <p class="font-semibold uppercase tracking-wide">
                  {{ outputShape.label }}
                </p>
                <p class="mt-1">
                  {{ outputShape.guidance }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-box bg-base-100 p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-base-content">Materials (optional)</h2>

          <div v-if="!materials.length" class="alert alert-info">
            <span>No materials available. You can generate based on the prompt alone, or upload materials on the Materials page.</span>
          </div>

          <ul v-else class="flex flex-col gap-3">
            <li
              v-for="material in materials"
              :key="material.id"
              class="rounded-box border border-base-200 bg-base-100 p-4 transition hover:border-primary"
            >
              <label class="flex cursor-pointer items-start gap-4">
                <input
                  :checked="selectedMaterialIds.includes(material.id)"
                  class="checkbox checkbox-primary mt-1"
                  type="checkbox"
                  @change="toggleMaterial(material.id)"
                />
                <div>
                  <h3 class="text-base font-semibold text-base-content">
                    {{ material.name }}
                  </h3>
                  <p class="text-xs uppercase tracking-wide text-base-content/50">
                    {{ material.mimeType }} · {{ formatSize(material.size) }}
                  </p>
                </div>
              </label>
            </li>
          </ul>
        </section>
      </div>

      <section class="flex h-full flex-col gap-4 rounded-box bg-base-100 p-6 shadow-sm">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-base-content">Generate</h2>
          <p class="text-sm text-base-content/70">
            The AI reads the prompt and any selected materials to generate JSON output you can copy or download.
          </p>

          <button
            class="btn btn-primary w-full gap-2"
            type="button"
            :disabled="generating || !canGenerate(settings)"
            @click="generate"
          >
            <Sparkles class="h-4 w-4" />
            {{ generating ? 'Generating…' : 'Generate materials' }}
          </button>
        </div>

        <div v-if="error" class="alert alert-error">
          <span>{{ error }}</span>
        </div>

        <div class="flex-1 rounded-box border border-base-200 bg-base-200/40 p-4">
          <p v-if="!rawResult" class="text-sm text-base-content/50">
            Generated JSON will appear here.
          </p>
          <pre v-else class="scrollbar-thin h-full overflow-auto whitespace-pre-wrap break-words text-xs text-base-content/80"><code>{{ rawResult }}</code></pre>
        </div>

        <div v-if="rawResult" class="flex gap-2">
          <button
            class="btn btn-outline flex-1 gap-2"
            type="button"
            @click="downloadResult"
          >
            <Download class="h-4 w-4" />
            Download JSON
          </button>
          <button
            v-if="outputShape?.canBeDownloadedAsCsv"
            class="btn btn-outline flex-1 gap-2"
            type="button"
            @click="downloadCsv"
          >
            <Download class="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
