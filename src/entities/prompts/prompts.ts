import type { Table } from 'dexie'
import { AppDb, type OutputShapeType, type PromptRecord } from '../app-db'

export interface PromptCreateInput {
  name: string
  content: string
  outputShape: OutputShapeType
  minFlashcards: number
}

export interface PromptUpdateInput {
  name?: string
  content?: string
  outputShape?: OutputShapeType
  minFlashcards?: number
}

export interface PromptRepository {
  list: () => Promise<PromptRecord[]>
  get: (id: string) => Promise<PromptRecord | undefined>
  create: (input: PromptCreateInput) => Promise<string>
  update: (id: string, input: PromptUpdateInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

const timestamp = () => Date.now()

const mapUpdateInput = (record: PromptRecord, input: PromptUpdateInput): PromptRecord => ({
  ...record,
  ...input,
  updatedAt: timestamp()
})

export const createPromptsRepository = (db: AppDb): PromptRepository => {
  const table: Table<PromptRecord, string> = db.prompts

  return {
    list: () => table.orderBy('createdAt').reverse().toArray(),
    get: (id) => table.get(id),
    async create(input: PromptCreateInput) {
      const now = timestamp()
      const insert = {
        ...input,
        createdAt: now,
        updatedAt: now
      } as PromptRecord
      const id = await table.add(insert)
      return id
    },
    async update(id, input) {
      const existing = await table.get(id)
      if (!existing) {
        throw new Error(`Prompt ${id} not found`)
      }

      await table.put(mapUpdateInput(existing, input))
    },
    remove: (id) => table.delete(id)
  }
}
