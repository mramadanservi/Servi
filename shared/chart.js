/* ============================================================
   Chart
   ------------------------------------------------------------
   A small hand-built SVG line/area chart — NEW in v2, no prior v1
   equivalent to port (v1 never had a time-series chart). Built by
   hand rather than pulled in from a CDN library (Chart.js etc.) for
   two reasons: it keeps the dashboard fully self-contained (opens
   correctly even with no internet connection, same as every other
   page here), and it can be themed with the app's own CSS custom
   properties (var(--primary), light/dark tokens) the exact same way
   the Goals rings already are, instead of fighting a third-party
   theming API.

   This is deliberately a first, solid version — per the "will be
   later on customized if applicable in the settings" note, a
   settings-driven variant (different chart type, custom date range,
   etc.) is a natural follow-up, not part of this pass.

   Usage:
     Chart.lineChart(containerEl, [{ label, count }, ...], { tone: "primary" });

   `containerEl` needs a stable `id` (used to scope the gradient def
   and the tooltip element so multiple charts on one page don't clash).
   `tone` must match a defined `.tone-*` CSS rule (see shell.css) —
   "primary" and "good" are wired up today.
   ============================================================ */

const Chart = (() => {
  // Settings-driven chart type (see shared/chartSettings.js + Settings >
  // Appearance > Chart Style) — dispatches to whichever renderer below
  // matches, defaulting to the original line chart for an unknown/missing
  // type. This is the one entry point calls.html/applied.html now call
  // instead of Chart.lineChart() directly, so a Settings change is picked
  // up the next time either chart re-renders.
  function render(container, points, opts) {
    const o = opts || {};
    // NOTE: ChartSettings is declared with `const` in chartSettings.js, so it
    // only exists as a global lexical binding, NOT as a `window` property —
    // `window.ChartSettings` is always undefined even when the script has
    // loaded. Check `typeof ChartSettings` instead, which sees the binding.
    const type = o.type || (typeof ChartSettings !== "undefined" ? ChartSettings.get() : "line");
    if (type === "bar") return barChart(container, points, opts);
    if (type === "hbar") return hBarChart(container, points, opts);
    if (type === "area") return areaChart(container, points, opts);
    // "stacked"/"pie"/"radial" aren't meaningfully different from bar/line for
    // this single-series daily-count trend (no second series to stack or
    // slice) — see chartSettings.js's own note — so they fall back to the
    // closest real rendering instead of silently ignoring the preference.
    if (type === "stacked") return barChart(container, points, opts);
    return lineChart(container, points, opts);
  }

  function lineChart(container, points, opts) {
    const o = opts || {};
    const tone = o.tone || "primary";
    const height = o.height || 220;

    if (!points || !points.length) {
      container.innerHTML = `<p class="chart-empty">No data yet for this period.</p>`;
      return;
    }

    const width = Math.max(280, container.clientWidth || 600);
    const padding = { top: 18, right: 14, bottom: 26, left: 34 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const max = Math.max(1, ...points.map((p) => p.count));
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    const xAt = (i) => padding.left + i * stepX;
    const yAt = (v) => padding.top + innerH - (v / max) * innerH;
    const gradId = `${container.id}Grad`;

    const linePoints = points.map((p, i) => `${xAt(i)},${yAt(p.count)}`).join(" ");
    const areaPoints = `${xAt(0)},${padding.top + innerH} ${linePoints} ${xAt(points.length - 1)},${padding.top + innerH}`;

    const gridSteps = [0, 0.5, 1];
    const gridLines = gridSteps
      .map((f) => {
        const y = padding.top + innerH - f * innerH;
        const val = Math.round(max * f);
        return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-gridline" />
                <text x="${padding.left - 8}" y="${y + 3}" class="chart-axis-label" text-anchor="end">${val}</text>`;
      })
      .join("");

    const labelEvery = Math.max(1, Math.ceil(points.length / 6));
    const xLabels = points
      .map((p, i) => {
        if (i % labelEvery !== 0 && i !== points.length - 1) return "";
        return `<text x="${xAt(i)}" y="${height - 6}" class="chart-axis-label" text-anchor="middle">${p.label}</text>`;
      })
      .join("");

    const dots = points
      .map((p, i) => `<circle cx="${xAt(i)}" cy="${yAt(p.count)}" r="3" class="chart-dot tone-${tone}" data-index="${i}" />`)
      .join("");

    const lastIdx = points.length - 1;
    const lastPoint = points[lastIdx];
    const lastLabel = `
      <circle cx="${xAt(lastIdx)}" cy="${yAt(lastPoint.count)}" r="5" class="chart-dot-last tone-${tone}" />
      <text x="${Math.min(xAt(lastIdx), width - padding.right - 4)}" y="${Math.max(yAt(lastPoint.count) - 12, padding.top + 10)}" class="chart-last-value" text-anchor="end">${lastPoint.count}</text>`;

    const hitAreas = points
      .map((p, i) => {
        const half = (stepX || innerW) / 2;
        const hitX = Math.max(padding.left, xAt(i) - half);
        return `<rect x="${hitX}" y="${padding.top}" width="${stepX || innerW}" height="${innerH}" fill="transparent" data-index="${i}" class="chart-hit" />`;
      })
      .join("");

    container.innerHTML = `
      <div class="chart-tooltip" id="${container.id}Tooltip" hidden></div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="chart-grad-start tone-${tone}" />
            <stop offset="100%" class="chart-grad-end tone-${tone}" />
          </linearGradient>
        </defs>
        ${gridLines}
        <polygon points="${areaPoints}" fill="url(#${gradId})" />
        <polyline points="${linePoints}" class="chart-line tone-${tone}" />
        ${dots}
        ${lastLabel}
        ${xLabels}
        ${hitAreas}
      </svg>`;

    const tooltip = document.getElementById(`${container.id}Tooltip`);
    container.querySelectorAll(".chart-hit").forEach((hit) => {
      const i = Number(hit.dataset.index);
      const p = points[i];
      const show = (clientX, clientY) => {
        tooltip.innerHTML = `<strong>${p.count.toLocaleString()}</strong><span>${p.label}</span>`;
        tooltip.hidden = false;
        const rect = container.getBoundingClientRect();
        let left = clientX - rect.left;
        left = Math.max(4, Math.min(left, rect.width - 4));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${clientY - rect.top}px`;
      };
      hit.addEventListener("mousemove", (e) => show(e.clientX, e.clientY));
      hit.addEventListener("mouseenter", (e) => show(e.clientX, e.clientY));
      hit.addEventListener("mouseleave", () => {
        tooltip.hidden = true;
      });
    });
  }

  // Shared axis/grid/tooltip scaffolding used by bar/hbar/area below, kept
  // close to lineChart's own layout numbers so switching chart type doesn't
  // jump the surrounding card's height around.
  function wireTooltip(container, hitSelector, points, getLabel) {
    const tooltip = document.getElementById(`${container.id}Tooltip`);
    container.querySelectorAll(hitSelector).forEach((hit) => {
      const i = Number(hit.dataset.index);
      const p = points[i];
      const show = (clientX, clientY) => {
        tooltip.innerHTML = `<strong>${p.count.toLocaleString()}</strong><span>${getLabel(p)}</span>`;
        tooltip.hidden = false;
        const rect = container.getBoundingClientRect();
        let left = clientX - rect.left;
        left = Math.max(4, Math.min(left, rect.width - 4));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${clientY - rect.top}px`;
      };
      hit.addEventListener("mousemove", (e) => show(e.clientX, e.clientY));
      hit.addEventListener("mouseenter", (e) => show(e.clientX, e.clientY));
      hit.addEventListener("mouseleave", () => {
        tooltip.hidden = true;
      });
    });
  }

  function barChart(container, points, opts) {
    const o = opts || {};
    const tone = o.tone || "primary";
    const height = o.height || 220;
    if (!points || !points.length) {
      container.innerHTML = `<p class="chart-empty">No data yet for this period.</p>`;
      return;
    }
    const width = Math.max(280, container.clientWidth || 600);
    const padding = { top: 18, right: 14, bottom: 26, left: 34 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const max = Math.max(1, ...points.map((p) => p.count));
    const slot = innerW / points.length;
    const barW = Math.max(2, slot * 0.55);
    const yAt = (v) => padding.top + innerH - (v / max) * innerH;

    const gridSteps = [0, 0.5, 1];
    const gridLines = gridSteps
      .map((f) => {
        const y = padding.top + innerH - f * innerH;
        const val = Math.round(max * f);
        return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-gridline" />
                <text x="${padding.left - 8}" y="${y + 3}" class="chart-axis-label" text-anchor="end">${val}</text>`;
      })
      .join("");

    const labelEvery = Math.max(1, Math.ceil(points.length / 6));
    const xLabels = points
      .map((p, i) => {
        if (i % labelEvery !== 0 && i !== points.length - 1) return "";
        const cx = padding.left + i * slot + slot / 2;
        return `<text x="${cx}" y="${height - 6}" class="chart-axis-label" text-anchor="middle">${p.label}</text>`;
      })
      .join("");

    const bars = points
      .map((p, i) => {
        const x = padding.left + i * slot + (slot - barW) / 2;
        const y = yAt(p.count);
        const barH = Math.max(0, padding.top + innerH - y);
        return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" class="chart-bar tone-${tone}" data-index="${i}" />`;
      })
      .join("");

    const hitAreas = points
      .map((p, i) => `<rect x="${padding.left + i * slot}" y="${padding.top}" width="${slot}" height="${innerH}" fill="transparent" data-index="${i}" class="chart-hit" />`)
      .join("");

    container.innerHTML = `
      <div class="chart-tooltip" id="${container.id}Tooltip" hidden></div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="chart-svg" preserveAspectRatio="none">
        ${gridLines}
        ${bars}
        ${xLabels}
        ${hitAreas}
      </svg>`;

    wireTooltip(container, ".chart-hit", points, (p) => p.label);
  }

  // A wide, few-category view reads better sideways — here it shows the
  // last N points top-to-bottom (most recent on top) rather than 30 tiny
  // horizontal slivers, which is what an honest horizontal-bar rendering
  // of a 30-day daily trend looks like without inventing a different data
  // shape than the line/bar versions use.
  // Rough "does this label fit in `px` pixels" estimate for the left-axis
  // labels below — good enough to size the gutter and decide when to
  // truncate without needing a live DOM/canvas measurement. ~5.6px/char is
  // a reasonable average for the 10px Inter axis-label font.
  function truncateLabel(label, px) {
    const str = String(label == null ? "" : label);
    const maxChars = Math.max(3, Math.floor(px / 5.6));
    if (str.length <= maxChars) return { text: str, truncated: false };
    return { text: str.slice(0, maxChars - 1).trimEnd() + "…", truncated: true };
  }

  function hBarChart(container, points, opts) {
    const o = opts || {};
    const tone = o.tone || "primary";
    const maxRows = o.maxRows || 10;
    const shown = points.slice(-maxRows).reverse();
    const rowH = 28;
    const height = o.height || Math.max(140, shown.length * rowH + 20);
    if (!points || !points.length) {
      container.innerHTML = `<p class="chart-empty">No data yet for this period.</p>`;
      return;
    }
    const width = Math.max(280, container.clientWidth || 600);
    // Wider label gutter is available on request (e.g. full vertical names
    // like "Sport Coaches and Trainers") — still capped and truncated with
    // an ellipsis + native tooltip rather than letting long labels run past
    // the chart's own left edge, which is what happened before this was
    // configurable (every label used a fixed 70px gutter regardless of
    // content).
    const labelGutter = o.labelWidth || 70;
    const padding = { top: 10, right: 44, bottom: 10, left: labelGutter };
    const innerW = width - padding.left - padding.right;
    const max = Math.max(1, ...shown.map((p) => p.count));

    const rows = shown
      .map((p, i) => {
        const y = padding.top + i * rowH;
        const barW = Math.max(1, (p.count / max) * innerW);
        const fit = truncateLabel(p.label, padding.left - 12);
        const labelEl = fit.truncated
          ? `<title>${p.label}</title>${fit.text}`
          : fit.text;
        return `
          <text x="${padding.left - 8}" y="${y + rowH / 2 + 4}" class="chart-axis-label" text-anchor="end">${labelEl}</text>
          <rect x="${padding.left}" y="${y + 5}" width="${innerW}" height="${rowH - 10}" rx="4" class="chart-hbar-track" />
          <rect x="${padding.left}" y="${y + 5}" width="${barW}" height="${rowH - 10}" rx="4" class="chart-bar tone-${tone}" data-index="${points.indexOf(p)}" />
          <text x="${padding.left + barW + 8}" y="${y + rowH / 2 + 4}" class="chart-hbar-value">${p.count}</text>`;
      })
      .join("");

    container.innerHTML = `
      <div class="chart-tooltip" id="${container.id}Tooltip" hidden></div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="chart-svg" preserveAspectRatio="none">
        ${rows}
      </svg>`;
  }

  // Same layout as lineChart but a plain filled area (no per-point dots, no
  // last-value callout) for a cleaner, quieter look — a genuinely distinct
  // visual from Line, not a re-skin.
  function areaChart(container, points, opts) {
    const o = opts || {};
    const tone = o.tone || "primary";
    const height = o.height || 220;
    if (!points || !points.length) {
      container.innerHTML = `<p class="chart-empty">No data yet for this period.</p>`;
      return;
    }
    const width = Math.max(280, container.clientWidth || 600);
    const padding = { top: 18, right: 14, bottom: 26, left: 34 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const max = Math.max(1, ...points.map((p) => p.count));
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    const xAt = (i) => padding.left + i * stepX;
    const yAt = (v) => padding.top + innerH - (v / max) * innerH;
    const gradId = `${container.id}Grad`;

    const linePoints = points.map((p, i) => `${xAt(i)},${yAt(p.count)}`).join(" ");
    const areaPoints = `${xAt(0)},${padding.top + innerH} ${linePoints} ${xAt(points.length - 1)},${padding.top + innerH}`;

    const gridSteps = [0, 0.5, 1];
    const gridLines = gridSteps
      .map((f) => {
        const y = padding.top + innerH - f * innerH;
        const val = Math.round(max * f);
        return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-gridline" />
                <text x="${padding.left - 8}" y="${y + 3}" class="chart-axis-label" text-anchor="end">${val}</text>`;
      })
      .join("");

    const labelEvery = Math.max(1, Math.ceil(points.length / 6));
    const xLabels = points
      .map((p, i) => {
        if (i % labelEvery !== 0 && i !== points.length - 1) return "";
        return `<text x="${xAt(i)}" y="${height - 6}" class="chart-axis-label" text-anchor="middle">${p.label}</text>`;
      })
      .join("");

    const hitAreas = points
      .map((p, i) => {
        const half = (stepX || innerW) / 2;
        const hitX = Math.max(padding.left, xAt(i) - half);
        return `<rect x="${hitX}" y="${padding.top}" width="${stepX || innerW}" height="${innerH}" fill="transparent" data-index="${i}" class="chart-hit" />`;
      })
      .join("");

    container.innerHTML = `
      <div class="chart-tooltip" id="${container.id}Tooltip" hidden></div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="chart-grad-start tone-${tone}" />
            <stop offset="100%" class="chart-grad-end tone-${tone}" />
          </linearGradient>
        </defs>
        ${gridLines}
        <polygon points="${areaPoints}" fill="url(#${gradId})" />
        <polyline points="${linePoints}" class="chart-line tone-${tone}" />
        ${xLabels}
        ${hitAreas}
      </svg>`;

    wireTooltip(container, ".chart-hit", points, (p) => p.label);
  }

  return { render, lineChart, barChart, hBarChart, areaChart };
})();
