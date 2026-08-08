import { defineStore } from 'pinia'
import { allowedEmail, isSupabaseConfigured, supabase } from '../lib/supabase.js'

function friendlyAuthError(error) {
  const message = error?.message || ''
  if (/invalid login/i.test(message)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(message)) return 'La cuenta todavía no está confirmada.'
  if (/failed to fetch|network/i.test(message)) return 'No se pudo conectar con el servidor.'
  return message || 'No se pudo iniciar sesión.'
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    initialized: false,
    loading: false,
    user: null,
    profile: null,
    error: '',
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.profile),
    displayName: (state) => state.profile?.nombre || state.user?.email || 'Administrador',
  },

  actions: {
    async initialize() {
      if (this.initialized) return
      this.loading = true
      this.error = ''

      try {
        if (!isSupabaseConfigured) {
          throw new Error('Falta configurar la conexión con Supabase.')
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        const sessionUser = data.session?.user || null
        if (sessionUser) await this.acceptUser(sessionUser)
      } catch (error) {
        this.error = friendlyAuthError(error)
        await this.clearSession()
      } finally {
        this.initialized = true
        this.loading = false
      }
    },

    async acceptUser(user) {
      if (user.email?.toLowerCase() !== allowedEmail) {
        await supabase.auth.signOut()
        throw new Error('Esta versión está habilitada únicamente para la cuenta administradora autorizada.')
      }

      const { data: profile, error } = await supabase
        .from('perfiles')
        .select('id,nombre,rol,cargo')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (profile.rol !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('La cuenta autorizada no tiene el rol de administrador.')
      }

      this.user = user
      this.profile = profile
    },

    async signIn(email, password) {
      this.loading = true
      this.error = ''

      try {
        if (email.trim().toLowerCase() !== allowedEmail) {
          throw new Error('Esta versión está habilitada únicamente para zahir@bitel.com.pe.')
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error) throw error

        await this.acceptUser(data.user)
        return true
      } catch (error) {
        this.error = friendlyAuthError(error)
        await this.clearSession()
        return false
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      this.loading = true
      try {
        if (supabase) await supabase.auth.signOut()
      } finally {
        await this.clearSession()
        this.loading = false
      }
    },

    async clearSession() {
      this.user = null
      this.profile = null
    },
  },
})
