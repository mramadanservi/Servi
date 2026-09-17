/* ============================================================
   TimelineSlider
   ------------------------------------------------------------
   A draggable range control that pans a fixed-size window (e.g. 30
   days) across a record set's full history, instead of a chart only
   ever showing "the last N days ending today" — used under the
   Calls Over Time (calls.html) and Applied Over Time (applied.html)
   charts, per the request to "move across timelines, not just see
   from Aug 19 to Sep 16."

   Reads right-to-left, like the chart above it: the "Today" endpoint
   sits on the RIGHT, the earliest date on the LEFT, and the range
   input itself is visually mirrored (min/"today" pinned to the right,
   max/earliest to the left — see shell.css's `.ts-range { direction:
   rtl }`) so dragging left moves further back in time. That's a
   deliberate fix for an earlier version where the slider's own drag
   direction (a plain left-to-right input, min-at-left) didn't match
   the "today"/earliest endpoint captions beneath it, which already
   read left-to-right oldest→today — the two were pointing opposite
   ways. Flipping the input's direction, rather than the captions, is
   what makes them agree.

   Purely a UI control: it doesn't touch DataStore or any page's
   records directly. Dragging turns a days-back-from-today position
   into an `endAnchor` Date and hands it to onChange, which each page
   feeds straight into DataStore.timeSeries(...)'s / its local
   appliedTimeSeries(...)'s `endAnchor` parameter to re-render the
   chart with the shifted window.

   Usage:
     const slider = TimelineSlider.attach(containerEl, {
       getEarliestDate: () => earliest dateContacted/submittedAt across
                              ALL records (unfiltered, so the slider's
                              range doesn't jump around as filters
                              change),
       windowDays: 30,
       onChange: (endAnchor) => { ... re-render the chart ... },

       // Optional — lets a page's own Custom Range date filter take
       // over the timeline instead of the drag slider (see calls.html/
       // applied.html's wireChartTimeline()):
       isLocked: () => boolean,     // true while a Custom Range is applied
       lockedLabel: () => string,   // text shown in place of the drag range, e.g. "Mar 1 – Mar 27, 2026"
       onUnlock: () => { ... },     // called when "Jump to today" is clicked while locked — clear the page's custom range filter here
     });
     slider.reset();   // jump back to "today" (e.g. after Clear filters)
     slider.refresh(); // re-read getEarliestDate() / isLocked() (e.g. after a data Refresh or a filter change)
   ============================================================ */

const TimelineSlider = (() => {
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function fmtShort(d) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function fmtShortYear(d) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function attach(containerEl, opts) {
    opts = opts || {};
    const windowDays = opts.windowDays || 30;
    let daysBack = 0; // 0 = window ends today; grows as the user drags into history

    function maxDaysBack() {
      const earliest = opts.getEarliestDate && opts.getEarliestDate();
      if (!earliest) return 0;
      const today = startOfDay(new Date());
      const days = Math.floor((today - startOfDay(earliest)) / 86400000);
      return Math.max(0, days);
    }

    function endAnchor() {
      return addDays(startOfDay(new Date()), -daysBack);
    }

    function rangeLabel() {
      const end = endAnchor();
      const start = addDays(end, -(windowDays - 1));
      return `${fmtShort(start)} – ${fmtShort(end)}`;
    }

    function render() {
      const locked = !!(opts.isLocked && opts.isLocked());

      if (locked) {
        containerEl.innerHTML = `
          <div class="ts-wrap ts-locked">
            <div class="ts-row">
              <span class="ts-range-label">${opts.lockedLabel ? opts.lockedLabel() : rangeLabel()}</span>
              <button type="button" class="ts-today-btn">Jump to today</button>
            </div>
            <div class="ts-locked-hint">Showing your Custom Range filter &mdash; drag is off while a custom range is applied</div>
          </div>`;
        containerEl.querySelector(".ts-today-btn").addEventListener("click", () => {
          daysBack = 0;
          opts.onUnlock && opts.onUnlock();
          render();
          opts.onChange && opts.onChange(endAnchor());
        });
        return;
      }

      const max = maxDaysBack();
      const disabled = max <= 0;
      daysBack = Math.min(daysBack, max);
      const today = startOfDay(new Date());

      containerEl.innerHTML = `
        <div class="ts-wrap${disabled ? " ts-disabled" : ""}">
          <div class="ts-row">
            <span class="ts-range-label">${rangeLabel()}</span>
            <button type="button" class="ts-today-btn" ${daysBack === 0 ? "disabled" : ""}>Jump to today</button>
          </div>
          <input type="range" class="ts-range" min="0" max="${max}" step="1" value="${daysBack}" ${disabled ? "disabled" : ""} />
          <div class="ts-endpoints">
            <span>${max > 0 ? fmtShortYear(addDays(today, -max)) : ""}</span>
            <span>Today</span>
          </div>
        </div>`;

      if (disabled) return;

      const input = containerEl.querySelector(".ts-range");
      const label = containerEl.querySelector(".ts-range-label");
      const todayBtn = containerEl.querySelector(".ts-today-btn");

      input.addEventListener("input", (e) => {
        daysBack = Number(e.target.value);
        label.textContent = rangeLabel();
        todayBtn.disabled = daysBack === 0;
        opts.onChange && opts.onChange(endAnchor());
      });
      todayBtn.addEventListener("click", () => {
        if (daysBack === 0) return;
        daysBack = 0;
        render();
        opts.onChange && opts.onChange(endAnchor());
      });
    }

    function reset() {
      daysBack = 0;
      render();
      opts.onChange && opts.onChange(endAnchor());
    }

    render();

    return {
      reset,
      refresh: render,
      get endAnchor() {
        return endAnchor();
      },
    };
  }

  return { attach };
})();
