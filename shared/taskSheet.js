/* ============================================================
   TaskSheet
   ------------------------------------------------------------
   Small classification helpers for personal-tracker task rows —
   ported from the older, fully-built servi-unified-dashboard's
   team/js/taskSheet.js (same status/priority text -> slug mapping,
   same progress-parsing rule). That precedent module also fetched
   its own sheet rows directly; here the fetch itself is already
   handled by SheetsClient.fetchPersonalTasks() (shared/sheetsClient.js),
   which returns task objects shaped like:
     { category, description, dateRequested, owner, priority,
       deadline, dateCompleted, relatedLinks, status, progress,
       comments, _row }
   ...with priority/status/progress still as their RAW sheet text —
   this module turns that raw text into the slugs the Team page and
   AI Assistant need to compute Active/Critical/Overdue/Completed.

   Judgment call (flagged to the user): the precedent sheet has no
   "critical" status of its own — only these status slugs
   (completed/at-risk/in-progress/not-defined) and priority slugs
   (high/medium/low). "Critical" here is defined as: not yet
   completed, AND (priority is High OR status is At Risk). This is a
   reasonable reading of "critical tasks" as a KPI, but it's a real
   interpretive call, not something read directly off a column —
   flag it if it doesn't match what "critical" should mean day to day.
   ============================================================ */

const TaskSheet = (() => {
  function statusSlug(rawStatus) {
    const s = String(rawStatus || "").trim().toLowerCase();
    if (!s) return "not-defined";
    if (/complete/.test(s)) return "completed";
    if (/at.?risk|risk|blocked|stuck/.test(s)) return "at-risk";
    if (/progress|ongoing|in.?progress|started|working/.test(s)) return "in-progress";
    return "not-defined";
  }

  function prioritySlug(rawPriority) {
    const p = String(rawPriority || "").trim().toLowerCase();
    if (/high|urgent|critical/.test(p)) return "high";
    if (/med/.test(p)) return "medium";
    if (/low/.test(p)) return "low";
    return "";
  }

  // Ported verbatim from precedent's team/js/taskSheet.js — pulls a
  // numeric goal out of a task's free-text description, for the AI
  // Assistant's team_member_tasks tool (matches precedent's own output
  // shape exactly: a task can carry a `target` like "call 50 leads").
  function extractTarget(description) {
    if (!description) return null;
    const explicit = description.match(/target[:\s]*?(\d+)/i);
    if (explicit) return Number(explicit[1]);
    const implicit = description.match(/\b(\d+)\s+(calls?|leads?|freelancers?|contacts?|meetings?|emails?|messages?|clients?|partners?)\b/i);
    if (implicit) return { value: Number(implicit[1]), unit: implicit[2].toLowerCase() };
    return null;
  }

  function normalizeTarget(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "number") return { value: raw, unit: null };
    return raw;
  }

  // Accepts either a 0-1 fraction ("0.5") or a 0-100 raw number ("50" or
  // "50%") and always returns a 0-100 integer percent.
  function parseProgress(raw) {
    if (raw === null || raw === undefined || raw === "") return 0;
    const cleaned = String(raw).replace(/%/g, "").trim();
    const num = Number(cleaned);
    if (!isFinite(num)) return 0;
    const pct = num <= 1 ? num * 100 : num;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  function isCompleted(task) {
    return statusSlug(task.status) === "completed";
  }

  function isOverdue(task) {
    if (isCompleted(task) || !task.deadline) return false;
    return task.deadline.getTime() < Date.now();
  }

  // See the file header's judgment-call note.
  function isCritical(task) {
    if (isCompleted(task)) return false;
    return prioritySlug(task.priority) === "high" || statusSlug(task.status) === "at-risk";
  }

  function isActive(task) {
    return !isCompleted(task);
  }

  // In-period helper for the Team page's date-preset filter bar — a task
  // "falls in" a period if it was requested, completed, or has a deadline
  // inside that window (so e.g. picking "Today" surfaces anything due
  // today, requested today, or completed today, not just one of those).
  function fallsInRange(task, start, end) {
    if (!start) return true; // "All Time"
    const dates = [task.dateRequested, task.deadline, task.dateCompleted].filter(Boolean);
    return dates.some((d) => d >= start && d < end);
  }

  return { statusSlug, prioritySlug, parseProgress, isCompleted, isOverdue, isCritical, isActive, fallsInRange, extractTarget, normalizeTarget };
})();
