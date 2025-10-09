import type { Table } from 'dexie'
import { AppDb, type MaterialRecord } from '../app-db'

export interface MaterialCreateInput {
  name: string
  mimeType: string
  size: number
  dataUrl: string
}

export interface MaterialUpdateInput {
  name?: string
  mimeType?: string
  size?: number
  dataUrl?: string
}

export interface MaterialRepository {
  list: () => Promise<MaterialRecord[]>
  get: (id: string) => Promise<MaterialRecord | undefined>
  create: (input: MaterialCreateInput) => Promise<string>
  update: (id: string, input: MaterialUpdateInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

const timestamp = () => Date.now()

const mapUpdateInput = (record: MaterialRecord, input: MaterialUpdateInput): MaterialRecord => ({
  ...record,
  ...input,
  updatedAt: timestamp()
})

export const createMaterialsRepository = (db: AppDb): MaterialRepository => {
  const table: Table<MaterialRecord, string> = db.materials

  return {
    list: () => table.orderBy('createdAt').reverse().toArray(),
    get: (id: string) => table.get(id),
    async create(input: MaterialCreateInput) {
      const now = timestamp()
      const insert = {
        ...input,
        createdAt: now,
        updatedAt: now
      } as MaterialRecord
      const id = await table.add(insert)
      return id
    },
    async update(id: string, input: MaterialUpdateInput) {
      const existing = await table.get(id)
      if (!existing) {
        throw new Error(`Material ${id} not found`)
      }

      await table.put(mapUpdateInput(existing, input))
    },
    remove: (id: string) => table.delete(id)
  }
}
