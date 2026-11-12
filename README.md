# Gestor de eventos — Solicitudes y Cotizaciones

Prototipo web del módulo de **solicitud y cotización del alquiler de un espacio para eventos** de SHOWTECH SOLUTIONS.

## Qué hace hoy

- **Cliente** (`solicitar-fecha.html`): consulta el calendario, elige fecha y horario, registra sus datos (nombre, correo, teléfono y DNI), puede pedir ensayo, montaje y desmontaje, y elegir servicios adicionales (cochera, pantallas LED, micrófonos y teleprompter). Al enviar se crea una solicitud en estado «Nueva».
- **Administrador** (`panel-administracion.html`): consulta y filtra solicitudes, crea la cotización (tarifa por hora, vigencia, servicios y IGV del 18 %), la abre como PDF y ve el calendario mensual y semanal.

## Cómo probarlo

No necesita instalación: abre `solicitar-fecha.html` en el navegador. Los datos se guardan en el `localStorage` del navegador y se cargan datos de ejemplo la primera vez.

## Límites del prototipo

Sin servidor, sin autenticación, sin pagos y con envío de correo o WhatsApp simulado. No hay aceptación ni rechazo de la cotización por parte del cliente.

## Archivos

- `solicitar-fecha.html` — pantalla del cliente
- `panel-administracion.html` — panel del administrador
- `alquiler-app.js` — lógica (disponibilidad, validaciones, cotización, calendario)
- `estilos-alquiler.css` — estilos
