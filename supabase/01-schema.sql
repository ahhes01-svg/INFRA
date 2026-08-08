-- ============================================================================
-- NettOps Perú — Esquema de base de datos
-- Ejecutar UNA VEZ en: Supabase → SQL Editor → New query → pegar → Run
--
-- Contiene: tipos, tablas, índices, seguridad por fila (RLS), funciones de
-- negocio y disparadores. Es idempotente: puede re-ejecutarse sin romper nada.
-- ============================================================================

-- ─────────────────────────── Tipos enumerados ──────────────────────────────
do $$ begin
  create type rol_usuario as enum ('admin', 'supervisor', 'tecnico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_actividad as enum ('pendiente','en_ejecucion','en_revision','completada','retrasada','cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_sitio as enum ('operativo','en_ejecucion','planificado','alarma','inactivo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_tecnico as enum ('en_campo','disponible','descanso','inactivo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type severidad_incidencia as enum ('critica','alta','media','baja');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_incidencia as enum ('abierta','en_atencion','resuelta','cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_evidencia as enum ('foto_antes','foto_avance','foto_despues','reporte');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_evidencia as enum ('en_revision','aprobada','rechazada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('ingreso','despacho','devolucion');
exception when duplicate_object then null; end $$;

-- ──────────────────────────────── Tablas ───────────────────────────────────

-- Perfiles: extiende auth.users con rol y vínculo al técnico de campo
create table if not exists perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  rol         rol_usuario not null default 'tecnico',
  tecnico_id  text,
  cargo       text,
  creado_en   timestamptz not null default now()
);

create table if not exists clientes (
  id              text primary key,
  nombre          text not null,
  razon           text not null,
  ruc             text,
  contacto        text,
  cargo_contacto  text,
  telefono        text,
  creado_en       timestamptz not null default now()
);

create table if not exists proyectos (
  id           text primary key,
  codigo       text not null unique,
  cliente_id   text not null references clientes(id) on delete restrict,
  nombre       text not null,
  descripcion  text,
  estado       text not null default 'en_ejecucion',
  inicio       date,
  fin          date,
  supervisor   text,
  presupuesto  numeric(12,2),
  creado_en    timestamptz not null default now()
);

create table if not exists sitios (
  id            text primary key,
  codigo        text not null unique,
  nombre        text not null,
  direccion     text,
  distrito      text,
  provincia     text,
  lat           double precision,
  lng           double precision,
  tipo          text,
  altura        integer,
  tecnologias   text[] not null default '{}',
  energia       text,
  proyecto_id   text references proyectos(id) on delete set null,
  estado        estado_sitio not null default 'planificado',
  creado_en     timestamptz not null default now()
);

create table if not exists tecnicos (
  id               text primary key,
  nombre           text not null,
  dni              text,
  rol              text,
  especialidad     text,
  telefono         text,
  foto             text,
  estado           estado_tecnico not null default 'disponible',
  zona             text,
  certificaciones  text[] not null default '{}',
  usuario_id       uuid references auth.users(id) on delete set null,
  creado_en        timestamptz not null default now()
);

create table if not exists tipos_actividad (
  id         text primary key,
  nombre     text not null,
  categoria  text,
  dur_horas  numeric(4,1)
);

create table if not exists actividades (
  id           text primary key,
  tipo_id      text not null references tipos_actividad(id) on delete restrict,
  sitio_id     text not null references sitios(id) on delete restrict,
  proyecto_id  text not null references proyectos(id) on delete restrict,
  fecha        date not null,
  h_ini        time not null,
  h_fin        time not null,
  inicio_real  time,
  fin_real     time,
  estado       estado_actividad not null default 'pendiente',
  obs          text default '',
  creado_en    timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Cuadrilla asignada (relación N:M)
create table if not exists actividad_tecnicos (
  actividad_id text not null references actividades(id) on delete cascade,
  tecnico_id   text not null references tecnicos(id) on delete cascade,
  primary key (actividad_id, tecnico_id)
);

create table if not exists checklist_items (
  id            bigserial primary key,
  actividad_id  text not null references actividades(id) on delete cascade,
  orden         integer not null default 0,
  texto         text not null,
  ok            boolean not null default false
);

create table if not exists incidencias (
  id                text primary key,
  titulo            text not null,
  descripcion       text,
  severidad         severidad_incidencia not null default 'media',
  estado            estado_incidencia not null default 'abierta',
  sitio_id          text references sitios(id) on delete set null,
  actividad_id      text references actividades(id) on delete set null,
  reportado_por     text references tecnicos(id) on delete set null,
  asignado_a        text references tecnicos(id) on delete set null,
  fecha             date not null default current_date,
  hora              time not null default localtime,
  fecha_limite      date,
  fecha_resolucion  date,
  creado_en         timestamptz not null default now()
);

create table if not exists materiales (
  id         text primary key,
  nombre     text not null,
  categoria  text,
  unidad     text not null default 'und',
  stock      integer not null default 0 check (stock >= 0),
  minimo     integer not null default 0,
  almacen    text
);

create table if not exists movimientos_material (
  id            bigserial primary key,
  material_id   text not null references materiales(id) on delete cascade,
  tipo          tipo_movimiento not null,
  cantidad      integer not null check (cantidad > 0),
  actividad_id  text references actividades(id) on delete set null,
  sitio_id      text references sitios(id) on delete set null,
  usuario       text,
  fecha         date not null default current_date,
  hora          time not null default localtime,
  creado_en     timestamptz not null default now()
);

create table if not exists evidencias (
  id            text primary key,
  actividad_id  text not null references actividades(id) on delete cascade,
  tipo          tipo_evidencia not null,
  titulo        text,
  archivo       text,               -- ruta dentro del bucket 'evidencias'
  fecha         date not null default current_date,
  hora          time not null default localtime,
  subido_por    text references tecnicos(id) on delete set null,
  estado        estado_evidencia not null default 'en_revision',
  lat           double precision,   -- GPS del momento de la captura
  lng           double precision,
  creado_en     timestamptz not null default now()
);

create table if not exists historial (
  id         bigserial primary key,
  fecha      date not null default current_date,
  hora       time not null default localtime,
  usuario    text not null,
  accion     text not null,
  entidad    text,
  detalle    text,
  creado_en  timestamptz not null default now()
);

create table if not exists notificaciones (
  id         bigserial primary key,
  tipo       text not null,
  titulo     text not null,
  detalle    text,
  link       text,
  fecha      date not null default current_date,
  hora       time not null default localtime,
  leida      boolean not null default false,
  creado_en  timestamptz not null default now()
);

-- Lectura individual: una notificación global no se marca para todos cuando
-- un solo usuario abre la campana.
create table if not exists notificacion_lecturas (
  notificacion_id bigint not null references notificaciones(id) on delete cascade,
  usuario_id      uuid not null references auth.users(id) on delete cascade,
  leida_en        timestamptz not null default now(),
  primary key (notificacion_id, usuario_id)
);

-- ──────────────────────────────── Índices ──────────────────────────────────
create index if not exists idx_act_fecha    on actividades(fecha);
create index if not exists idx_act_estado   on actividades(estado);
create index if not exists idx_act_sitio    on actividades(sitio_id);
create index if not exists idx_act_proyecto on actividades(proyecto_id);
create index if not exists idx_at_tecnico   on actividad_tecnicos(tecnico_id);
create index if not exists idx_chk_act      on checklist_items(actividad_id, orden);
create index if not exists idx_ev_act       on evidencias(actividad_id);
create index if not exists idx_inc_sitio    on incidencias(sitio_id);
create index if not exists idx_mov_mat      on movimientos_material(material_id);
create index if not exists idx_sitios_pry   on sitios(proyecto_id);
create index if not exists idx_hist_fecha   on historial(fecha desc, hora desc);

-- ─────────────────── Funciones auxiliares de seguridad ─────────────────────
-- SECURITY DEFINER para evitar recursión al consultarlas dentro de las
-- políticas de la propia tabla perfiles.

create or replace function mi_rol()
returns rol_usuario language sql stable security definer set search_path = public as $$
  select coalesce((select rol from perfiles where id = auth.uid()), 'tecnico'::rol_usuario);
$$;

create or replace function mi_tecnico_id()
returns text language sql stable security definer set search_path = public as $$
  select tecnico_id from perfiles where id = auth.uid();
$$;

create or replace function mi_nombre()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select nombre from perfiles where id = auth.uid()), 'Sistema');
$$;

-- ¿Puede gestionar? (admin o supervisor)
create or replace function es_gestor()
returns boolean language sql stable security definer set search_path = public as $$
  select mi_rol() in ('admin','supervisor');
$$;

-- ¿La actividad es de la cuadrilla del usuario actual?
create or replace function es_mi_actividad(act_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from actividad_tecnicos at
    where at.actividad_id = act_id and at.tecnico_id = mi_tecnico_id()
  );
$$;

-- ───────────────── Perfil automático al registrar usuario ──────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, rol, tecnico_id, cargo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'tecnico',
    null,
    new.raw_user_meta_data->>'cargo'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────── Registro de historial ─────────────────────────────
create or replace function log_hist(p_accion text, p_entidad text, p_detalle text)
returns void language sql security definer set search_path = public as $$
  insert into historial (usuario, accion, entidad, detalle)
  values (mi_nombre(), p_accion, p_entidad, p_detalle);
$$;

create or replace function notificar(p_tipo text, p_titulo text, p_detalle text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notificaciones (tipo, titulo, detalle, link)
  values (p_tipo, p_titulo, p_detalle, p_link);
$$;

-- ═══════════════════ Reglas de negocio como funciones ══════════════════════
-- Viven en el servidor para que no puedan saltarse desde el navegador.

-- Iniciar actividad: solo la cuadrilla asignada o un gestor
create or replace function iniciar_actividad(act_id text)
returns json language plpgsql security definer set search_path = public as $$
declare a actividades; s sitios; t tipos_actividad;
begin
  select * into a from actividades where id = act_id;
  if not found then return json_build_object('ok', false, 'error', 'Actividad no encontrada'); end if;
  if not (es_gestor() or es_mi_actividad(act_id)) then
    return json_build_object('ok', false, 'error', 'No tienes permiso sobre esta actividad');
  end if;
  if a.estado = 'en_ejecucion' then return json_build_object('ok', true); end if;
  if a.estado in ('completada','en_revision','cancelada') then
    return json_build_object('ok', false, 'error', 'La actividad ya fue cerrada');
  end if;

  update actividades
    set estado = 'en_ejecucion', inicio_real = localtime, actualizado_en = now()
    where id = act_id;

  select * into s from sitios where id = a.sitio_id;
  select * into t from tipos_actividad where id = a.tipo_id;
  perform log_hist('actividad_iniciada', act_id, 'Inició ' || t.nombre || ' en ' || s.codigo);
  perform notificar('ejecucion', 'Actividad iniciada', act_id || ' · ' || t.nombre || ' en ' || s.codigo, 'actividades.html');
  return json_build_object('ok', true);
end $$;

-- Marcar/desmarcar ítem del checklist
create or replace function marcar_checklist(item_id bigint, valor boolean)
returns json language plpgsql security definer set search_path = public as $$
declare it checklist_items;
begin
  select * into it from checklist_items where id = item_id;
  if not found then return json_build_object('ok', false, 'error', 'Ítem no encontrado'); end if;
  if not (es_gestor() or es_mi_actividad(it.actividad_id)) then
    return json_build_object('ok', false, 'error', 'No tienes permiso sobre esta actividad');
  end if;
  update checklist_items set ok = valor where id = item_id;
  return json_build_object('ok', true);
end $$;

-- Cierre validado: exige checklist completo + foto de antes y de después.
-- Deja la actividad EN REVISIÓN esperando al supervisor.
create or replace function finalizar_actividad(act_id text)
returns json language plpgsql security definer set search_path = public as $$
declare
  a actividades; s sitios; t tipos_actividad;
  sin_marcar int; tiene_antes bool; tiene_despues bool;
  faltantes text[] := '{}';
begin
  select * into a from actividades where id = act_id;
  if not found then return json_build_object('ok', false, 'faltantes', array['actividad no encontrada']::text[]); end if;
  if not (es_gestor() or es_mi_actividad(act_id)) then
    return json_build_object('ok', false, 'faltantes', array['no tienes permiso sobre esta actividad']::text[]);
  end if;
  if a.estado not in ('en_ejecucion','retrasada','pendiente') then
    return json_build_object('ok', false, 'faltantes', array['la actividad no está en ejecución']::text[]);
  end if;

  select count(*) into sin_marcar from checklist_items where actividad_id = act_id and not ok;
  if sin_marcar > 0 then
    faltantes := faltantes || (sin_marcar || ' ítem(s) del checklist sin marcar')::text;
  end if;

  select exists(select 1 from evidencias where actividad_id = act_id and tipo = 'foto_antes')
    into tiene_antes;
  select exists(select 1 from evidencias where actividad_id = act_id and tipo in ('foto_despues','foto_avance'))
    into tiene_despues;
  if not tiene_antes   then faltantes := faltantes || 'foto de ANTES del trabajo'::text;   end if;
  if not tiene_despues then faltantes := faltantes || 'foto de DESPUÉS del trabajo'::text; end if;

  if array_length(faltantes, 1) > 0 then
    return json_build_object('ok', false, 'faltantes', faltantes);
  end if;

  update actividades
    set estado = 'en_revision',
        fin_real = localtime,
        inicio_real = coalesce(inicio_real, h_ini),
        actualizado_en = now()
    where id = act_id;

  select * into s from sitios where id = a.sitio_id;
  select * into t from tipos_actividad where id = a.tipo_id;
  perform log_hist('actividad_finalizada', act_id, 'Cerró ' || t.nombre || ' en ' || s.codigo || '; pasa a revisión del supervisor');
  perform notificar('pendiente', 'Actividad por aprobar', act_id || ' · ' || t.nombre || ' en ' || s.codigo, 'actividades.html');
  return json_build_object('ok', true);
end $$;

-- Aprobar cierre: exclusivo de supervisor/admin
create or replace function aprobar_actividad(act_id text)
returns json language plpgsql security definer set search_path = public as $$
declare a actividades; s sitios; t tipos_actividad;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'Solo el supervisor puede aprobar cierres');
  end if;
  select * into a from actividades where id = act_id;
  if not found or a.estado <> 'en_revision' then
    return json_build_object('ok', false, 'error', 'La actividad no está en revisión');
  end if;

  update actividades set estado = 'completada', actualizado_en = now() where id = act_id;

  select * into s from sitios where id = a.sitio_id;
  select * into t from tipos_actividad where id = a.tipo_id;
  perform log_hist('actividad_aprobada', act_id, 'Aprobó ' || act_id || ' en ' || s.codigo);
  perform notificar('completado', 'Actividad aprobada', act_id || ' · ' || t.nombre || ' en ' || s.codigo, 'actividades.html');
  return json_build_object('ok', true);
end $$;

-- Rechazar cierre con motivo: vuelve a la cuadrilla
create or replace function rechazar_actividad(act_id text, motivo text)
returns json language plpgsql security definer set search_path = public as $$
declare a actividades; s sitios;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'Solo el supervisor puede rechazar cierres');
  end if;
  if coalesce(length(trim(motivo)), 0) < 5 then
    return json_build_object('ok', false, 'error', 'Indica el motivo del rechazo');
  end if;
  select * into a from actividades where id = act_id;
  if not found or a.estado <> 'en_revision' then
    return json_build_object('ok', false, 'error', 'La actividad no está en revisión');
  end if;

  update actividades
    set estado = 'en_ejecucion',
        fin_real = null,
        obs = coalesce(nullif(obs, '') || ' · ', '') || 'RECHAZO del supervisor: ' || trim(motivo),
        actualizado_en = now()
    where id = act_id;

  select * into s from sitios where id = a.sitio_id;
  perform log_hist('actividad_rechazada', act_id, 'Rechazó el cierre de ' || act_id || ' (' || s.codigo || '): ' || trim(motivo));
  perform notificar('critico', 'Cierre rechazado', act_id || ' · ' || trim(motivo), 'actividades.html');
  return json_build_object('ok', true);
