/* ==========================================================================
   Casa Olivo · Sistema de movimiento
   - Reveals al entrar en viewport, con stagger según el orden visual.
   - Parallax moderado del hero (solo transform).
   - Utilidades de feedback (bump).
   Las duraciones y curvas viven en CSS (tokens --t-* y --ease-*).
   ========================================================================== */

const Motion = (() => {
  "use strict";

  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => reducedQuery.matches;
  const STAGGER = 70;   // ms entre elementos
  const MAX_STEPS = 8;  // tope para que la última tarjeta no tarde demasiado

  let io = null;

  function reveal(el, delay = 0) {
    el.style.setProperty("--d", `${delay}ms`);
    el.classList.add("is-in");
  }

  /** Observa todos los [data-reveal] dentro de root que aún no se mostraron. */
  function observe(root = document) {
    const targets = root.querySelectorAll("[data-reveal]:not(.is-in)");
    if (reduced() || !("IntersectionObserver" in window)) {
      targets.forEach((el) => reveal(el));
      return;
    }
    io ??= new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top ||
            a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((e, i) => {
            reveal(e.target, Math.min(i, MAX_STEPS) * STAGGER);
            io.unobserve(e.target);
          });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
    );
    targets.forEach((el) => io.observe(el));
  }

  /** Parallax del hero: expone el progreso como --p (0 → 1). */
  function parallax(hero) {
    if (!hero) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = hero.offsetHeight || 1;
      const p = Math.min(Math.max(window.scrollY / h, 0), 1);
      hero.style.setProperty("--p", p.toFixed(4));
    };
    window.addEventListener("scroll", () => {
      if (reduced() || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /** Reinicia una animación de feedback breve. */
  function bump(el, cls = "is-bump") {
    if (!el || reduced()) return;
    el.classList.remove(cls);
    void el.offsetWidth; // fuerza reflow para reiniciar la animación
    el.classList.add(cls);
  }

  /** Espera a que termine una animación CSS (con timeout de seguridad). */
  function afterAnimation(el, fallback = 400) {
    if (reduced()) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { clearTimeout(t); el.removeEventListener("animationend", onEnd); resolve(); };
      const onEnd = (e) => { if (e.target === el) done(); };
      const t = setTimeout(done, fallback);
      el.addEventListener("animationend", onEnd);
    });
  }

  /**
   * Desplazamiento animado hasta la posición y (px).
   * Duración según la distancia; se cancela si el usuario hace scroll a mano.
   * Con "reducir movimiento" activo, el recorrido es más corto y rápido (≈300 ms).
   */
  let scrollRaf = 0;
  let cancelScroll = null;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function scrollTo(y, { onDone } = {}) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = Math.min(Math.max(y, 0), max);
    const from = window.scrollY;
    const dist = to - from;

    if (cancelScroll) cancelScroll();
    if (Math.abs(dist) < 2) {
      if (onDone) onDone();
      return;
    }

    const duration = reduced() ? 300 : Math.min(1100, Math.max(450, Math.abs(dist) * 0.45));
    const start = performance.now();
    const stop = () => {
      cancelAnimationFrame(scrollRaf);
      ["wheel", "touchstart", "keydown"].forEach((ev) => window.removeEventListener(ev, stop));
      cancelScroll = null;
    };
    cancelScroll = stop;
    ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, stop, { passive: true }));

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      window.scrollTo({ top: from + dist * easeInOutCubic(t), behavior: "auto" });
      if (t < 1) scrollRaf = requestAnimationFrame(step);
      else { stop(); if (onDone) onDone(); }
    };
    scrollRaf = requestAnimationFrame(step);
  }

  return { observe, parallax, bump, afterAnimation, reduced, scrollTo };
})();
