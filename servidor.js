// Servidor local mínimo para ver el prototipo en un puerto: `npm start` y abre http://localhost:4400
// No tiene dependencias. Solo sirve los archivos HTML, CSS y JS de esta carpeta y escucha únicamente en tu equipo (127.0.0.1).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = Number(process.env.PORT) || 4400;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const servidor = http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (ruta === '/') {
    res.writeHead(302, { Location: '/solicitar-fecha.html' });
    return res.end();
  }
  // Solo archivos sueltos de la raíz y los de vendor/flatpickr, con extensión permitida (nada de node_modules, tests ni .git).
  const nombre = path.basename(ruta);
  const tipo = TIPOS[path.extname(nombre)];
  const permitida = ruta === '/' + nombre || ruta === '/vendor/flatpickr/' + nombre;
  if (!permitida || !tipo) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('No encontrado');
  }
  fs.readFile(path.join(__dirname, ruta.slice(1)), (error, contenido) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-cache' });
    res.end(contenido);
  });
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`Prototipo de cotización en http://localhost:${PUERTO}`);
  console.log(`  Cliente:        http://localhost:${PUERTO}/solicitar-fecha.html`);
  console.log(`  Administrador:  http://localhost:${PUERTO}/panel-administracion.html`);
});
