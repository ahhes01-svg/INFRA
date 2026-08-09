/* ============================================================================
 * api.js — Cliente de datos · NettOps Perú
 *
 * Sustituye la capa de datos en memoria por Supabase manteniendo EXACTAMENTE
 * la misma superficie que usan los módulos:
 *   window.DB        · caché en memoria (se hidrata desde Postgres)
 *   window.CALC      · cálculos derivados (intactos, son funciones puras)
 *   window.ACCIONES  · mutaciones (ahora llaman a funciones del servidor)
 *
 * Por eso ningún módulo necesitó reescribirse: leen y escriben igual que antes.
 *
 * Las reglas críticas (validación de cierre, aprobación, descuento de stock,
 * cruces de horario) viven en Postgres, no aquí: el navegador no puede
 * saltárselas aunque alguien manipule el JavaScript.
 *
 * Si no hay conexión o no está configurado, arranca en MODO DEMO con los datos
 * de js/data.js y avisa en la interfaz.
 * ==========================================================================*/

window.API = (function () {
  const cfg = window.CONFIG || {};
  let sb = null;                 // cliente Supabase
  let modoDemo = true;
  let perfil = null;             // { id, nombre, rol, tecnico_id, cargo }

  /* ── snake_case (Postgres) → camelCase (interfaz) ──────────────────────── */
  const mapActividad = r => ({
    id: r.id,
    tipoId: r.tipo_id,
    sitioId: r.sitio_id,
    proyectoId: r.proyecto_id,
    fecha: r.fecha,
    hIni: (r.h_ini || '').slice(0, 5),
    hFin: (r.h_fin || '').slice(0, 5),
    inicioReal: r.inicio_real ? r.inicio_real.slice(0, 5) : null,
    finReal: r.fin_real ? r.fin_real.slice(0, 5) : null,
    estado: r.estado,
    obs: r.obs || '',
    tecnicos: (r.actividad_tecnicos || []).map(t => t.tecnico_id),
    checklist: (r.checklist_items || [])
      .sort((a, b) => a.orden - b.orden)
      .map(i => ({ id: i.id, t: i.texto, ok: i.ok })),
  });

  const mapSitio = r => ({
    id: r.id, codigo: r.codigo, nombre: r.nombre, direccion: r.direccion,
    distrito: r.distrito, provincia: r.provincia, lat: r.lat, lng: r.lng,
    tipo: r.tipo, altura: r.altura, tecnologias: r.tecnologias || [],
    energia: r.energia, proyectoId: r.proyecto_id, estado: r.estado,
  });

  const mapProyecto = r => ({
    id: r.id, codigo: r.codigo, clienteId: r.cliente_id, nombre: r.nombre,
    descripcion: r.descripcion, estado: r.estado, inicio: r.inicio, fin: r.fin,
    supervisor: r.supervisor, presupuesto: Number(r.presupuesto || 0),
  });

  const mapCliente = r => ({
    id: r.id, nombre: r.nombre, razon: r.razon, ruc: r.ruc,
    contacto: r.contacto, cargoContacto: r.cargo_contacto, telefono: r.telefono,
  });

  const mapTecnico = r => ({
    id: r.id, nombre: r.nombre, dni: r.dni, rol: r.rol, especialidad: r.especialidad,
    telefono: r.telefono, foto: r.foto, estado: r.estado, zona: r.zona,
    certificaciones: r.certificaciones || [],
  });

  const mapTipo = r => ({ id: r.id, nombre: r.nombre, categoria: r.categoria, durHoras: Number(r.dur_horas || 0) });

  const mapIncidencia = r => ({
    id: r.id, titulo: r.titulo, descripcion: r.descripcion, severidad: r.severidad,
    estado: r.estado, sitioId: r.sitio_id, actividadId: r.actividad_id,
    reportadoPor: r.reportado_por, asignadoA: r.asignado_a,
    fecha: r.fecha, hora: (r.hora || '').slice(0, 5),
    fechaLimite: r.fecha_limite, fechaResolucion: r.fecha_resolucion,
  });

  const mapMaterial = r => ({
    id: r.id, nombre: r.nombre, categoria: r.categoria, unidad: r.unidad,
    stock: r.stock, minimo: r.minimo, almacen: r.almacen, proyectoId: r.proyecto_id || '',
  });

  const mapMovimiento = r => ({
    id: 'mv-' + r.id, materialId: r.material_id, tipo: r.tipo, cantidad: r.cantidad,
    actividadId: r.actividad_id, sitioId: r.sitio_id, usuario: r.usuario,
    fecha: r.fecha, hora: (r.hora || '').slice(0, 5),
  });

  const mapEvidencia = r => ({
    id: r.id, actividadId: r.actividad_id, tipo: r.tipo, titulo: r.titulo,
    archivo: urlEvidencia(r.archivo), rutaArchivo: r.archivo,
    fecha: r.fecha, hora: (r.hora || '').slice(0, 5),
    subidoPor: r.subido_por, estado: r.estado, lat: r.lat, lng: r.lng,
  });

  const mapHistorial = r => ({
    id: 'h-' + r.id, fecha: r.fecha, hora: (r.hora || '').slice(0, 5),
    usuario: r.usuario, accion: r.accion, entidad: r.entidad, detalle: r.detalle,
  });

  const mapNotificacion = r => ({
    id: r.id, tipo: r.tipo, titulo: r.titulo, detalle: r.detalle,
    link: r.link || '#', fecha: r.fecha, hora: (r.hora || '').slice(0, 5), leida: r.leida,
  });

  // Las evidencias demo son URLs completas; las reales son rutas del bucket
  function urlEvidencia(ruta) {
    if (!ruta) return '';
    if (/^https?:\/\//.test(ruta)) return ruta;
    if (!sb) return ruta;
    return sb.storage.from(cfg.bucketEvidencias || 'evidencias').getPublicUrl(ruta).data.publicUrl;
  }

  /* ── Arranque (idempotente: varias llamadas comparten una sola conexión) ── */
  let promesaInicio = null;
  function iniciar() {
    if (promesaInicio) return promesaInicio;
    promesaInicio = (async () => {
      if (cfg.forzarDemo || !cfg.url || !window.supabase) {
        modoDemo = true;
        return { modoDemo: true, sesion: null };
      }
      sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      modoDemo = false;
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session) await cargarPerfil();
        return { modoDemo: false, sesion: session };
      } catch (e) {
        // Sin conexión con el servidor: seguimos en demo para no dejar la app muerta
        console.warn('Sin conexión con el backend, se usa el modo demo:', e.message);
        modoDemo = true;
        return { modoDemo: true, sesion: null, error: e.message };
      }
    })();
    return promesaInicio;
  }

  async function cargarPerfil() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { perfil = null; return null; }
    const { data } = await sb.from('perfiles').select('*').eq('id', user.id).maybeSingle();
    perfil = data || { id: user.id, nombre: user.email, rol: 'tecnico', tecnico_id: null };
    return perfil;
  }

  /* ── Autenticación ─────────────────────────────────────────────────────── */
  // Los errores de Supabase llegan en inglés; los traducimos y, cuando el
  // problema es de configuración del proyecto, decimos dónde se arregla.
  function traducirError(error) {
    const codigo = error.code || error.error_code || '';
    const msg = error.message || '';
    if (codigo === 'email_provider_disabled' || /Email logins are disabled/i.test(msg)) {
      return 'El acceso por correo está desactivado en el servidor. ' +
             'Actívalo en Supabase → Authentication → Sign In / Providers → Email → "Enable Email provider".';
    }
    if (codigo === 'invalid_credentials' || /Invalid login/i.test(msg)) return 'Usuario o contraseña incorrectos';
    if (codigo === 'email_not_confirmed' || /Email not confirmed/i.test(msg)) {
      return 'La cuenta aún no está confirmada. Pide al administrador que la active.';
    }
    if (codigo === 'over_request_rate_limit' || /rate limit/i.test(msg)) {
      return 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.';
    }
    if (codigo === 'user_banned') return 'Esta cuenta está suspendida.';
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'Sin conexión con el servidor. Revisa tu red.';
    return msg || 'No se pudo iniciar sesión';
  }

  async function entrar(email, password) {
    if (modoDemo) return { ok: true, demo: true };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: traducirError(error) };
    await cargarPerfil();
    return { ok: true };
  }

  async function salir() {
    if (sb) await sb.auth.signOut();
    perfil = null;
  }

  function sesionActiva() { return !!perfil; }
  function miPerfil() { return perfil; }
  function estaEnDemo() { return modoDemo; }

  /* ── Hidratación de la caché en memoria ────────────────────────────────── */
  async function cargarTodo() {
    if (modoDemo) return { ok: true, demo: true };
    const DB = window.DB;
    try {
      const [
        clientes, proyectos, sitios, tecnicos, tipos, actividades,
        incidencias, materiales, movimientos, evidencias, historial, notificaciones,
      ] = await Promise.all([
        sb.from('clientes').select('*').order('id'),
        sb.from('proyectos').select('*').order('codigo'),
        sb.from('sitios').select('*').order('codigo'),
        sb.from('tecnicos').select('*').order('nombre'),
        sb.from('tipos_actividad').select('*').order('id'),
        sb.from('actividades').select('*, actividad_tecnicos(tecnico_id), checklist_items(id,orden,texto,ok)').order('fecha', { ascending: false }),
        sb.from('incidencias').select('*').order('fecha', { ascending: false }),
        sb.from('materiales').select('*').order('id'),
        sb.from('movimientos_material').select('*').order('id', { ascending: false }),
        sb.from('evidencias').select('*').order('fecha', { ascending: false }),
        sb.from('historial').select('*').order('id', { ascending: false }).limit(200),
        sb.from('notificaciones').select('*').order('id', { ascending: false }).limit(50),
      ]);

      const err = [clientes, proyectos, sitios, tecnicos, tipos, actividades,
        incidencias, materiales, movimientos, evidencias, notificaciones].find(r => r.error);
      if (err) throw err.error;

      DB.clientes        = (clientes.data     || []).map(mapCliente);
      DB.proyectos       = (proyectos.data    || []).map(mapProyecto);
      DB.sitios          = (sitios.data       || []).map(mapSitio);
      DB.tecnicos        = (tecnicos.data     || []).map(mapTecnico);
      DB.tiposActividad  = (tipos.data        || []).map(mapTipo);
      DB.actividades     = (actividades.data  || []).map(mapActividad);
      DB.incidencias     = (incidencias.data  || []).map(mapIncidencia);
      DB.materiales      = (materiales.data   || []).map(mapMaterial);
      DB.movimientos     = (movimientos.data  || []).map(mapMovimiento);
      DB.evidencias      = (evidencias.data   || []).map(mapEvidencia);
      DB.historial       = (historial.data    || []).map(mapHistorial);
      DB.notificaciones  = (notificaciones.data || []).map(mapNotificacion);

      if (perfil) {
        DB.sesion = {
          usuario: perfil.nombre,
          cargo: perfil.cargo || (perfil.rol === 'admin' ? 'Administrador' : perfil.rol === 'supervisor' ? 'Supervisor' : 'Técnico de campo'),
          tecnicoDemoId: perfil.tecnico_id || DB.sesion.tecnicoDemoId,
          rol: perfil.rol,
        };
      }
      window.dispatchEvent(new CustomEvent('app:data'));
      return { ok: true };
    } catch (e) {
      console.error('Error al cargar datos:', e);
      return { ok: false, error: e.message || 'No se pudo conectar con el servidor' };
    }
  }

  /* Refresca solo lo que cambia con frecuencia, tras una mutación */
  async function refrescar() {
    if (modoDemo) { window.dispatchEvent(new CustomEvent('app:data')); return; }
    const DB = window.DB;
    const [acts, incs, mats, movs, evs, hist, notifs, sits] = await Promise.all([
      sb.from('actividades').select('*, actividad_tecnicos(tecnico_id), checklist_items(id,orden,texto,ok)').order('fecha', { ascending: false }),
      sb.from('incidencias').select('*').order('fecha', { ascending: false }),
      sb.from('materiales').select('*').order('id'),
      sb.from('movimientos_material').select('*').order('id', { ascending: false }),
      sb.from('evidencias').select('*').order('fecha', { ascending: false }),
      sb.from('historial').select('*').order('id', { ascending: false }).limit(200),
      sb.from('notificaciones').select('*').order('id', { ascending: false }).limit(50),
      sb.from('sitios').select('*').order('codigo'),
    ]);
    if (acts.data)   DB.actividades    = acts.data.map(mapActividad);
    if (incs.data)   DB.incidencias    = incs.data.map(mapIncidencia);
    if (mats.data)   DB.materiales     = mats.data.map(mapMaterial);
    if (movs.data)   DB.movimientos    = movs.data.map(mapMovimiento);
    if (evs.data)    DB.evidencias     = evs.data.map(mapEvidencia);
    if (hist.data)   DB.historial      = hist.data.map(mapHistorial);
    if (notifs.data) DB.notificaciones = notifs.data.map(mapNotificacion);
    if (sits.data)   DB.sitios         = sits.data.map(mapSitio);
    window.dispatchEvent(new CustomEvent('app:data'));
  }

  /* ── Llamada a función de negocio del servidor ─────────────────────────── */
  async function rpc(nombre, args) {
    const { data, error } = await sb.rpc(nombre, args);
    if (error) return { ok: false, error: error.message };
    return data;
  }

  /* ── Subida real de evidencia fotográfica ──────────────────────────────── */
  // Comprime en el navegador antes de subir: en campo la señal es cara.
  async function comprimir(file, maxLado = 1600, calidad = 0.72) {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = URL.createObjectURL(file);
    });
    const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * escala);
    cv.height = Math.round(img.height * escala);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(img.src);
    return new Promise(res => cv.toBlob(res, 'image/jpeg', calidad));
  }

  async function posicion() {
    if (!navigator.geolocation) return {};
    return new Promise(res => {
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res({}),
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  async function subirEvidencia(actividadId, tipo, titulo, file) {
    if (modoDemo) return { ok: false, error: 'Modo demo: sin subida real' };
    try {
      const blob = file ? await comprimir(file) : null;
      const gps = await posicion();
      const ruta = `${actividadId}/${Date.now()}-${tipo}.jpg`;

      if (blob) {
        const { error } = await sb.storage
          .from(cfg.bucketEvidencias || 'evidencias')
          .upload(ruta, blob, { contentType: 'image/jpeg', upsert: false });
        if (error) return { ok: false, error: 'No se pudo subir la foto: ' + error.message };
      }

      const r = await rpc('registrar_evidencia', {
        p_actividad: actividadId, p_tipo: tipo, p_titulo: titulo,
        p_archivo: blob ? ruta : null,
        p_lat: gps.lat ?? null, p_lng: gps.lng ?? null,
      });
      if (r && r.ok) await refrescar();
      return r;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /* ── Alta de cuentas de acceso ─────────────────────────────────────────
   * Crear una cuenta con signUp() iniciaría sesión como el usuario nuevo y
   * echaría al administrador. Por eso usamos un cliente aparte que no guarda
   * sesión: la cuenta se crea y el admin sigue dentro.
   *
   * El rol NO viaja aquí: toda cuenta nace como técnico sin permisos, y solo
   * después un gestor autenticado la eleva con vincular_cuenta_tecnico().
   * ------------------------------------------------------------------------*/
  async function crearCuenta(email, password, nombre) {
    if (modoDemo) return { ok: false, error: 'Modo demo: no se pueden crear cuentas reales' };
    const aparte = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await aparte.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nombre } },
    });
    if (error) return { ok: false, error: traducirError(error) };
    // Sin confirmación de correo, la cuenta queda lista de inmediato
    const requiereConfirmacion = !data.session && !!data.user && !data.user.confirmed_at;
    return { ok: true, id: data.user ? data.user.id : null, requiereConfirmacion };
  }

  async function cuentasDeTecnicos() {
    if (modoDemo) return [];
    const { data, error } = await sb.rpc('tecnicos_con_cuenta');
    return error ? [] : (data || []);
  }

  return {
    iniciar, entrar, salir, sesionActiva, miPerfil, estaEnDemo,
    cargarTodo, refrescar, rpc, subirEvidencia, urlEvidencia,
    crearCuenta, cuentasDeTecnicos,
    get cliente() { return sb; },
  };
})();

