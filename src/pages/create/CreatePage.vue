<script setup lang="ts">
import PageHeader from '../../dumb/PageHeader.vue'
import PageLayout from '../../dumb/PageLayout.vue'
import GeneratorPanel from '../../meta-features/generate/GeneratorPanel.vue'
import { useRepositories } from '../../app/repositories'

const { materials, prompts, settings } = useRepositories()
</script>

<template>
  <PageLayout>
    <PageHeader
      title="Create"
      description="Combine prompts with materials and let AI build learning content."
    />
    <GeneratorPanel
      :material-repository="materials"
      :prompt-repository="prompts"
      :settings-repository="settings"
    />
  </PageLayout>
</template>
