<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { MaterialRecord } from '../../entities/app-db'
import type { MaterialRepository } from '../../entities/materials/materials'
import { Download, Edit2, Trash2, Upload } from 'lucide-vue-next'

const props = defineProps<{
  repository: MaterialRepository
}>()

const materials = ref<MaterialRecord[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isSaving = ref(false)
const renamingId = ref<string | null>(null)
const renameValue = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const hasMaterials = computed(() => materials.value.length > 0)

const loadMaterials = async () => {
  loading.value = true
  error.value = null
  try {
    materials.value = await props.repository.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load materials'
  } finally {
    loading.value = false
  }
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const uploadFiles = async (files: FileList) => {
  isSaving.value = true
  error.value = null
  try {
    for (const file of Array.from(files)) {
      const dataUrl = await readFileAsDataUrl(file)
      await props.repository.create({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl
      })
    }
    await loadMaterials()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed'
  } finally {
    isSaving.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    return
  }
  await uploadFiles(input.files)
}

const startRename = (material: MaterialRecord) => {
  renamingId.value = material.id
  renameValue.value = material.name
}

const cancelRename = () => {
  renamingId.value = null
  renameValue.value = ''
}

const submitRename = async (material: MaterialRecord) => {
  const name = renameValue.value.trim()
  if (!name || name === material.name) {
    cancelRename()
    return
  }
  isSaving.value = true
  try {
    await props.repository.update(material.id, { name })
    await loadMaterials()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Rename failed'
  } finally {
    isSaving.value = false
    cancelRename()
  }
}

const deleteMaterial = async (material: MaterialRecord) => {
  const confirmed = window.confirm(`Delete "${material.name}"? This cannot be undone.`)
  if (!confirmed) {
    return
  }
  isSaving.value = true
  error.value = null
  try {
    await props.repository.remove(material.id)
    await loadMaterials()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Delete failed'
  } finally {
    isSaving.value = false
  }
}

const downloadMaterial = (material: MaterialRecord) => {
  const link = document.createElement('a')
  link.href = material.dataUrl
  link.download = material.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }
  const kb = size / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

onMounted(async () => {
  await loadMaterials()
})
</script>

<template>
  <section>
    <div class="flex flex-col gap-4 rounded-box bg-base-100 p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-base-content">Materials</h2>
          <p class="text-sm text-base-content/70">
            Upload files you want to use when generating learning content.
          </p>
        </div>
        <label class="btn btn-primary gap-2">
          <Upload class="h-4 w-4" />
          Upload files
          <input
            ref="fileInput"
            class="hidden"
            type="file"
            multiple
            @change="onFileChange"
          />
        </label>
      </div>

      <div v-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>

      <div v-if="loading" class="flex items-center gap-2 text-base-content/70">
        <span class="loading loading-spinner loading-sm" />
        Loading materials…
      </div>

      <div v-else-if="!hasMaterials" class="text-center text-base-content/70">
        No materials yet. Upload files to get started.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th class="w-40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="material in materials"
              :key="material.id"
            >
              <td>
                <div v-if="renamingId === material.id" class="flex items-center gap-2">
                  <input
                    v-model="renameValue"
                    type="text"
                    class="input input-bordered input-sm w-full"
                  />
                  <button
                    class="btn btn-primary btn-sm"
                    type="button"
                    :disabled="isSaving"
                    @click="submitRename(material)"
                  >
                    Save
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    type="button"
                    :disabled="isSaving"
                    @click="cancelRename"
                  >
                    Cancel
                  </button>
                </div>
                <span v-else>
                  {{ material.name }}
                </span>
              </td>
              <td>
                <span class="badge badge-ghost">{{ material.mimeType || 'N/A' }}</span>
              </td>
              <td>{{ formatSize(material.size) }}</td>
              <td>
                <div class="flex justify-end gap-2">
                  <button
                    class="btn btn-ghost btn-sm"
                    type="button"
                    :disabled="isSaving"
                    @click="downloadMaterial(material)"
                  >
                    <Download class="h-4 w-4" />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    type="button"
                    :disabled="isSaving"
                    @click="startRename(material)"
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm text-error"
                    type="button"
                    :disabled="isSaving"
                    @click="deleteMaterial(material)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
