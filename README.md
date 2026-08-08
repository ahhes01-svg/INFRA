# NettOps Perú — Prototipo de gestión de operaciones BTS

Prototipo de alta fidelidad de un sistema de gestión de proyectos de
telecomunicaciones (instalación y mantenimiento de estaciones base) para una
empresa de operaciones técnicas de campo en Perú. Todo el contexto es real:
sitios con coordenadas GPS de Ica, Pisco, Chincha y Nazca, nomenclatura de
operador (`IC-PISCO-0342`), técnicos con nombres peruanos y observaciones
escritas como en campo.

## Cómo ejecutarlo

No hay build, npm ni backend. Solo archivos estáticos:

```bash
# opción 1: abrir index.html directamente en el navegador
# opción 2 (recomendada, para que el mapa y las fuentes carguen sin fricción):
python3 -m http.server 8000
# → http://localhost:8000
```

El login es simulado: cualquier usuario y una contraseña de 4+ caracteres.
Elige el rol al ingresar (Administrador / Supervisor / Técnico) — también se
puede cambiar en cualquier momento desde el navbar.

## Stack

- **HTML + Tailwind CSS (CDN) + Alpine.js (CDN)** — sin compilación
- **Chart.js** (gráficos del dashboard y reportes)
- **FullCalendar** (agenda con arrastre para reprogramar)
- **Leaflet + OpenStreetMap** (mapas de sitios)
- Todos los datos viven en memoria en `js/data.js`. Sin base de datos, sin
  fetch, sin localStorage, sin autenticación real.

## Estructura

```
index.html                  login simulado
pages/design-system.html    catálogo completo de componentes
pages/*.html                un archivo por módulo (19 pantallas)
js/tokens.js                tokens de diseño + configuración de Tailwind
js/components.js            componentes reutilizables (CSS + helpers + Alpine)
js/data.js                  datos demo + cálculos derivados + mutaciones
js/layout.js                sidebar, navbar, roles, tema, toasts
```

Orden de construcción respetado: tokens → componentes → design system →
datos → módulos. Ningún módulo define estilos propios.

## Qué probar

- **Reactividad en memoria**: completa una actividad desde el Dashboard o el
  drawer de Actividades — sube el avance del BTS y del proyecto, las cifras
  del dashboard cuentan al nuevo valor, los gráficos se redibujan y el
  historial y la campana registran el evento.
- **Checklist en vivo** (Actividades → abrir `ACT-0013` o `ACT-0014`): cada
  ítem marcado anima la barra de porcentaje.
- **Cruce de horarios** (Agenda): arrastra `ACT-0018` (14:30) sobre la mañana
  del sábado — se rechaza con sacudida y toast porque la cuadrilla ya está en
  `ACT-0014`. El formulario "Programar" avisa del cruce en vivo.
- **Rol Técnico → Mi jornada**: vista móvil con botones grandes; Iniciar →
  Registrar avance → Subir evidencia (dos toques) → Registrar incidencia →
  Finalizar.
- **Estados de pantalla**: el conmutador Datos / Carga / Vacío / Error del
  navbar muestra los cuatro estados de cada módulo (skeletons con la forma
  del contenido, vacíos accionables, errores con reintento).
- **Modo oscuro**: pensado para uso nocturno en campo, sin negros puros.
- **Casos de borde**: proyecto con 47 BTS (PRY-2026-009, con paginación),
  nombre de sitio kilométrico, técnicos sin foto, incidencia crítica vencida
  hace 6 días (INC-2026-038), actividad completada sin evidencias, material
  sin stock que bloquea un correctivo.

## Fuera de alcance (a propósito)

Base de datos, autenticación real, subida real de archivos y exportación a
PDF/Excel. Esos botones existen y avisan "no disponible en el prototipo".
