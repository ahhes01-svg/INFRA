-- ============================================================================
-- INFRA — Limpieza definitiva para producción
--
-- DESTRUCTIVO: elimina los datos demostrativos y todas las cuentas excepto
-- zahir@bitel.com.pe. Ejecutar únicamente después de revisar el script 06.
-- ============================================================================

begin;

do $$
begin
  if (select count(*) from auth.users where lower(email) = 'zahir@bitel.com.pe') <> 1 then
    raise exception 'Limpieza cancelada: zahir@bitel.com.pe no existe o está duplicado';
  end if;
end $$;

-- Hijos antes que padres para respetar todas las llaves foráneas.
delete from public.notificacion_lecturas;
delete from public.notificaciones;
delete from public.historial;
delete from public.evidencias;
delete from public.movimientos_material;
delete from public.checklist_items;
delete from public.actividad_tecnicos;
delete from public.incidencias;
delete from public.actividades;
delete from public.materiales;
delete from public.sitios;
delete from public.proyectos;
delete from public.clientes;
delete from public.tecnicos;
delete from public.tipos_actividad;

-- La única cuenta inicial queda como administradora y sin vínculo técnico.
update public.perfiles p
set rol = 'admin', tecnico_id = null, cargo = 'Administrador'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'zahir@bitel.com.pe';

-- El borrado en auth.users elimina sus perfiles mediante ON DELETE CASCADE.
delete from auth.users
where lower(email) <> 'zahir@bitel.com.pe';

commit;

-- Verificación final esperada: exactamente una fila con rol admin.
select u.email, p.nombre, p.rol, p.tecnico_id, p.cargo
from auth.users u
join public.perfiles p on p.id = u.id
order by u.email;
