const { test, expect } = require('@playwright/test');
const { CLIENTE, ADMIN, elegirDiaLibre, elegirHorario } = require('./ayudas');

// Campo visible (Flatpickr) que acompaña a la lista oculta de cada hora.
const campo = (page, id) => page.locator(`#${id}`).locator('xpath=..').locator('.selector-entrada');
const panelAbierto = page => page.locator('.flatpickr-calendar.open');

test.describe('Selector de hora (Flatpickr, como el gestor de eventos)', () => {
  test('el panel muestra Hora, Minutos y «Listo»; las flechas actualizan la hora y «Listo» cierra', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await campo(page, 'start-time').click();
    const panel = panelAbierto(page);
    await expect(panel).toBeVisible();
    await expect(panel.locator('.fp-col-title').nth(0)).toHaveText('Hora');
    await expect(panel.locator('.fp-col-title').nth(1)).toHaveText('Minutos');

    const horas = panel.locator('.numInputWrapper', { has: page.locator('.flatpickr-hour') });
    await horas.locator('.arrowUp').click(); // 09 → 10
    await horas.locator('.arrowUp').click(); // 10 → 11
    await expect(campo(page, 'start-time')).toHaveValue('11:00');
    await expect(page.locator('#start-time')).toHaveValue('11:00'); // la lista oculta guarda el valor
    await panel.locator('.btn-fp-listo').click();
    await expect(panelAbierto(page)).toHaveCount(0);
  });

  test('los minutos quedan fijos en 00 (los horarios son por hora exacta)', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await campo(page, 'start-time').click();
    const minutos = panelAbierto(page).locator('.flatpickr-minute');
    await expect(minutos).toHaveValue('00');
    await expect(minutos).toHaveJSProperty('readOnly', true);
  });

  test('una hora que no está disponible se rechaza con un aviso y no se guarda', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '10:00', '13:00'); // la hora de fin solo ofrece de 11:00 en adelante
    await campo(page, 'end-time').click();
    const panel = panelAbierto(page);
    const horas = panel.locator('.numInputWrapper', { has: page.locator('.flatpickr-hour') });
    await horas.locator('.arrowDown').click(); // 13 → 12
    await horas.locator('.arrowDown').click(); // 12 → 11
    await horas.locator('.arrowDown').click(); // 11 → 10: es la hora de inicio, no vale como fin
    await expect(campo(page, 'end-time').locator('xpath=..').locator('.selector-aviso')).toContainText('no está disponible');
    await expect(page.locator('#end-time')).not.toHaveValue('10:00');
  });

  test('Escape cierra el panel y tocar la etiqueta lo abre', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await page.locator('label[for="start-time"]').click();
    await expect(panelAbierto(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panelAbierto(page)).toHaveCount(0);
  });

  test('los servicios adicionales usan el mismo selector y se habilitan al marcarlos', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '09:00', '14:00');
    await expect(campo(page, 'request-addon-parking-start')).toBeDisabled();
    await page.check('#request-addon-parking');
    await expect(campo(page, 'request-addon-parking-start')).toBeEnabled();
    await expect(campo(page, 'request-addon-parking-start')).toHaveValue('09:00');
    await expect(campo(page, 'request-addon-parking-end')).toHaveValue('14:00');
  });

  test('al limpiar el formulario el campo se vacía', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '09:00', '13:00');
    await expect(campo(page, 'start-time')).toHaveValue('09:00');
    await page.evaluate(() => document.getElementById('request-form').reset());
    await expect(campo(page, 'start-time')).toHaveValue('');
  });
});

test.describe('Selector de hora dentro del formulario de cotización (cuadro de diálogo)', () => {
  test('el panel se ve y se puede usar, no queda tapado por el diálogo', async ({ page }) => {
    await page.goto(ADMIN);
    await page.locator('#requests-body [data-create-quote]').first().click();
    const led = page.locator('.quote-addon-row', { hasText: 'Pantalla LED 4×3' });
    await led.locator('input[type="checkbox"]').check();
    await led.locator('.selector-entrada').first().click();
    const horas = panelAbierto(page).locator('.numInputWrapper', { has: page.locator('.flatpickr-hour') });
    await horas.locator('.arrowUp').click({ timeout: 5000 }); // si el diálogo lo tapara, este clic fallaría
    await expect(page.locator('#quote-addon-led-43-start')).toHaveValue('15:00');
    await expect(led.locator('.selector-entrada').first()).toHaveValue('15:00');
  });
});

test.describe('Selector de fecha (calendario de Flatpickr)', () => {
  test('muestra dd/mm/aaaa, abre un calendario en español y guarda la fecha en formato ISO', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await elegirHorario(page, '14:00', '18:00');
    await page.check('#needs-setup');
    const fecha = campo(page, 'setup-date');
    await expect(fecha).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(await page.locator('#setup-date').inputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await fecha.click();
    const panel = panelAbierto(page);
    await expect(panel.locator('.flatpickr-monthDropdown-months')).toBeVisible();
    await expect(panel.locator('.flatpickr-weekday').first()).toContainText(/Lun/i);
    // Solo se puede elegir el día anterior al evento o el mismo día
    const habilitados = panel.locator('.flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)');
    expect(await habilitados.count()).toBeLessThanOrEqual(2);
    await habilitados.first().click();
    await expect(page.locator('#setup-date')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  });
});

test.describe('Selector de hora en móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('el panel cabe en la pantalla', async ({ page }) => {
    await page.goto(CLIENTE);
    await elegirDiaLibre(page);
    await campo(page, 'start-time').tap();
    const caja = await panelAbierto(page).boundingBox();
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(390);
  });
});
