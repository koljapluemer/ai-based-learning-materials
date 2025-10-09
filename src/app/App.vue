<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const links = [
  { name: 'create', label: 'Create', to: '/' },
  { name: 'materials', label: 'Materials', to: '/materials' },
  { name: 'prompts', label: 'Prompts', to: '/prompts' },
  { name: 'settings', label: 'Settings', to: '/settings' }
]

const currentName = computed(() => route.name)
</script>

<template>
  <div class="min-h-screen bg-base-200 text-base-content">
    <header class="border-b border-base-300 bg-base-100">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink class="text-xl font-bold" to="/">AI Learning Materials</RouterLink>
        <nav class="flex items-center gap-2">
          <RouterLink
            v-for="link in links"
            :key="link.name"
            :to="link.to"
            class="btn btn-sm"
            :class="currentName === link.name ? 'btn-primary' : 'btn-ghost'"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
    </header>
    <RouterView />
  </div>
</template>

<style>
@import "tailwindcss";
@plugin "daisyui";
</style>
