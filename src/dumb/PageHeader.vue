<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-base-content">
      {{ title }}
    </h1>
    <p v-if="description" class="mt-2 text-base-content/70">
      {{ description }}
    </p>
  </header>
</template>
