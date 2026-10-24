import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AnalystView from '@/views/AnalystView.vue'
import ExecutiveView from '@/views/ExecutiveView.vue'
import ManagementView from '@/views/ManagementView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: '',
          redirect: '/executive',
        },
        {
          path: 'executive',
          name: 'executive',
          component: ExecutiveView,
          meta: { title: 'Exposure Snapshot', role: 'Executive' },
        },
        {
          path: 'management',
          name: 'management',
          component: ManagementView,
          meta: { title: 'Priority Queue', role: 'Management' },
        },
        {
          path: 'analyst',
          name: 'analyst',
          component: AnalystView,
          meta: { title: 'Entity Investigation', role: 'Analyst' },
        },
        {
          path: 'sayari-debug',
          name: 'sayari-debug',
          // Temporary example/debug page; replace it with implemented features.
          component: () => import('@/views/SayariDebugView.vue'),
          meta: { title: 'Sayari API Test', role: 'Developer' },
        },
      ],
    },
  ],
})

export default router
