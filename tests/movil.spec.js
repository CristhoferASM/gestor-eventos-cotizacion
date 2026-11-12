const { test, expect } = require('@playwright/test');
const { CLIENTE, ADMIN } = require('./ayudas');

// Pantalla de teléfono con toque.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.describe('Móvil (390 px)', () => {
  test('servicios adicionales: etiqueta arriba y selectores debajo, sin encimarse', async ({ page }) => {
    await page.goto(CLIENTE);
    const filas = page.locator('.client-addon-row');
    expect(await filas.count()).toBe(5);
    for (let i = 0; i < 5; i++) {
      const fila = filas.nth(i);
      const etiqueta = await fila.locator('.checkbox-row').boundingBox();
      const selector = await fila.locator('.hora-trigger').first().boundingBox();
      expect(selector.y).toBeGreaterThanOrEqual(etiqueta.y + etiqueta.height - 1); // el selector queda debajo
      expect(selector.width).toBeGreaterThan(95); // se lee «Elige horario» completo (103 px con cantidad, 138 px sin ella)
    }
  });

  test('las tablas del administrador se ven como tarjetas con etiqueta', async ({ page }) => {
    await page.goto(ADMIN);
    const tarjeta = page.locator('#requests-body tr').first();
    expect(await tarjeta.evaluate(el => getComputedStyle(el).display)).toBe('block');
    await expect(tarjeta.locator('td[data-label="Correo"]')).toBeVisible();
    // La tarjeta cabe en pantalla: nada queda cortado a la derecha.
    const caja = await tarjeta.boundingBox();
    expect(caja.x + caja.width).toBeLessThanOrEqual(390);
    await page.click('label[for="tab-quotes"]');
    await expect(page.locator('#quotes-body tr').first().locator('td[data-label="Pago"]')).toBeVisible();
  });

  test('calendario mensual: barritas de color y detalle del día al tocarlo', async ({ page }) => {
    await page.goto(ADMIN);
    await page.click('#calendar-toggle');
    const barra = page.locator('.month-table .event-chip').first();
    expect((await barra.boundingBox()).height).toBeLessThan(10);
    await page.locator('.month-table td:has(.event-chip)').first().tap();
    await expect(page.locator('#calendar-detail-content')).toContainText(/Cliente|Disponibilidad/); // el toque cae en la barrita o en el día
  });

  test('vista Semana: un día por fila', async ({ page }) => {
    await page.goto(ADMIN);
    await page.click('#calendar-toggle');
    await page.click('[data-calendar-view="week"]');
    const dias = page.locator('.week-day');
    expect(await dias.count()).toBe(7);
    const a = await dias.nth(0).boundingBox();
    const b = await dias.nth(1).boundingBox();
    expect(b.y).toBeGreaterThan(a.y + a.height - 1);
    expect(Math.round(b.x)).toBe(Math.round(a.x));
  });
});
