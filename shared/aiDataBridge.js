/* ============================================================
   AiDataBridge
   ------------------------------------------------------------
   Feeds AiTools.js with the real data it needs — a direct
   replacement for the older, fully-built servi-unified-dashboard's
   assistant/js/dataBridge.js + appliedBridge.js.

   ARCHITECTURAL NOTE (flagged per the "port page by page, flag
   adaptations" instruction): the precedent project embeds every
   section as a sibling <iframe> inside one shell page, so its
   DataBridge could just reach into an ALREADY-LOADED Recruitment/
   Team iframe's in-memory DataStore/TeamAppState — no fetch of its
   own, just cross-frame reads (window.parent.document.getElementById(...)
   .contentWindow...). v2 has no iframes; it's full-page navigation
   with each page self-contained. So this AI Assistant page fetches
   its OWN copies of the Recruitment sheet, the Applied sheet, and
   the Team roster directly via SheetsClient — same real Google
   Sheets, same real numbers, just fetched here instead of borrowed
   from another already-open tab. Functionally the assistant answers
   identically either way; this is purely a "how do we get the
   bytes" adaptation, not a change in what it can answer. Each
   dataset is fetched once per page load and cached in memory for
   the rest of the session (same "cache until refreshed" spirit as
   precedent's in-tab caches) — reload the page (or start a New Chat,
   which does NOT reload data) to pick up sheet changes; there's no
   periodic auto-refresh here, matching how the rest of this project
   already reads sheets on demand rather than polling.
   ============================================================ */

const AiDataBridge = (() => {
  let recruitment = null; // { records } | null
  let recruitmentPromise = null;

  let applied = null; // { records } | null
  let appliedPromise = null;

  let roster = null; // { members } | null
  let rosterPromise = null;

  const memberTasksCache = {}; // rosterId -> { tasks } | Error

  async function ensureRecruitment() {
    if (recruitment) return recruitment;
    if (!recruitmentPromise) {
      recruitmentPromise = SheetsClient.fetchAll()
        .then((res) => { recruitment = res; DataStore.setRecords(res.records); return res; })
        .catch((err) => { recruitmentPromise = null; throw err; });
    }
    return recruitmentPromise;
  }

  async function ensureApplied() {
    if (applied) return applied;
    if (!appliedPromise) {
      appliedPromise = SheetsClient.fetchApplied()
        .then((res) => { applied = res; return res; })
        .catch((err) => { appliedPromise = null; throw err; });
    }
    return appliedPromise;
  }

  async function ensureRoster() {
    if (roster) return roster;
    if (!rosterPromise) {
      rosterPromise = SheetsClient.fetchTeamRoster()
        .then((res) => { roster = res; return res; })
        .catch((err) => { rosterPromise = null; throw err; });
    }
    return rosterPromise;
  }

  // Returns { tasks } for a roster member's OWN configured tracker sheet
  // (see shared/teamTasksConfig.js), or null if that member has no real
  // tracker sheet configured yet (the same honest limitation the Team
  // page works under — most members don't have one yet).
  async function getMemberTasks(rosterId) {
    if (!rosterId) return null;
    const config = TeamTasksConfig.MEMBER_SHEETS[rosterId];
    if (!config) return null;
    if (memberTasksCache[rosterId]) return memberTasksCache[rosterId];
    const res = await SheetsClient.fetchTasksFromConfig(config);
    memberTasksCache[rosterId] = res;
    return res;
  }

  return { ensureRecruitment, ensureApplied, ensureRoster, getMemberTasks };
})();
