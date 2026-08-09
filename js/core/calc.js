/* ============================================================================
 * calc.js — Estructura de datos y cálculos derivados · NettOps Perú
 *
 * Se carga siempre: define el almacén en memoria (vacío) y todos los cálculos
 * que la interfaz necesita. Los datos reales llegan de Supabase (js/api.js) o,
 * en modo demostración, de js/demo/datos.js, que se descarga aparte solo si
 * hace falta. Así una sesión conectada no arrastra 51 KB de datos de ejemplo.
 * ==========================================================================*/

window.HOY = '2026-08-08';   // fecha de referencia del conjunto de demostración

window.DB = {
  sesion: { usuario: 'Invitado', iniciales: '—', cargo: '', tecnicoDemoId: 'tec-03' },
  clientes: [], proyectos: [], sitios: [], tecnicos: [], tiposActividad: [],
  actividades: [], incidencias: [], materiales: [], movimientos: [],
  evidencias: [], historial: [], notificaciones: [],
};

/* ============================================================================
 * Acceso reactivo: cuando Alpine está presente, las lecturas y mutaciones
 * pasan por Alpine.store('db') para que toda la interfaz reaccione.
 * ==========================================================================*/
function D() {
  return (window.Alpine && Alpine.store('db')) || window.DB;
}

