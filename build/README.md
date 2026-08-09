# Hoja de estilos compilada

`css/tailwind.css` se genera a partir de las clases que la aplicación usa
realmente. Sustituye al compilador que antes venía por CDN: **17 KB en vez de
402 KB**, y sin ejecutar un compilador en el navegador en cada carga.

## Cuándo hay que regenerarla

Solo si añades **clases nuevas de Tailwind** que no se usaban antes (por
ejemplo `grid-cols-7` o `mt-14`). Editar textos, lógica o clases que ya
existían en el proyecto no requiere recompilar.

Si una clase nueva no surte efecto, es señal de que toca regenerar.

## Cómo se regenera

Necesitas Node instalado. Desde la raíz del proyecto:

```bash
npx tailwindcss@3.4.17 -c build/tailwind.config.js \
  -i build/tailwind-entrada.css -o css/tailwind.css --minify
```

Tarda menos de un segundo. El resultado se sube al repositorio como cualquier
otro archivo: **el despliegue en Vercel no ejecuta ningún paso de compilación**,
sigue publicando archivos estáticos tal cual.

## Durante el desarrollo

Para no regenerar a mano en cada cambio, deja el observador corriendo:

```bash
npx tailwindcss@3.4.17 -c build/tailwind.config.js \
  -i build/tailwind-entrada.css -o css/tailwind.css --watch
```

## Qué escanea

`build/tailwind.config.js` recorre `../**/*.html` y `../js/**/*.js`, que es
donde viven las plantillas de las vistas. Si añades carpetas nuevas con
marcado, agrégalas ahí.
