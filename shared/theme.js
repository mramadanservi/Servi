/* ============================================================
   Theme / Appearance
   ------------------------------------------------------------
   Started as just light/dark; now also owns the full Appearance
   settings surface from the redesign spec: theme MODE (light / dark
   — the old third "Default" / follow-the-OS option has been removed
   per request, since Light already IS the default), a color PALETTE
   (5 fixed options — see shell.css's [data-palette] blocks), and a
   GLASS mode (standard / glass). All three are applied here, in one
   place, so every page only ever needs the one `Theme.init()` call
   it already has in its bootstrap script — nothing needed to change
   on any of the other dashboard pages to pick this up.

   Anyone who previously had "system" selected keeps whatever their
   screen currently shows (resolved once, below) rather than being
   silently switched to Light — it just stops tracking the OS live
   from that point on, since there's no more UI to re-select it.

   Storage keys use this project's own "servi_v2_..." prefix (see the
   original note below about not reusing v1's key). Defaults are
   chosen for continuity with what already shipped: mode defaults to
   "light" (not "system") so nobody's screen changes color the moment
   this ships; palette defaults to "servi" (the existing orange/cream
   look — completely unchanged unless someone opens Settings and picks
   something else); glass defaults to "standard" (off).

   Original note, still true: v2 intentionally does NOT reuse v1's
   "servi_dashboard_theme" key — a dark-mode preference left over from
   v1 shouldn't silently carry into this fresh project.
   ============================================================ */

const Theme = (() => {
  const MODE_KEY = "servi_v2_theme_mode"; // "light" | "dark" (a legacy "system" value still gets read/migrated once, see getMode)
  const LEGACY_THEME_KEY = "servi_v2_theme"; // pre-Settings-redesign key: held the RESOLVED value directly ("light"/"dark"), read once below for a smooth upgrade, never written again.
  const PALETTE_KEY = "servi_v2_palette"; // "servi" | "ocean" | "emerald" | "violet" | "rose"
  const GLASS_KEY = "servi_v2_glass"; // "standard" | "glass"

  const DEFAULT_MODE = "light";
  const DEFAULT_PALETTE = "servi";
  const DEFAULT_GLASS = "standard";

  const PALETTES = [
    { id: "servi", label: "Servi Orange", swatch: "#f2763f" },
    { id: "ocean", label: "Ocean Blue", swatch: "#2563eb" },
    { id: "emerald", label: "Emerald Teal", swatch: "#059669" },
    { id: "violet", label: "Royal Violet", swatch: "#7c3aed" },
    { id: "rose", label: "Berry Rose", swatch: "#e11d48" },
  ];

  function safeGet(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (_) {
      return fallback;
    }
  }
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      /* localStorage unavailable — setting just won't persist across reloads */
    }
  }

  function systemPrefersDark() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (_) {
      return false;
    }
  }

  /* ---------------- mode (light/dark/system) ---------------- */

  function getMode() {
    // One-time upgrade path: someone who already had the old resolved-value
    // key set (light/dark, no "system" option existed yet) keeps exactly
    // the appearance they had — read it as the mode too, this once.
    const raw = localStorage_getRaw(MODE_KEY);
    if (raw === "light" || raw === "dark") return raw;
    // Legacy "system" mode (option removed — Light/Dark only now): resolve
    // it to whatever it was CURRENTLY showing and store that as a fixed
    // mode, once, so removing the option doesn't visibly flip anyone's
    // screen the next time this loads.
    if (raw === "system") {
      const resolved = systemPrefersDark() ? "dark" : "light";
      safeSet(MODE_KEY, resolved);
      return resolved;
    }
    const legacy = localStorage_getRaw(LEGACY_THEME_KEY);
    if (legacy === "light" || legacy === "dark") return legacy;
    return DEFAULT_MODE;
  }

  function localStorage_getRaw(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function resolvedTheme(mode) {
    const m = mode || getMode();
    return m === "dark" ? "dark" : "light";
  }

  function applyMode(mode) {
    document.documentElement.setAttribute("data-theme", resolvedTheme(mode));
  }

  function setMode(mode) {
    const m = mode === "dark" ? "dark" : "light";
    safeSet(MODE_KEY, m);
    applyMode(m);
  }

  // Old API some earlier code may still call — kept working (toggle just
  // flips between light/dark, same as before "system" existed).
  function toggle() {
    setMode(resolvedTheme() === "dark" ? "light" : "dark");
  }
  function get() {
    return resolvedTheme();
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }

  /* ---------------- palette ---------------- */

  function getPalette() {
    const p = safeGet(PALETTE_KEY, DEFAULT_PALETTE);
    return PALETTES.some((x) => x.id === p) ? p : DEFAULT_PALETTE;
  }

  function applyPalette(palette) {
    const p = PALETTES.some((x) => x.id === palette) ? palette : DEFAULT_PALETTE;
    if (p === DEFAULT_PALETTE) {
      document.documentElement.removeAttribute("data-palette");
    } else {
      document.documentElement.setAttribute("data-palette", p);
    }
  }

  function setPalette(palette) {
    safeSet(PALETTE_KEY, palette);
    applyPalette(palette);
  }

  /* ---------------- glass mode ---------------- */

  function getGlass() {
    const g = safeGet(GLASS_KEY, DEFAULT_GLASS);
    return g === "glass" ? "glass" : "standard";
  }

  function applyGlass(glass) {
    if (glass === "glass") document.documentElement.setAttribute("data-glass", "glass");
    else document.documentElement.removeAttribute("data-glass");
  }

  function setGlass(glass) {
    const g = glass === "glass" ? "glass" : "standard";
    safeSet(GLASS_KEY, g);
    applyGlass(g);
  }

  /* ---------------- reset ---------------- */

  // "Restore default Servi appearance" — Settings' Appearance section asks
  // for this as its own explicit action (with its own confirm/feedback in
  // the UI layer). This just does the actual reset; settings.html handles
  // the confirmation dialog and success toast around calling it.
  function resetAppearance() {
    setMode(DEFAULT_MODE);
    setPalette(DEFAULT_PALETTE);
    setGlass(DEFAULT_GLASS);
  }

  /* ---------------- init ---------------- */

  function applyAll() {
    applyMode(getMode());
    applyPalette(getPalette());
    applyGlass(getGlass());
  }

  function init() {
    applyAll();

    // Cross-tab sync — Settings open in one tab should live-update every
    // other open tab, same convention already used for the old theme key.
    window.addEventListener("storage", (e) => {
      if (e.key === MODE_KEY || e.key === PALETTE_KEY || e.key === GLASS_KEY) applyAll();
    });
  }

  return {
    init,
    get,
    apply,
    toggle,
    getMode,
    setMode,
    resolvedTheme,
    PALETTES,
    getPalette,
    setPalette,
    getGlass,
    setGlass,
    resetAppearance,
  };
})();
