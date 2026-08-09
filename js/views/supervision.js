(function () {
/* ============================================================================
 * supervision.js — Vista «Supervisión en tiempo real»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/


window.NettOps.registrarVista('supervision', {
  title: "Supervisión en tiempo real",
  roles: ["supervisor"],
  deps: [],
  componente: null,
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="{}">

  <template x-if="$store.ui.view==='loading'">
    <div class="grid lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-3" x-html="UI.skel.cards(3)"></div>
      <div class="space-y-3" x-html="UI.skel.cards(2)"></div>
    </div>
  </template>
  <template x-if="$store.ui.view==='empty'">
    <div class="ui-card mt-8" x-html="UI.emptyState({ icon:'shield', title:'Sin operación en curso', desc:'Cuando una cuadrilla inicie una actividad aparecerá aquí con su avance en tiempo real.' })"></div>
  </template>
  <template x-if="$store.ui.view==='error'">
    <div class="ui-card mt-8" x-html="UI.errorState({ desc:'Se perdió la conexión con el canal de eventos en tiempo real.', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
  </template>

  <div x-show="$store.ui.view==='data'" class="space-y-4">

    <div class="flex items-center gap-2">
      <span class="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style="background:var(--st-completado)"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5" style="background:var(--st-completado)"></span>
      </span>
      <p class="text-sm text-ink-2">Estado operativo en vivo · <span class="mono text-xs" x-text="UI.fmt.diaLargo($store.ui.hoy)"></span>. Todo cambio hecho por las cuadrillas se refleja aquí al instante.</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-4 items-start">

      <!-- Trabajos en curso -->
      <section class="lg:col-span-2 space-y-3" aria-label="Trabajos en curso">
        <h2 class="text-lg font-semibold">Trabajos en curso
          <span class="mono text-sm text-ink-3 font-normal" x-text="'(' + $store.db.actividades.filter(a=>a.estado==='en_ejecucion').length + ')'"></span>
        </h2>
        <template x-for="a in $store.db.actividades.filter(a=>a.estado==='en_ejecucion')" :key="a.id">
          <article class="ui-card p-4">
            <div class="flex flex-wrap items-start gap-3">
              <div class="flex-1 min-w-[240px]">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="mono text-xs text-ink-3" x-text="a.id"></span>
                  <span x-html="UI.badge(a.estado)"></span>
                  <span class="mono text-xs text-ink-3" x-text="'inició ' + a.inicioReal"></span>
                </div>
                <p class="font-semibold mt-1" x-text="CALC.tipo(a.tipoId).nombre"></p>
                <a :href="$store.ui.href('bts-detalle')+'&id='+a.sitioId" class="mono text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  x-text="CALC.sitio(a.sitioId).codigo + ' · ' + CALC.sitio(a.sitioId).distrito"></a>
                <div class="mt-3" x-html="UI.progress(CALC.avanceActividad(a))"></div>
                <p class="text-xs text-ink-3 mt-1.5" x-show="a.checklist.length"
                  x-text="a.checklist.filter(i=>i.ok).length + ' de ' + a.checklist.length + ' ítems del checklist completados. Próximo: ' + (a.checklist.find(i=>!i.ok)?.t || '—')"></p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="ui-avatar-stack" x-html="a.tecnicos.map(t=>UI.avatar(CALC.tecnico(t),32)).join('')"></span>
                <a :href="$store.ui.href('actividades')+'&id='+a.id" class="ui-btn ui-btn-secondary ui-btn-sm">Ver checklist</a>
              </div>
            </div>
          </article>
        </template>
        <div class="ui-card" x-show="!$store.db.actividades.filter(a=>a.estado==='en_ejecucion').length"
          x-html="UI.emptyState({icon:'clock', title:'Ninguna cuadrilla en ejecución ahora', desc:'Las actividades pendientes de hoy aún no se han iniciado.'})"></div>

        <!-- Cierres por aprobar -->
        <h2 class="text-lg font-semibold pt-2">Cierres por aprobar
          <span class="mono text-sm text-ink-3 font-normal" x-text="'(' + $store.db.actividades.filter(a=>a.estado==='en_revision').length + ')'"></span>
        </h2>
        <template x-for="a in $store.db.actividades.filter(a=>a.estado==='en_revision')" :key="a.id">
          <article class="ui-card p-4" x-data="{ rej:false, motivo:'' }">
            <div class="flex flex-wrap items-start gap-3">
              <span style="color:var(--st-pendiente)" x-html="UI.icon('clock',18)"></span>
              <div class="flex-1 min-w-[240px]">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="mono text-xs text-ink-3" x-text="a.id"></span>
                  <span x-html="UI.badge('en_revision')"></span>
                  <span class="mono text-xs text-ink-3" x-text="'cerrada ' + (a.finReal || '—') + ' del ' + UI.fmt.fecha(a.fecha)"></span>
                </div>
                <p class="font-semibold mt-1" x-text="CALC.tipo(a.tipoId).nombre + ' — ' + CALC.sitio(a.sitioId).codigo"></p>
                <p class="text-xs text-ink-3 mt-1"
                  x-text="CALC.evidenciasDeActividad(a.id).length + ' evidencia(s) adjunta(s)' + (CALC.evidenciasDeActividad(a.id).length ? '' : ' — revisar antes de aprobar')"></p>
                <div x-show="rej" x-cloak class="mt-2">
                  <textarea class="ui-textarea" x-model="motivo" placeholder="Motivo del rechazo (obligatorio)…"></textarea>
                </div>
              </div>
              <div class="flex flex-col gap-2 flex-none">
                <template x-if="!rej">
                  <span class="flex gap-2">
                    <button class="ui-btn ui-btn-secondary ui-btn-sm" @click="rej=true">Rechazar</button>
                    <button class="ui-btn ui-btn-primary ui-btn-sm"
                      @click="await ACCIONES.aprobarActividad(a.id, $store.db.sesion.usuario); $store.toasts.push('ok','Cierre aprobado', a.id)">Aprobar</button>
                  </span>
                </template>
                <template x-if="rej">
                  <span class="flex gap-2">
                    <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="rej=false">Cancelar</button>
                    <button class="ui-btn ui-btn-danger ui-btn-sm"
                      @click="if(motivo.trim().length<5){$store.toasts.push('error','Indica el motivo del rechazo');}else{await ACCIONES.rechazarActividad(a.id, motivo.trim(), $store.db.sesion.usuario); $store.toasts.push('warn','Cierre rechazado', a.id + ' vuelve a la cuadrilla');}">Confirmar</button>
                  </span>
                </template>
              </div>
            </div>
          </article>
        </template>
        <div class="ui-card" x-show="!$store.db.actividades.filter(a=>a.estado==='en_revision').length"
          x-html="UI.emptyState({icon:'checkCircle', title:'Nada por aprobar', desc:'Los cierres enviados por las cuadrillas aparecerán aquí para tu revisión.'})"></div>

        <!-- Riesgos -->
        <h2 class="text-lg font-semibold pt-2">Atención requerida</h2>
        <template x-for="i in $store.db.incidencias.filter(i=>['abierta','en_atencion'].includes(i.estado))" :key="i.id">
          <article class="ui-card p-3.5 flex items-center gap-3" :style="CALC.incidenciaVencida(i) ? 'border-color:var(--st-critico-bd)' : ''">
            <span :style="\`color:var(--st-\${UI.estadoInfo(i.severidad).key})\`" x-html="UI.icon('alert',17)"></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate" x-text="i.titulo"></p>
              <p class="text-xs text-ink-3 mono" x-text="\`\${i.id} · \${CALC.sitio(i.sitioId).codigo} · límite \${UI.fmt.fecha(i.fechaLimite)}\`"></p>
            </div>
            <span x-show="CALC.incidenciaVencida(i)" x-html="UI.badge('vencida', \`Vencida \${CALC.diasVencida(i)}d\`)"></span>
            <span x-html="UI.badge(i.severidad)"></span>
            <a :href="$store.ui.href('incidencias')" class="ui-btn ui-btn-ghost ui-btn-sm" aria-label="Gestionar" x-html="UI.icon('chevronRight',15)"></a>
          </article>
        </template>
        <template x-for="a in $store.db.actividades.filter(a=>a.estado==='retrasada')" :key="a.id">
          <article class="ui-card p-3.5 flex items-center gap-3">
            <span style="color:var(--st-critico)" x-html="UI.icon('clock',17)"></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate" x-text="CALC.tipo(a.tipoId).nombre + ' — ' + CALC.sitio(a.sitioId).codigo"></p>
              <p class="text-xs text-ink-3 truncate" x-text="a.obs"></p>
            </div>
            <span x-html="UI.badge('retrasada')"></span>
            <a :href="$store.ui.href('agenda')" class="ui-btn ui-btn-secondary ui-btn-sm">Reprogramar</a>
          </article>
        </template>
      </section>

      <!-- Columna derecha: cuadrillas + feed -->
      <aside class="space-y-4" aria-label="Cuadrillas y eventos">
        <section class="ui-card p-4">
          <h2 class="text-sm font-semibold mb-3">Personal en campo</h2>
          <div class="space-y-2.5">
            <template x-for="t in $store.db.tecnicos.filter(t=>['en_campo','disponible'].includes(t.estado))" :key="t.id">
              <div class="flex items-center gap-2.5">
                <span x-html="UI.avatar(t, 32)"></span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate" x-text="t.nombre"></p>
                  <p class="text-xs text-ink-3 truncate mono"
                    x-text="CALC.actividadesDeTecnico(t.id, $store.ui.hoy).filter(a=>a.estado==='en_ejecucion').map(a=>CALC.sitio(a.sitioId).codigo).join(', ') || 'sin trabajo activo'"></p>
                </div>
                <span x-html="UI.badge(t.estado)"></span>
              </div>
            </template>
          </div>
        </section>

        <section class="ui-card p-4">
          <h2 class="text-sm font-semibold mb-3">Últimos eventos</h2>
          <ol class="space-y-3">
            <template x-for="h in $store.db.historial.slice(0,8)" :key="h.id">
              <li class="flex gap-2.5">
                <span class="mono text-xs text-ink-3 flex-none w-20" x-text="UI.fmt.fechaCorta(h.fecha) + ' ' + h.hora"></span>
                <p class="text-xs text-ink-2 min-w-0" x-text="h.detalle"></p>
              </li>
            </template>
          </ol>
          <a :href="$store.ui.href('historial')" class="block text-center text-sm text-brand-600 dark:text-brand-400 hover:underline mt-3">Ver historial completo</a>
        </section>
      </aside>
    </div>
  </div>
</div>`,
});
})();
