# Gestor de eventos — Solicitudes y Cotizaciones

Prototipo web del módulo de **solicitud y cotización del alquiler de un espacio para eventos** de SHOWTECH SOLUTIONS.

## Qué hace

- **Cliente** (`solicitar-fecha.html`):
  - Consulta el calendario, elige el día y el horario (por hora exacta, de 09:00 a 22:00) con el selector de hora, y registra sus datos: nombre, correo, teléfono y DNI de 8 dígitos.
  - **Servicios adicionales** (cochera, pantallas LED, micrófonos y teleprompter) como tarjetas: al marcar una aparecen sus horas, ya completas con las del evento, y su subtotal en vivo.
  - **Logística** (ensayo, montaje y desmontaje) como tarjetas con etiqueta de color; al marcarlas se piden la fecha y las horas, y debajo se resume cada franja.
  - Un resumen de la solicitud, justo encima del botón de enviar. Al enviar se crea una solicitud en estado «Nueva» y su horario queda ocupado.
- **Administrador** (`panel-administracion.html`, se abre desde el botón «Panel del administrador»; el prototipo no tiene login):
  - Consulta y filtra las solicitudes (con su estado), las **descarta** (liberando su horario) o las reactiva.
  - Crea la cotización: tarifa por hora (S/ 100 por defecto), vigencia de 7, 15 o 30 días, servicios adicionales (con las mismas tarjetas) e IGV del 18 %. Cada cotización recibe un código `COD-001-2026`, estado «En proceso» y estado de pago «Sin pagos».
  - Abre la cotización como **PDF** (con lo que incluye el auditorio y la forma de pago) y elige el canal de envío (el envío es simulado).
  - Ve el calendario de disponibilidad en vista mensual y semanal.
- **Selectores de fecha y hora** iguales a los del gestor de eventos (Flatpickr): panel «Hora» y «Minutos» con botón «Listo» y calendario en español. Los minutos quedan fijos en 00 porque los horarios son por hora exacta.
- **Móvil:** las dos pantallas se adaptan a pantallas chicas: las tablas del administrador se ven como tarjetas, el calendario mensual usa barritas de color (al tocar un día se ve su detalle) y la vista semanal muestra un día por fila.

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

Son 45 pruebas de extremo a extremo (carpeta `tests/`) que abren los HTML directamente, sin servidor. Cubren:

- el flujo del cliente (solicitud, DNI, horarios ocupados) y los precios de los servicios;
- las tarjetas de servicios y de logística y el resumen de franjas;
- los selectores de hora y de fecha (panel, minutos fijos, horas no disponibles, uso dentro del diálogo de cotización);
- la cotización y su PDF, y el panel del administrador (estados, descartar, calendario);
- el diseño: sin desborde horizontal en escritorio y móvil, cabecera y pie alineados, tablas como tarjetas en móvil.

GitHub las ejecuta en cada push y en cada pull request (`.github/workflows/ci.yml`).

## Precios y textos configurables

- Los precios de los servicios adicionales están en `ADDON_CATALOG` (`alquiler-app.js`): cochera de 26 lugares con 3 gratis y S/ 5 por auto y hora, pantalla LED 4×3 a S/ 200 fijo por evento. Los de la pantalla LED 5×4, el teleprompter y los micrófonos adicionales son valores del prototipo **por confirmar**.
- Los textos fijos del PDF (lugar de emisión, lo que incluye el auditorio, forma de pago, cuentas bancarias y firma) están al inicio de `alquiler-app.js` (`QUOTE_CITY`, `QUOTE_INCLUDES`, `QUOTE_PAYMENT_TERMS`, `QUOTE_BANK_ACCOUNTS`, `QUOTE_SIGNATURE`). Las cuentas bancarias y la firma están vacías hasta que la empresa las entregue; mientras tanto no aparecen en el PDF.

## Archivos

- `solicitar-fecha.html` — pantalla del cliente
- `panel-administracion.html` — panel del administrador
- `alquiler-app.js` — lógica (disponibilidad, validaciones, cotización, PDF, calendario)
- `selectores-fecha-hora.js` — selectores de hora y de fecha con Flatpickr; mantienen sincronizados los campos originales sin cambiar la lógica
- `vendor/flatpickr/` — copia de Flatpickr 4.6.13 (licencia MIT) para que funcione sin internet
- `estilos-alquiler.css` — estilos
- `servidor.js` — servidor local para `npm start`
- `tests/` y `playwright.config.js` — pruebas automáticas
- `CLAUDE.md` — contexto del proyecto para quien trabaje en él con Claude Code

## Límites del prototipo

- Sin servidor, sin autenticación (el panel del administrador está abierto), sin pagos y con envío de correo o WhatsApp simulado.
- No hay aceptación ni rechazo de la cotización por parte del cliente.
- El cliente solo se identifica con DNI (no admite RUC ni razón social todavía).
- Los horarios son por hora exacta: no se pueden pedir horas y media ni cuartos de hora.