end $$;

-- Detección de cruce de horario para una cuadrilla
create or replace function hay_cruce(p_tecnicos text[], p_fecha date, p_ini time, p_fin time, p_excluir text default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if auth.uid() is null or (
    not es_gestor() and not (
      coalesce(array_length(p_tecnicos, 1), 0) = 1 and p_tecnicos[1] = mi_tecnico_id()
    )
  ) then
    return json_build_object('cruce', false, 'error', 'No tienes permiso para consultar esa agenda');
  end if;

  select a.id, a.h_ini, a.h_fin, t.nombre as tecnico into r
  from actividades a
  join actividad_tecnicos at on at.actividad_id = a.id
  join tecnicos t on t.id = at.tecnico_id
  where at.tecnico_id = any(p_tecnicos)
    and a.fecha = p_fecha
    and a.estado not in ('cancelada','completada','en_revision')
    and (p_excluir is null or a.id <> p_excluir)
    and a.h_ini < p_fin and p_ini < a.h_fin
  limit 1;

  if found then
    return json_build_object('cruce', true, 'actividad', r.id, 'tecnico', r.tecnico,
                             'h_ini', r.h_ini, 'h_fin', r.h_fin);
  end if;
  return json_build_object('cruce', false);
end $$;

-- Reprogramar validando cruces
create or replace function reprogramar_actividad(act_id text, p_fecha date, p_ini time, p_fin time)
returns json language plpgsql security definer set search_path = public as $$
declare tecs text[]; chk json;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para reprogramar');
  end if;
  select array_agg(tecnico_id) into tecs from actividad_tecnicos where actividad_id = act_id;
  chk := hay_cruce(coalesce(tecs, '{}'), p_fecha, p_ini, p_fin, act_id);
  if (chk->>'cruce')::bool then
    return json_build_object('ok', false, 'conflicto', chk);
  end if;

  update actividades
    set fecha = p_fecha, h_ini = p_ini, h_fin = p_fin,
        estado = case when estado = 'retrasada' then 'pendiente'::estado_actividad else estado end,
        actualizado_en = now()
    where id = act_id;

  perform log_hist('actividad_reprogramada', act_id,
    'Reprogramó ' || act_id || ' al ' || p_fecha || ' ' || p_ini || '–' || p_fin);
  return json_build_object('ok', true);
end $$;

-- Crear actividad con validación de cruce y ID correlativo (ACT-0031…)
create or replace function crear_actividad(
  p_tipo text, p_sitio text, p_tecnicos text[], p_fecha date,
  p_ini time, p_fin time, p_obs text default ''
) returns json language plpgsql security definer set search_path = public as $$
declare nuevo_id text; pry text; chk json; n int; tid text;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para programar actividades');
  end if;
  if p_fin <= p_ini then
    return json_build_object('ok', false, 'error', 'El fin debe ser posterior al inicio');
  end if;
  if coalesce(array_length(p_tecnicos, 1), 0) = 0 then
    return json_build_object('ok', false, 'error', 'Asigna al menos un técnico');
  end if;

  chk := hay_cruce(p_tecnicos, p_fecha, p_ini, p_fin, null);
  if (chk->>'cruce')::bool then
    return json_build_object('ok', false, 'conflicto', chk);
  end if;

  select proyecto_id into pry from sitios where id = p_sitio;
  perform pg_advisory_xact_lock(hashtext('nettops:actividad_id'));
  select coalesce(max(substring(id from 5)::int), 0) + 1 into n
    from actividades where id ~ '^ACT-[0-9]+$';
  nuevo_id := 'ACT-' || lpad(n::text, 4, '0');

  insert into actividades (id, tipo_id, sitio_id, proyecto_id, fecha, h_ini, h_fin, estado, obs)
  values (nuevo_id, p_tipo, p_sitio, pry, p_fecha, p_ini, p_fin, 'pendiente', coalesce(p_obs, ''));

  foreach tid in array p_tecnicos loop
    insert into actividad_tecnicos (actividad_id, tecnico_id) values (nuevo_id, tid);
  end loop;

  perform log_hist('actividad_creada', nuevo_id,
    'Programó actividad en ' || (select codigo from sitios where id = p_sitio) || ' para el ' || p_fecha);
  return json_build_object('ok', true, 'id', nuevo_id);
end $$;

-- Cancelar actividad
create or replace function cancelar_actividad(act_id text, motivo text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso');
  end if;
  update actividades
    set estado = 'cancelada',
        obs = coalesce(nullif(obs, '') || ' · ', '') || 'Cancelada: ' || coalesce(motivo, 'sin motivo'),
        actualizado_en = now()
    where id = act_id;
  perform log_hist('actividad_cancelada', act_id, 'Canceló ' || act_id || ': ' || coalesce(motivo, 'sin motivo'));
  return json_build_object('ok', true);
end $$;

-- Registrar incidencia (ID correlativo INC-AAAA-NNN)
create or replace function crear_incidencia(
  p_titulo text, p_descripcion text, p_severidad severidad_incidencia,
  p_sitio text, p_actividad text, p_limite date
) returns json language plpgsql security definer set search_path = public as $$
declare nuevo_id text; n int; yr text := to_char(current_date, 'YYYY');
begin
  if auth.uid() is null or (
    p_actividad is not null and not (es_gestor() or es_mi_actividad(p_actividad))
  ) then
    return json_build_object('ok', false, 'error', 'No tienes permiso para reportar esta incidencia');
  end if;
  if coalesce(length(trim(p_titulo)), 0) < 8 then
    return json_build_object('ok', false, 'error', 'Describe la incidencia en al menos 8 caracteres');
  end if;

  perform pg_advisory_xact_lock(hashtext('nettops:incidencia_id'));
  select coalesce(max(substring(id from 10)::int), 0) + 1 into n
    from incidencias where id like 'INC-' || yr || '-%';
  nuevo_id := 'INC-' || yr || '-' || lpad(n::text, 3, '0');

  insert into incidencias (id, titulo, descripcion, severidad, estado, sitio_id, actividad_id,
                           reportado_por, asignado_a, fecha_limite)
  values (nuevo_id, trim(p_titulo), p_descripcion, p_severidad, 'abierta', p_sitio, p_actividad,
          mi_tecnico_id(), mi_tecnico_id(), p_limite);

  -- Una incidencia crítica pone el sitio en alarma
  if p_severidad = 'critica' and p_sitio is not null then
    update sitios set estado = 'alarma' where id = p_sitio;
  end if;

  perform log_hist('incidencia_creada', nuevo_id,
    'Reportó "' || trim(p_titulo) || '" en ' || coalesce((select codigo from sitios where id = p_sitio), '—') ||
    ', severidad ' || p_severidad);
  perform notificar(case when p_severidad = 'critica' then 'critico' else 'pendiente' end,
    'Nueva incidencia ' || p_severidad, nuevo_id || ' · ' || trim(p_titulo), 'incidencias.html');
  return json_build_object('ok', true, 'id', nuevo_id);
end $$;

-- Resolver incidencia (devuelve el sitio a operativo si no quedan críticas)
create or replace function resolver_incidencia(inc_id text)
returns json language plpgsql security definer set search_path = public as $$
declare i incidencias; quedan int;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'Solo el supervisor puede resolver incidencias');
  end if;
  select * into i from incidencias where id = inc_id;
  if not found then return json_build_object('ok', false, 'error', 'Incidencia no encontrada'); end if;

  update incidencias set estado = 'resuelta', fecha_resolucion = current_date where id = inc_id;

  select count(*) into quedan from incidencias
    where sitio_id = i.sitio_id and severidad = 'critica'
      and estado in ('abierta','en_atencion') and id <> inc_id;
  if quedan = 0 and i.sitio_id is not null then
    update sitios set estado = 'operativo' where id = i.sitio_id and estado = 'alarma';
  end if;

  perform log_hist('incidencia_resuelta', inc_id, 'Resolvió ' || inc_id || ' — ' || i.titulo);
  perform notificar('completado', 'Incidencia resuelta', inc_id || ' · ' || i.titulo, 'incidencias.html');
  return json_build_object('ok', true);
end $$;

create or replace function atender_incidencia(inc_id text)
returns json language plpgsql security definer set search_path = public as $$
declare i incidencias;
begin
  select * into i from incidencias where id = inc_id;
  if not found then return json_build_object('ok', false, 'error', 'Incidencia no encontrada'); end if;
  if not (es_gestor() or i.reportado_por = mi_tecnico_id() or i.asignado_a = mi_tecnico_id()) then
    return json_build_object('ok', false, 'error', 'No tienes permiso sobre esta incidencia');
  end if;
  update incidencias set estado = 'en_atencion' where id = inc_id;
  perform log_hist('incidencia_actualizada', inc_id, 'Pasó ' || inc_id || ' a "en atención"');
  return json_build_object('ok', true);
end $$;

-- Kardex: despacho con validación de stock (atómico)
create or replace function despachar_material(p_material text, p_cantidad int, p_actividad text)
returns json language plpgsql security definer set search_path = public as $$
declare m materiales; a actividades; destino text;
begin
  if not es_gestor() then
    return json_build_object('ok', false, 'error', 'No tienes permiso para despachar material');
  end if;
  if p_cantidad is null or p_cantidad < 1 then
    return json_build_object('ok', false, 'error', 'Cantidad inválida');
  end if;

  select * into m from materiales where id = p_material for update;
  if not found then return json_build_object('ok', false, 'error', 'Material no encontrado'); end if;
  if p_cantidad > m.stock then
    return json_build_object('ok', false, 'error', 'Stock insuficiente: quedan ' || m.stock || ' ' || m.unidad);
  end if;

  select * into a from actividades where id = p_actividad;

  update materiales set stock = stock - p_cantidad where id = p_material;
  insert into movimientos_material (material_id, tipo, cantidad, actividad_id, sitio_id, usuario)
  values (p_material, 'despacho', p_cantidad, a.id, a.sitio_id, mi_nombre());

  destino := coalesce(a.id || ' (' || (select codigo from sitios where id = a.sitio_id) || ')', 'sin actividad');
  perform log_hist('material_despachado', p_material,
    'Despachó ' || p_cantidad || ' ' || m.unidad || ' de ' || m.nombre || ' a ' || destino);

  if m.stock - p_cantidad = 0 then
    perform notificar('critico', 'Material agotado', p_material || ' · ' || m.nombre || ' quedó en cero.', 'materiales.html');
  elsif m.stock - p_cantidad < m.minimo then
    perform notificar('pendiente', 'Material bajo mínimo',
      p_material || ' · quedan ' || (m.stock - p_cantidad) || ' ' || m.unidad || '.', 'materiales.html');
  end if;

  return json_build_object('ok', true, 'stock', m.stock - p_cantidad);
end $$;

create or replace function ingresar_material(p_material text, p_cantidad int)
returns json language plpgsql security definer set search_path = public as $$
declare m materiales;
begin
  if not es_gestor() then return json_build_object('ok', false, 'error', 'No tienes permiso'); end if;
  if p_cantidad is null or p_cantidad < 1 then return json_build_object('ok', false, 'error', 'Cantidad inválida'); end if;
  select * into m from materiales where id = p_material;
  if not found then return json_build_object('ok', false, 'error', 'Material no encontrado'); end if;

  update materiales set stock = stock + p_cantidad where id = p_material;
  insert into movimientos_material (material_id, tipo, cantidad, usuario)
  values (p_material, 'ingreso', p_cantidad, mi_nombre());
  perform log_hist('material_ingresado', p_material,
    'Ingresó ' || p_cantidad || ' ' || m.unidad || ' de ' || m.nombre || ' al almacén');
  return json_build_object('ok', true, 'stock', m.stock + p_cantidad);
end $$;

-- Registrar evidencia ya subida al bucket
create or replace function registrar_evidencia(
  p_actividad text, p_tipo tipo_evidencia, p_titulo text, p_archivo text,
  p_lat double precision default null, p_lng double precision default null
) returns json language plpgsql security definer set search_path = public as $$
declare nuevo_id text; n int;
begin
  if not (es_gestor() or es_mi_actividad(p_actividad)) then
    return json_build_object('ok', false, 'error', 'No tienes permiso sobre esta actividad');
  end if;
  perform pg_advisory_xact_lock(hashtext('nettops:evidencia_id'));
  select coalesce(max(substring(id from 4)::int), 0) + 1 into n
    from evidencias where id ~ '^EV-[0-9]+$';
  nuevo_id := 'EV-' || lpad(n::text, 4, '0');

  insert into evidencias (id, actividad_id, tipo, titulo, archivo, subido_por, estado, lat, lng)
  values (nuevo_id, p_actividad, p_tipo, p_titulo, p_archivo, mi_tecnico_id(), 'en_revision', p_lat, p_lng);

  perform log_hist('evidencia_subida', nuevo_id, 'Subió evidencia "' || coalesce(p_titulo, '') || '" a ' || p_actividad);
  perform notificar('pendiente', 'Evidencia por revisar', nuevo_id || ' · ' || p_actividad, 'evidencias.html');
  return json_build_object('ok', true, 'id', nuevo_id);
end $$;

create or replace function aprobar_evidencia(ev_id text)
returns json language plpgsql security definer set search_path = public as $$
declare e evidencias;
begin
  if not es_gestor() then return json_build_object('ok', false, 'error', 'Solo el supervisor puede aprobar'); end if;
  select * into e from evidencias where id = ev_id;
  if not found then return json_build_object('ok', false, 'error', 'Evidencia no encontrada'); end if;
  update evidencias set estado = 'aprobada' where id = ev_id;
  perform log_hist('evidencia_aprobada', ev_id, 'Aprobó evidencia ' || ev_id || ' de ' || e.actividad_id);
  return json_build_object('ok', true);
end $$;

create or replace function marcar_notificaciones_leidas(p_id bigint default null)
returns json language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'error', 'Debes iniciar sesión');
  end if;
  if p_id is null then
    insert into notificacion_lecturas (notificacion_id, usuario_id)
      select id, auth.uid() from notificaciones
      on conflict (notificacion_id, usuario_id) do nothing;
  else
    insert into notificacion_lecturas (notificacion_id, usuario_id)
      select id, auth.uid() from notificaciones where id = p_id
      on conflict (notificacion_id, usuario_id) do nothing;
  end if;
  return json_build_object('ok', true);
