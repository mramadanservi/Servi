/* ============================================================
   ChatStore
   ------------------------------------------------------------
   NEW in v2 — not part of the precedent AI Assistant, which only
   ever had one live, unsaved chat per browser tab (see
   geminiClient.js's original header comment: history "never
   persisted... a reload or Chat.clear() starts fresh").

   The user asked for a side panel of saved/multiple chats: start a
   new one, switch between them, delete one, clear all. This module
   is that: chats are small JSON records in localStorage — messages
   (for re-rendering the bubble list) plus each chat's OWN Gemini
   conversation history (an opaque array GeminiClient.getHistory()/
   setHistory() produce/consume), so switching chats correctly swaps
   in that chat's own follow-up context rather than bleeding one
   chat's history into another.

   Per-browser only, same as every other localStorage-backed
   preference in this project (theme, Gemini API key, etc.) — there's
   no backend, so chats don't sync across devices/browsers.
   ============================================================ */

const ChatStore = (() => {
  const CHATS_KEY = "servi_v2_ai_chats";
  const ACTIVE_KEY = "servi_v2_ai_active_chat";

  function readAll() {
    try {
      const raw = localStorage.getItem(CHATS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeAll(chats) {
    try { localStorage.setItem(CHATS_KEY, JSON.stringify(chats)); } catch (_) { /* storage full/unavailable */ }
  }

  function list() {
    // Most-recently-updated first.
    return readAll().slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function get(id) {
    return readAll().find((c) => c.id === id) || null;
  }

  function makeId() {
    return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function create() {
    const chat = {
      id: makeId(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [], // [{ role: "user"|"assistant"|"error", text }]
      geminiHistory: [],
    };
    const all = readAll();
    all.push(chat);
    writeAll(all);
    setActiveId(chat.id);
    return chat;
  }

  function update(id, patch) {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
    writeAll(all);
    return all[idx];
  }

  // Appends one message and (optionally) auto-titles the chat from the
  // first user message, the same way most chat UIs title a new thread.
  function appendMessage(id, message) {
    const chat = get(id);
    if (!chat) return null;
    const messages = [...chat.messages, message];
    const patch = { messages };
    if (chat.title === "New chat" && message.role === "user") {
      patch.title = message.text.length > 48 ? message.text.slice(0, 48).trim() + "…" : message.text;
    }
    return update(id, patch);
  }

  function remove(id) {
    const all = readAll().filter((c) => c.id !== id);
    writeAll(all);
    if (getActiveId() === id) {
      try { localStorage.removeItem(ACTIVE_KEY); } catch (_) { /* ignore */ }
    }
  }

  function clearAll() {
    writeAll([]);
    try { localStorage.removeItem(ACTIVE_KEY); } catch (_) { /* ignore */ }
  }

  function getActiveId() {
    try { return localStorage.getItem(ACTIVE_KEY) || null; } catch (_) { return null; }
  }

  function setActiveId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id); } catch (_) { /* ignore */ }
  }

  return { list, get, create, update, appendMessage, remove, clearAll, getActiveId, setActiveId };
})();
