/* ============================================================
   GeminiClient
   ------------------------------------------------------------
   Ported near-verbatim from the older, fully-built
   servi-unified-dashboard/assistant/js/geminiClient.js — same
   Gemini API call shape, same tool-calling loop, same retry/timeout/
   friendly-error handling, same system prompt structure. Talks
   directly to Google's Gemini API from the browser (no backend).

   Two real adaptations for v2:
     1. Reads GeminiConfig / AiTools instead of precedent's CONFIG /
        Tools (renamed to avoid clashing with other v2 globals).
     2. Exposes getHistory()/setHistory() so ChatStore (new in v2) can
        save and restore each saved chat's own independent Gemini
        conversation history when switching between chats in the new
        side panel — precedent only ever had one chat per tab, so it
        never needed to swap histories out from under itself.
   ============================================================ */

const GeminiClient = (() => {
  let history = [];
  const MAX_HISTORY_TURNS = 24;

  function resetHistory() {
    history = [];
  }

  function getHistory() {
    return history;
  }

  // Replaces the whole running history wholesale — used when the chat
  // side panel switches to a different saved chat.
  function setHistory(h) {
    history = Array.isArray(h) ? h : [];
  }

  function trimHistory() {
    while (history.length > MAX_HISTORY_TURNS) {
      history.shift();
    }
  }

  // As of the Settings redesign, the key is no longer user-editable — it's
  // a hardcoded value in geminiConfig.js (see that file's header comment
  // for why, and the real client-side-secret limitation that comes with
  // it). setApiKey() is gone on purpose: there's nothing left in this app
  // that's allowed to change the key at runtime.
  function getApiKey() {
    return (GeminiConfig.HARDCODED_API_KEY || "").trim();
  }

  function hasApiKey() {
    return !!getApiKey();
  }

  function getModel() {
    try { return localStorage.getItem(GeminiConfig.MODEL_STORAGE_KEY) || GeminiConfig.DEFAULT_MODEL; } catch (_) { return GeminiConfig.DEFAULT_MODEL; }
  }

  function setModel(modelId) {
    try { localStorage.setItem(GeminiConfig.MODEL_STORAGE_KEY, String(modelId || GeminiConfig.DEFAULT_MODEL)); } catch (_) { /* ignore */ }
  }

  function todayContext() {
    const now = new Date();
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = now.toISOString().slice(0, 10);
    return `Today is ${weekday}, ${dateStr}.`;
  }

  function systemPrompt() {
    return [
      "You are the AI Assistant built into Servi's internal team dashboard.",
      "Servi is a marketplace connecting families with vetted freelancers (tutors, coaches, therapists, caregivers, babysitters, nurses, beauty and pet services) in Lebanon. You are talking to a Servi teammate, not an outside customer — talk to them like one operator talking to another: direct, plain, no corporate buzzwords.",
      todayContext(),
      "",
      "You can answer two kinds of questions:",
      "1. Internal recruitment/team pipeline questions (calls made, conversion rates, follow-up queue, team member tasks) — via list_verticals, list_callers, vertical_summary, team_summary, caller_summary, caller_leaderboard, calls_needed_for_target, follow_up_queue_summary, team_member_tasks. These read this dashboard's real Google Sheets directly (Recruitment sheet + whichever team members have a personal task-tracker sheet configured — see team_member_tasks' own notes on that).",
      "2. Freelancer/applicant search questions (\"I want a French tutor in Beirut\", \"how many Tutoring applicants do we have\") — via search_freelancers. This reads Servi's real applicant pool (the Applied page's data).",
      "",
      "Hard rule: you may NEVER state a specific number, name, phone number, or any other concrete fact unless it came directly out of a tool result in this conversation (either just now, or earlier in this same chat). If you don't have a tool result for it, say you don't have that data rather than estimating or guessing — never invent a figure or a name.",
      "search_freelancers can return real applicants' names and phone numbers — that's expected and intentional (this is an internal tool for reaching out to them), but never state a name or number that didn't come from a tool result.",
      "If a question mentions a category (like \"tutors\") or a person's name and you're not sure it matches the data's exact spelling, call list_verticals or list_callers first to check, rather than guessing which one they mean.",
      "If a tool returns an error (for example, a team member's task sheet isn't accessible, or a name doesn't match anyone), tell the user plainly what's missing and, if the tool gave you a list of valid options, offer them — don't paper over it.",
      "Keep answers short and concrete: lead with the number or name they asked for, then a brief bit of context if it's useful. Don't pad with filler.",
      "You DO remember earlier questions and answers in this same chat (cleared only if the user starts a new chat or clicks the trash icon) — use that context for follow-ups like \"what about her?\" or \"and this week?\" instead of asking the user to repeat themselves. You do not remember anything from a different saved chat or a previous visit.",
    ].join("\n");
  }

  function buildRequestBody(contents) {
    return {
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents,
      tools: [{ functionDeclarations: AiTools.DECLARATIONS }],
    };
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isRetryable(kind) {
    return kind === "overloaded" || kind === "network" || kind === "timeout";
  }

  async function callApi(contents) {
    const key = getApiKey();
    const model = getModel();
    const url = `${GeminiConfig.API_BASE}/${encodeURIComponent(model)}:generateContent`;

    const controller = new AbortController();
    const timeoutMs = GeminiConfig.REQUEST_TIMEOUT_MS || 20000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(buildRequestBody(contents)),
        signal: controller.signal,
      });
    } catch (e) {
      const err = new Error(e && e.name === "AbortError" ? "timeout" : "network");
      err.kind = e && e.name === "AbortError" ? "timeout" : "network";
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      let bodyText = "";
      try { bodyText = await res.text(); } catch (_) { /* ignore */ }
      const err = new Error(`http ${res.status}`);
      err.kind = res.status === 401 || res.status === 403 ? "auth"
        : res.status === 429 ? "rate-limit"
        : res.status === 404 ? "not-found"
        : res.status === 503 ? "overloaded"
        : "http";
      err.status = res.status;
      err.detail = bodyText;
      throw err;
    }

    return res.json();
  }

  async function callApiWithRetry(contents) {
    const maxRetries = GeminiConfig.MAX_RETRIES || 0;
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await callApi(contents);
      } catch (err) {
        lastErr = err;
        if (attempt === maxRetries || !isRetryable(err.kind)) throw err;
        console.warn(`Gemini call failed (${err.kind}), retrying (${attempt + 1}/${maxRetries})…`);
        await sleep((GeminiConfig.RETRY_BASE_DELAY_MS || 600) * Math.pow(2, attempt));
      }
    }
    throw lastErr;
  }

  function extractParts(json) {
    const candidate = json && json.candidates && json.candidates[0];
    return (candidate && candidate.content && candidate.content.parts) || [];
  }

  function extractApiErrorMessage(detail) {
    try {
      const parsed = JSON.parse(detail);
      return (parsed && parsed.error && parsed.error.message) || "";
    } catch (_) {
      return "";
    }
  }

  function friendlyError(err) {
    if (err && err.kind === "no-key") {
      return "There's no Gemini API key saved yet — open Settings and paste one in. It's free from Google AI Studio.";
    }
    if (err && err.kind === "network") {
      return "Couldn't reach Google's API — check your internet connection and try again.";
    }
    if (err && err.kind === "auth") {
      return "Google rejected that API key. Double check it was copied in full in Settings, or generate a fresh one at aistudio.google.com/apikey.";
    }
    if (err && err.kind === "rate-limit") {
      return "Hit the free tier's rate limit (Gemini allows a limited number of requests per minute/day). Wait a moment and try again.";
    }
    if (err && err.kind === "not-found") {
      return `The model "${getModel()}" isn't available for this API key right now (Google retires model versions over time). Open Settings and pick a different model from the dropdown.`;
    }
    if (err && err.kind === "overloaded") {
      return `Gemini's "${getModel()}" model is overloaded right now (Google's servers, not your key) — this happens more on newer/popular models. Already retried a couple of times. Try again in a bit, or switch to the Flash-Lite model in Settings, which tends to have more headroom.`;
    }
    if (err && err.kind === "timeout") {
      return "Gemini didn't respond in time, so this gave up rather than leave you waiting indefinitely. Try again, or switch to the Flash-Lite model in Settings for faster responses.";
    }
    const apiMsg = err && err.detail ? extractApiErrorMessage(err.detail) : "";
    if (apiMsg) return `Gemini API error: ${apiMsg}`;
    if (err && err.status) return `Gemini API returned an unexpected error (HTTP ${err.status}). Check the browser console for details, or try again.`;
    return "Something went wrong talking to Gemini. Try again in a moment.";
  }

  async function ask(question) {
    if (!hasApiKey()) {
      return { ok: false, message: friendlyError({ kind: "no-key" }) };
    }

    const remembers = !!GeminiConfig.REMEMBERS_CONVERSATION;
    const questionTurn = { role: "user", parts: [{ text: String(question || "") }] };
    let contents = remembers ? [...history, questionTurn] : [questionTurn];
    const turnsThisQuestion = [questionTurn];

    for (let round = 0; round <= GeminiConfig.MAX_TOOL_ROUNDS; round++) {
      let json;
      try {
        json = await callApiWithRetry(contents);
      } catch (err) {
        console.error("Gemini API call failed:", err && err.status, err && err.detail, err);
        return { ok: false, message: friendlyError(err) };
      }

      const parts = extractParts(json);
      if (!parts.length) {
        const blockReason = json && json.promptFeedback && json.promptFeedback.blockReason;
        return { ok: false, message: blockReason ? `Gemini declined to answer that (${blockReason}).` : "Gemini returned an empty response — try rephrasing the question." };
      }

      const functionCalls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);

      if (!functionCalls.length) {
        const text = parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("\n").trim();
        if (remembers) {
          const modelTurn = { role: "model", parts };
          turnsThisQuestion.push(modelTurn);
          history.push(...turnsThisQuestion);
          trimHistory();
        }
        return { ok: true, text: text || "I didn't get a clear answer for that — try rephrasing." };
      }

      if (round === GeminiConfig.MAX_TOOL_ROUNDS) {
        return { ok: false, message: "That question needed more back-and-forth with the data than I'm allowed — try breaking it into a simpler question." };
      }

      const modelTurn = { role: "model", parts };
      const responseParts = await Promise.all(
        functionCalls.map(async (fc) => ({
          functionResponse: {
            name: fc.name,
            response: { name: fc.name, content: await AiTools.call(fc.name, fc.args) },
          },
        }))
      );
      const toolResponseTurn = { role: "user", parts: responseParts };
      contents.push(modelTurn, toolResponseTurn);
      turnsThisQuestion.push(modelTurn, toolResponseTurn);
    }

    return { ok: false, message: "Something went wrong resolving that question." };
  }

  return { ask, hasApiKey, getApiKey, getModel, setModel, resetHistory, getHistory, setHistory };
})();
