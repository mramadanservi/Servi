/* ============================================================
   Auth configuration
   ------------------------------------------------------------
   OAUTH_CLIENT_ID is the SAME Google Cloud OAuth Client ID used by
   every dashboard in the original servi-unified-dashboard-v1 project
   (see e.g. recruitment/js/config.js there) — reused here on purpose,
   per your instruction to pull real IDs/keys from that project rather
   than generating placeholder ones. It's already configured in Google
   Cloud Console for this app, so it works unchanged here.

   ALLOWED_EMAILS is the "only people I've already authorized" list.
   Important limitation, stated plainly: this is a static site with no
   backend, so this check runs entirely in the browser. It keeps
   casual/accidental access out (nobody stumbles into the dashboard by
   guessing a URL, and every real user still has to sign in with a
   real Google account), but it is NOT real security — anyone who can
   view this file's source could edit their own copy to skip the
   check. Real access control would need a backend to verify server-
   side. Good enough for an internal tool with a small, trusted team
   and a non-public URL; worth revisiting if that ever changes.

   To add or remove a teammate, just edit this array. Emails are
   matched lowercase/trimmed, so casing doesn't matter.
   ============================================================ */

const AuthConfig = {
  OAUTH_CLIENT_ID: "39593224675-ksfh97rta65n1br13svhmpachhvb39j8.apps.googleusercontent.com",

  // Identity, read-only Calendar (Calendar page/widget), and read/write
  // Sheets — all requested upfront at sign-in so there's no separate
  // re-consent step later.
  //
  // Upgraded from spreadsheets.readonly to full spreadsheets (confirmed
  // with the user) ONLY so the General Chatroom can post/delete rows in
  // the "General_ChatRoom" and "Typing" tabs — see the header comment on
  // ChatConfig in sheetsConfig.js. Google has no narrower "read/write
  // just one spreadsheet" scope, so this technically grants write access
  // to any sheet your account can edit; the app itself never calls a
  // write endpoint against anything but ChatConfig/ChatTypingConfig.
  // Everyone (including you) needs to reconnect once after this ships —
  // same "Reconnect Google Account" flow already in Settings.
  SCOPES: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/spreadsheets",

  SESSION_KEY: "servi_v2_session",

  // Seeded with your own address since it's already known-good. Add every
  // other teammate who should be able to sign in below.
  ALLOWED_EMAILS: [
    "mramadan@servilb.com",
    "mdaoud@servilb.com",
    // "teammate@servilb.com",
  ],
};
