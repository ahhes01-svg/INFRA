import { supabase } from '../lib/supabase.js'

function throwIfError(result) {
  if (result.error) throw result.error
  return result.data || []
}

export async function loadProjects() {
  const [projects, sites, activities] = await Promise.all([
    supabase
      .from('proyectos')
      .select('id,codigo,nombre,descripcion,estado,inicio,fin,supervisor,presupuesto,cliente_id,clientes(nombre,razon)')
      .order('codigo'),
    supabase.from('sitios').select('id,proyecto_id'),
    supabase.from('actividades').select('id,proyecto_id,estado'),
  ])

  const projectRows = throwIfError(projects)
  const siteRows = throwIfError(sites)
  const activityRows = throwIfError(activities)

  return projectRows.map((project) => {
    const relatedActivities = activityRows.filter((item) => item.proyecto_id === project.id)
    const completed = relatedActivities.filter((item) => item.estado === 'completada').length
    return {
      ...project,
      siteCount: siteRows.filter((item) => item.proyecto_id === project.id).length,
      activityCount: relatedActivities.length,
      progress: relatedActivities.length ? Math.round((completed / relatedActivities.length) * 100) : 0,
    }
  })
}

export async function loadProject(id) {
  const [project, sites, activities] = await Promise.all([
    supabase
      .from('proyectos')
      .select('id,codigo,nombre,descripcion,estado,inicio,fin,supervisor,presupuesto,clientes(nombre,razon,ruc)')
      .eq('id', id)
      .single(),
    supabase
      .from('sitios')
      .select('id,codigo,nombre,distrito,provincia,estado')
      .eq('proyecto_id', id)
      .order('codigo'),
    supabase
      .from('actividades')
      .select('id,fecha,h_ini,h_fin,estado,sitios(codigo),tipos_actividad(nombre)')
      .eq('proyecto_id', id)
      .order('fecha', { ascending: false })
      .limit(30),
  ])

  if (project.error) throw project.error
  return {
    project: project.data,
    sites: throwIfError(sites),
    activities: throwIfError(activities),
  }
}
