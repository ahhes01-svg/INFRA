import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(globalThis.process?.env?.PORT || 8000);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relativo = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const archivo = path.resolve(root, relativo);

  if (!archivo.startsWith(root + path.sep) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
    return;
  }

  res.writeHead(200, {
    'Content-Type': tipos[path.extname(archivo).toLowerCase()] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), camera=(self)',
  });
  fs.createReadStream(archivo).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`NettOps disponible en http://127.0.0.1:${port}`);
});

export default server;
