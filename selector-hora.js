// Selector de hora: reemplaza la lista desplegable nativa por un botón que abre un panel con las horas (mismo estilo que el
// selector de hora del gestor de eventos: panel «Hora» y botón «Listo»). La lista nativa queda oculta debajo y sigue siendo
// la que guarda el valor, así que el resto del código (y los lectores de pantalla) no cambian.
(() => {
  "use strict";

  const esSelectorDeHora = el =>
    el.tagName === "SELECT" && (/^(start|end)-time$/.test(el.id) || /-(start|end)$/.test(el.id));

  const ICONO_RELOJ = '<svg class="hora-icono" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>';

  const enlaces = new Map(); // select -> botón
  let abierto = null; // { select, boton }

  // ---------- Panel compartido ----------
  const panel = document.createElement("div");
  panel.className = "hora-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Elegir hora");
  panel.hidden = true;
  panel.innerHTML = '<div class="hora-panel-titulo">Hora</div><div class="hora-panel-rejilla" role="listbox"></div><div class="hora-panel-pie"><button type="button" class="btn-hora-listo">Listo</button></div>';
  document.body.appendChild(panel);
  const rejilla = panel.querySelector(".hora-panel-rejilla");

  function textoDe(select) {
    const opcion = select.options[select.selectedIndex];
    return select.value !== "" && opcion ? opcion.textContent.trim() : "";
  }

  function nombreDe(select) {
    if (select.getAttribute("aria-label")) return select.getAttribute("aria-label");
    const etiqueta = select.id && document.querySelector(`label[for="${select.id}"]`);
    return etiqueta ? etiqueta.textContent.replace("*", "").trim() : "Hora";
  }

  function refrescar(select) {
    const boton = enlaces.get(select);
    if (!boton) return;
    const valor = textoDe(select);
    const marcador = select.options.length ? select.options[0].textContent.trim() : "Elige hora";
    boton.querySelector(".hora-valor").textContent = valor || marcador;
    boton.classList.toggle("vacio", !valor);
    boton.disabled = select.disabled;
    boton.setAttribute("aria-label", `${nombreDe(select)}: ${valor || "sin elegir"}`);
    if (abierto && abierto.select === select) dibujarHoras();
  }

  function dibujarHoras() {
    const { select } = abierto;
    rejilla.innerHTML = "";
    const disponibles = new Map([...select.options].filter(opcion => opcion.value !== "").map(opcion => [opcion.value, opcion]));
    if (!disponibles.size) {
      rejilla.innerHTML = '<p class="hora-vacio">Todavía no hay horas para elegir. Elige primero la fecha o la hora de inicio.</p>';
      return;
    }
    // Siempre se muestra el horario completo (09:00 a 22:00): las horas que la lista no ofrece (ocupadas, anteriores al inicio o
    // fuera del evento) salen tachadas y sin poder elegirse, para que se vea por qué no están.
    const horas = [];
    for (let hora = 9; hora <= 22; hora++) horas.push(`${String(hora).padStart(2, "0")}:00`);
    disponibles.forEach((_, valor) => { if (!horas.includes(valor)) horas.push(valor); });
    horas.sort();
    horas.forEach(valor => {
      const opcion = disponibles.get(valor);
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "hora-opcion";
      boton.textContent = opcion ? opcion.textContent.trim() : valor;
      boton.setAttribute("role", "option");
      const elegida = !!opcion && valor === select.value;
      boton.setAttribute("aria-selected", String(elegida));
      if (elegida) boton.classList.add("elegida");
      if (!opcion || opcion.disabled) {
        boton.disabled = true;
        boton.title = "No disponible";
        rejilla.appendChild(boton);
        return;
      }
      boton.addEventListener("click", () => {
        select.value = opcion.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        refrescar(select);
      });
      rejilla.appendChild(boton);
    });
  }

  function colocar() {
    if (!abierto) return;
    const caja = abierto.boton.getBoundingClientRect();
    const ancho = panel.offsetWidth;
    const alto = panel.offsetHeight;
    const izquierda = Math.max(10, Math.min(caja.left, window.innerWidth - ancho - 10));
    let arriba = caja.bottom + 6;
    if (arriba + alto > window.innerHeight - 10 && caja.top - alto - 6 > 10) arriba = caja.top - alto - 6;
    panel.style.left = `${izquierda}px`;
    panel.style.top = `${Math.max(10, arriba)}px`;
  }

  function abrir(select, boton) {
    if (select.disabled) return;
    if (abierto) cerrar(false);
    abierto = { select, boton };
    boton.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    dibujarHoras();
    colocar();
    (rejilla.querySelector(".elegida") || rejilla.querySelector(".hora-opcion:not(:disabled)") || panel.querySelector(".btn-hora-listo")).focus({ preventScroll: true });
  }

  function cerrar(devolverFoco = true) {
    if (!abierto) return;
    const { boton } = abierto;
    boton.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    abierto = null;
    if (devolverFoco) boton.focus({ preventScroll: true });
  }

  panel.querySelector(".btn-hora-listo").addEventListener("click", () => cerrar());
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && abierto) {
      evento.preventDefault();
      cerrar();
    }
  });
  document.addEventListener("pointerdown", evento => {
    if (abierto && !panel.contains(evento.target) && !abierto.boton.contains(evento.target)) cerrar(false);
  });
  window.addEventListener("resize", colocar);
  window.addEventListener("scroll", colocar, true);

  // Tocar la etiqueta de un campo abre su selector (la lista nativa está oculta).
  document.addEventListener("click", evento => {
    const etiqueta = evento.target.closest && evento.target.closest("label[for]");
    const select = etiqueta && document.getElementById(etiqueta.htmlFor);
    const boton = select && enlaces.get(select);
    if (boton) {
      evento.preventDefault();
      boton.click();
    }
  });

  // ---------- Mejora de cada lista ----------
  function mejorar(select) {
    if (enlaces.has(select)) return;
    const envoltura = document.createElement("span");
    envoltura.className = "hora-envoltura";
    select.parentNode.insertBefore(envoltura, select);
    envoltura.appendChild(select);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "hora-trigger";
    boton.setAttribute("aria-haspopup", "dialog");
    boton.setAttribute("aria-expanded", "false");
    boton.innerHTML = `<span class="hora-valor"></span>${ICONO_RELOJ}`;
    envoltura.appendChild(boton);

    select.classList.add("hora-oculto");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    enlaces.set(select, boton);

    boton.addEventListener("click", () => (abierto && abierto.select === select ? cerrar() : abrir(select, boton)));
    select.addEventListener("change", () => refrescar(select));
    new MutationObserver(() => refrescar(select)).observe(select, { childList: true, attributes: true, attributeFilter: ["disabled"] });

    // El código del prototipo cambia el valor desde JavaScript (sin eventos): se mantiene el botón al día.
    ["value", "selectedIndex"].forEach(propiedad => {
      const original = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, propiedad);
      Object.defineProperty(select, propiedad, {
        configurable: true,
        get() { return original.get.call(this); },
        set(nuevo) { original.set.call(this, nuevo); refrescar(this); },
      });
    });
    if (select.form) select.form.addEventListener("reset", () => setTimeout(() => refrescar(select), 0));
    refrescar(select);
  }

  document.querySelectorAll("select").forEach(select => { if (esSelectorDeHora(select)) mejorar(select); });
})();
