<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import StateBadge from '../components/StateBadge.vue'
import { loadProjects } from '../services/projects.js'
import { formatDate, normalizeSearch } from '../utils/format.js'

const loading = ref(true)
const error = ref('')
const search = ref('')
const status = ref('')
const projects = ref([])

const filtered = computed(() => {
  const term = normalizeSearch(search.value)
  return projects.value.filter((project) => {
    const matchesTerm = !term || normalizeSearch(`${project.codigo} ${project.nombre} ${project.clientes?.nombre}`).includes(term)
    return matchesTerm && (!status.value || project.estado === status.value)
  })
})

async function refresh() {
  loading.value = true
  error.value = ''
  try { projects.value = await loadProjects() }
  catch (requestError) { error.value = requestError.message || 'No se pudieron cargar los proyectos.' }
  finally { loading.value = false }
}

onMounted(refresh)
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Proyectos" description="Portafolio de despliegues y mantenimiento de infraestructura.">
      <button class="button button-secondary" type="button" :disabled="loading" @click="refresh">Actualizar</button>
    </PageHeader>

    <div v-if="error" class="alert alert-error"><strong>Error de carga.</strong><span>{{ error }}</span></div>

    <section class="toolbar panel-flat">
      <label class="search-control"><span>Buscar</span><input v-model="search" type="search" placeholder="Código, proyecto o cliente" /></label>
      <label class="select-control"><span>Estado</span><select v-model="status"><option value="">Todos</option><option value="en_ejecucion">En ejecución</option><option value="planificado">Planificado</option><option value="completado">Completado</option></select></label>
      <strong class="result-count">{{ filtered.length }} proyectos</strong>
    </section>

    <section v-if="loading" class="project-grid">
      <article v-for="item in 6" :key="item" class="panel project-card"><span class="skeleton skeleton-row" /><span class="skeleton skeleton-block" /></article>
    </section>

    <EmptyState v-else-if="!filtered.length" title="No hay proyectos registrados" description="La nueva base está lista para recibir el primer proyecto real." />

    <section v-else class="project-grid">
      <article v-for="project in filtered" :key="project.id" class="panel project-card">
        <header><div><span class="code-label">{{ project.codigo }}</span><h3>{{ project.nombre }}</h3></div><StateBadge :state="project.estado" /></header>
        <p>{{ project.descripcion || 'Sin descripción registrada.' }}</p>
        <dl class="compact-details">
          <div><dt>Cliente</dt><dd>{{ project.clientes?.nombre || 'Sin cliente' }}</dd></div>
          <div><dt>Sitios</dt><dd>{{ project.siteCount }}</dd></div>
          <div><dt>Actividades</dt><dd>{{ project.activityCount }}</dd></div>
          <div><dt>Plazo</dt><dd>{{ formatDate(project.inicio) }} — {{ formatDate(project.fin) }}</dd></div>
        </dl>
        <div class="progress-row"><span><i :style="{ width: `${project.progress}%` }" /></span><strong>{{ project.progress }}%</strong></div>
        <RouterLink class="button button-secondary button-full" :to="`/proyectos/${project.id}`">Abrir proyecto</RouterLink>
      </article>
    </section>
  </div>
</template>
