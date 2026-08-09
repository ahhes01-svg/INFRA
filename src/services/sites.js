import { supabase } from '../lib/supabase.js'

export async function loadSites() {
  const { data, error } = await supabase
    .from('sitios')
    .select('id,codigo,nombre,direccion,distrito,provincia,tipo,altura,tecnologias,energia,estado,proyecto_id,proyectos(codigo,nombre)')
    .order('codigo')
    .limit(250)
  if (error) throw error
  return data || []
}

export async function loadSite(id) {
  const [site, activities, incidents] = await Promise.all([
    supabase
      .from('sitios')
      .select('id,codigo,nombre,direccion,distrito,provincia,lat,lng,tipo,altura,tecnologias,energia,estado,proyectos(id,codigo,nombre)')
      .eq('id', id)
      .single(),
    supabase
      .from('actividades')
      .select('id,fecha,h_ini,h_fin,estado,tipos_actividad(nombre)')
      .eq('sitio_id', id)
      .order('fecha', { ascending: false })
      .limit(30),
    supabase
      .from('incidencias')
      .select('id,titulo,severidad,estado,fecha')
      .eq('sitio_id', id)
      .order('fecha', { ascending: false })
      .limit(20),
  ])
  if (site.error) throw site.error
  if (activities.error) throw activities.error
  if (incidents.error) throw incidents.error
  return { site: site.data, activities: activities.data || [], incidents: incidents.data || [] }
}
