<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  ctaLabel?: string
}>()

const emit = defineEmits<{
  (event: 'action'): void
}>()
</script>

<template>
  <div class="rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center">
    <h2 class="text-xl font-semibold text-base-content">
      {{ title }}
    </h2>
    <p v-if="description" class="mt-2 text-base-content/70">
      {{ description }}
    </p>
    <button
      v-if="ctaLabel"
      type="button"
      class="btn btn-primary mt-4"
      @click="emit('action')"
    >
      {{ ctaLabel }}
    </button>
  </div>
</template>
