/* ============================================================
   ChartSettings
   ------------------------------------------------------------
   The dashboard-wide chart-type preference from Settings >
   Appearance > Chart Style (see settings.html's initChartStyleSection
   and shared/chart.js's Chart.render dispatcher, which reads this).

   Only ONE setting, applied to every chart on the dashboard that goes
   through Chart.render() — today that's Calls' "Calls Over Time" and
   Applied's "Applied Over Time" (the only 2 places shared/chart.js is
   used at all). Line/Bar/Horizontal Bar/Area are real, distinct
   renderings of that same daily-count data (see chart.js). Stacked
   Bar/Pie/Radial-Circular-Progress are included as options here (and
   get a real preview in Settings) because they were explicitly asked
   for, but a single daily-count series has nothing to stack or slice
   — so Settings marks those 3 "preview only" and Chart.render()
   quietly falls back to the closest real rendering (Stacked → Bar;
   Pie/Radial have no sane fallback for a 30-point trend line, so
   picking one of those just means Line/Bar/Horizontal Bar/Area stay
   selectable as the ones that actually change anything today).
   ============================================================ */

const ChartSettings = (() => {
  const KEY = "servi_v2_chart_type";
  const DEFAULT = "line";

  const TYPES = [
    { id: "line", label: "Line", appliesToCurrentCharts: true },
    { id: "bar", label: "Bar", appliesToCurrentCharts: true },
    { id: "hbar", label: "Horizontal Bar", appliesToCurrentCharts: true },
    { id: "area", label: "Area", appliesToCurrentCharts: true },
    { id: "stacked", label: "Stacked Bar", appliesToCurrentCharts: false },
    { id: "pie", label: "Pie", appliesToCurrentCharts: false },
    { id: "radial", label: "Radial / Circular Progress", appliesToCurrentCharts: false },
  ];

  function get() {
    try {
      const v = localStorage.getItem(KEY);
      return TYPES.some((t) => t.id === v) ? v : DEFAULT;
    } catch (_) {
      return DEFAULT;
    }
  }

  function set(id) {
    const t = TYPES.some((x) => x.id === id) ? id : DEFAULT;
    try {
      localStorage.setItem(KEY, t);
    } catch (_) {
      /* localStorage unavailable — selection just won't persist across reloads */
    }
  }

  return { get, set, TYPES, DEFAULT };
})();
