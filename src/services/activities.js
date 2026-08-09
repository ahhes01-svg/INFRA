import { supabase } from '../lib/supabase.js'

export async function loadActivities() {
  const { data, error } = await supabase
    .from('actividades')
    .select(`
      id, fecha, h_ini, h_fin, inicio_real, fin_real, estado, obs,
      sitios(id,codigo,nombre),
      proyectos(id,codigo,nombre),
      tipos_actividad(id,nombre,categoria),
      actividad_tecnicos(tecnico_id),
      checklist_items(id,orden,texto,ok)
    `)
    .order('fecha', { ascending: false })
    .order('h_ini', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    checklist_items: [...(item.checklist_items || [])].sort((a, b) => a.orden - b.orden),
  }))
}

async function runActivityRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || (data.faltantes || []).join(' · ') || 'Operación rechazada')
  return data
}

export const startActivity = (id) => runActivityRpc('iniciar_actividad', { act_id: id })
export const finishActivity = (id) => runActivityRpc('finalizar_actividad', { act_id: id })
export const approveActivity = (id) => runActivityRpc('aprobar_actividad', { act_id: id })
