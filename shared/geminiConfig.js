/* ============================================================
   AI ASSISTANT — CONFIGURATION
   ------------------------------------------------------------
   Ported near-verbatim from the older, fully-built
   servi-unified-dashboard/assistant/js/config.js — same Gemini
   models list, same tool-round/timeout/retry safety valves.

   API KEY — changed again as of the Settings redesign (confirmed
   with the user): the key is no longer user-editable anywhere in the
   UI at all. Settings' old "paste your key here" field is gone.
   Instead it's meant to live directly in code/environment, per the
   user's explicit instruction. Real, important limitation to flag:
   this is a fully static, client-side dashboard with no backend/build
   step — there is no such thing as a truly private server-side secret
   here. Whatever value is set below is shipped straight into a file
   this browser downloads and runs, which means it's visible to
   anyone who opens this page's dev tools/view-source. That's a
   genuine trade-off of the "hardcode it in code" choice on a static
   site (vs. the previous per-browser-localStorage approach, which had
   the same exposure but at least didn't require shipping one shared
   key to every single visitor). If real key secrecy matters, the
   actual fix is a small server-side proxy — worth a future phase if
   this becomes a priority.

   HARDCODED_API_KEY holds the real key you pasted in on your own machine
   after an earlier delivery of this file shipped it empty (there was no
   real key to embed at the time — inventing one would have just been a
   broken placeholder pretending to work). This cloud-workspace copy is
   kept in sync with that real value so a future delivery from here
   doesn't blank it out again. If you ever need to rotate it:
     1. Go to https://aistudio.google.com/apikey (free, no credit card)
     2. Sign in, click "Create API key", copy it
     3. Paste it as the value of HARDCODED_API_KEY below and redeploy
   ============================================================ */

const GeminiConfig = {
  // Your real Gemini API key (kept in sync with what's on your machine —
  // see the header comment above).
  HARDCODED_API_KEY: "AQ.Ab8RN6I-1tMexaxM-UNbbzcmdZ6TrVPMH4WOBfKhLA1GAMtRHA",

  MODEL_STORAGE_KEY: "servi_v2_gemini_model",

  // Editable "suggested queries" chips shown on a new AI Assistant chat
  // (Settings > AI Settings lets you view/add/edit/remove/reorder these).
  // This is the DEFAULT set, used until someone customizes it; once
  // customized, the edited list lives in SUGGESTED_QUERIES_STORAGE_KEY and
  // this default is only a fallback (e.g. after "reset to defaults").
  SUGGESTED_QUERIES_STORAGE_KEY: "servi_v2_gemini_suggested_queries",
  DEFAULT_SUGGESTED_QUERIES: [
    "How are we doing on tutors today?",
    "Who's our top caller this week?",
    "How's our follow-up queue looking?",
    "I want a French tutor in Beirut, who's available?",
    "What tasks does Mohamad Ramadan have open?",
  ],

  // See precedent's config.js for the same note: Google renames/replaces
  // free-tier models over time — if the assistant ever errors with a 404 /
  // "model not found," open Settings (or the AI Assistant page's own model
  // picker — both read/write the same stored value) and try a different
  // model from this list, or check
  // https://ai.google.dev/gemini-api/docs/models for whatever's current
  // and add it here.
  DEFAULT_MODEL: "gemini-3.5-flash",
  AVAILABLE_MODELS: [
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (recommended — more capable)" },
    { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (fastest, lighter reasoning)" },
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (newest, may be in higher demand)" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (older, may be unavailable)" },
  ],

  API_BASE: "https://generativelanguage.googleapis.com/v1beta/models",

  // Same as precedent: the assistant remembers earlier Q&A within one
  // browser tab's active chat (see geminiClient.js's `history`). NEW in
  // v2: since a chat can now be saved/switched/reloaded (ChatStore), this
  // history is also persisted per-chat — see chatStore.js.
  REMEMBERS_CONVERSATION: true,

  MAX_TOOL_ROUNDS: 6,
  REQUEST_TIMEOUT_MS: 20000,
  MAX_RETRIES: 2,
  RETRY_BASE_DELAY_MS: 600,
};
