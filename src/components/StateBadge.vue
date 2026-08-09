<script setup>
defineProps({ state: { type: String, required: true } })

const labels = {
  pendiente: 'Pendiente',
  retrasada: 'Retrasada',
  en_ejecucion: 'En ejecución',
  en_revision: 'En revisión',
  completada: 'Completada',
  cancelada: 'Cancelada',
  planificado: 'Planificado',
  operativo: 'Operativo',
  alarma: 'Alarma',
  inactivo: 'Inactivo',
  abierta: 'Abierta',
  en_atencion: 'En atención',
  resuelta: 'Resuelta',
}
</script>

<template>
  <span class="status-pill" :data-state="state">{{ labels[state] || state }}</span>
</template>
