// Ayudas compartidas por las pruebas.
const path = require('path');
const { pathToFileURL } = require('url');
const { expect } = require('@playwright/test');

const raiz = path.resolve(__dirname, '..');
const url = archivo => pathToFileURL(path.join(raiz, archivo)).href;

const CLIENTE = url('solicitar-fecha.html');
const ADMIN = url('panel-administracion.html');

/** Avanza el calendario del cliente dos meses: los datos de ejemplo están en las próximas semanas, así ese día está libre. */
async function elegirDiaLibre(page, dia = 15) {
  await page.locator('#client-next-month').click();
  await page.locator('#client-next-month').click();
  await page.locator('#client-calendar button:not([disabled])', { hasText: new RegExp(`^${dia}$`) }).first().click();
}

async function elegirHorario(page, inicio, fin) {
  await page.selectOption('#start-time', { label: inicio });
  await page.selectOption('#end-time', { label: fin });
}

async function llenarDatos(page, { nombre = 'Cliente de Prueba', correo = 'prueba@correo.pe', telefono = '987654321', dni = '12345678' } = {}) {
  await page.fill('#full-name', nombre);
  await page.fill('#email', correo);
  await page.fill('#phone', telefono);
  await page.fill('#dni', dni);
}

/** Registra una solicitud completa desde la pantalla del cliente. */
async function enviarSolicitud(page, opciones = {}) {
  await page.goto(CLIENTE);
  await elegirDiaLibre(page, opciones.dia);
  await elegirHorario(page, opciones.inicio || '09:00', opciones.fin || '13:00');
  await llenarDatos(page, opciones);
  await page.click('#submit-request');
  await expect(page.locator('#request-success-dialog')).toBeVisible();
  await page.click('#close-request-success');
}

/** Simula la ventana emergente y guarda los PDF que se generan (el prototipo los arma en el navegador). */
async function capturarPdf(page) {
  await page.addInitScript(() => {
    window.__pdfs = [];
    const original = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { window.__pdfs.push(blob); return original(blob); };
    window.open = () => ({ location: { replace: () => {} }, close: () => {} });
  });
}

async function ultimoPdf(page) {
  return page.evaluate(async () => {
    const blob = window.__pdfs[window.__pdfs.length - 1];
    if (!blob) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { tamano: bytes.length, inicio: String.fromCharCode(...bytes.slice(0, 8)), paginas: (new TextDecoder('latin1').decode(bytes).match(/\/Type \/Page\b/g) || []).length };
  });
}

module.exports = { CLIENTE, ADMIN, elegirDiaLibre, elegirHorario, llenarDatos, enviarSolicitud, capturarPdf, ultimoPdf };
