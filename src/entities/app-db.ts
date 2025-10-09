import Dexie from 'dexie'
import type { Table } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

export type OutputShapeType = 'simple-flashcards'

export interface MaterialRecord {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  createdAt: number
  updatedAt: number
}

export interface PromptRecord {
  id: string
  name: string
  content: string
  outputShape: OutputShapeType
  createdAt: number
  updatedAt: number
}

export class AppDb extends Dexie {
  materials!: Table<MaterialRecord, string>
  prompts!: Table<PromptRecord, string>

  constructor() {
    super('ai-learning-materials', { addons: [dexieCloud] })

    this.version(1).stores({
      materials: '@id, name, createdAt',
      prompts: '@id, name, createdAt'
    })

    // Dexie Cloud can be configured via env vars; defaults to local-only usage.
    const databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL
    if (databaseUrl) {
      this.cloud.configure({
        databaseUrl
      })
    }
  }
}
