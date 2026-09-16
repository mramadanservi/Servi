/* ============================================================
   DataStore
   ------------------------------------------------------------
   The core aggregation logic (KPIs, the 9-vertical breakdown, time
   series, goal progress) ported from your v1 dashboard's
   js/dataStore.js — same math, same "Vertical Met" multi-category
   handling, same status-bucket classification via StatusSettings.

   The full filter toolbar (Called By / District / Area / date range
   etc.) from v1 isn't ported yet — that belongs to the Leads/Calls/
   Applied pages, a later phase — so getFilteredRecords() here is a
   placeholder that returns everything until those filters exist.
   Every function below already takes a records array as a parameter
   rather than reaching for a global, so wiring real filtering in
   later is a small change, not a rewrite.

   week-over-week comparisons (weekOverWeek) are NEW in v2 — v1 never
   needed them since it didn't show trend arrows on its KPI cards.
   ============================================================ */

const DataStore = (() => {
  let allRecords = [];

  // Labels are the FULL vertical name everywhere in the dashboard now (per
  // request) — never a shortened word like "Sitters" or "Sports". Where a
  // box is too narrow for the full name, the rendering code truncates with
  // CSS ellipsis and keeps the full name in a title="" tooltip, rather than
  // swapping in a hand-abbreviated label like the old VERTICAL_SHORT_LABELS
  // maps (now removed from every page) used to.
  const VERTICALS = [
    { key: "Tutoring", label: "Tutors", icon: "book-open" },
    { key: "Sport Coaching & Fitness Training", label: "Sport Coaches and Trainers", icon: "dumbbell" },
    { key: "Music & Art Instructing", label: "Music and Art Instructors", icon: "palette" },
    { key: "Babysitting and Nannying", label: "Baby Sitters and Nannies", icon: "baby" },
    { key: "Home-Based Therapy", label: "Home-Based Therapists", icon: "stethoscope" },
    { key: "Nursing", label: "Nurses", icon: "syringe" },
    { key: "Caregiving", label: "Caregivers", icon: "hand-heart" },
    { key: "Beauty Services", label: "Beauty Services", icon: "scissors" },
    { key: "Pet Services", label: "Pet Services", icon: "paw-print" },
  ];

  function normalizeVertical(v) {
    return String(v || "").trim().toLowerCase();
  }

  function verticalsOf(rec) {
    const raw = String(rec.vertical || "");
    if (!raw) return [];
    const parts = raw.split(",").map(normalizeVertical).filter(Boolean);
    return VERTICALS.filter((v) => parts.includes(normalizeVertical(v.key))).map((v) => v.key);
  }

  function verticalLabel(key) {
    const found = VERTICALS.find((v) => v.key === key);
    return found ? found.label : key;
  }

  function setRecords(records) {
    allRecords = records;
  }
  function getAllRecords() {
    return allRecords;
  }
  // Placeholder until the Leads/Calls/Applied filter toolbar is ported —
  // see file header.
  function getFilteredRecords() {
    return allRecords;
  }

  // ---------------- status buckets ----------------

  function statusBuckets(records) {
    const buckets = { applied: 0, applicationSent: 0, followUp: 0, notApplied: 0, other: 0 };
    records.forEach((r) => {
      const b = StatusSettings.classify(r.status);
      buckets[b] = (buckets[b] || 0) + 1;
    });
    return buckets;
  }

  // ---------------- date helpers ----------------

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function startOfWeek(d) {
    const x = startOfDay(d);
    const day = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - day);
    return x;
  }
  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function addMonths(d, n) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
  }

  // ---------------- KPIs ----------------

  function kpis(records) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const withCallDate = records.filter((r) => r.dateContacted && r.calledBy);
    const callsToday = withCallDate.filter((r) => r.dateContacted >= todayStart).length;
    const callsThisWeek = withCallDate.filter((r) => r.dateContacted >= weekStart).length;
    const callsThisMonth = withCallDate.filter((r) => r.dateContacted >= monthStart).length;

    const buckets = statusBuckets(records);
    const totalLeads = records.length;
    const totalCalled = records.filter((r) => !!r.calledBy).length;
    const conversionRate = totalLeads ? Math.round((buckets.applied / totalLeads) * 1000) / 10 : 0;
    const callConnectRate = totalLeads ? Math.round((totalCalled / totalLeads) * 1000) / 10 : 0;

    return {
      totalLeads,
      totalCalled,
      applied: buckets.applied,
      applicationSent: buckets.applicationSent,
      followUp: buckets.followUp,
      notApplied: buckets.notApplied,
      other: buckets.other,
      conversionRate,
      callConnectRate,
      callsToday,
      callsThisWeek,
      callsThisMonth,
    };
  }

  // ---------------- time series ----------------

  // `matchFn(rec)` narrows which records count in a bucket — e.g. only
  // ones with a call, or only ones classified "applied" — so the same
  // function drives both the Calls Over Time and Applied Over Time charts.
  function timeSeries(records, granularity, matchFn, count) {
    const match = matchFn || ((r) => !!r.dateContacted && !!r.calledBy);
    const withDate = records.filter((r) => r.dateContacted && match(r));
    const now = new Date();
    const buckets = [];

    if (granularity === "daily") {
      const n = count || 30; // default 30 days for the Calls/Applied Over Time charts
      for (let i = n - 1; i >= 0; i--) {
        const day = addDays(startOfDay(now), -i);
        buckets.push({ label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }), start: day, end: addDays(day, 1) });
      }
    } else if (granularity === "monthly") {
      const n = count || 12;
      for (let i = n - 1; i >= 0; i--) {
        const m = addMonths(startOfMonth(now), -i);
        buckets.push({ label: m.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), start: m, end: addMonths(m, 1) });
      }
    } else {
      const n = count || 12;
      for (let i = n - 1; i >= 0; i--) {
        const w = addDays(startOfWeek(now), -i * 7);
        buckets.push({ label: w.toLocaleDateString(undefined, { month: "short", day: "numeric" }), start: w, end: addDays(w, 7) });
      }
    }

    return buckets.map((b) => ({
      label: b.label,
      count: withDate.filter((r) => r.dateContacted >= b.start && r.dateContacted < b.end).length,
    }));
  }

  // ---------------- goals ----------------

  function goalPeriodRange(period) {
    const now = new Date();
    if (period === "monthly") {
      return { start: startOfMonth(now), end: addMonths(startOfMonth(now), 1) };
    }
    return { start: startOfWeek(now), end: addDays(startOfWeek(now), 7) };
  }

  function goalProgress(records, period) {
    const { start, end } = goalPeriodRange(period);
    const inPeriod = records.filter((r) => r.dateContacted && r.dateContacted >= start && r.dateContacted < end);
    const buckets = statusBuckets(inPeriod);
    return {
      calls: inPeriod.filter((r) => !!r.calledBy).length,
      leads: inPeriod.length,
      referrals: inPeriod.filter((r) => !!r.referredBy).length,
      applications: buckets.applied,
    };
  }

  // ---------------- week-over-week (new in v2, for KPI trend arrows) ----------------

  // Counts how many records satisfying matchFn fell in this week vs last
  // week (both by dateContacted), for the little up/down arrow + percentage
  // under each hero KPI number. Returns direction "up" | "down" | "flat" and
  // deltaPct null when there's no previous-week baseline to compare against
  // (shown as "New" by the caller instead of a made-up percentage).
  function weekOverWeek(records, matchFn) {
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = addDays(thisWeekStart, -7);
    const withDate = records.filter((r) => r.dateContacted && matchFn(r));
    const thisWeek = withDate.filter((r) => r.dateContacted >= thisWeekStart).length;
    const lastWeek = withDate.filter((r) => r.dateContacted >= lastWeekStart && r.dateContacted < thisWeekStart).length;
    let deltaPct = null;
    if (lastWeek > 0) deltaPct = Math.round(((thisWeek - lastWeek) / lastWeek) * 1000) / 10;
    const direction = thisWeek === lastWeek ? "flat" : thisWeek > lastWeek ? "up" : "down";
    return { thisWeek, lastWeek, deltaPct, direction };
  }

  // ---------------- generic period-over-period (Today/This Week/This
  // Month KPI trend arrows on Leads/Calls/Applied) ----------------

  // Same idea as weekOverWeek above, generalized to "day" | "week" | "month"
  // so a KPI card whose own period is "Added Today" compares against
  // yesterday, "Added This Week" against last week, "Added This Month"
  // against last month — each card against its own natural predecessor,
  // rather than every card being forced into a week-over-week comparison.
  function periodOverPeriod(records, matchFn, period) {
    const now = new Date();
    let curStart, prevStart, prevEnd;
    if (period === "day") {
      curStart = startOfDay(now);
      prevStart = addDays(curStart, -1);
      prevEnd = curStart;
    } else if (period === "month") {
      curStart = startOfMonth(now);
      prevStart = addMonths(curStart, -1);
      prevEnd = curStart;
    } else {
      curStart = startOfWeek(now);
      prevStart = addDays(curStart, -7);
      prevEnd = curStart;
    }
    const withDate = records.filter((r) => r.dateContacted && matchFn(r));
    const current = withDate.filter((r) => r.dateContacted >= curStart).length;
    const previous = withDate.filter((r) => r.dateContacted >= prevStart && r.dateContacted < prevEnd).length;
    let deltaPct = null;
    if (previous > 0) deltaPct = Math.round(((current - previous) / previous) * 1000) / 10;
    const direction = current === previous ? "flat" : current > previous ? "up" : "down";
    return { current, previous, deltaPct, direction };
  }

  // ---------------- vertical stats (for the 9-box grid) ----------------

  function verticalStats(records, key) {
    const matching = records.filter((r) => verticalsOf(r).includes(key));
    const totalLeads = matching.length;
    const callsMade = matching.filter((r) => !!r.calledBy).length;
    const applied = matching.filter((r) => StatusSettings.classify(r.status) === "applied").length;
    const conversionRate = totalLeads ? Math.round((applied / totalLeads) * 1000) / 10 : 0;
    return { totalLeads, callsMade, applied, conversionRate };
  }

  return {
    VERTICALS,
    verticalsOf,
    verticalLabel,
    verticalStats,
    setRecords,
    getAllRecords,
    getFilteredRecords,
    statusBuckets,
    kpis,
    timeSeries,
    goalProgress,
    goalPeriodRange,
    weekOverWeek,
    periodOverPeriod,
    _dateHelpers: { startOfDay, startOfWeek, startOfMonth, addDays, addMonths },
  };
})();
