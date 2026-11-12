const { test, expect } = require('@playwright/test');
const { CLIENTE, ADMIN, elegirDiaLibre, enviarSolicitud } = require('./ayudas');

const boton = (page, id) => page.locator(`#${id} + .hora-trigger`);

test.describe('Selector de hora (panel «Hora» con botón «Listo»)', () => {
  test('abre el panel, elige una hora y «Listo» lo cierra', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await expect(page.locator('.hora-panel')).toBeHidden();

    await boton(page, 'start-time').click();
    await expect(page.locator('.hora-panel')).toBeVisible();
    await expect(page.locator('.hora-panel-titulo')).toHaveText('Hora');
    await expect(page.locator('.hora-opcion')).toHaveCount(14); // 09:00 a 22:00

    await page.locator('.hora-opcion', { hasText: '10:00' }).click();
    await expect(page.locator('#start-time')).toHaveValue('10:00'); // la lista oculta guarda el valor
    await expect(boton(page, 'start-time')).toContainText('10:00');
    await page.locator('.btn-hora-listo').click();
    await expect(page.locator('.hora-panel')).toBeHidden();
  });

  test('la hora de fin solo ofrece horas posteriores al inicio y se habilita el envío', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await boton(page, 'start-time').click();
    await page.locator('.hora-opcion', { hasText: '09:00' }).click();
    await page.locator('.btn-hora-listo').click();

    await boton(page, 'end-time').click();
    await expect(page.locator('.hora-opcion', { hasText: '09:00' })).toBeDisabled(); // no puede terminar antes de empezar
    await expect(page.locator('.hora-opcion', { hasText: '10:00' })).toBeEnabled();
    await page.locator('.hora-opcion', { hasText: '13:00' }).click();
    await page.locator('.btn-hora-listo').click();
    await expect(page.locator('#summary-time')).toContainText('09:00 a 13:00');
  });

  test('las horas ocupadas aparecen deshabilitadas', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Reserva Previa', inicio: '09:00', fin: '13:00' });
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await boton(page, 'start-time').click();
    await expect(page.locator('.hora-opcion', { hasText: '10:00' })).toBeDisabled();
    await expect(page.locator('.hora-opcion', { hasText: '13:00' })).toBeEnabled();
  });

  test('Escape cierra el panel y tocar fuera también', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await boton(page, 'start-time').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.hora-panel')).toBeHidden();
    await expect(boton(page, 'start-time')).toBeFocused();

    await boton(page, 'start-time').click();
    await page.locator('h1').click();
    await expect(page.locator('.hora-panel')).toBeHidden();
  });

  test('tocar la etiqueta del campo abre su selector', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await page.locator('label[for="start-time"]').click();
    await expect(page.locator('.hora-panel')).toBeVisible();
  });

  test('los servicios adicionales usan el mismo selector y quedan deshabilitados hasta marcarlos', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await boton(page, 'start-time').click();
    await page.locator('.hora-opcion', { hasText: '09:00' }).click();
    await page.locator('.btn-hora-listo').click();
    await boton(page, 'end-time').click();
    await page.locator('.hora-opcion', { hasText: '14:00' }).click();
    await page.locator('.btn-hora-listo').click();

    await expect(boton(page, 'request-addon-parking-start')).toBeDisabled();
    await page.check('#request-addon-parking');
    await expect(boton(page, 'request-addon-parking-start')).toBeEnabled();
    await expect(boton(page, 'request-addon-parking-start')).toContainText('09:00');
    await boton(page, 'request-addon-parking-end').click();
    await page.locator('.hora-opcion', { hasText: '12:00' }).click();
    await page.locator('.btn-hora-listo').click();
    await expect(page.locator('#request-addon-parking-end')).toHaveValue('12:00');
  });

  test('el panel del administrador también lo usa y al limpiar el formulario el botón se reinicia', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await boton(page, 'start-time').click();
    await page.locator('.hora-opcion', { hasText: '09:00' }).click();
    await page.locator('.btn-hora-listo').click();
    await page.evaluate(() => document.getElementById('request-form').reset());
    await expect(boton(page, 'start-time')).not.toContainText('09:00');

    await page.goto(ADMIN);
    await page.locator('#requests-body [data-create-quote]').first().click();
    await expect(boton(page, 'quote-addon-parking-start')).toHaveCount(1);
  });
});

test.describe('Selector de hora en móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('el panel cabe en la pantalla', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await boton(page, 'start-time').tap();
    const caja = await page.locator('.hora-panel').boundingBox();
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(390);
    expect(caja.y).toBeGreaterThanOrEqual(0);
    expect(caja.y + caja.height).toBeLessThanOrEqual(844);
  });
});
