<script setup>
import { useNotificationStore } from '../stores/notifications.js'

const notifications = useNotificationStore()
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <article v-for="item in notifications.items" :key="item.id" class="toast" :data-type="item.type">
      <div><strong>{{ item.title }}</strong><p v-if="item.message">{{ item.message }}</p></div>
      <button type="button" aria-label="Cerrar mensaje" @click="notifications.remove(item.id)">×</button>
    </article>
  </div>
</template>
