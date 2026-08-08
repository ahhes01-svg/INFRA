<script setup>
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session.js'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const sidebarOpen = ref(false)

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: '▦' },
]

const pageTitle = computed(() => route.meta.title || 'INFRA')

async function logout() {
  await session.signOut()
  await router.replace('/login')
}
</script>

<template>
  <div class="app-shell">
    <div v-if="sidebarOpen" class="backdrop" @click="sidebarOpen = false" />

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="brand">
        <span class="brand-mark">+</span>
        <div>
          <strong>INFRA</strong>
          <span>Operaciones</span>
        </div>
      </div>

      <nav class="main-nav" aria-label="Navegación principal">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          @click="sidebarOpen = false"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/cuenta" class="user-card" @click="sidebarOpen = false">
          <span class="avatar">Z</span>
          <span>
            <strong>{{ session.displayName }}</strong>
            <small>Administrador</small>
          </span>
        </RouterLink>
        <button class="button button-ghost button-full" type="button" @click="logout">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <button class="menu-button" type="button" aria-label="Abrir menú" @click="sidebarOpen = true">☰</button>
        <div>
          <p class="eyebrow">INFRA · NettOps</p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <span class="environment-badge">Producción</span>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </section>
  </div>
</template>