/* ============================================================================
 * Sustitución de ACCIONES: mismas firmas, ahora contra el servidor.
 * Los módulos siguen llamando ACCIONES.completarActividad(...) sin cambios.
 * ==========================================================================*/
(function reemplazarAcciones() {
  // Las acciones en memoria llegan con js/demo/datos.js, que solo se descarga
  // si no hay backend. Por eso se consultan cuando se usan, no al cargar.
  const demoAcciones = new Proxy({}, {
    get: (_, metodo) => (...args) => {
      const impl = window.__ACCIONES_DEMO;
      if (!impl || typeof impl[metodo] !== 'function') {
        console.warn('Acción de demostración no disponible:', metodo);
        return { ok: false, error: 'Acción no disponible' };
      }
      return impl[metodo](...args);
    },
  });

  function aviso(tipo, titulo, detalle) {
    if (window.Alpine && Alpine.store('toasts')) Alpine.store('toasts').push(tipo, titulo, detalle);
  }

  const enDemo = () => window.API.estaEnDemo();

  window.ACCIONES = {
    async iniciarActividad(id, usuario) {
      if (enDemo()) return demoAcciones.iniciarActividad(id, usuario);
      const r = await API.rpc('iniciar_actividad', { act_id: id });
      if (r && !r.ok) { aviso('error', 'No se pudo iniciar', r.error); return r; }
      await API.refrescar();
      return r;
    },

    async toggleChecklist(id, idx, usuario) {
      if (enDemo()) return demoAcciones.toggleChecklist(id, idx, usuario);
      const act = CALC.actividad(id);
      const item = act && act.checklist[idx];
      if (!item) return;
      // Optimista: la casilla responde al instante y luego confirma el servidor
      item.ok = !item.ok;
      window.dispatchEvent(new CustomEvent('app:data'));
      const r = await API.rpc('marcar_checklist', { item_id: item.id, valor: item.ok });
      if (r && !r.ok) { item.ok = !item.ok; aviso('error', 'No se pudo guardar', r.error); }
      await API.refrescar();
      return r;
    },

    async finalizarActividad(id, usuario) {
      if (enDemo()) return demoAcciones.finalizarActividad(id, usuario);
      const r = await API.rpc('finalizar_actividad', { act_id: id });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, faltantes: ['error de conexión'] };
    },

    async aprobarActividad(id, usuario) {
      if (enDemo()) return demoAcciones.aprobarActividad(id, usuario);
      const r = await API.rpc('aprobar_actividad', { act_id: id });
      if (r && !r.ok) { aviso('error', 'No se pudo aprobar', r.error); return r; }
      await API.refrescar();
      return r;
    },

    async rechazarActividad(id, motivo, usuario) {
      if (enDemo()) return demoAcciones.rechazarActividad(id, motivo, usuario);
      const r = await API.rpc('rechazar_actividad', { act_id: id, motivo });
      if (r && !r.ok) { aviso('error', 'No se pudo rechazar', r.error); return r; }
      await API.refrescar();
      return r;
    },

    // Atajo del administrador: cierra y aprueba en un paso
    async completarActividad(id, usuario) {
      if (enDemo()) return demoAcciones.completarActividad(id, usuario);
      let r = await API.rpc('finalizar_actividad', { act_id: id });
      if (r && r.ok) r = await API.rpc('aprobar_actividad', { act_id: id });
      else if (r && !r.ok) aviso('error', 'No se puede cerrar todavía', 'Falta: ' + (r.faltantes || []).join(' · '));
      await API.refrescar();
      return r;
    },

    async cancelarActividad(id, motivo, usuario) {
      if (enDemo()) return demoAcciones.cancelarActividad(id, motivo, usuario);
      const r = await API.rpc('cancelar_actividad', { act_id: id, motivo });
      if (r && !r.ok) { aviso('error', 'No se pudo cancelar', r.error); return r; }
      await API.refrescar();
      return r;
    },

    async crearActividad(datos, usuario) {
      if (enDemo()) return demoAcciones.crearActividad(datos, usuario);
      const r = await API.rpc('crear_actividad', {
        p_tipo: datos.tipoId, p_sitio: datos.sitioId, p_tecnicos: datos.tecnicos,
        p_fecha: datos.fecha, p_ini: datos.hIni, p_fin: datos.hFin, p_obs: datos.obs || '',
      });
      if (r && r.ok) { await API.refrescar(); return r; }
      // Traducimos el conflicto a la forma que ya esperan los módulos
      if (r && r.conflicto) {
        return {
          ok: false,
          conflicto: { id: r.conflicto.actividad, hIni: (r.conflicto.h_ini || '').slice(0, 5), hFin: (r.conflicto.h_fin || '').slice(0, 5) },
          tecnico: { nombre: r.conflicto.tecnico },
        };
      }
      return r || { ok: false };
    },

    async reprogramarActividad(id, fecha, hIni, hFin, usuario) {
      if (enDemo()) return demoAcciones.reprogramarActividad(id, fecha, hIni, hFin, usuario);
      const r = await API.rpc('reprogramar_actividad', { act_id: id, p_fecha: fecha, p_ini: hIni, p_fin: hFin });
      if (r && r.ok) { await API.refrescar(); return r; }
      if (r && r.conflicto) {
        return {
          ok: false,
          conflicto: { id: r.conflicto.actividad, hIni: (r.conflicto.h_ini || '').slice(0, 5), hFin: (r.conflicto.h_fin || '').slice(0, 5) },
          tecnico: { nombre: r.conflicto.tecnico },
        };
      }
      return r || { ok: false };
    },

    async crearIncidencia(datos, usuario, reportadoPorId) {
      if (enDemo()) return demoAcciones.crearIncidencia(datos, usuario, reportadoPorId);
      const r = await API.rpc('crear_incidencia', {
        p_titulo: datos.titulo, p_descripcion: datos.descripcion, p_severidad: datos.severidad,
        p_sitio: datos.sitioId, p_actividad: datos.actividadId || null, p_limite: datos.fechaLimite,
      });
      if (r && !r.ok) { aviso('error', 'No se pudo registrar', r.error); return null; }
      await API.refrescar();
      return r ? r.id : null;
    },

    async atenderIncidencia(id, usuario) {
      if (enDemo()) return demoAcciones.atenderIncidencia(id, usuario);
      const r = await API.rpc('atender_incidencia', { inc_id: id });
      await API.refrescar();
      return r;
    },

    async resolverIncidencia(id, usuario) {
      if (enDemo()) return demoAcciones.resolverIncidencia(id, usuario);
      const r = await API.rpc('resolver_incidencia', { inc_id: id });
      if (r && !r.ok) { aviso('error', 'No se pudo resolver', r.error); return r; }
      await API.refrescar();
      return r;
    },

    // Sin archivo: registra la evidencia igual (el prototipo permite simularla).
    // Con archivo (File): comprime, sube al bucket y adjunta GPS y hora.
    async subirEvidencia(actividadId, tipo, titulo, usuario, tecnicoId, file) {
      if (enDemo()) return demoAcciones.subirEvidencia(actividadId, tipo, titulo, usuario, tecnicoId);
      const r = await API.subirEvidencia(actividadId, tipo, titulo, file || null);
      if (r && !r.ok) { aviso('error', 'No se pudo subir', r.error); return null; }
      return r ? r.id : null;
    },

    async aprobarEvidencia(id, usuario) {
      if (enDemo()) return demoAcciones.aprobarEvidencia(id, usuario);
      const r = await API.rpc('aprobar_evidencia', { ev_id: id });
      if (r && !r.ok) { aviso('error', 'No se pudo aprobar', r.error); return r; }
      await API.refrescar();
      return r;
    },

    async despacharMaterial(materialId, cantidad, actividadId, usuario) {
      if (enDemo()) return demoAcciones.despacharMaterial(materialId, cantidad, actividadId, usuario);
      const r = await API.rpc('despachar_material', { p_material: materialId, p_cantidad: cantidad, p_actividad: actividadId });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    async ingresarMaterial(materialId, cantidad, usuario) {
      if (enDemo()) return demoAcciones.ingresarMaterial(materialId, cantidad, usuario);
      const r = await API.rpc('ingresar_material', { p_material: materialId, p_cantidad: cantidad });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false };
    },

    /* ── Gestión de catálogos (solo admin/supervisor) ── */
    async guardarTecnico(t) {
      if (enDemo()) {
        const db = window.DB;
        if (t.id) { Object.assign(db.tecnicos.find(x => x.id === t.id) || {}, t); }
        else {
          const n = db.tecnicos.length + 1;
          db.tecnicos.push({ ...t, id: 'tec-' + String(n).padStart(2, '0'), certificaciones: t.certificaciones || [] });
        }
        window.dispatchEvent(new CustomEvent('app:data'));
        return { ok: true, creado: !t.id };
      }
      const r = await API.rpc('guardar_tecnico', {
        p_id: t.id || null, p_nombre: t.nombre, p_dni: t.dni || '', p_rol: t.rol,
        p_especialidad: t.especialidad, p_telefono: t.telefono, p_zona: t.zona,
        p_estado: t.estado || 'disponible', p_certificaciones: t.certificaciones || [],
      });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    async eliminarTecnico(id) {
      if (enDemo()) {
        window.DB.tecnicos = window.DB.tecnicos.filter(t => t.id !== id);
        window.dispatchEvent(new CustomEvent('app:data'));
        return { ok: true, modo: 'eliminado' };
      }
      const r = await API.rpc('eliminar_tecnico', { p_id: id });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    // Crea la cuenta de acceso y la vincula con la ficha del técnico
    async crearAcceso(email, password, tecnicoId, rol = 'tecnico', nombre = '') {
      if (enDemo()) return { ok: false, error: 'Modo demo: no se pueden crear cuentas reales' };
      const c = await API.crearCuenta(email, password, nombre);
      if (!c.ok) return c;
      const v = await API.rpc('vincular_cuenta_tecnico', {
        p_email: email, p_tecnico_id: tecnicoId || null, p_rol: rol,
      });
      if (v && !v.ok) return { ok: false, error: v.error, cuentaCreada: true };
      await API.refrescar();
      return { ok: true, requiereConfirmacion: c.requiereConfirmacion };
    },

    async revocarAcceso(tecnicoId) {
      if (enDemo()) return { ok: false, error: 'Modo demo' };
      const r = await API.rpc('desvincular_cuenta', { p_tecnico_id: tecnicoId });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false };
    },

    async guardarSitio(s) {
      if (enDemo()) {
        const db = window.DB;
        if (s.id) Object.assign(db.sitios.find(x => x.id === s.id) || {}, s);
        else db.sitios.push({ ...s, id: 'st-' + (db.sitios.length + 1) });
        window.dispatchEvent(new CustomEvent('app:data'));
        return { ok: true, creado: !s.id };
      }
      const r = await API.rpc('guardar_sitio', {
        p_id: s.id || null, p_codigo: s.codigo, p_nombre: s.nombre, p_direccion: s.direccion,
        p_distrito: s.distrito, p_provincia: s.provincia, p_lat: Number(s.lat), p_lng: Number(s.lng),
        p_tipo: s.tipo, p_altura: Number(s.altura) || 0, p_tecnologias: s.tecnologias || [],
        p_energia: s.energia, p_proyecto_id: s.proyectoId || null, p_estado: s.estado || 'planificado',
      });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    async eliminarSitio(id) {
      if (enDemo()) {
        window.DB.sitios = window.DB.sitios.filter(s => s.id !== id);
        window.dispatchEvent(new CustomEvent('app:data'));
        return { ok: true };
      }
      const r = await API.rpc('eliminar_sitio', { p_id: id });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    async guardarMaterial(m) {
      if (enDemo()) {
        const db = window.DB;
        if (m.id) Object.assign(db.materiales.find(x => x.id === m.id) || {}, m);
        else db.materiales.push({ ...m, id: 'MAT-' + String(db.materiales.length + 1).padStart(3, '0') });
        window.dispatchEvent(new CustomEvent('app:data'));
        return { ok: true, creado: !m.id };
      }
      const r = await API.rpc('guardar_material', {
        p_id: m.id || null, p_nombre: m.nombre, p_categoria: m.categoria, p_unidad: m.unidad,
        p_stock: Number(m.stock) || 0, p_minimo: Number(m.minimo) || 0,
        p_almacen: m.almacen, p_proyecto_id: m.proyectoId || null,
      });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    async eliminarMaterial(id) {
      if (enDemo()) {
        window.DB.materiales = window.DB.materiales.filter(m => m.id !== id);
        window.dispatchEvent(new CustomEvent('app:data'));
        return { ok: true };
      }
      const r = await API.rpc('eliminar_material', { p_id: id });
      if (r && r.ok) await API.refrescar();
      return r || { ok: false, error: 'error de conexión' };
    },

    async marcarLeida(id) {
      if (enDemo()) return demoAcciones.marcarLeida(id);
      const n = window.DB.notificaciones.find(x => x.id === id);
      if (n) n.leida = true;                    // respuesta inmediata
      window.dispatchEvent(new CustomEvent('app:data'));
      await API.rpc('marcar_notificaciones_leidas', { p_id: id });
    },

    async marcarTodasLeidas() {
      if (enDemo()) return demoAcciones.marcarTodasLeidas();
      window.DB.notificaciones.forEach(n => n.leida = true);
      window.dispatchEvent(new CustomEvent('app:data'));
      await API.rpc('marcar_notificaciones_leidas', { p_id: null });
    },
  };
})();