end $$;

-- ═══════════════════════ Permisos de esquema ═══════════════════════════════
-- Supabase suele concederlos por defecto; los declaramos explícitamente para
-- que el esquema sea reproducible en cualquier proyecto. El acceso real sigue
-- estando gobernado por las políticas RLS de más abajo.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema public from public, anon;
revoke execute on function handle_new_user() from authenticated;
revoke execute on function log_hist(text, text, text) from authenticated;
revoke execute on function notificar(text, text, text, text) from authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
alter default privileges in schema public revoke execute on functions from public;

-- ══════════════════════ Seguridad por fila (RLS) ═══════════════════════════
alter table perfiles             enable row level security;
alter table clientes             enable row level security;
alter table proyectos            enable row level security;
alter table sitios               enable row level security;
alter table tecnicos             enable row level security;
alter table tipos_actividad      enable row level security;
alter table actividades          enable row level security;
alter table actividad_tecnicos   enable row level security;
alter table checklist_items      enable row level security;
alter table incidencias          enable row level security;
alter table materiales           enable row level security;
alter table movimientos_material enable row level security;
alter table evidencias           enable row level security;
alter table historial            enable row level security;
alter table notificaciones       enable row level security;
alter table notificacion_lecturas enable row level security;

-- Limpieza para poder re-ejecutar
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public'
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

