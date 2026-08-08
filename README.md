# INFRA · NettOps

Aplicación web para la gestión de operaciones de infraestructura de
telecomunicaciones. Esta rama contiene la migración progresiva a Vue 3 + Vite,
con Supabase como servicio de autenticación y datos.

## Alcance actual

- Inicio de sesión exclusivo para `zahir@bitel.com.pe`.
- Verificación adicional del rol `admin` en `public.perfiles`.
- Layout adaptable para escritorio y teléfono.
- Dashboard conectado directamente a Supabase.
- Consultas limitadas a los datos necesarios para la pantalla.
- Sin modo demo, selección simulada de roles ni datos embebidos.
- Dependencias locales y compiladas; no se utilizan CDN en producción.

Los archivos HTML y JavaScript de la versión anterior se conservan
temporalmente como referencia de migración, pero Vite no los incluye en el
directorio `dist` ni en la publicación nueva.

## Requisitos

- Node.js 20.19 o superior.
- pnpm 11.
- Proyecto Supabase con el esquema incluido en `supabase/`.

## Configuración

Copiar `.env.example` como `.env.local` y completar:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
VITE_ALLOWED_EMAIL=zahir@bitel.com.pe
```

La llave del navegador debe ser la llave publicable/anon. Nunca se debe usar
la llave `service_role` en variables que comiencen por `VITE_`.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Validación y compilación

```bash
pnpm check
```

El resultado se genera en `dist/`.

## Limpieza de demostración

La limpieza de Supabase está separada en dos pasos:

1. `supabase/06-limpieza-produccion-preview.sql`: muestra qué cuentas y cuántas
   filas existen; no modifica datos.
2. `supabase/07-limpieza-produccion.sql`: elimina definitivamente datos de
   demostración y conserva únicamente `zahir@bitel.com.pe` como administrador.

El segundo script es destructivo y requiere revisión y confirmación antes de
ejecutarse en Supabase.

## Despliegue

Vercel debe usar:

- Framework: Vite
- Build command: `pnpm build`
- Output directory: `dist`

También deben configurarse en Vercel las tres variables `VITE_*` descritas
arriba. `vercel.json` contiene la redirección necesaria para Vue Router.
