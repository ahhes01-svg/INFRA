import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errores = [];

function archivos(dir, extension) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const absoluto = path.join(dir, item.name);
    return item.isDirectory() ? archivos(absoluto, extension)
      : item.name.endsWith(extension) ? [absoluto] : [];
  });
}

for (const archivo of archivos(path.join(root, 'js'), '.js')) {
  try {
    new vm.Script(fs.readFileSync(archivo, 'utf8'), { filename: archivo });
  } catch (error) {
    errores.push(`JavaScript inválido en ${path.relative(root, archivo)}: ${error.message}`);
  }
}

for (const archivo of archivos(root, '.html')) {
  const html = fs.readFileSync(archivo, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((coincidencia, indice) => {
    try {
      new vm.Script(coincidencia[1], { filename: `${archivo}#script-${indice + 1}` });
    } catch (error) {
      errores.push(`Script inline inválido en ${path.relative(root, archivo)}: ${error.message}`);
    }
  });

  const referencias = [...html.matchAll(/(?:^|\s)(?:src|href)=["']([^"'?#]+)["']/gim)];
  for (const [, referencia] of referencias) {
    if (/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(referencia)) continue;
    if (/[{}()`$]/.test(referencia)) continue;
    const destino = path.resolve(path.dirname(archivo), referencia);
    if (!destino.startsWith(root + path.sep) || !fs.existsSync(destino)) {
      errores.push(`Referencia inexistente: ${path.relative(root, archivo)} -> ${referencia}`);
    }
  }
}

const config = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
if (!/forzarDemo:\s*false/.test(config)) errores.push('Producción debe conservar forzarDemo: false.');
if (!/permitirAltaDesdeApp:\s*false/.test(config)) errores.push('El alta pública desde la app debe permanecer desactivada.');

if (errores.length) {
  console.error(errores.map(e => `ERROR: ${e}`).join('\n'));
  process.exit(1);
}

console.log('OK: JavaScript, scripts inline, referencias y configuración básica.');
