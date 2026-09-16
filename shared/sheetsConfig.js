/* ============================================================
   Sheets configuration
   ------------------------------------------------------------
   Same Google Sheet your v1 dashboard reads (the "General
   Freelancer Database"), same read-only approach: this dashboard
   reads it using YOUR signed-in Google account's existing access,
   the same way v1's js/config.js + js/sheetsClient.js do — nothing
   here can write to the sheet.

   If you ever rename a column header in the sheet, update the
   matching entry in COLUMNS below to match (matching is case/
   whitespace-insensitive, so small formatting differences are fine).
   ============================================================ */

const SheetsConfig = {
  SPREADSHEET_ID: "1YqlH18nxkp9fpNMQSzsNdHv1mPMeHwSu8NgsUK_JI-0",
  SHEET_NAME: "General Freelancer Database",
  RANGE: "A1:Z20000",

  COLUMNS: {
    firstName: "First Name",
    lastName: "Last name",
    mobile: "Mobile Number",
    source: "Source",
    referredBy: "Referred By",
    addedBy: "Added By",
    dateContacted: "Date Contacted",
    calledBy: "Called By",
    status: "Status",
    vertical: "Vertical Met",
    specialty: "Speciality",
    district: "District",
    area: "Area",
    // Best-guess default header name for the male/female filter — confirm
    // this matches your sheet's actual column header, and change the value
    // on the right if it doesn't (matching is case/whitespace-insensitive,
    // so small formatting differences are fine; a mismatch here just means
    // the Gender filter shows no options rather than breaking anything).
    gender: "Gender",
  },
};

/* ============================================================
   Personal Tasks configuration
   ------------------------------------------------------------
   A different, separate Google Sheet from the recruitment one
   above — your own "Mohamad R - BD & Data Intern" tracker, same
   "Dashboard" tab you used for personal tasks in the old dashboard.
   Confirmed directly against the live sheet (column names below
   match exactly, checked on 2026-09-14). Same read-only approach:
   uses the spreadsheets.readonly scope you already granted, no
   separate connection step needed.

   If you rename a column header in this sheet, update the matching
   entry in COLUMNS below to match (matching is case/whitespace-
   insensitive).
   ============================================================ */

const PersonalTasksConfig = {
  SPREADSHEET_ID: "1h7nC8aEHJv4zqXqV7CZzSJsm1VUS4xDHKLG4j6_Sd4Y",
  SHEET_NAME: "Dashboard",
  RANGE: "A1:L5000",

  COLUMNS: {
    category: "Column 1",
    description: "Task Description",
    dateRequested: "Date Requested",
    owner: "Task Owner",
    viewedByManagement: "Viewed by Management",
    priority: "Priority",
    deadline: "Deadline",
    dateCompleted: "Date Completed",
    relatedLinks: "Related Links",
    status: "Task Indicator",
    progress: "% Progression Rate",
    comments: "Comments",
  },
};

/* ============================================================
   Applied (Fillout form) sheet configuration
   ------------------------------------------------------------
   A third, separate Google Sheet from the two above — the real
   "Freelancer Onboarding Form-2" spreadsheet that Fillout.com
   writes to, tab "From Fillout". Re-confirmed directly against a
   fresh full HTML export of this tab on 2026-09-15 (188 real data
   rows, 123 real columns — RANGE widened from A1:Z to A1:ZZ below
   since this sheet's real columns run well past Z). This is what
   feeds the Applied page: it has Date of Birth and a Services/
   vertical column the main recruitment sheet above doesn't have.
   The spreadsheet also has "Stage 1 Approvals" and "Bookings" tabs,
   not used here.

   Same read-only approach as the two configs above — nothing here
   can write to the sheet. If a header ever changes, update the
   matching entry in COLUMNS (matching is case/whitespace-
   insensitive).

   AREA_COLUMNS: the sheet has one "Area in {District}" column per
   Lebanese district (all 26 of them, not just the 5 most-common
   ones an earlier pass here assumed) — only the ONE matching
   whichever district that applicant picked is ever filled in on
   their row. fetchApplied() in sheetsClient.js scans every column
   listed here and uses whichever is non-blank.

   VERTICAL_DETAILS: each vertical's Specialty/Years of Experience/
   Self-Rated Skill Level column(s) — this is what powers the new
   Specialty filter on the Applied page. Reverse-engineered from the
   live sheet's real layout AND spot-checked against real single-
   vertical submissions in the fresh export: Tutoring, Sport Coaching,
   Music & Art, Babysitting, Home-Based Therapy, and Beauty Services
   all matched this mapping on every real sample row available.
   Caregiving, Nursing, and Pet Services had zero single-vertical
   rows in the export to empirically confirm against, so those three
   are inferred from the same consistent sequential-block pattern
   (specialty column(s), then "Years of Experience (N)"/"Self-Rated
   Skill Level (N)" in vertical order N=1..9) rather than empirically
   verified — flagged here in case a future column reorder in the
   Fillout form ever needs this updated.
   specialtyFilterLabels (optional): which of a vertical's `specialty`
   columns are an actual subject/specialty, as opposed to a grade
   band or proficiency level asked in the same block (e.g. Tutoring's
   "Levels" is Primary/Secondary/All Levels, not a subject; Music &
   Art's "Level" is Beginner/Advanced, not a genre). Both still show
   on an applicant's full specialty list — this only narrows what
   feeds the Specialty FILTER dropdown. Omit to use every column in
   `specialty` (verticals where every extra column already reads
   like a specialty, e.g. Nursing's "Nursing Specialty").
   ============================================================ */

