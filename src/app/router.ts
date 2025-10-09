import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'create',
    component: () => import('../pages/create/CreatePage.vue')
  },
  {
    path: '/materials',
    name: 'materials',
    component: () => import('../pages/materials/MaterialsPage.vue')
  },
  {
    path: '/prompts',
    name: 'prompts',
    component: () => import('../pages/prompts/PromptsPage.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../pages/settings/SettingsPage.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'create' }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
