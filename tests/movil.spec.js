const { test, expect } = require('@playwright/test');
const { CLIENTE, ADMIN, elegirDiaLibre, elegirHorario } = require('./ayudas');

// Pantalla de teléfono con toque.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.describe('Móvil (390 px)', () => {
  test('servicios adicionales: al marcar uno, sus selectores aparecen debajo del nombre y se leen completos', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '09:00', '14:00');
    const tarjetas = page.locator('.client-addon-row');
    expect(await tarjetas.count()).toBe(5);
    for (let i = 0; i < 5; i++) {
      const tarjeta = tarjetas.nth(i);
      await tarjeta.locator('input[type="checkbox"]').check();
      const cabecera = await tarjeta.locator('.addon-cabecera').boundingBox();
      const selector = await tarjeta.locator('.selector-entrada').first().boundingBox();
      expect(selector.y).toBeGreaterThanOrEqual(cabecera.y + cabecera.height - 1); // el selector queda debajo
      expect(selector.width).toBeGreaterThan(95);
      expect(selector.x + selector.width).toBeLessThanOrEqual(390); // no se sale de la pantalla
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
