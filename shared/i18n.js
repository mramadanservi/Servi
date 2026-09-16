/* ============================================================
   I18n
   ------------------------------------------------------------
   Real English/French translation, not just a persisted-but-inert
   preference (that's what Settings > Language used to be — see its
   own comment, now updated). Reuses the exact same "servi_v2_language"
   localStorage key Settings already reads/writes, so choosing French
   there immediately re-translates the page it's on, and every other
   open tab/page picks it up too (via the same cross-tab "storage"
   event pattern Theme already uses).

   How it works: DICT below maps an exact English source string to its
   French translation. t(str) returns the translation when French is
   selected, or the original string unchanged for English/anything not
   yet in the dictionary — so a missing entry degrades to plain English
   rather than breaking. Two ways to use it:

     1. Static HTML text: mark the element `data-i18n="Exact Text"` and
        call I18n.apply() (already done automatically on init(), and
        again whenever the language changes) — it sets that element's
        textContent to t() of the attribute's value. Same idea for a
        placeholder (`data-i18n-placeholder`) or a title tooltip
        (`data-i18n-title`).
     2. Text built in JS (template literals, render functions): just
        wrap the literal English string directly, e.g. `${I18n.t("Total
        Leads")}` — this is how the shared sidebar/topbar (AppShell) and
        the KPI/filter labels on the main pages are translated.

   COVERAGE NOTE (flagged honestly rather than silently overstated): the
   navigation/top bar (all pages, via shared/sidebar.js) and the
   Overview/Leads/Calls/Applied/Settings pages have real French copy
   below. Map/Team/Profile/Chat/Calendar/Help/Sources/AI Assistant load
   this same mechanism (so nothing breaks and English still displays
   correctly there) but don't have French dictionary entries yet — add
   them here the same way as the pages already covered. Real applicant/
   lead/team DATA (names, districts, free-text notes, AI Assistant
   answers) is never translated — it's the user's actual data, not UI
   copy, so translating it would misrepresent what's really in the sheet.
   ============================================================ */

const I18n = (() => {
  const KEY = "servi_v2_language";

  const FR = {
    // ---- sidebar / nav (shared/sidebar.js) ----
    "General": "Général",
    "General Overview": "Aperçu général",
    "Leads": "Prospects",
    "Calls": "Appels",
    "Applied": "Candidatures",
    "Sources": "Sources",
    "Map": "Carte",
    "Calendar": "Calendrier",
    "AI": "IA",
    "AI Assistant": "Assistant IA",
    "Workspace": "Espace de travail",
    "Team": "Équipe",
    "Profile": "Profil",
    "General Chatroom": "Salon de discussion général",
    "Create New Chatroom": "Créer un salon de discussion",
    "Settings": "Paramètres",
    "Help": "Aide",
    "Logout": "Déconnexion",
    "Settings ": "Paramètres ",

    // ---- common filter bar (Leads/Calls/Applied) ----
    "Filter": "Filtre",
    "All Time": "Toute la période",
    "Yesterday": "Hier",
    "Today": "Aujourd'hui",
    "This Week": "Cette semaine",
    "This Month": "Ce mois-ci",
    "Custom Range": "Plage personnalisée",
    "District": "District",
    "Area": "Zone",
    "Vertical": "Secteur",
    "Gender": "Genre",
    "Added By": "Ajouté par",
    "Called By": "Appelé par",
    "Specialty": "Spécialité",
    "All": "Tous",
    "Clear filters": "Effacer les filtres",
    "Start date": "Date de début",
    "End date": "Date de fin",
    "Clear": "Effacer",
    "Cancel": "Annuler",
    "Apply": "Appliquer",

    // ---- Overview ----
    "Total Leads": "Total des prospects",
    "Total Calls": "Total des appels",
    "All-time": "Depuis le début",
    "Goals & Progress": "Objectifs et progression",

    // ---- Leads ----
    "Added Today": "Ajoutés aujourd'hui",
    "Added This Week": "Ajoutés cette semaine",
    "Added This Month": "Ajoutés ce mois-ci",
    "New leads today": "Nouveaux prospects aujourd'hui",
    "Since Monday": "Depuis lundi",
    "Since the 1st": "Depuis le 1er",

    // ---- Calls ----
    "Total Calls Made": "Total des appels passés",
    "Answered Calls": "Appels répondus",
    "Follow-Up Calls": "Appels de suivi",
    "waiting on a next call": "en attente d'un prochain appel",

    // ---- Applied ----
    "Applied Today": "Candidatures aujourd'hui",
    "Applied This Week": "Candidatures cette semaine",
    "Applied This Month": "Candidatures ce mois-ci",
    "New applications today": "Nouvelles candidatures aujourd'hui",
    "Download Card": "Télécharger la carte",

    // ---- Settings ----
    "Profile Settings": "Paramètres du profil",
    "Security": "Sécurité",
    "Date & Time": "Date et heure",
    "Preferences": "Préférences",
    "Appearance": "Apparence",
    "Notifications": "Notifications",
    "Language": "Langue",
    "Theme": "Thème",
    "Light": "Clair",
    "Dark": "Sombre",
    "Others": "Autres",
    "Help & Support": "Aide et assistance",
    "About Us": "À propos de nous",
    "Save": "Enregistrer",
    "Saved": "Enregistré",
    "Reset": "Réinitialiser",
    "English": "Anglais",
    "French": "Français",
  };

  function getLang() {
    try {
      const v = localStorage.getItem(KEY);
      return v === "fr" ? "fr" : "en";
    } catch (_) {
      return "en";
    }
  }

  function setLang(lang) {
    try {
      localStorage.setItem(KEY, lang === "fr" ? "fr" : "en");
    } catch (_) {
      /* localStorage unavailable — selection just won't persist across reloads */
    }
    apply();
  }

  function t(str) {
    if (getLang() !== "fr") return str;
    return FR[str] || str;
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
  }

  function init() {
    apply();
    // Cross-tab / cross-page sync, same convention as Theme.
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) apply();
    });
  }

  return { init, apply, t, getLang, setLang };
})();
