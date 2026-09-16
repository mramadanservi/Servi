/* ============================================================
   AreaSettings
   ------------------------------------------------------------
   Real lead data has messy, inconsistently-typed District/Area free
   text — different casing, spacing, and outright spelling variants of
   the same place (e.g. "Bourj hammoud" / "Borj hammoud" / "Bourj
   hammoud Beirut" / "Bourj hamoud" all meaning the same suburb). This
   unifies those for filtering and display, in two layers:

     1. Automatic: trim + collapse whitespace + case-fold for
        comparison, with a clean Title Case label for display — so
        "Bourj Hammoud" / "bourj hammoud" / "BOURJ HAMMOUD" always
        group together even with no entry below.
     2. A short manual alias list for spelling variants that
        case-folding alone can't catch. Seeded with the "Bourj Hammoud"
        cluster confirmed from the real sheet (spotted directly in a
        screenshot of the live Area filter dropdown) — nothing here is
        guessed. If more duplicate groups turn up later, add another
        line to ALIASES (map every raw variant's normalized key to one
        canonical label); no other code needs to change.

        Also seeded with "Matn"/"Metn" and "Baadba"/"Baabda" — both
        confirmed real duplicate-spelling clusters (present in both the
        main recruitment sheet's District dropdown and the Applied/
        Fillout sheet's District column: Matn=13 rows, Metn=30 rows
        there). Canonical spelling for every one of Lebanon's 26
        districts below (plus common Beirut/Mount Lebanon neighborhood
        variants) is now aligned with the real district geometry the
        Map page's choropleth uses (shared/lebanonGeo.js's own `name`
        field for each district) — so "Metn" (not "Matn") and "Sidon"
        (not "Saida") win here, since a district's label has to match
        the map's own naming exactly for that district to color in
        correctly. (An earlier pass here had picked "Matn" as the
        canonical spelling before the Map page existed to settle it —
        flip these two back if you'd rather standardize the other way,
        but note the map's district names would then need updating to
        match.)

   Deliberately NOT a fuzzy/auto-clustering algorithm: a distance-based
   auto-merge risks collapsing genuinely different places that happen
   to share a prefix (e.g. "Bourj Hammoud" vs "Bourj el-Barajneh" — two
   real, distinct Beirut-area suburbs). An explicit alias list can't
   make that mistake.

   This never changes your Google Sheet — it only affects how values
   group together inside this dashboard's filters and table.
   ============================================================ */

