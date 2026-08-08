-- ============================================================================
-- NettOps Perú — Políticas del bucket de evidencias
-- Ejecutar DESPUÉS de crear el bucket 'evidencias' en Storage.
-- (Supabase → SQL Editor → New query → pegar → Run)
--
-- El bucket se crea PÚBLICO en lectura para que las miniaturas carguen sin
-- firmar cada URL. Si prefieres privacidad total, marca el bucket como privado
-- y cambia js/api.js para usar createSignedUrl() en lugar de getPublicUrl().
-- ============================================================================

-- Crea el bucket si aún no existe (equivale a hacerlo desde la interfaz)
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do update set public = true;

-- Limpieza para poder re-ejecutar
drop policy if exists ev_lectura   on storage.objects;
drop policy if exists ev_subida    on storage.objects;
drop policy if exists ev_borrado   on storage.objects;

-- Cualquiera con el enlace puede ver la foto (bucket público)
create policy ev_lectura on storage.objects
  for select using (bucket_id = 'evidencias');

-- Solo usuarios autenticados suben, y únicamente a este bucket
create policy ev_subida on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidencias');

-- Solo los gestores pueden borrar evidencias
create policy ev_borrado on storage.objects
  for delete to authenticated
  using (bucket_id = 'evidencias' and es_gestor());

select 'Bucket evidencias listo' as estado;
