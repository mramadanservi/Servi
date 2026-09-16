/* ============================================================
   VerticalTargets
   ------------------------------------------------------------
   Optional, manually-set weekly "applications" target per vertical
   (Tutoring, Nursing, ...), ported unchanged from your v1 dashboard's
   js/verticalTargets.js. Used by the Leads page's "Verticals Needing
   Focus" panel to decide which verticals need attention.

   A vertical with no manual target here isn't left unmeasured — the
   Leads page automatically compares it against the average across
   every other vertical instead. Setting a number here just lets you
   override that automatic comparison with a real business target
   when you have one.

   Saved on the SAME localStorage key as v1 ("servi_dashboard_vertical_
   targets") on purpose — this is a business setting you configured,
   not a UI default, so any targets you've already set in v1 carry
   straight over. Same pattern as Goals / StatusSettings.
   ============================================================ */

const VerticalTargets = (() => {
  const KEY = "servi_dashboard_vertical_targets";

  function getAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  // Returns a positive number, or null if no manual target is set for
  // this vertical (the caller should fall back to the automatic average).
  function get(verticalKey) {
    const all = getAll();
    const v = Number(all[verticalKey]);
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  function saveAll(map) {
    localStorage.setItem(KEY, JSON.stringify(map));
  }

  // Reads every `[data-vertical-target]` input inside `container` and
  // saves them in one go. An empty/0 input clears that vertical's manual
  // target, returning it to automatic comparison.
  function saveFromInputs(container) {
    const map = getAll();
    container.querySelectorAll("input[data-vertical-target]").forEach((input) => {
      const key = decodeURIComponent(input.dataset.verticalTarget);
      const val = Math.max(0, Number(input.value) || 0);
      if (val > 0) map[key] = val;
      else delete map[key];
    });
    saveAll(map);
  }

  return { get, getAll, saveAll, saveFromInputs };
})();
