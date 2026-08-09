<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import StateBadge from '../components/StateBadge.vue'
import { loadSite } from '../services/sites.js'
import { formatDate, formatTime } from '../utils/format.js'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const result = ref({ site: null, activities: [], incidents: [] })
const openIncidents = computed(() => result.value.incidents.filter((item) => ['abierta', 'en_atencion'].includes(item.estado)).length)

onMounted(async () => {
  try { result.value = await loadSite(String(route.params.id)) }
  catch (requestError) { error.value = requestError.message || 'No se pudo abrir el sitio.' }
  finally { loading.value = false }
})
</script>

<template>
  <div class="page-stack">
    <RouterLink class="back-link" to="/sitios">← Volver a sitios</RouterLink>
    <div v-if="loading" class="panel detail-hero"><span class="skeleton skeleton-block" /></div>
    <div v-else-if="error" class="alert alert-error"><strong>Error.</strong><span>{{ error }}</span></div>
    <template v-else>
      <section class="panel detail-hero"><div><span class="code-label">{{ result.site.codigo }}</span><h2>{{ result.site.nombre }}</h2><p>{{ result.site.direccion || 'Sin dirección registrada' }} · {{ result.site.distrito }}, {{ result.site.provincia }}</p></div><StateBadge :state="result.site.estado" /></section>
      <section class="kpi-grid kpi-grid-three"><article class="kpi-card tone-blue"><span>Actividades</span><strong>{{ result.activities.length }}</strong></article><article class="kpi-card tone-red"><span>Incidencias abiertas</span><strong>{{ openIncidents }}</strong></article><article class="kpi-card tone-green"><span>Tecnologías</span><strong>{{ result.site.tecnologias?.length || 0 }}</strong></article></section>
      <section class="detail-grid">
        <article class="panel info-panel"><header class="panel-header"><div><p class="eyebrow">Ficha técnica</p><h3>Información del sitio</h3></div></header><dl class="details-list"><div><dt>Proyecto</dt><dd>{{ result.site.proyectos?.codigo || 'Sin proyecto' }}</dd></div><div><dt>Tipo</dt><dd>{{ result.site.tipo || '—' }}</dd></div><div><dt>Altura</dt><dd>{{ result.site.altura ? `${result.site.altura} m` : '—' }}</dd></div><div><dt>Energía</dt><dd>{{ result.site.energia || '—' }}</dd></div><div><dt>Coordenadas</dt><dd>{{ result.site.lat ?? '—' }}, {{ result.site.lng ?? '—' }}</dd></div></dl></article>
        <article class="panel"><header class="panel-header"><div><p class="eyebrow">Trabajos</p><h3>Actividades recientes</h3></div></header><EmptyState v-if="!result.activities.length" title="Sin actividades" description="No existen trabajos en esta estación." /><ul v-else class="record-list"><li v-for="activity in result.activities" :key="activity.id"><div><strong>{{ activity.tipos_actividad?.nombre || activity.id }}</strong><small>{{ formatDate(activity.fecha) }} · {{ formatTime(activity.h_ini) }}</small></div><StateBadge :state="activity.estado" /></li></ul></article>
      </section>
    </template>
  </div>
</template>
