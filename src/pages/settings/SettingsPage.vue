<script setup lang="ts">
import PageHeader from '../../dumb/PageHeader.vue'
import PageLayout from '../../dumb/PageLayout.vue'
import ApiKeyManager from '../../features/settings/ApiKeyManager.vue'
import { useRepositories } from '../../app/repositories'

const { settings } = useRepositories()
</script>

<template>
  <PageLayout>
    <PageHeader
      title="Settings"
      description="Manage your personal preferences."
    />
    <ApiKeyManager :repository="settings" />
  </PageLayout>
</template>
