/**
 * Servi General Chatroom — 6-hour auto-purge
 * ============================================================
 * WHAT THIS DOES
 * Deletes any row in the "General_ChatRoom" tab whose Date_Sent is
 * older than 6 hours. Runs on a time-driven trigger you set up below —
 * it does NOT run just because the dashboard is open, and it does NOT
 * run automatically the moment you paste it in. You must add the
 * trigger (step 4 below) for it to actually fire.
 *
 * SHEET ASSUMPTIONS
 * - Spreadsheet: Servi_Team (ID hardcoded below — this is the same
 *   spreadsheet the dashboard already reads/writes for chat).
 * - Tab name: General_ChatRoom
 * - Columns, in order: Sent_By | Date_Sent | Message
 * - Row 1 is the header row and is never touched.
 *
 * If you ever rename the tab or reorder the columns, update the
 * constants below to match.
 * ============================================================
 */

const CHAT_SPREADSHEET_ID = '1gIe62zyxfUpv0a9sso5jo13jS5-pRQ00meb1ZagIlPo';
const CHAT_SHEET_NAME = 'General_ChatRoom';
const CHAT_DATE_COLUMN_INDEX = 2; // 1-based: A=1 (Sent_By), B=2 (Date_Sent), C=3 (Message)
const MAX_AGE_HOURS = 6;

function purgeOldChatMessages() {
  const ss = SpreadsheetApp.openById(CHAT_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CHAT_SHEET_NAME);
  if (!sheet) {
    Logger.log('purgeOldChatMessages: sheet "' + CHAT_SHEET_NAME + '" not found — nothing to do.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('purgeOldChatMessages: no data rows — nothing to do.');
    return; // only header row (or empty sheet)
  }

  const numRows = lastRow - 1; // exclude header
  const numCols = sheet.getLastColumn();
  const dataRange = sheet.getRange(2, 1, numRows, numCols);
  const values = dataRange.getValues();

  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  // Keep only rows whose Date_Sent is within the last 6 hours (or unparseable —
  // we never want a formatting hiccup to silently nuke someone's message).
  const rowsToKeep = values.filter(function (row) {
    const raw = row[CHAT_DATE_COLUMN_INDEX - 1];
    const parsed = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(parsed.getTime())) return true; // can't parse -> keep, don't guess
    return parsed >= cutoff;
  });

  const removedCount = values.length - rowsToKeep.length;
  if (removedCount === 0) {
    Logger.log('purgeOldChatMessages: nothing older than ' + MAX_AGE_HOURS + 'h — nothing removed.');
    return;
  }

  // Rewrite: clear all data rows, then write back only the rows we're keeping.
  sheet.getRange(2, 1, numRows, numCols).clearContent();
  if (rowsToKeep.length > 0) {
    sheet.getRange(2, 1, rowsToKeep.length, numCols).setValues(rowsToKeep);
  }

  Logger.log('purgeOldChatMessages: removed ' + removedCount + ' message(s) older than ' + MAX_AGE_HOURS + 'h, kept ' + rowsToKeep.length + '.');
}

/**
 * ============================================================
 * ONE-TIME SETUP — do this once in the Servi_Team Google Sheet
 * ============================================================
 * 1. Open the Servi_Team spreadsheet.
 * 2. Extensions menu > Apps Script. This opens a new tab with a
 *    blank script editor (or an existing project if one's already
 *    attached to this sheet).
 * 3. Delete anything in the editor (e.g. the default "function
 *    myFunction() {}") and paste this entire file in its place.
 *    Click the save icon (or Ctrl+S / Cmd+S).
 * 4. Set up the trigger:
 *    - Click the clock icon on the left sidebar ("Triggers").
 *    - Click "+ Add Trigger" (bottom right).
 *    - Choose function to run: purgeOldChatMessages
 *    - Choose which deployment should run: Head
 *    - Select event source: Time-driven
 *    - Select type of time based trigger: Hour timer
 *    - Select hour interval: Every 6 hours
 *    - Click Save.
 * 5. Google will ask you to authorize the script (it needs
 *    permission to edit this spreadsheet) — review and allow it.
 *    This is a one-time prompt.
 *
 * That's it — from then on, Google runs this automatically every
 * 6 hours in the background, whether or not the dashboard or the
 * sheet is open. You can check it ran by looking at Executions
 * (also in the left sidebar of the Apps Script editor).
 * ============================================================
 */