/* ============================================================
   Team roster configuration
   ------------------------------------------------------------
   A fourth, separate Google Sheet — "Servi_Team" — used by the new
   Team page (dashboard/team.html) to list every team member (name,
   position, contact info, photo) and to identify which of a team
   member's OWN personal task-tracker sheets (see PersonalTasksConfig
   above) belongs to them, via the ID column.

   FLAGGED FOR VERIFICATION: this spreadsheet ID was transcribed from
   a screenshot of the sheet's URL bar, not confirmed against a live
   fetch the way the three configs above were (their IDs were each
   checked directly). The screenshot's ID contains characters that
   are visually near-identical between capital "I" and lowercase "l"
   (Google's Sheets IDs are case-sensitive), so there's a real chance
   of a transcription error here. If the Team page's roster fails to
   load with a 404/"not found", this ID is the first thing to check
   against the sheet's actual address bar.

   Columns, per the screenshot: ID (format 2026XXXX, e.g. 20260001),
   Name, LastName, Position, Email, Phone, Image. IDs identify each
   team member and (per the user's own explanation) are meant to line
   up with which of their entries maps to a personal task-tracker
   sheet — but as of this writing only Mohamad Ramadan's real tracker
   sheet ID is known (PersonalTasksConfig above); every other member's
   tracker sheet ID is still a placeholder in the precedent project
   this was ported from, so Team-page task KPIs can only aggregate
   whatever the signed-in user's own tracker sheet contains for now
   (see team.html's header comment for the full explanation).
   ============================================================ */

const TeamRosterConfig = {
  SPREADSHEET_ID: "1gIe62zyxfUpv0a9sso5jo13jS5-pRQ00meb1ZagIlPo",
  SHEET_NAME: "Team",
  // Widened from A1:G200 to A1:Z200 to also cover Date Joined, Birthdate,
  // and Nationality — new columns added to the sheet after the original
  // roster columns were mapped. Header lookup is by name (see
  // buildGenericHeaderIndex), not position, so the exact column letters
  // don't matter as long as the range is wide enough to include them.
  RANGE: "A1:Z200",

  COLUMNS: {
    id: "ID",
    firstName: "Name",
    lastName: "LastName",
    position: "Position",
    email: "Email",
    phone: "Phone",
    image: "Image",
    dateJoined: "Date Joined",
    birthdate: "Birthdate",
    nationality: "Nationality",
  },
};

/* ============================================================
   General Chatroom — "General_ChatRoom" and "Typing" tabs, both
   living in the SAME spreadsheet as the Servi_Team roster above
   (same SPREADSHEET_ID — confirmed against the sheet you shared a
   screenshot of). This is the ONLY part of this dashboard that
   writes to a Google Sheet — everything else stays read-only.

   IMPORTANT scope note (flagged to the user, confirmed): Google's
   Sheets OAuth scopes are not file-scoped — there is no "read/write
   just this one spreadsheet" permission. Granting write access at
   all (AuthConfig.SCOPES) technically lets this app write to ANY
   spreadsheet your Google account can edit. The restriction to "only
   the Servi_Team sheet" that you asked for is enforced in the
   application code instead: ChatConfig/ChatTypingConfig below are
   the ONLY two configs ever passed to a write call anywhere in this
   codebase (see SheetsClient's sendChatMessage/upsertTyping) — every
   other page only ever reads.

   The "Typing" tab does not exist yet in the sheet — it needs to be
   added once, by hand, with a header row of exactly:
     A1: Name          B1: Last_Typed_At
   (same manual-setup pattern as when you added the Birthdate/
   Nationality columns — see TeamRosterConfig above.)
   ============================================================ */

