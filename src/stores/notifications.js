import { defineStore } from 'pinia'

let nextId = 1

export const useNotificationStore = defineStore('notifications', {
  state: () => ({ items: [] }),
  actions: {
    push(type, title, message = '') {
      const id = nextId++
      this.items.push({ id, type, title, message })
      window.setTimeout(() => this.remove(id), 5000)
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
