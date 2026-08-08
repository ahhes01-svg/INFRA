<script setup>
import { computed, onMounted, ref } from 'vue'
import { loadDashboard } from '../services/dashboard.js'

const loading = ref(true)
const error = ref('')
const data = ref({
  summary: { activeProjects: 0, operationalSites: 0, openIncidents: 0, lowStock: 0 },
  activities: [],
  incidents: [],
})

const cards = computed(() => [
  { label: 'Proyectos activos', value: data.value.summary.activeProjects, tone: 'blue' },
  { label: 'Sitios operativos', value: data.value.summary.operationalSites, tone: 'green' },
  { label: 'Incidencias abiertas', value: data.value.summary.openIncidents, tone: 'amber' },
  { label: 'Materiales por reponer', value: data.value.summary.lowStock, tone: 'red' },
])

const dateFormatter = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' })

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return dateFormatter.format(new Date(`${value}T12:00:00`))
}

function stateLabel(state) {
  return {
    pendiente: 'Pendiente',
    retrasada: 'Retrasada',
    en_ejecucion: 'En ejecución',
    en_revision: 'En revisión',
    completada: 'Completada',
    cancelada: 'Cancelada',
  }[state] || state
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    data.value = await loadDashboard()
  } catch (requestError) {
    error.value = requestError.message || 'No se pudo cargar el dashboard.'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <div class="page-stack">
    <section class="page-intro">
      <div>
        <p class="eyebrow">Resumen operativo</p>
        <h2>Estado de la operación</h2>
        <p>Información obtenida directamente de Supabase.</p>
      </div>
      <button class="button button-secondary" type="button" :disabled="loading" @click="refresh">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </section>

    <div v-if="error" class="alert alert-error" role="alert">
      <strong>No se pudieron cargar los datos.</strong>
      <span>{{ error }}</span>
    </div>

    <section class="kpi-grid" aria-label="Indicadores principales">
      <article v-for="card in cards" :key="card.label" class="kpi-card" :class="`tone-${card.tone}`">
        <span>{{ card.label }}</span>
        <strong v-if="!loading">{{ card.value }}</strong>
        <span v-else class="skeleton skeleton-number" />
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <header class="panel-header">
          <div><p class="eyebrow">Planificación</p><h3>Próximas actividades</h3></div>
          <span>{{ data.activities.length }} registros</span>
        </header>

        <div v-if="loading" class="list-skeleton">
          <span v-for="item in 4" :key="item" class="skeleton skeleton-row" />
        </div>
        <div v-else-if="!data.activities.length" class="empty-state">
          <strong>Sin actividades programadas</strong>
          <p>Las nuevas actividades aparecerán aquí.</p>
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>Actividad</th><th>Sitio</th><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>
              <tr v-for="activity in data.activities" :key="activity.id">
                <td><strong>{{ activity.id }}</strong></td>
                <td>{{ activity.site?.codigo || 'Sin sitio' }}</td>
                <td>{{ formatDate(activity.fecha) }}</td>
                <td><span class="status-pill" :data-state="activity.estado">{{ stateLabel(activity.estado) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <header class="panel-header">
          <div><p class="eyebrow">Atención</p><h3>Incidencias abiertas</h3></div>
          <span>{{ data.incidents.length }} visibles</span>
        </header>

        <div v-if="loading" class="list-skeleton">
          <span v-for="item in 4" :key="item" class="skeleton skeleton-row" />
        </div>
        <div v-else-if="!data.incidents.length" class="empty-state">
          <strong>Operación sin incidencias</strong>
          <p>No existen incidencias abiertas.</p>
        </div>
        <ul v-else class="incident-list">
          <li v-for="incident in data.incidents" :key="incident.id">
            <span class="severity-dot" :data-severity="incident.severidad" />
            <div><strong>{{ incident.titulo }}</strong><small>{{ incident.id }} · {{ formatDate(incident.fecha) }}</small></div>
            <span class="severity-label">{{ incident.severidad }}</span>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>
