<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session.js'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const email = ref('zahir@bitel.com.pe')
const password = ref('')
const showPassword = ref(false)

async function submit() {
  const success = await session.signIn(email.value, password.value)
  if (success) await router.replace(String(route.query.next || '/dashboard'))
}
</script>

<template>
  <main class="login-page">
    <section class="login-brand-panel">
      <div class="login-brand-copy">
        <span class="brand-kicker">NettOps · Perú</span>
        <h1>Control operativo de infraestructura.</h1>
        <p>Proyectos, estaciones y actividades de campo en un entorno centralizado y seguro.</p>
      </div>
    </section>

    <section class="login-form-panel">
      <form class="login-card" @submit.prevent="submit">
        <div class="brand brand-login">
          <span class="brand-mark">+</span>
          <div><strong>INFRA</strong><span>Operaciones</span></div>
        </div>

        <div class="login-heading">
          <p class="eyebrow">Acceso administrativo</p>
          <h2>Iniciar sesión</h2>
          <p>Utiliza la cuenta autorizada para continuar.</p>
        </div>

        <div v-if="session.error" class="alert alert-error" role="alert">{{ session.error }}</div>

        <label class="field">
          <span>Correo electrónico</span>
          <input v-model="email" type="email" autocomplete="username" readonly />
        </label>

        <label class="field">
          <span>Contraseña</span>
          <div class="password-control">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
            />
            <button type="button" @click="showPassword = !showPassword">
              {{ showPassword ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
        </label>

        <button class="button button-primary button-full button-large" type="submit" :disabled="session.loading">
          {{ session.loading ? 'Verificando…' : 'Ingresar' }}
        </button>

        <p class="login-note">Acceso restringido a zahir@bitel.com.pe</p>
      </form>
    </section>
  </main>
</template>
