const { test, expect } = require('@playwright/test');
const { ADMIN, CLIENTE, elegirDiaLibre, elegirHorario, llenarDatos, enviarSolicitud, capturarPdf, ultimoPdf } = require('./ayudas');

async function abrirCotizacionDe(page, nombre) {
  await page.goto(ADMIN);
  await page.locator('#requests-body tr', { hasText: nombre }).locator('[data-create-quote]').click();
  await expect(page.locator('#quote-dialog')).toHaveAttribute('open', '');
}

const texto = async (page, id) => (await page.locator(id).innerText()).replace(/\s+/g, ' ').trim();

test.describe('Cotización del administrador', () => {
  test('la tarifa por defecto es S/ 100 por hora y el detalle de servicios viene sugerido', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Cliente Tarifa' });
    await abrirCotizacionDe(page, 'Cliente Tarifa');
    await expect(page.locator('#quote-hourly-rate')).toHaveValue('100');
    await expect(page.locator('#quote-services')).toHaveValue('Alquiler del auditorio por 4 horas.');
  });

  test('cálculo: alquiler + extras + IGV del 18 %', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Cliente Calculo' });
    await abrirCotizacionDe(page, 'Cliente Calculo');
    // Sin extras: 4 h × S/ 100 = 400; IGV 72; total 472
    expect(await texto(page, '#quote-space-subtotal')).toContain('400.00');
    expect(await texto(page, '#quote-subtotal')).toContain('400.00');
    expect(await texto(page, '#quote-tax')).toContain('72.00');
    expect(await texto(page, '#quote-total')).toContain('472.00');
  });

  test('cotización real de la empresa: S/ 500 (5 h) + LED 4×3 S/ 200 = S/ 700 sin IGV', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '17:00', '22:00');
    await llenarDatos(page, { nombre: 'Cliente Real' });
    await page.check('#request-addon-led-43');
    await page.selectOption('#request-addon-led-43-start', { label: '17:00' });
    await page.selectOption('#request-addon-led-43-end', { label: '22:00' });
    await page.click('#submit-request');
    await page.click('#close-request-success');

    await abrirCotizacionDe(page, 'Cliente Real');
    expect(await texto(page, '#quote-space-subtotal')).toContain('500.00');
    expect(await texto(page, '#quote-addons-subtotal')).toContain('200.00');
    expect(await texto(page, '#quote-subtotal')).toContain('700.00');
    expect(await texto(page, '#quote-tax')).toContain('126.00');
    expect(await texto(page, '#quote-total')).toContain('826.00');
  });

  test('al guardar se asigna un código, se pregunta el canal de envío y la cotización queda «En proceso»', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Cliente Guardar' });
    await abrirCotizacionDe(page, 'Cliente Guardar');
    await page.click('#save-quote');
    await expect(page.locator('#quote-send-dialog')).toHaveAttribute('open', '');
    await expect(page.locator('#send-options')).toContainText('Correo electrónico');
    await expect(page.locator('#send-options')).toContainText('WhatsApp');

    await page.goto(ADMIN);
    await page.click('label[for="tab-quotes"]');
    const fila = page.locator('#quotes-body tr', { hasText: 'Cliente Guardar' });
    await expect(fila).toContainText(/COD-\d{3}-\d{4}/);
    await expect(fila).toContainText('En proceso');
    await expect(fila).toContainText('Sin pagos');
  });

  test('el PDF de la cotización se genera sin errores', async ({ page }) => {
    const errores = [];
    page.on('pageerror', e => errores.push(e.message));
    await capturarPdf(page);
    await enviarSolicitud(page, { nombre: 'Cliente Pdf' });
    await abrirCotizacionDe(page, 'Cliente Pdf');
    await page.click('#save-quote');
    await page.goto(ADMIN);
    await page.click('label[for="tab-quotes"]');
    await page.locator('#quotes-body tr', { hasText: 'Cliente Pdf' }).locator('button').first().click();
    await expect.poll(() => ultimoPdf(page)).not.toBeNull();
    const pdf = await ultimoPdf(page);
    expect(pdf.inicio).toBe('%PDF-1.4');
    expect(pdf.tamano).toBeGreaterThan(20000);
    expect(pdf.paginas).toBeGreaterThanOrEqual(1);
    expect(errores).toEqual([]);
  });
});
