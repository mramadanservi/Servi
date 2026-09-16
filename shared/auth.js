/* ============================================================
   Auth
   ------------------------------------------------------------
   Google Identity Services sign-in + the "only authorized people"
   allow-list check (see authConfig.js for both the OAuth Client ID
   and the allow-list itself, and the honest limitation of doing this
   check client-side).

   Session handling follows the same pattern the original dashboards
   use: the token is mirrored into sessionStorage so switching between
   pages (or reloading one) doesn't force a fresh sign-in every time,
   but it disappears when the tab is closed rather than lingering
   indefinitely. Every dashboard page calls Auth.requireLogin() near
   the top of its own script, before rendering anything real, and gets
   redirected to login.html if there's no valid, authorized session.
   ============================================================ */

const Auth = (() => {
  let tokenClient = null;
  let accessToken = null;
  let tokenExpiresAt = 0;
  let account = null; // { email, name, picture }
  let grantedScopes = ""; // space-separated, from the token response's own "scope" field

  /* ============================================================
     Security settings — last accessed, auto-logout, session info
     ------------------------------------------------------------
     "Last accessed" is a real timestamp, updated once per successful
     requireLogin(), stored per-browser (localStorage, not tied to
     the per-tab session). Auto-logout is an opt-in inactivity timer:
     off by default (nobody gets silently signed out unless they turn
     it on), configurable minutes, reset by any mouse/keyboard/touch
     activity on the page. Both are wired into requireLogin() itself
     so every page picks them up automatically — no new <script> tag
     or per-page call needed anywhere else in the project.

     "Active sessions" is intentionally honest rather than impressive:
     this app has no backend that could actually know about OTHER
     devices/browsers someone is signed into, so there is exactly one
     real row to show — this browser. Settings' Security section
     shows that one row (via getSessionInfo() below) plus a plain note
     that multi-device history needs a real backend to exist, instead
     of inventing device names the way a mockup reference image might.
     The shape of getSessionInfo()'s return value (an array) is
     deliberately ready for that: a future real backend just needs to
     add more entries to it, nothing about the Settings UI would need
     to change.
     ============================================================ */
  const LAST_ACCESSED_KEY = "servi_v2_last_accessed";
  const AUTO_LOGOUT_ENABLED_KEY = "servi_v2_auto_logout_enabled";
  const AUTO_LOGOUT_MINUTES_KEY = "servi_v2_auto_logout_minutes";
  const DEFAULT_AUTO_LOGOUT_MINUTES = 30;
  const SESSION_START_KEY = "servi_v2_session_started_at"; // per-tab (sessionStorage) — "how long has THIS tab been signed in"

  let autoLogoutTimer = null;
  let autoLogoutRootPath = ".";

  function recordAccess() {
    try { localStorage.setItem(LAST_ACCESSED_KEY, String(Date.now())); } catch (_) {}
    try { if (!sessionStorage.getItem(SESSION_START_KEY)) sessionStorage.setItem(SESSION_START_KEY, String(Date.now())); } catch (_) {}
  }

  function getLastAccessed() {
    try {
      const raw = localStorage.getItem(LAST_ACCESSED_KEY);
      return raw ? new Date(Number(raw)) : null;
    } catch (_) {
      return null;
    }
  }

  function isAutoLogoutEnabled() {
    try { return localStorage.getItem(AUTO_LOGOUT_ENABLED_KEY) === "1"; } catch (_) { return false; }
  }
  function getAutoLogoutMinutes() {
    try {
      const raw = Number(localStorage.getItem(AUTO_LOGOUT_MINUTES_KEY));
      return raw > 0 ? raw : DEFAULT_AUTO_LOGOUT_MINUTES;
    } catch (_) {
      return DEFAULT_AUTO_LOGOUT_MINUTES;
    }
  }
  function setAutoLogout(enabled, minutes) {
    try {
      localStorage.setItem(AUTO_LOGOUT_ENABLED_KEY, enabled ? "1" : "0");
      if (minutes > 0) localStorage.setItem(AUTO_LOGOUT_MINUTES_KEY, String(minutes));
    } catch (_) {}
    armAutoLogoutTimer();
  }

  function armAutoLogoutTimer() {
    if (autoLogoutTimer) clearTimeout(autoLogoutTimer);
    autoLogoutTimer = null;
    if (!isAutoLogoutEnabled() || !isSignedIn()) return;
    autoLogoutTimer = setTimeout(() => {
      signOut();
      window.location.href = `${autoLogoutRootPath}/login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "")}&reason=idle`;
    }, getAutoLogoutMinutes() * 60000);
  }

  function startAutoLogoutWatch(rootPath) {
    autoLogoutRootPath = rootPath || ".";
    armAutoLogoutTimer();
    if (startAutoLogoutWatch._wired) return; // listeners only need wiring once per page load
    startAutoLogoutWatch._wired = true;
    let lastReset = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < 5000) return; // throttle — no need to reset on every single mousemove tick
      lastReset = now;
      armAutoLogoutTimer();
    };
    ["mousemove", "mousedown", "keydown", "scroll", "touchstart"].forEach((evt) =>
      window.addEventListener(evt, onActivity, { passive: true })
    );
  }

  // One real row (this browser) — see the header comment above for why
  // this doesn't fabricate other devices.
  function getSessionInfo() {
    let startedAt = null;
    try {
      const raw = sessionStorage.getItem(SESSION_START_KEY);
      if (raw) startedAt = new Date(Number(raw));
    } catch (_) {}
    return [{ label: "This browser", current: true, startedAt, lastAccessed: getLastAccessed() }];
  }

  function isAllowed(email) {
    if (!email) return false;
    const needle = email.trim().toLowerCase();
    return AuthConfig.ALLOWED_EMAILS.some((e) => e.trim().toLowerCase() === needle);
  }

  function persistSession() {
    try {
      sessionStorage.setItem(
        AuthConfig.SESSION_KEY,
        JSON.stringify({ accessToken, tokenExpiresAt, account, grantedScopes })
      );
    } catch (_) {
      /* sessionStorage unavailable (private mode, etc.) — sign-in still
         works, it just won't survive a page switch/reload in that case */
    }
  }

  function clearPersistedSession() {
    try {
      sessionStorage.removeItem(AuthConfig.SESSION_KEY);
    } catch (_) {
      /* nothing to clear */
    }
  }

  function restoreSession() {
    try {
      const raw = sessionStorage.getItem(AuthConfig.SESSION_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !saved.accessToken || !saved.tokenExpiresAt) return false;
      if (Date.now() >= saved.tokenExpiresAt - 30000) return false; // expired or expiring any moment
      if (!saved.account || !isAllowed(saved.account.email)) return false;
      accessToken = saved.accessToken;
      tokenExpiresAt = saved.tokenExpiresAt;
      account = saved.account;
      grantedScopes = saved.grantedScopes || "";
      return true;
    } catch (_) {
      return false;
    }
  }

  function init() {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      throw new Error("Google Sign-In couldn't load. Check your internet connection and reload the page.");
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: AuthConfig.OAUTH_CLIENT_ID,
      scope: AuthConfig.SCOPES,
      callback: () => {}, // replaced per-request below
    });
  }

  async function loadAccountInfo() {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Couldn't read your Google account's basic info.");
    const info = await res.json();
    account = { email: info.email || null, name: info.name || info.email || "", picture: info.picture || null };
  }

  function requestToken({ interactive }) {
    return new Promise((resolve, reject) => {
      if (!tokenClient) {
        reject(new Error("Sign-in is not set up yet."));
        return;
      }
      tokenClient.callback = async (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error || "Sign-in was cancelled or failed."));
          return;
        }
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3300) * 1000;
        grantedScopes = resp.scope || "";
        try {
          await loadAccountInfo();
        } catch (e) {
          reject(e);
          return;
        }
        resolve();
      };
      tokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
    });
  }

  // Interactive sign-in for the login page's button. Throws a clear,
  // distinct error when the sign-in itself succeeded but the account
  // isn't on the allow-list, so the login page can show the right message
  // instead of a generic failure.
  async function signIn() {
    await requestToken({ interactive: true });
    if (!isAllowed(account.email)) {
      const blockedEmail = account.email;
      accessToken = null;
      tokenExpiresAt = 0;
      account = null;
      const err = new Error(`${blockedEmail} isn't on the authorized list yet.`);
      err.code = "NOT_AUTHORIZED";
      throw err;
    }
    persistSession();
  }

  function signOut() {
    if (accessToken && window.google && google.accounts && google.accounts.oauth2) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    tokenExpiresAt = 0;
    account = null;
    clearPersistedSession();
  }

  function isSignedIn() {
    return !!accessToken && !!account && isAllowed(account.email);
  }

  function getAccount() {
    return account;
  }

  function getAccessToken() {
    return accessToken;
  }

  // Returns a token guaranteed usable right now: the cached one if it still
  // has more than 30s left, otherwise a SILENT renewal (no popup, no user
  // interaction) via the same tokenClient — this is the piece v1's
  // GoogleAuth.ensureToken() has that a plain getAccessToken() getter
  // doesn't. Without it, a page left open past the ~1hr token lifetime
  // would start failing every Sheets/Calendar call with a stale token.
  // Silent renewal only works if init() has already set up tokenClient
  // (see the <script src="https://accounts.google.com/gsi/client"> +
  // Auth.init() call every dashboard page needs, alongside auth.js) — if
  // that hasn't happened, or the silent renewal itself fails (revoked
  // access, no active Google browser session), this throws NEEDS_REAUTH
  // so callers can fall back to an interactive reconnect prompt instead of
  // a raw, confusing fetch failure.
  async function ensureToken() {
    if (accessToken && Date.now() < tokenExpiresAt - 30000) return accessToken;
    if (!tokenClient) {
      const err = new Error("Your session needs to be reconnected.");
      err.code = "NEEDS_REAUTH";
      throw err;
    }
    try {
      await requestToken({ interactive: false });
      persistSession();
      return accessToken;
    } catch (e) {
      accessToken = null;
      tokenExpiresAt = 0;
      const err = new Error("Your Google session expired and couldn't be renewed automatically. Please reconnect.");
      err.code = "NEEDS_REAUTH";
      throw err;
    }
  }

  // Was this particular OAuth scope actually granted? A session persisted
  // from before a scope was added to AuthConfig.SCOPES (or one from a
  // partial consent) won't have it — callers like calendar.js use this to
  // show a "reconnect" prompt instead of a confusing API error.
  function hasScope(scope) {
    return grantedScopes.split(" ").filter(Boolean).includes(scope);
  }

  // The raw list of scopes Google actually granted, for diagnostics (e.g.
  // showing "here's what Google gave us" in Settings, or in a reconnect
  // failure message) — deliberately excludes the always-present identity
  // scopes so it only lists the "real" data-access ones.
  function grantedDataScopes() {
    const identity = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];
    return grantedScopes.split(" ").filter(Boolean).filter((s) => !identity.includes(s));
  }

  // Re-runs the interactive consent screen for the current SCOPES and
  // re-persists the session. Useful when hasScope() says a needed
  // permission is missing on an otherwise-valid session.
  //
  // Pass `requiredScope` when the caller needs a SPECIFIC scope to come
  // back granted (e.g. calendar.readonly) — Google's consent popup can
  // complete successfully (the person clicks "Continue", no error at all)
  // while still NOT including a particular scope in the token it hands
  // back. That happens silently when that scope isn't actually offered by
  // this app's OAuth consent screen configuration in Google Cloud Console
  // yet (a one-time setup step there, separate from anything wrong in this
  // code or anything the person did). Without this check, that situation
  // looked like "I click Connect, go through Google's screen, and nothing
  // happens" — reauthorize() would resolve "successfully" and the caller
  // would reload/retry into the exact same missing-permission state, with
  // no explanation. Now it throws a specific, explainable error instead.
  async function reauthorize(requiredScope) {
    await requestToken({ interactive: true });
    persistSession();
    if (requiredScope && !hasScope(requiredScope)) {
      const err = new Error(
        "Google completed the sign-in but didn't include this permission in what it granted. This " +
        "almost always means the scope hasn't been added to this app's OAuth consent screen in Google " +
        "Cloud Console yet (or the matching API isn't enabled there) — a one-time setup step, not " +
        "something you did wrong. See Settings → Connections for exactly what Google did grant."
      );
      err.code = "SCOPE_NOT_GRANTED";
      throw err;
    }
  }

  // Called at the top of every dashboard page. Restores a still-valid
  // session from this tab if there is one; otherwise sends the browser to
  // the login page, remembering where it was trying to go so login.html
  // can bounce back after a successful sign-in.
  function requireLogin(rootPath) {
    if (restoreSession()) {
      recordAccess();
      startAutoLogoutWatch(rootPath || ".");
      return true;
    }
    const root = rootPath || ".";
    const returnTo = window.location.pathname.split("/").pop();
    window.location.href = `${root}/login.html?next=${encodeURIComponent(returnTo || "")}`;
    return false;
  }

  return {
    init,
    signIn,
    signOut,
    isSignedIn,
    isAllowed,
    getAccount,
    getAccessToken,
    ensureToken,
    hasScope,
    grantedDataScopes,
    reauthorize,
    requireLogin,
    restoreSession,
    getLastAccessed,
    isAutoLogoutEnabled,
    getAutoLogoutMinutes,
    setAutoLogout,
    getSessionInfo,
  };
})();
