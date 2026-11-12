const { test, expect } = require('@playwright/test');
const { ADMIN, CLIENTE, enviarSolicitud, elegirDiaLibre } = require('./ayudas');

test.describe('Panel del administrador', () => {
  test('las pestañas Solicitudes y Cotizaciones cambian de panel y el contador está bien escrito', async ({ page }) => {
    await page.goto(ADMIN);
    await expect(page.locator('.requests-panel')).toBeVisible();
    await expect(page.locator('.quotes-panel')).toBeHidden();
    await page.click('label[for="tab-quotes"]');
    await expect(page.locator('.quotes-panel')).toBeVisible();
    await expect(page.locator('#quote-count')).toHaveText('3 cotizaciones');
    await page.click('label[for="tab-requests"]');
    await expect(page.locator('.requests-panel')).toBeVisible();
  });

  test('las tablas muestran el estado de solicitudes y cotizaciones', async ({ page }) => {
    await page.goto(ADMIN);
    await expect(page.locator('.requests-panel thead')).toContainText('Estado');
    await expect(page.locator('#requests-body')).toContainText('Cotizada');
    await expect(page.locator('#requests-body')).toContainText('Nueva');
    await page.click('label[for="tab-quotes"]');
    await expect(page.locator('.quotes-panel thead')).toContainText('Estado');
    await expect(page.locator('.quotes-panel thead')).toContainText('Pago');
  });

  test('descartar una solicitud libera su horario y se puede reactivar', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Cliente Descarte', inicio: '09:00', fin: '13:00' });
    await page.goto(ADMIN);
    const fila = () => page.locator('#requests-body tr', { hasText: 'Cliente Descarte' });

    page.once('dialog', d => d.accept());
    await fila().locator('[data-discard-request]').click();
    await expect(fila()).toContainText('Descartada');

    // El horario vuelve a estar libre para otros clientes
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    expect(await page.locator('#start-time option').allTextContents()).toContain('09:00');

    // Filtro «Descartadas» y reactivación
    await page.goto(ADMIN);
    await page.selectOption('#request-filter', 'discarded');
    await expect(page.locator('#requests-body tr')).toHaveCount(1);
    await page.locator('[data-reactivate-request]').click();
    await page.selectOption('#request-filter', '');
    await expect(fila()).toContainText('Nueva');
  });

  test('una solicitud ya cotizada no se puede descartar', async ({ page }) => {
    await page.goto(ADMIN);
    const cotizada = page.locator('#requests-body tr', { hasText: 'Cotizada' }).first();
    await expect(cotizada.locator('[data-discard-request]')).toHaveCount(0);
    await expect(cotizada.locator('[data-view-quote]')).toHaveCount(1);
  });

  test('la vista Semana abre en la semana actual', async ({ page }) => {
    await page.goto(ADMIN);
    await page.click('#calendar-toggle');
    await page.click('[data-calendar-view="week"]');
    const hoy = new Date();
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const encabezado = `${dias[(hoy.getDay() + 6) % 7]} ${hoy.getDate()}`;
    await expect(page.locator('.week-day h4', { hasText: encabezado })).toHaveCount(1);
  });

  test('los datos de ejemplo caen en fechas futuras', async ({ page }) => {
    await page.goto(ADMIN);
    const fechas = await page.evaluate(() => {
      const datos = JSON.parse(localStorage.getItem('alquiler-espacios-demo-v2'));
      return [...datos.requests, ...datos.bookings].map(item => item.date);
    });
    const hoy = new Date().toISOString().slice(0, 10);
    expect(fechas.length).toBeGreaterThan(0);
    fechas.forEach(fecha => expect(fecha >= hoy).toBe(true));
  });
});
