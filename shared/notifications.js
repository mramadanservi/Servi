/* ============================================================
   Notifications
   ------------------------------------------------------------
   Real, Sheets/Calendar-backed notifications for three types only
   (per your instruction — group messages and private messages are
   explicitly out of scope for now and stay dormant below):

     - task_reminder      "Critical task" reminders, from your own
                           Personal Tasks tracker (PersonalTasksConfig
                           in sheetsConfig.js / SheetsClient.fetchPersonalTasks()).
     - calendar_reminder  From your real Google Calendar (CalendarAPI),
                           fired shortly before an event starts.
     - message            New General Chatroom messages from teammates
                           (SheetsClient.fetchChatAndTyping()).

   This runs as a background poll on every dashboard page (wherever
   this script + sidebar.js are loaded), independent of whichever
   page-specific feature is on screen — see runChecks()/POLL_INTERVAL_MS
   below. Every dashboard page now also loads sheetsConfig.js,
   sheetsClient.js, calendar.js and taskSheet.js (added alongside this
   feature) specifically so this poll can run everywhere, not just on
   the pages that already happened to need those libraries.

   JUDGMENT CALLS baked in here — flagging each since none of these
   were spelled out precisely and a different call could be preferred:

   1. "Critical" reuses TaskSheet.isCritical() (not completed AND
      (priority=High OR status=At Risk)) — the same definition already
      used for the Team page's KPIs, per your confirmed answer.
   2. A given critical/overdue task reminds you once per calendar day
      (per your confirmed answer) — tracked via a small
      taskRow -> "last reminded on" map in localStorage, NOT by
      re-fetching/diffing full history, so it self-resolves the moment
      a task is completed or no longer critical (it just stops
      qualifying) without needing its own "cleared" state.
   3. Only the task's OWNER gets its reminder (per your confirmed
      answer) — "owner" is matched by full name against your
      Servi_Team roster entry for the signed-in Google account, the
      same matching pattern chat.html already uses to figure out "me".
      If your account isn't in Servi_Team yet, no task will match and
      you won't get task reminders — same silent-degrade behavior chat
      already has for that case.
   4. Calendar reminders fire once, 15 minutes before an event starts
      (per your confirmed answer). All-day events don't have a
      "15 minutes before" — those instead get a single "Today: <title>"
      reminder the first time they're checked on their day. Each
      event occurrence only ever reminds once (tracked by Google's own
      per-occurrence event id), so a recurring meeting reminds you
      every time it comes around, not just the first time ever.
   5. Chatroom notifications are suppressed while you're actually on
      the Chat page (dashboard/chat.html) itself, since you're already
      seeing every message arrive there in real time — this seemed
      like the obviously-wanted behavior rather than something to ask
      about, but flagging it in case double notification is actually
      preferred.
   6. On the very first time this feature ever runs on a given
      browser, it establishes a "last seen message" baseline WITHOUT
      notifying for pre-existing chat history (otherwise anyone
      turning this on would get flooded with toasts for every message
      ever sent). Task and calendar reminders don't need this same
      treatment: tasks are inherently "what's critical right now", and
      calendar reminders are inherently limited to the next 15 minutes,
      so neither has a "backlog" to flood on first run.
   7. Poll cadence is once every 60 seconds for all three checks
      combined (one settings knob, POLL_INTERVAL_MS below) — a
      judgment call balancing timeliness against Google API quota for
      a background check that runs on every open dashboard tab. The
      live Chat page itself still polls much faster (every 3s) when
      you're actually on it — this 60s cadence is only for the
      cross-page "did something happen while I was elsewhere" bell.

   Notifications themselves (and their read state) now persist across
   page navigations/reloads via localStorage, so the bell's dropdown
   list survives moving from one dashboard page to another instead of
   resetting every time (it only reset before because this whole
   feature was sample data, freshly reseeded on every page load).
   ============================================================ */

