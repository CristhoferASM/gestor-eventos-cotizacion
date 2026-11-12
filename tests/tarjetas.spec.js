const { test, expect } = require('@playwright/test');
const { CLIENTE, ADMIN, elegirDiaLibre, elegirHorario } = require('./ayudas');

async function prepararEvento(page, inicio = '09:00', fin = '14:00') {
  await page.goto(CLIENTE);
  await elegirDiaLibre(page);
  await elegirHorario(page, inicio, fin);
}

test.describe('Servicios adicionales como tarjetas', () => {
  test('los controles aparecen al marcar el servicio y traen el horario del evento', async ({ page }) => {
    await prepararEvento(page);
    const cochera = page.locator('.client-addon-row', { hasText: 'Cochera' });
    await expect(cochera.locator('.client-addon-controls')).toBeHidden();
    await cochera.locator('input[type="checkbox"]').check();
    await expect(cochera.locator('.client-addon-controls')).toBeVisible();
    await expect(cochera.locator('.selector-entrada').nth(0)).toHaveValue('09:00');
    await expect(cochera.locator('.selector-entrada').nth(1)).toHaveValue('14:00');
    await cochera.locator('input[type="checkbox"]').uncheck();
    await expect(cochera.locator('.client-addon-controls')).toBeHidden();
  });

  test('cada tarjeta muestra su subtotal en vivo y el resumen suma los extras', async ({ page }) => {
    await prepararEvento(page); // 5 horas
    const cochera = page.locator('.client-addon-row', { hasText: 'Cochera' });
    await expect(cochera.locator('.addon-subtotal')).toHaveText('');
    await cochera.locator('input[type="checkbox"]').check();
    await page.fill('#request-addon-parking-quantity', '5'); // 2 autos de pago × 5 h × S/ 5
    await expect(cochera.locator('.addon-subtotal')).toContainText('50.00');

    const led = page.locator('.client-addon-row', { hasText: 'Pantalla LED 4×3' });
    await led.locator('input[type="checkbox"]').check();
    await expect(led.locator('.addon-subtotal')).toContainText('200.00');
    await expect(page.locator('#summary-addons-total')).toContainText('250.00');
  });

  test('el resumen de la solicitud queda justo encima del botón de enviar', async ({ page }) => {
    await page.goto(CLIENTE);
    const resumen = await page.locator('.summary-box').boundingBox();
    const observaciones = await page.locator('#comments').boundingBox();
    const boton = await page.locator('#submit-request').boundingBox();
    expect(resumen.y).toBeGreaterThan(observaciones.y);
    expect(resumen.y + resumen.height).toBeLessThanOrEqual(boton.y);
  });

  test('el formulario de cotización del administrador usa las mismas tarjetas', async ({ page }) => {
    await page.goto(ADMIN);
    await page.locator('#requests-body [data-create-quote]').first().click();
    const led = page.locator('.quote-addon-row', { hasText: 'Pantalla LED 4×3' });
    await expect(led.locator('.quote-addon-controls')).toBeHidden();
    const numero = async id => Number((await page.locator(id).innerText()).replace(/[^0-9.]/g, ''));
    const antes = await numero('#quote-addons-subtotal'); // la solicitud de ejemplo ya trae otros servicios
    await led.locator('input[type="checkbox"]').check();
    await expect(led.locator('.quote-addon-controls')).toBeVisible();
    await expect(led.locator('.addon-subtotal')).toContainText('200.00');
    expect((await numero('#quote-addons-subtotal')) - antes).toBe(200);
  });
});

test.describe('Logística como tarjetas', () => {
  test('cada franja tiene su etiqueta de color y sus campos aparecen al marcarla', async ({ page }) => {
    await prepararEvento(page, '14:00', '18:00');
    for (const [casilla, campos, etiqueta] of [['rehearsal', 'rehearsal-fields', 'Ensayo previo'], ['needs-setup', 'setup-fields', 'Montaje'], ['needs-teardown', 'teardown-fields', 'Desmontaje']]) {
      await expect(page.locator('.etiqueta-tecnica').filter({ hasText: new RegExp(`^${etiqueta}$`) })).toBeVisible();
      await expect(page.locator(`#${campos}`)).toBeHidden();
      await page.check(`#${casilla}`);
      await expect(page.locator(`#${campos}`)).toBeVisible();
    }
  });

  test('el resumen de franjas muestra el horario y las horas', async ({ page }) => {
    await prepararEvento(page, '14:00', '18:00');
    await expect(page.locator('#logistics-summary')).toBeHidden();
    await page.check('#needs-setup');
    await page.selectOption('#setup-start', { label: '11:00' });
    await page.selectOption('#setup-end', { label: '13:00' });
    await expect(page.locator('#logistics-summary')).toContainText('Montaje: 11:00 a 13:00 (2 h)');
  });
});
