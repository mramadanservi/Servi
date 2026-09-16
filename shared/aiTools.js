/* ============================================================
   AiTools
   ------------------------------------------------------------
   Ported from the older, fully-built servi-unified-dashboard's
   assistant/js/tools.js — same math, same fuzzy-matching approach,
   same "never invent a number, always say what's missing" contract.
   Every tool is async here (v2 fetches its own data on demand via
   AiDataBridge — see that file's header comment for why), where
   precedent's Recruitment/Team tools were sync (borrowed already-
   loaded iframe data) and only its Applied/Bookings tools were async.

   THREE tools from precedent are deliberately DROPPED, not ported:
   list_bookings, booking_status_counts, find_booking. Precedent's
   Applied spreadsheet has an entire separate "Bookings" tab (booking
   ID, applicant, marked-booked timestamp) that v2's Applied page has
   no equivalent of anywhere — no bookings UI, no bookings data model.
   Building these three tools would mean inventing a booking data
   source that doesn't exist in this project, which violates the
   "never invent data" rule — so they're left out rather than faked.
   search_freelancers is kept (it reads real Applied-sheet data v2
   already has) but loses precedent's optional `day` filter — v2's
   Applied sheet has no "days available" column to match against.

   team_member_tasks also has an honest new limitation: it can only
   read a team member's task sheet if that member has a REAL tracker
   spreadsheet ID configured in shared/teamTasksConfig.js — today,
   only one member does (see that file's header comment). Precedent
   had the same limitation in spirit (member profile must have been
   opened & signed into on the Team tab this session) — this is the
   same idea, just gated on "is a real sheet ID configured" instead
   of "has that tab been clicked this session".
   ============================================================ */