const Notifications = (() => {
  /* ============================================================
     Mute preferences (Settings > Preferences > Notifications)
     ------------------------------------------------------------
     One "mute everything" master switch plus one per notification
     type, each its own localStorage flag so Settings can render them
     as independent toggles. A muted category is suppressed at the
     source in push() below — it never reaches the bell badge, the
     dropdown list, or a toast/sound — rather than being received and
     hidden, since "muted" should mean "I don't want to know," not
     "counted but not shown."

     group_message/private_message stay listed (so any existing
     Settings toggle for them keeps working) but are never pushed to
     yet — there's no group/private messaging system built in this app
     at all right now, only the single General Chatroom ("message").
     ============================================================ */
  const MUTE_ALL_KEY = "servi_v2_notif_mute_all";
  const MUTE_TYPE_KEY_PREFIX = "servi_v2_notif_mute_";

  const MUTE_TYPES = ["message", "group_message", "private_message", "calendar_reminder", "task_reminder"];

  function isAllMuted() {
    try { return localStorage.getItem(MUTE_ALL_KEY) === "1"; } catch (_) { return false; }
  }
  function setAllMuted(muted) {
    try { localStorage.setItem(MUTE_ALL_KEY, muted ? "1" : "0"); } catch (_) {}
  }
  function isMuted(type) {
    try { return localStorage.getItem(MUTE_TYPE_KEY_PREFIX + type) === "1"; } catch (_) { return false; }
  }
  function setMuted(type, muted) {
    try { localStorage.setItem(MUTE_TYPE_KEY_PREFIX + type, muted ? "1" : "0"); } catch (_) {}
  }
  function isSuppressed(type) {
    return isAllMuted() || isMuted(type);
  }

  const TYPE_ICON = {
    message: "message-circle",
    group_message: "users",
    private_message: "message-square-plus",
    calendar_reminder: "calendar",
    task_reminder: "check",
  };

  const TYPE_LABEL = {
    message: "General Chatroom",
    group_message: "Group message",
    private_message: "Private message",
    calendar_reminder: "Calendar reminder",
    task_reminder: "Task reminder",
  };

  /* ============================================================
     Small localStorage helpers, all fail-soft (private browsing /
     quota errors just mean this poll cycle re-checks more than it
     strictly needs to, never a thrown error).
     ============================================================ */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  const ITEMS_KEY = "servi_v2_notif_items_v1";
  function loadPersistedItems() {
    const raw = readJSON(ITEMS_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((n) => ({ ...n, time: new Date(n.time) }))
      .filter((n) => n && n.id && !isNaN(n.time.getTime()));
  }
  function persistItems() {
    writeJSON(ITEMS_KEY, items.map((n) => ({ ...n, time: n.time.toISOString() })));
  }

  let items = loadPersistedItems(); // { id, type, title, body, time: Date, read }
  let idCounter = 0;
  let listeners = [];
  let audioCtx = null;
  let pollTimer = null;

  function makeId() {
    idCounter += 1;
    return `${Date.now()}_${idCounter}`;
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn(items); } catch (_) {}
    });
  }

  function unreadCount() {
    return items.filter((n) => !n.read).length;
  }

  function timeAgo(date) {
    const s = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  }

  // Small two-tone chime built with the Web Audio API — no audio file to
  // ship or fetch, and it works offline. Browsers block audio until a user
  // gesture has happened on the page at least once (e.g. clicking the
  // Google sign-in button), so failures here are swallowed silently rather
  // than shown as errors.
  function playChime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime;
      [[880, now, 0.09], [1318.5, now + 0.09, 0.11]].forEach(([freq, start, dur]) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch (_) {
      /* Web Audio unavailable or blocked — fine, notifications still work silently */
    }
  }

  function ensureToastStack() {
    let stack = document.getElementById("appToastStack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "appToastStack";
      stack.className = "app-toast-stack";
      document.body.appendChild(stack);
    }
    return stack;
  }

  function showToast(n) {
    const stack = ensureToastStack();
    const el = document.createElement("div");
    el.className = "app-toast";
    el.innerHTML = `
      <span class="app-toast-icon">${Icons.svg(TYPE_ICON[n.type] || "bell", { size: 18 })}</span>
      <span class="app-toast-body">
        <span class="app-toast-title">${n.title}</span>
        <span class="app-toast-text">${n.body}</span>
      </span>
      <button type="button" class="app-toast-close" aria-label="Dismiss">${Icons.svg("x", { size: 14 })}</button>
    `;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      el.classList.remove("in");
      el.classList.add("out");
      setTimeout(() => el.remove(), 220);
    };
    el.querySelector(".app-toast-close").addEventListener("click", dismiss);
    setTimeout(dismiss, 6000);
  }

  function push(sample, { silent } = {}) {
    if (isSuppressed(sample.type)) return null; // muted — never enters the list at all
    const n = {
      id: makeId(),
      type: sample.type,
      title: sample.title,
      body: sample.body,
      time: new Date(),
      read: false,
    };
    items.unshift(n);
    if (items.length > 30) items.length = 30;
    persistItems();
    notify();
    if (!silent) {
      showToast(n);
      playChime();
    }
    return n;
  }

  function markAllRead() {
    items.forEach((n) => (n.read = true));
    persistItems();
    notify();
  }

  function markRead(id) {
    const n = items.find((x) => x.id === id);
    if (n) {
      n.read = true;
      persistItems();
      notify();
    }
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((f) => f !== fn);
    };
  }

  // Called when the bell dropdown opens — the person is now looking at the
  // full list, so any still-showing top-right pop-ups would just visually
  // collide with the dropdown right underneath them.
  function clearToasts() {
    const stack = document.getElementById("appToastStack");
    if (stack) stack.innerHTML = "";
  }

  /* ============================================================
     Identity — "who am I" for owner-matching (tasks) and "don't
     notify me about my own message" (chat). Same pattern chat.html
     already uses: match the signed-in Google account's email against
     the Servi_Team roster to get a real full name; fall back to the
     Google account's own name/email if the roster can't be read or
     doesn't have this person yet. Cached for the page's lifetime so
     every poll cycle doesn't re-fetch the roster sheet.
     ============================================================ */
  let mePromise = null;
  function resolveMe() {
    if (mePromise) return mePromise;
    mePromise = (async () => {
      const account = (typeof Auth !== "undefined" && Auth.getAccount && Auth.getAccount()) || {};
      const email = String(account.email || "").trim().toLowerCase();
      const fallback = { fullName: account.name || account.email || "You", email };
      if (typeof SheetsClient === "undefined" || !SheetsClient.fetchTeamRoster) return fallback;
      try {
        const { members } = await SheetsClient.fetchTeamRoster();
        const matched = email ? members.find((m) => m.email && m.email.trim().toLowerCase() === email) : null;
        return matched ? { fullName: matched.fullName, email } : fallback;
      } catch (_) {
        return fallback; // e.g. roster sheet not reachable this poll — try again next cycle
      }
    })();
    return mePromise;
  }

  /* ============================================================
     Real checks — see the file header for the judgment calls each
     of these encodes. Each is independently try/caught so one
     failing sheet/API (e.g. calendar scope never granted) never
     blocks the other two.
     ============================================================ */
  const TASK_LASTDATE_KEY = "servi_v2_notif_task_lastdate_v1"; // { [taskRow]: "YYYY-MM-DD" last reminded }
  const CAL_SEEN_KEY = "servi_v2_notif_cal_seen_v1"; // { ["timed_"|"allday_" + eventId]: timestampMs already reminded }
  const CHAT_LASTROW_KEY = "servi_v2_notif_chat_lastrow_v1"; // sheet row number, plain number string
  const CALENDAR_LEAD_MS = 15 * 60000; // 15 minutes before an event starts

  async function checkTaskReminders() {
    if (isSuppressed("task_reminder")) return;
    if (typeof SheetsClient === "undefined" || !SheetsClient.fetchPersonalTasks) return;
    if (typeof TaskSheet === "undefined") return;
    try {
      const me = await resolveMe();
      const myName = me.fullName.trim().toLowerCase();
      const { tasks } = await SheetsClient.fetchPersonalTasks();
      const mine = tasks.filter((t) => t.owner && t.owner.trim().toLowerCase() === myName);
      const critical = mine.filter((t) => TaskSheet.isCritical(t));
      if (!critical.length) return;

      const today = new Date().toISOString().slice(0, 10);
      const lastDates = readJSON(TASK_LASTDATE_KEY, {});
      let changed = false;

      critical.forEach((t) => {
        const key = String(t._row);
        if (lastDates[key] === today) return; // already reminded about this one today
        lastDates[key] = today;
        changed = true;
        const deadlineText = t.deadline
          ? (t.deadline.getTime() < Date.now() ? "overdue" : `due ${t.deadline.toLocaleDateString()}`)
          : "no deadline set";
        push({
          type: "task_reminder",
          title: "Critical task",
          body: `${t.description || "(untitled task)"} — ${deadlineText}`,
        });
      });

      if (changed) writeJSON(TASK_LASTDATE_KEY, lastDates);
    } catch (err) {
      console.warn("[Notifications] Couldn't check critical task reminders:", err);
    }
  }

  async function checkCalendarReminders() {
    if (isSuppressed("calendar_reminder")) return;
    if (typeof CalendarAPI === "undefined" || !CalendarAPI.listEvents) return;
    try {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const windowEnd = new Date(Date.now() + CALENDAR_LEAD_MS);

      const events = await CalendarAPI.listEvents({ timeMin: dayStart, timeMax: windowEnd, maxResults: 50 });
      const seen = readJSON(CAL_SEEN_KEY, {});
      const now = Date.now();
      let changed = false;

      events.forEach((ev) => {
        if (!ev.id) return;
        if (ev.allDay) {
          const key = "allday_" + ev.id;
          if (seen[key]) return;
          if (ev.start >= dayStart && ev.start < dayEnd) {
            seen[key] = now;
            changed = true;
            push({ type: "calendar_reminder", title: "Today", body: ev.title });
          }
          return;
        }
        const key = "timed_" + ev.id;
        if (seen[key]) return;
        const msUntil = ev.start.getTime() - now;
        if (msUntil > 0 && msUntil <= CALENDAR_LEAD_MS) {
          seen[key] = now;
          changed = true;
          const timeText = ev.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          push({ type: "calendar_reminder", title: "Starting soon", body: `${ev.title} at ${timeText}` });
        }
      });

      if (changed) {
        // Prune anything older than 30 days so this map doesn't grow forever.
        const cutoff = now - 30 * 86400000;
        Object.keys(seen).forEach((k) => { if (seen[k] < cutoff) delete seen[k]; });
        writeJSON(CAL_SEEN_KEY, seen);
      }
    } catch (err) {
      if (err && err.code === "NEEDS_CALENDAR_SCOPE") return; // calendar not connected for this account — nothing to do
      console.warn("[Notifications] Couldn't check calendar reminders:", err);
    }
  }

  async function checkChatMessages() {
    if (isSuppressed("message")) return;
    if (typeof SheetsClient === "undefined" || !SheetsClient.fetchChatAndTyping) return;
    // Already seeing every message arrive live on the Chat page itself, so
    // we don't toast/bell them there — but we still track "last seen row"
    // even while on that page (see below), so messages sent while you were
    // actually looking at Chat don't all "become new" the instant you
    // navigate to another page.
    const onChatPage = /\/chat\.html$/i.test(location.pathname);
    try {
      const me = await resolveMe();
      const myName = me.fullName.trim().toLowerCase();
      const { messages } = await SheetsClient.fetchChatAndTyping();
      if (!messages.length) return;

      const maxRow = messages.reduce((m, msg) => Math.max(m, msg._row), 0);
      const lastRowRaw = localStorage.getItem(CHAT_LASTROW_KEY);

      if (lastRowRaw === null) {
        // First time this browser has ever checked — record where we are
        // now without notifying for the entire pre-existing chat history.
        localStorage.setItem(CHAT_LASTROW_KEY, String(maxRow));
        return;
      }

      const lastRow = Number(lastRowRaw) || 0;
      if (!onChatPage) {
        const fresh = messages
          .filter((m) => m._row > lastRow && m.sentBy && m.sentBy.trim().toLowerCase() !== myName)
          .sort((a, b) => a._row - b._row);

        // Cap how many toasts one catch-up poll can fire (e.g. after the
        // tab was in the background a while and several messages arrived).
        fresh.slice(-3).forEach((m) => {
          push({ type: "message", title: m.sentBy || "General Chatroom", body: m.message });
        });
      }

      localStorage.setItem(CHAT_LASTROW_KEY, String(maxRow));
    } catch (err) {
      console.warn("[Notifications] Couldn't check chatroom messages:", err);
    }
  }

  const POLL_INTERVAL_MS = 60000;
  async function runChecks() {
    await Promise.allSettled([checkTaskReminders(), checkCalendarReminders(), checkChatMessages()]);
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    notify(); // render whatever's already persisted from a previous page/session immediately
    runChecks();
    pollTimer = setInterval(runChecks, POLL_INTERVAL_MS);
  }

  function renderPanel() {
    const list = items.slice(0, 12);
    const empty = list.length === 0;
    return `
      <div class="app-notif-header">
        <span>Notifications</span>
        <button type="button" class="app-notif-markread" id="appMarkAllRead" ${empty ? "disabled" : ""}>Mark all as read</button>
      </div>
      <div class="app-notif-list">
        ${empty
          ? `<div class="app-notif-empty">You're all caught up.</div>`
          : list
              .map(
                (n) => `
            <button type="button" class="app-notif-item${n.read ? "" : " unread"}" data-id="${n.id}">
              <span class="app-notif-item-icon">${Icons.svg(TYPE_ICON[n.type] || "bell", { size: 17 })}</span>
              <span class="app-notif-item-body">
                <span class="app-notif-item-title">${n.title}</span>
                <span class="app-notif-item-text">${n.body}</span>
                <span class="app-notif-item-time">${timeAgo(n.time)}</span>
              </span>
              ${n.read ? "" : `<span class="app-notif-item-dot"></span>`}
            </button>`
              )
              .join("")}
      </div>
    `;
  }

  return {
    init,
    subscribe,
    getAll: () => items.slice(),
    unreadCount,
    markAllRead,
    markRead,
    clearToasts,
    renderPanel,
    TYPE_LABEL,
    TYPE_ICON,
    MUTE_TYPES,
    isAllMuted,
    setAllMuted,
    isMuted,
    setMuted,
  };
})();
