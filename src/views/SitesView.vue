<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import StateBadge from '../components/StateBadge.vue'
import { loadSites } from '../services/sites.js'
import { normalizeSearch } from '../utils/format.js'

const loading = ref(true)
const error = ref('')
const search = ref('')
const status = ref('')
const sites = ref([])
const filtered = computed(() => {
  const term = normalizeSearch(search.value)
  return sites.value.filter((site) => (!term || normalizeSearch(`${site.codigo} ${site.nombre} ${site.distrito} ${site.provincia}`).includes(term)) && (!status.value || site.estado === status.value))
})

async function refresh() {
  loading.value = true
  error.value = ''
  try { sites.value = await loadSites() }
  catch (requestError) { error.value = requestError.message || 'No se pudieron cargar los sitios.' }
  finally { loading.value = false }
}
onMounted(refresh)
</script>

<template>
  <div class="page-stack">
    <PageHeader title="BTS / Sitios" description="Inventario central de estaciones e infraestructura instalada."><button class="button button-secondary" type="button" :disabled="loading" @click="refresh">Actualizar</button></PageHeader>
    <div v-if="error" class="alert alert-error"><strong>Error de carga.</strong><span>{{ error }}</span></div>
    <section class="toolbar panel-flat"><label class="search-control"><span>Buscar</span><input v-model="search" type="search" placeholder="Código, nombre o ubicación" /></label><label class="select-control"><span>Estado</span><select v-model="status"><option value="">Todos</option><option value="operativo">Operativo</option><option value="en_ejecucion">En ejecución</option><option value="planificado">Planificado</option><option value="alarma">Alarma</option><option value="inactivo">Inactivo</option></select></label><strong class="result-count">{{ filtered.length }} sitios</strong></section>
    <section class="panel">
      <div v-if="loading" class="list-skeleton"><span v-for="item in 8" :key="item" class="skeleton skeleton-row" /></div>
      <EmptyState v-else-if="!filtered.length" title="No hay sitios registrados" description="El inventario está limpio y listo para registrar infraestructura real." />
      <div v-else class="table-wrap"><table><thead><tr><th>Código</th><th>Nombre</th><th>Ubicación</th><th>Tipo</th><th>Tecnología</th><th>Proyecto</th><th>Estado</th></tr></thead><tbody><tr v-for="site in filtered" :key="site.id"><td><RouterLink class="table-link" :to="`/sitios/${site.id}`">{{ site.codigo }}</RouterLink></td><td><strong>{{ site.nombre }}</strong></td><td>{{ site.distrito }}, {{ site.provincia }}</td><td>{{ site.tipo || '—' }}</td><td><span class="tag-list"><i v-for="technology in site.tecnologias" :key="technology">{{ technology }}</i></span></td><td>{{ site.proyectos?.codigo || 'Sin proyecto' }}</td><td><StateBadge :state="site.estado" /></td></tr></tbody></table></div>
    </section>
  </div>
</template>
