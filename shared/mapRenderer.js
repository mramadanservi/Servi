/* ============================================================
   LebanonMap
   ------------------------------------------------------------
   Renders LEBANON_DISTRICTS (shared/lebanonGeo.js — the same real,
   GIS-derived district geometry used by the older, fully-built
   servi-unified-dashboard/map/ module) as an interactive SVG
   choropleth: hover to pop a district out and preview its count,
   click to zoom into it with an animation (the clicked district
   stays visible/zoomed rather than the map disappearing) and hand
   off to the caller (map.html) to render that district's area
   breakdown in the detail panel below the map.

   Ported near-verbatim from that module's js/mapRenderer.js — same
   math, same animation, same hover/zoom behavior — with only the
   CSS variable names swapped to this dashboard's tokens (--primary
   instead of --tone-primary, --map-empty is now a real defined
   token in shell.css instead of an inline fallback). Pure vanilla
   JS/SVG/CSS, no charting library.
   ============================================================ */

const LebanonMap = (() => {
  const NS = "http://www.w3.org/2000/svg";

  let svgEl = null;
  let districtsGroup = null;
  let fullViewBox = null; // [x, y, w, h]
  let zoomedId = null;
  let countsByDistrict = {}; // canonical district name -> count
  let maxCount = 1;
  let handlers = { click: null, hover: null };
  const pathById = {};
  const labelBgById = {};
  const countBgById = {};
  const countLabelById = {};

  // Sizes a label's background pill to hug its text (plus a little
  // padding) using the text element's own rendered bounding box -- only
  // works once the <text> is actually attached to a laid-out document, so
  // callers run this after the SVG is in the DOM (render()'s final pass,
  // and again from setCounts() whenever a count's digit-width changes).
  function sizePill(rectEl, textEl, padX, padY) {
    if (!textEl.textContent) {
      rectEl.setAttribute("width", 0);
      rectEl.setAttribute("height", 0);
      return;
    }
    const bbox = textEl.getBBox();
    rectEl.setAttribute("x", bbox.x - padX);
    rectEl.setAttribute("y", bbox.y - padY);
    rectEl.setAttribute("width", bbox.width + padX * 2);
    rectEl.setAttribute("height", bbox.height + padY * 2);
  }

  function parseViewBox(vb) {
    return vb.split(/\s+/).map(Number);
  }

  // A warm 4-stop scale (near-empty -> hottest) using Servi's own orange
  // accent family so the map reads as part of this dashboard rather than a
  // generic blue choropleth.
  function colorForRatio(t) {
    if (t <= 0) return "var(--map-empty)";
    const stops = [
      { t: 0, c: [255, 224, 189] },
      { t: 0.35, c: [248, 179, 108] },
      { t: 0.65, c: [242, 118, 63] },
      { t: 1, c: [196, 83, 31] },
    ];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) {
        a = stops[i];
        b = stops[i + 1];
        break;
      }
    }
    const span = b.t - a.t || 1;
    const localT = (t - a.t) / span;
    const c = a.c.map((v, i) => Math.round(v + (b.c[i] - v) * localT));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function colorFor(name) {
    const count = countsByDistrict[name] || 0;
    const t = maxCount > 0 ? count / maxCount : 0;
    return colorForRatio(t);
  }

  function bboxPad(bbox, padRatio) {
    const padX = bbox.width * padRatio;
    const padY = bbox.height * padRatio;
    return [bbox.x - padX, bbox.y - padY, bbox.width + padX * 2, bbox.height + padY * 2];
  }

  function animateViewBox(target, duration = 480) {
    const start = parseViewBox(svgEl.getAttribute("viewBox"));
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      // ease-out cubic
      const e = 1 - Math.pow(1 - p, 3);
      const cur = start.map((v, i) => v + (target[i] - v) * e);
      svgEl.setAttribute("viewBox", cur.join(" "));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function render(container) {
    fullViewBox = parseViewBox(LEBANON_MAP_VIEWBOX);
    svgEl = document.createElementNS(NS, "svg");
    svgEl.setAttribute("viewBox", LEBANON_MAP_VIEWBOX);
    svgEl.setAttribute("class", "lm-svg");
    svgEl.setAttribute("role", "img");
    svgEl.setAttribute("aria-label", "Map of Lebanon's districts");

    districtsGroup = document.createElementNS(NS, "g");
    districtsGroup.setAttribute("class", "lm-districts");

    LEBANON_DISTRICTS.forEach((d) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "lm-district-group");
      g.setAttribute("data-id", d.id);

      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d.path);
      path.setAttribute("class", "lm-district");
      path.setAttribute("data-id", d.id);
      path.setAttribute("data-name", d.name);
      pathById[d.id] = path;

      // Each label gets its own little rounded "pill" behind the text (see
      // sizePill() below) so the name/count stay readable regardless of
      // what color district or neighboring label happens to sit behind
      // them.
      const labelBg = document.createElementNS(NS, "rect");
      labelBg.setAttribute("class", "lm-label-bg");
      labelBg.setAttribute("rx", 4);

      const label = document.createElementNS(NS, "text");
      label.setAttribute("class", "lm-label");
      label.setAttribute("x", d.labelX);
      label.setAttribute("y", d.labelY);
      label.setAttribute("text-anchor", "middle");
      label.textContent = d.name;

      const countBg = document.createElementNS(NS, "rect");
      countBg.setAttribute("class", "lm-count-bg");
      countBg.setAttribute("rx", 4);

      const countLabel = document.createElementNS(NS, "text");
      countLabel.setAttribute("class", "lm-count-label");
      countLabel.setAttribute("x", d.labelX);
      countLabel.setAttribute("y", d.labelY + 17);
      countLabel.setAttribute("text-anchor", "middle");
      countLabel.setAttribute("data-count-for", d.id);

      g.appendChild(path);
      g.appendChild(labelBg);
      g.appendChild(label);
      g.appendChild(countBg);
      g.appendChild(countLabel);
      labelBgById[d.id] = labelBg;
      countBgById[d.id] = countBg;
      countLabelById[d.id] = countLabel;

      g.addEventListener("mouseenter", () => {
        if (zoomedId) return;
        g.classList.add("hovered");
        if (handlers.hover) handlers.hover(d, true);
      });
      g.addEventListener("mouseleave", () => {
        g.classList.remove("hovered");
        if (handlers.hover) handlers.hover(d, false);
      });
      g.addEventListener("click", () => {
        if (handlers.click) handlers.click(d);
      });

      districtsGroup.appendChild(g);
    });

    svgEl.appendChild(districtsGroup);
    container.innerHTML = "";
    container.appendChild(svgEl);

    // Name pills are sized once here -- the name text never changes, but
    // getBBox() only returns real numbers once the <text> is attached to a
    // laid-out document, which it now is.
    LEBANON_DISTRICTS.forEach((d) => {
      const label = districtsGroup.querySelector(`.lm-district-group[data-id="${d.id}"] .lm-label`);
      if (label && labelBgById[d.id]) sizePill(labelBgById[d.id], label, 5, 3);
    });
  }

  function setCounts(counts) {
    countsByDistrict = counts || {};
    maxCount = Math.max(1, ...Object.values(countsByDistrict));
    LEBANON_DISTRICTS.forEach((d) => {
      const path = pathById[d.id];
      if (path) path.style.fill = colorFor(d.name);
      const count = countsByDistrict[d.name] || 0;
      const countEl = countLabelById[d.id];
      if (countEl) {
        countEl.textContent = count ? String(count) : "";
        if (countBgById[d.id]) sizePill(countBgById[d.id], countEl, 5, 2.5);
      }
    });
  }

  function zoomTo(districtId) {
    const path = pathById[districtId];
    if (!path || !svgEl) return;
    zoomedId = districtId;
    districtsGroup.querySelectorAll(".lm-district-group").forEach((g) => {
      g.classList.toggle("dimmed", g.getAttribute("data-id") !== districtId);
      g.classList.toggle("zoomed-in", g.getAttribute("data-id") === districtId);
    });
    const bbox = path.getBBox();
    animateViewBox(bboxPad(bbox, 0.35));
  }

  function zoomOut() {
    zoomedId = null;
    districtsGroup.querySelectorAll(".lm-district-group").forEach((g) => {
      g.classList.remove("dimmed", "zoomed-in");
    });
    animateViewBox(fullViewBox);
  }

  function onClick(fn) {
    handlers.click = fn;
  }
  function onHover(fn) {
    handlers.hover = fn;
  }

  return { render, setCounts, zoomTo, zoomOut, onClick, onHover };
})();
