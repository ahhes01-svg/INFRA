<script setup>
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import StateBadge from '../components/StateBadge.vue'
import { approveActivity, finishActivity, loadActivities, startActivity } from '../services/activities.js'
import { useNotificationStore } from '../stores/notifications.js'
import { formatDate, formatTime, normalizeSearch } from '../utils/format.js'

const notifications = useNotificationStore()
const loading = ref(true)
const acting = ref('')
const error = ref('')
const search = ref('')
const status = ref('')
const activities = ref([])
const filtered = computed(() => {
  const term = normalizeSearch(search.value)
  return activities.value.filter((activity) => (!term || normalizeSearch(`${activity.id} ${activity.sitios?.codigo} ${activity.proyectos?.codigo} ${activity.tipos_actividad?.nombre}`).includes(term)) && (!status.value || activity.estado === status.value))
})

async function refresh() {
  loading.value = true
  error.value = ''
  try { activities.value = await loadActivities() }
  catch (requestError) { error.value = requestError.message || 'No se pudieron cargar las actividades.' }
  finally { loading.value = false }
}

async function execute(activity, action, successMessage, confirmation = '') {
  if (confirmation && !window.confirm(confirmation)) return
  acting.value = activity.id
  try {
    await action(activity.id)
    notifications.push('success', successMessage, activity.id)
    await refresh()
  } catch (requestError) {
    notifications.push('error', 'No se pudo actualizar', requestError.message)
  } finally { acting.value = '' }
}

onMounted(refresh)
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Actividades" description="Seguimiento del trabajo de campo y flujo de aprobación."><button class="button button-secondary" type="button" :disabled="loading" @click="refresh">Actualizar</button></PageHeader>
    <div v-if="error" class="alert alert-error"><strong>Error de carga.</strong><span>{{ error }}</span></div>
    <section class="toolbar panel-flat"><label class="search-control"><span>Buscar</span><input v-model="search" type="search" placeholder="Actividad, sitio, proyecto o tipo" /></label><label class="select-control"><span>Estado</span><select v-model="status"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="en_ejecucion">En ejecución</option><option value="en_revision">En revisión</option><option value="completada">Completada</option><option value="retrasada">Retrasada</option><option value="cancelada">Cancelada</option></select></label><strong class="result-count">{{ filtered.length }} actividades</strong></section>
    <section class="panel">
      <div v-if="loading" class="list-skeleton"><span v-for="item in 8" :key="item" class="skeleton skeleton-row" /></div>
      <EmptyState v-else-if="!filtered.length" title="No hay actividades registradas" description="Las actividades reales aparecerán aquí cuando sean programadas." />
      <div v-else class="table-wrap"><table><thead><tr><th>Actividad</th><th>Tipo</th><th>Sitio</th><th>Proyecto</th><th>Programación</th><th>Avance</th><th>Estado</th><th>Acción</th></tr></thead><tbody><tr v-for="activity in filtered" :key="activity.id"><td><strong>{{ activity.id }}</strong></td><td>{{ activity.tipos_actividad?.nombre || '—' }}</td><td>{{ activity.sitios?.codigo || '—' }}</td><td>{{ activity.proyectos?.codigo || '—' }}</td><td>{{ formatDate(activity.fecha) }}<small class="cell-note">{{ formatTime(activity.h_ini) }}–{{ formatTime(activity.h_fin) }}</small></td><td>{{ activity.checklist_items.filter(item => item.ok).length }}/{{ activity.checklist_items.length }}</td><td><StateBadge :state="activity.estado" /></td><td><button v-if="['pendiente','retrasada'].includes(activity.estado)" class="table-action" type="button" :disabled="acting === activity.id" @click="execute(activity,startActivity,'Actividad iniciada')">Iniciar</button><button v-else-if="activity.estado === 'en_ejecucion'" class="table-action" type="button" :disabled="acting === activity.id" @click="execute(activity,finishActivity,'Enviada a revisión',`¿Enviar ${activity.id} a revisión?`)" >Finalizar</button><button v-else-if="activity.estado === 'en_revision'" class="table-action" type="button" :disabled="acting === activity.id" @click="execute(activity,approveActivity,'Actividad aprobada',`¿Aprobar definitivamente ${activity.id}?`)" >Aprobar</button><span v-else class="cell-note">Sin acción</span></td></tr></tbody></table></div>
    </section>
  </div>
</template>
