/* ============================================================
   SpecialtySettings
   ------------------------------------------------------------
   The Applied page's per-vertical "Specialty" text (Subjects,
   Sport Specialty, Music/Art Specialty, etc. — see VERTICAL_DETAILS
   in sheetsConfig.js) is free text, not a pick from a fixed list, so
   a naive filter dropdown ends up full of near-duplicate fragments
   ("Agenda for 6th grade students", "Agenda specifically math",
   "Daily agenda"...) and outright non-answers ("Other", "N/A", "-").
   This cleans that up in three real, verified ways:

     1. Junk removal — SPECIALTY_JUNK_VALUES are exact-match (case-
        insensitive) placeholder answers with no real information,
        dropped everywhere they'd appear (the filter dropdown and any
        list of an applicant's cleaned specialties).
     2. Careful splitting — a cell can hold one whole phrase with
        commas INSIDE parentheses ("Fine arts (sketching, acrylic
        painting)"), so this splits on commas OUTSIDE parens only,
        then strips bullet-marker/"and "-remnant artifacts left by
        upstream list formatting, and drops fragments that are really
        an age range ("2-3 years old") that leaked in from an
        adjacent non-specialty column.
     3. Canonical bucketing — SPECIALTY_CANONICAL_GROUPS groups any
        fragment containing one of a few keywords into one filter
        option (e.g. anything mentioning "agenda" becomes "Agenda")
        so the dropdown doesn't show ten near-identical entries for
        what's really one answer. This ONLY affects the filter
        dropdown and its matching — an applicant's own full specialty
        list (e.g. on a profile) always still shows their real,
        un-bucketed text.

   Both lists below are intentionally small and conservative, ported
   from a working, spot-checked implementation built against this
   same sheet's real data — a wrong/too-aggressive bucket is worse
   than an un-bucketed one, since it can make two genuinely different
   answers look identical in the filter. Add to them as more repeated
   patterns turn up in the real sheet.
   ============================================================ */

const SpecialtySettings = (() => {
  const SPECIALTY_JUNK_VALUES = ["other", "all", "all services", "none", "n/a", "na", "-", "."];

  const SPECIALTY_CANONICAL_GROUPS = [
    { canonical: "Agenda", keywords: ["agenda"] },
    { canonical: "After-School Care", keywords: ["after school", "after-school", "afterschool"] },
  ];

  const JUNK_SPECIALTY_SET = new Set(SPECIALTY_JUNK_VALUES.map((v) => String(v).trim().toLowerCase()));
  function isJunkSpecialty(v) {
    return JUNK_SPECIALTY_SET.has(String(v || "").trim().toLowerCase());
  }

  function hasLetterOrDigit(s) {
    return /[a-z0-9]/i.test(s);
  }

  // Catches "0-1yr", "1 - 3 yrs", "2-3 years old", etc. — a fragment that's
  // really an age range, not a subject/specialty, that leaked in from an
  // adjacent column (e.g. Babysitting's "Age Groups").
  function looksLikeAgeRange(s) {
    return /^\d+\s*(?:-|–|to)\s*\d+\s*(?:yrs?|years?)\s*(?:old)?$/i.test(s.trim());
  }

  function cleanSpecialtyFragment(s) {
    return String(s || "")
      .trim()
      .replace(/^[*\-•]+\s*/, "") // leading "**"/"-"/"•" bullet artifacts
      .replace(/^and\s+/i, "") // "...and X" list remnants left by a comma split
      .replace(/\s+/g, " ")
      .trim();
  }

  // Splits on commas EXCEPT ones inside parentheses, so a mixed cell like
  // "french, agenda (especially math, physics, and english)" still splits
  // into its two real items instead of shredding the parenthetical phrase.
  function splitOutsideParens(s) {
    const parts = [];
    let depth = 0;
    let current = "";
    for (const ch of s) {
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === "," && depth === 0) {
        parts.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts;
  }

  function splitSpecialtyCell(raw) {
    const s = String(raw || "").trim();
    if (!s) return [];
    return splitOutsideParens(s)
      .map(cleanSpecialtyFragment)
      .filter((v) => v && hasLetterOrDigit(v) && !looksLikeAgeRange(v) && !isJunkSpecialty(v));
  }

  // Buckets a cleaned fragment into one of SPECIALTY_CANONICAL_GROUPS by
  // case-insensitive substring match, checked in order. Returns the
  // fragment unchanged if no group matches.
  function canonicalizeSpecialty(fragment) {
    const lower = fragment.toLowerCase();
    const group = SPECIALTY_CANONICAL_GROUPS.find((g) => (g.keywords || []).some((kw) => lower.includes(String(kw).toLowerCase())));
    return group ? group.canonical : fragment;
  }

  // Every cleaned specialty fragment a record has, across whichever
  // vertical(s) it applied under. `rec.serviceDetails` is
  // { [verticalKey]: { specialty: [...raw cells], specialtyFilterable: [...raw cells] } }
  // — see sheetsClient.js's fetchApplied() for live records, and
  // legacyApplied.js for legacy ones. Uses specialtyFilterable when present
  // (narrowed per VERTICAL_DETAILS' specialtyFilterLabels) and falls back
  // to the full specialty list otherwise.
  function specialtiesOf(rec) {
    const details = (rec && rec.serviceDetails) || {};
    const out = [];
    Object.values(details).forEach((d) => {
      const source = (d && (d.specialtyFilterable || d.specialty)) || [];
      source.forEach((cell) => splitSpecialtyCell(cell).forEach((part) => out.push(part)));
    });
    return out;
  }

  function canonicalSpecialtiesOf(rec) {
    return specialtiesOf(rec).map(canonicalizeSpecialty);
  }

  // Case-only duplicates ("French"/"french") are merged for the dropdown.
  // A short all-caps variant is assumed to be a real acronym (OT, PT, IV)
  // and left alone rather than "corrected" to a guessed capitalization;
  // otherwise the first properly-capitalized variant seen wins, falling
  // back to capitalizing whichever variant is most common.
  function isSpecialtyAcronym(v) {
    return v.length <= 4 && v === v.toUpperCase() && /[A-Z]/.test(v);
  }

  function pickCanonicalSpecialty(variants) {
    const acronym = variants.find(isSpecialtyAcronym);
    if (acronym) return acronym;
    const wellFormed = variants.find((v) => /^[A-Z]/.test(v) && v.slice(1) === v.slice(1).toLowerCase());
    if (wellFormed) return wellFormed;
    const counts = new Map();
    variants.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    const mostCommon = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    return mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);
  }

  // Unique, sorted specialty options across a set of records, for a filter
  // dropdown — canonical (bucketed) fragments feed this, even though each
  // record's own full specialty list still shows its original text.
  function optionsFrom(records) {
    const variants = new Map(); // lowercase key -> every raw casing seen
    records.forEach((r) => {
      canonicalSpecialtiesOf(r).forEach((s) => {
        const key = s.toLowerCase();
        if (!variants.has(key)) variants.set(key, []);
        variants.get(key).push(s);
      });
    });
    return Array.from(variants.values(), pickCanonicalSpecialty).sort((a, b) => a.localeCompare(b));
  }

  function matches(rec, target) {
    if (!target) return true;
    const t = target.trim().toLowerCase();
    return canonicalSpecialtiesOf(rec).some((s) => s.toLowerCase() === t);
  }

  return { specialtiesOf, canonicalSpecialtiesOf, optionsFrom, matches, splitSpecialtyCell };
})();
