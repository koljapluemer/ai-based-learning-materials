import { AppDb } from '../entities/app-db'
import { createMaterialsRepository, type MaterialRepository } from '../entities/materials/materials'
import { createPromptsRepository, type PromptRepository } from '../entities/prompts/prompts'
import { createSettingsRepository, type SettingsRepository } from '../entities/settings/settings'
import { inject, type App } from 'vue'

export interface AppRepositories {
  materials: MaterialRepository
  prompts: PromptRepository
  settings: SettingsRepository
  db: AppDb
}

export const RepositoriesKey = Symbol('Repositories')

export const createRepositories = (): AppRepositories => {
  const db = new AppDb()

  return {
    db,
    materials: createMaterialsRepository(db),
    prompts: createPromptsRepository(db),
    settings: createSettingsRepository()
  }
}

export const installRepositories = (app: App, repositories: AppRepositories) => {
  app.provide(RepositoriesKey, repositories)
}

export const useRepositories = () => {
  const repositories = inject<AppRepositories>(RepositoriesKey)
  if (!repositories) {
    throw new Error('Repositories are not available in current context')
  }
  return repositories
}