-- Perfiles: cada quien ve el suyo; los gestores ven todos
create policy perfiles_sel on perfiles for select to authenticated
  using (id = auth.uid() or es_gestor());
create policy perfiles_upd on perfiles for update to authenticated
  using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

-- Catálogos: lectura para todo usuario autenticado; escritura solo gestores
create policy clientes_sel on clientes for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy clientes_wr  on clientes for all    to authenticated using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

create policy proyectos_sel on proyectos for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy proyectos_wr  on proyectos for all    to authenticated using (es_gestor()) with check (es_gestor());

create policy sitios_sel on sitios for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy sitios_wr  on sitios for all    to authenticated using (es_gestor()) with check (es_gestor());

create policy tecnicos_sel on tecnicos for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy tecnicos_wr  on tecnicos for all    to authenticated using (es_gestor()) with check (es_gestor());

create policy tipos_sel on tipos_actividad for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy tipos_wr  on tipos_actividad for all    to authenticated using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

create policy materiales_sel on materiales for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy materiales_wr  on materiales for all    to authenticated using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

create policy movimientos_sel on movimientos_material for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);

-- Actividades: el técnico solo ve las suyas; los gestores, todas.
create policy actividades_sel on actividades for select to authenticated
  using (es_gestor() or es_mi_actividad(id));
