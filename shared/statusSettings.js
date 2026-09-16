/* ============================================================
   StatusSettings
   ------------------------------------------------------------
   Ported from your v1 dashboard's js/statusSettings.js, unchanged.
   Your sheet's Status column can contain any wording your team
   uses ("Applied", "Application Sent", "Not Interested", "No
   Answer", ...) — this maps every value to one of five buckets so
   KPIs/charts can report "how many applied" correctly.

   Deliberately kept on the SAME localStorage key as v1
   ("servi_dashboard_status_map"): this is a business setting (what
   counts as "applied") rather than a UI preference like the theme
   default, so if you've already customized this mapping in v1, v2
   picks it up automatically instead of starting from scratch. If
   that's ever unwanted, this is the one line to change.
   ============================================================ */

const StatusSettings = (() => {
  const KEY = "servi_dashboard_status_map";
  const BUCKETS = [
    { key: "applied", label: "Applied" },
    { key: "applicationSent", label: "Application Sent" },
    { key: "followUp", label: "Follow Up" },
    { key: "notApplied", label: "Not Applied" },
    { key: "other", label: "Other / Pending" },
  ];

  function guessBucket(rawStatus) {
    const s = String(rawStatus || "").trim().toLowerCase();
    if (!s) return "notApplied";
    if (s.includes("applied") || s.includes("hired") || s.includes("onboard")) return "applied";
    if (s.includes("sent") || s.includes("application sent") || s.includes("pending review")) return "applicationSent";
    if (s === "fup" || s.includes("fup") || s.includes("follow up") || s.includes("follow-up") || s.includes("followup")) return "followUp";
    if (s.includes("not applied") || s.includes("declined") || s.includes("not interested") || s.includes("rejected") || s.includes("no answer") || s.includes("no response")) return "notApplied";
    return "other";
  }

  function getMapping() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveMapping(map) {
    localStorage.setItem(KEY, JSON.stringify(map));
  }

  function classify(rawStatus) {
    const map = getMapping();
    if (rawStatus in map) return map[rawStatus];
    return guessBucket(rawStatus);
  }

  function getKnownStatuses(allRecords) {
    const fromData = (allRecords || []).map((r) => r.status).filter(Boolean);
    const fromMap = Object.keys(getMapping());
    return Array.from(new Set([...fromData, ...fromMap])).sort((a, b) => a.localeCompare(b));
  }

  return { BUCKETS, classify, guessBucket, getKnownStatuses, getMapping, saveMapping };
})();
