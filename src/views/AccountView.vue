<script setup>
import { useSessionStore } from '../stores/session.js'

const session = useSessionStore()
</script>

<template>
  <section class="panel account-panel">
    <p class="eyebrow">Cuenta autorizada</p>
    <h2>{{ session.displayName }}</h2>
    <dl class="details-list">
      <div><dt>Correo</dt><dd>{{ session.user?.email }}</dd></div>
      <div><dt>Rol</dt><dd>Administrador</dd></div>
      <div><dt>Entorno</dt><dd>Producción</dd></div>
    </dl>
  </section>
</template>