create policy actividades_ins on actividades for insert to authenticated with check (es_gestor());
create policy actividades_upd on actividades for update to authenticated
  using (es_gestor()) with check (es_gestor());
create policy actividades_del on actividades for delete to authenticated using (mi_rol() = 'admin');

create policy at_sel on actividad_tecnicos for select to authenticated
  using (es_gestor() or tecnico_id = mi_tecnico_id());
create policy at_wr  on actividad_tecnicos for all    to authenticated using (es_gestor()) with check (es_gestor());

create policy chk_sel on checklist_items for select to authenticated
  using (es_gestor() or es_mi_actividad(actividad_id));
create policy chk_wr  on checklist_items for all to authenticated
  using (es_gestor()) with check (es_gestor());

create policy inc_sel on incidencias for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy inc_ins on incidencias for insert to authenticated
  with check (es_gestor() or mi_tecnico_id() is not null);
create policy inc_upd on incidencias for update to authenticated using (es_gestor()) with check (es_gestor());

create policy ev_sel on evidencias for select to authenticated
  using (es_gestor() or es_mi_actividad(actividad_id));
create policy ev_upd on evidencias for update to authenticated using (es_gestor()) with check (es_gestor());

create policy hist_sel on historial for select to authenticated using (es_gestor());
create policy notif_sel on notificaciones for select to authenticated
  using (es_gestor() or mi_tecnico_id() is not null);
create policy notif_lecturas_sel on notificacion_lecturas for select to authenticated
  using (usuario_id = auth.uid());
create policy notif_lecturas_ins on notificacion_lecturas for insert to authenticated
  with check (usuario_id = auth.uid());

-- ═════════════════════ Realtime (actualización en vivo) ════════════════════
do $$
begin
  alter publication supabase_realtime add table actividades;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table incidencias;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table notificaciones;
exception when duplicate_object then null; end $$;

-- Listo. Ejecuta a continuación 02-seed.sql para cargar los datos demo.
