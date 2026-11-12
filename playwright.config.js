// Pruebas de extremo a extremo del prototipo. Abren los archivos HTML directamente (file://), sin servidor.
// Usan el Google Chrome instalado (los runners de GitHub ya lo traen), así que no se descarga ningún navegador.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1400, height: 1000 },
    locale: 'es-PE',
    trace: 'retain-on-failure',
  },
});
