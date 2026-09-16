/* ============================================================
   PhoneCountries
   ------------------------------------------------------------
   Country + dial-code list for the phone-number field's
   country-code dropdown in Settings > Profile Settings. Lebanon is
   first and is the default, per the spec's explicit example
   (Lebanon -> +961). The rest of the list favors countries actually
   relevant to Servi's Lebanon-based team/freelancer base (the wider
   Middle East, and the countries Servi's own team/diaspora most
   commonly travels to/from) plus the other major global markets, so
   the list is long enough to be genuinely useful without listing all
   ~195 countries.

   Flags are rendered as Unicode regional-indicator emoji (two letters
   -> a flag glyph) — no image assets to ship, but flagged here as a
   real, known limitation: some older Windows browsers render these
   as plain two-letter codes instead of a flag picture. That's a
   platform font limitation, not a bug in this file.
   ============================================================ */

const PhoneCountries = (() => {
  const LIST = [
    { name: "Lebanon", iso: "LB", dial: "961" },
    { name: "France", iso: "FR", dial: "33" },
    { name: "United States", iso: "US", dial: "1" },
    { name: "United Kingdom", iso: "GB", dial: "44" },
    { name: "Canada", iso: "CA", dial: "1" },
    { name: "United Arab Emirates", iso: "AE", dial: "971" },
    { name: "Saudi Arabia", iso: "SA", dial: "966" },
    { name: "Qatar", iso: "QA", dial: "974" },
    { name: "Kuwait", iso: "KW", dial: "965" },
    { name: "Bahrain", iso: "BH", dial: "973" },
    { name: "Oman", iso: "OM", dial: "968" },
    { name: "Jordan", iso: "JO", dial: "962" },
    { name: "Syria", iso: "SY", dial: "963" },
    { name: "Iraq", iso: "IQ", dial: "964" },
    { name: "Egypt", iso: "EG", dial: "20" },
    { name: "Turkey", iso: "TR", dial: "90" },
    { name: "Cyprus", iso: "CY", dial: "357" },
    { name: "Greece", iso: "GR", dial: "30" },
    { name: "Germany", iso: "DE", dial: "49" },
    { name: "Italy", iso: "IT", dial: "39" },
    { name: "Spain", iso: "ES", dial: "34" },
    { name: "Netherlands", iso: "NL", dial: "31" },
    { name: "Belgium", iso: "BE", dial: "32" },
    { name: "Switzerland", iso: "CH", dial: "41" },
    { name: "Sweden", iso: "SE", dial: "46" },
    { name: "Australia", iso: "AU", dial: "61" },
    { name: "Brazil", iso: "BR", dial: "55" },
    { name: "Morocco", iso: "MA", dial: "212" },
    { name: "Algeria", iso: "DZ", dial: "213" },
    { name: "Tunisia", iso: "TN", dial: "216" },
    { name: "India", iso: "IN", dial: "91" },
    { name: "Pakistan", iso: "PK", dial: "92" },
    { name: "Philippines", iso: "PH", dial: "63" },
    { name: "Nigeria", iso: "NG", dial: "234" },
    { name: "South Africa", iso: "ZA", dial: "27" },
  ];

  function flagEmoji(iso) {
    if (!iso || iso.length !== 2) return "";
    const base = 0x1f1e6; // regional indicator "A"
    const chars = iso.toUpperCase().split("").map((c) => base + (c.charCodeAt(0) - 65));
    return String.fromCodePoint(...chars);
  }

  const withFlags = LIST.map((c) => ({ ...c, flag: flagEmoji(c.iso) }));

  function all() {
    return withFlags.slice();
  }

  function findByIso(iso) {
    return withFlags.find((c) => c.iso === iso) || null;
  }

  // Best-effort match of a raw stored phone number's leading digits against
  // known dial codes, longest-prefix-first (e.g. "1" shouldn't swallow a
  // number that actually starts with a longer code). Used to pre-select the
  // right country in the dropdown when editing an existing phone number.
  function detectFromDigits(digitsOnly) {
    if (!digitsOnly) return null;
    const sorted = withFlags.slice().sort((a, b) => b.dial.length - a.dial.length);
    return sorted.find((c) => digitsOnly.startsWith(c.dial)) || null;
  }

  const DEFAULT_ISO = "LB";

  return { all, findByIso, detectFromDigits, DEFAULT_ISO };
})();
