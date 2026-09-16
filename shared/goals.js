/* ============================================================
   Goals
   ------------------------------------------------------------
   Replaces the old fixed-4-metric weekly/monthly target model (calls/
   leads/referrals/applications, each with one number) with fully
   custom, user-defined goals — "call 20 tutors this week", "10
   applications from Beirut" — per the redesign request. Each goal is
   its own object: a metric, an optional narrowing dimension (vertical
   or district), a target number, and a period. Progress is computed
   live from the real Leads/Calls recruitment sheet (the same
   DataStore records every other page already fetches — see
   computeProgress below for exactly which fields it reads).

   The original 4 goals are kept as the starting content (seeded once,
   below) rather than dropped — matching the "keep the existing default
   goals" ask — but they're now ordinary entries in the same list, so
   they can be edited or deleted just like any goal the user adds.

   Storage: a NEW key ("servi_v2_custom_goals"), not the old
   "servi_dashboard_goals" — the data shape changed completely (an
   array of goal objects vs. {weekly:{...}, monthly:{...}}), so reusing
   the old key would hand old code a shape it can't parse. Nothing in
   this project reads the old key anymore after this change.

   Metric definitions (identical semantics to the old dataStore.js
   goalProgress(), which this supersedes):
     calls        — records with a truthy `calledBy`
     leads        — every record (any lead added, called or not)
     referrals    — records with a truthy `referredBy`
     applications — records whose Status classifies as "applied"
                    (StatusSettings.classify) — this is the recruitment
                    sheet's own Status column, the SAME thing Overview's
                    "Total Applied" KPI already counts; not the separate
                    Fillout "Applied" page/sheet.
   All four are filtered by `dateContacted` falling inside the goal's
   period (today/week/month), then optionally narrowed further by
   vertical (DataStore.verticalsOf) or district (AreaSettings.
   canonicalize, when that module happens to be loaded on the page;
   falls back to a plain trim+lowercase compare otherwise so this still
   works on a page that hasn't loaded areaSettings.js).
   ============================================================ */

const Goals = (() => {
  const KEY = "servi_v2_custom_goals";

  const METRICS = [
    { key: "calls", label: "Calls Made" },
    { key: "leads", label: "Leads Contacted" },
    { key: "referrals", label: "Referrals" },
    { key: "applications", label: "Applications" },
  ];

  const PERIODS = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  const DIMENSIONS = [
    { key: "", label: "No narrowing — all of them" },
    { key: "vertical", label: "A specific vertical" },
    { key: "district", label: "A specific district" },
  ];

  function defaultGoals() {
    return [
      { id: "default-calls", label: "Make 50 calls this week", metric: "calls", period: "week", target: 50, filterDimension: "", filterValue: "" },
      { id: "default-leads", label: "Contact 30 leads this week", metric: "leads", period: "week", target: 30, filterDimension: "", filterValue: "" },
      { id: "default-referrals", label: "Get 10 referrals this week", metric: "referrals", period: "week", target: 10, filterDimension: "", filterValue: "" },
      { id: "default-applications", label: "Reach 15 applications this week", metric: "applications", period: "week", target: 15, filterDimension: "", filterValue: "" },
    ];
  }

  function safeRead() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function safeWrite(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (_) {
      /* localStorage unavailable — changes just won't persist across reloads */
    }
  }

  // Seeds the 4 defaults exactly once, on whichever page first calls
  // getAll() after this ships — every page/tab shares the same list from
  // then on (it's just localStorage, same as every other v2 preference).
  function getAll() {
    let list = safeRead();
    if (!list) {
      list = defaultGoals();
      safeWrite(list);
    }
    return list;
  }

  function genId() {
    return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function add(goal) {
    const list = getAll();
    const withId = Object.assign({ filterDimension: "", filterValue: "" }, goal, { id: genId() });
    list.push(withId);
    safeWrite(list);
    return withId;
  }

  function update(id, patch) {
    const list = getAll();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch, { id });
    safeWrite(list);
    return list[idx];
  }

  function remove(id) {
    safeWrite(getAll().filter((g) => g.id !== id));
  }

  function resetToDefaults() {
    const list = defaultGoals();
    safeWrite(list);
    return list;
  }

  // ---------------- progress ----------------

  function periodRange(period) {
    const { startOfDay, startOfWeek, startOfMonth, addDays, addMonths } = DataStore._dateHelpers;
    const now = new Date();
    if (period === "today") return { start: startOfDay(now), end: addDays(startOfDay(now), 1) };
    if (period === "month") return { start: startOfMonth(now), end: addMonths(startOfMonth(now), 1) };
    return { start: startOfWeek(now), end: addDays(startOfWeek(now), 7) }; // default: week
  }

  function metricMatch(rec, metric) {
    if (metric === "calls") return !!rec.calledBy;
    if (metric === "leads") return true;
    if (metric === "referrals") return !!rec.referredBy;
    if (metric === "applications") return StatusSettings.classify(rec.status) === "applied";
    return false;
  }

  function dimensionMatch(rec, goal) {
    if (!goal.filterDimension || !goal.filterValue) return true;
    if (goal.filterDimension === "vertical") {
      return DataStore.verticalsOf(rec).includes(goal.filterValue);
    }
    if (goal.filterDimension === "district") {
      // NOTE: AreaSettings is declared with `const` in areaSettings.js, so it
      // only exists as a global lexical binding, not a `window` property —
      // `window.AreaSettings` would always be undefined even when the
      // script has loaded (see chart.js's identical fix for ChartSettings).
      const d = (typeof AreaSettings !== "undefined" ? AreaSettings.canonicalize(rec.district) : String(rec.district || "").trim()) || "";
      return d.trim().toLowerCase() === goal.filterValue.trim().toLowerCase();
    }
    return true;
  }

  // records: the recruitment sheet's records (DataStore.getAllRecords() —
  // same array Leads/Calls/Overview already have loaded). Returns
  // { current, target, pct } — pct is capped at 100 for the ring display,
  // and reads as 100% once current already meets/exceeds target even with
  // a target of 0 (an edge case, not a real goal, but shouldn't divide by 0).
  function computeProgress(goal, records) {
    const { start, end } = periodRange(goal.period);
    const current = (records || []).filter((r) => {
      if (!r.dateContacted || r.dateContacted < start || r.dateContacted >= end) return false;
      if (!metricMatch(r, goal.metric)) return false;
      return dimensionMatch(r, goal);
    }).length;
    const target = Math.max(0, Number(goal.target) || 0);
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : current > 0 ? 100 : 0;
    return { current, target, pct };
  }

  return {
    METRICS,
    PERIODS,
    DIMENSIONS,
    getAll,
    add,
    update,
    remove,
    resetToDefaults,
    computeProgress,
    periodRange,
  };
})();
