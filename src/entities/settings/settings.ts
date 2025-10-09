export interface SettingsRecord {
  openAIApiKey: string | null
  updatedAt: number
}

export interface SettingsUpdateInput {
  openAIApiKey: string | null
}

export interface SettingsRepository {
  get: () => Promise<SettingsRecord | undefined>
  update: (input: SettingsUpdateInput) => Promise<void>
  clear: () => Promise<void>
}

const STORAGE_KEY = 'ai-learning-materials::settings'
let memoryRecord: SettingsRecord | undefined

const now = () => Date.now()

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  return window.localStorage
}

const sanitizeRecord = (record: unknown): SettingsRecord | undefined => {
  if (!record || typeof record !== 'object') {
    return undefined
  }
  const value = record as Partial<SettingsRecord>
  const openAIApiKey =
    typeof value.openAIApiKey === 'string' || value.openAIApiKey === null
      ? value.openAIApiKey ?? null
      : null
  const updatedAt = typeof value.updatedAt === 'number' ? value.updatedAt : now()

  return {
    openAIApiKey,
    updatedAt
  }
}

const readFromStorage = (): SettingsRecord | undefined => {
  const storage = getStorage()
  if (!storage) {
    return memoryRecord
  }

  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    return memoryRecord
  }

  try {
    const parsed = JSON.parse(raw)
    const record = sanitizeRecord(parsed)
    memoryRecord = record
    return record
  } catch {
    storage.removeItem(STORAGE_KEY)
    return undefined
  }
}

const writeToStorage = (record: SettingsRecord | undefined) => {
  memoryRecord = record
  const storage = getStorage()
  if (!storage) {
    return
  }
  if (!record) {
    storage.removeItem(STORAGE_KEY)
    return
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(record))
}

export const createSettingsRepository = (): SettingsRepository => ({
  async get() {
    return readFromStorage()
  },
  async update(input) {
    const record: SettingsRecord = {
      openAIApiKey: input.openAIApiKey,
      updatedAt: now()
    }
    writeToStorage(record)
  },
  async clear() {
    writeToStorage(undefined)
  }
})