const AiTools = (() => {

  // ---------------- date helpers (same as shared/dataStore.js) ----------------

  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function startOfWeek(d) { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

  function periodRange(period) {
    const now = new Date();
    if (period === "week") return { start: startOfWeek(now), end: addDays(startOfWeek(now), 7) };
    if (period === "month") return { start: startOfMonth(now), end: addMonths(startOfMonth(now), 1) };
    if (period === "today") return { start: startOfDay(now), end: addDays(startOfDay(now), 1) };
    return null;
  }

  function inPeriod(records, period) {
    const range = periodRange(period);
    if (!range) return records;
    return records.filter((r) => r.dateContacted && r.dateContacted >= range.start && r.dateContacted < range.end);
  }

  // ---------------- shared classifiers ----------------

  function isCalled(r) { return !!r.calledBy; }
  function isApplied(r) { return StatusSettings.classify(r.status) === "applied"; }
  function isFollowUp(r) { return StatusSettings.classify(r.status) === "followUp"; }

  function pct1(n, d) { return d ? Math.round((n / d) * 1000) / 10 : 0; }

  function daysAgo(date) {
    if (!date) return null;
    return Math.max(0, Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000));
  }

  function norm(s) { return String(s || "").trim().toLowerCase(); }

  // Matches free text like "tutors" against DataStore.VERTICALS — used for
  // both Recruitment tools AND search_freelancers (the Applied sheet's raw
  // vertical text uses these exact same canonical keys — see
  // AppliedSheetConfig's header comment in sheetsConfig.js).
  function matchVertical(query) {
    const verticals = DataStore.VERTICALS;
    const q = norm(query);
    if (!q) return { match: null, available: verticals };
    let found = verticals.find((v) => norm(v.key) === q || norm(v.label) === q);
    if (!found) found = verticals.find((v) => norm(v.key).includes(q) || norm(v.label).includes(q) || q.includes(norm(v.label)));
    return { match: found || null, available: verticals };
  }

  // v2's recruitment sheet stores the caller's actual name directly in
  // "Called By" (no separate code/name roster to resolve, unlike
  // precedent's Team-tab-based caller codes) — so this just fuzzy-matches
  // against whichever names actually appear in the sheet.
  function matchCaller(query, records) {
    const names = Team.getCallers(records);
    const roster = names.map((name) => ({ code: name, name }));
    const q = norm(query);
    if (!q) return { match: null, available: roster };
    let found = roster.find((c) => norm(c.name) === q);
    if (!found) found = roster.find((c) => norm(c.name).includes(q) || q.includes(norm(c.name)));
    return { match: found || null, available: roster };
  }

  // Matches against the Servi_Team roster sheet (see AiDataBridge.ensureRoster()).
  function matchMember(query, members) {
    const q = norm(query);
    if (!q) return { match: null, available: members };
    let found = members.find((m) => norm(m.fullName) === q || norm(m.id) === q);
    if (!found) found = members.find((m) => norm(m.fullName).includes(q) || q.includes(norm(m.fullName)));
    return { match: found || null, available: members };
  }

  function callerBreakdown(records, name, period) {
    const forCaller = records.filter((r) => r.calledBy === name);
    const calls = inPeriod(forCaller, period);
    const applied = calls.filter(isApplied);
    return {
      callsAllTime: forCaller.length,
      appliedAllTime: forCaller.filter(isApplied).length,
      callsInPeriod: calls.length,
      appliedInPeriod: applied.length,
      conversionRateAllTime: pct1(forCaller.filter(isApplied).length, forCaller.length),
    };
  }

  // ---------------- Recruitment/Team tools ----------------

  async function withRecruitment(fn) {
    let records;
    try {
      ({ records } = await AiDataBridge.ensureRecruitment());
    } catch (err) {
      return { error: err.code === "NEEDS_SHEETS_SCOPE" ? "This dashboard needs permission to read the recruitment Google Sheet — reconnect Google Sheets in Settings." : `Couldn't load the recruitment sheet: ${err.message}` };
    }
    return fn(records);
  }

  function list_verticals() {
    return { verticals: DataStore.VERTICALS.map((v) => v.label) };
  }

  async function list_callers() {
    return withRecruitment((records) => {
      const { available } = matchCaller("", records);
      return { callers: available.map((c) => c.name) };
    });
  }

  async function vertical_summary({ vertical, period = "all" }) {
    return withRecruitment((records) => {
      const { match, available } = matchVertical(vertical);
      if (!match) return { error: `"${vertical}" doesn't match any of Servi's categories.`, availableVerticals: available.map((v) => v.label) };

      const inVertical = records.filter((r) => DataStore.verticalsOf(r).includes(match.key));
      const calls = inVertical.filter(isCalled);
      const applied = calls.filter(isApplied);
      const periodCalls = inPeriod(calls, period);
      const periodApplied = periodCalls.filter(isApplied);

      return {
        vertical: match.label,
        period,
        totalLeadsAllTime: inVertical.length,
        totalCallsAllTime: calls.length,
        totalAppliedAllTime: applied.length,
        conversionRateAllTimePct: pct1(applied.length, calls.length),
        callsInPeriod: periodCalls.length,
        appliedInPeriod: periodApplied.length,
      };
    });
  }

  async function team_summary({ period = "all" }) {
    return withRecruitment((records) => {
      const calls = records.filter(isCalled);
      const applied = calls.filter(isApplied);
      const periodCalls = inPeriod(calls, period);
      const periodApplied = periodCalls.filter(isApplied);
      const followUps = records.filter(isFollowUp);

      return {
        period,
        totalLeadsAllTime: records.length,
        totalCallsAllTime: calls.length,
        totalAppliedAllTime: applied.length,
        conversionRateAllTimePct: pct1(applied.length, calls.length),
        callsInPeriod: periodCalls.length,
        appliedInPeriod: periodApplied.length,
        leadsWaitingOnFollowUp: followUps.length,
      };
    });
  }

  async function caller_summary({ caller, period = "all" }) {
    return withRecruitment((records) => {
      const { match, available } = matchCaller(caller, records);
      if (!match) return { error: `"${caller}" doesn't match anyone who has logged calls in the sheet.`, availableCallers: available.map((c) => c.name) };
      const stats = callerBreakdown(records, match.name, period);
      return { caller: match.name, period, ...stats };
    });
  }

  async function caller_leaderboard({ metric = "appliedInPeriod", period = "all", limit = 5 }) {
    return withRecruitment((records) => {
      const { available } = matchCaller("", records);
      const rows = available.map((c) => ({ caller: c.name, ...callerBreakdown(records, c.name, period) }));

      const key = ["callsAllTime", "appliedAllTime", "callsInPeriod", "appliedInPeriod", "conversionRateAllTime"].includes(metric)
        ? metric
        : "appliedInPeriod";
      rows.sort((a, b) => b[key] - a[key]);

      const cappedLimit = Math.max(1, Math.min(20, limit || 5));
      return { period, rankedBy: key, leaderboard: rows.slice(0, cappedLimit) };
    });
  }

  async function calls_needed_for_target({ vertical, metric, target }) {
    return withRecruitment((records) => {
      if (!target || target <= 0) return { error: "target must be a positive number." };
      if (metric !== "calls" && metric !== "applied") return { error: 'metric must be either "calls" or "applied".' };

      let scope = records;
      let scopeLabel = "team-wide (all verticals)";
      if (vertical) {
        const { match, available } = matchVertical(vertical);
        if (!match) return { error: `"${vertical}" doesn't match any of Servi's categories.`, availableVerticals: available.map((v) => v.label) };
        scope = records.filter((r) => DataStore.verticalsOf(r).includes(match.key));
        scopeLabel = match.label;
      }

      const scopeCalls = scope.filter(isCalled);
      const scopeApplied = scopeCalls.filter(isApplied);

      if (metric === "calls") {
        const current = scopeCalls.length;
        const remaining = Math.max(0, target - current);
        return { scope: scopeLabel, metric, target, currentCount: current, callsNeeded: remaining, alreadyMet: remaining === 0 };
      }

      const current = scopeApplied.length;
      const remaining = Math.max(0, target - current);
      if (remaining === 0) {
        return { scope: scopeLabel, metric, target, currentCount: current, callsNeeded: 0, alreadyMet: true };
      }

      let rate = scopeCalls.length ? scopeApplied.length / scopeCalls.length : 0;
      let rateBasis = scopeLabel;
      if (!rate && vertical) {
        const teamCalls = records.filter(isCalled);
        const teamApplied = teamCalls.filter(isApplied);
        rate = teamCalls.length ? teamApplied.length / teamCalls.length : 0;
        rateBasis = "team-wide (not enough call history in this vertical alone)";
      }

      if (!rate) {
        return { scope: scopeLabel, metric, target, currentCount: current, callsNeeded: null, error: "No historical calls→applied data yet to base an estimate on." };
      }

      return {
        scope: scopeLabel,
        metric,
        target,
        currentCount: current,
        remainingApplied: remaining,
        rateUsedPct: Math.round(rate * 1000) / 10,
        callsNeeded: Math.ceil(remaining / rate),
        rateBasis,
      };
    });
  }

  async function follow_up_queue_summary() {
    return withRecruitment((records) => {
      const waiting = records.filter(isFollowUp);
      if (!waiting.length) return { count: 0 };

      const withWait = waiting.map((r) => ({ name: r.fullName, days: daysAgo(r.dateContacted) })).filter((w) => w.days !== null);
      withWait.sort((a, b) => b.days - a.days);

      return {
        count: waiting.length,
        oldestWaitingDays: withWait.length ? withWait[0].days : null,
        oldestWaitingLeads: withWait.slice(0, 5),
      };
    });
  }

  async function team_member_tasks({ member }) {
    let members;
    try {
      ({ members } = await AiDataBridge.ensureRoster());
    } catch (err) {
      return { error: err.code === "NEEDS_SHEETS_SCOPE" ? "This dashboard needs permission to read the Servi_Team sheet — reconnect Google Sheets in Settings." : `Couldn't load the team roster: ${err.message}` };
    }

    const { match, available } = matchMember(member, members);
    if (!match) return { error: `"${member}" doesn't match anyone on the team roster.`, availableMembers: available.map((m) => m.fullName) };

    let taskRes;
    try {
      taskRes = await AiDataBridge.getMemberTasks(match.id);
    } catch (err) {
      return { member: match.fullName, available: false, message: `Couldn't load ${match.fullName}'s tracker sheet: ${err.message}` };
    }
    if (!taskRes) {
      return { member: match.fullName, available: false, message: `${match.fullName} doesn't have a personal tracker sheet configured in this dashboard yet.` };
    }

    const tasks = taskRes.tasks;
    const total = tasks.length;
    const completed = tasks.filter(TaskSheet.isCompleted).length;
    const atRisk = tasks.filter((t) => TaskSheet.statusSlug(t.status) === "at-risk").length;
    const openTasks = tasks
      .filter((t) => !TaskSheet.isCompleted(t))
      .sort((a, b) => (a.deadline && b.deadline ? a.deadline - b.deadline : a.deadline ? -1 : b.deadline ? 1 : 0))
      .slice(0, 8)
      .map((t) => ({
        description: t.description,
        priority: t.priority || null,
        status: t.status,
        deadline: t.deadline ? t.deadline.toISOString().slice(0, 10) : null,
        target: TaskSheet.normalizeTarget(TaskSheet.extractTarget(t.description)),
      }));

    return {
      member: match.fullName,
      available: true,
      totalTasks: total,
      completed,
      atRisk,
      completionRatePct: total ? Math.round((completed / total) * 100) : null,
      openTasks,
    };
  }

  // ---------------- Applicant search ----------------

  // Same whole-years-as-of-today calculation as applied.html's own local
  // ageFromDob() (kept as its own copy here rather than a cross-file call,
  // matching this project's existing "each script is self-contained"
  // convention — see e.g. every page's own local trendBadge()). Returns
  // null when there's no usable Date of Birth (legacy-style gaps, or the
  // applicant left it blank) rather than guessing.
  function ageFromDob(dob) {
    if (!(dob instanceof Date) || isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 1 && age < 90 ? age : null;
  }

  // Years of Experience is a free-text Fillout answer (e.g. "5", "5 years",
  // "10+"), not a clean number — this pulls out the leading number so it can
  // be compared against a minimum, and returns null (never 0) when nothing
  // numeric is present so "no experience data" isn't confused with "0 years".
  function parseYearsNumber(raw) {
    const m = String(raw || "").match(/\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
  }

  // The applicant's own top (first-listed) vertical's Years of Experience /
  // Self-Rated Skill Level — same "first service detail" convention the
  // downloadable freelancer card uses (one headline experience figure per
  // person, not one per vertical they multi-applied under).
  function primaryServiceDetail(rec) {
    const details = rec.serviceDetails || {};
    const firstKey = Object.keys(details)[0];
    return firstKey ? details[firstKey] : null;
  }

  async function search_freelancers({ vertical, area, specialty, minAge, maxAge, minYearsExperience, limit = 10 }) {
    let records;
    try {
      records = await AiDataBridge.ensureApplied();
      records = records.records;
    } catch (err) {
      return { error: err.code === "NEEDS_SHEETS_SCOPE" ? "This dashboard needs permission to read the Applied Google Sheet — reconnect Google Sheets in Settings." : `Couldn't load the Applied sheet: ${err.message}` };
    }

    let verticalMatch = null;
    if (vertical) {
      const { match, available } = matchVertical(vertical);
      if (!match) return { error: `"${vertical}" doesn't match any of Servi's categories.`, availableCategories: available.map((v) => v.label) };
      verticalMatch = match;
    }

    const needleArea = norm(area);
    const needleSpecialty = norm(specialty);
    const minYears = minYearsExperience != null ? Number(minYearsExperience) : null;

    const matches = records.filter((a) => {
      const verticals = DataStore.verticalsOf(a);
      if (verticalMatch && !verticals.includes(verticalMatch.key)) return false;
      if (needleArea && !(norm(a.area).includes(needleArea) || norm(a.district).includes(needleArea))) return false;
      if (needleSpecialty) {
        const allSpecialty = Object.values(a.serviceDetails || {}).flatMap((d) => d.specialty || []).map(norm).join(" | ");
        if (!allSpecialty.includes(needleSpecialty)) return false;
      }
      const age = ageFromDob(a.dob);
      if (minAge != null && (age === null || age < Number(minAge))) return false;
      if (maxAge != null && (age === null || age > Number(maxAge))) return false;
      if (minYears !== null) {
        const years = parseYearsNumber((primaryServiceDetail(a) || {}).years);
        if (years === null || years < minYears) return false;
      }
      return true;
    });

    const cappedLimit = Math.max(1, Math.min(25, limit || 10));
    return {
      category: verticalMatch ? verticalMatch.label : "any",
      totalMatches: matches.length,
      results: matches.slice(0, cappedLimit).map((a) => {
        const detail = primaryServiceDetail(a) || {};
        return {
          name: a.fullName,
          phone: a.mobile,
          district: AreaSettings.canonicalize(a.district) || a.district,
          area: AreaSettings.canonicalize(a.area) || a.area,
          categories: DataStore.verticalsOf(a).map((k) => DataStore.verticalLabel(k)),
          specialties: Object.values(a.serviceDetails || {}).flatMap((d) => d.specialty || []),
          age: ageFromDob(a.dob), // null when Date of Birth isn't on file for this applicant
          yearsOfExperience: detail.years || null,
          selfRatedSkillLevel: detail.skillLevel || null,
          submittedAt: a.submittedAt ? a.submittedAt.toISOString().slice(0, 10) : null,
        };
      }),
    };
  }

  const IMPLEMENTATIONS = {
    list_verticals,
    list_callers,
    vertical_summary,
    team_summary,
    caller_summary,
    caller_leaderboard,
    calls_needed_for_target,
    follow_up_queue_summary,
    team_member_tasks,
    search_freelancers,
  };

  async function call(name, args) {
    const fn = IMPLEMENTATIONS[name];
    if (!fn) return { error: `Unknown tool "${name}".` };
    try {
      return await fn(args || {});
    } catch (e) {
      return { error: `Tool "${name}" failed: ${e.message}` };
    }
  }

  // ---------------- Gemini tool declarations ----------------
  // Same schema shape/rules as precedent (see that file's header comment):
  // lowercase OpenAPI-style types, and a zero-argument function omits
  // `parameters` entirely.

  const DECLARATIONS = [
    {
      name: "list_verticals",
      description: "Lists Servi's fixed set of freelancer categories (Tutors, Sports & Fitness, Music & Art, Babysitters & Nannies, Home-Based Therapists, Nurses, Caregivers, Beauty Services, Pet Services). Call this first if you're not sure how a category the user mentioned (e.g. \"tutors\") maps to Servi's exact category names.",
    },
    {
      name: "list_callers",
      description: "Lists everyone who has made at least one logged call in the Recruitment sheet, by name. Call this if you're not sure how a person's name maps to who's actually in the data.",
    },
    {
      name: "vertical_summary",
      description: "Stats for ONE freelancer category (vertical): total leads, total calls made, total applied, conversion rate (all-time), plus calls/applied within a specific recent period. Use this for questions like \"how are we doing on tutors today\" or \"what's our conversion rate for nurses\".",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", description: "The category, in the user's own words (e.g. \"tutors\", \"beauty\") — fuzzy-matched, no need to get the exact spelling right." },
          period: { type: "string", enum: ["today", "week", "month", "all"], description: "Which recent window to also report calls/applied for, in addition to the all-time totals. Default \"all\" if the user didn't ask about a specific recent window." },
        },
        required: ["vertical"],
      },
    },
    {
      name: "team_summary",
      description: "Team-wide stats across every category combined: total leads, calls, applied, conversion rate, plus a specific period's calls/applied, and how many leads are waiting on a follow-up call. Use this for general \"how are we doing\" questions that don't name one specific category.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "week", "month", "all"], description: "Which recent window to report calls/applied for. Default \"all\"." },
        },
      },
    },
    {
      name: "caller_summary",
      description: "One specific person's own calling stats: calls made, applied, conversion rate, all-time and for a recent period. Use for \"how is Sara doing\" style questions about one named person.",
      parameters: {
        type: "object",
        properties: {
          caller: { type: "string", description: "The person's name, in the user's own words — fuzzy-matched." },
          period: { type: "string", enum: ["today", "week", "month", "all"], description: "Default \"all\"." },
        },
        required: ["caller"],
      },
    },
    {
      name: "caller_leaderboard",
      description: "Ranks everyone who has made calls by a chosen metric, for \"who's our top caller\" / \"who's converting best\" style questions.",
      parameters: {
        type: "object",
        properties: {
          metric: { type: "string", enum: ["callsAllTime", "appliedAllTime", "callsInPeriod", "appliedInPeriod", "conversionRateAllTime"], description: "What to rank by. Use one ending in \"InPeriod\" when the question names a recent window (e.g. \"this week\"), otherwise an *AllTime one. Default appliedInPeriod." },
          period: { type: "string", enum: ["today", "week", "month", "all"], description: "Only affects the *InPeriod numbers. Default \"all\"." },
          limit: { type: "integer", description: "How many people to return, most-first. Default 5." },
        },
      },
    },
    {
      name: "calls_needed_for_target",
      description: "How many MORE calls are needed to reach an all-time cumulative milestone (e.g. \"reach a total of 500 tutors called\", or \"get to 200 applied nurses ever\"). This is for a lifetime running total, NOT a daily/weekly/monthly pace.",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", description: "Optional: restrict to one category (fuzzy-matched). Omit for a team-wide, all-categories target." },
          metric: { type: "string", enum: ["calls", "applied"], description: "\"calls\" if the target counts raw calls/contacts made (direct 1-for-1, no conversion rate). \"applied\" if the target counts people who actually applied (uses the historical calls→applied rate)." },
          target: { type: "number", description: "The milestone total to reach." },
        },
        required: ["metric", "target"],
      },
    },
    {
      name: "follow_up_queue_summary",
      description: "How many leads are currently waiting on a follow-up call, and the longest anyone has been waiting. Use for \"how's our follow-up queue looking\" style questions.",
    },
    {
      name: "team_member_tasks",
      description: "One team member's task list from their personal tracker sheet: totals, completion rate, and the most urgent open tasks. Only works for a team member who has a real tracker sheet configured in this dashboard — if not, this says so rather than guessing.",
      parameters: {
        type: "object",
        properties: {
          member: { type: "string", description: "The person's name, in the user's own words — fuzzy-matched against the Servi_Team roster." },
        },
        required: ["member"],
      },
    },
    {
      name: "search_freelancers",
      description: "Searches Servi's applicant pool (the Applied page's data — every freelancer who has applied) for freelancers matching a category, area, specialty, age range, and/or minimum years of experience. Use this for questions like \"I want a French tutor in Beirut\", \"who do we have for babysitting in Achrafieh\", \"tutors over 30\", or \"a sports coach with at least 5 years of experience\". Returns matched applicants' real names and phone numbers, plus their age (from Date of Birth) and years of experience/self-rated skill level in their primary category, so the user can actually reach out to them.",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", description: "The category, in the user's own words (e.g. \"french tutor\", \"babysitter\") — fuzzy-matched against Servi's fixed categories. Omit to search across every category." },
          area: { type: "string", description: "A district or neighborhood mentioned in the question (e.g. \"Beirut\", \"Achrafieh\") — matched against the applicant's district/area." },
          specialty: { type: "string", description: "A specific subject/specialty mentioned (e.g. \"French\", \"piano\", \"CrossFit\") — matched against that applicant's specialty answers." },
          minAge: { type: "integer", description: "Only include applicants at least this age (computed from their Date of Birth on file). Omit if no minimum was mentioned." },
          maxAge: { type: "integer", description: "Only include applicants at most this age. Omit if no maximum was mentioned." },
          minYearsExperience: { type: "number", description: "Only include applicants with at least this many years of experience in their primary applied category (parsed from their Years of Experience answer). Omit if not mentioned." },
          limit: { type: "integer", description: "Max results to return. Default 10." },
        },
      },
    },
  ];

  return { call, DECLARATIONS };
})();