const ChatConfig = {
  SPREADSHEET_ID: TeamRosterConfig.SPREADSHEET_ID,
  SHEET_NAME: "General_ChatRoom",
  RANGE: "A1:C5000",
  COLUMNS: {
    sentBy: "Sent_By",
    dateSent: "Date_Sent",
    message: "Message",
  },
};

const ChatTypingConfig = {
  SPREADSHEET_ID: TeamRosterConfig.SPREADSHEET_ID,
  SHEET_NAME: "Typing",
  RANGE: "A1:B50",
  COLUMNS: {
    name: "Name",
    lastTypedAt: "Last_Typed_At",
  },
};

/* ============================================================
   Manual Bookings — Client + Bookings sheets
   ------------------------------------------------------------
   A fifth, separate Google Sheet — "Client_Booking" — that you created
   and shared directly (2 screenshots + full HTML exports of both tabs).
   Spreadsheet ID transcribed from the screenshots' address bar (same
   transcription method flagged as a risk for TeamRosterConfig above,
   but here you separately confirmed this exact ID when asked, so it's
   not flagged as unverified).

   Two tabs in the one spreadsheet:
     "Client"   — every client's contact/address card (9 columns, A-I),
                  written once when a booking is first created.
     "Bookings" — one row per booking (19 columns, A-S in the sheet as
                  you shared it), written/updated as bookings are made,
                  edited, completed, or cancelled.

   BOOKING ID (column T) — judgment call, flagged: your shared export of
   the Bookings tab has NO "Booking ID" column (it stops at "Review",
   column S) even though the reference card design shows one
   ("Booking ID: #TUT-261023"). A stable ID is needed to find/update a
   specific booking row later (marking it Completed, editing its
   price/date, etc.), so the app adds one itself: it writes a "Booking
   ID" header into T1 the first time it ever creates a booking (if that
   header isn't already there), then fills column T on every booking
   row it creates from then on. Rows created any other way (manually
   in the sheet) simply won't have one until edited through the app.

   ID_PREFIX — 3-letter vertical prefix used to build that Booking ID
   (e.g. "TUT-260916-01"), matching the shape of the ID on your
   reference card ("#TUT-261023"). These 9 prefixes are this app's own
   invention (not in your sheet or your message) — flagged in case you'd
   rather use different ones.
   ============================================================ */

const ClientConfig = {
  SPREADSHEET_ID: "18d0Nm8NEKDQc1thMf5a7m0iX4IQImjZblzSRlb-nf00",
  SHEET_NAME: "Client",
  RANGE: "A1:I20000",
  COLUMNS: {
    firstName: "Name",
    lastName: "Last Name",
    phone: "Phone",
    district: "District",
    area: "Area",
    street: "Street",
    building: "Building",
    block: "Block",
    floor: "Floor",
  },
};

const BookingsConfig = {
  SPREADSHEET_ID: ClientConfig.SPREADSHEET_ID,
  SHEET_NAME: "Bookings",
  RANGE: "A1:T20000",
  COLUMNS: {
    clientFirstName: "Client Name",
    clientLastName: "Client Last Name",
    clientPhone: "Client Phone",
    district: "District",
    area: "Area",
    street: "Street",
    building: "Building",
    block: "Block",
    floor: "Floor",
    freelancerFirstName: "Freelancer Name",
    freelancerLastName: "Freelancer Last Name",
    freelancerPhone: "Freelancer Phone",
    vertical: "Vertical",
    date: "Date",
    price: "Price",
    duration: "Duration",
    status: "Status",
    rating: "Rating",
    review: "Review",
    // Not in your original sheet — see header comment above.
    bookingId: "Booking ID",
  },
  // Fields a staff member is allowed to edit after a booking is created —
  // everything else (client/freelancer identity, vertical) is fixed at
  // booking time, per your spec ("only the prices and date and time are
  // editable, nothing else").
  EDITABLE_FIELDS: ["date", "price", "duration", "status", "rating", "review"],
  ID_PREFIX: {
    "Tutoring": "TUT",
    "Sport Coaching & Fitness Training": "SPT",
    "Music & Art Instructing": "ART",
    "Babysitting and Nannying": "BAB",
    "Caregiving": "CAR",
    "Home-Based Therapy": "THR",
    "Nursing": "NUR",
    "Beauty Services": "BEA",
    "Pet Services": "PET",
  },
};

