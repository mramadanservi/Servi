/* ============================================================
   DateRangePicker
   ------------------------------------------------------------
   A small, reusable "from x to y" custom date-range popover —
   two-month calendar view, click a start day then an end day to
   select the range, Clear/Cancel/Apply — used alongside the
   existing Today/Yesterday/This Week/This Month preset buttons on
   Leads, Calls, and Applied. One shared module (loaded once via
   shell.js on every page, like Theme/Icons/Notifications) so all
   three pages get the exact same widget rather than three
   hand-rolled copies.

   Usage:
     const picker = DateRangePicker.attach(triggerButtonEl, {
       getInitial: () => ({ start: myFilters.customStart, end: myFilters.customEnd }),
       onApply: (start, end) => { ... mark the trigger active, refilter ... },
       onClear: () => { ... clear back to no custom range ... },
     });
   Only one instance's popover is ever open at a time page-wide.
   ============================================================ */

const DateRangePicker = (() => {
  let openInstance = null;

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function sameDay(a, b) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function fmtShort(d) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function monthLabel(d) {
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  // Monday-first 6-week grid covering the given month, including the
  // trailing/leading days of the adjacent months (shown dimmed) so every
  // week row is a full 7 days.
  function buildMonthGrid(year, month) {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday = 0
    const cursor = new Date(year, month, 1 - startDow);
    const weeks = [];
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        week.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  function attach(triggerEl, opts) {
    opts = opts || {};
    let state = { anchorMonth: new Date(), rangeStart: null, rangeEnd: null };
    let popoverEl = null;

    function onDocMouseDown(e) {
      if (popoverEl && !popoverEl.contains(e.target) && e.target !== triggerEl && !triggerEl.contains(e.target)) {
        close();
      }
    }

    function close() {
      if (popoverEl) {
        popoverEl.remove();
        popoverEl = null;
      }
      document.removeEventListener("mousedown", onDocMouseDown, true);
      if (openInstance === api) openInstance = null;
    }

    function inRange(d) {
      if (!state.rangeStart) return false;
      const end = state.rangeEnd || state.rangeStart;
      const a = state.rangeStart <= end ? state.rangeStart : end;
      const b = state.rangeStart <= end ? end : state.rangeStart;
      return d >= startOfDay(a) && d <= startOfDay(b);
    }

    function dayClick(d) {
      if (!state.rangeStart || state.rangeEnd) {
        state.rangeStart = d;
        state.rangeEnd = null;
      } else if (d < state.rangeStart) {
        state.rangeEnd = state.rangeStart;
        state.rangeStart = d;
      } else {
        state.rangeEnd = d;
      }
      render();
    }

    function renderMonth(monthDate) {
      const weeks = buildMonthGrid(monthDate.getFullYear(), monthDate.getMonth());
      return `
        <div class="drp-month">
          <div class="drp-month-label">${monthLabel(monthDate)}</div>
          <div class="drp-dow">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span>${d}</span>`).join("")}</div>
          <div class="drp-grid">
            ${weeks
              .map((week) =>
                week
                  .map(({ date, inMonth }) => {
                    const isStart = sameDay(date, state.rangeStart);
                    const isEnd = sameDay(date, state.rangeEnd);
                    const selected = isStart || isEnd;
                    const within = !selected && inRange(date);
                    const cls = ["drp-day", !inMonth && "drp-outmonth", selected && "drp-selected", within && "drp-inrange"].filter(Boolean).join(" ");
                    return `<button type="button" class="${cls}" data-date="${date.toISOString()}">${date.getDate()}</button>`;
                  })
                  .join("")
              )
              .join("")}
          </div>
        </div>`;
    }

    function render() {
      if (!popoverEl) return;
      const nextMonth = new Date(state.anchorMonth.getFullYear(), state.anchorMonth.getMonth() + 1, 1);
      popoverEl.innerHTML = `
        <div class="drp-header">
          <button type="button" class="drp-nav" data-nav="-1" aria-label="Previous month">${Icons.svg("chevron-left", { size: 16 })}</button>
          <div class="drp-summary">${state.rangeStart ? fmtShort(state.rangeStart) : "Start date"} <span class="drp-arrow">&rarr;</span> ${state.rangeEnd ? fmtShort(state.rangeEnd) : "End date"}</div>
          <button type="button" class="drp-nav" data-nav="1" aria-label="Next month">${Icons.svg("chevron-right", { size: 16 })}</button>
        </div>
        <div class="drp-months">
          ${renderMonth(state.anchorMonth)}
          ${renderMonth(nextMonth)}
        </div>
        <div class="drp-actions">
          <button type="button" class="drp-btn drp-clear">Clear</button>
          <div class="drp-actions-right">
            <button type="button" class="drp-btn drp-cancel">Cancel</button>
            <button type="button" class="drp-btn drp-btn-primary drp-apply">Apply</button>
          </div>
        </div>`;

      popoverEl.querySelectorAll(".drp-day").forEach((btn) => {
        btn.addEventListener("click", () => dayClick(new Date(btn.dataset.date)));
      });
      popoverEl.querySelectorAll(".drp-nav").forEach((btn) => {
        btn.addEventListener("click", () => {
          const dir = Number(btn.dataset.nav);
          state.anchorMonth = new Date(state.anchorMonth.getFullYear(), state.anchorMonth.getMonth() + dir, 1);
          render();
        });
      });
      popoverEl.querySelector(".drp-clear").addEventListener("click", () => {
        state.rangeStart = null;
        state.rangeEnd = null;
        render();
      });
      popoverEl.querySelector(".drp-cancel").addEventListener("click", close);
      popoverEl.querySelector(".drp-apply").addEventListener("click", () => {
        if (state.rangeStart) {
          const start = startOfDay(state.rangeStart);
          const end = startOfDay(state.rangeEnd || state.rangeStart);
          opts.onApply && opts.onApply(start, end);
        } else if (opts.onClear) {
          opts.onClear();
        }
        close();
      });
    }

    function positionPopover() {
      const rect = triggerEl.getBoundingClientRect();
      const width = window.innerWidth < 620 ? Math.min(320, window.innerWidth - 24) : 560;
      popoverEl.style.width = `${width}px`;
      popoverEl.style.top = `${rect.bottom + 8}px`;
      let left = rect.left;
      const maxLeft = window.innerWidth - width - 12;
      if (left > maxLeft) left = Math.max(12, maxLeft);
      popoverEl.style.left = `${left}px`;
    }

    function open() {
      if (openInstance && openInstance !== api) openInstance.close();
      const initial = (opts.getInitial && opts.getInitial()) || {};
      state = {
        anchorMonth: initial.start ? new Date(initial.start) : new Date(),
        rangeStart: initial.start || null,
        rangeEnd: initial.end || null,
      };
      popoverEl = document.createElement("div");
      popoverEl.className = `drp-popover${window.innerWidth < 620 ? " drp-narrow" : ""}`;
      document.body.appendChild(popoverEl);
      positionPopover();
      render();
      setTimeout(() => document.addEventListener("mousedown", onDocMouseDown, true), 0);
      openInstance = api;
    }

    triggerEl.addEventListener("click", () => {
      if (popoverEl) close();
      else open();
    });

    const api = {
      open,
      close,
      get isOpen() {
        return !!popoverEl;
      },
    };
    return api;
  }

  return { attach };
})();
