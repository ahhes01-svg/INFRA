-- ============================================================================
-- INFRA — Vista previa de la limpieza para producción
-- Solo consulta. No modifica ni elimina datos.
-- ============================================================================

select
  u.id,
  u.email,
  p.nombre,
  p.rol,
  case when lower(u.email) = 'zahir@bitel.com.pe' then 'CONSERVAR' else 'ELIMINAR' end as accion
from auth.users u
left join public.perfiles p on p.id = u.id
order by accion, u.email;

select 'clientes' as tabla, count(*) as filas from public.clientes
union all select 'proyectos', count(*) from public.proyectos
union all select 'sitios', count(*) from public.sitios
union all select 'tecnicos', count(*) from public.tecnicos
union all select 'tipos_actividad', count(*) from public.tipos_actividad
union all select 'actividades', count(*) from public.actividades
union all select 'incidencias', count(*) from public.incidencias
union all select 'materiales', count(*) from public.materiales
union all select 'movimientos_material', count(*) from public.movimientos_material
union all select 'evidencias', count(*) from public.evidencias
union all select 'historial', count(*) from public.historial
union all select 'notificaciones', count(*) from public.notificaciones
order by tabla;
