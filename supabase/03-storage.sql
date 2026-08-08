-- ============================================================================
-- NettOps Perú — Políticas del bucket de evidencias
-- Ejecutar DESPUÉS de crear el bucket 'evidencias' en Storage.
-- (Supabase → SQL Editor → New query → pegar → Run)
--
-- El bucket es privado. js/api.js genera URLs firmadas de corta duración.
-- ============================================================================

-- Crea el bucket si aún no existe (equivale a hacerlo desde la interfaz)
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do update set public = false;

-- Limpieza para poder re-ejecutar
drop policy if exists ev_lectura   on storage.objects;
drop policy if exists ev_subida    on storage.objects;
drop policy if exists ev_borrado   on storage.objects;

-- Solo usuarios autenticados pueden solicitar una URL firmada.
create policy ev_lectura on storage.objects
  for select to authenticated using (
    bucket_id = 'evidencias'
    and (es_gestor() or es_mi_actividad((storage.foldername(name))[1]))
  );

-- La primera carpeta debe ser una actividad gestionada o asignada al usuario.
create policy ev_subida on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and (es_gestor() or es_mi_actividad((storage.foldername(name))[1]))
  );

-- Solo los gestores pueden borrar evidencias
create policy ev_borrado on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and (es_gestor() or es_mi_actividad((storage.foldername(name))[1]))
  );

select 'Bucket evidencias listo' as estado;
