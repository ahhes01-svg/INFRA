const shortDate = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

export function formatDate(value) {
  if (!value) return 'Sin fecha'
  return shortDate.format(new Date(`${value}T12:00:00`))
}

export function formatTime(value) {
  return value ? String(value).slice(0, 5) : '--:--'
}

export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
