/* ============================================================
   SheetsClient
   ------------------------------------------------------------
   Ported from your v1 dashboard's js/sheetsClient.js. Reads the
   same Google Sheets via the Sheets API v4, authenticated as you
   (via Auth's access token) rather than an API key or public link.
   Every function below issues GET requests only, EXCEPT the General
   Chatroom's sendChatMessage/upsertTyping near the bottom of this
   file, which are the only two places anywhere in this codebase
   that write — see ChatConfig's header comment in sheetsConfig.js.

   SHEETS_SCOPE was widened from spreadsheets.readonly to full
   spreadsheets when the Chatroom needed write access (confirmed with
   the user — see authConfig.js's SCOPES comment for why). It's kept
   as one shared constant so every read call below still recognizes
   the new scope as "Sheets access granted" instead of incorrectly
   prompting a reconnect.
   ============================================================ */

const SheetsClient = (() => {
  const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

  // Google's serial-date epoch: Dec 30, 1899.
  const SERIAL_EPOCH = Date.UTC(1899, 11, 30);

  function serialToDate(serial) {
    return new Date(SERIAL_EPOCH + serial * 86400000);
  }

  function parseCellDate(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
      const d = serialToDate(value);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
      const native = new Date(value);
      if (!isNaN(native.getTime())) return native;
      const m = value.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
      if (m) {
        let [, a, b, c] = m;
        if (a.length === 4) return new Date(Number(a), Number(b) - 1, Number(c));
        const day = Number(a), month = Number(b), year = Number(c.length === 2 ? "20" + c : c);
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    }
    return null;
  }

  function buildUrl() {
    const sheetName = SheetsConfig.SHEET_NAME.replace(/'/g, "''");
    const a1 = `'${sheetName}'!${SheetsConfig.RANGE}`;
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SheetsConfig.SPREADSHEET_ID)}/values/${encodeURIComponent(a1)}`;
    return `${base}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`;
  }

  function normalizeHeader(h) {
    return String(h || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function buildHeaderIndex(headerRow) {
    const wanted = SheetsConfig.COLUMNS;
    const normalizedHeaderRow = headerRow.map(normalizeHeader);
    const index = {};
    const missing = [];
    Object.entries(wanted).forEach(([key, label]) => {
      const target = normalizeHeader(label);
      const col = normalizedHeaderRow.indexOf(target);
      if (col === -1) missing.push(label);
      else index[key] = col;
    });
    return { index, missing };
  }

  function rowsToRecords(values) {
    if (!values || values.length < 2) return { records: [], missing: [], headerRow: [] };
    const headerRow = values[0];
    const { index, missing } = buildHeaderIndex(headerRow);

    const records = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row || row.length === 0) continue;

      const get = (key) => {
        const col = index[key];
        if (col === undefined) return "";
        const v = row[col];
        return v === undefined || v === null ? "" : v;
      };

      const firstName = String(get("firstName")).trim();
      const lastName = String(get("lastName")).trim();
      const mobile = String(get("mobile")).trim();
      if (!firstName && !lastName && !mobile) continue;

      const dateContacted = parseCellDate(get("dateContacted"));

      records.push({
        _row: r + 1,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim() || "NaN",
        mobile,
        source: String(get("source")).trim(),
        referredBy: String(get("referredBy")).trim(),
        addedBy: String(get("addedBy")).trim(),
        dateContacted,
        calledBy: String(get("calledBy")).trim(),
        status: String(get("status")).trim(),
        vertical: String(get("vertical")).trim(),
        specialty: String(get("specialty")).trim(),
        district: String(get("district")).trim(),
        area: String(get("area")).trim(),
        gender: String(get("gender")).trim(),
      });
    }
    return { records, missing, headerRow };
  }

  // Same NEEDS_*_SCOPE pattern as CalendarAPI, so pages can show the same
  // "reconnect" prompt instead of a confusing raw API error.
  async function fetchAll() {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    // ensureToken() silently renews an expired token when possible (see
    // auth.js) — a session that looked valid on page load can still have
    // its token lapse if the tab is left open past the ~1hr lifetime.
    // Only fall back to the reconnect prompt if silent renewal itself fails.
    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let res;
    try {
      res = await fetch(buildUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }

    if (res.status === 401 || res.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
    }

    const json = await res.json();
    const { records, missing } = rowsToRecords(json.values || []);
    if (missing.length) {
      console.warn("[SheetsClient] Expected columns not found in row 1:", missing);
    }
    return { records, missing };
  }

  /* ==========================================================
     Personal Tasks
     ----------------------------------------------------------
     A second, separate spreadsheet (your own task tracker, not
     the recruitment database above) — see PersonalTasksConfig in
     sheetsConfig.js. Shares the same auth/token/scope machinery
     as fetchAll() above, just pointed at a different spreadsheet
     ID, tab, and column map.
     ========================================================== */

  function buildGenericUrl(config) {
    const sheetName = config.SHEET_NAME.replace(/'/g, "''");
    const a1 = `'${sheetName}'!${config.RANGE}`;
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.SPREADSHEET_ID)}/values/${encodeURIComponent(a1)}`;
    return `${base}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`;
  }

  function buildGenericHeaderIndex(headerRow, columns) {
    const normalizedHeaderRow = headerRow.map(normalizeHeader);
    const index = {};
    const missing = [];
    Object.entries(columns).forEach(([key, label]) => {
      const target = normalizeHeader(label);
      const col = normalizedHeaderRow.indexOf(target);
      if (col === -1) missing.push(label);
      else index[key] = col;
    });
    return { index, missing };
  }

  // Generic personal-tracker-sheet fetch, factored out so the Team page
  // (and the AI Assistant's team_member_tasks tool) can point this at any
  // team member's own tracker spreadsheet, not just the hardcoded one
  // fetchPersonalTasks() below reads. Every personal tracker sheet is
  // expected to share the same column shape as PersonalTasksConfig (see
  // shared/teamTasksConfig.js for which member IDs currently have a real
  // sheet configured — most don't yet, same honest limitation as the
  // precedent project this was ported from).
  async function fetchTasksFromConfig(config) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let res;
    try {
      res = await fetch(buildGenericUrl(config), {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }

    if (res.status === 401 || res.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
    }

    const json = await res.json();
    const values = json.values || [];
    if (values.length < 2) return { tasks: [], missing: [] };

    const headerRow = values[0];
    const { index, missing } = buildGenericHeaderIndex(headerRow, config.COLUMNS);
    if (missing.length) {
      console.warn(`[SheetsClient] Task columns not found in row 1 of "${config.SHEET_NAME}":`, missing);
    }

    const get = (row, key) => {
      const col = index[key];
      if (col === undefined) return "";
      const v = row[col];
      return v === undefined || v === null ? "" : v;
    };

    const tasks = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row || row.length === 0) continue;

      const description = String(get(row, "description")).trim();
      const category = String(get(row, "category")).trim();
      if (!description && !category) continue; // fully blank row

      tasks.push({
        _row: r + 1,
        category,
        description,
        dateRequested: parseCellDate(get(row, "dateRequested")),
        owner: String(get(row, "owner")).trim(),
        priority: String(get(row, "priority")).trim(),
        deadline: parseCellDate(get(row, "deadline")),
        dateCompleted: parseCellDate(get(row, "dateCompleted")),
        relatedLinks: String(get(row, "relatedLinks")).trim(),
        status: String(get(row, "status")).trim(),
        progress: String(get(row, "progress")).trim(),
        comments: String(get(row, "comments")).trim(),
      });
    }
    return { tasks, missing };
  }

  function fetchPersonalTasks() {
    return fetchTasksFromConfig(PersonalTasksConfig);
  }

  /* ==========================================================
     Applied (Fillout form)
     ----------------------------------------------------------
     A third, separate spreadsheet — see AppliedSheetConfig in
     sheetsConfig.js. Same auth/token/scope machinery as fetchAll()
     and fetchPersonalTasks() above, just pointed at the Fillout-fed
     sheet, plus shaping specific to that sheet:

       - District only ever has ONE of the 26 "Area in {District}"
         columns (AppliedSheetConfig.AREA_COLUMNS) populated per row
         — pickFirstNonEmpty() below scans all of them and uses
         whichever one actually has a value.
       - Age isn't stored directly; the Applied page computes it
         from dob via a local ageFromDob() helper (kept there, not
         here, since "age" is a display concern, not a data-fetch
         concern).
       - Each vertical's Specialty/Years/Skill-Level column(s)
         (AppliedSheetConfig.VERTICAL_DETAILS) are collected per
         record into `serviceDetails`, which SpecialtySettings.js
         reads to power the Specialty filter.
     ========================================================== */

  function pickFirstNonEmpty(row, colIndexes) {
    for (const col of colIndexes) {
      if (col === undefined) continue;
      const v = row[col];
      if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
    }
    return "";
  }

  // Every "Area in X" column's index, in the same order as
  // AppliedSheetConfig.AREA_COLUMNS, so pickFirstNonEmpty() can scan them.
  function buildAreaColumnIndexes(normalizedHeaderRow) {
    const missing = [];
    const indexes = (AppliedSheetConfig.AREA_COLUMNS || [])
      .map((label) => {
        const col = normalizedHeaderRow.indexOf(normalizeHeader(label));
        if (col === -1) missing.push(label);
        return col;
      })
      .filter((col) => col !== -1);
    return { indexes, missing };
  }

  // Per-vertical Specialty/Years/Skill-Level column index(es), from
  // AppliedSheetConfig.VERTICAL_DETAILS.
  function buildVerticalDetailIndex(normalizedHeaderRow) {
    const index = {};
    Object.entries(AppliedSheetConfig.VERTICAL_DETAILS || {}).forEach(([vKey, def]) => {
      const specialtyLabels = def.specialty || [];
      const filterLabelSet = new Set((def.specialtyFilterLabels || specialtyLabels).map(normalizeHeader));
      index[vKey] = {
        years: normalizedHeaderRow.indexOf(normalizeHeader(def.years || "")),
        skillLevel: normalizedHeaderRow.indexOf(normalizeHeader(def.skillLevel || "")),
        specialty: specialtyLabels.map((label) => normalizedHeaderRow.indexOf(normalizeHeader(label))),
        specialtyIsFilterable: specialtyLabels.map((label) => filterLabelSet.has(normalizeHeader(label))),
      };
    });
    return index;
  }

  // Builds { [verticalKey]: { years, skillLevel, specialty: [...], specialtyFilterable: [...] } }
  // for this row — only for the vertical(s) that actually have something in
  // one of their columns, which in practice means only the vertical(s) that
  // applicant selected (the form only fills in the block matching their pick).
  function pickServiceDetails(row, detailIndex) {
    const out = {};
    Object.entries(detailIndex).forEach(([vKey, cols]) => {
      const years = cols.years >= 0 ? String(row[cols.years] ?? "").trim() : "";
      const skillLevel = cols.skillLevel >= 0 ? String(row[cols.skillLevel] ?? "").trim() : "";
      const specialty = [];
      const specialtyFilterable = [];
      cols.specialty.forEach((c, i) => {
        const v = c >= 0 ? String(row[c] ?? "").trim() : "";
        if (!v) return;
        specialty.push(v);
        if (cols.specialtyIsFilterable[i]) specialtyFilterable.push(v);
      });
      if (years || skillLevel || specialty.length) {
        out[vKey] = { years, skillLevel, specialty, specialtyFilterable };
      }
    });
    return out;
  }

  async function fetchApplied() {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let res;
    try {
      res = await fetch(buildGenericUrl(AppliedSheetConfig), {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }

    if (res.status === 401 || res.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
    }

    const json = await res.json();
    const values = json.values || [];
    if (values.length < 2) return { records: [], missing: [] };

    const headerRow = values[0];
    const normalizedHeaderRow = headerRow.map(normalizeHeader);
    const { index, missing } = buildGenericHeaderIndex(headerRow, AppliedSheetConfig.COLUMNS);
    const { indexes: areaIndexes, missing: areaMissing } = buildAreaColumnIndexes(normalizedHeaderRow);
    const detailIndex = buildVerticalDetailIndex(normalizedHeaderRow);
    const allMissing = missing.concat(areaMissing);
    if (allMissing.length) {
      console.warn("[SheetsClient] Applied-sheet columns not found in row 1:", allMissing);
    }

    const get = (row, key) => {
      const col = index[key];
      if (col === undefined) return "";
      const v = row[col];
      return v === undefined || v === null ? "" : v;
    };

    const records = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row || row.length === 0) continue;

      const firstName = String(get(row, "firstName")).trim();
      const lastName = String(get(row, "lastName")).trim();
      const mobile = String(get(row, "mobile")).trim();
      if (!firstName && !lastName && !mobile) continue; // fully blank row

      const area = pickFirstNonEmpty(row, areaIndexes);

      records.push({
        _row: r + 1,
        source: "live",
        legacy: false,
        submissionId: String(get(row, "submissionId")).trim(),
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim() || "NaN",
        mobile,
        district: String(get(row, "district")).trim(),
        area,
        dob: parseCellDate(get(row, "dob")),
        gender: String(get(row, "gender")).trim(),
        vertical: String(get(row, "vertical")).trim(),
        submittedAt: parseCellDate(get(row, "submittedAt")),
        serviceDetails: pickServiceDetails(row, detailIndex),
      });
    }
    return { records, missing: allMissing };
  }

  /* ==========================================================
     Team roster ("Servi_Team" sheet)
     ----------------------------------------------------------
     A fourth, separate spreadsheet — see TeamRosterConfig in
     sheetsConfig.js (including the flagged-for-verification note on
     its spreadsheet ID). Same generic fetch machinery as
     fetchPersonalTasks() above, just pointed at this sheet/columns.
     ========================================================== */

  async function fetchTeamRoster() {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    let res;
    try {
      res = await fetch(buildGenericUrl(TeamRosterConfig), {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }

    if (res.status === 401 || res.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
    }

    const json = await res.json();
    const values = json.values || [];
    if (values.length < 2) return { members: [], missing: [] };

    const headerRow = values[0];
    const { index, missing } = buildGenericHeaderIndex(headerRow, TeamRosterConfig.COLUMNS);
    if (missing.length) {
      console.warn("[SheetsClient] Team-roster columns not found in row 1:", missing);
    }

    const get = (row, key) => {
      const col = index[key];
      if (col === undefined) return "";
      const v = row[col];
      return v === undefined || v === null ? "" : v;
    };

    const members = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row || row.length === 0) continue;

      const id = String(get(row, "id")).trim();
      const firstName = String(get(row, "firstName")).trim();
      const lastName = String(get(row, "lastName")).trim();
      if (!id && !firstName && !lastName) continue; // fully blank row

      members.push({
        _row: r + 1,
        id,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim() || "NaN",
        position: String(get(row, "position")).trim(),
        email: String(get(row, "email")).trim(),
        phone: String(get(row, "phone")).trim(),
        image: String(get(row, "image")).trim(),
        dateJoined: parseCellDate(get(row, "dateJoined")),
        birthdate: parseCellDate(get(row, "birthdate")),
        nationality: String(get(row, "nationality")).trim(),
      });
    }
    return { members, missing };
  }

  /* ============================================================
     General Chatroom — the only reads+writes in this file that
     target a spreadsheet other than the recruitment/task ones above,
     and the ONLY writes anywhere in this codebase. See ChatConfig's
     header comment in sheetsConfig.js for the scope/architecture
     notes this leans on.
     ========================================================== */

  function buildBatchGetUrl(spreadsheetId, ranges) {
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet`;
    const params = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
    return `${base}?${params}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`;
  }

  // Combines the message range and the typing-presence range into ONE
  // HTTP request (Sheets' values:batchGet) — this is what keeps a
  // several-times-a-minute poll loop safely under Google's per-user
  // quota (one request instead of two, every cycle).
  async function fetchChatAndTyping() {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    const chatRange = `'${ChatConfig.SHEET_NAME}'!${ChatConfig.RANGE}`;
    const typingRange = `'${ChatTypingConfig.SHEET_NAME}'!${ChatTypingConfig.RANGE}`;

    // cache: "no-store" is deliberate on both requests below — this same
    // URL is re-fetched every POLL_INTERVAL_MS (3s) so two teammates'
    // messages show up for each other live, and a cached GET would look
    // exactly like a stuck chat.
    const fetchOpts = { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" };

    async function doFetch(url) {
      let r;
      try {
        r = await fetch(url, fetchOpts);
      } catch (e) {
        throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
      }
      if (r.status === 401 || r.status === 403) {
        const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
        err.code = "NEEDS_SHEETS_SCOPE";
        throw err;
      }
      if (r.status === 429) {
        const err = new Error("Google Sheets is rate-limiting these requests right now — will retry automatically.");
        err.code = "RATE_LIMITED";
        throw err;
      }
      return r;
    }

    async function readError(r) {
      let detail = "";
      try {
        const body = await r.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      return detail;
    }

    let res = await doFetch(buildBatchGetUrl(ChatConfig.SPREADSHEET_ID, [chatRange, typingRange]));

    // IMPORTANT: Sheets' values:batchGet fails the WHOLE request with a 400
    // if ANY range in it names a tab that doesn't exist — it does NOT just
    // return an empty array for that one range. The "Typing" tab is a
    // manual one-time setup step (see ChatTypingConfig's header comment)
    // that's easy to skip, and skipping it doesn't just disable the
    // "is typing…" indicator like intended — it took the ENTIRE chat down
    // with it, silently, because the failure was swallowed by chat.html's
    // per-poll catch. Detect that specific case and fall back to fetching
    // just the chat range alone, so real chat history still loads even
    // before anyone's added the Typing tab.
    let typingUnavailable = false;
    if (!res.ok && res.status === 400) {
      const detail = await readError(res);
      if (/unable to parse range/i.test(detail) && detail.includes(ChatTypingConfig.SHEET_NAME)) {
        typingUnavailable = true;
        res = await doFetch(buildGenericUrl(ChatConfig)); // chat range alone, plain values.get
      } else {
        throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
      }
    }

    if (!res.ok) {
      const detail = await readError(res);
      throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
    }

    const json = await res.json();
    let chatValues, typingValues;
    if (typingUnavailable) {
      // Single values.get response shape (not batchGet): { range, values }.
      chatValues = json.values || [];
      typingValues = [];
    } else {
      const valueRanges = json.valueRanges || [];
      chatValues = valueRanges[0]?.values || [];
      typingValues = valueRanges[1]?.values || [];
    }

    const get = (index, row, key) => {
      const col = index[key];
      if (col === undefined) return "";
      const v = row[col];
      return v === undefined || v === null ? "" : v;
    };

    const messages = [];
    let chatMissing = [];
    if (chatValues.length) {
      const { index, missing } = buildGenericHeaderIndex(chatValues[0], ChatConfig.COLUMNS);
      chatMissing = missing;
      for (let r = 1; r < chatValues.length; r++) {
        const row = chatValues[r];
        if (!row || row.length === 0) continue;
        const sentBy = String(get(index, row, "sentBy")).trim();
        const message = String(get(index, row, "message")).trim();
        if (!sentBy && !message) continue;
        messages.push({ _row: r + 1, sentBy, dateSent: parseCellDate(get(index, row, "dateSent")), message });
      }
    }
    if (chatMissing.length) console.warn("[SheetsClient] General_ChatRoom columns not found in row 1:", chatMissing);

    // A missing/empty Typing tab isn't an error — chat still works, just
    // without the "is typing…" indicator (see chat.html's handling of
    // typingTabMissing).
    const typing = [];
    let typingMissing = [];
    if (typingValues.length) {
      const { index, missing } = buildGenericHeaderIndex(typingValues[0], ChatTypingConfig.COLUMNS);
      typingMissing = missing;
      for (let r = 1; r < typingValues.length; r++) {
        const row = typingValues[r];
        if (!row || row.length === 0) continue;
        const name = String(get(index, row, "name")).trim();
        if (!name) continue;
        typing.push({ _row: r + 1, name, lastTypedAt: parseCellDate(get(index, row, "lastTypedAt")) });
      }
    }

    return { messages, typing, typingTabMissing: typingValues.length === 0, missing: chatMissing.concat(typingMissing) };
  }

  // Appends one chat message row. valueInputOption=RAW so the ISO
  // timestamp string is stored exactly as sent, not reinterpreted by
  // Sheets' locale-aware value parsing.
  async function sendChatMessage(sentBy, message) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    const token = await Auth.ensureToken();
    const range = encodeURIComponent(`'${ChatConfig.SHEET_NAME}'!A:C`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ChatConfig.SPREADSHEET_ID)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[sentBy, new Date().toISOString(), message]] }),
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      const err = new Error(`Couldn't send your message (${res.status}). ${detail}`);
      if (res.status === 401 || res.status === 403) err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
  }

  // Upserts the signed-in user's row in the Typing tab. Callers already
  // have the current typing list from the same poll cycle's
  // fetchChatAndTyping() call, so this never needs its own extra read —
  // pass that row's number as `existingRow` when one was found, omit it
  // to append a new row. Best-effort: the typing indicator is a nice-to-
  // have, so failures here are swallowed rather than surfaced to the user.
  async function upsertTyping(name, existingRow) {
    if (!Auth.hasScope(SHEETS_SCOPE)) return;
    let token;
    try {
      token = await Auth.ensureToken();
    } catch (_) {
      return;
    }
    const now = new Date().toISOString();
    try {
      if (existingRow) {
        const range = encodeURIComponent(`'${ChatTypingConfig.SHEET_NAME}'!A${existingRow}:B${existingRow}`);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ChatTypingConfig.SPREADSHEET_ID)}/values/${range}?valueInputOption=RAW`;
        await fetch(url, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [[name, now]] }),
        });
      } else {
        const range = encodeURIComponent(`'${ChatTypingConfig.SHEET_NAME}'!A:B`);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ChatTypingConfig.SPREADSHEET_ID)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
        await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [[name, now]] }),
        });
      }
    } catch (_) {
      /* best-effort — see function comment */
    }
  }

  /* ============================================================
     Team roster — write-back (Settings > Profile Settings)
     ------------------------------------------------------------
     The ONLY other write path in this codebase besides the Chatroom
     ones above. Lets someone update their OWN First Name / Last Name
     / Position / Email / Phone / Photo, which get saved straight into
     their existing row in the Servi_Team sheet — this is what the
     user confirmed when asked where Profile Settings edits should be
     saved ("yes, the profile settings have access to the team sheet").

     Column letters are resolved from a FRESH read of row 1 (not
     reused from an earlier fetchTeamRoster() call) so this stays
     correct even if columns are ever reordered — this only runs when
     someone actually clicks Save, so the extra read is cheap and
     worth the safety. Only ever writes the keys in ALLOWED_FIELDS
     below; every other TeamRosterConfig column (ID, Date Joined,
     Birthdate, Nationality) is intentionally never reachable through
     this function, since none of those are supposed to be
     user-editable per the spec.

     Photo (the "image" field): there's no Google Drive integration
     here, and a Sheets cell can't hold binary — so an uploaded photo
     is resized/compressed client-side (see settings.html's
     compressImageToDataUri()) down to a small data: URI string and
     stored directly in the Image column, same column the rest of the
     app already reads for a member's photo. Flagged judgment call:
     Sheets caps a single cell at 50,000 characters, so this only
     works for a fairly small, heavily-compressed thumbnail — settings
     .html rejects (with a clear message) anything that doesn't fit
     after compression, rather than silently truncating image data.
     ============================================================ */

  const TEAM_ALLOWED_FIELDS = ["firstName", "lastName", "position", "email", "phone", "image"];

  function columnLetter(index0) {
    // 0-based column index -> A1 letter(s) (0 -> A, 25 -> Z, 26 -> AA, ...).
    let n = index0 + 1;
    let letters = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      letters = String.fromCharCode(65 + rem) + letters;
      n = Math.floor((n - 1) / 26);
    }
    return letters;
  }

  async function updateTeamMemberFields(rowNumber, fields) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!rowNumber || rowNumber < 2) throw new Error("Can't save — missing which sheet row this profile is on.");

    const entries = Object.entries(fields || {}).filter(([key]) => TEAM_ALLOWED_FIELDS.includes(key));
    if (!entries.length) return; // nothing to save

    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    // Fresh header read — see header comment above for why this isn't reused
    // from an earlier fetch.
    const headerRange = encodeURIComponent(`'${TeamRosterConfig.SHEET_NAME}'!1:1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(TeamRosterConfig.SPREADSHEET_ID)}/values/${headerRange}?valueRenderOption=UNFORMATTED_VALUE`;
    let headerRes;
    try {
      headerRes = await fetch(headerUrl, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (headerRes.status === 401 || headerRes.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!headerRes.ok) throw new Error(`Couldn't read the Team sheet's columns (${headerRes.status}).`);
    const headerJson = await headerRes.json();
    const headerRow = (headerJson.values || [[]])[0] || [];
    const { index, missing } = buildGenericHeaderIndex(headerRow, TeamRosterConfig.COLUMNS);

    const data = [];
    const unresolvable = [];
    entries.forEach(([key, value]) => {
      const col = index[key];
      if (col === undefined) {
        unresolvable.push(TeamRosterConfig.COLUMNS[key] || key);
        return;
      }
      const letter = columnLetter(col);
      data.push({ range: `'${TeamRosterConfig.SHEET_NAME}'!${letter}${rowNumber}`, values: [[value]] });
    });

    if (unresolvable.length) {
      throw new Error(`Couldn't find the "${unresolvable.join(", ")}" column${unresolvable.length > 1 ? "s" : ""} in the Team sheet's row 1 — it may have been renamed.`);
    }
    if (!data.length) return;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(TeamRosterConfig.SPREADSHEET_ID)}/values:batchUpdate`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ valueInputOption: "RAW", data }),
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message || "";
      } catch (_) {}
      const err = new Error(`Couldn't save your profile (${res.status}). ${detail}`);
      if (res.status === 401 || res.status === 403) err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
  }

  /* ============================================================
     Manual Bookings — Client + Bookings sheets
     ------------------------------------------------------------
     See ClientConfig/BookingsConfig in sheetsConfig.js for the sheet
     shape and the Booking ID (column T) judgment call. Same
     read/write machinery as everything above this section: a generic
     header-index read, values:append to add a row, and a fresh-header
     values:batchUpdate (by column letter, reusing columnLetter() from
     the Team roster write-back above) to edit specific cells in an
     existing row without disturbing the rest of it.
     ========================================================== */

  // Generic "read a whole tab into records" used by both fetchClients()
  // and fetchBookings() below — same shape as fetchTasksFromConfig()
  // above, just letting the caller decide how each row maps to a record
  // object (Client and Bookings rows have completely different columns).
  async function fetchGenericRecords(config, mapRow) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    let res;
    try {
      res = await fetch(buildGenericUrl(config), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (res.status === 401 || res.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.error?.message || ""; } catch (_) {}
      throw new Error(`Google Sheets request failed (${res.status}). ${detail}`);
    }
    const json = await res.json();
    const values = json.values || [];
    if (values.length < 2) return { records: [], missing: [] };
    const { index, missing } = buildGenericHeaderIndex(values[0], config.COLUMNS);
    const get = (row, key) => {
      const col = index[key];
      if (col === undefined) return "";
      const v = row[col];
      return v === undefined || v === null ? "" : v;
    };
    const records = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row || row.length === 0) continue;
      records.push(mapRow(get, row, r + 1));
    }
    return { records, missing };
  }

  async function fetchClients() {
    const { records, missing } = await fetchGenericRecords(ClientConfig, (get, row, rowNum) => ({
      _row: rowNum,
      firstName: String(get(row, "firstName")).trim(),
      lastName: String(get(row, "lastName")).trim(),
      phone: String(get(row, "phone")).trim(),
      district: String(get(row, "district")).trim(),
      area: String(get(row, "area")).trim(),
      street: String(get(row, "street")).trim(),
      building: String(get(row, "building")).trim(),
      block: String(get(row, "block")).trim(),
      floor: String(get(row, "floor")).trim(),
    }));
    return { clients: records.filter((c) => c.firstName || c.lastName || c.phone), missing };
  }

  // Date/Price/Duration are kept as plain strings, not parsed into
  // numbers/Dates here — they're written with valueInputOption=RAW (see
  // appendBooking/updateBookingFields) specifically so Sheets stores
  // exactly what the app put there instead of reinterpreting it, and a
  // freshly-created booking legitimately has all three blank (see
  // BookingsConfig's header comment on what's empty until the session is
  // actually done). Callers that need Price as a number (KPI math) parse
  // it themselves with Number(...) || 0.
  async function fetchBookings() {
    const { records, missing } = await fetchGenericRecords(BookingsConfig, (get, row, rowNum) => ({
      _row: rowNum,
      clientFirstName: String(get(row, "clientFirstName")).trim(),
      clientLastName: String(get(row, "clientLastName")).trim(),
      clientPhone: String(get(row, "clientPhone")).trim(),
      district: String(get(row, "district")).trim(),
      area: String(get(row, "area")).trim(),
      street: String(get(row, "street")).trim(),
      building: String(get(row, "building")).trim(),
      block: String(get(row, "block")).trim(),
      floor: String(get(row, "floor")).trim(),
      freelancerFirstName: String(get(row, "freelancerFirstName")).trim(),
      freelancerLastName: String(get(row, "freelancerLastName")).trim(),
      freelancerPhone: String(get(row, "freelancerPhone")).trim(),
      vertical: String(get(row, "vertical")).trim(),
      date: String(get(row, "date")).trim(),
      price: String(get(row, "price")).trim(),
      duration: String(get(row, "duration")).trim(),
      status: String(get(row, "status")).trim() || "Scheduled",
      rating: String(get(row, "rating")).trim(),
      review: String(get(row, "review")).trim(),
      bookingId: String(get(row, "bookingId")).trim(),
    }));
    return { bookings: records.filter((b) => b.clientFirstName || b.freelancerFirstName || b.bookingId), missing };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // Vertical prefix + creation-date + a same-day sequence number, e.g.
  // "TUT-260916-01" — matches the shape of the reference card's
  // "#TUT-261023". Uses the booking's CREATION date, not its (often still
  // unknown, per the header comment) session date — flagged judgment
  // call, but a booking ID needs to exist the moment the booking is made,
  // before any session date has necessarily been agreed. `existingBookings`
  // should be a FRESH fetchBookings() result (not a stale cached list) so
  // two bookings made minutes apart never collide.
  function generateBookingId(vertical, existingBookings) {
    const prefix = BookingsConfig.ID_PREFIX[vertical] || "BKG";
    const now = new Date();
    const yymmdd = `${pad2(now.getFullYear() % 100)}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
    const todayPrefix = `${prefix}-${yymmdd}-`;
    const usedToday = (existingBookings || [])
      .map((b) => b.bookingId)
      .filter((id) => id && id.startsWith(todayPrefix))
      .map((id) => Number(id.slice(todayPrefix.length)) || 0);
    const next = usedToday.length ? Math.max(...usedToday) + 1 : 1;
    return `${todayPrefix}${pad2(next)}`;
  }

  async function appendClient(fields) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    const token = await Auth.ensureToken();
    const range = encodeURIComponent(`'${ClientConfig.SHEET_NAME}'!A:I`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ClientConfig.SPREADSHEET_ID)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const row = [
      fields.firstName || "", fields.lastName || "", fields.phone || "", fields.district || "",
      fields.area || "", fields.street || "", fields.building || "", fields.block || "", fields.floor || "",
    ];
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] }),
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.error?.message || ""; } catch (_) {}
      const err = new Error(`Couldn't save this client (${res.status}). ${detail}`);
      if (res.status === 401 || res.status === 403) err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
  }

  // Best-effort: writes "Booking ID" into T1 if the sheet doesn't already
  // have that header. Failing silently here (rather than throwing) means a
  // permissions hiccup on this one PUT never blocks the actual booking
  // from being created — worst case, that one row just won't carry an ID.
  async function ensureBookingIdHeader(token) {
    try {
      const headerRange = encodeURIComponent(`'${BookingsConfig.SHEET_NAME}'!1:1`);
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(BookingsConfig.SPREADSHEET_ID)}/values/${headerRange}?valueRenderOption=UNFORMATTED_VALUE`;
      const res = await fetch(headerUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      const headerRow = (json.values || [[]])[0] || [];
      const hasBookingId = headerRow.some((h) => normalizeHeader(h) === normalizeHeader(BookingsConfig.COLUMNS.bookingId));
      if (hasBookingId) return;
      const col = columnLetter(Math.max(headerRow.length, 19)); // column T unless the sheet's already wider
      const range = encodeURIComponent(`'${BookingsConfig.SHEET_NAME}'!${col}1`);
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(BookingsConfig.SPREADSHEET_ID)}/values/${range}?valueInputOption=RAW`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[BookingsConfig.COLUMNS.bookingId]] }),
      });
    } catch (_) {
      /* best-effort — see function comment */
    }
  }

  async function appendBooking(fields) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    const token = await Auth.ensureToken();
    await ensureBookingIdHeader(token);
    const range = encodeURIComponent(`'${BookingsConfig.SHEET_NAME}'!A:T`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(BookingsConfig.SPREADSHEET_ID)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const row = [
      fields.clientFirstName || "", fields.clientLastName || "", fields.clientPhone || "",
      fields.district || "", fields.area || "", fields.street || "", fields.building || "", fields.block || "", fields.floor || "",
      fields.freelancerFirstName || "", fields.freelancerLastName || "", fields.freelancerPhone || "",
      fields.vertical || "", fields.date || "", fields.price || "", fields.duration || "", fields.status || "Scheduled",
      fields.rating || "", fields.review || "", fields.bookingId || "",
    ];
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] }),
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.error?.message || ""; } catch (_) {}
      const err = new Error(`Couldn't create this booking (${res.status}). ${detail}`);
      if (res.status === 401 || res.status === 403) err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
  }

  // Edits an existing booking row in place — restricted to
  // BookingsConfig.EDITABLE_FIELDS (date/price/duration/status/rating/
  // review) by the filter below, same enforced-allowlist pattern as
  // updateTeamMemberFields above. Column letters are resolved from a
  // FRESH header read (not cached) for the same reordering-safety reason.
  async function updateBookingFields(rowNumber, fields) {
    if (!Auth.hasScope(SHEETS_SCOPE)) {
      const err = new Error("Sheets access hasn't been granted for this session yet.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!rowNumber || rowNumber < 2) throw new Error("Can't save — missing which sheet row this booking is on.");

    const entries = Object.entries(fields || {}).filter(([key]) => BookingsConfig.EDITABLE_FIELDS.includes(key));
    if (!entries.length) return;

    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }

    const headerRange = encodeURIComponent(`'${BookingsConfig.SHEET_NAME}'!1:1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(BookingsConfig.SPREADSHEET_ID)}/values/${headerRange}?valueRenderOption=UNFORMATTED_VALUE`;
    let headerRes;
    try {
      headerRes = await fetch(headerUrl, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (headerRes.status === 401 || headerRes.status === 403) {
      const err = new Error("Google didn't allow this request. Reconnecting your account may fix it.");
      err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
    if (!headerRes.ok) throw new Error(`Couldn't read the Bookings sheet's columns (${headerRes.status}).`);
    const headerJson = await headerRes.json();
    const headerRow = (headerJson.values || [[]])[0] || [];
    const { index } = buildGenericHeaderIndex(headerRow, BookingsConfig.COLUMNS);

    const data = [];
    const unresolvable = [];
    entries.forEach(([key, value]) => {
      const col = index[key];
      if (col === undefined) {
        unresolvable.push(BookingsConfig.COLUMNS[key] || key);
        return;
      }
      const letter = columnLetter(col);
      data.push({ range: `'${BookingsConfig.SHEET_NAME}'!${letter}${rowNumber}`, values: [[value]] });
    });

    if (unresolvable.length) {
      throw new Error(`Couldn't find the "${unresolvable.join(", ")}" column${unresolvable.length > 1 ? "s" : ""} in the Bookings sheet's row 1 — it may have been renamed.`);
    }
    if (!data.length) return;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(BookingsConfig.SPREADSHEET_ID)}/values:batchUpdate`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ valueInputOption: "RAW", data }),
      });
    } catch (e) {
      throw new Error("Could not reach Google Sheets (network error). Check your internet connection.");
    }
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.error?.message || ""; } catch (_) {}
      const err = new Error(`Couldn't save this booking (${res.status}). ${detail}`);
      if (res.status === 401 || res.status === 403) err.code = "NEEDS_SHEETS_SCOPE";
      throw err;
    }
  }

  return {
    fetchAll, fetchPersonalTasks, fetchTasksFromConfig, fetchApplied, fetchTeamRoster, parseCellDate, SHEETS_SCOPE,
    fetchChatAndTyping, sendChatMessage, upsertTyping, updateTeamMemberFields,
    fetchClients, fetchBookings, appendClient, appendBooking, updateBookingFields, generateBookingId,
  };
})();
