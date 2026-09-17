/* ============================================================
   SourceTypePage
   ------------------------------------------------------------
   Shared rendering engine for the 6 new "Sources > Sources" tabs —
   one per actual source type (Facebook Groups, Academies &
   Institutions, Syndicates, Freelancer Platforms, Tutoring Centers,
   Nursing Schools/Programs) — as opposed to the 9 existing "Sources >
   Verticals" tabs (sources-tutors.html etc.), which slice the same
   underlying source lists the other way (by vertical, across every
   source type). Pulled into one shared module instead of copy-pasted
   6 times so all 6 pages compute/label things identically and a fix
   only has to happen once.

   Every one of the 6 pages that uses this module embeds its own
   ENTITIES array (extracted from the real Excel exports, same
   "snapshot, not invented" status as TUTORS_ENTITIES in
   sources-tutors.html) plus a small config object, then calls
   SourceTypePage.init(config). See any sources-<type>.html for the
   exact shape.

   ACCURACY NOTE — read before changing kpi3/kpi4 on any page
   ------------------------------------------------------------
   Only Facebook Groups' source sheet tracks a real "Approved" status
   (and nothing anywhere tracks "posted a flier/ad on their page" —
   that action isn't logged in any sheet yet). For every other source
   type, and for that missing "posted" step even on Facebook Groups,
   the kpi3/kpi4 config below points at a clearly different, REAL,
   computed metric instead (e.g. "Fully Documented", "In Active
   Follow-Up", "Notes on File") rather than inventing an Approved/
   Posted number that doesn't exist in the data. Each page's config
   carries a `substitute: true` flag + tooltip explaining exactly
   that, and the KPI card itself is labeled with the substitute's own
   name — never mislabeled as literal "Approved"/"Posted".
   ============================================================ */

