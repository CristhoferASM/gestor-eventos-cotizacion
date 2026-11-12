# CLAUDE.md

Este archivo da contexto a Claude Code al trabajar en este repositorio.

Responde siempre en español (conversación, comentarios de código, mensajes de commit y documentación). Explica las cosas en español sencillo. No hagas commit ni push sin que el usuario lo pida expresamente.

## Qué es este proyecto

Módulo **Solicitudes y Cotizaciones** del Gestor de eventos de SHOWTECH SOLUTIONS, desarrollado durante unas prácticas junto con un ingeniero y otros compañeros. Es el flujo que viene **antes** del módulo de modificación de eventos (repositorio `CristhoferASM/gestor-eventos-api`, backend en Go + Angular, ya conectado a la base de datos de la empresa). El módulo está en desarrollo: este repositorio contiene el prototipo web.

Este repositorio hoy contiene solo el **prototipo web** (HTML, CSS y JavaScript, sin servidor): `solicitar-fecha.html` (cliente), `panel-administracion.html` (administrador), `alquiler-app.js` y `estilos-alquiler.css`. Los datos viven en `localStorage` con datos de ejemplo. No hay autenticación, pagos reales ni envío real de correo o WhatsApp.

## Flujo que implementa el prototipo

1. El **cliente** consulta el calendario, elige fecha y horario (franjas de una hora entre 09:00 y 22:00), registra nombre, correo, teléfono y DNI (8 dígitos), puede pedir ensayo, montaje y desmontaje, y elegir adicionales (cochera por auto y hora hasta 30 autos, pantalla LED 5×4, pantalla LED 4×3, micrófonos por unidad y hora con tope de 10, teleprompter) con su rango horario. Se crea una solicitud «Nueva».
2. El **administrador** revisa la solicitud y crea la cotización: tarifa por hora × duración + adicionales, más IGV del 18 %, vigencia de 7, 15 o 30 días, detalle de servicios y notas. Código `COD-001-2026`, estado «En proceso», PDF y envío simulado por correo o WhatsApp. La solicitud pasa a «Cotizada». También hay calendario mensual y semanal.
3. No existe todavía: aceptación o rechazo del cliente, conversión en reserva, edición o reenvío de la cotización, pagos.

## Documentos de referencia (fuera del repositorio; los entrega el equipo del proyecto)

- `HU_SOL_COT_003_Solicitar_Cotizar_Espacio.pdf`: historia de usuario v3.0 con 15 criterios de aceptación, reglas RN-SC-001 a 019 y 11 aspectos **pendientes de definición** (sección 12). No inventes la respuesta a esos pendientes.
- `DiseñoGestionSistEventos.xlsx`: procesos, roles, configuración de precios y disponibilidad, login (Google, Facebook y doble factor) y reglas de negocio (por ejemplo, si se paga sin adelanto se activa el adelanto incluido). Tecnología indicada: Golang.
- Diagramas BPMN «Realizar cotización de alquiler» (el asesor cotiza, el cliente evalúa y acepta o vuelve al asesor) y «Proformar horario de evento» (consultar horarios libres y proformar).

## Contradicciones por aclarar con el ingeniero

- Cochera: la historia dice hasta 30 autos y el Excel dice capacidad máxima de 26.
- Horario: el prototipo usa 09:00–22:00 y el Excel dice 6 AM–10 PM (el módulo de modificación ya usa 06:00–22:00).
- Acceso: el Excel pide Google, Facebook y doble factor; el prototipo no tiene login. En el módulo de modificación se omitió Facebook a propósito.
- Quién solicita: el Excel habla de una interfaz pública y abierta; la base de datos tiene canal PUBLICO o ASESOR.
- La historia figura con sprint 3 y sprint 2, y con ID 001 en el texto y 003 en el nombre del archivo.

## Cotización real de referencia (documento que la empresa envía hoy a un cliente)

Es un documento Word/PDF con membrete, razón social y RUC del cliente, actividad, fecha, hora y duración, precio «S/ 500 + IGV» (5 horas), servicios adicionales con su precio + IGV (ejemplo: pantalla LED 4×3 a S/ 200 + IGV, «incluye estructura y procesador»), costo total sin IGV, IGV y total, lista de lo que incluye el auditorio (737 butacas, consola de sonido, parlantes, micrófonos, luces, proyector, aire acondicionado, limpieza), lugar y fecha de emisión, forma de pago (adelanto del 50 % o el total para garantizar la fecha; el resto una semana antes del evento), cuenta bancaria, firma del gerente general, y un número correlativo con fecha y nombre del cliente. **No copies al repositorio datos de clientes ni cuentas bancarias reales de ese documento.**

**Ya aplicado en el prototipo (12/11/2026), tomado de ese documento:** tarifa por defecto S/ 100 por hora (S/ 500 por 5 h); cochera de 26 lugares con 3 gratis y S/ 5 por auto y hora para el resto (`addonCost` en `alquiler-app.js`); pantalla LED 4×3 a S/ 200 fijo por evento (incluye estructura y procesador). Por eso el ejemplo S/ 554.60 de la historia de usuario (que usaba cochera a S/ 10 por hora) ya no coincide.

**Por confirmar con el ingeniero:** el cliente puede ser una empresa con **RUC** (el prototipo solo pide DNI); el documento real no da precio de la pantalla LED 5×4, del teleprompter ni de micrófonos adicionales (el documento incluye 2 micrófonos en el precio base), así que esos precios siguen siendo los del prototipo original; el número de cotización real es correlativo con fecha (no `COD-001-2026`); si el LED 4×3 es fijo por evento o depende de las horas.

## Base de datos de la empresa (esquema `showtech`, PostgreSQL 18 en Neon)

Ya modela este módulo; el administrador es Leonardo Casas Vilchez. Tablas: `solicitud_cotizacion` (estados NUEVA, EN_REVISION, COTIZADA, DESCARTADA; canal PUBLICO o ASESOR), `cotizacion` (EN_PROCESO, ENVIADA, ACEPTADA, RECHAZADA, VENCIDA, REEMPLAZADA), `cotizacion_adicional` y `cotizacion_envio`. El evento nace CON_SOLICITUD_COTIZACION, pasa a COTIZADO y luego a RESERVADO, CON_ADELANTO, PAGADO y REALIZADO. En `gestor-eventos-api` hay un backend que ya se conecta a esa base y se explica en su `CLAUDE.md`; léelo antes de proponer una integración. Nunca imprimas ni subas cadenas de conexión.

## Pendiente de decidir

Si se entrega solo el prototipo web terminado, o si se lleva a Go + Angular sobre la base de la empresa como el módulo de modificación. Pregunta al usuario antes de asumirlo.

## Forma de trabajar

- Antes de editar, revisa el código real y conserva los cambios existentes.
- Trabaja por avances concretos y pequeños.
- Respeta el diseño y comportamiento del prototipo existente salvo que el usuario pida cambiarlos.
