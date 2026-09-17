/* ============================================================
   MultiSelect
   ------------------------------------------------------------
   A small, reusable checkbox-list popover for "pick any number of
   these" filters (District, Area, Vertical, Specialty, Gender,
   Added By, ...) — used on Leads and Applied wherever a single
   <select> used to be. Same architecture as shared/dateRangePicker.js
   (module-level openInstance so only one popover is ever open
   page-wide, popover positioned under the trigger with
   getBoundingClientRect(), outside-click-close deferred with
   setTimeout(...,0), Clear/Cancel/Apply footer) so it feels like the
   same widget family rather than a one-off.

   Usage:
     const ms = MultiSelect.attach(triggerButtonEl, {
       getOptions: () => [{ value: "Beirut", label: "Beirut" }, ...],
       getSelected: () => myFilters.district, // array of currently-applied values
       onApply: (values) => { myFilters.district = values; refilter(); },
       placeholder: "All", // trigger text when nothing is selected
     });
     // Call ms.updateLabel() any time the selection changes from
     // outside (e.g. a page's "Clear filters" button).
   ============================================================ */

const MultiSelect = (() => {
  let openInstance = null;

  function attach(triggerEl, opts) {
    opts = opts || {};
    const placeholder = opts.placeholder || "All";
    let popoverEl = null;
    let pending = []; // working selection while the popover is open
    let search = "";

    // The trigger is a plain <button> — give it the "text + chevron"
    // markup once, then only the text span is touched afterward.
    triggerEl.classList.add("ms-trigger-btn");
    triggerEl.innerHTML = `<span class="ms-trigger-text"></span><span class="ms-chevron">${typeof Icons !== "undefined" ? Icons.svg("chevron-down", { size: 13 }) : ""}</span>`;
    const textEl = triggerEl.querySelector(".ms-trigger-text");

    function selectedValues() {
      return (opts.getSelected && opts.getSelected()) || [];
    }

    function allOptions() {
      return (opts.getOptions && opts.getOptions()) || [];
    }

    function labelText() {
      const all = allOptions();
      const sel = selectedValues();
      if (!sel.length) return placeholder;
      if (all.length && sel.length === all.length) return "All";
      if (sel.length === 1) {
        const found = all.find((o) => o.value === sel[0]);
        return found ? found.label : sel[0];
      }
      return `${sel.length} selected`;
    }

    function updateLabel() {
      textEl.textContent = labelText();
      const wrap = triggerEl.closest(".leads-select-wrap");
      if (wrap) wrap.classList.toggle("ms-active", selectedValues().length > 0);
    }

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
      triggerEl.classList.remove("ms-trigger-open");
      if (openInstance === api) openInstance = null;
    }

    function filteredOptions() {
      const all = allOptions();
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter((o) => o.label.toLowerCase().includes(q));
    }

    function render() {
      if (!popoverEl) return;
      const all = allOptions();
      const visible = filteredOptions();
      const allSelected = all.length > 0 && pending.length === all.length;

      popoverEl.innerHTML = `
        <div class="ms-search">
          <input type="text" placeholder="Search…" value="${search.replace(/"/g, "&quot;")}" />
        </div>
        <label class="ms-option ms-select-all">
          <input type="checkbox" ${allSelected ? "checked" : ""} />
          <span class="ms-option-label">Select all</span>
        </label>
        <div class="ms-list">
          ${
            visible.length
              ? visible
                  .map((o) => {
                    const checked = pending.includes(o.value);
                    return `
                <label class="ms-option">
                  <input type="checkbox" data-value="${o.value.replace(/"/g, "&quot;")}" ${checked ? "checked" : ""} />
                  <span class="ms-option-label" title="${o.label.replace(/"/g, "&quot;")}">${o.label}</span>
                </label>`;
                  })
                  .join("")
              : `<div class="ms-empty">No matches</div>`
          }
        </div>
        <div class="ms-actions">
          <button type="button" class="drp-btn ms-clear">Clear</button>
          <div class="ms-actions-right">
            <button type="button" class="drp-btn ms-cancel">Cancel</button>
            <button type="button" class="drp-btn drp-btn-primary ms-apply">Apply</button>
          </div>
        </div>`;

      popoverEl.querySelector(".ms-search input").addEventListener("input", (e) => {
        search = e.target.value;
        render();
        popoverEl.querySelector(".ms-search input").focus();
        const v = popoverEl.querySelector(".ms-search input");
        v.selectionStart = v.selectionEnd = v.value.length;
      });

      popoverEl.querySelector(".ms-select-all input").addEventListener("change", (e) => {
        pending = e.target.checked ? all.map((o) => o.value) : [];
        render();
      });

      popoverEl.querySelectorAll(".ms-list input[type=checkbox]").forEach((cb) => {
        cb.addEventListener("change", () => {
          const v = cb.dataset.value;
          if (cb.checked) {
            if (!pending.includes(v)) pending.push(v);
          } else {
            pending = pending.filter((x) => x !== v);
          }
          render();
        });
      });

      popoverEl.querySelector(".ms-clear").addEventListener("click", () => {
        pending = [];
        render();
      });
      popoverEl.querySelector(".ms-cancel").addEventListener("click", close);
      popoverEl.querySelector(".ms-apply").addEventListener("click", () => {
        opts.onApply && opts.onApply(pending.slice());
        updateLabel();
        close();
      });
    }

    // Called AFTER render() (see open() below) so popoverEl already has its
    // real rendered height — needed to clamp it to the viewport vertically,
    // not just horizontally, since a filter bar can sit anywhere on the
    // page (e.g. Applied's filter row, where the popover would otherwise
    // render partly below the fold on a short window).
    function positionPopover() {
      const rect = triggerEl.getBoundingClientRect();
      const width = window.innerWidth < 420 ? Math.min(260, window.innerWidth - 24) : 260;
      popoverEl.style.width = `${width}px`;
      const height = popoverEl.getBoundingClientRect().height || 360;

      let top = rect.bottom + 8;
      const maxTop = window.innerHeight - height - 12;
      if (top > maxTop) {
        // Not enough room below — flip to above the trigger, clamped so it
        // never renders above the top edge either.
        top = Math.max(12, rect.top - height - 8);
      }
      popoverEl.style.top = `${top}px`;

      let left = rect.left;
      const maxLeft = window.innerWidth - width - 12;
      if (left > maxLeft) left = Math.max(12, maxLeft);
      popoverEl.style.left = `${left}px`;
    }

    function open() {
      if (openInstance && openInstance !== api) openInstance.close();
      pending = selectedValues().slice();
      search = "";
      popoverEl = document.createElement("div");
      popoverEl.className = "ms-popover";
      document.body.appendChild(popoverEl);
      render();
      positionPopover();
      triggerEl.classList.add("ms-trigger-open");
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
      updateLabel,
      get isOpen() {
        return !!popoverEl;
      },
    };

    updateLabel();
    return api;
  }

  return { attach };
})();
