// Selectores de hora y de fecha con Flatpickr, iguales a los del gestor de eventos:
// - Hora: campo con ícono de reloj; el panel muestra «Hora» y «Minutos» con flechas y el botón «Listo».
// - Fecha: campo «dd/mm/aaaa» con ícono de calendario y calendario en español (lunes como primer día).
// Las listas de hora (<select>) y los campos de fecha originales siguen guardando el valor y se mantienen sincronizados,
// así que el resto del código (disponibilidad, precios, validaciones) no cambia.
(() => {
  "use strict";
  if (typeof flatpickr === "undefined") return;

  const ESPANOL = {
    weekdays: {
      shorthand: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
      longhand: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    },
    months: {
      shorthand: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
      longhand: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    },
    ordinal: () => "º",
    firstDayOfWeek: 1,
    rangeSeparator: " a ",
    time_24hr: true,
  };

  const ICONO_RELOJ = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>';
  const ICONO_CALENDARIO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';

  const esSelectorDeHora = el =>
    el.tagName === "SELECT" && (/^(start|end)-time$/.test(el.id) || /-(start|end)$/.test(el.id));
  const esCampoDeFecha = el => el.tagName === "INPUT" && /-date$/.test(el.id) && el.type === "date";

  const nombreDe = (control, porDefecto) => {
    if (control.getAttribute("aria-label")) return control.getAttribute("aria-label");
    const etiqueta = control.id && document.querySelector(`label[for="${control.id}"]`);
    return etiqueta ? etiqueta.textContent.replace("*", "").trim() : porDefecto;
  };

  // Tocar la etiqueta de un campo abre su selector (el control original queda oculto).
  const abridores = new Map(); // id del control original -> función que abre el selector
  document.addEventListener("click", evento => {
    const etiqueta = evento.target.closest && evento.target.closest("label[for]");
    const abrir = etiqueta && abridores.get(etiqueta.htmlFor);
    if (abrir) {
      evento.preventDefault();
      abrir();
    }
  });

  // Escape cierra cualquier panel abierto (los campos son de solo lectura y a veces no tienen el foco).
  const instancias = [];
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") instancias.forEach(instancia => { if (instancia.isOpen) instancia.close(); });
  });

  function envolver(control) {
    const envoltura = document.createElement("span");
    envoltura.className = "selector-envoltura";
    control.parentNode.insertBefore(envoltura, control);
    envoltura.appendChild(control);
    return envoltura;
  }

  /** Cabeceras «Hora» / «Minutos» y botón «Listo» en el panel de hora (igual que el gestor). */
  function personalizarPanelHora(instancia) {
    const panel = instancia.calendarContainer;
    const bloqueHora = panel.querySelector(".flatpickr-time");
    if (bloqueHora && !panel.querySelector(".flatpickr-time-header")) {
      const cabecera = document.createElement("div");
      cabecera.className = "flatpickr-time-header";
      cabecera.innerHTML = '<span class="fp-col-title">Hora</span><span class="fp-col-sep"></span><span class="fp-col-title">Minutos</span>';
      bloqueHora.parentNode.insertBefore(cabecera, bloqueHora);
    }
    if (!panel.querySelector(".flatpickr-time-footer")) {
      const pie = document.createElement("div");
      pie.className = "flatpickr-time-footer";
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn-fp-listo";
      boton.textContent = "Listo";
      boton.addEventListener("click", evento => {
        evento.preventDefault();
        evento.stopPropagation();
        instancia.close();
      });
      pie.appendChild(boton);
      panel.appendChild(pie);
    }
    // Los horarios son por hora exacta: los minutos se muestran en 00 y no se editan.
    const minutos = panel.querySelector(".flatpickr-minute");
    if (minutos) {
      minutos.readOnly = true;
      minutos.tabIndex = -1;
      minutos.closest(".numInputWrapper").classList.add("minutos-fijos");
    }
  }

  // ---------- Hora ----------
  function mejorarHora(select) {
    const envoltura = envolver(select);
    const entrada = document.createElement("input");
    entrada.type = "text";
    entrada.className = "selector-entrada";
    entrada.autocomplete = "off";
    const icono = document.createElement("span");
    icono.className = "selector-icono";
    icono.innerHTML = ICONO_RELOJ;
    const aviso = document.createElement("span");
    aviso.className = "selector-aviso";
    aviso.setAttribute("role", "alert");
    aviso.hidden = true;
    envoltura.append(entrada, icono, aviso);

    select.classList.add("hora-oculto");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const original = {
      value: Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value"),
      selectedIndex: Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex"),
    };
    let temporizador = 0;
    const avisar = texto => {
      aviso.textContent = texto;
      aviso.hidden = false;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => { aviso.hidden = true; }, 3500);
    };

    const fp = flatpickr(entrada, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      minuteIncrement: 1,
      minTime: "09:00",
      maxTime: "22:00",
      // Dentro de un cuadro de diálogo el panel debe dibujarse en el propio diálogo; si no, queda tapado por él.
      static: !!select.closest("dialog"),
      disableMobile: true,
      allowInput: false,
      onReady: (_f, _s, instancia) => personalizarPanelHora(instancia),
      onOpen: (_f, _s, instancia) => personalizarPanelHora(instancia),
      // Flatpickr avisa de «onChange» con 300 ms de retraso: se usa también onValueUpdate (inmediato) y onClose, para que
      // la lista oculta tenga la hora al instante aunque se pulse «Listo» enseguida.
      onChange: (_f, texto) => elegir(texto),
      onValueUpdate: (_f, texto) => elegir(texto),
      onClose: (_f, texto) => elegir(texto),
    });

    instancias.push(fp);

    function sincronizar() {
      const valor = original.value.get.call(select);
      const marcador = select.options.length ? select.options[0].textContent.trim() : "Elige hora";
      entrada.placeholder = marcador;
      entrada.disabled = select.disabled;
      entrada.setAttribute("aria-label", nombreDe(select, "Hora"));
      const primera = [...select.options].find(opcion => opcion.value !== "" && !opcion.disabled);
      // Se asigna directo (con fp.set Flatpickr volvería a avisar de un cambio y se enciclaría).
      if (primera) fp.config.defaultHour = Number(primera.value.slice(0, 2));
      if (valor) fp.setDate(valor, false, "H:i");
      else fp.clear(false);
    }

    // El usuario movió las flechas del panel: solo se aceptan horas exactas que la lista ofrece (libres y dentro del evento).
    function elegir(texto) {
      if (!texto) return;
      const hora = texto.slice(0, 2);
      const valor = `${hora}:00`;
      const opcion = [...select.options].find(item => item.value === valor);
      if (!opcion || opcion.disabled) {
        avisar(`${valor} no está disponible. Elige otra hora.`);
        sincronizar();
        return;
      }
      if (texto !== valor) fp.setDate(valor, false, "H:i");
      if (original.value.get.call(select) !== valor) {
        original.value.set.call(select, valor);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    select.addEventListener("change", sincronizar);
    new MutationObserver(sincronizar).observe(select, { childList: true, attributes: true, attributeFilter: ["disabled"] });
    // El código del prototipo cambia el valor desde JavaScript (sin eventos): se mantiene el campo al día.
    ["value", "selectedIndex"].forEach(propiedad => {
      Object.defineProperty(select, propiedad, {
        configurable: true,
        get() { return original[propiedad].get.call(this); },
        set(nuevo) { original[propiedad].set.call(this, nuevo); sincronizar(); },
      });
    });
    if (select.form) select.form.addEventListener("reset", () => setTimeout(sincronizar, 0));
    if (select.id) abridores.set(select.id, () => { if (!entrada.disabled) fp.open(); });
    sincronizar();
  }

  // ---------- Fecha ----------
  function mejorarFecha(campo) {
    const fp = flatpickr(campo, {
      locale: ESPANOL,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      disableMobile: true,
      allowInput: false,
      animate: false,
      position: "auto",
      minDate: campo.min || undefined,
      maxDate: campo.max || undefined,
      defaultDate: campo.value || undefined,
    });
    instancias.push(fp);
    const visible = fp.altInput;
    const envoltura = envolver(visible);
    envoltura.classList.add("selector-fecha");
    const icono = document.createElement("span");
    icono.className = "selector-icono";
    icono.innerHTML = ICONO_CALENDARIO;
    envoltura.appendChild(icono);
    visible.classList.add("selector-entrada");
    visible.setAttribute("aria-label", nombreDe(campo, "Fecha"));
    visible.placeholder = "dd/mm/aaaa";

    const original = {
      value: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value"),
      min: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "min"),
      max: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "max"),
    };
    // El código del prototipo asigna value, min y max directamente: se pasan al calendario.
    let escribiendo = false; // Flatpickr también escribe en este campo: sin la guarda se llamarían uno al otro sin fin
    Object.defineProperty(campo, "value", {
      configurable: true,
      get() { return original.value.get.call(this); },
      set(nuevo) {
        original.value.set.call(this, nuevo);
        if (escribiendo) return;
        escribiendo = true;
        try {
          if (nuevo) fp.setDate(nuevo, false, "Y-m-d");
          else fp.clear(false);
        } finally {
          escribiendo = false;
        }
      },
    });
    Object.defineProperty(campo, "min", {
      configurable: true,
      get() { return original.min.get.call(this); },
      set(nuevo) { original.min.set.call(this, nuevo); fp.set("minDate", nuevo || undefined); },
    });
    Object.defineProperty(campo, "max", {
      configurable: true,
      get() { return original.max.get.call(this); },
      set(nuevo) { original.max.set.call(this, nuevo); fp.set("maxDate", nuevo || undefined); },
    });
    const copiarEstado = () => {
      visible.disabled = campo.disabled;
      visible.required = campo.required;
    };
    new MutationObserver(copiarEstado).observe(campo, { attributes: true, attributeFilter: ["disabled", "required"] });
    copiarEstado();
    if (campo.form) campo.form.addEventListener("reset", () => setTimeout(() => fp.clear(false), 0));
    if (campo.id) abridores.set(campo.id, () => { if (!visible.disabled) fp.open(); });
  }

  document.querySelectorAll("select").forEach(select => { if (esSelectorDeHora(select)) mejorarHora(select); });
  document.querySelectorAll("input").forEach(campo => { if (esCampoDeFecha(campo)) mejorarFecha(campo); });
})();
