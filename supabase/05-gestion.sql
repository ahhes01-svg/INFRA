-- ============================================================================
-- NettOps Perú — Gestión de catálogos y cuentas
-- Ejecutar en: Supabase → SQL Editor → New query → pegar → Run
-- (después de 01-schema.sql; es idempotente)
--
-- Añade:
--   · Corrección de seguridad en el alta de usuarios
--   · Material asignable a un proyecto
--   · Alta / edición / baja de técnicos, sitios y materiales
--   · Vinculación de cuentas de acceso con la ficha del técnico
-- ============================================================================

-- ═══════════════════ 1. CORRECCIÓN DE SEGURIDAD ════════════════════════════
-- El trigger anterior tomaba el rol de los metadatos que envía el navegador.
-- Como el registro está abierto, cualquiera podía crearse una cuenta pidiendo
-- rol 'admin' y entrar con permisos totales. Ahora TODA cuenta nueva nace como
-- 'tecnico' sin permisos de gestión, y solo un admin/supervisor ya autenticado
-- puede elevarla mediante vincular_cuenta_tecnico().

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, rol, tecnico_id, cargo)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    'tecnico',        -- siempre el rol mínimo; nunca se lee del navegador
    null,             -- la vinculación con la ficha la hace un gestor
    nullif(trim(new.raw_user_meta_data->>'cargo'), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ═══════════════════ 2. MATERIAL POR PROYECTO ══════════════════════════════
alter table materiales add column if not exists proyecto_id text
  references proyectos(id) on delete set null;
alter table materiales add column if not exists activo boolean not null default true;
create index if not exists idx_mat_proyecto on materiales(proyecto_id);

comment on column materiales.proyecto_id is
  'Null = material de uso general. Con valor = stock reservado a ese proyecto.';

-- El supervisor también gestiona materiales (antes solo el admin)
drop policy if exists materiales_wr on materiales;
create policy materiales_wr on materiales for all to authenticated
  using (es_gestor()) with check (es_gestor());

-- ═══════════════════ 3. TÉCNICOS ═══════════════════════════════════════════

create or replace function guardar_tecnico(
  p_id text,                 -- null para alta; con valor para edición
  p_nombre text,
  p_dni text,
  p_rol text,
  p_especialidad text,
  p_telefono text,
  p_zona text,
  p_estado estado_tecnico default 'disponible',
  p_certificaciones text[] default '{}'
) returns json language plpgsql security definer set search_path = public as $$
declare nuevo_id text; n int;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para gestionar técnicos');
  end if;
  if coalesce(length(trim(p_nombre)), 0) < 5 then
    return json_build_object('ok', false, 'error', 'El nombre completo es obligatorio');
  end if;
  if p_dni is not null and p_dni <> '' and p_dni !~ '^[0-9]{8}$' then
    return json_build_object('ok', false, 'error', 'El DNI debe tener 8 dígitos');
  end if;
  -- DNI único entre técnicos
  if p_dni is not null and p_dni <> '' and exists (
      select 1 from tecnicos where dni = p_dni and (p_id is null or id <> p_id)) then
    return json_build_object('ok', false, 'error', 'Ya existe un técnico con ese DNI');
  end if;

  if p_id is null then
    perform pg_advisory_xact_lock(hashtext('nettops:tecnico_id'));
    select coalesce(max(substring(id from 5)::int), 0) + 1 into n
      from tecnicos where id ~ '^tec-[0-9]+$';
    nuevo_id := 'tec-' || lpad(n::text, 2, '0');
    insert into tecnicos (id, nombre, dni, rol, especialidad, telefono, zona, estado, certificaciones)
    values (nuevo_id, trim(p_nombre), nullif(p_dni,''), p_rol, p_especialidad, p_telefono, p_zona,
            p_estado, coalesce(p_certificaciones, '{}'));
    perform log_hist('tecnico_creado', nuevo_id, 'Registró al técnico ' || trim(p_nombre) || ' (' || p_rol || ')');
    return json_build_object('ok', true, 'id', nuevo_id, 'creado', true);
  else
    update tecnicos set
      nombre = trim(p_nombre), dni = nullif(p_dni,''), rol = p_rol,
      especialidad = p_especialidad, telefono = p_telefono, zona = p_zona,
      estado = p_estado, certificaciones = coalesce(p_certificaciones, '{}')
      where id = p_id;
    if not found then return json_build_object('ok', false, 'error', 'Técnico no encontrado'); end if;
    perform log_hist('tecnico_actualizado', p_id, 'Actualizó la ficha de ' || trim(p_nombre));
    return json_build_object('ok', true, 'id', p_id, 'creado', false);
  end if;
end $$;

-- Baja de técnico: si tiene historial NO se borra, se marca inactivo.
-- Así no se pierde la trazabilidad de quién hizo cada trabajo.
create or replace function eliminar_tecnico(p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare n_act int; nom text; pendientes int;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso');
  end if;
  select nombre into nom from tecnicos where id = p_id;
  if nom is null then return json_build_object('ok', false, 'error', 'Técnico no encontrado'); end if;

  select count(*) into pendientes
    from actividad_tecnicos at join actividades a on a.id = at.actividad_id
    where at.tecnico_id = p_id and a.estado in ('pendiente','en_ejecucion','retrasada');
  if pendientes > 0 then
    return json_build_object('ok', false, 'error',
      'No se puede dar de baja: tiene ' || pendientes || ' actividad(es) activa(s). Reasígnalas primero.');
  end if;

  select count(*) into n_act from actividad_tecnicos where tecnico_id = p_id;
  if n_act > 0 then
    update tecnicos set estado = 'inactivo' where id = p_id;
    perform log_hist('tecnico_baja', p_id, 'Dio de baja a ' || nom || ' (queda inactivo por historial)');
    return json_build_object('ok', true, 'modo', 'inactivado',
      'mensaje', nom || ' quedó inactivo: conserva su historial de ' || n_act || ' actividad(es).');
  end if;

  delete from tecnicos where id = p_id;
  perform log_hist('tecnico_eliminado', p_id, 'Eliminó al técnico ' || nom || ' (sin historial)');
  return json_build_object('ok', true, 'modo', 'eliminado', 'mensaje', nom || ' fue eliminado.');
end $$;

-- Vincula una cuenta de acceso recién creada con la ficha del técnico y le
-- asigna su rol. Solo un gestor autenticado puede llamarla, y solo un admin
-- puede otorgar los roles de gestión.
create or replace function vincular_cuenta_tecnico(
  p_email text, p_tecnico_id text, p_rol rol_usuario default 'tecnico'
) returns json language plpgsql security definer set search_path = public as $$
declare uid uuid; nom text;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para gestionar cuentas');
  end if;
  if p_rol in ('admin','supervisor') and mi_rol() <> 'admin' then
    return json_build_object('ok', false, 'error', 'Solo un administrador puede otorgar roles de gestión');
  end if;

  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then
    return json_build_object('ok', false, 'error', 'No existe una cuenta con ese correo');
  end if;

  if p_tecnico_id is not null then
    select nombre into nom from tecnicos where id = p_tecnico_id;
    if nom is null then return json_build_object('ok', false, 'error', 'Técnico no encontrado'); end if;
    -- Un técnico no puede tener dos cuentas
    if exists (select 1 from perfiles where tecnico_id = p_tecnico_id and id <> uid) then
      return json_build_object('ok', false, 'error', 'Ese técnico ya tiene una cuenta vinculada');
    end if;
  end if;

  update perfiles set rol = p_rol, tecnico_id = p_tecnico_id,
                      nombre = coalesce(nom, nombre)
    where id = uid;
  update tecnicos set usuario_id = uid where id = p_tecnico_id;

  perform log_hist('cuenta_vinculada', p_tecnico_id,
    'Creó acceso ' || trim(p_email) || ' con rol ' || p_rol || coalesce(' para ' || nom, ''));
  return json_build_object('ok', true, 'usuario_id', uid);
end $$;

-- Quitar el acceso sin borrar la cuenta ni el historial
create or replace function desvincular_cuenta(p_tecnico_id text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() <> 'admin' then
    return json_build_object('ok', false, 'error', 'Solo un administrador puede revocar accesos');
  end if;
  update perfiles set tecnico_id = null where tecnico_id = p_tecnico_id;
  update tecnicos set usuario_id = null where id = p_tecnico_id;
  perform log_hist('cuenta_desvinculada', p_tecnico_id, 'Revocó el acceso del técnico ' || p_tecnico_id);
  return json_build_object('ok', true);
end $$;

-- Qué técnicos tienen cuenta (para pintarlo en la lista)
create or replace function tecnicos_con_cuenta()
returns table (tecnico_id text, email text, rol rol_usuario)
language sql stable security definer set search_path = public as $$
  select p.tecnico_id, u.email, p.rol
  from perfiles p join auth.users u on u.id = p.id
  where p.tecnico_id is not null and es_gestor();
$$;

-- ═══════════════════ 4. SITIOS (BTS) ═══════════════════════════════════════

create or replace function guardar_sitio(
  p_id text,                 -- null para alta
  p_codigo text,
  p_nombre text,
  p_direccion text,
  p_distrito text,
  p_provincia text,
  p_lat double precision,
  p_lng double precision,
  p_tipo text,
  p_altura int,
  p_tecnologias text[],
  p_energia text,
  p_proyecto_id text,
  p_estado estado_sitio default 'planificado'
) returns json language plpgsql security definer set search_path = public as $$
declare nuevo_id text; n int; cod text;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para gestionar sitios');
  end if;

  cod := upper(trim(p_codigo));
  if cod !~ '^[A-Z]{2}-[A-Z0-9]+-[0-9]{3,4}$' then
    return json_build_object('ok', false, 'error',
      'El código debe seguir el formato de operador: REGIÓN-DISTRITO-NNNN (ej. IC-PISCO-0342)');
  end if;
  if exists (select 1 from sitios where codigo = cod and (p_id is null or id <> p_id)) then
    return json_build_object('ok', false, 'error', 'Ya existe un sitio con el código ' || cod);
  end if;
  if coalesce(length(trim(p_nombre)), 0) < 3 then
    return json_build_object('ok', false, 'error', 'El nombre del sitio es obligatorio');
  end if;
  -- Perú continental, con margen
  if p_lat is null or p_lng is null or p_lat < -19 or p_lat > 0 or p_lng < -82 or p_lng > -68 then
    return json_build_object('ok', false, 'error',
      'Las coordenadas no caen en territorio peruano. Latitud entre -19 y 0; longitud entre -82 y -68.');
  end if;

  if p_id is null then
    perform pg_advisory_xact_lock(hashtext('nettops:sitio_id'));
    select coalesce(max(substring(id from 4)::int), 0) + 1 into n
      from sitios where id ~ '^st-[0-9]+$';
    nuevo_id := 'st-' || n;
    insert into sitios (id, codigo, nombre, direccion, distrito, provincia, lat, lng,
                        tipo, altura, tecnologias, energia, proyecto_id, estado)
    values (nuevo_id, cod, trim(p_nombre), p_direccion, p_distrito, p_provincia, p_lat, p_lng,
            p_tipo, p_altura, coalesce(p_tecnologias,'{}'), p_energia, p_proyecto_id, p_estado);
    perform log_hist('sitio_creado', nuevo_id, 'Registró el sitio ' || cod || ' en ' || coalesce(p_distrito,'—'));
    return json_build_object('ok', true, 'id', nuevo_id, 'creado', true);
  else
    update sitios set
      codigo = cod, nombre = trim(p_nombre), direccion = p_direccion, distrito = p_distrito,
      provincia = p_provincia, lat = p_lat, lng = p_lng, tipo = p_tipo, altura = p_altura,
      tecnologias = coalesce(p_tecnologias,'{}'), energia = p_energia,
      proyecto_id = p_proyecto_id, estado = p_estado
      where id = p_id;
    if not found then return json_build_object('ok', false, 'error', 'Sitio no encontrado'); end if;
    perform log_hist('sitio_actualizado', p_id, 'Actualizó la ficha de ' || cod);
    return json_build_object('ok', true, 'id', p_id, 'creado', false);
  end if;
end $$;

create or replace function eliminar_sitio(p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare n_act int; cod text;
begin
  if not es_gestor() then return json_build_object('ok', false, 'error', 'No tienes permiso'); end if;
  select codigo into cod from sitios where id = p_id;
  if cod is null then return json_build_object('ok', false, 'error', 'Sitio no encontrado'); end if;

  select count(*) into n_act from actividades where sitio_id = p_id;
  if n_act > 0 then
    return json_build_object('ok', false, 'error',
      'No se puede eliminar ' || cod || ': tiene ' || n_act || ' actividad(es) registrada(s). ' ||
      'Cámbialo a estado "inactivo" si ya no opera.');
  end if;

  delete from sitios where id = p_id;
  perform log_hist('sitio_eliminado', p_id, 'Eliminó el sitio ' || cod);
  return json_build_object('ok', true);
end $$;

-- ═══════════════════ 5. MATERIALES ═════════════════════════════════════════

create or replace function guardar_material(
  p_id text,                 -- null para alta
  p_nombre text,
  p_categoria text,
  p_unidad text,
  p_stock int,
  p_minimo int,
  p_almacen text,
  p_proyecto_id text default null
) returns json language plpgsql security definer set search_path = public as $$
declare nuevo_id text; n int; stock_previo int;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para gestionar materiales');
  end if;
  if coalesce(length(trim(p_nombre)), 0) < 3 then
    return json_build_object('ok', false, 'error', 'La descripción del material es obligatoria');
  end if;
  if p_stock < 0 or p_minimo < 0 then
    return json_build_object('ok', false, 'error', 'El stock y el mínimo no pueden ser negativos');
  end if;

  if p_id is null then
    perform pg_advisory_xact_lock(hashtext('nettops:material_id'));
    select coalesce(max(substring(id from 5)::int), 0) + 1 into n
      from materiales where id ~ '^MAT-[0-9]+$';
    nuevo_id := 'MAT-' || lpad(n::text, 3, '0');
    insert into materiales (id, nombre, categoria, unidad, stock, minimo, almacen, proyecto_id)
    values (nuevo_id, trim(p_nombre), p_categoria, coalesce(nullif(p_unidad,''),'und'),
            p_stock, p_minimo, p_almacen, p_proyecto_id);
    -- El stock inicial queda como ingreso en el kardex, para que cuadre
    if p_stock > 0 then
      insert into movimientos_material (material_id, tipo, cantidad, usuario)
      values (nuevo_id, 'ingreso', p_stock, mi_nombre());
    end if;
    perform log_hist('material_creado', nuevo_id, 'Registró el material ' || trim(p_nombre));
    return json_build_object('ok', true, 'id', nuevo_id, 'creado', true);
  else
    select stock into stock_previo from materiales where id = p_id;
    if stock_previo is null then return json_build_object('ok', false, 'error', 'Material no encontrado'); end if;

    update materiales set
      nombre = trim(p_nombre), categoria = p_categoria,
      unidad = coalesce(nullif(p_unidad,''),'und'), stock = p_stock, minimo = p_minimo,
      almacen = p_almacen, proyecto_id = p_proyecto_id
      where id = p_id;

    -- Un ajuste manual de stock también se registra, para no romper el kardex
    if p_stock <> stock_previo then
      insert into movimientos_material (material_id, tipo, cantidad, usuario)
      values (p_id, case when p_stock > stock_previo then 'ingreso' else 'despacho' end,
              abs(p_stock - stock_previo), mi_nombre() || ' (ajuste)');
      perform log_hist('material_ajustado', p_id,
        'Ajustó el stock de ' || trim(p_nombre) || ' de ' || stock_previo || ' a ' || p_stock);
    else
      perform log_hist('material_actualizado', p_id, 'Actualizó la ficha de ' || trim(p_nombre));
    end if;
    return json_build_object('ok', true, 'id', p_id, 'creado', false);
  end if;
end $$;

create or replace function eliminar_material(p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare n_mov int; nom text;
begin
  if not es_gestor() then return json_build_object('ok', false, 'error', 'No tienes permiso'); end if;
  select nombre into nom from materiales where id = p_id;
  if nom is null then return json_build_object('ok', false, 'error', 'Material no encontrado'); end if;

  select count(*) into n_mov from movimientos_material where material_id = p_id;
  if n_mov > 0 then
    return json_build_object('ok', false, 'error',
      'No se puede eliminar: tiene ' || n_mov || ' movimiento(s) en el kardex. Pon el stock en 0 si ya no se usa.');
  end if;

  delete from materiales where id = p_id;
  perform log_hist('material_eliminado', p_id, 'Eliminó el material ' || nom);
  return json_build_object('ok', true);
end $$;

-- ═══════════════════ 6. COMPROBACIÓN ═══════════════════════════════════════
-- Las funciones nuevas nunca quedan disponibles para visitantes anónimos.
revoke execute on all functions in schema public from public, anon;
grant execute on function guardar_tecnico(text,text,text,text,text,text,text,estado_tecnico,text[]) to authenticated;
grant execute on function eliminar_tecnico(text) to authenticated;
grant execute on function vincular_cuenta_tecnico(text,text,rol_usuario) to authenticated;
grant execute on function desvincular_cuenta(text) to authenticated;
grant execute on function tecnicos_con_cuenta() to authenticated;
grant execute on function guardar_sitio(text,text,text,text,text,text,double precision,double precision,text,int,text[],text,text,estado_sitio) to authenticated;
grant execute on function eliminar_sitio(text) to authenticated;
grant execute on function guardar_material(text,text,text,text,int,int,text,text) to authenticated;
grant execute on function eliminar_material(text) to authenticated;

select 'Funciones de gestión instaladas' as estado,
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('guardar_tecnico','eliminar_tecnico','vincular_cuenta_tecnico',
                            'desvincular_cuenta','tecnicos_con_cuenta','guardar_sitio',
                            'eliminar_sitio','guardar_material','eliminar_material')) as funciones;
