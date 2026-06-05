import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'graph',
    component: () => import('@/views/GraphView.vue'),
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('@/components/PathReview3D.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