function ahora() {
  const d = new Date();
  return { fecha: window.HOY, hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
}

function tocar() { window.dispatchEvent(new CustomEvent('app:data')); }

/* ── Cálculos derivados (nunca cifras escritas a mano) ────────────────────── */
window.CALC = {
  tipo(id) { return D().tiposActividad.find(t => t.id === id) || {}; },
  sitio(id) { return D().sitios.find(s => s.id === id) || {}; },
  proyecto(id) { return D().proyectos.find(p => p.id === id) || {}; },
  cliente(id) { return D().clientes.find(c => c.id === id) || {}; },
  tecnico(id) { return D().tecnicos.find(t => t.id === id) || {}; },
  actividad(id) { return D().actividades.find(a => a.id === id) || null; },
  incidencia(id) { return D().incidencias.find(i => i.id === id) || null; },

  avanceActividad(a) {
    if (!a) return 0;
    if (a.estado === 'completada' || a.estado === 'en_revision') return 100;
    if (a.estado === 'cancelada' || a.estado === 'pendiente') return 0;
    if (a.checklist && a.checklist.length) {
      return Math.round(a.checklist.filter(i => i.ok).length / a.checklist.length * 100);
    }
    return a.estado === 'en_ejecucion' ? 50 : 0;
  },

  /* Validación de cierre: checklist completo + foto de antes y de después */
  validarCierre(a) {
    const faltantes = [];
    if (a.checklist && a.checklist.length) {
      const sin = a.checklist.filter(i => !i.ok).length;
      if (sin) faltantes.push(`${sin} ítem(s) del checklist sin marcar`);
    }
    const evs = this.evidenciasDeActividad(a.id);
    if (!evs.some(e => e.tipo === 'foto_antes')) faltantes.push('foto de ANTES del trabajo');
    if (!evs.some(e => ['foto_despues', 'foto_avance'].includes(e.tipo))) faltantes.push('foto de DESPUÉS del trabajo');
    return { ok: !faltantes.length, faltantes };
  },
  actividadesDeSitio(sid) { return D().actividades.filter(a => a.sitioId === sid); },
  avanceSitio(sid) {
    const acts = this.actividadesDeSitio(sid).filter(a => a.estado !== 'cancelada');
    if (!acts.length) return null;
    return Math.round(acts.reduce((s, a) => s + this.avanceActividad(a), 0) / acts.length);
  },
  actividadesDeProyecto(pid) { return D().actividades.filter(a => a.proyectoId === pid); },
  avanceProyecto(pid) {
    const acts = this.actividadesDeProyecto(pid).filter(a => a.estado !== 'cancelada');
    if (!acts.length) return 0;
    return Math.round(acts.reduce((s, a) => s + this.avanceActividad(a), 0) / acts.length);
  },
  sitiosDeProyecto(pid) { return D().sitios.filter(s => s.proyectoId === pid); },
  tecnicosDeProyecto(pid) {
    const ids = new Set(this.actividadesDeProyecto(pid).flatMap(a => a.tecnicos));
    return D().tecnicos.filter(t => ids.has(t.id));
  },
  incidenciasDeProyecto(pid) {
    const sitios = new Set(this.sitiosDeProyecto(pid).map(s => s.id));
    return D().incidencias.filter(i => sitios.has(i.sitioId));
  },
  evidenciasDeActividad(aid) { return D().evidencias.filter(e => e.actividadId === aid); },
  evidenciasDeSitio(sid) {
    const acts = new Set(this.actividadesDeSitio(sid).map(a => a.id));
    return D().evidencias.filter(e => acts.has(e.actividadId));
  },
  actividadesHoy() { return D().actividades.filter(a => a.fecha === window.HOY); },
  actividadesDeTecnico(tid, fecha = null) {
    return D().actividades.filter(a => a.tecnicos.includes(tid) && (!fecha || a.fecha === fecha));
  },
  incidenciaVencida(i) {
    return (i.estado === 'abierta' || i.estado === 'en_atencion') && i.fechaLimite < window.HOY;
  },
  diasVencida(i) {
    const ms = new Date(window.HOY) - new Date(i.fechaLimite);
    return Math.max(0, Math.round(ms / 86400000));
  },
  estadoMaterial(m) {
    if (m.stock === 0) return 'sin_stock';
    if (m.stock < m.minimo) return 'stock_bajo';
    return 'disponible';
  },

  /* Cruce de horarios de un técnico (advertencia de asignación) */
  conflicto(tecId, fecha, hIni, hFin, excluirId = null) {
    return D().actividades.find(a =>
      a.id !== excluirId &&
      a.fecha === fecha &&
      !['cancelada', 'completada', 'en_revision'].includes(a.estado) &&
      a.tecnicos.includes(tecId) &&
      a.hIni < hFin && hIni < a.hFin
    ) || null;
  },

  /* Pares de actividades cruzadas de un técnico en una fecha (timeline) */
  crucesDeTecnico(tecId, fecha) {
    const acts = this.actividadesDeTecnico(tecId, fecha)
      .filter(a => !['cancelada', 'completada', 'en_revision'].includes(a.estado));
    const ids = new Set();
    for (let i = 0; i < acts.length; i++) {
      for (let j = i + 1; j < acts.length; j++) {
        if (acts[i].hIni < acts[j].hFin && acts[j].hIni < acts[i].hFin) {
          ids.add(acts[i].id); ids.add(acts[j].id);
        }
      }
    }
    return ids;
  },

  /* Kardex */
  movimientosDeMaterial(mid) { return D().movimientos.filter(m => m.materialId === mid); },
  movimientosDeSitio(sid) { return D().movimientos.filter(m => m.sitioId === sid); },

  kpis() {
    const acts = D().actividades;
    const hoy = this.actividadesHoy();
    const abiertas = D().incidencias.filter(i => ['abierta', 'en_atencion'].includes(i.estado));
    const global = Math.round(
      D().proyectos.reduce((s, p) => s + this.avanceProyecto(p.id), 0) / D().proyectos.length
    );
    return {
      actividadesHoy: hoy.length,
      enEjecucion: acts.filter(a => a.estado === 'en_ejecucion').length,
      porAprobar: acts.filter(a => a.estado === 'en_revision').length,
      completadasSemana: acts.filter(a => a.estado === 'completada' && a.fecha >= '2026-08-03').length,
      retrasadas: acts.filter(a => a.estado === 'retrasada').length,
      pendientes: acts.filter(a => a.estado === 'pendiente').length,
      incidenciasAbiertas: abiertas.length,
      incidenciasVencidas: abiertas.filter(i => this.incidenciaVencida(i)).length,
      tecnicosEnCampo: D().tecnicos.filter(t => t.estado === 'en_campo').length,
      btsAlarma: D().sitios.filter(s => s.estado === 'alarma').length,
      sitiosTotal: D().sitios.length,
      avanceGlobal: global,
      evidenciasHoy: D().evidencias.filter(e => e.fecha === window.HOY).length,
      evidenciasPorRevisar: D().evidencias.filter(e => e.estado === 'en_revision').length,
      materialesCriticos: D().materiales.filter(m => this.estadoMaterial(m) !== 'disponible').length,
      noLeidas: D().notificaciones.filter(n => !n.leida).length,
    };
  },
};


/* Compartido con el modo demostración */
window.__nucleo = { D, ahora, tocar };
