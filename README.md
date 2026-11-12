# Gestor de eventos — Solicitudes y Cotizaciones

Prototipo web del módulo de **solicitud y cotización del alquiler de un espacio para eventos** de SHOWTECH SOLUTIONS.

## Qué hace

- **Cliente** (`solicitar-fecha.html`): consulta el calendario, elige fecha y horario, registra sus datos (nombre, correo, teléfono y DNI de 8 dígitos), puede pedir ensayo, montaje y desmontaje, y elegir servicios adicionales (cochera, pantallas LED, micrófonos y teleprompter). Al enviar se crea una solicitud en estado «Nueva» y su horario queda ocupado.
- **Administrador** (`panel-administracion.html`):
  - Consulta y filtra las solicitudes (con su estado), las **descarta** (liberando su horario) o las reactiva.
  - Crea la cotización: tarifa por hora (S/ 100 por defecto), vigencia de 7, 15 o 30 días, servicios adicionales y IGV del 18 %. Cada cotización recibe un código `COD-001-2026`, estado «En proceso» y estado de pago «Sin pagos».
  - Abre la cotización como **PDF** (con lo que incluye el auditorio y la forma de pago) y elige el canal de envío (el envío es simulado).
  - Ve el calendario de disponibilidad en vista mensual y semanal.

## Cómo probarlo

Dos formas:

- **Directo:** abre `solicitar-fecha.html` en el navegador (no necesita instalación).
- **En un puerto:** `npm start` y abre http://localhost:4400 (cliente: `/solicitar-fecha.html`, administrador: `/panel-administracion.html`). Puedes cambiar el puerto con la variable `PORT`. El servidor no tiene dependencias y solo escucha en tu equipo.

Los datos de un modo y del otro **no se comparten**: el navegador guarda cada dirección por separado. Los datos se guardan en el `localStorage` del navegador y empiezan con ejemplos que siempre caen en los próximos días. Para volver a los datos de ejemplo, borra los datos del sitio en el navegador.

## Pruebas automáticas

Requisitos: [Node.js](https://nodejs.org/) 22 o superior y Google Chrome instalado.

```
npm install
npm test
```

Las pruebas (carpeta `tests/`) abren los HTML directamente, sin servidor, y cubren el flujo del cliente, los precios, la cotización y su PDF, el panel del administrador (estados, descartar, calendario) y el diseño (sin desborde horizontal en escritorio y móvil, cabecera y pie alineados). GitHub las ejecuta en cada push y en cada pull request (`.github/workflows/ci.yml`).

## Precios y textos configurables

- Los precios de los servicios adicionales están en `ADDON_CATALOG` (`alquiler-app.js`): cochera de 26 lugares con 3 gratis y S/ 5 por auto y hora, pantalla LED 4×3 a S/ 200 fijo por evento. Los de la pantalla LED 5×4, el teleprompter y los micrófonos adicionales son valores del prototipo **por confirmar**.
- Los textos fijos del PDF (lugar de emisión, lo que incluye el auditorio, forma de pago, cuentas bancarias y firma) están al inicio de `alquiler-app.js` (`QUOTE_CITY`, `QUOTE_INCLUDES`, `QUOTE_PAYMENT_TERMS`, `QUOTE_BANK_ACCOUNTS`, `QUOTE_SIGNATURE`). Las cuentas bancarias y la firma están vacías hasta que la empresa las entregue; mientras tanto no aparecen en el PDF.

## Archivos

- `solicitar-fecha.html` — pantalla del cliente
- `panel-administracion.html` — panel del administrador
- `alquiler-app.js` — lógica (disponibilidad, validaciones, cotización, PDF, calendario)
- `selector-hora.js` — selector de hora (panel «Hora» con botón «Listo», como el del gestor de eventos); mejora las listas de hora sin cambiar la lógica
- `estilos-alquiler.css` — estilos
- `tests/` y `playwright.config.js` — pruebas automáticas

## Límites del prototipo

Sin servidor, sin autenticación, sin pagos y con envío de correo o WhatsApp simulado. No hay aceptación ni rechazo de la cotización por parte del cliente. El cliente solo se identifica con DNI (no admite RUC ni razón social todavía).
