(() => {
  "use strict";

  const STORAGE_KEY = "alquiler-espacios-demo-v2";
  const openingHour = 9;
  const closingHour = 22;
  const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const longMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const paymentClass = { "Pagado": "paid", "Pago incompleto": "partial", "Sin pagos": "unpaid" };
  const ADDON_CATALOG = [
    // Cochera: 26 lugares, los 3 primeros gratis y el resto S/ 5 por auto y hora (cotización real de la empresa).
    { key: "parking", label: "Cochera", rate: 5, quantityLimit: 26, freeQuantity: 3 },
    { key: "led54", label: "Pantalla LED 5×4", rate: 200 },
    // Pantalla LED 4×3: S/ 200 por evento, incluye estructura y procesador (cotización real de la empresa).
    { key: "led43", label: "Pantalla LED 4×3", rate: 200, flat: true },
    { key: "microphones", label: "Micrófonos", rate: 5 },
    { key: "teleprompter", label: "Teleprompter", rate: 10 }
  ];
  // Textos fijos del PDF de la cotización, tomados de la cotización real de la empresa. Se editan aquí.
  const QUOTE_CITY = "Lince";
  const QUOTE_INCLUDES = [
    "Local con 737 butacas, 1 podio, 3 mesas plegables color negro, 20 sillas de plástico, 2 mesas de melamina (negro) en hall para recepción, vestuario y 4 baños para damas y caballeros cada uno",
    "Consola de sonido BERINGER X32 PRODUCER",
    "10 parlantes JBL",
    "2 micrófonos inalámbricos de mano SHURE",
    "1 persona de soporte audiovisual y 1 operador de luces de colores",
    "Proyector VIVITEK 3000 LUMENS (incluye HDMI) + Ecram 5x4",
    "Servicio de limpieza antes y después del evento",
    "6 barras led PIXEL",
    "12 parleds LUXON",
    "04 cabezas móviles MINI HOT BEAM",
    "Sistema de aire acondicionado",
    "03 estacionamientos gratis y 23 estacionamientos de pago a 5 soles la hora de uso"
  ];
  const QUOTE_PAYMENT_TERMS = [
    "Adelanto del 50 % o la totalidad para garantizar la reserva de la fecha del evento.",
    "El resto será abonado una semana antes del evento (horario de atención: lunes a viernes de 9 a. m. a 5 p. m.)."
  ];
  // PENDIENTE de configurar con la empresa: cuentas bancarias, p. ej. [{ entidad, titular, tipo, cuenta, cci }], y quién firma, p. ej. "Nombre — Gerente general".
  const QUOTE_BANK_ACCOUNTS = [];
  const QUOTE_SIGNATURE = "";
  // Importe de un servicio adicional (sin IGV): precio fijo por evento, o tarifa por hora × unidades que se cobran.
  function addonCost(item, hours, quantity) {
    if (item.flat) return item.rate;
    const billable = Math.max(0, quantity - (item.freeQuantity || 0));
    return item.rate * hours * billable;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pad = value => String(value).padStart(2, "0");
  const toISO = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const parseISO = value => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const addDays = (value, count) => {
    const date = parseISO(value);
    date.setDate(date.getDate() + count);
    return toISO(date);
  };
  const timeOptions = () => Array.from({ length: closingHour - openingHour + 1 }, (_, index) => `${pad(openingHour + index)}:00`);
  const formatDate = (value, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) =>
    parseISO(value).toLocaleDateString("es-PE", options);
  const formatShortDate = value =>
    parseISO(value).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;
  const money = value => `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hoursBetween = (start, end) => Number(end.slice(0, 2)) - Number(start.slice(0, 2));
  const addHours = (time, count) => `${pad(Number(time.slice(0, 2)) + count)}:00`;
  // Los datos de ejemplo se desplazan para que siempre caigan en los próximos días (no en fechas ya vencidas).
  const daysBetween = (from, to) => Math.round((parseISO(to) - parseISO(from)) / 86400000);
  function shiftDates(value, days) {
    if (typeof value === "string") return /^\d{4}-\d{2}-\d{2}$/.test(value) ? addDays(value, days) : value;
    if (Array.isArray(value)) return value.map(item => shiftDates(item, days));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shiftDates(item, days)]));
    return value;
  }
  function sampleData() {
    // La fecha de ejemplo más temprana (4 oct. 2026) pasa a ser 3 días después de hoy.
    return shiftDates(rawSampleData(), daysBetween("2026-10-04", toISO(today)) + 3);
  }
  function rawSampleData() {
    return {
      requests: [
        { id: "REQ-101", name: "Mariana Salazar", dni: "12345678", email: "mariana.salazar@correo.pe", phone: "987 654 321", date: "2026-10-22", start: "14:00", end: "18:00", addons: [{ key: "parking", start: "14:00", end: "18:00", hours: 4, quantity: 2 }, { key: "led54", start: "14:00", end: "18:00", hours: 4, quantity: 1 }, { key: "microphones", start: "14:00", end: "16:00", hours: 2, quantity: 2 }], rehearsal: false, rehearsalDate: "", rehearsalStart: "", rehearsalEnd: "", setupDate: "2026-10-22", setupStart: "12:00", setupEnd: "14:00", teardownDate: "2026-10-22", teardownStart: "18:00", teardownEnd: "19:00", notes: "Montaje desde una hora antes.", status: "Nueva", createdAt: "2026-10-10" },
        { id: "REQ-102", name: "Diego Ramírez", email: "diego.ramirez@estudio.pe", phone: "965 218 470", date: "2026-10-24", start: "16:00", end: "21:00", rehearsal: true, rehearsalDate: "2026-10-23", rehearsalStart: "16:00", rehearsalEnd: "17:00", setupDate: "2026-10-24", setupStart: "14:00", setupEnd: "16:00", teardownDate: "2026-10-24", teardownStart: "21:00", teardownEnd: "22:00", notes: "Ensayo de sonido el día anterior.", status: "En revisión", createdAt: "2026-10-11" },
        { id: "REQ-103", name: "Valeria Paredes", email: "valeria.paredes@mail.pe", phone: "944 321 786", date: "2026-10-29", start: "13:00", end: "17:00", rehearsal: false, rehearsalDate: "", rehearsalStart: "", rehearsalEnd: "", setupDate: "", setupStart: "", setupEnd: "", teardownDate: "", teardownStart: "", teardownEnd: "", notes: "Evento para 80 asistentes.", status: "Cotizada", createdAt: "2026-10-12" }
      ],
      bookings: [
        { id: "RES-201", requestId: "", name: "Lucía Fernández", email: "lucia.fernandez@correo.pe", phone: "986 421 357", date: "2026-10-05", start: "09:00", end: "12:00", rehearsal: true, rehearsalDate: "2026-10-04", rehearsalStart: "15:00", rehearsalEnd: "16:00", setupDate: "2026-10-05", setupStart: "08:00", setupEnd: "09:00", teardownDate: "2026-10-05", teardownStart: "12:00", teardownEnd: "13:00", status: "Aceptada", paymentStatus: "Pagado", quoteId: "COT-301" },
        { id: "RES-202", requestId: "", name: "Andrés Molina", email: "andres.molina@empresa.pe", phone: "955 410 782", date: "2026-10-10", start: "09:00", end: "22:00", rehearsal: false, paymentStatus: "Sin pagos", status: "Aceptada", quoteId: "" },
        { id: "RES-203", requestId: "", name: "Camila Torres", email: "camila.torres@correo.pe", phone: "977 543 210", date: "2026-10-14", start: "10:00", end: "13:00", rehearsal: false, paymentStatus: "Pago incompleto", status: "Aceptada", quoteId: "" },
        { id: "RES-204", requestId: "", name: "Javier Rojas", email: "javier.rojas@correo.pe", phone: "989 334 125", date: "2026-10-20", start: "09:00", end: "22:00", rehearsal: false, paymentStatus: "Pagado", status: "Aceptada", quoteId: "" },
        { id: "RES-205", requestId: "", name: "Sofía Castillo", email: "sofia.castillo@correo.pe", phone: "943 112 786", date: "2026-10-29", start: "13:00", end: "17:00", rehearsal: false, paymentStatus: "Sin pagos", status: "Aceptada", quoteId: "" }
      ],
      quotes: [
        { id: "COT-301", requestId: "", bookingId: "RES-201", client: "Lucía Fernández", email: "lucia.fernandez@correo.pe", phone: "986 421 357", date: "2026-10-05", start: "09:00", end: "12:00", amount: 2450, services: "Alquiler del espacio por 3 horas, mobiliario para 60 personas y equipo de sonido básico.", validity: 7, notes: "", status: "Aceptada", paymentStatus: "Pagado", createdAt: "2026-10-01" },
        { id: "COT-302", requestId: "REQ-102", bookingId: "", client: "Diego Ramírez", email: "diego.ramirez@estudio.pe", phone: "965 218 470", date: "2026-10-24", start: "16:00", end: "21:00", amount: 3800, services: "Alquiler del espacio, equipo de sonido y asistencia técnica.", validity: 15, notes: "Ensayo previo por coordinar.", status: "Esperando respuesta", paymentStatus: "Sin pagos", createdAt: "2026-10-11" },
        { id: "COT-303", requestId: "REQ-103", bookingId: "", client: "Valeria Paredes", email: "valeria.paredes@mail.pe", phone: "944 321 786", date: "2026-10-29", start: "13:00", end: "17:00", amount: 1950, services: "Alquiler del espacio por 4 horas y mobiliario para 80 asistentes.", validity: 7, notes: "", status: "En proceso", paymentStatus: "Pago incompleto", createdAt: "2026-10-12" }
      ]
    };
  }

  function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Se guardan los datos de ejemplo y se leen por el mismo camino que en las demás cargas, para que las cotizaciones
      // de ejemplo también traigan el ensayo, montaje y desmontaje de su solicitud desde la primera vez.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData()));
      return loadData();
    }
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.requests) && Array.isArray(parsed.bookings) && Array.isArray(parsed.quotes)) {
        const examples = sampleData();
        for (const collection of ["requests", "bookings", "quotes"]) {
          const defaults = new Map(examples[collection].map(item => [item.id, item]));
          parsed[collection] = parsed[collection].map(item => ({
            ...(defaults.get(item.id) || {}),
            ...item,
            ...(collection === "requests" ? {
              rehearsalDate: item.rehearsalDate || defaults.get(item.id)?.rehearsalDate || "",
              rehearsalStart: item.rehearsalStart || defaults.get(item.id)?.rehearsalStart || "",
              rehearsalEnd: item.rehearsalEnd || defaults.get(item.id)?.rehearsalEnd || "",
              setupDate: item.setupDate || defaults.get(item.id)?.setupDate || "",
              setupStart: item.setupStart || defaults.get(item.id)?.setupStart || "",
              setupEnd: item.setupEnd || defaults.get(item.id)?.setupEnd || "",
              teardownDate: item.teardownDate || defaults.get(item.id)?.teardownDate || "",
              teardownStart: item.teardownStart || defaults.get(item.id)?.teardownStart || "",
              teardownEnd: item.teardownEnd || defaults.get(item.id)?.teardownEnd || ""
            } : {}),
            paymentStatus: item.paymentStatus || defaults.get(item.id)?.paymentStatus || "Sin pagos"
          }));
        }
        parsed.quotes = parsed.quotes.map(quote => {
          const request = parsed.requests.find(item => item.id === quote.requestId);
          return request ? {
            ...request,
            ...quote,
            rehearsal: quote.rehearsal ?? request.rehearsal,
            rehearsalDate: quote.rehearsalDate || request.rehearsalDate,
            rehearsalStart: quote.rehearsalStart || request.rehearsalStart,
            rehearsalEnd: quote.rehearsalEnd || request.rehearsalEnd,
            setupDate: quote.setupDate || request.setupDate,
            setupStart: quote.setupStart || request.setupStart,
            setupEnd: quote.setupEnd || request.setupEnd,
            teardownDate: quote.teardownDate || request.teardownDate,
            teardownStart: quote.teardownStart || request.teardownStart,
            teardownEnd: quote.teardownEnd || request.teardownEnd
          } : quote;
        });
        return parsed;
      }
      throw new Error("El contenido guardado no tiene el formato esperado.");
    } catch (error) {
      console.error("No se pudieron leer los datos guardados del prototipo.", error);
      const initial = sampleData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  let data = loadData();
  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function synchronizeStorage(onUpdate) {
    window.addEventListener("storage", event => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) {
        data = sampleData();
      } else {
        try {
          const parsed = JSON.parse(event.newValue);
          if (!Array.isArray(parsed.requests) || !Array.isArray(parsed.bookings) || !Array.isArray(parsed.quotes)) {
            throw new Error("El contenido sincronizado no tiene el formato esperado.");
          }
          data = parsed;
        } catch (error) {
          console.error("No se pudieron sincronizar los datos entre las vistas.", error);
          return;
        }
      }
      onUpdate();
    });
  }

  function calendarRecords() {
    const confirmed = data.bookings.map(item => ({ ...item, kind: "reserved" }));
    const pending = data.requests
      .filter(isPendingRequest)
      .map(item => ({ ...item, kind: "pending" }));
    return [...confirmed, ...pending];
  }

  function dayRecords(date) {
    return calendarRecords().filter(item => item.date === date).sort((a, b) => a.start.localeCompare(b.start));
  }

  function timeBlocks(date) {
    return calendarRecords().flatMap(record => {
      const blocks = record.date === date
        ? [{ start: record.start, end: record.end, name: `Evento: ${record.name}`, kind: record.kind, record }]
        : [];
      const additions = [
        ["rehearsalDate", "rehearsalStart", "rehearsalEnd", "Ensayo"],
        ["setupDate", "setupStart", "setupEnd", "Montaje"],
        ["teardownDate", "teardownStart", "teardownEnd", "Desmontaje"]
      ];
      additions.forEach(([dateKey, startKey, endKey, label]) => {
        if (record[dateKey] === date && record[startKey] && record[endKey]) {
          blocks.push({ start: record[startKey], end: record[endKey], name: `${label}: ${record.name}`, kind: record.kind, record });
        }
      });
      return blocks;
    }).sort((a, b) => a.start.localeCompare(b.start));
  }

  function occupiedIntervals(date) {
    return timeBlocks(date).reduce((intervals, block) => {
      const previous = intervals[intervals.length - 1];
      if (previous && block.start <= previous.end) {
        if (block.end > previous.end) previous.end = block.end;
      } else {
        intervals.push({ start: block.start, end: block.end });
      }
      return intervals;
    }, []);
  }

  function isPendingRequest(request) {
    if (request.status === "Descartada") return false;
    const quote = data.quotes.find(item => item.requestId === request.id);
    return !quote || quote.status === "En proceso" || quote.status === "Esperando respuesta";
  }

  function isUnavailable(date) {
    return availableStarts(date).length === 0;
  }

  function availableStarts(date) {
    const records = timeBlocks(date);
    const starts = [];
    for (let hour = openingHour; hour < closingHour; hour++) {
      const start = `${pad(hour)}:00`;
      const end = `${pad(hour + 1)}:00`;
      if (!records.some(record => overlaps(start, end, record.start, record.end))) starts.push(start);
    }
    return starts;
  }

  function adminEntries(date) {
    return calendarRecords().flatMap(record => {
      const paymentStatus = record.kind === "reserved"
        ? record.paymentStatus || "Sin pagos"
        : data.quotes.find(quote => quote.requestId === record.id)?.paymentStatus || "Sin pagos";
      const entries = record.date === date ? [{
          ...record,
          paymentStatus,
          segment: "Evento",
          displayStart: record.start,
          displayEnd: record.end
        }] : [];
      [
        ["rehearsalDate", "rehearsalStart", "rehearsalEnd", "Ensayo"],
        ["setupDate", "setupStart", "setupEnd", "Montaje"],
        ["teardownDate", "teardownStart", "teardownEnd", "Desmontaje"]
      ].forEach(([dateKey, startKey, endKey, segment]) => {
        if (record[dateKey] === date && record[startKey] && record[endKey]) {
          entries.push({
            ...record,
            paymentStatus,
            segment,
            displayStart: record[startKey],
            displayEnd: record[endKey]
          });
        }
      });
      return entries;
    })
      .sort((a, b) => a.displayStart.localeCompare(b.displayStart));
  }

  const client = document.getElementById("client-calendar");
  if (client) initializeClient();
  const adminCalendar = document.getElementById("admin-calendar-view");
  if (adminCalendar) initializeAdmin();

  function initializeClient() {
    const title = document.getElementById("client-month-title");
    const startSelect = document.getElementById("start-time");
    const endSelect = document.getElementById("end-time");
    const form = document.getElementById("request-form");
    const successDialog = document.getElementById("request-success-dialog");
    const logistics = [
      { key: "rehearsal", checkbox: "rehearsal", fields: "rehearsal-fields", date: "rehearsal-date", start: "rehearsal-start", end: "rehearsal-end", kind: "rehearsal" },
      { key: "setup", checkbox: "needs-setup", fields: "setup-fields", date: "setup-date", start: "setup-start", end: "setup-end", kind: "setup" },
      { key: "teardown", checkbox: "needs-teardown", fields: "teardown-fields", date: "teardown-date", start: "teardown-start", end: "teardown-end", kind: "teardown" }
    ];
    const requestAddons = ADDON_CATALOG.map(addon => ({
      ...addon,
      checkbox: `request-addon-${addon.key === "led54" ? "led-54" : addon.key === "led43" ? "led-43" : addon.key}`,
      start: `request-addon-${addon.key === "led54" ? "led-54" : addon.key === "led43" ? "led-43" : addon.key}-start`,
      end: `request-addon-${addon.key === "led54" ? "led-54" : addon.key === "led43" ? "led-43" : addon.key}-end`,
      quantity: ["parking", "microphones"].includes(addon.key) ? `request-addon-${addon.key}-quantity` : ""
    }));
    let monthCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = "";

    function renderMonth() {
      title.textContent = `${longMonths[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;
      client.replaceChildren();
      weekdays.forEach(day => {
        const heading = document.createElement("span");
        heading.className = "weekday";
        heading.textContent = day;
        heading.setAttribute("role", "columnheader");
        client.append(heading);
      });

      const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const offset = (first.getDay() + 6) % 7;
      const gridStart = new Date(first);
      gridStart.setDate(first.getDate() - offset);
      for (let index = 0; index < 42; index++) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + index);
        const dateValue = toISO(day);
        const inMonth = day.getMonth() === monthCursor.getMonth();
        const oldDate = day < today;
        const fullyBooked = isUnavailable(dateValue);
        const hasRecords = timeBlocks(dateValue).length > 0;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `day${!inMonth ? " muted" : ""}${fullyBooked ? " unavailable" : ""}${!fullyBooked && !oldDate && inMonth ? (hasRecords ? " partial-day" : " available") : ""}${selectedDate === dateValue ? " selected" : ""}`;
        button.textContent = String(day.getDate());
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `${formatDate(dateValue)}${fullyBooked ? ", ocupado" : ""}`);
        button.disabled = !inMonth || oldDate || fullyBooked;
        if (selectedDate === dateValue) button.setAttribute("aria-pressed", "true");
        if (fullyBooked) button.title = "No quedan horarios disponibles";
        else if (hasRecords) button.title = "Día parcialmente ocupado; consulta los horarios libres";
        button.addEventListener("click", () => {
          selectedDate = dateValue;
          resetTimes();
          renderRequestAddons();
          renderMonth();
          renderAvailability();
          updateSummary();
        });
        client.append(button);
      }
      document.getElementById("client-prev-month").disabled =
        monthCursor.getFullYear() === today.getFullYear() && monthCursor.getMonth() <= today.getMonth();
    }

    function resetTimes() {
      startSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      endSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      startSelect.disabled = !selectedDate;
      endSelect.disabled = true;
      startSelect.value = "";
      endSelect.value = "";
    }

    function renderAvailability() {
      const heading = document.getElementById("availability-title");
      const description = document.getElementById("availability-description");
      const fields = document.getElementById("slot-fields");
      const error = document.getElementById("availability-error");
      error.textContent = "";
      if (!selectedDate) {
        heading.textContent = "Selecciona una fecha para ver los horarios disponibles";
        description.textContent = "Elige un día disponible del calendario para continuar.";
        fields.hidden = true;
        document.getElementById("occupied-hours").hidden = true;
        renderLogistics();
        renderRequestAddons();
        return;
      }
      heading.textContent = `Horarios disponibles para el ${formatDate(selectedDate)}`;
      description.textContent = "Elige el inicio y la duración de tu evento. La hora de fin se actualizará según tu selección.";
      fields.hidden = false;
      const blocks = timeBlocks(selectedDate);
      const occupiedHours = document.getElementById("occupied-hours");
      const intervals = occupiedIntervals(selectedDate);
      occupiedHours.hidden = intervals.length === 0;
      occupiedHours.innerHTML = intervals.length
        ? `<strong>Horas ocupadas</strong>${intervals.map(interval => `<span>${escapeHTML(interval.start)} a ${escapeHTML(interval.end)} · Ocupado</span>`).join("")}`
        : "";
      startSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      availableStarts(selectedDate).forEach(time => startSelect.add(new Option(time, time)));
      startSelect.disabled = false;
      endSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      endSelect.disabled = true;
      if (startSelect.options.length === 1) {
        description.textContent = "No quedan horarios disponibles para esta fecha. Elige otro día del calendario.";
        startSelect.disabled = true;
      }
      renderRequestAddons();
      renderLogistics();
    }

    function updateEndTimes() {
      const start = startSelect.value;
      endSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      if (!start || !selectedDate) {
        endSelect.disabled = true;
        endSelect.value = "";
        updateSummary();
        return;
      }
      const records = timeBlocks(selectedDate);
      const startHour = Number(start.slice(0, 2));
      for (let hour = startHour + 1; hour <= closingHour; hour++) {
        const end = `${pad(hour)}:00`;
        if (!records.some(record => overlaps(start, end, record.start, record.end))) endSelect.add(new Option(end, end));
      }
      endSelect.disabled = endSelect.options.length === 1;
      if (endSelect.options.length === 1) {
        document.getElementById("availability-error").textContent = "No hay una hora de fin libre después de ese inicio. Elige otra hora.";
      }
      updateSummary();
    }

    function selectedRequestAddons() {
      return requestAddons.flatMap(item => {
        if (!document.getElementById(item.checkbox).checked) return [];
        const start = document.getElementById(item.start).value;
        const end = document.getElementById(item.end).value;
        return [{
          key: item.key,
          start,
          end,
          hours: start && end ? hoursBetween(start, end) : 0,
          quantity: item.quantity ? Number(document.getElementById(item.quantity).value) : 1
        }];
      });
    }

    function renderRequestAddons() {
      const eventHours = startSelect.value && endSelect.value
        ? Number(endSelect.value.slice(0, 2)) - Number(startSelect.value.slice(0, 2))
        : 0;
      requestAddons.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        const startSelect = document.getElementById(item.start);
        const endSelect = document.getElementById(item.end);
        const quantityInput = item.quantity ? document.getElementById(item.quantity) : null;
        const previousStart = startSelect.value;
        const previousEnd = endSelect.value;
        startSelect.replaceChildren(new Option(eventHours ? "Desde" : "Elige horario", ""));
        endSelect.replaceChildren(new Option(eventHours ? "Hasta" : "Elige horario", ""));
        if (eventHours) {
          const eventStart = Number(document.getElementById("start-time").value.slice(0, 2));
          const eventEnd = Number(document.getElementById("end-time").value.slice(0, 2));
          for (let hour = eventStart; hour < eventEnd; hour++) {
            startSelect.add(new Option(`${pad(hour)}:00`, `${pad(hour)}:00`));
          }
          const nextStart = previousStart && Number(previousStart.slice(0, 2)) < eventEnd
            ? previousStart : `${pad(eventStart)}:00`;
          startSelect.value = nextStart;
          for (let hour = Number(nextStart.slice(0, 2)) + 1; hour <= eventEnd; hour++) {
            endSelect.add(new Option(`${pad(hour)}:00`, `${pad(hour)}:00`));
          }
          endSelect.value = previousEnd && Number(previousEnd.slice(0, 2)) > Number(nextStart.slice(0, 2)) &&
            Number(previousEnd.slice(0, 2)) <= eventEnd
            ? previousEnd : `${pad(eventEnd)}:00`;
        }
        startSelect.disabled = !checkbox.checked || !eventHours;
        endSelect.disabled = !checkbox.checked || !eventHours;
        startSelect.required = checkbox.checked;
        endSelect.required = checkbox.checked;
        if (quantityInput) {
          if (item.quantityLimit) quantityInput.max = String(item.quantityLimit);
          quantityInput.disabled = !checkbox.checked;
          quantityInput.required = checkbox.checked;
        }
      });
      updateRequestAddonSummary();
    }

    function updateRequestAddonSummary() {
      const selected = selectedRequestAddons();
      const summary = selected.map(addon => {
        const item = ADDON_CATALOG.find(entry => entry.key === addon.key);
        const quantity = addon.key === "parking"
          ? `${addon.quantity} auto${addon.quantity === 1 ? "" : "s"} · `
          : addon.key === "microphones" ? `${addon.quantity} micrófono${addon.quantity === 1 ? "" : "s"} · ` : "";
        return `${quantity}${item.label} · ${addon.start && addon.end ? `${addon.start}–${addon.end}` : "elige horario"}`;
      });
      const total = selected.reduce((sum, addon) => {
        const item = ADDON_CATALOG.find(entry => entry.key === addon.key);
        return sum + addonCost(item, addon.hours, addon.quantity);
      }, 0);
      document.getElementById("summary-addons").textContent = summary.join(", ") || "Ninguno";
      document.getElementById("summary-addons-total").textContent = money(total);
    }

    function updateSummary() {
      document.getElementById("summary-date").textContent = selectedDate ? formatDate(selectedDate) : "Aún no seleccionada";
      document.getElementById("summary-time").textContent = startSelect.value && endSelect.value
        ? `${startSelect.value} a ${endSelect.value}` : "Aún no seleccionado";
      const contactReady = ["full-name", "email", "phone"].every(id => document.getElementById(id).value.trim())
        && /^\d{8}$/.test(document.getElementById("dni").value.trim());
      document.getElementById("submit-request").disabled = !(selectedDate && startSelect.value && endSelect.value && contactReady);
    }

    function renderLogistics() {
      logistics.forEach(item => {
        const enabled = document.getElementById(item.checkbox).checked;
        const details = document.getElementById(item.fields);
        const dateInput = document.getElementById(item.date);
        const startInput = document.getElementById(item.start);
        const endInput = document.getElementById(item.end);
        details.hidden = !enabled;
        [dateInput, startInput, endInput].forEach(control => { control.required = enabled; });
        if (!enabled) {
          [dateInput, startInput, endInput].forEach(control => {
            control.value = "";
            control.disabled = true;
          });
          return;
        }
        if (!selectedDate) {
          [dateInput, startInput, endInput].forEach(control => { control.disabled = true; });
          return;
        }
        dateInput.disabled = false;
        const minDate = item.kind === "teardown" ? selectedDate : addDays(selectedDate, -1);
        const maxDate = item.kind === "teardown" ? addDays(selectedDate, 1) : selectedDate;
        dateInput.min = minDate < toISO(today) ? toISO(today) : minDate;
        dateInput.max = maxDate;
        if (!dateInput.value || dateInput.value < dateInput.min || dateInput.value > dateInput.max) {
          dateInput.value = item.kind === "rehearsal" ? addDays(selectedDate, -1) : selectedDate;
          if (dateInput.value < dateInput.min) dateInput.value = dateInput.min;
        }
        updateLogisticsTimes(item);
      });
    }

    function updateLogisticsTimes(item) {
      const date = document.getElementById(item.date).value;
      const startInput = document.getElementById(item.start);
      const previousStart = startInput.value;
      const sameDay = date === selectedDate;
      const eventStartHour = Number(startSelect.value?.slice(0, 2) || 9);
      const eventEndHour = Number(endSelect.value?.slice(0, 2) || 22);
      const limits = item.kind === "teardown" && sameDay
        ? { firstStart: eventEndHour, lastEnd: closingHour }
        : item.kind === "teardown"
          ? { firstStart: openingHour, lastEnd: eventEndHour }
          : sameDay
            ? { firstStart: openingHour, lastEnd: eventStartHour }
            : { firstStart: openingHour, lastEnd: closingHour };
      const blocks = timeBlocks(date);
      const starts = timeOptions().filter(start => {
        const hour = Number(start.slice(0, 2));
        const end = `${pad(hour + 1)}:00`;
        return hour >= limits.firstStart && hour < limits.lastEnd &&
          !blocks.some(block => overlaps(start, end, block.start, block.end));
      });
      startInput.innerHTML = '<option value="">Selecciona una hora</option>';
      starts.forEach(time => startInput.add(new Option(time, time)));
      startInput.disabled = !date;
      startInput.value = starts.includes(previousStart) ? previousStart : "";
      updateLogisticsEndTimes(item, limits);
    }

    function updateLogisticsEndTimes(item, limits = null) {
      const date = document.getElementById(item.date).value;
      const startInput = document.getElementById(item.start);
      const endInput = document.getElementById(item.end);
      const previousEnd = endInput.value;
      const sameDay = date === selectedDate;
      const eventStartHour = Number(startSelect.value?.slice(0, 2) || openingHour);
      const eventEndHour = Number(endSelect.value?.slice(0, 2) || closingHour);
      const maxEnd = limits?.lastEnd ?? (item.kind === "teardown" && sameDay
        ? closingHour : item.kind === "teardown" ? eventEndHour
          : sameDay ? eventStartHour : closingHour);
      const minEnd = Number(startInput.value?.slice(0, 2) || openingHour) + 1;
      const blocks = timeBlocks(date);
      endInput.innerHTML = '<option value="">Selecciona una hora</option>';
      for (let hour = minEnd; hour <= maxEnd; hour++) {
        const end = `${pad(hour)}:00`;
        if (!blocks.some(block => overlaps(startInput.value, end, block.start, block.end))) endInput.add(new Option(end, end));
      }
      endInput.disabled = !startInput.value;
      endInput.value = [...endInput.options].some(option => option.value === previousEnd) ? previousEnd : "";
    }

    function validateLogistics() {
      const requestedBlocks = [{ date: selectedDate, start: startSelect.value, end: endSelect.value, name: "evento" }];
      for (const item of logistics) {
        if (!document.getElementById(item.checkbox).checked) continue;
        const date = document.getElementById(item.date).value;
        const start = document.getElementById(item.start).value;
        const end = document.getElementById(item.end).value;
        if (!date || !start || !end) return "Completa fecha y horario del ensayo, montaje o desmontaje seleccionado.";
        if (item.kind !== "teardown" && date === selectedDate && end > startSelect.value) {
          return "El ensayo y el montaje deben terminar antes de que empiece el evento.";
        }
        if (item.kind === "teardown" && date === selectedDate && start < endSelect.value) {
          return "El desmontaje debe iniciar cuando termine el evento.";
        }
        if (item.kind === "teardown" && date === addDays(selectedDate, 1) && end > endSelect.value) {
          return "El desmontaje debe finalizar dentro de las 24 horas posteriores al evento.";
        }
        if (requestedBlocks.some(block => block.date === date && overlaps(start, end, block.start, block.end))) {
          return `El horario seleccionado para ${item.kind === "setup" ? "montaje" : item.kind === "teardown" ? "desmontaje" : "ensayo"} coincide con otro horario de esta solicitud.`;
        }
        if (timeBlocks(date).some(block => overlaps(start, end, block.start, block.end))) {
          return `El horario de ${item.kind === "setup" ? "montaje" : item.kind === "teardown" ? "desmontaje" : "ensayo"} coincide con otro evento.`;
        }
        requestedBlocks.push({ date, start, end, name: item.kind });
      }
      return "";
    }

    document.getElementById("client-prev-month").addEventListener("click", () => {
      monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
      renderMonth();
    });
    document.getElementById("client-next-month").addEventListener("click", () => {
      monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
      renderMonth();
    });
    startSelect.addEventListener("change", updateEndTimes);
    startSelect.addEventListener("change", renderRequestAddons);
    endSelect.addEventListener("change", () => {
      renderRequestAddons();
      updateSummary();
    });
    startSelect.addEventListener("change", renderLogistics);
    endSelect.addEventListener("change", renderLogistics);
    requestAddons.forEach(item => {
      document.getElementById(item.checkbox).addEventListener("change", renderRequestAddons);
      document.getElementById(item.start).addEventListener("change", renderRequestAddons);
      document.getElementById(item.end).addEventListener("change", updateRequestAddonSummary);
      if (item.quantity) {
        document.getElementById(item.quantity).addEventListener("input", updateRequestAddonSummary);
      }
    });
    logistics.forEach(item => {
      document.getElementById(item.checkbox).addEventListener("change", renderLogistics);
      document.getElementById(item.date).addEventListener("change", () => updateLogisticsTimes(item));
      document.getElementById(item.start).addEventListener("change", () => updateLogisticsEndTimes(item));
    });
    ["full-name", "email", "phone", "dni"].forEach(id => document.getElementById(id).addEventListener("input", updateSummary));
    const dniInput = document.getElementById("dni");
    const dniError = document.getElementById("dni-error");
    function showDniError() {
      const digits = dniInput.value.trim().length;
      const invalid = digits > 0 && digits !== 8;
      dniError.hidden = !invalid;
      dniError.textContent = invalid ? `El DNI debe tener exactamente 8 dígitos (llevas ${digits}).` : "";
      dniInput.setAttribute("aria-invalid", String(invalid));
    }
    dniInput.addEventListener("input", () => {
      dniInput.value = dniInput.value.replace(/\D/g, "").slice(0, 8);
      if (!dniError.hidden) showDniError();
    });
    dniInput.addEventListener("blur", showDniError);
    form.addEventListener("reset", () => { dniError.hidden = true; dniInput.removeAttribute("aria-invalid"); });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const error = document.getElementById("form-message");
      if (!form.reportValidity()) return;
      if (!selectedDate || !startSelect.value || !endSelect.value) {
        error.textContent = "Selecciona una fecha y un horario disponible.";
        return;
      }
      const logisticsError = validateLogistics();
      if (logisticsError) {
        error.textContent = logisticsError;
        return;
      }
      const collision = timeBlocks(selectedDate).some(item => overlaps(startSelect.value, endSelect.value, item.start, item.end));
      if (collision) {
        error.textContent = "Ese horario acaba de ocuparse. Selecciona otra hora.";
        renderAvailability();
        return;
      }
      data.requests.unshift({
        id: `REQ-${Date.now()}`,
        name: document.getElementById("full-name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        dni: document.getElementById("dni").value.trim(),
        date: selectedDate,
        start: startSelect.value,
        end: endSelect.value,
        addons: selectedRequestAddons(),
        rehearsal: document.getElementById("rehearsal").checked,
        rehearsalDate: document.getElementById("rehearsal").checked ? document.getElementById("rehearsal-date").value : "",
        rehearsalStart: document.getElementById("rehearsal").checked ? document.getElementById("rehearsal-start").value : "",
        rehearsalEnd: document.getElementById("rehearsal").checked ? document.getElementById("rehearsal-end").value : "",
        setupDate: document.getElementById("needs-setup").checked ? document.getElementById("setup-date").value : "",
        setupStart: document.getElementById("needs-setup").checked ? document.getElementById("setup-start").value : "",
        setupEnd: document.getElementById("needs-setup").checked ? document.getElementById("setup-end").value : "",
        teardownDate: document.getElementById("needs-teardown").checked ? document.getElementById("teardown-date").value : "",
        teardownStart: document.getElementById("needs-teardown").checked ? document.getElementById("teardown-start").value : "",
        teardownEnd: document.getElementById("needs-teardown").checked ? document.getElementById("teardown-end").value : "",
        notes: document.getElementById("comments").value.trim(),
        status: "Nueva",
        createdAt: toISO(today)
      });
      saveData();
      form.reset();
      selectedDate = "";
      resetTimes();
      renderMonth();
      renderAvailability();
      updateSummary();
      error.textContent = "Solicitud registrada correctamente.";
      successDialog.showModal();
    });
    document.getElementById("close-request-success").addEventListener("click", () => successDialog.close());
    successDialog.addEventListener("click", event => {
      if (event.target === successDialog) successDialog.close();
    });
    renderMonth();
    resetTimes();
    renderAvailability();
    updateSummary();
    synchronizeStorage(() => {
      renderMonth();
      renderAvailability();
      updateSummary();
    });
  }

  function initializeAdmin() {
    const monthTitle = document.getElementById("admin-month-title");
    const calendarBody = document.getElementById("admin-calendar-view");
    const detail = document.getElementById("calendar-detail-content");
    const dialog = document.getElementById("quote-dialog");
    const quoteForm = document.getElementById("quote-form");
    let monthCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    let calendarMode = "month";
    let modalRequestId = "";
    let modalQuoteId = "";

    const quoteAddons = ADDON_CATALOG.map(addon => ({
      ...addon,
      checkbox: `quote-addon-${addon.key === "led54" ? "led-54" : addon.key === "led43" ? "led-43" : addon.key}`,
      start: `quote-addon-${addon.key === "led54" ? "led-54" : addon.key === "led43" ? "led-43" : addon.key}-start`,
      end: `quote-addon-${addon.key === "led54" ? "led-54" : addon.key === "led43" ? "led-43" : addon.key}-end`,
      quantity: ["parking", "microphones"].includes(addon.key) ? `quote-addon-${addon.key}-quantity` : ""
    }));
    const sendDialog = document.getElementById("quote-send-dialog");
    let activeSendQuoteId = "";

    function nextQuoteCode(year) {
      const pattern = new RegExp(`^COD-(\\d+)-${year}$`);
      const used = data.quotes
        .map(quote => Number(quote.quoteCode?.match(pattern)?.[1] || 0))
        .filter(Number.isSafeInteger);
      let next = Math.max(0, ...used) + 1;
      let code = `COD-${String(next).padStart(3, "0")}-${year}`;
      while (data.quotes.some(quote => quote.quoteCode === code)) {
        next += 1;
        code = `COD-${String(next).padStart(3, "0")}-${year}`;
      }
      return code;
    }

    function ensureQuoteCodes() {
      let changed = false;
      [...data.quotes]
        .sort((first, second) =>
          String(first.createdAt || "").localeCompare(String(second.createdAt || "")) ||
          String(first.id || "").localeCompare(String(second.id || ""))
        )
        .forEach(quote => {
          if (quote.quoteCode) return;
          const year = /^\d{4}/.test(quote.createdAt || "") ? quote.createdAt.slice(0, 4) : String(today.getFullYear());
          quote.quoteCode = nextQuoteCode(year);
          changed = true;
        });
      if (changed) saveData();
    }

    function buildQuotePdf(quote) {
      const pageWidth = 1240;
      const pageHeight = 1754;
      const pages = [];
      let canvas;
      let context;
      let y;
      const navy = "#172b4d";
      const magenta = "#d82a86";
      const ink = "#253247";
      const muted = "#66758a";

      function newPage() {
        canvas = document.createElement("canvas");
        canvas.width = pageWidth;
        canvas.height = pageHeight;
        context = canvas.getContext("2d");
        if (!context) throw new Error("El navegador no pudo crear la vista previa de la cotización.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageWidth, pageHeight);
        context.fillStyle = navy;
        context.fillRect(0, 0, pageWidth, 190);
        context.fillStyle = magenta;
        context.fillRect(0, 190, pageWidth, 10);
        context.fillRect(64, 58, 8, 70);
        context.font = "700 38px Arial";
        context.fillStyle = "#ffffff";
        context.fillText("SHOWTECH", 94, 93);
        context.font = "500 20px Arial";
        context.fillText("SOLUTIONS", 96, 125);
        context.textAlign = "right";
        context.font = "700 28px Arial";
        context.fillText("COTIZACIÓN", 1175, 81);
        context.font = "700 22px Arial";
        context.fillText(quote.quoteCode || "Cotización", 1175, 119);
        context.font = "16px Arial";
        context.fillStyle = "#dfe7f1";
        context.fillText("Alquiler de espacios para eventos", 1175, 153);
        context.textAlign = "left";
        context.fillStyle = muted;
        context.font = "16px Arial";
        context.fillText(`Emitida: ${formatShortDate(quote.createdAt)}`, 64, 235);
        y = 285;
        pages.push(canvas);
      }

      function ensureSpace(height) {
        if (y + height > pageHeight - 125) newPage();
      }

      function section(title) {
        ensureSpace(52);
        context.fillStyle = magenta;
        context.fillRect(64, y, 8, 27);
        context.fillStyle = navy;
        context.font = "700 22px Arial";
        context.fillText(title, 88, y + 21);
        y += 48;
      }

      function wrappedText(text, x, maxWidth, lineHeight = 25) {
        const words = String(text || "—").split(/\s+/);
        let line = "";
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (line && context.measureText(candidate).width > maxWidth) {
            ensureSpace(lineHeight);
            context.fillText(line, x, y);
            y += lineHeight;
            line = word;
          } else {
            line = candidate;
          }
        }
        if (line) {
          ensureSpace(lineHeight);
          context.fillText(line, x, y);
          y += lineHeight;
        }
      }

      // Cuenta cuántas líneas ocupará un texto con el mismo ajuste de línea que wrappedText.
      function countLines(text, maxWidth, font) {
        context.font = font;
        let lines = 0;
        let line = "";
        for (const word of String(text || "—").split(/\s+/)) {
          const candidate = line ? `${line} ${word}` : word;
          if (line && context.measureText(candidate).width > maxWidth) {
            lines += 1;
            line = word;
          } else {
            line = candidate;
          }
        }
        return lines + (line ? 1 : 0);
      }

      // Recuadro gris con filas de dos columnas. Cada fila arranca a la misma altura en ambas columnas y el recuadro
      // se ajusta al contenido (antes tenía alto fijo y el texto largo se salía).
      function infoPanel(rows) {
        const valueFont = "600 18px Arial";
        const columns = { left: { label: 88, value: 230, width: 370 }, right: { label: 640, value: 830, width: 320 } };
        const heights = rows.map(row => 26 * Math.max(countLines(row[1], columns.left.width, valueFont), countLines(row[3], columns.right.width, valueFont)) + 10);
        const total = heights.reduce((sum, height) => sum + height, 0) + 22;
        ensureSpace(total + 12);
        const top = y - 12;
        context.fillStyle = "#f5f7fa";
        context.fillRect(64, top, pageWidth - 128, total);
        y = top + 32;
        rows.forEach(([leftLabel, leftValue, rightLabel, rightValue], index) => {
          const rowY = y;
          [[leftLabel, leftValue, columns.left], [rightLabel, rightValue, columns.right]].forEach(([label, value, column]) => {
            y = rowY;
            context.fillStyle = muted;
            context.font = "16px Arial";
            context.fillText(label, column.label, rowY);
            context.fillStyle = ink;
            context.font = valueFont;
            wrappedText(value || "—", column.value, column.width, 26);
          });
          y = rowY + heights[index];
        });
        y = top + total + 24;
      }

      newPage();
      section("Datos del cliente");
      infoPanel([
        ["Cliente", quote.client, "DNI", quote.dni || "No registrado"],
        ["Correo", quote.email, "Teléfono", quote.phone]
      ]);

      section("Evento y programación");
      infoPanel([
        ["Fecha", formatDate(quote.date), "Horario", `${quote.start} a ${quote.end} (${quote.hours || hoursBetween(quote.start, quote.end)} horas)`],
        ["Ensayo", quote.rehearsal && quote.rehearsalDate
          ? `${formatShortDate(quote.rehearsalDate)} · ${quote.rehearsalStart} a ${quote.rehearsalEnd}` : "No solicitado",
          "Montaje / desmontaje", [
            quote.setupDate ? `Montaje ${formatShortDate(quote.setupDate)} ${quote.setupStart}–${quote.setupEnd}` : "",
            quote.teardownDate ? `Desmontaje ${formatShortDate(quote.teardownDate)} ${quote.teardownStart}–${quote.teardownEnd}` : ""
          ].filter(Boolean).join(" · ") || "No solicitado"]
      ]);

      section("Detalle de la cotización");
      const structuredPricing = quote.spaceSubtotal != null && quote.subtotal != null && quote.tax != null;
      const rows = structuredPricing ? [
        {
          label: `Alquiler del espacio · ${money(quote.hourlyRate)} × ${quote.hours} h`,
          detail: "Según horario del evento",
          amount: quote.spaceSubtotal
        },
        ...(quote.addons || []).map(addon => {
          const quantityLabel = addon.key === "parking"
            ? `${addon.quantity} auto${addon.quantity === 1 ? "" : "s"}`
            : addon.key === "microphones" ? `${addon.quantity} micrófono${addon.quantity === 1 ? "" : "s"}` : "";
          return {
            label: addon.label || ADDON_CATALOG.find(item => item.key === addon.key)?.label || addon.key,
            detail: `${quantityLabel ? `${quantityLabel} · ` : ""}${addon.start} a ${addon.end} · ${addon.hours} h`,
            amount: addon.amount
          };
        })
      ] : [{ label: quote.services || "Servicios cotizados", detail: "Importe total acordado", amount: quote.amount }];
      rows.forEach(row => {
        ensureSpace(86);
        context.fillStyle = "#f0f3f7";
        context.fillRect(64, y - 8, pageWidth - 128, 1);
        context.fillStyle = ink;
        context.font = "600 17px Arial";
        context.fillText(row.label, 80, y + 18);
        context.fillStyle = muted;
        context.font = "15px Arial";
        context.fillText(row.detail, 80, y + 47);
        context.textAlign = "right";
        context.fillStyle = ink;
        context.font = "600 18px Arial";
        context.fillText(money(row.amount), 1155, y + 24);
        if (structuredPricing) {
          context.fillStyle = muted;
          context.font = "14px Arial";
          context.fillText("+ IGV", 1155, y + 46);
        }
        context.textAlign = "left";
        y += 70;
      });

      if (structuredPricing) {
        ensureSpace(180);
        y += 12;
        [["Costo total sin IGV", quote.subtotal], ["IGV (18 %)", quote.tax]].forEach(([label, amount]) => {
          context.fillStyle = muted;
          context.font = "17px Arial";
          context.fillText(label, 740, y);
          context.textAlign = "right";
          context.fillStyle = ink;
          context.fillText(money(amount), 1155, y);
          context.textAlign = "left";
          y += 34;
        });
        context.fillStyle = navy;
        context.fillRect(720, y, 435, 62);
        context.fillStyle = "#ffffff";
        context.font = "700 20px Arial";
        context.fillText("TOTAL", 745, y + 39);
        context.textAlign = "right";
        context.font = "700 25px Arial";
        context.fillText(money(quote.amount), 1130, y + 41);
        context.textAlign = "left";
        y += 84;
      } else {
        ensureSpace(70);
        context.fillStyle = navy;
        context.fillRect(720, y, 435, 62);
        context.fillStyle = "#ffffff";
        context.font = "700 20px Arial";
        context.fillText("TOTAL", 745, y + 39);
        context.textAlign = "right";
        context.font = "700 25px Arial";
        context.fillText(money(quote.amount), 1130, y + 41);
        context.textAlign = "left";
        y += 84;
      }

      if (quote.services && structuredPricing) {
        section("Detalle de servicios");
        context.fillStyle = ink;
        context.font = "17px Arial";
        wrappedText(quote.services, 80, pageWidth - 160, 27);
        y += 8;
      }
      function bulletList(items) {
        items.forEach(item => {
          ensureSpace(84);
          context.fillStyle = ink;
          context.font = "16px Arial";
          context.fillText("•", 84, y);
          wrappedText(item, 106, pageWidth - 190, 24);
          y += 3;
        });
        y += 12;
      }

      section("Incluye para el auditorio");
      bulletList(QUOTE_INCLUDES);
      section("Forma de pago");
      bulletList(QUOTE_PAYMENT_TERMS);
      if (QUOTE_BANK_ACCOUNTS.length) {
        section("Cuenta bancaria");
        bulletList(QUOTE_BANK_ACCOUNTS.map(account => [account.entidad, account.titular && `Titular: ${account.titular}`, account.tipo, account.cuenta && `Nro. de cuenta: ${account.cuenta}`, account.cci && `CCI: ${account.cci}`].filter(Boolean).join(" · ")));
      }

      ensureSpace(55);
      context.fillStyle = muted;
      context.font = "16px Arial";
      context.fillText(`Validez de la oferta: ${quote.validity || "—"} días`, 80, y + 20);
      y += 42;
      if (quote.notes) {
        section("Notas");
        context.fillStyle = ink;
        context.font = "16px Arial";
        wrappedText(quote.notes, 80, pageWidth - 160, 25);
      }

      ensureSpace(QUOTE_SIGNATURE ? 220 : 90);
      y += 26;
      context.fillStyle = ink;
      context.font = "17px Arial";
      context.textAlign = "right";
      context.fillText(`${QUOTE_CITY}, ${formatDate(quote.createdAt, { day: "numeric", month: "long", year: "numeric" })}`, pageWidth - 64, y);
      context.textAlign = "left";
      y += 28;
      if (QUOTE_SIGNATURE) {
        y += 70;
        context.fillStyle = "#9aa6b5";
        context.fillRect(80, y, 330, 1);
        context.fillStyle = ink;
        context.font = "16px Arial";
        context.fillText(QUOTE_SIGNATURE, 80, y + 26);
      }

      pages.forEach((page, index) => {
        const footer = page.getContext("2d");
        footer.strokeStyle = "#e3e8ee";
        footer.beginPath();
        footer.moveTo(64, pageHeight - 88);
        footer.lineTo(pageWidth - 64, pageHeight - 88);
        footer.stroke();
        footer.fillStyle = muted;
        footer.font = "14px Arial";
        footer.fillText("SHOWTECH SOLUTIONS · Cotización sujeta a la validez indicada", 64, pageHeight - 54);
        footer.textAlign = "right";
        footer.fillText(`${index + 1} / ${pages.length}`, pageWidth - 64, pageHeight - 54);
        footer.textAlign = "left";
      });

      const objects = [];
      const pageObjectIds = pages.map((_, index) => 4 + index * 3);
      objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
      objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
      objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
      pages.forEach((page, index) => {
        const pageId = pageObjectIds[index];
        const imageId = pageId + 1;
        const contentId = pageId + 2;
        const jpeg = atob(page.toDataURL("image/jpeg", 0.93).split(",")[1]);
        const commands = `q 595 0 0 842 0 0 cm /Im0 Do Q`;
        objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`;
        objects[imageId] = `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${jpeg}\nendstream`;
        objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
      });
      let pdf = "%PDF-1.4\n";
      const offsets = [0];
      for (let index = 1; index < objects.length; index++) {
        offsets[index] = pdf.length;
        pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
      }
      const xrefOffset = pdf.length;
      pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
      for (let index = 1; index < objects.length; index++) {
        pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
      }
      pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
      const bytes = new Uint8Array(pdf.length);
      for (let index = 0; index < pdf.length; index++) bytes[index] = pdf.charCodeAt(index);
      return new Blob([bytes], { type: "application/pdf" });
    }

    function openQuotePdf(quoteId) {
      const quote = data.quotes.find(item => item.id === quoteId);
      if (!quote) return;
      const preview = window.open("about:blank", "_blank");
      if (!preview) {
        window.alert("No se pudo abrir el PDF. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.");
        return;
      }
      try {
        const pdf = buildQuotePdf(quote);
        const url = URL.createObjectURL(pdf);
        preview.location.replace(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) {
        preview.close();
        console.error("No se pudo generar el PDF de la cotización.", error);
        window.alert("No se pudo generar el PDF de la cotización. Inténtalo de nuevo.");
      }
    }

    ensureQuoteCodes();

    function hasScheduleConflict(request) {
      return timeBlocks(request.date).some(block =>
        overlaps(request.start, request.end, block.start, block.end) && block.record.id !== request.id
      );
    }

    function quotePricing(request) {
      const hours = Number(request.end.slice(0, 2)) - Number(request.start.slice(0, 2));
      const hourlyRate = Number(document.getElementById("quote-hourly-rate").value);
      const spaceSubtotal = Math.round((hourlyRate * hours + Number.EPSILON) * 100) / 100;
      const addons = quoteAddons.flatMap(item => {
        if (!document.getElementById(item.checkbox).checked) return [];
        const start = document.getElementById(item.start).value;
        const end = document.getElementById(item.end).value;
        const addonHours = start && end ? hoursBetween(start, end) : 0;
        const quantity = item.quantity ? Number(document.getElementById(item.quantity).value) : 1;
        return [{
          key: item.key,
          label: item.label,
          rate: item.rate,
          start,
          end,
          hours: addonHours,
          quantity,
          amount: Math.round((addonCost(item, addonHours, quantity) + Number.EPSILON) * 100) / 100
        }];
      });
      const addonsSubtotal = addons.reduce((sum, item) => sum + item.amount, 0);
      const subtotal = Math.round((spaceSubtotal + addonsSubtotal + Number.EPSILON) * 100) / 100;
      const tax = Math.round((subtotal * 0.18 + Number.EPSILON) * 100) / 100;
      return { hours, hourlyRate, spaceSubtotal, addons, addonsSubtotal, subtotal, tax, total: subtotal + tax };
    }

    function configureQuoteAddons(request, quote) {
      const eventHours = Number(request.end.slice(0, 2)) - Number(request.start.slice(0, 2));
      quoteAddons.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        const startSelect = document.getElementById(item.start);
        const endSelect = document.getElementById(item.end);
        const quantityInput = item.quantity ? document.getElementById(item.quantity) : null;
        const saved = (quote?.addons || request.addons || []).find(addon => addon.key === item.key);
        const eventStart = Number(request.start.slice(0, 2));
        const eventEnd = Number(request.end.slice(0, 2));
        const savedStart = saved?.start || request.start;
        const savedEnd = saved?.end || addHours(request.start, saved?.hours || eventHours);
        startSelect.replaceChildren(new Option("Desde", ""));
        endSelect.replaceChildren(new Option("Hasta", ""));
        for (let hour = eventStart; hour < eventEnd; hour++) {
          startSelect.add(new Option(`${pad(hour)}:00`, `${pad(hour)}:00`));
        }
        startSelect.value = saved && Number(savedStart.slice(0, 2)) >= eventStart &&
          Number(savedStart.slice(0, 2)) < eventEnd
          ? savedStart : request.start;
        for (let hour = Number(startSelect.value.slice(0, 2)) + 1; hour <= eventEnd; hour++) {
          endSelect.add(new Option(`${pad(hour)}:00`, `${pad(hour)}:00`));
        }
        endSelect.value = saved && Number(savedEnd.slice(0, 2)) > Number(startSelect.value.slice(0, 2)) &&
          Number(savedEnd.slice(0, 2)) <= eventEnd
          ? savedEnd : request.end;
        checkbox.checked = Boolean(saved);
        startSelect.disabled = !checkbox.checked;
        endSelect.disabled = !checkbox.checked;
        startSelect.required = checkbox.checked;
        endSelect.required = checkbox.checked;
        if (quantityInput) {
          if (item.quantityLimit) quantityInput.max = String(item.quantityLimit);
          quantityInput.value = String(saved?.quantity || 1);
          quantityInput.disabled = !checkbox.checked;
          quantityInput.required = checkbox.checked;
        }
      });
    }

    function updateQuotePriceSummary() {
      const request = data.requests.find(item => item.id === modalRequestId);
      if (!request) return;
      const pricing = quotePricing(request);
      document.getElementById("quote-duration").textContent = `${pricing.hours} hora${pricing.hours === 1 ? "" : "s"}`;
      document.getElementById("quote-space-subtotal").textContent = money(pricing.spaceSubtotal);
      document.getElementById("quote-addons-subtotal").textContent = money(pricing.addonsSubtotal);
      document.getElementById("quote-subtotal").textContent = money(pricing.subtotal);
      document.getElementById("quote-tax").textContent = money(pricing.tax);
      document.getElementById("quote-total").textContent = money(pricing.total);
    }

    function renderCalendar() {
      if (calendarMode === "month") {
        monthTitle.textContent = `${longMonths[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;
        const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
        const gridStart = new Date(first);
        gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
        let cells = "";
        for (let row = 0; row < 6; row++) {
          cells += "<tr>";
          for (let column = 0; column < 7; column++) {
            const day = new Date(gridStart);
            day.setDate(gridStart.getDate() + row * 7 + column);
            const date = toISO(day);
            const records = adminEntries(date);
            cells += `<td class="${day.getMonth() === monthCursor.getMonth() ? "" : "outside"}" data-date="${date}">
              <span class="date-number">${day.getDate()}</span>
              ${records.slice(0, 2).map(item => `<button class="event-chip ${paymentClass[item.paymentStatus] || "unpaid"}" type="button" data-record-id="${escapeHTML(item.id)}" data-record-kind="${item.kind}" data-segment="${escapeHTML(item.segment)}">${escapeHTML(item.displayStart)}–${escapeHTML(item.displayEnd)} · ${escapeHTML(item.segment)} · ${escapeHTML(item.name)}</button>`).join("")}
              ${records.length > 2 ? `<span class="sub-cell">+${records.length - 2} ${records.length - 2 === 1 ? "evento" : "eventos"}</span>` : ""}
            </td>`;
          }
          cells += "</tr>";
        }
        calendarBody.innerHTML = `<table class="month-table" aria-label="Calendario mensual"><thead><tr>${weekdays.map(day => `<th>${day}</th>`).join("")}</tr></thead><tbody>${cells}</tbody></table>`;
      } else {
        const monday = new Date(monthCursor);
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const firstLabel = monday.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
        const lastLabel = sunday.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
        monthTitle.textContent = `${firstLabel} – ${lastLabel}`;
        calendarBody.innerHTML = `<div class="week-view">${Array.from({ length: 7 }, (_, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + index);
          const iso = toISO(date);
          const records = adminEntries(iso);
          return `<section class="week-day"><h4>${weekdays[index]} ${date.getDate()}</h4>${records.length
            ? records.map(item => `<button class="event-chip ${paymentClass[item.paymentStatus] || "unpaid"}" type="button" data-record-id="${escapeHTML(item.id)}" data-record-kind="${item.kind}" data-segment="${escapeHTML(item.segment)}">${escapeHTML(item.displayStart)}–${escapeHTML(item.displayEnd)} · ${escapeHTML(item.segment)} · ${escapeHTML(item.name)}</button>`).join("")
            : '<p class="free-label">Libre</p>'}</section>`;
        }).join("")}</div>`;
      }
      calendarBody.querySelectorAll(".event-chip").forEach(button => {
        button.addEventListener("click", () => showCalendarDetail(button.dataset.recordId, button.dataset.recordKind, button.dataset.segment));
      });
      calendarBody.querySelectorAll("td[data-date]").forEach(cell => {
        cell.addEventListener("click", event => {
          if (!event.target.closest(".event-chip")) showDateDetail(cell.dataset.date);
        });
      });
    }

    function showDateDetail(date) {
      const records = adminEntries(date);
      detail.innerHTML = `<p class="detail-label">Fecha</p><p class="detail-value">${escapeHTML(formatDate(date))}</p>
        <p class="detail-label">Disponibilidad</p><p class="detail-value">${records.length ? `Hay ${records.length} evento(s) registrado(s).` : "Día libre; sin eventos registrados."}</p>
        ${records.map(item => `<button class="event-chip ${paymentClass[item.paymentStatus] || "unpaid"}" type="button" data-record-id="${escapeHTML(item.id)}" data-record-kind="${item.kind}" data-segment="${escapeHTML(item.segment)}">${escapeHTML(item.displayStart)}–${escapeHTML(item.displayEnd)} · ${escapeHTML(item.segment)} · ${escapeHTML(item.name)}</button>`).join("")}`;
      detail.querySelectorAll(".event-chip").forEach(button => button.addEventListener("click", () => showCalendarDetail(button.dataset.recordId, button.dataset.recordKind, button.dataset.segment)));
    }

    function showCalendarDetail(id, kind, segment = "Evento") {
      const record = kind === "reserved"
        ? data.bookings.find(item => item.id === id)
        : data.requests.find(item => item.id === id);
      if (!record) return;
      const linkedQuote = data.quotes.find(quote => quote.requestId === record.id || quote.bookingId === record.id);
      const paymentStatus = kind === "reserved" ? record.paymentStatus || "Sin pagos" : linkedQuote?.paymentStatus || "Sin pagos";
      const segmentFields = {
        Evento: ["date", "start", "end"],
        Ensayo: ["rehearsalDate", "rehearsalStart", "rehearsalEnd"],
        Montaje: ["setupDate", "setupStart", "setupEnd"],
        Desmontaje: ["teardownDate", "teardownStart", "teardownEnd"]
      };
      const [dateKey, startKey, endKey] = segmentFields[segment] || segmentFields.Evento;
      const details = [
        record.rehearsal && record.rehearsalDate ? `Ensayo: ${formatDate(record.rehearsalDate, { day: "numeric", month: "long" })}, ${record.rehearsalStart} a ${record.rehearsalEnd}` : "",
        record.setupDate ? `Montaje: ${formatDate(record.setupDate, { day: "numeric", month: "long" })}, ${record.setupStart} a ${record.setupEnd}` : "",
        record.teardownDate ? `Desmontaje: ${formatDate(record.teardownDate, { day: "numeric", month: "long" })}, ${record.teardownStart} a ${record.teardownEnd}` : ""
      ].filter(Boolean);
      detail.innerHTML = `<p class="detail-label">Cliente</p><p class="detail-value">${escapeHTML(record.name)}</p>
        <p class="detail-label">${escapeHTML(segment)} · fecha y horario</p><p class="detail-value">${escapeHTML(formatDate(record[dateKey]))}<br>${escapeHTML(record[startKey])} a ${escapeHTML(record[endKey])}</p>
        <p class="detail-label">Ensayo previo</p><p class="detail-value">${record.rehearsal && record.rehearsalDate ? `${escapeHTML(formatDate(record.rehearsalDate))}, ${escapeHTML(record.rehearsalStart)} a ${escapeHTML(record.rehearsalEnd)}` : "No solicitado"}</p>
        ${details.filter(item => !item.startsWith("Ensayo:")).map(item => `<p class="detail-value">${escapeHTML(item)}</p>`).join("")}
        <p class="detail-label">Estado del pago</p><p class="detail-value"><span class="status ${paymentClass[paymentStatus] || "unpaid"}">${escapeHTML(paymentStatus)}</span></p>
        ${record.notes ? `<p class="detail-label">Observaciones</p><p class="detail-value">${escapeHTML(record.notes)}</p>` : ""}
        ${linkedQuote ? `<button class="button small" type="button" data-open-quote="${escapeHTML(linkedQuote.id)}">Ver cotización</button>` : ""}`;
      const viewButton = detail.querySelector("[data-open-quote]");
      if (viewButton) viewButton.addEventListener("click", () => openQuoteModal(null, "view", viewButton.dataset.openQuote));
    }

    // Estado visible de una solicitud: descartada, cotizada (si ya tiene cotización) o el estado guardado.
    function requestStatus(request, quote) {
      if (request.status === "Descartada") return "Descartada";
      if (quote) return "Cotizada";
      return request.status || "Nueva";
    }

    const statusBadgeClass = {
      "Nueva": "nueva", "En revisión": "revision", "Cotizada": "ok", "Descartada": "gris",
      "En proceso": "revision", "Esperando respuesta": "revision", "Aceptada": "ok",
      "Pagado": "ok", "Pago incompleto": "revision", "Sin pagos": "pendiente"
    };
    function statusBadge(label) {
      return `<span class="badge-estado ${statusBadgeClass[label] || "gris"}">${escapeHTML(label)}</span>`;
    }

    function renderRequests() {
      const search = document.getElementById("request-search").value.trim().toLocaleLowerCase("es");
      const filter = document.getElementById("request-filter").value;
      const requests = data.requests.filter(item => {
        const matchesSearch = `${item.name} ${item.dni || ""} ${item.email} ${item.phone} ${item.date}`.toLocaleLowerCase("es").includes(search);
        const quoted = data.quotes.some(quote => quote.requestId === item.id);
        const discarded = item.status === "Descartada";
        return matchesSearch && (!filter || (filter === "quoted" ? quoted : filter === "discarded" ? discarded : !quoted && !discarded));
      });
      document.getElementById("request-count").textContent = `${requests.length} solicitud${requests.length === 1 ? "" : "es"}`;
      document.getElementById("request-foot").textContent = `Mostrando ${requests.length} de ${data.requests.length} solicitudes.`;
      document.getElementById("requests-body").innerHTML = requests.map(item => {
        const quote = data.quotes.find(entry => entry.requestId === item.id);
        const logistics = [
          item.rehearsal && item.rehearsalDate ? `Ensayo: ${formatShortDate(item.rehearsalDate)} ${item.rehearsalStart}–${item.rehearsalEnd}` : "",
          item.setupDate ? `Montaje: ${formatShortDate(item.setupDate)} ${item.setupStart}–${item.setupEnd}` : "",
          item.teardownDate ? `Desmontaje: ${formatShortDate(item.teardownDate)} ${item.teardownStart}–${item.teardownEnd}` : ""
        ].filter(Boolean);
        return `<tr>
          <td class="main-cell">${escapeHTML(item.name)}</td><td>${escapeHTML(item.dni || "—")}</td><td>${escapeHTML(item.email)}</td><td>${escapeHTML(item.phone)}</td>
          <td>${escapeHTML(formatShortDate(item.date))}<span class="sub-cell">${escapeHTML(item.start)} a ${escapeHTML(item.end)}</span></td>
          <td>${logistics.length ? logistics.map(line => `<span class="sub-cell">${escapeHTML(line)}</span>`).join("") : "—"}</td>
          <td>${escapeHTML(item.notes || "—")}</td>
          <td>${statusBadge(requestStatus(item, quote))}</td>
          <td><div class="action-list">${item.status === "Descartada"
            ? `<button class="button small secondary" type="button" data-reactivate-request="${escapeHTML(item.id)}">Reactivar</button>`
            : quote
              ? `<button class="button small" type="button" data-view-quote="${escapeHTML(quote.id)}">Ver cotización</button>`
              : `<button class="button small" type="button" data-create-quote="${escapeHTML(item.id)}">Crear cotización</button><button class="button small secondary" type="button" data-discard-request="${escapeHTML(item.id)}">Descartar</button>`}</div></td>
        </tr>`;
      }).join("") || '<tr><td class="empty-row" colspan="9">No hay solicitudes que coincidan con la búsqueda.</td></tr>';
      document.querySelectorAll("[data-create-quote]").forEach(button => {
        button.addEventListener("click", () => openQuoteModal(button.dataset.createQuote, "create"));
      });
      document.querySelectorAll("#requests-body [data-view-quote]").forEach(button => button.addEventListener("click", () => openQuoteModal(null, "view", button.dataset.viewQuote)));
      document.querySelectorAll("[data-discard-request]").forEach(button => button.addEventListener("click", () => {
        const request = data.requests.find(item => item.id === button.dataset.discardRequest);
        if (!request) return;
        if (!window.confirm(`¿Descartar la solicitud de ${request.name}? Su horario quedará libre en el calendario. Podrás reactivarla después.`)) return;
        request.status = "Descartada";
        saveData();
        renderRequests();
        renderCalendar();
      }));
      document.querySelectorAll("[data-reactivate-request]").forEach(button => button.addEventListener("click", () => {
        const request = data.requests.find(item => item.id === button.dataset.reactivateRequest);
        if (!request) return;
        if (hasScheduleConflict(request)) {
          window.alert("No se puede reactivar: el horario de esta solicitud ya fue ocupado por otro registro.");
          return;
        }
        request.status = "Nueva";
        saveData();
        renderRequests();
        renderCalendar();
      }));
    }

    function renderQuotes() {
      const search = document.getElementById("quote-search").value.trim().toLocaleLowerCase("es");
      const quotes = data.quotes.filter(item =>
        `${item.quoteCode || ""} ${item.client} ${item.email} ${item.date}`.toLocaleLowerCase("es").includes(search)
      );
      document.getElementById("quote-count").textContent = `${quotes.length} ${quotes.length === 1 ? "cotización" : "cotizaciones"}`;
      document.getElementById("quote-foot").textContent = `Mostrando ${quotes.length} de ${data.quotes.length} cotizaciones.`;
      document.getElementById("quotes-body").innerHTML = quotes.map(item => `<tr>
        <td class="main-cell">${escapeHTML(item.quoteCode || "—")}</td>
        <td class="main-cell">${escapeHTML(item.client)}<span class="sub-cell">${escapeHTML(item.email)}</span></td>
        <td>${escapeHTML(formatShortDate(item.date))}</td><td>${escapeHTML(item.start)} a ${escapeHTML(item.end)}</td><td>${money(item.amount)}</td>
        <td>${escapeHTML(formatShortDate(item.createdAt))}</td>
        <td>${statusBadge(item.status || "En proceso")}</td>
        <td>${statusBadge(item.paymentStatus || "Sin pagos")}</td>
        <td><button class="button small" type="button" data-view-quote="${escapeHTML(item.id)}">Ver PDF</button></td>
      </tr>`).join("") || '<tr><td class="empty-row" colspan="9">No hay cotizaciones que coincidan con la búsqueda.</td></tr>';
      document.querySelectorAll("#quotes-body [data-view-quote]").forEach(button => button.addEventListener("click", () => openQuoteModal(null, "view", button.dataset.viewQuote)));
    }

    function openQuoteModal(requestId, mode, quoteId = "") {
      modalRequestId = requestId || "";
      modalQuoteId = quoteId;
      const quote = quoteId ? data.quotes.find(item => item.id === quoteId) : null;
      const request = requestId ? data.requests.find(item => item.id === requestId) : null;
      const customer = quote || request;
      if (!customer) return;
      const isReadOnly = mode === "view";
      if (isReadOnly) {
        openQuotePdf(quote.id);
        return;
      }
      document.getElementById("modal-title").textContent = isReadOnly ? "Detalle de cotización" : "Crear cotización";
      document.getElementById("modal-intro").textContent = !isReadOnly
        ? `Prepara una propuesta para ${customer.name}.`
        : `Propuesta para ${customer.client || customer.name}.`;
      const logistics = [
        customer.rehearsal && customer.rehearsalDate ? `Ensayo: ${formatDate(customer.rehearsalDate)}, ${customer.rehearsalStart} a ${customer.rehearsalEnd}` : "",
        customer.setupDate ? `Montaje: ${formatDate(customer.setupDate)}, ${customer.setupStart} a ${customer.setupEnd}` : "",
        customer.teardownDate ? `Desmontaje: ${formatDate(customer.teardownDate)}, ${customer.teardownStart} a ${customer.teardownEnd}` : ""
      ].filter(Boolean);
      const requestedAddons = customer.addons || data.requests.find(item => item.id === customer.requestId)?.addons || [];
      const requestedAddonsSummary = requestedAddons.map(addon => {
        const item = ADDON_CATALOG.find(entry => entry.key === addon.key);
        if (!item) return "";
        const quantity = addon.key === "parking"
          ? `${addon.quantity} auto${addon.quantity === 1 ? "" : "s"}, `
          : addon.key === "microphones" ? `${addon.quantity} micrófono${addon.quantity === 1 ? "" : "s"}, ` : "";
        const start = addon.start || customer.start;
        const end = addon.end || addHours(customer.start, addon.hours || 0);
        const hours = addon.hours || (start && end ? hoursBetween(start, end) : 0);
        return `${item.label}: ${quantity}${start}–${end} · ${money(addonCost(item, hours, addon.quantity))}`;
      }).filter(Boolean);
      document.getElementById("quote-client-info").innerHTML = `
        <div class="readonly-item"><span>Cliente</span><strong>${escapeHTML(customer.client || customer.name)}</strong></div>
        <div class="readonly-item"><span>DNI</span><strong>${escapeHTML(customer.dni || "No registrado")}</strong></div>
        <div class="readonly-item"><span>Correo</span><strong>${escapeHTML(customer.email)}</strong></div>
        <div class="readonly-item"><span>Teléfono</span><strong>${escapeHTML(customer.phone)}</strong></div>
        <div class="readonly-item"><span>Fecha del evento</span><strong>${escapeHTML(formatDate(customer.date))}</strong></div>
        <div class="readonly-item"><span>Horario solicitado</span><strong>${escapeHTML(customer.start)} a ${escapeHTML(customer.end)}</strong></div>
        <div class="readonly-item"><span>Duración del evento</span><strong>${Number(customer.end.slice(0, 2)) - Number(customer.start.slice(0, 2))} horas</strong></div>
        <div class="readonly-item"><span>Ensayo previo</span><strong>${customer.rehearsal && customer.rehearsalDate ? `${escapeHTML(formatDate(customer.rehearsalDate))}, ${escapeHTML(customer.rehearsalStart)} a ${escapeHTML(customer.rehearsalEnd)}` : "No solicitado"}</strong></div>
        <div class="readonly-item wide"><span>Extras solicitados por el cliente</span><strong>${escapeHTML(requestedAddonsSummary.join(" · ") || "Ninguno")}</strong></div>
        <div class="readonly-item wide"><span>Montaje y desmontaje</span><strong>${escapeHTML(logistics.filter(item => !item.startsWith("Ensayo:")).join(" · ") || "No solicitados")}</strong></div>`;
      const existingHourlyRate = quote?.hourlyRate ??
        (quote?.subtotal && quote?.hours ? quote.subtotal / quote.hours : 100);
      document.getElementById("quote-hourly-rate").value = existingHourlyRate;
      configureQuoteAddons(customer, quote);
      document.getElementById("quote-validity").value = String(quote?.validity || "7");
      document.getElementById("quote-services").value = quote?.services || (request ? `Alquiler del auditorio por ${hoursBetween(request.start, request.end)} horas.` : "");
      document.getElementById("quote-notes").value = quote?.notes || "";
      document.getElementById("quote-error").textContent = "";
      document.getElementById("quote-conflict").hidden = isReadOnly || !hasScheduleConflict(customer);
      document.getElementById("quote-edit-fields").hidden = isReadOnly;
      document.getElementById("quote-readonly-details").hidden = !isReadOnly;
      document.getElementById("quote-readonly-details").innerHTML = isReadOnly ? `
        <div class="quote-detail-row"><span>Estado de cotización</span><strong>${escapeHTML(quote.status)}</strong></div>
        <div class="quote-detail-row"><span>Estado del pago</span><strong><span class="status ${paymentClass[quote.paymentStatus] || "unpaid"}">${escapeHTML(quote.paymentStatus || "Sin pagos")}</span></strong></div>
        ${quote.subtotal != null && quote.tax != null
          ? `<div class="quote-detail-row"><span>Alquiler del espacio · ${money(quote.hourlyRate || 0)}/hora × ${escapeHTML(quote.hours || 0)} horas</span><strong>${money(quote.spaceSubtotal ?? (quote.hourlyRate || 0) * (quote.hours || 0))}</strong></div>
             ${(quote.addons || []).map(addon => `<div class="quote-detail-row"><span>${escapeHTML(addon.label)}${addon.key === "microphones" ? ` · ${escapeHTML(addon.quantity)} micrófono${addon.quantity === 1 ? "" : "s"}` : ""} · ${escapeHTML(addon.start || "—")} a ${escapeHTML(addon.end || "—")}</span><strong>${money(addon.amount)}</strong></div>`).join("")}
             <div class="quote-detail-row"><span>Subtotal</span><strong>${money(quote.subtotal)}</strong></div>
             <div class="quote-detail-row"><span>IGV (18 %)</span><strong>${money(quote.tax)}</strong></div>
             <div class="quote-detail-row"><span>Total final</span><strong>${money(quote.amount)}</strong></div>`
          : `<div class="quote-detail-row"><span>Monto total</span><strong>${money(quote.amount)}</strong></div>`}
        <div class="quote-detail-row"><span>Validez de la oferta</span><strong>${escapeHTML(quote.validity)} días</strong></div>
        <div class="quote-detail-row stacked"><span>Detalle de servicios</span><p>${escapeHTML(quote.services || "Sin detalle registrado.")}</p></div>
        ${quote.notes ? `<div class="quote-detail-row stacked"><span>Notas</span><p>${escapeHTML(quote.notes)}</p></div>` : ""}` : "";
      document.getElementById("quote-footnote").textContent = !isReadOnly
        ? "Después de guardar, podrás elegir correo, WhatsApp o ambos. El envío es una simulación."
        : `Creada el ${formatShortDate(quote.createdAt)}.`;
      quoteForm.querySelectorAll("input, select, textarea").forEach(element => { element.disabled = isReadOnly; });
      document.getElementById("save-quote").hidden = isReadOnly;
      document.getElementById("cancel-quote").textContent = isReadOnly ? "Cerrar" : "Cancelar";
      if (!isReadOnly) updateQuotePriceSummary();
      dialog.showModal();
    }

    function saveQuote() {
      const formError = document.getElementById("quote-error");
      if (!quoteForm.reportValidity()) return false;
      const request = modalRequestId ? data.requests.find(item => item.id === modalRequestId) : null;
      if (!request) {
        formError.textContent = "No se encontró la solicitud asociada a esta cotización.";
        return false;
      }
      const pricing = quotePricing(request);
      if (!Number.isFinite(pricing.total) || pricing.total <= 0) {
        formError.textContent = "Ingresa un precio por hora válido para calcular la cotización.";
        return false;
      }
      if (pricing.addons.some(addon =>
        !Number.isInteger(addon.hours) || addon.hours < 1 || addon.hours > pricing.hours ||
        !Number.isSafeInteger(addon.quantity) || addon.quantity < 1 ||
        addon.quantity > (ADDON_CATALOG.find(item => item.key === addon.key)?.quantityLimit || Number.MAX_SAFE_INTEGER)
      )) {
        formError.textContent = "Revisa las horas y unidades de los servicios adicionales. La cochera permite hasta 26 autos.";
        return false;
      }
      const newQuote = {
        id: `COT-${Date.now()}`,
        quoteCode: nextQuoteCode(String(today.getFullYear())),
        requestId: request.id,
        bookingId: "",
        client: request.name,
        dni: request.dni || "",
        email: request.email,
        phone: request.phone,
        date: request.date,
        start: request.start,
        end: request.end,
        rehearsal: request?.rehearsal || false,
        rehearsalDate: request?.rehearsalDate || "",
        rehearsalStart: request?.rehearsalStart || "",
        rehearsalEnd: request?.rehearsalEnd || "",
        setupDate: request?.setupDate || "",
        setupStart: request?.setupStart || "",
        setupEnd: request?.setupEnd || "",
        teardownDate: request?.teardownDate || "",
        teardownStart: request?.teardownStart || "",
        teardownEnd: request?.teardownEnd || "",
        hours: pricing.hours,
        hourlyRate: pricing.hourlyRate,
        spaceSubtotal: pricing.spaceSubtotal,
        addons: pricing.addons,
        addonsSubtotal: pricing.addonsSubtotal,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        amount: pricing.total,
        validity: Number(document.getElementById("quote-validity").value),
        services: document.getElementById("quote-services").value.trim(),
        notes: document.getElementById("quote-notes").value.trim(),
        paymentStatus: "Sin pagos",
        status: "En proceso",
        createdAt: toISO(today)
      };
      data.quotes.unshift(newQuote);
      if (request) request.status = "Cotizada";
      saveData();
      renderRequests();
      renderQuotes();
      renderCalendar();
      dialog.close();
      activeSendQuoteId = newQuote.id;
      document.getElementById("send-email-recipient").textContent = `(${newQuote.email})`;
      document.getElementById("send-phone-recipient").textContent = `(${newQuote.phone})`;
      document.getElementById("send-options").hidden = false;
      document.getElementById("send-confirmation").hidden = true;
      document.getElementById("send-error").textContent = "";
      document.getElementById("quote-send-form").reset();
      sendDialog.showModal();
      return true;
    }

    document.getElementById("quote-form").addEventListener("submit", event => {
      event.preventDefault();
      saveQuote(false);
    });
    document.getElementById("quote-send-form").addEventListener("submit", event => {
      event.preventDefault();
      const quote = data.quotes.find(item => item.id === activeSendQuoteId);
      const formError = document.getElementById("send-error");
      if (!quote) {
        formError.textContent = "No se encontró la cotización que se desea enviar.";
        return;
      }
      const channel = new FormData(event.currentTarget).get("send-channel");
      const recipients = {
        email: quote.email,
        whatsapp: quote.phone,
        both: `${quote.email} y ${quote.phone}`
      };
      if (!Object.prototype.hasOwnProperty.call(recipients, channel)) {
        formError.textContent = "Selecciona un medio de envío válido.";
        return;
      }
      quote.sentChannels = channel === "both" ? ["email", "whatsapp"] : [channel];
      quote.sentAt = new Date().toISOString();
      quote.sendMode = "simulated";
      quote.status = "Enviada";
      saveData();
      renderRequests();
      renderQuotes();
      renderCalendar();
      document.getElementById("send-confirmation-message").textContent =
        `${quote.quoteCode} · Se registró el envío simulado a ${recipients[channel]} por ${channel === "both" ? "correo electrónico y WhatsApp" : channel === "email" ? "correo electrónico" : "WhatsApp"}.`;
      document.getElementById("send-options").hidden = true;
      document.getElementById("send-confirmation").hidden = false;
    });
    document.getElementById("cancel-send").addEventListener("click", () => sendDialog.close());
    document.getElementById("close-send").addEventListener("click", () => sendDialog.close());
    document.getElementById("send-view-pdf").addEventListener("click", () => {
      openQuotePdf(activeSendQuoteId);
      sendDialog.close();
    });
    document.getElementById("quote-hourly-rate").addEventListener("input", updateQuotePriceSummary);
    function updateQuoteAddonEnd(item, request) {
      const startSelect = document.getElementById(item.start);
      const endSelect = document.getElementById(item.end);
      const previousEnd = endSelect.value;
      const eventEnd = Number(request.end.slice(0, 2));
      endSelect.replaceChildren(new Option("Hasta", ""));
      for (let hour = Number(startSelect.value.slice(0, 2)) + 1; hour <= eventEnd; hour++) {
        endSelect.add(new Option(`${pad(hour)}:00`, `${pad(hour)}:00`));
      }
      endSelect.value = [...endSelect.options].some(option => option.value === previousEnd)
        ? previousEnd : request.end;
    }

    quoteAddons.forEach(item => {
      const checkbox = document.getElementById(item.checkbox);
      checkbox.addEventListener("change", () => {
        document.getElementById(item.start).disabled = !checkbox.checked;
        document.getElementById(item.start).required = checkbox.checked;
        document.getElementById(item.end).disabled = !checkbox.checked;
        document.getElementById(item.end).required = checkbox.checked;
        if (item.quantity) {
          document.getElementById(item.quantity).disabled = !checkbox.checked;
          document.getElementById(item.quantity).required = checkbox.checked;
        }
        updateQuotePriceSummary();
      });
      document.getElementById(item.start).addEventListener("change", () => {
        const request = data.requests.find(entry => entry.id === modalRequestId) ||
          data.quotes.find(entry => entry.id === modalQuoteId);
        if (request) updateQuoteAddonEnd(item, request);
        updateQuotePriceSummary();
      });
      document.getElementById(item.end).addEventListener("change", updateQuotePriceSummary);
      if (item.quantity) document.getElementById(item.quantity).addEventListener("input", updateQuotePriceSummary);
    });
    document.getElementById("cancel-quote").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });

    document.getElementById("request-search").addEventListener("input", renderRequests);
    document.getElementById("request-filter").addEventListener("change", renderRequests);
    document.getElementById("quote-search").addEventListener("input", renderQuotes);
    document.getElementById("admin-prev-month").addEventListener("click", () => {
      monthCursor = calendarMode === "week"
        ? new Date(monthCursor.getFullYear(), monthCursor.getMonth(), monthCursor.getDate() - 7)
        : new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
      renderCalendar();
    });
    document.getElementById("admin-next-month").addEventListener("click", () => {
      monthCursor = calendarMode === "week"
        ? new Date(monthCursor.getFullYear(), monthCursor.getMonth(), monthCursor.getDate() + 7)
        : new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
      renderCalendar();
    });
    document.querySelectorAll("[data-calendar-view]").forEach(button => {
      button.addEventListener("click", () => {
        calendarMode = button.dataset.calendarView;
        if (calendarMode === "month") {
          monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
        } else {
          // La semana que se abre es la actual si se mira el mes en curso; en otro mes, la primera semana de ese mes.
          const base = monthCursor.getFullYear() === today.getFullYear() && monthCursor.getMonth() === today.getMonth()
            ? new Date(today) : new Date(monthCursor);
          base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
          monthCursor = base;
        }
        document.querySelectorAll("[data-calendar-view]").forEach(item => item.classList.toggle("active", item === button));
        renderCalendar();
      });
    });
    renderRequests();
    renderQuotes();
    renderCalendar();
    synchronizeStorage(() => {
      renderRequests();
      renderQuotes();
      renderCalendar();
    });
  }
})();
