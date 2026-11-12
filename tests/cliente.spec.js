const { test, expect } = require('@playwright/test');
const { CLIENTE, ADMIN, elegirDiaLibre, elegirHorario, llenarDatos, enviarSolicitud } = require('./ayudas');

test.describe('Pantalla del cliente', () => {
  test('el cliente registra una solicitud y aparece en el panel del administrador', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Ana Prueba', dni: '87654321' });
    await page.goto(ADMIN);
    const fila = page.locator('#requests-body tr', { hasText: 'Ana Prueba' });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText('87654321');
    await expect(fila).toContainText('Nueva');
  });

  test('el DNI solo admite dígitos y muestra un mensaje si está incompleto', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '09:00', '13:00');
    await llenarDatos(page, { dni: '' });
    await page.type('#dni', 'ab12-34');
    await expect(page.locator('#dni')).toHaveValue('1234');
    await page.locator('#phone').focus();
    await expect(page.locator('#dni-error')).toBeVisible();
    await expect(page.locator('#dni-error')).toContainText('exactamente 8 dígitos');
    await expect(page.locator('#submit-request')).toBeDisabled();

    await page.fill('#dni', '12345678');
    await page.locator('#phone').focus();
    await expect(page.locator('#dni-error')).toBeHidden();
    await expect(page.locator('#submit-request')).toBeEnabled();
  });

  test('cochera: 3 autos gratis y S/ 5 por auto y hora; tope de 26', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '09:00', '14:00');
    await page.check('#request-addon-parking');
    await page.selectOption('#request-addon-parking-start', { label: '09:00' });
    await page.selectOption('#request-addon-parking-end', { label: '13:00' });
    await expect(page.locator('#request-addon-parking-quantity')).toHaveAttribute('max', '26');

    await page.fill('#request-addon-parking-quantity', '3');
    await expect(page.locator('#summary-addons-total')).toContainText('0.00');
    await page.fill('#request-addon-parking-quantity', '5'); // 2 autos de pago × 4 h × S/ 5
    await expect(page.locator('#summary-addons-total')).toContainText('40.00');
  });

  test('pantalla LED 4×3: S/ 200 fijos por evento; micrófonos: S/ 5 por unidad y hora', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '09:00', '14:00');
    await page.check('#request-addon-led-43');
    await page.selectOption('#request-addon-led-43-start', { label: '09:00' });
    await page.selectOption('#request-addon-led-43-end', { label: '14:00' });
    await expect(page.locator('#summary-addons-total')).toContainText('200.00');

    await page.check('#request-addon-microphones');
    await page.selectOption('#request-addon-microphones-start', { label: '09:00' });
    await page.selectOption('#request-addon-microphones-end', { label: '12:00' });
    await page.fill('#request-addon-microphones-quantity', '2'); // 2 × 3 h × S/ 5 = 30
    await expect(page.locator('#summary-addons-total')).toContainText('230.00');
  });

  test('un horario ocupado no se puede elegir de nuevo', async ({ page }) => {
    await enviarSolicitud(page, { nombre: 'Primera Reserva', inicio: '09:00', fin: '13:00' });
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    const inicios = await page.locator('#start-time option').allTextContents();
    expect(inicios).not.toContain('09:00');
    expect(inicios).not.toContain('12:00');
    expect(inicios).toContain('13:00'); // tocarse en el borde es válido
  });
});
