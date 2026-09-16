/* ============================================================
   PhoneFormat
   ------------------------------------------------------------
   NEW in v2 — the Applied (Fillout) sheet stores raw phone numbers
   inconsistently (some with a "961" country-code prefix, some
   missing a leading 0 on the local number). Confirmed directly from
   the real sheet and your own two worked examples:

     "96170206604"  ->  "70 206 604"   (961 prefix, drop it)
     "9613206604"   ->  "03 206 604"   (961 prefix, 7 digits left,
                                         so a leading 0 goes back on)

   Rule (derived + verified against all 189 real rows, zero
   exceptions found):
     1. Strip everything but digits.
     2. If it starts with the "961" country code, drop it.
     3. If exactly 7 digits remain, prepend a "0" (Lebanese local
        numbers are 8 digits; some are stored without the leading 0).
     4. Group 8 digits as "XX XXX XXX".
     5. Anything that doesn't end up as 8 digits is returned trimmed
        but unformatted, rather than guessing — so a genuinely odd
        value is visible instead of silently mangled.
   ============================================================ */

const PhoneFormat = (() => {
  function format(raw) {
    const digitsOnly = String(raw || "").replace(/\D/g, "");
    if (!digitsOnly) return "";

    let digits = digitsOnly;
    if (digits.startsWith("961") && digits.length > 8) {
      digits = digits.slice(3);
    }
    if (digits.length === 7) {
      digits = "0" + digits;
    }
    if (digits.length === 8) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    // Unexpected length — don't invent a grouping, just hand back the
    // cleaned digits so it's still visibly a phone number.
    return digits;
  }

  return { format };
})();
