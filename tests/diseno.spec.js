const { test, expect } = require('@playwright/test');
const { ADMIN, CLIENTE } = require('./ayudas');

const tamanos = [
  { nombre: 'escritorio 1531', ancho: 1531, alto: 870 },
  { nombre: 'pantalla ancha 1914', ancho: 1914, alto: 1088 },
  { nombre: 'móvil 390', ancho: 390, alto: 844 },
];

for (const { nombre, ancho, alto } of tamanos) {
  for (const [pagina, archivo] of [['cliente', CLIENTE], ['administrador', ADMIN]]) {
    test(`${pagina} (${nombre}): sin desborde horizontal y con el pie en el borde inferior`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: alto });
      await page.goto(archivo);
      const medidas = await page.evaluate(() => ({
        anchoDocumento: document.documentElement.scrollWidth,
        anchoVentana: innerWidth,
        pieAbajo: Math.round(document.querySelector('.site-footer').getBoundingClientRect().bottom),
        altoVentana: innerHeight,
        altoDocumento: document.documentElement.scrollHeight,
      }));
      expect(medidas.anchoDocumento).toBeLessThanOrEqual(medidas.anchoVentana);
      // El pie queda al final del documento y, si la página es corta, pegado al borde inferior de la pantalla.
      expect(medidas.pieAbajo).toBeGreaterThanOrEqual(Math.min(medidas.altoVentana, medidas.altoDocumento) - 1);
    });
  }
}

test('la cabecera y el pie se alinean con el contenido en pantallas anchas', async ({ page }) => {
  await page.setViewportSize({ width: 1914, height: 1088 });
  for (const archivo of [CLIENTE, ADMIN]) {
    await page.goto(archivo);
    const m = await page.evaluate(() => {
      const caja = selector => document.querySelector(selector).getBoundingClientRect();
      const pagina = document.querySelector('.page');
      const estilo = getComputedStyle(pagina);
      return {
        cabecera: Math.round(caja('.marca').left),
        pie: Math.round(document.querySelector('.site-footer span').getBoundingClientRect().left),
        contenido: Math.round(pagina.getBoundingClientRect().left + parseFloat(estilo.paddingLeft)),
      };
    });
    expect(m.cabecera).toBe(m.contenido);
    expect(m.pie).toBe(m.contenido);
  }
});

test('el formulario de cotización no se desborda en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ADMIN);
  await page.locator('#requests-body [data-create-quote]').first().click();
  await expect(page.locator('#quote-dialog')).toHaveAttribute('open', '');
  const { ancho, visible } = await page.evaluate(() => {
    const d = document.querySelector('#quote-dialog');
    return { ancho: d.scrollWidth, visible: d.clientWidth };
  });
  expect(ancho).toBeLessThanOrEqual(visible + 1);
});