const AreaSettings = (() => {
  // Keys are normalized (see normKey below: trimmed, lowercased, accents
  // stripped, hyphens/slashes/commas turned to spaces, single-spaced) —
  // not the raw sheet text. The district half of this list covers all 26
  // Lebanese districts (so free-typed District values collapse onto the
  // same spelling the Map page's district geometry uses); the
  // neighborhood half covers the Beirut/Mount Lebanon-area spelling
  // variants seen most often in the real Leads/Applied data so far.
  const ALIASES = {
    // Districts (canonical spelling matches shared/lebanonGeo.js exactly)
    "beirut": "Beirut",
    "jbeil": "Jbeil", "jbeyl": "Jbeil", "byblos": "Jbeil",
    "keserwan": "Keserwan", "kesrouan": "Keserwan", "kesrwan": "Keserwan", "keserouan": "Keserwan", "kessrouane": "Keserwan",
    "matn": "Metn", "el metn": "Metn",
    "baabda": "Baabda", "baadba": "Baabda",
    "aley": "Aley", "aaley": "Aley",
    "chouf": "Chouf", "shouf": "Chouf",
    "tripoli": "Tripoli", "trablous": "Tripoli", "trablus": "Tripoli", "tarablus": "Tripoli",
    "zgharta": "Zgharta",
    "bsharri": "Bsharri", "bcharre": "Bsharri", "bsharre": "Bsharri", "bshari": "Bsharri",
    "koura": "Koura", "el koura": "Koura",
    "batroun": "Batroun", "batroune": "Batroun",
    "minieh danniyeh": "Minieh-Danniyeh", "minyeh": "Minieh-Danniyeh", "minie danniye": "Minieh-Danniyeh", "minieh dinnieh": "Minieh-Danniyeh",
    "akkar": "Akkar", "aakkar": "Akkar",
    "zahle": "Zahle", "zahleh": "Zahle", "zahla": "Zahle",
    "western bekaa": "Western Bekaa", "west bekaa": "Western Bekaa", "western beqaa": "Western Bekaa", "west beqaa": "Western Bekaa",
    "rashaya": "Rashaya", "rachaya": "Rashaya",
    "baalbek": "Baalbek", "baalbeck": "Baalbek", "baalbak": "Baalbek",
    "hermel": "Hermel",
    "sidon": "Sidon", "saida": "Sidon", "sayda": "Sidon",
    "tyre": "Tyre", "sour": "Tyre", "soor": "Tyre", "tyr": "Tyre",
    "jezzine": "Jezzine", "jezzin": "Jezzine",
    "nabatieh": "Nabatieh", "nabatiyeh": "Nabatieh", "nabatiye": "Nabatieh",
    "bint jbeil": "Bint Jbeil", "bint jbail": "Bint Jbeil", "bent jbeil": "Bint Jbeil",
    "marjayoun": "Marjayoun", "marjeyoun": "Marjayoun", "marjeyoune": "Marjayoun",
    "hasbaya": "Hasbaya", "hasbaiya": "Hasbaya",

    // Common Beirut/Mount Lebanon neighborhood spelling variants
    "bourj hammoud": "Bourj Hammoud", "borj hammoud": "Bourj Hammoud",
    "bourj hammoud beirut": "Bourj Hammoud", "borj hammoud beirut": "Bourj Hammoud",
    "bourj hamoud": "Bourj Hammoud", "borj hamoud": "Bourj Hammoud",
    "achrafieh": "Achrafieh", "ashrafieh": "Achrafieh", "achrafiyeh": "Achrafieh", "ashrafiyeh": "Achrafieh",
    "hamra": "Hamra", "el hamra": "Hamra",
    "verdun": "Verdun", "verdoun": "Verdun",
    "jounieh": "Jounieh", "jouniyeh": "Jounieh", "jounie": "Jounieh",
    "dbayeh": "Dbayeh", "dbaye": "Dbayeh", "dbayye": "Dbayeh",
    "zalka": "Zalka", "zalqa": "Zalka",
    "antelias": "Antelias", "antilias": "Antelias",
    "jal el dib": "Jal el Dib", "jal eddib": "Jal el Dib", "jal dib": "Jal el Dib",
    "mansourieh": "Mansourieh", "mansouriyeh": "Mansourieh",
    "broumana": "Broumana", "broummana": "Broumana",
    "bhamdoun": "Bhamdoun", "bhamdoune": "Bhamdoun",
    "zouk mosbeh": "Zouk Mosbeh", "zouk mosbih": "Zouk Mosbeh",
    "zouk mikael": "Zouk Mikael", "zouk mikayel": "Zouk Mikael",
    "sin el fil": "Sin el Fil", "sinn el fil": "Sin el Fil", "sin l fil": "Sin el Fil",
    "dekwaneh": "Dekwaneh", "dekwene": "Dekwaneh", "dikwaneh": "Dekwaneh",
    "chiyah": "Chiyah", "chyah": "Chiyah",
    "ain el rummaneh": "Ain el Rummaneh", "ain al rummaneh": "Ain el Rummaneh", "ain rummaneh": "Ain el Rummaneh",
    "hazmieh": "Hazmieh", "hazmiyeh": "Hazmieh",
    "furn el chebbak": "Furn el Chebbak", "furn el shebbak": "Furn el Chebbak", "fern el chebbak": "Furn el Chebbak",
    "jdeideh": "Jdeideh", "jdeide": "Jdeideh", "jdeidet el metn": "Jdeideh",
    "naccache": "Naccache", "nakache": "Naccache",
    "kaslik": "Kaslik", "kaslek": "Kaslik",
    "bikfaya": "Bikfaya", "bickfaya": "Bikfaya",
    "beit mery": "Beit Mery", "beit meri": "Beit Mery", "beit merry": "Beit Mery",
    "tabarja": "Tabarja", "tabarjah": "Tabarja",
  };

  // Lowercase, strip accents (é→e), turn hyphens/dashes/slashes/commas
  // into spaces, drop a trailing "lebanon"/"leb" word, collapse
  // whitespace. Robust enough that "Minieh–Danniyeh" (en dash), "Ashrafieh
  // Lebanon", and "Ashrafieh, Lebanon" all normalize to the same key as
  // "Ashrafieh" without needing their own alias entries.
  function normKey(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/['".]/g, "")
      .replace(/[-‐-―\/,]+/g, " ")
      .replace(/\b(?:lebanon|leb)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCase(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
  }

  // Fixes a real data-quality issue confirmed on the "From Fillout" Applied
  // sheet: at least one applicant's "Area in {District}" cell has a stray
  // Fillout submission URL appended to the actual area text (e.g. "Metn,
  // https://build.fillout.com/editor/.../results?sessionId=..." instead of
  // just "Metn") — visible on the downloadable freelancer profile card as
  // "Based in: Metn, https://build.fillout.com/...". A real district/area
  // name never contains "http", so this strips everything from the first
  // http(s):// onward (plus any trailing separator left behind) rather than
  // trying to special-case that one row — it protects every card, table,
  // and filter that goes through canonicalize(), for any row with the same
  // issue, without editing the source Google Sheet from here.
  function stripStrayLink(s) {
    return String(s || "").replace(/\s*[,·|-]?\s*https?:\/\/\S*/gi, "").trim();
  }

  // Returns a clean, unified display label for a raw District/Area value.
  // Known spelling-variant clusters collapse to their canonical label;
  // everything else just gets trimmed/whitespace-collapsed/Title Cased
  // (which alone unifies pure case/spacing duplicates).
  function canonicalize(raw) {
    const trimmed = stripStrayLink(raw);
    if (!trimmed) return "";
    const key = normKey(trimmed);
    if (ALIASES[key]) return ALIASES[key];
    return titleCase(trimmed);
  }

  return { canonicalize, stripStrayLink, ALIASES };
})();
