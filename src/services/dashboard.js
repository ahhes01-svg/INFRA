import { supabase } from '../lib/supabase.js'

function assertResults(results) {
  const failed = results.find((result) => result.error)
  if (failed) throw failed.error
  return results.map((result) => result.data || [])
}

export async function loadDashboard() {
  const today = new Date().toISOString().slice(0, 10)

  const [projects, sites, activities, incidents, materials] = assertResults(
    await Promise.all([
      supabase.from('proyectos').select('id,codigo,nombre,estado,inicio,fin').order('codigo'),
      supabase.from('sitios').select('id,codigo,nombre,estado,proyecto_id').order('codigo'),
      supabase
        .from('actividades')
        .select('id,estado,fecha,h_ini,h_fin,sitio_id,proyecto_id')
        .gte('fecha', today)
        .order('fecha')
        .limit(12),
      supabase
        .from('incidencias')
        .select('id,titulo,severidad,estado,fecha,sitio_id')
        .in('estado', ['abierta', 'en_atencion'])
        .order('fecha', { ascending: false })
        .limit(8),
      supabase.from('materiales').select('id,nombre,stock,minimo,unidad').order('nombre'),
    ]),
  )

  const activeProjects = projects.filter((item) => item.estado === 'en_ejecucion').length
  const operationalSites = sites.filter((item) => item.estado === 'operativo').length
  const openIncidents = incidents.length
  const lowStock = materials.filter((item) => Number(item.stock) <= Number(item.minimo)).length

  const siteById = new Map(sites.map((site) => [site.id, site]))

  return {
    summary: { activeProjects, operationalSites, openIncidents, lowStock },
    activities: activities.map((activity) => ({
      ...activity,
      site: siteById.get(activity.sitio_id) || null,
    })),
    incidents,
  }
}
