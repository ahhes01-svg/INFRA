import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session.js'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'cuenta',
        name: 'account',
        component: () => import('../views/AccountView.vue'),
        meta: { title: 'Mi cuenta' },
      },
      {
        path: 'proyectos',
        name: 'projects',
        component: () => import('../views/ProjectsView.vue'),
        meta: { title: 'Proyectos' },
      },
      {
        path: 'proyectos/:id',
        name: 'project-detail',
        component: () => import('../views/ProjectDetailView.vue'),
        meta: { title: 'Detalle del proyecto' },
      },
      {
        path: 'sitios',
        name: 'sites',
        component: () => import('../views/SitesView.vue'),
        meta: { title: 'BTS / Sitios' },
      },
      {
        path: 'sitios/:id',
        name: 'site-detail',
        component: () => import('../views/SiteDetailView.vue'),
        meta: { title: 'Detalle del sitio' },
      },
      {
        path: 'actividades',
        name: 'activities',
        component: () => import('../views/ActivitiesView.vue'),
        meta: { title: 'Actividades' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.initialize()

  if (!to.meta.public && !session.isAuthenticated) {
    return { name: 'login', query: { next: to.fullPath } }
  }
  if (to.name === 'login' && session.isAuthenticated) return { name: 'dashboard' }
  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'INFRA'} · Operaciones`
})

export default router
