/* ============================================================
   CalendarAPI
   ------------------------------------------------------------
   Thin wrapper around the Google Calendar API's "events.list" for the
   signed-in person's own primary calendar (read-only — see the
   calendar.readonly scope added in authConfig.js). Used by both the
   small "upcoming events" widget on General Overview and the full
   Calendar page.

   Nothing here is Servi-specific data — it's just whatever is actually
   on the signed-in person's real Google Calendar.
   ============================================================ */

const CalendarAPI = (() => {
  const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

  // Google returns all-day events as a plain "YYYY-MM-DD" (no time/offset).
  // Handing that straight to `new Date(...)` parses it as UTC midnight,
  // which lands on the *previous* local day for anyone west of UTC — so
  // all-day events parse their date parts manually into a local-midnight
  // Date instead. Timed events already carry a real offset in dateTime,
  // so those are fine to parse normally.
  function parseDateField(field) {
    if (field.dateTime) return new Date(field.dateTime);
    if (field.date) {
      const [y, m, d] = field.date.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return null;
  }

  function normalize(raw) {
    const startRaw = raw.start || {};
    const endRaw = raw.end || {};
    const start = parseDateField(startRaw);
    const end = parseDateField(endRaw) || start;
    return {
      id: raw.id,
      title: raw.summary || "(No title)",
      location: raw.location || "",
      htmlLink: raw.htmlLink || "",
      allDay: !startRaw.dateTime,
      start,
      end,
    };
  }

  // timeMin/timeMax: JS Date objects. Returns a promise of normalized events,
  // sorted by start time. Throws an Error with .code = "NEEDS_CALENDAR_SCOPE"
  // when the current session was never granted calendar access (e.g. it was
  // started before that scope existed) so the caller can show a reconnect
  // prompt instead of a confusing raw API error.
  async function listEvents({ timeMin, timeMax, maxResults = 50 } = {}) {
    if (!Auth.hasScope(CALENDAR_SCOPE)) {
      const err = new Error("Calendar access hasn't been granted for this session yet.");
      err.code = "NEEDS_CALENDAR_SCOPE";
      throw err;
    }

    // See sheetsClient.js's fetchAll() for why this goes through
    // ensureToken() rather than reading the cached token directly — it
    // silently renews an expired token instead of failing outright.
    let token;
    try {
      token = await Auth.ensureToken();
    } catch (e) {
      const err = new Error(e.message || "Your session needs to be reconnected.");
      err.code = "NEEDS_CALENDAR_SCOPE";
      throw err;
    }

    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: String(maxResults),
      timeMin: (timeMin || new Date()).toISOString(),
    });
    if (timeMax) params.set("timeMax", timeMax.toISOString());

    const res = await fetch(`${EVENTS_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      const err = new Error("Google didn't allow this calendar request. Reconnecting your account may fix it.");
      err.code = "NEEDS_CALENDAR_SCOPE";
      throw err;
    }
    if (!res.ok) {
      throw new Error(`Google Calendar request failed (${res.status}).`);
    }
    const data = await res.json();
    return (data.items || []).map(normalize).sort((a, b) => a.start - b.start);
  }

  return { listEvents, CALENDAR_SCOPE };
})();
