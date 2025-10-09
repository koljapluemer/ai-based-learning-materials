<script setup lang="ts">
import PageHeader from '../../dumb/PageHeader.vue'
import PageLayout from '../../dumb/PageLayout.vue'
import PromptManager from '../../features/prompts/PromptManager.vue'
import { useRepositories } from '../../app/repositories'

const { prompts } = useRepositories()
</script>

<template>
  <PageLayout>
    <PageHeader
      title="Prompts"
      description="Curate reusable instructions for the AI."
    />
    <PromptManager :repository="prompts" />
  </PageLayout>
</template>
