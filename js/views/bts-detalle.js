/* ============================================================================
 * bts-detalle.js — Vista «Ficha de sitio»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/
export const state = () => {
  const id = App.param('id') || 'st-02';
  return {
    id,
    map: null,
    get s() { return CALC.sitio(this.id); },
    get acts() { return CALC.actividadesDeSitio(this.id); },
    get incs() { return Alpine.store('db').incidencias.filter(i => i.sitioId === this.id); },
    init() {
      this.$nextTick(() => {
        if (!this.$refs.mapa || !this.s.lat) return;
        this.map = L.map(this.$refs.mapa, { scrollWheelZoom: false }).setView([this.s.lat, this.s.lng], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(this.map);
        const colores = { operativo: 'completado', en_ejecucion: 'ejecucion', planificado: 'pendiente', alarma: 'critico' };
        const k = colores[this.s.estado] || 'cancelado';
        L.marker([this.s.lat, this.s.lng], {
          icon: L.divIcon({ className: '', html: `<div class="bts-pin" style="background:var(--st-${k})">BTS</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
        }).addTo(this.map);
      });
    },
    async accion(a) {
      const u = Alpine.store('db').sesion.usuario;
      if (['pendiente', 'retrasada'].includes(a.estado)) { await ACCIONES.iniciarActividad(a.id, u); Alpine.store('toasts').push('info', 'Actividad iniciada', a.id); }
      else if (a.estado === 'en_ejecucion') {
        const r = await ACCIONES.finalizarActividad(a.id, u);
        if (!r.ok) Alpine.store('toasts').push('error', 'No se puede cerrar todavía', 'Falta: ' + (r.faltantes || []).join(' · '));
        else Alpine.store('toasts').push('ok', 'Cierre enviado a revisión', a.id);
      }
      else if (a.estado === 'en_revision' && Alpine.store('ui').puede('aprobar')) {
        await ACCIONES.aprobarActividad(a.id, u);
        Alpine.store('toasts').push('ok', 'Cierre aprobado', `Avance del sitio: ${CALC.avanceSitio(this.id)}%`);
      }
    },
  };
}

export default {
  title: "Ficha de sitio",
  roles: ["admin", "supervisor", "tecnico"],
  deps: ["mapa"],
  componente: "sitioPage",
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="sitioPage()">

  <template x-if="$store.ui.view==='loading'">
    <div class="grid lg:grid-cols-3 gap-4">
      <div class="ui-card p-5 lg:col-span-1" x-html="UI.skel.detail()"></div>
      <div class="lg:col-span-2 space-y-4">
        <div class="ui-skel" style="height:260px;border-radius:8px"></div>
        <div x-html="UI.skel.table(4,5)"></div>
      </div>
    </div>
  </template>
  <template x-if="$store.ui.view==='error'">
    <div class="ui-card mt-8" x-html="UI.errorState({ desc:'No se pudo cargar la ficha del sitio.', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
  </template>
  <template x-if="$store.ui.view==='empty'">
    <div class="ui-card mt-8" x-html="UI.emptyState({ icon:'tower', title:'Sitio no encontrado', desc:'Verifica el código o vuelve al listado.', action: UI.btn({label:'Ir a BTS / Sitios', attrs:\`onclick=&quot;App.ir('bts')&quot;\`}) })"></div>
  </template>

  <div x-show="$store.ui.view==='data'" class="space-y-4">

    <nav class="text-xs text-ink-3" aria-label="Miga de pan">
      <a :href="$store.ui.href('bts')" class="hover:text-ink-1">BTS / Sitios</a>
      <span aria-hidden="true"> / </span><span class="mono text-ink-2" x-text="s.codigo"></span>
    </nav>

    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="mono text-lg font-semibold" x-text="s.codigo"></h1>
          <span x-html="UI.badge(s.estado)"></span>
        </div>
        <p class="text-sm text-ink-2 mt-1 max-w-2xl" x-text="s.nombre + ' — ' + s.direccion"></p>
      </div>
      <div class="flex gap-2">
        <button class="ui-btn ui-btn-secondary ui-btn-md" x-show="$store.ui.puede('exportar')" @click="UI.protoNotice()"
          x-html="UI.icon('download',14)+' Exportar ficha'"></button>
        <button class="ui-btn ui-btn-primary ui-btn-md" x-show="$store.ui.puede('asignar')"
          onclick="App.ir('agenda').replace(/id=[^&]*&?/,'')"
          x-html="UI.icon('calendar',14)+' Programar actividad'"></button>
      </div>
    </header>

    <div class="grid lg:grid-cols-3 gap-4">
      <!-- Ficha técnica -->
      <section class="ui-card p-5 space-y-0.5" aria-label="Ficha técnica">
        <h2 class="text-sm font-semibold mb-3">Ficha técnica</h2>
        <dl class="text-sm divide-y divide-[var(--line)]">
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Distrito / provincia</dt><dd class="text-right" x-text="s.distrito + ' · ' + s.provincia"></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Coordenadas</dt><dd class="mono text-xs text-right" x-text="UI.fmt.coord(s.lat) + ', ' + UI.fmt.coord(s.lng)"></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Tipo de estructura</dt><dd class="text-right" x-text="s.tipo"></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Altura</dt><dd class="mono text-right" x-text="s.altura + ' m'"></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Tecnologías</dt><dd class="text-right"><span class="mono text-xs" x-text="s.tecnologias.join(' / ')"></span></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Energía</dt><dd class="text-right text-xs" x-text="s.energia"></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Proyecto</dt><dd class="text-right"><a :href="$store.ui.href('proyecto-detalle') + '&id=' + s.proyectoId" class="mono text-xs text-brand-600 dark:text-brand-400 hover:underline" x-text="CALC.proyecto(s.proyectoId).codigo"></a></dd></div>
          <div class="flex justify-between gap-3 py-2"><dt class="text-ink-3">Cliente</dt><dd class="text-right" x-text="CALC.cliente(CALC.proyecto(s.proyectoId).clienteId).nombre"></dd></div>
          <div class="flex justify-between gap-3 py-2 items-center"><dt class="text-ink-3">Avance del sitio</dt>
            <dd class="w-36"><span x-show="CALC.avanceSitio(id) !== null" x-html="UI.progress(CALC.avanceSitio(id) ?? 0)"></span>
            <span x-show="CALC.avanceSitio(id) === null" class="text-xs text-ink-3">Sin actividades</span></dd></div>
        </dl>
        <div x-show="incs.filter(i=>['abierta','en_atencion'].includes(i.estado)).length" class="mt-3 p-3 rounded-md border text-sm"
          style="background:var(--st-critico-bg);border-color:var(--st-critico-bd)">
          <p class="font-semibold flex items-center gap-1.5" style="color:var(--st-critico)" x-html="UI.icon('alert',14) + ' Incidencias activas en este sitio'"></p>
          <template x-for="i in incs.filter(i=>['abierta','en_atencion'].includes(i.estado))" :key="i.id">
            <p class="text-xs mt-1.5 text-ink-2"><span class="mono" x-text="i.id"></span> — <span x-text="i.titulo"></span></p>
          </template>
        </div>
      </section>

      <!-- Mapa + actividades -->
      <div class="lg:col-span-2 space-y-4">
        <section class="ui-card overflow-hidden" aria-label="Ubicación">
          <div x-ref="mapa" style="height:260px" role="application" aria-label="Mapa de ubicación del sitio"></div>
        </section>

        <section aria-label="Actividades del sitio">
          <h2 class="text-sm font-semibold mb-2">Actividades en este sitio</h2>
          <div class="ui-table-wrap" x-show="acts.length">
            <table class="ui-table">
              <thead><tr><th class="col-sticky">ID</th><th>Actividad</th><th>Fecha</th><th>Horario</th><th>Cuadrilla</th><th>Estado</th><th>Avance</th><th><span class="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                <template x-for="a in acts" :key="a.id">
                  <tr>
                    <td class="col-sticky mono text-xs" x-text="a.id"></td>
                    <td x-text="CALC.tipo(a.tipoId).nombre"></td>
                    <td class="mono text-xs" x-text="UI.fmt.fecha(a.fecha)"></td>
                    <td class="mono text-xs" x-text="(a.inicioReal||a.hIni)+'–'+(a.finReal||a.hFin)"></td>
                    <td><span class="ui-avatar-stack" x-html="a.tecnicos.map(t=>UI.avatar(CALC.tecnico(t),24)).join('')"></span></td>
                    <td x-html="UI.badge(a.estado)"></td>
                    <td x-html="UI.progress(CALC.avanceActividad(a), {estado: a.estado==='retrasada' ? 'critico':''})"></td>
                    <td class="row-actions text-right whitespace-nowrap">
                      <button class="ui-btn ui-btn-secondary ui-btn-sm" x-show="['pendiente','retrasada'].includes(a.estado)" @click="accion(a)" x-html="UI.icon('play',12)+' Iniciar'"></button>
                      <button class="ui-btn ui-btn-primary ui-btn-sm" x-show="a.estado==='en_ejecucion'" @click="accion(a)" x-html="UI.icon('check',12)+' Finalizar'"></button>
                      <button class="ui-btn ui-btn-primary ui-btn-sm" x-show="a.estado==='en_revision' && $store.ui.puede('aprobar')" @click="accion(a)" x-html="UI.icon('check',12)+' Aprobar'"></button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="ui-card" x-show="!acts.length"
            x-html="UI.emptyState({icon:'clipboard', title:'Sin actividades registradas', desc:'Programa la primera actividad para este sitio desde la Agenda.', action: UI.btn({label:'Ir a la Agenda', icon:'calendar', attrs:\`onclick=&quot;App.ir('agenda')&quot;\`})})"></div>
        </section>

        <section aria-label="Materiales despachados al sitio">
          <h2 class="text-sm font-semibold mb-2">Materiales despachados</h2>
          <div class="ui-table-wrap" x-show="CALC.movimientosDeSitio(id).length">
            <table class="ui-table">
              <thead><tr><th>Fecha</th><th>Material</th><th class="text-right">Cantidad</th><th>Actividad</th><th>Despachó</th></tr></thead>
              <tbody>
                <template x-for="mv in CALC.movimientosDeSitio(id)" :key="mv.id">
                  <tr>
                    <td class="mono text-xs" x-text="UI.fmt.fecha(mv.fecha) + ' ' + mv.hora"></td>
                    <td><span class="mono text-xs text-ink-3" x-text="mv.materialId"></span> <span class="text-sm" x-text="$store.db.materiales.find(m=>m.id===mv.materialId)?.nombre"></span></td>
                    <td class="mono text-xs text-right" x-text="mv.cantidad + ' ' + ($store.db.materiales.find(m=>m.id===mv.materialId)?.unidad || '')"></td>
                    <td class="mono text-xs" x-text="mv.actividadId || '—'"></td>
                    <td class="text-xs" x-text="mv.usuario"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="ui-card" x-show="!CALC.movimientosDeSitio(id).length"
            x-html="UI.emptyState({icon:'box', title:'Sin despachos registrados', desc:'Los materiales despachados a este sitio desde el almacén aparecerán aquí.'})"></div>
        </section>

        <section aria-label="Evidencias del sitio">
          <h2 class="text-sm font-semibold mb-2">Evidencias</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3" x-show="CALC.evidenciasDeSitio(id).length">
            <template x-for="e in CALC.evidenciasDeSitio(id)" :key="e.id">
              <figure class="ui-card overflow-hidden">
                <img :src="e.archivo" :alt="e.titulo" loading="lazy" class="w-full h-28 object-cover">
                <figcaption class="p-2">
                  <p class="text-xs font-medium truncate" x-text="e.titulo"></p>
                  <p class="mono text-xs text-ink-3" x-text="\`\${e.fecha} \${e.hora}\`"></p>
                </figcaption>
              </figure>
            </template>
          </div>
          <div class="ui-card" x-show="!CALC.evidenciasDeSitio(id).length"
            x-html="UI.emptyState({icon:'camera', title:'Sin evidencias de este sitio', desc:'Las fotos que suba la cuadrilla desde campo aparecerán aquí.'})"></div>
        </section>
      </div>
    </div>
  </div>
</div>`,
};
