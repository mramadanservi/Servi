/* ============================================================
   AppShell
   Builds the persistent sidebar + top bar around a page's own
   content. Each page keeps its real markup inside <main id="pageBody">
   in its HTML; AppShell.init() lifts that node into place inside the
   shell it builds, so page authors never have to hand-write the
   sidebar/topbar markup themselves.

   Usage, near the bottom of a dashboard page's <body>, AFTER
   Auth.requireLogin() has already confirmed a valid session. icons.js
   and notifications.js must load before this file — the sidebar/topbar
   markup and the notification bell both depend on them:

     <script src="../shared/authConfig.js"></script>
     <script src="../shared/auth.js"></script>
     <script src="../shared/icons.js"></script>
     <script src="../shared/notifications.js"></script>
     <script src="../shared/sidebar.js"></script>
     <script>
       if (Auth.requireLogin("..")) {
         AppShell.init({ current: "overview", root: ".." });
       }
     </script>
   ============================================================ */

const AppShell = (() => {
  // The Sources page's own left-menu sub-navigation (see sources.html /
  // sources-*.html). Any page whose `current` key starts with "sources"
  // is considered part of this section — the sidebar opens directly into
  // this sub-panel (with a short slide-in) instead of the normal top-level
  // groups, and the back arrow lets you peek at the full menu without
  // navigating away from wherever you are.
  // Restructured into 3 conceptual groups per request: "General Overview"
  // stays a single standalone item (not collapsible — it's the one page
  // that isn't specific to a vertical or a source type), then two
  // collapsible groups: "Verticals" (the 9 existing per-vertical tabs) and
  // "Sources" (the 6 actual source-type tabs — Facebook Groups, Academies,
  // Syndicates, Freelancer Platforms, Tutoring Centers, Nursing Schools).
  // `overview` renders first and un-collapsible; each entry in `groups`
  // renders as a header row with a click-to-collapse chevron (state kept in
  // sessionStorage per group key — see wireInteractions — so it survives
  // navigating between Sources sub-pages within one tab session, same
  // "per session" convention already used for the slide-in animation
  // below, but resets on a fresh tab like everything else here since this
  // is a no-backend static site).
  const SOURCES_NAV = {
    label: "Sources",
    backLabel: "Back to menu",
    overview: { key: "sources-overview", label: "General Overview", icon: "bar-chart-2", href: "sources.html" },
    groups: [
      {
        key: "verticals",
        label: "Verticals",
        items: [
          { key: "sources-tutors", label: "Tutors", icon: "book-open", href: "sources-tutors.html" },
          { key: "sources-sport-coaches", label: "Sport Coaches and Trainers", icon: "dumbbell", href: "sources-sport-coaches.html" },
          { key: "sources-music-art", label: "Music and Art Instructors", icon: "palette", href: "sources-music-art.html" },
          { key: "sources-babysitters", label: "Baby Sitters and Nannies", icon: "baby", href: "sources-babysitters.html" },
          { key: "sources-home-therapists", label: "Home-Based Therapists", icon: "stethoscope", href: "sources-home-therapists.html" },
          { key: "sources-nurses", label: "Nurses", icon: "syringe", href: "sources-nurses.html" },
          { key: "sources-caregivers", label: "Caregivers", icon: "hand-heart", href: "sources-caregivers.html" },
          { key: "sources-beauty", label: "Beauty Services", icon: "scissors", href: "sources-beauty.html" },
          { key: "sources-pet", label: "Pet Services", icon: "paw-print", href: "sources-pet.html" },
        ],
      },
      {
        key: "sources",
        label: "Sources",
        items: [
          { key: "sources-facebook-groups", label: "Facebook Groups", icon: "facebook", href: "sources-facebook-groups.html" },
          { key: "sources-academies", label: "Academies & Institutions", icon: "building-2", href: "sources-academies.html" },
          { key: "sources-syndicates", label: "Syndicates", icon: "shield", href: "sources-syndicates.html" },
          { key: "sources-freelancer-platforms", label: "Freelancer Platforms", icon: "briefcase", href: "sources-freelancer-platforms.html" },
          { key: "sources-tutoring-centers", label: "Tutoring Centers", icon: "pencil", href: "sources-tutoring-centers.html" },
          { key: "sources-nursing-schools", label: "Nursing Schools/Programs", icon: "syringe", href: "sources-nursing-schools.html" },
        ],
      },
    ],
  };

  const GROUPS = [
    {
      title: "General",
      items: [
        { key: "overview", label: "General Overview", icon: "bar-chart-2", href: "overview.html" },
        { key: "leads", label: "Leads", icon: "target", href: "leads.html" },
        { key: "calls", label: "Calls", icon: "phone", href: "calls.html" },
        { key: "applied", label: "Applied", icon: "inbox", href: "applied.html" },
        { key: "bookings", label: "Bookings", icon: "calendar-check", href: "bookings.html" },
        { key: "sources", label: "Sources", icon: "building-2", href: "sources.html" },
        { key: "map", label: "Map", icon: "map", href: "map.html" },
        { key: "calendar", label: "Calendar", icon: "calendar", href: "calendar.html" },
      ],
    },
    {
      title: "AI",
      items: [{ key: "ai-assistant", label: "AI Assistant", icon: "sparkles", href: "ai-assistant.html" }],
    },
    {
      title: "Workspace",
      items: [
        { key: "team", label: "Team", icon: "users", href: "team.html" },
        { key: "profile", label: "Profile", icon: "circle-user", href: "profile.html" },
        { key: "chat", label: "General Chatroom", icon: "message-circle", href: "chat.html" },
        { key: "new-chat", label: "Create New Chatroom", icon: "message-square-plus", href: "new-chat.html" },
      ],
    },
    {
      title: "Settings",
      items: [
        { key: "settings", label: "Settings", icon: "settings", href: "settings.html" },
        { key: "help", label: "Help", icon: "help-circle", href: "help.html" },
        { key: "logout", label: "Logout", icon: "log-out", action: "logout" },
      ],
    },
  ];

  function initials(name, email) {
    const source = (name || email || "").trim();
    if (!source) return "?";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function buildNavItem(item, opts) {
    const el = document.createElement(item.action ? "button" : "a");
    el.className = "app-nav-item" + (item.key === opts.current ? " active" : "");
    if (!item.action) {
      el.href = `${opts.root}/dashboard/${item.href}`;
    } else {
      el.type = "button";
    }
    el.innerHTML = `<span class="app-nav-item-icon">${Icons.svg(item.icon, { size: 19 })}</span><span class="app-nav-item-label" data-i18n="${item.label}">${I18n.t(item.label)}</span>`;
    if (item.action === "logout") {
      el.addEventListener("click", () => {
        Auth.signOut();
        window.location.href = `${opts.root}/login.html`;
      });
    }
    return el;
  }

  function buildSidebar(opts) {
    const aside = document.createElement("aside");
    aside.className = "app-sidebar";
    aside.id = "appSidebar";

    const brand = document.createElement("div");
    brand.className = "app-sidebar-brand";
    brand.innerHTML = `
      <img src="${opts.root}/assets/images/logo-light.png" alt="Servi" id="appSidebarLogo" />
      <span class="app-sidebar-brand-text">Servi Dashboard</span>
      <button type="button" class="app-sidebar-toggle" id="appSidebarToggle" aria-label="Collapse menu">${Icons.svg("panel-left-close", { size: 18 })}</button>
    `;
    aside.appendChild(brand);

    // ---- sliding two-panel track: main groups | Sources sub-nav ----
    const viewport = document.createElement("div");
    viewport.className = "app-sidebar-viewport";
    const track = document.createElement("div");
    track.className = "app-sidebar-track";
    track.id = "appSidebarTrack";

    const mainPanel = document.createElement("div");
    mainPanel.className = "app-sidebar-panel app-sidebar-panel-main app-sidebar-groups";

    const isSourcesSection = typeof opts.current === "string" && opts.current.indexOf("sources") === 0;

    GROUPS.forEach((group) => {
      const groupEl = document.createElement("div");
      const title = document.createElement("div");
      title.className = "app-sidebar-group-title";
      title.setAttribute("data-i18n", group.title);
      title.textContent = I18n.t(group.title);
      groupEl.appendChild(title);

      const itemsEl = document.createElement("div");
      itemsEl.className = "app-sidebar-group-items";

      group.items.forEach((item) => {
        // The "Sources" link itself gets its active state from
        // isSourcesSection (any sources-* page), not a literal key match,
        // since the real `current` key is now the specific sub-page.
        const active = item.key === "sources" ? isSourcesSection : item.key === opts.current;
        const el = buildNavItem(Object.assign({}, item), opts);
        el.classList.toggle("active", active);
        itemsEl.appendChild(el);
      });

      groupEl.appendChild(itemsEl);
      mainPanel.appendChild(groupEl);
    });

    const sourcesPanel = document.createElement("div");
    sourcesPanel.className = "app-sidebar-panel app-sidebar-panel-sources app-sidebar-groups";
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "app-sidebar-back";
    backBtn.id = "appSidebarBack";
    backBtn.innerHTML = `${Icons.svg("chevron-left", { size: 16 })}<span>${SOURCES_NAV.backLabel}</span>`;
    sourcesPanel.appendChild(backBtn);

    const sourcesTitle = document.createElement("div");
    sourcesTitle.className = "app-sidebar-group-title";
    sourcesTitle.textContent = SOURCES_NAV.label;
    sourcesPanel.appendChild(sourcesTitle);

    // "General Overview" — standalone, un-collapsible, always visible.
    const overviewEl = buildNavItem(SOURCES_NAV.overview, opts);
    sourcesPanel.appendChild(overviewEl);

    // "Verticals" and "Sources" — each a collapsible group with its own
    // clickable header (label + chevron). Default state is expanded unless
    // this tab session already collapsed it (see wireInteractions).
    SOURCES_NAV.groups.forEach((group) => {
      const groupWrap = document.createElement("div");
      groupWrap.className = "app-sidebar-navgroup";
      groupWrap.dataset.groupKey = group.key;

      const header = document.createElement("button");
      header.type = "button";
      header.className = "app-sidebar-navgroup-header";
      header.innerHTML = `<span>${I18n.t(group.label)}</span><span class="app-sidebar-navgroup-chevron">${Icons.svg("chevron-down", { size: 15 })}</span>`;
      groupWrap.appendChild(header);

      const itemsEl = document.createElement("div");
      itemsEl.className = "app-sidebar-navgroup-items";
      group.items.forEach((item) => {
        const el = buildNavItem(item, opts);
        itemsEl.appendChild(el);
      });
      groupWrap.appendChild(itemsEl);

      sourcesPanel.appendChild(groupWrap);
    });

    track.appendChild(mainPanel);
    track.appendChild(sourcesPanel);
    // Land directly on the Sources panel (no visible slide) if the page
    // itself is a Sources page — the slide is for the transition INTO
    // this section from elsewhere, not every page load once you're in it.
    if (isSourcesSection) track.classList.add("show-sources", "no-anim");
    viewport.appendChild(track);
    aside.appendChild(viewport);

    return aside;
  }

  function buildTopbar(opts) {
    const header = document.createElement("header");
    header.className = "app-topbar";

    const account = Auth.getAccount() || {};
    const avatarInner = account.picture
      ? `<img src="${account.picture}" alt="" />`
      : initials(account.name, account.email);

    header.innerHTML = `
      <div class="app-topbar-left">
        <button type="button" class="app-icon-btn" id="appMobileMenuBtn" aria-label="Open menu">${Icons.svg("menu", { size: 19 })}</button>
      </div>
      <div class="app-topbar-right">
        <button type="button" class="app-icon-btn" title="Settings" id="appTopSettingsBtn">${Icons.svg("settings", { size: 19 })}</button>
        <div class="app-notif-wrap">
          <button type="button" class="app-icon-btn" title="Notifications" id="appTopBellBtn" aria-label="Notifications">
            ${Icons.svg("bell", { size: 19 })}<span class="app-badge-dot" id="appBellDot" hidden></span>
          </button>
          <div class="app-notif-panel" id="appNotifPanel" hidden></div>
        </div>
        <div class="app-profile-chip" id="appProfileChip" title="${account.email || ""}">
          <span class="app-profile-avatar">${avatarInner}</span>
          <span class="app-profile-text">
            <span class="app-profile-name">${account.name || "Signed in"}</span>
            <span class="app-profile-role">Team member</span>
          </span>
        </div>
      </div>
    `;
    return header;
  }

  function wireInteractions(opts) {
    const sidebar = document.getElementById("appSidebar");
    const collapseBtn = document.getElementById("appSidebarToggle");
    const mobileBtn = document.getElementById("appMobileMenuBtn");
    const settingsBtn = document.getElementById("appTopSettingsBtn");
    const bellBtn = document.getElementById("appTopBellBtn");
    const bellDot = document.getElementById("appBellDot");
    const notifPanel = document.getElementById("appNotifPanel");
    const track = document.getElementById("appSidebarTrack");
    const backBtn = document.getElementById("appSidebarBack");

    function isMobile() {
      return window.innerWidth <= 900;
    }

    // ---- Sources sub-nav: back arrow + "animate once per session" ----
    // The back arrow only slides the SIDEBAR back to the main menu — it
    // never navigates the page, so you can peek at the full menu while
    // still reading e.g. the Tutors page.
    if (backBtn) {
      backBtn.addEventListener("click", () => track.classList.remove("show-sources"));
    }
    if (track && track.classList.contains("show-sources")) {
      // Every page in this multi-page app rebuilds the sidebar from
      // scratch, so there's no DOM state to tell "just arrived here" from
      // "already browsing this section" apart — sessionStorage stands in
      // for that: play the slide once per browser tab session, then land
      // directly on the Sources panel for the rest of that session.
      let alreadyEntered = false;
      try {
        alreadyEntered = sessionStorage.getItem("srcSidebarEntered") === "1";
      } catch (e) {
        /* private browsing / storage blocked — just skip the one-time animation */
      }
      if (alreadyEntered) {
        track.classList.add("no-anim");
      } else {
        track.classList.add("no-anim");
        requestAnimationFrame(() => {
          track.classList.remove("show-sources", "no-anim");
          requestAnimationFrame(() => track.classList.add("show-sources"));
        });
        try {
          sessionStorage.setItem("srcSidebarEntered", "1");
        } catch (e) {
          /* ignore */
        }
      }
    } else {
      try {
        sessionStorage.removeItem("srcSidebarEntered");
      } catch (e) {
        /* ignore */
      }
    }

    // ---- Sources sub-nav: collapsible "Verticals" / "Sources" groups ----
    // Each group's open/closed state is kept in sessionStorage per group
    // key, same "per tab session" convention as the slide-in-once flag
    // above — collapsing "Verticals" while browsing keeps it collapsed as
    // you click between Sources sub-pages (each of which rebuilds this
    // sidebar from scratch), but resets on a fresh tab. Whichever group
    // contains the CURRENT page's active item always renders expanded
    // (regardless of stored state) so you're never left wondering where
    // you are in the menu.
    document.querySelectorAll(".app-sidebar-navgroup").forEach((groupWrap) => {
      const key = groupWrap.dataset.groupKey;
      const storageKey = `srcNavGroupCollapsed:${key}`;
      const hasActiveItem = !!groupWrap.querySelector(".app-nav-item.active");
      let storedCollapsed = false;
      try {
        storedCollapsed = sessionStorage.getItem(storageKey) === "1";
      } catch (e) {
        /* private browsing / storage blocked — default to expanded */
      }
      if (storedCollapsed && !hasActiveItem) {
        groupWrap.classList.add("collapsed");
      }
      const header = groupWrap.querySelector(".app-sidebar-navgroup-header");
      header.addEventListener("click", () => {
        const collapsed = groupWrap.classList.toggle("collapsed");
        try {
          sessionStorage.setItem(storageKey, collapsed ? "1" : "0");
        } catch (e) {
          /* ignore */
        }
      });
    });

    collapseBtn.addEventListener("click", () => {
      if (isMobile()) {
        sidebar.classList.remove("open");
        return;
      }
      const collapsed = sidebar.classList.toggle("collapsed");
      collapseBtn.innerHTML = Icons.svg(collapsed ? "panel-left" : "panel-left-close", { size: 18 });
    });

    if (mobileBtn) {
      // Visibility is handled purely by CSS (hidden by default, shown under
      // the 900px breakpoint) — see shell.css. Don't force it on here.
      mobileBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    }

    settingsBtn.addEventListener("click", () => {
      window.location.href = `${opts.root}/dashboard/settings.html`;
    });

    // ---- Notifications bell ----
    function renderNotifUI() {
      notifPanel.innerHTML = Notifications.renderPanel();
      const count = Notifications.unreadCount();
      bellDot.hidden = count === 0;
      notifPanel.querySelectorAll(".app-notif-item").forEach((btn) => {
        btn.addEventListener("click", () => Notifications.markRead(btn.dataset.id));
      });
      const markAllBtn = notifPanel.querySelector("#appMarkAllRead");
      if (markAllBtn) markAllBtn.addEventListener("click", () => Notifications.markAllRead());
    }

    Notifications.subscribe(renderNotifUI);
    renderNotifUI();

    bellBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = notifPanel.hidden;
      notifPanel.hidden = !willOpen;
      if (willOpen) {
        renderNotifUI();
        Notifications.clearToasts();
      }
    });

    document.addEventListener("click", (e) => {
      if (notifPanel.hidden) return;
      if (notifPanel.contains(e.target) || bellBtn.contains(e.target)) return;
      notifPanel.hidden = true;
    });

    document.addEventListener("click", (e) => {
      if (!isMobile()) return;
      if (!sidebar.classList.contains("open")) return;
      if (sidebar.contains(e.target) || (mobileBtn && mobileBtn.contains(e.target))) return;
      sidebar.classList.remove("open");
    });
  }

  function init(opts) {
    const options = Object.assign({ current: "", root: ".." }, opts || {});
    const pageBody = document.getElementById("pageBody");

    const shell = document.createElement("div");
    shell.className = "app-shell";

    const sidebar = buildSidebar(options);
    const main = document.createElement("div");
    main.className = "app-main";
    const topbar = buildTopbar(options);
    const content = document.createElement("main");
    content.className = "app-content";

    if (pageBody) {
      content.appendChild(pageBody);
      pageBody.hidden = false;
    }

    main.appendChild(topbar);
    main.appendChild(content);
    shell.appendChild(sidebar);
    shell.appendChild(main);

    document.body.innerHTML = "";
    document.body.appendChild(shell);

    wireInteractions(options);

    // Keep the sidebar logo matching the current theme, same convention
    // every other page in this project already follows.
    function updateLogo() {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const img = document.getElementById("appSidebarLogo");
      if (img) img.src = `${options.root}/assets/images/${isDark ? "logo-dark" : "logo-light"}.png`;
    }
    updateLogo();
    new MutationObserver(updateLogo).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Fires the "as soon as I log in" pop-ups for anything already waiting,
    // then keeps the (currently sample-data) live stream going. See
    // notifications.js for how this gets swapped for real data later.
    Notifications.init();

    // Translate the page: the shell/nav above is rendered with I18n.t()
    // inline for the correct text on first paint, AND carries data-i18n
    // markup (group titles + nav item labels) so a later I18n.apply() call
    // can re-translate it too — same as the page's own #pageBody content.
    // This also starts cross-tab sync so a language change made in Settings
    // on another tab re-translates this page immediately; Settings' own
    // language picker calls I18n.setLang() directly for the same-tab case
    // (native "storage" events don't fire in the tab that made the change).
    I18n.init();
  }

  return { init };
})();
