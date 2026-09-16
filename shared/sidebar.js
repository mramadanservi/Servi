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

    const groupsWrap = document.createElement("div");
    groupsWrap.className = "app-sidebar-groups";

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
        itemsEl.appendChild(el);
      });

      groupEl.appendChild(itemsEl);
      groupsWrap.appendChild(groupEl);
    });

    aside.appendChild(groupsWrap);
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

    function isMobile() {
      return window.innerWidth <= 900;
    }

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
