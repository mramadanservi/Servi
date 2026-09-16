/* ============================================================
   TeamTasksConfig
   ------------------------------------------------------------
   Maps a team member's Servi_Team roster ID (see TeamRosterConfig
   in sheetsConfig.js) to their own personal task-tracker spreadsheet
   (same column shape as PersonalTasksConfig — see
   SheetsClient.fetchTasksFromConfig()).

   HONEST LIMITATION (ported directly from the precedent project this
   was built from — servi-unified-dashboard/team/js/config.js): that
   project's own roster config has every member's tracker sheet ID
   still set to an unfilled "PASTE_..._HERE" placeholder except one —
   Mohamad Ramadan's, which is the one real personal tracker sheet ID
   that exists anywhere in this project (PersonalTasksConfig). So as
   of this build, MEMBER_SHEETS below has exactly one real entry.

   This directly matches the fallback the user gave when asking for
   this feature: "if you are having problems with total tasks,
   overdue and critical, you can for now add the tasks the signed in
   user has access to." The Team page's Active/Critical/Overdue/Most-
   Completed KPIs sum over every entry in MEMBER_SHEETS — today that's
   only whichever member(s) have a real sheet ID here (in practice,
   just Mohamad Ramadan) — rather than inventing sheet IDs for anyone
   else. Once a team member gets their own tracker sheet set up (same
   12-column "Dashboard" tab shape as PersonalTasksConfig), add them
   here by their roster ID and the aggregation picks them up
   automatically — no other code needs to change.
   ============================================================ */

const TeamTasksConfig = {
  MEMBER_SHEETS: {
    // Mohamad Ramadan — roster ID 20260002 per the Servi_Team sheet.
    "20260002": PersonalTasksConfig,
  },
};