const SourceTypePage = (() => {
  const escapeHtml = SourcesData.escapeHtml;
  const VERTICALS = DataStore.VERTICALS; // [{key,label,icon}] x9

  function fmtNum(n) {
    return n == null ? "—" : Math.round(n).toLocaleString();
  }

  let CFG = null;
  const state = { filters: { verticals: [], contacted: [] }, sort: "nameAsc" };
  const tableState = { search: "", page: 1, pageSize: 25, records: [] };

  /* ---------------- header KPI row (5 cards) ---------------- */

  function computeHeader() {
    const rows = CFG.entities;
    const total = rows.length;
    const contacted = rows.filter((e) => e.contacted === true).length;
    const byVertical = {};
    VERTICALS.forEach((v) => (byVertical[v.label] = 0));
    rows.forEach((e) => (e.verticals || []).forEach((v) => { if (byVertical[v] != null) byVertical[v] += 1; }));
    const topVertical = VERTICALS.slice().sort((a, b) => byVertical[b.label] - byVertical[a.label])[0];
    return {
      total,
      contacted,
      byVertical,
      topVertical: topVertical.label,
      topVerticalIcon: topVertical.icon,
      topVerticalCount: byVertical[topVertical.label],
      kpi3Value: CFG.kpi3.compute(rows),
      kpi4Value: CFG.kpi4.compute(rows),
    };
  }

  // Card bodies show only the bold caption now (no always-visible sentence
  // underneath) — the full explanation still lives in the card's own
  // `title` tooltip. A substitute metric (no real "Approved"/"Posted" data
  // for this source type) gets a small "†" marker appended to its caption
  // instead of a separate paragraph elsewhere on the page — hover the card
  // for what it actually means. This replaced an always-visible sentence
  // per card plus a whole extra "Heads up" paragraph, both of which made
  // the page read as crowded per explicit feedback.
  function renderHeaderKpis() {
    const h = computeHeader();
    const contactedPct = h.total ? Math.round((h.contacted / h.total) * 100) : 0;
    const topShare = h.total ? Math.round((h.topVerticalCount / h.total) * 100) : 0;
    const noun = CFG.sourceType;

    const cards = [
      {
        tone: "leads", icon: CFG.icon, value: fmtNum(h.total), label: `Total ${noun}`,
        sub: `Every ${noun} source currently tracked.`,
      },
      {
        tone: "teal", icon: "phone-call", value: `${fmtNum(h.contacted)} / ${fmtNum(h.total)}`, label: "Contacted", big: true,
        sub: `${contactedPct}% logged as contacted — the rest are blank, not confirmed "no".`,
      },
      {
        tone: "indigo", icon: CFG.kpi3.icon || "check", value: fmtNum(h.kpi3Value), label: CFG.kpi3.label,
        sub: CFG.kpi3.tooltip, substitute: CFG.kpi3.substitute,
      },
      {
        tone: "calls", icon: CFG.kpi4.icon || "clock", value: fmtNum(h.kpi4Value), label: CFG.kpi4.label,
        sub: CFG.kpi4.tooltip, substitute: CFG.kpi4.substitute,
      },
      {
        tone: "applied", icon: "crown", value: h.topVertical, label: "Top vertical here", big: true,
        sub: `${fmtNum(h.topVerticalCount)} of ${fmtNum(h.total)} (${topShare}%) come from ${h.topVertical} — more than any other vertical here.`,
      },
    ];

    document.getElementById("srcKpiRow").innerHTML = cards
      .map(
        (c) => `
      <div class="ov-kpi-card tone-${c.tone}" title="${escapeHtml(c.label)}: ${escapeHtml(c.sub)}">
        <div class="ov-kpi-top"><div class="ov-kpi-icon">${Icons.svg(c.icon, { size: 18 })}</div></div>
        <div class="ov-kpi-value${c.big ? " kpi-value-text" : ""}">${escapeHtml(c.value)}</div>
        <div class="ov-kpi-label">${escapeHtml(c.label.toUpperCase())}${c.substitute ? ' <span class="src-kpi-substitute-mark" title="Stands in for a real ‘Approved’/‘Posted’ status this source type doesn’t track yet — see this card’s tooltip.">†</span>' : ""}</div>
      </div>`
      )
      .join("");
  }

  /* ---------------- 3x3 big vertical coverage boxes ---------------- */

  function computeVBoxes() {
    const rows = CFG.entities;
    const raw = VERTICALS.map((v) => {
      const list = rows.filter((e) => (e.verticals || []).includes(v.label));
      const contacted = list.filter((e) => e.contacted === true).length;
      const notContacted = list.length - contacted;
      const pct = list.length ? Math.round((contacted / list.length) * 100) : 0;
      const extraValue = CFG.vboxExtra.compute(list);
      return { label: v.label, icon: v.icon, count: list.length, contacted, notContacted, pct, extraValue };
    });
    // Coverage tiers, ranked within this one source type's own 9-vertical
    // spread (bottom 3 = focus, middle 3 = moderate, top 3 = strong) — same
    // tiering language as SourcesData.computeCoverageTiers, computed fresh
    // here since that helper ranks across ALL specific-source ENTITIES
    // combined, not one source type in isolation.
    const ranked = raw.slice().sort((a, b) => a.count - b.count);
    ranked.forEach((r, i) => {
      r.tier = i < 3 ? "focus" : i < 6 ? "moderate" : "strong";
    });
    return raw;
  }

  function renderVBoxes() {
    const boxes = computeVBoxes();
    document.getElementById("srcVboxGrid").innerHTML = boxes
      .map(
        (b) => `
      <div class="src-vbox src-tone-${b.tier}">
        <div class="src-vbox-head">
          <div class="src-vbox-icon">${Icons.svg(b.icon, { size: 17 })}</div>
          <div class="src-vbox-headtext">
            <div class="src-vbox-label">${escapeHtml(b.label)}</div>
            <span class="src-coverage-pill" title="${escapeHtml(SourcesData.TIER_EXPLAINER[b.tier] || "")}">${SourcesData.TIER_LABEL[b.tier]}</span>
          </div>
        </div>
        <div class="src-vbox-count-row">
          <span class="src-vbox-count">${fmtNum(b.count)}</span>
          <span class="src-vbox-count-label">${escapeHtml(CFG.sourceType)}</span>
        </div>
        <div class="src-vbox-stats">
          <div class="src-vbox-stat">
            <div class="src-vbox-stat-value tone-good">${fmtNum(b.contacted)}</div>
            <div class="src-vbox-stat-label">Contacted</div>
          </div>
          <div class="src-vbox-stat">
            <div class="src-vbox-stat-value tone-bad">${fmtNum(b.notContacted)}</div>
            <div class="src-vbox-stat-label">Not contacted</div>
          </div>
          <div class="src-vbox-stat">
            <div class="src-vbox-stat-value">${b.count ? b.pct + "%" : "—"}</div>
            <div class="src-vbox-stat-label">% contacted</div>
          </div>
        </div>
        <div class="src-vbox-extra">
          <span class="src-vbox-extra-label">${escapeHtml(CFG.vboxExtra.label)}</span>
          <span class="src-vbox-extra-value">${CFG.vboxExtra.format ? CFG.vboxExtra.format(b.extraValue) : fmtNum(b.extraValue)}</span>
        </div>
      </div>`
      )
      .join("");
  }

  /* ---------------- visual statistics (side column) ---------------- */

  function renderChart() {
    const h = computeHeader();
    const points = VERTICALS.map((v) => ({ label: v.label, count: h.byVertical[v.label] }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count);
    const container = document.getElementById("srcChart");
    if (!points.length) {
      container.innerHTML = `<p class="chart-empty">No ${escapeHtml(CFG.sourceType)} sources tagged to a vertical yet.</p>`;
      return;
    }
    // Wider label gutter than the chart's own 70px default — these are full
    // vertical names ("Sport Coaches and Trainers" etc.), not short date
    // labels — still capped/truncated by hBarChart itself with a hover
    // tooltip for the full name, so nothing runs past the card's edge.
    Chart.hBarChart(container, points, { tone: "primary", maxRows: 9, labelWidth: 124 });
  }

  /* ---------------- AI insights (rule-based, from real numbers) ---------------- */

  function renderInsights() {
    const h = computeHeader();
    const boxes = computeVBoxes();
    const insights = [];
    const noun = CFG.sourceType;

    const notContactedTotal = h.total - h.contacted;
    insights.push({
      tone: notContactedTotal > h.contacted ? "amber" : "green",
      icon: "phone-call",
      html: `${fmtNum(h.contacted)} of ${fmtNum(h.total)} ${escapeHtml(noun)} sources (${h.total ? Math.round((h.contacted / h.total) * 100) : 0}%) have been contacted so far — ${fmtNum(notContactedTotal)} are still untouched.`,
    });

    insights.push({
      tone: "red",
      icon: "target",
      html: `<strong>${escapeHtml(h.topVertical)}</strong> is the biggest vertical inside ${escapeHtml(noun)}, with ${fmtNum(h.topVerticalCount)} sources (${h.total ? Math.round((h.topVerticalCount / h.total) * 100) : 0}%) — the single best place to focus outreach in this source type.`,
    });

    const focusBox = boxes.filter((b) => b.tier === "focus" && b.count > 0).sort((a, b) => a.count - b.count)[0];
    if (focusBox) {
      insights.push({
        tone: "amber",
        icon: "gauge",
        html: `<strong>${escapeHtml(focusBox.label)}</strong> has the fewest ${escapeHtml(noun)} sources of any vertical here (${fmtNum(focusBox.count)}) — worth scouting a few more if this vertical matters to the business.`,
      });
    }

    insights.push({
      tone: "green",
      icon: CFG.kpi3.icon || "check",
      html: `${fmtNum(h.kpi3Value)} of ${fmtNum(h.total)} ${escapeHtml(noun)} sources count as "${escapeHtml(CFG.kpi3.label)}" — ${escapeHtml(CFG.kpi3.tooltip)}`,
    });

    document.getElementById("srcInsights").innerHTML = insights
      .slice(0, 4)
      .map((i) => `<div class="ov-insight-row ov-insight-tone-${i.tone}"><span class="ov-insight-icon">${Icons.svg(i.icon, { size: 15 })}</span><span class="ov-insight-text">${i.html}</span></div>`)
      .join("");
  }

  /* ---------------- filters ---------------- */

  function filteredEntities() {
    const { verticals, contacted } = state.filters;
    return CFG.entities.filter((e) => {
      if (verticals.length && !(e.verticals || []).some((v) => verticals.includes(v))) return false;
      if (contacted.length) {
        const isContacted = e.contacted === true;
        if (contacted.includes("yes") && !contacted.includes("no") && !isContacted) return false;
        if (contacted.includes("no") && !contacted.includes("yes") && isContacted) return false;
      }
      return true;
    });
  }

  function initFilters() {
    const verticalMs = MultiSelect.attach(document.getElementById("srcVerticalMs"), {
      getOptions: () => VERTICALS.map((v) => ({ value: v.label, label: v.label })),
      getSelected: () => state.filters.verticals,
      onApply: (values) => { state.filters.verticals = values; renderTableFromFilters(); },
      placeholder: "All",
    });
    const contactedMs = MultiSelect.attach(document.getElementById("srcContactedMs"), {
      getOptions: () => [
        { value: "yes", label: "Contacted" },
        { value: "no", label: "Not contacted" },
      ],
      getSelected: () => state.filters.contacted,
      onApply: (values) => { state.filters.contacted = values; renderTableFromFilters(); },
      placeholder: "All",
    });
    document.getElementById("srcSortSelect").addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderTableFromFilters();
    });
    document.getElementById("srcClearFiltersBtn").addEventListener("click", () => {
      state.filters = { verticals: [], contacted: [] };
      state.sort = CFG.sortDefault;
      document.getElementById("srcSortSelect").value = CFG.sortDefault;
      [verticalMs, contactedMs].forEach((ms) => ms.updateLabel());
      renderTableFromFilters();
    });
  }

  function renderTableFromFilters() {
    renderTable(filteredEntities());
  }

  /* ---------------- table — searchable + sortable + paginated ---------------- */

  function sortComparator(a, b) {
    switch (state.sort) {
      case "nameAsc":
        return a.name.localeCompare(b.name);
      case "contactedFirst":
        return (b.contacted === true) - (a.contacted === true) || a.name.localeCompare(b.name);
      case "notContactedFirst":
        return (a.contacted === true) - (b.contacted === true) || a.name.localeCompare(b.name);
      case "followersDesc":
        return (b.followers || 0) - (a.followers || 0);
      default:
        return a.name.localeCompare(b.name);
    }
  }

  // Several source sheets put a real URL in the "Links" column, but others
  // put a plain page name/handle instead — only treat it as clickable when
  // it actually looks like a bare domain/URL (same guard as
  // sources-tutors.html's isLikelyUrl).
  function isLikelyUrl(s) {
    if (!s) return false;
    const t = s.trim();
    if (!t || /\s/.test(t)) return false;
    return /^https?:\/\//i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t);
  }

  function wireTable() {
    document.getElementById("srcTableSearch").addEventListener("input", (e) => {
      tableState.search = e.target.value.trim().toLowerCase();
      tableState.page = 1;
      renderTableBody();
    });
    document.getElementById("srcTable").querySelector("thead").addEventListener("click", (e) => {
      const th = e.target.closest("th[data-sort]");
      if (!th) return;
      const map = { name: "nameAsc", followers: "followersDesc", contacted: "contactedFirst" };
      state.sort = map[th.dataset.sort] || "nameAsc";
      document.getElementById("srcSortSelect").value = state.sort;
      renderTableBody();
    });
  }

  function renderTable(records) {
    tableState.records = records;
    tableState.page = 1;
    renderTableBody();
  }

  function renderTableBody() {
    const { search, pageSize } = tableState;
    let rows = tableState.records;

    if (search) {
      rows = rows.filter((r) => [r.name, r.adminName, r.phone, r.email, (r.verticals || []).join(" ")].join(" ").toLowerCase().includes(search));
    }
    rows = rows.slice().sort(sortComparator);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    tableState.page = Math.min(tableState.page, totalPages);
    const start = (tableState.page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    document.getElementById("srcTableHint").textContent = `${rows.length.toLocaleString()} ${CFG.sourceType} source${rows.length === 1 ? "" : "s"} matching current filters`;

    document.getElementById("srcTableBody").innerHTML = pageRows
      .map((r) => {
        const contactedPill = r.contacted === true
          ? `<span class="leads-table-status-pill applied">Contacted</span>`
          : `<span class="leads-table-status-pill notApplied">Not contacted</span>`;
        const noteBits = [];
        if (isLikelyUrl(r.link)) {
          const href = /^https?:\/\//i.test(r.link.trim()) ? r.link.trim() : "https://" + r.link.trim();
          noteBits.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener" title="Open link">${Icons.svg("arrow-up-right", { size: 13 })}</a>`);
        }
        const noteText = r.status || r.notes || "";
        const verticalsText = (r.verticals || []).join(", ") || "—";
        const followersCell = CFG.hasReach ? `<td>${r.followers ? fmtNum(r.followers) : "—"}</td>` : "";
        return `
        <tr>
          <td>${escapeHtml(r.name)}</td>
          <td class="tut-notes-cell" title="${escapeHtml(verticalsText)}">${escapeHtml(verticalsText)}</td>
          ${followersCell}
          <td>${escapeHtml(r.adminName) || "—"}</td>
          <td>${escapeHtml(r.phone) || "—"}</td>
          <td>${contactedPill}</td>
          <td class="tut-notes-cell" title="${escapeHtml(noteText)}">${noteBits.join(" ")} ${noteText ? escapeHtml(noteText.length > 40 ? noteText.slice(0, 40) + "…" : noteText) : (noteBits.length ? "" : "—")}</td>
        </tr>`;
      })
      .join("");

    const pag = document.getElementById("srcTablePagination");
    if (totalPages <= 1) {
      pag.innerHTML = "";
    } else {
      pag.innerHTML = `
        <button type="button" id="srcTablePrev" ${tableState.page <= 1 ? "disabled" : ""}>Prev</button>
        <span>Page ${tableState.page} of ${totalPages}</span>
        <button type="button" id="srcTableNext" ${tableState.page >= totalPages ? "disabled" : ""}>Next</button>`;
      document.getElementById("srcTablePrev")?.addEventListener("click", () => { tableState.page--; renderTableBody(); });
      document.getElementById("srcTableNext")?.addEventListener("click", () => { tableState.page++; renderTableBody(); });
    }
  }

  /* ---------------- bootstrap ---------------- */

  function init(config) {
    CFG = config;
    state.sort = config.sortDefault || "nameAsc";

    if (!config.hasReach) {
      // No follower/reach data for this source type — hide the Followers
      // column instead of showing an all-dash column.
      document.querySelectorAll(".src-followers-col").forEach((el) => el.remove());
    }
    document.getElementById("srcSortSelect").value = state.sort;

    document.getElementById("srcNoticeIcon").innerHTML = Icons.svg("gauge", { size: 16 });
    document.getElementById("srcSearchIcon").innerHTML = Icons.svg("search", { size: 15 });

    renderHeaderKpis();
    renderVBoxes();
    renderChart();
    renderInsights();
    initFilters();
    wireTable();
    renderTableFromFilters();
  }

  return { init };
})();
