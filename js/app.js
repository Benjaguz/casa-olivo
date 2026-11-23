/* ==========================================================================
   Casa Olivo · Lógica de la carta
   Render de secciones, navegación con scrollspy, búsqueda y filtros,
   pedido persistente, detalle del plato.
   Depende de: data.js (CATEGORIES, TAGS, MENU) y motion.js (Motion).
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const fmt = (n) => money.format(n);
  const pad = (n) => String(n).padStart(2, "0");
  const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;
  const icon = (id, cls = "") => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#ico-${id}"/></svg>`;

  const byId = new Map(MENU.map((d) => [d.id, d]));
  const catById = new Map(CATEGORIES.map((c) => [c.id, c]));

  /* ---------- Estado ---------- */
  const STORE_KEY = "casaolivo-order";
  const state = {
    query: "",
    tags: new Set(),
    order: loadOrder(), // { [id]: cantidad }
    active: null,       // categoría visible (scrollspy)
  };

  function loadOrder() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      const clean = {};
      for (const [id, q] of Object.entries(raw)) {
        if (byId.has(Number(id)) && Number.isInteger(q) && q > 0) clean[id] = q;
      }
      return clean;
    } catch {
      return {};
    }
  }
  function saveOrder() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.order)); } catch { /* sin almacenamiento */ }
  }

  /* ---------- Elementos ---------- */
  const el = {
    hero: $(".hero"),
    navbar: $("#navbar"),
    cats: $("#cats"),
    indicator: $(".cats__indicator"),
    filterToggle: $("#filterToggle"),
    filterCount: $("#filterCount"),
    filterPanel: $("#filterPanel"),
    search: $("#search"),
    chips: $("#chips"),
    clearFilters: $("#clearFilters"),
    carta: $("#carta"),
    empty: $("#empty"),
    emptyClear: $("#emptyClear"),
    bar: $("#orderBar"),
    barCount: $("#orderCount"),
    barTotal: $("#orderBarTotal"),
    overlay: $("#overlay"),
    drawer: $("#drawer"),
    closeDrawer: $("#closeDrawer"),
    list: $("#orderList"),
    total: $("#orderTotal"),
    clearOrder: $("#clearOrder"),
    dialog: $("#dishDialog"),
    toast: $("#toast"),
  };

  /* ======================================================================
     Plantillas
     ====================================================================== */

  function mediaHTML(d, cls) {
    if (d.image) {
      return `<figure class="media ${cls}">
        <img src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy" decoding="async" width="1200" height="900">
      </figure>`;
    }
    return `<figure class="media media--art ${cls}" aria-hidden="true">${icon(d.cat, "media__icon")}</figure>`;
  }

  function tagsHTML(d) {
    return d.tags
      .filter((t) => t !== "chef")
      .map((t) => `<li class="tag tag--${t}">${TAGS[t].label}</li>`)
      .join("");
  }

  function qtyHTML(d) {
    const q = state.order[d.id] || 0;
    return `
      <div class="qty${q ? " has-qty" : ""}" data-qty-for="${d.id}">
        <button class="qty__btn qty__dec" type="button" data-action="dec" aria-label="Quitar uno de ${esc(d.name)}"${q ? "" : ' tabindex="-1"'}>${icon("minus")}</button>
        <span class="qty__val" aria-hidden="true">${q}</span>
        <button class="qty__btn qty__inc" type="button" data-action="inc" aria-label="Agregar ${esc(d.name)} al pedido">${icon("plus")}</button>
      </div>`;
  }

  function dishHTML(d, variant, n) {
    const chef = d.tags.includes("chef");
    const withMedia = variant === "feature" || variant === "card";
    const tags = tagsHTML(d);
    return `
      <article class="dish dish--${variant}" data-id="${d.id}" data-reveal>
        ${withMedia ? mediaHTML(d, "dish__media") : ""}
        <div class="dish__body">
          ${variant === "numbered" ? `<span class="dish__num" aria-hidden="true">${pad(n)}</span>` : ""}
          ${chef ? `<p class="dish__flag">${icon("leaf")}Recomendado de la casa</p>` : ""}
          <div class="dish__top">
            <h3 class="dish__name"><button class="dish__open" type="button" data-action="open">${esc(d.name)}</button></h3>
            <span class="dish__leader" aria-hidden="true"></span>
            <data class="dish__price" value="${d.price}">${fmt(d.price)}</data>
          </div>
          <p class="dish__desc">${esc(d.desc)}</p>
          <div class="dish__foot">
            ${tags ? `<ul class="tags" aria-label="Características">${tags}</ul>` : "<span></span>"}
            ${qtyHTML(d)}
          </div>
        </div>
      </article>`;
  }

  function sectionHTML(cat, index, dishes) {
    let featureId = null;
    // Solo se destaca un plato si es el recomendado de la casa (no cualquiera que quede tras filtrar)
    const featured = cat.layout === "feature" && dishes.find((d) => d.tags.includes("chef"));
    if (featured) {
      featureId = featured.id;
      dishes = [featured, ...dishes.filter((d) => d.id !== featureId)];
    }
    const variantFor = (d) => {
      if (d.id === featureId) return "feature";
      if (cat.layout === "cards") return "card";
      if (cat.layout === "numbered") return "numbered";
      return "row";
    };
    return `
      <section class="section section--${cat.layout}" id="sec-${cat.id}" data-cat="${cat.id}" aria-labelledby="h-${cat.id}">
        <header class="section__head" data-reveal>
          <span class="section__num">${pad(index + 1)}</span>
          <h2 class="section__title" id="h-${cat.id}">${esc(cat.name)}</h2>
          <span class="section__rule" aria-hidden="true"></span>
          <p class="section__count">${plural(dishes.length, cat.unit)}</p>
          ${icon(cat.id, "section__icon")}
        </header>
        <div class="section__items">
          ${dishes.map((d, i) => dishHTML(d, variantFor(d), i + 1)).join("")}
        </div>
      </section>`;
  }

  /* ======================================================================
     Filtros
     ====================================================================== */

  function matches(d) {
    for (const t of state.tags) if (!d.tags.includes(t)) return false;
    if (state.query) {
      const hay = normalize(`${d.name} ${d.desc}`);
      if (!hay.includes(normalize(state.query))) return false;
    }
    return true;
  }

  const filtersActive = () => state.tags.size + (state.query ? 1 : 0);

  function renderChips() {
    el.chips.innerHTML = Object.entries(TAGS)
      .map(([key, t]) => `
        <button class="chip chip--${key}" type="button" data-tag="${key}" aria-pressed="${state.tags.has(key)}">
          <span class="chip__check">${icon("check")}</span>${t.label}
        </button>`)
      .join("");
  }

  function updateFilterUI() {
    const n = filtersActive();
    el.filterCount.hidden = n === 0;
    el.filterCount.textContent = n;
    el.clearFilters.hidden = n === 0;
    $$("[data-tag]", el.chips).forEach((b) => b.setAttribute("aria-pressed", state.tags.has(b.dataset.tag)));
  }

  function clearFilters() {
    state.tags.clear();
    state.query = "";
    el.search.value = "";
    applyFilters();
  }

  function applyFilters() {
    updateFilterUI();
    renderMenu({ refresh: true });
    // Si el usuario está más abajo de la carta, lo llevamos al inicio de los resultados
    const top = el.carta.getBoundingClientRect().top;
    if (top < 0) scrollToEl(el.carta, false);
  }

  function setFilterPanel(open) {
    el.filterToggle.setAttribute("aria-expanded", open);
    el.filterPanel.classList.toggle("is-open", open);
    if (open) setTimeout(() => el.search.focus({ preventScroll: true }), 120);
  }

  /* ======================================================================
     Carta
     ====================================================================== */

  function renderMenu({ refresh = false } = {}) {
    let total = 0;
    const counts = {};
    el.carta.innerHTML = CATEGORIES.map((cat, i) => {
      const dishes = MENU.filter((d) => d.cat === cat.id && matches(d));
      counts[cat.id] = dishes.length;
      total += dishes.length;
      return dishes.length ? sectionHTML(cat, i, dishes) : "";
    }).join("");

    $$(".cat", el.cats).forEach((a) => {
      const empty = !counts[a.dataset.cat];
      a.classList.toggle("is-empty", empty);
      a.toggleAttribute("aria-disabled", empty);
    });

    el.empty.hidden = total > 0;
    el.carta.classList.toggle("is-refresh", refresh);
    Motion.observe(el.carta);
    updateSpy();
  }

  /** Actualiza solo los controles de cantidad de un plato (sin re-renderizar la carta). */
  function updateQtyControls(id) {
    const q = state.order[id] || 0;
    $$(`[data-qty-for="${id}"]`).forEach((box) => {
      box.classList.toggle("has-qty", q > 0);
      $(".qty__val", box).textContent = q;
      const dec = $(".qty__dec", box);
      if (q) dec.removeAttribute("tabindex");
      else dec.setAttribute("tabindex", "-1");
      Motion.bump($(".qty__val", box));
    });
  }

  /* ======================================================================
     Navegación por categorías (scrollspy + indicador)
     ====================================================================== */

  function renderCats() {
    const links = CATEGORIES.map((c) =>
      `<a class="cat" href="#sec-${c.id}" data-cat="${c.id}">${esc(c.name)}</a>`).join("");
    el.cats.insertAdjacentHTML("afterbegin", links);
  }

  function navHeight() {
    return el.navbar.getBoundingClientRect().height;
  }

  function scrollToEl(target, smooth = true, onDone) {
    const y = target.id === "inicio"
      ? 0
      : target.getBoundingClientRect().top + window.scrollY - navHeight() + 1;
    if (smooth && typeof Motion.scrollTo === "function") Motion.scrollTo(y, { onDone });
    else { window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" }); if (onDone) onDone(); }
  }

  function moveIndicator(link) {
    if (!link) {
      el.indicator.style.opacity = "0";
      return;
    }
    el.indicator.style.opacity = "1";
    el.indicator.style.transform = `translateX(${link.offsetLeft}px) scaleX(${link.offsetWidth / 100})`;
  }

  function setActive(catId) {
    if (state.active === catId) return;
    state.active = catId;
    let activeLink = null;
    $$(".cat", el.cats).forEach((a) => {
      const on = a.dataset.cat === catId;
      a.classList.toggle("is-active", on);
      if (on) { a.setAttribute("aria-current", "true"); activeLink = a; }
      else a.removeAttribute("aria-current");
    });
    moveIndicator(activeLink);
    // En mobile, mantener visible la categoría activa dentro de la barra
    if (activeLink && el.cats.scrollWidth > el.cats.clientWidth) {
      const left = activeLink.offsetLeft - (el.cats.clientWidth - activeLink.offsetWidth) / 2;
      el.cats.scrollTo({ left, behavior: Motion.reduced() ? "auto" : "smooth" });
    }
  }

  function updateSpy() {
    const line = navHeight() + window.innerHeight * 0.25;
    let current = null;
    for (const s of $$(".section", el.carta)) {
      if (s.getBoundingClientRect().top <= line) current = s.dataset.cat;
      else break;
    }
    // Al final de la página, activar la última sección
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      const last = $$(".section", el.carta).pop();
      if (last) current = last.dataset.cat;
    }
    setActive(current);
  }

  let spyTicking = false;
  function onScroll() {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(() => {
      spyTicking = false;
      updateSpy();
      el.navbar.classList.toggle("is-stuck", el.navbar.getBoundingClientRect().top <= 0 && window.scrollY > 0);
    });
  }

  /* ======================================================================
     Pedido
     ====================================================================== */

  function changeQty(id, delta) {
    const prev = state.order[id] || 0;
    const next = Math.max(0, prev + delta);
    if (next === 0) delete state.order[id];
    else state.order[id] = next;
    saveOrder();
    updateQtyControls(id);
    renderOrder({ bump: delta > 0 });
  }

  function renderOrder({ bump = false } = {}) {
    const entries = Object.entries(state.order);
    const count = entries.reduce((s, [, q]) => s + q, 0);
    const total = entries.reduce((s, [id, q]) => s + byId.get(Number(id)).price * q, 0);

    el.barCount.textContent = count;
    el.barTotal.textContent = fmt(total);
    el.total.textContent = fmt(total);
    const visible = count > 0;
    el.bar.classList.toggle("is-visible", visible);
    el.bar.tabIndex = visible ? 0 : -1;
    el.bar.setAttribute("aria-label", `Ver mi pedido: ${plural(count, ["plato", "platos"])}, total ${fmt(total)}`);
    if (bump) Motion.bump(el.barCount);

    el.list.innerHTML = entries.length
      ? entries.map(([id, q]) => {
          const d = byId.get(Number(id));
          return `
            <li class="line" data-id="${id}">
              <span class="line__icon">${icon(d.cat)}</span>
              <div class="line__info">
                <span class="line__name">${esc(d.name)}</span>
                <span class="line__unit">${fmt(d.price)} c/u</span>
              </div>
              <div class="line__side">
                <data class="line__price" value="${d.price * q}">${fmt(d.price * q)}</data>
                <div class="qty qty--sm has-qty" data-qty-for="${id}">
                  <button class="qty__btn qty__dec" type="button" data-action="dec" aria-label="Quitar uno de ${esc(d.name)}">${icon("minus")}</button>
                  <span class="qty__val" aria-label="Cantidad">${q}</span>
                  <button class="qty__btn qty__inc" type="button" data-action="inc" aria-label="Agregar uno de ${esc(d.name)}">${icon("plus")}</button>
                </div>
              </div>
            </li>`;
        }).join("")
      : `<li class="drawer__empty">Todavía no agregaste platos.</li>`;

    if (!visible && el.drawer.classList.contains("is-open")) closeDrawer();
  }

  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    el.drawer.inert = false;
    el.drawer.classList.add("is-open");
    el.overlay.classList.add("is-open");
    el.bar.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("is-locked");
    setTimeout(() => el.closeDrawer.focus({ preventScroll: true }), 60);
  }
  function closeDrawer() {
    el.drawer.classList.remove("is-open");
    el.overlay.classList.remove("is-open");
    el.bar.setAttribute("aria-expanded", "false");
    el.drawer.inert = true;
    document.documentElement.classList.remove("is-locked");
    if (lastFocus && document.contains(lastFocus) && lastFocus.offsetParent) lastFocus.focus({ preventScroll: true });
  }

  /* ======================================================================
     Detalle del plato
     ====================================================================== */

  let current = null;
  let toastTimer = 0;

  function syncDialogQty() {
    if (!current) return;
    const q = state.order[current.id] || 0;
    $("#dlgInOrder").textContent = q ? `Ya tenés ${q} en tu pedido.` : "";
  }

  function openDish(id) {
    const d = byId.get(id);
    if (!d) return;
    current = d;
    const cat = catById.get(d.cat);
    $("#dlgMedia").innerHTML = mediaHTML(d, "dish-dialog__figure");
    $("#dlgKicker").textContent = d.tags.includes("chef") ? `${cat.name} · Recomendado de la casa` : cat.name;
    $("#dlgName").textContent = d.name;
    $("#dlgDesc").textContent = d.desc;
    $("#dlgTags").innerHTML = tagsHTML(d);
    $("#dlgAllergens").textContent = d.allergens.length ? d.allergens.join(" · ") : "Sin alérgenos declarados.";
    const price = $("#dlgPrice");
    price.value = d.price;
    price.textContent = fmt(d.price);
    syncDialogQty();
    el.dialog.classList.remove("is-closing");
    el.dialog.showModal();
    document.documentElement.classList.add("is-locked");
  }

  async function closeDish() {
    if (!el.dialog.open || el.dialog.classList.contains("is-closing")) return;
    el.dialog.classList.add("is-closing");
    await Motion.afterAnimation(el.dialog, 350);
    el.dialog.close();
    el.dialog.classList.remove("is-closing");
    document.documentElement.classList.remove("is-locked");
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2200);
  }

  /* ======================================================================
     Eventos
     ====================================================================== */

  // Enlaces internos (categorías, "Ver la carta", marca, "Volver arriba", skip-link):
  // desplazamiento animado en lugar del salto instantáneo.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    // El skip-link mueve el foco al destino al terminar, para lectores de pantalla y teclado
    const focusAfter = a.classList.contains("skip-link");
    scrollToEl(target, true, focusAfter ? () => target.focus({ preventScroll: true }) : undefined);
  });

  // Filtros
  el.filterToggle.addEventListener("click", () =>
    setFilterPanel(el.filterToggle.getAttribute("aria-expanded") !== "true"));

  el.chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]");
    if (!b) return;
    const t = b.dataset.tag;
    if (state.tags.has(t)) state.tags.delete(t);
    else state.tags.add(t);
    applyFilters();
  });

  let searchTimer = 0;
  el.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = el.search.value.trim();
      applyFilters();
    }, 140);
  });

  el.clearFilters.addEventListener("click", clearFilters);
  el.emptyClear.addEventListener("click", clearFilters);

  // Carta: cantidad o abrir detalle
  el.carta.addEventListener("click", (e) => {
    const card = e.target.closest(".dish");
    if (!card) return;
    const id = Number(card.dataset.id);
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "inc") changeQty(id, 1);
    else if (action === "dec") changeQty(id, -1);
    else if (!window.getSelection()?.toString()) openDish(id);
  });

  // Pedido
  el.bar.addEventListener("click", openDrawer);
  el.closeDrawer.addEventListener("click", closeDrawer);
  el.overlay.addEventListener("click", closeDrawer);
  el.list.addEventListener("click", (e) => {
    const line = e.target.closest(".line");
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!line || !action) return;
    const id = Number(line.dataset.id);
    changeQty(id, action === "inc" ? 1 : -1);
    // Mantener el foco en el control re-renderizado
    const again = $(`.line[data-id="${id}"] [data-action="${action}"]`, el.list);
    (again || el.closeDrawer).focus({ preventScroll: true });
  });
  el.clearOrder.addEventListener("click", () => {
    const ids = Object.keys(state.order);
    state.order = {};
    saveOrder();
    ids.forEach((id) => updateQtyControls(Number(id)));
    renderOrder();
  });

  // Detalle
  $("#dlgAdd").addEventListener("click", () => {
    if (!current) return;
    changeQty(current.id, 1);
    toast(`${current.name} · agregado al pedido`);
    closeDish();
  });
  el.dialog.addEventListener("click", (e) => {
    if (e.target === el.dialog || e.target.closest("[data-close]")) closeDish();
  });
  el.dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeDish();
  });

  // Teclado global
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.drawer.classList.contains("is-open")) closeDrawer();
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    moveIndicator($(".cat.is-active", el.cats));
  });

  /* ======================================================================
     Inicio
     ====================================================================== */

  renderCats();
  renderChips();
  renderMenu();
  renderOrder();
  Motion.parallax(el.hero);
  Motion.observe(document);

  // La entrada del hero espera a las fuentes para no animar la tipografía de respaldo
  const ready = () => document.documentElement.classList.add("is-ready");
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(ready);
  document.fonts?.ready.then(() => moveIndicator($(".cat.is-active", el.cats)));
})();