const AppliedSheetConfig = {
  SPREADSHEET_ID: "1Psx4W92x1yZA0klOmS5d3JIgCIQX245H5-peTg3te64",
  SHEET_NAME: "From Fillout",
  RANGE: "A1:ZZ20000",

  COLUMNS: {
    submissionId: "Submission ID",
    submittedAt: "Submission time",
    firstName: "First Name",
    lastName: "Last Name",
    mobile: "📞 Phone Number",
    district: "District",
    dob: "Date of Birth",
    gender: "Gender",
    vertical: "Services You're Offering/Could Offer (Check All That Apply)",
  },

  AREA_COLUMNS: [
    "Area in Beirut",
    "Area in Keserwan",
    "Area in Baabda",
    "Area in Metn",
    "Area in Akkar",
    "Area in Aley",
    "Area in Baalbek",
    "Area in Batroun",
    "Area in Bint Jbeil",
    "Area in Bsharri",
    "Area in Chouf",
    "Area in Hasbaya",
    "Area in Hermel",
    "Area in Jbeil",
    "Area in Jezzine",
    "Area in Keserwan (1)",
    "Area in Koura",
    "Area in Marjayoun",
    "Area in Minieh–Danniyeh",
    "Area in Nabatieh",
    "Area in Rashaya",
    "Area in Sidon",
    "Area in Tripoli",
    "Area in Tyre",
    "Area in Zahle",
    "Area in Zgharta",
    "Area in Western Bekaa",
  ],

  VERTICAL_DETAILS: {
    "Tutoring": { specialty: ["Subjects", "Levels"], specialtyFilterLabels: ["Subjects"], years: "Years of Experience (1)", skillLevel: "Self-Rated Skill Level (1)" },
    "Sport Coaching & Fitness Training": { specialty: ["Sport Specialty", "Other Specialty"], years: "Years of Experience (2)", skillLevel: "Self-Rated Skill Level (2)" },
    "Music & Art Instructing": { specialty: ["Music/Art Specialty", "Level", "Other Specialty (1)"], specialtyFilterLabels: ["Music/Art Specialty", "Other Specialty (1)"], years: "Years of Experience (3)", skillLevel: "Self-Rated Skill Level (3)" },
    "Babysitting and Nannying": { specialty: ["Type of Sitter/Nanny", "Age Groups"], specialtyFilterLabels: ["Type of Sitter/Nanny"], years: "Years of Experience (4)", skillLevel: "Self-Rated Skill Level (4)" },
    // inferred (see file header note) — not empirically confirmed
    "Caregiving": { specialty: ["Level of Care", "Other"], years: "Years of Experience (5)", skillLevel: "Self-Rated Skill Level (5)" },
    "Home-Based Therapy": { specialty: ["Therapy Specialty", "Other Specialty (2)"], years: "Years of Experience (6)", skillLevel: "Self-Rated Skill Level (6)" },
    // inferred (see file header note) — not empirically confirmed
    "Nursing": { specialty: ["Nursing Qualifications", "Nursing Specialty", "Other Nursing Qualification", "Other Nursing Specialty"], years: "Years of Experience (7)", skillLevel: "Self-Rated Skill Level (7)" },
    "Beauty Services": { specialty: ["Beauty Specialty", "Other Specialty (3)"], years: "Years of Experience (8)", skillLevel: "Self-Rated Skill Level (8)" },
    // inferred (see file header note) — not empirically confirmed
    "Pet Services": { specialty: ["Services You Offer", "Which Pets?", "Other Services", "Other Pets"], years: "Years of Experience (9)", skillLevel: "Self-Rated Skill Level (9)" },
  },
};
