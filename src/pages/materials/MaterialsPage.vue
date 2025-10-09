<script setup lang="ts">
import PageHeader from '../../dumb/PageHeader.vue'
import PageLayout from '../../dumb/PageLayout.vue'
import MaterialManager from '../../features/materials/MaterialManager.vue'
import { useRepositories } from '../../app/repositories'

const { materials } = useRepositories()
</script>

<template>
  <PageLayout>
    <PageHeader
      title="Materials"
      description="Upload and manage source documents."
    />
    <MaterialManager :repository="materials" />
  </PageLayout>
</template>
