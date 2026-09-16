/* ============================================================
   Team
   ------------------------------------------------------------
   Per-caller outreach metrics, ported from the calculation half of
   your v1 dashboard's js/team.js (the "Outreach Performance" panel)
   — same math (calls made, answered, applied, connect rate, close
   rates). The rendering half is dropped here since v1's version
   renders into a filter-toolbar-driven grid that doesn't exist in
   v2 yet (that's the Team page, a later phase) — General Overview's
   "Top Callers" list uses just the numbers, with its own compact
   markup that matches the new design.
   ============================================================ */

const Team = (() => {
  const TONES = ["#f2763f", "#14b8a6", "#f59e0b", "#8b5cf6", "#6366f1", "#22c55e", "#ef4444", "#64748b"];

  function initials(name) {
    const clean = String(name || "").trim();
    if (!clean) return "?";
    if (clean.length <= 3) return clean.toUpperCase();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function toneFor(name) {
    let h = 0;
    const s = String(name || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
  }

  function getCallers(records) {
    const set = new Set();
    records.forEach((r) => {
      if (r.calledBy) set.add(r.calledBy);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function isNoAnswer(rawStatus) {
    const s = String(rawStatus || "").trim().toLowerCase();
    return s.includes("no answer") || s.includes("no response");
  }

  function pct(n, d) {
    if (!d) return null;
    return Math.round((n / d) * 1000) / 10;
  }

  function computeMetrics(forGroup) {
    const callsMade = forGroup.length;
    const noAnswer = forGroup.filter((r) => isNoAnswer(r.status)).length;
    const answered = callsMade - noAnswer;
    const applied = forGroup.filter((r) => StatusSettings.classify(r.status) === "applied").length;
    return {
      callsMade,
      answered,
      applied,
      connectRate: pct(answered, callsMade),
      closeRateOverAnswered: pct(applied, answered),
      closeRateOverCalls: pct(applied, callsMade),
    };
  }

  function metricsFor(records, name) {
    return computeMetrics(records.filter((r) => r.calledBy === name));
  }

  function metricsForTeam(records) {
    return computeMetrics(records.filter((r) => !!r.calledBy));
  }

  return { getCallers, metricsFor, metricsForTeam, toneFor, initials, pct, isNoAnswer };
})();
