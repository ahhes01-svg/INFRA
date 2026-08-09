<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import StateBadge from '../components/StateBadge.vue'
import { loadProject } from '../services/projects.js'
import { formatDate, formatTime } from '../utils/format.js'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const result = ref({ project: null, sites: [], activities: [] })
const progress = computed(() => {
  const rows = result.value.activities
  return rows.length ? Math.round((rows.filter((item) => item.estado === 'completada').length / rows.length) * 100) : 0
})

onMounted(async () => {
  try { result.value = await loadProject(String(route.params.id)) }
  catch (requestError) { error.value = requestError.message || 'No se pudo abrir el proyecto.' }
  finally { loading.value = false }
})
</script>

<template>
  <div class="page-stack">
    <RouterLink class="back-link" to="/proyectos">← Volver a proyectos</RouterLink>
    <div v-if="loading" class="panel detail-hero"><span class="skeleton skeleton-block" /></div>
    <div v-else-if="error" class="alert alert-error"><strong>Error.</strong><span>{{ error }}</span></div>
    <template v-else>
      <section class="panel detail-hero">
        <div><span class="code-label">{{ result.project.codigo }}</span><h2>{{ result.project.nombre }}</h2><p>{{ result.project.descripcion || 'Sin descripción.' }}</p></div>
        <StateBadge :state="result.project.estado" />
      </section>
      <section class="kpi-grid kpi-grid-three">
        <article class="kpi-card tone-blue"><span>Sitios asociados</span><strong>{{ result.sites.length }}</strong></article>
        <article class="kpi-card tone-green"><span>Actividades registradas</span><strong>{{ result.activities.length }}</strong></article>
        <article class="kpi-card tone-amber"><span>Avance operativo</span><strong>{{ progress }}%</strong></article>
      </section>
      <section class="detail-grid">
        <article class="panel">
          <header class="panel-header"><div><p class="eyebrow">Infraestructura</p><h3>Sitios del proyecto</h3></div></header>
          <EmptyState v-if="!result.sites.length" title="Sin sitios" description="Todavía no se asociaron estaciones a este proyecto." />
          <div v-else class="table-wrap"><table><thead><tr><th>Código</th><th>Nombre</th><th>Ubicación</th><th>Estado</th></tr></thead><tbody><tr v-for="site in result.sites" :key="site.id"><td><RouterLink class="table-link" :to="`/sitios/${site.id}`">{{ site.codigo }}</RouterLink></td><td>{{ site.nombre }}</td><td>{{ site.distrito }}, {{ site.provincia }}</td><td><StateBadge :state="site.estado" /></td></tr></tbody></table></div>
        </article>
        <article class="panel">
          <header class="panel-header"><div><p class="eyebrow">Planificación</p><h3>Actividades recientes</h3></div></header>
          <EmptyState v-if="!result.activities.length" title="Sin actividades" description="No existen trabajos registrados para este proyecto." />
          <ul v-else class="record-list"><li v-for="activity in result.activities" :key="activity.id"><div><strong>{{ activity.tipos_actividad?.nombre || activity.id }}</strong><small>{{ activity.sitios?.codigo }} · {{ formatDate(activity.fecha) }} · {{ formatTime(activity.h_ini) }}</small></div><StateBadge :state="activity.estado" /></li></ul>
        </article>
      </section>
    </template>
  </div>
</template>
