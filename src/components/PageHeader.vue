<script setup>
defineProps({
  eyebrow: { type: String, default: 'Operaciones' },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <section class="page-intro">
    <div>
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div class="page-actions"><slot /></div>
  </section>
</template>
