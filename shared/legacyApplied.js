/* ============================================================
   LegacyApplied
   ------------------------------------------------------------
   75 real applicants from the OLD, no-longer-active Fillout form
   ("Fillout Old - Freelancer Application results") that predates the
   current "From Fillout" live sheet the Applied page otherwise reads.
   There is no live Google Sheet for this data anymore -- confirmed
   from the export you sent directly -- so it is baked into the app as
   a static data file and merged with the live sheet's records at load
   time (see applied.html's loadAppliedData()).

   Every field here is real data from that export (submissionId, dob,
   and gender cross-checked row-by-row against the raw CSV export by
   submissionId -- all 75 matched with none left blank). Nothing is
   invented for a field that was actually left blank in the export;
   an empty string means the applicant didn't answer that question.

   Notably absent: this old form never asked for Nationality, so these
   75 applicants simply have none -- expected, not a bug.

   `serviceDetails` here already holds each applicant's real specialty
   text per vertical, extracted from the old form's own "Specific
   Service in {Vertical}?" free-text fields -- shaped identically to
   what sheetsClient.js's fetchApplied() builds for live records
   (specialty/specialtyFilterable arrays), so SpecialtySettings.js's
   cleanup pipeline works unmodified on both sources. `specialty` and
   `specialtyFilterable` are identical here since the old form's
   per-vertical fields were already a single free-text specialty
   answer (no separate grade-band/skill-level column mixed in to
   filter out, unlike a few of the live sheet's verticals).

   `dob` and `submittedAt` are ISO date strings here (this is a plain
   static data file, not a place to construct Date objects) -- convert
   with `new Date(...)` at load time, same as any other parsed value.
   ============================================================ */

const LEGACY_APPLIED = [
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "27e93cfb-7841-44ac-8178-32fc21a9c7ee",
    "firstName": "makhlouf",
    "lastName": "Maria",
    "fullName": "makhlouf Maria",
    "mobile": "+96176442224",
    "district": "Beirut",
    "area": "Sin l fil",
    "dob": "2006-08-25",
    "gender": "Male",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-06-11T11:28:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "8dd363ea-2564-4b9a-a41c-fac90fe9b000",
    "firstName": "Elias",
    "lastName": "Merhej",
    "fullName": "Elias Merhej",
    "mobile": "+9613324550",
    "district": "Metn",
    "area": "Awkar",
    "dob": "2007-01-12",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training",
    "submittedAt": "2026-06-11T13:21:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Resistance training/bodybuilding"
        ],
        "specialtyFilterable": [
          "Resistance training/bodybuilding"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b64fa73c-a042-4788-af74-f2bd056fc9d7",
    "firstName": "Jane",
    "lastName": "Azzi",
    "fullName": "Jane Azzi",
    "mobile": "+96176337968",
    "district": "Metn",
    "area": "Bouchrieh",
    "dob": "2007-02-21",
    "gender": "Female",
    "vertical": "Tutoring,Other (Type Below)",
    "submittedAt": "2026-06-11T13:25:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Science course"
        ],
        "specialtyFilterable": [
          "Science course"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "86dbc4a3-544f-44d8-bde4-24b901b3dd57",
    "firstName": "Maria",
    "lastName": "El Alam",
    "fullName": "Maria El Alam",
    "mobile": "+96181519118",
    "district": "Metn",
    "area": "Baskinta",
    "dob": "2007-02-06",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-11T13:25:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Agenda specifically math"
        ],
        "specialtyFilterable": [
          "Agenda specifically math"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "d57e7c0e-47d4-4f6f-a515-1b35a3fb305d",
    "firstName": "Nathalie",
    "lastName": "Ali",
    "fullName": "Nathalie Ali",
    "mobile": "+96176729346",
    "district": "Metn",
    "area": "Dekwaneh",
    "dob": "2003-09-14",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Other (Type Below)",
    "submittedAt": "2026-06-11T13:23:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Arabic, English, French, Russian, science subjects for under grade 9 students"
        ],
        "specialtyFilterable": [
          "Arabic, English, French, Russian, science subjects for under grade 9 students"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "After school"
        ],
        "specialtyFilterable": [
          "After school"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b7ac8175-31bb-416b-a1cb-9e825ee2fff1",
    "firstName": "Hrant",
    "lastName": "Dermendjian",
    "fullName": "Hrant Dermendjian",
    "mobile": "+96170151775",
    "district": "Beirut",
    "area": "Achrafieh",
    "dob": "2004-09-17",
    "gender": "Male",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-06-12T13:26:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "85dbc6cc-bded-46eb-9535-6042b2cafe82",
    "firstName": "Charbel",
    "lastName": "Kyrillos",
    "fullName": "Charbel Kyrillos",
    "mobile": "+96178840540",
    "district": "Keserwan",
    "area": "Safra",
    "dob": "1999-10-28",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Tutoring",
    "submittedAt": "2026-06-15T09:29:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math"
        ],
        "specialtyFilterable": [
          "Math"
        ]
      },
      "Sport Coaching & Fitness Training": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Taekwondo, fitness and volleyball"
        ],
        "specialtyFilterable": [
          "Taekwondo, fitness and volleyball"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "4420760b-821f-4ea2-b580-00cb979f5996",
    "firstName": "kevin",
    "lastName": "abi reched",
    "fullName": "kevin abi reched",
    "mobile": "+96171080333",
    "district": "Metn",
    "area": "Antelias",
    "dob": "2007-05-23",
    "gender": "Male",
    "vertical": "Babysitting and Nannying,Pet Services",
    "submittedAt": "2026-06-15T09:27:00+03:00",
    "serviceDetails": {
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "whatever you want"
        ],
        "specialtyFilterable": [
          "whatever you want"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "dog walking , training"
        ],
        "specialtyFilterable": [
          "dog walking , training"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "74e2275f-ca86-41d7-a240-2a0ba31ed278",
    "firstName": "Christy",
    "lastName": "Abou Akl",
    "fullName": "Christy Abou Akl",
    "mobile": "+96171996853",
    "district": "Zahle",
    "area": "",
    "dob": "2006-07-29",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-06-15T09:29:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "3c9e8e47-fc4f-4591-b872-3b3a7ae66105",
    "firstName": "Raúl",
    "lastName": "Saba",
    "fullName": "Raúl Saba",
    "mobile": "+9613631525",
    "district": "Jbeil",
    "area": "",
    "dob": "2007-08-01",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-15T09:38:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math; Physics; Chemistry; Biology; Official Exams Prep.; Technical and Creative writing; etc."
        ],
        "specialtyFilterable": [
          "Math; Physics; Chemistry; Biology; Official Exams Prep.; Technical and Creative writing; etc."
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "ab4f71a8-c0d4-4b39-bb0a-b41b12ea728b",
    "firstName": "Elio",
    "lastName": "Kerbej",
    "fullName": "Elio Kerbej",
    "mobile": "+96170278046",
    "district": "Byblos",
    "area": "",
    "dob": "2004-05-24",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-15T09:49:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Scientific subjects (biology, chemistry, etc.) and English"
        ],
        "specialtyFilterable": [
          "Scientific subjects (biology, chemistry, etc.) and English"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "db7ba87a-f13a-47da-bcc8-2df08c98add0",
    "firstName": "Elia",
    "lastName": "Mansour",
    "fullName": "Elia Mansour",
    "mobile": "+96170572252",
    "district": "Metn",
    "area": "Mazraat Yachouh",
    "dob": "1997-03-16",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Music & Art Instructing",
    "submittedAt": "2026-06-15T10:04:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Boxing, Calisthenics, Bodybuilding, Core & Fitness"
        ],
        "specialtyFilterable": [
          "Boxing, Calisthenics, Bodybuilding, Core & Fitness"
        ]
      },
      "Music & Art Instructing": {
        "years": "10+ years",
        "skillLevel": "",
        "specialty": [
          "Graphic Design"
        ],
        "specialtyFilterable": [
          "Graphic Design"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f8b37d29-a461-4139-8816-74592d251d20",
    "firstName": "Eliane",
    "lastName": "Haddad",
    "fullName": "Eliane Haddad",
    "mobile": "+96170441147",
    "district": "Keserwan",
    "area": "Tabarja",
    "dob": "2003-09-17",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Pet Services",
    "submittedAt": "2026-06-15T10:13:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "English, Art, Social Science Statistics, Research Basics, French, German, History and Geography"
        ],
        "specialtyFilterable": [
          "English, Art, Social Science Statistics, Research Basics, French, German, History and Geography"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "After school for toddlers to teenagers"
        ],
        "specialtyFilterable": [
          "After school for toddlers to teenagers"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Dog walking and pet sitting (dogs, cats, rabbits, mammals)"
        ],
        "specialtyFilterable": [
          "Dog walking and pet sitting (dogs, cats, rabbits, mammals)"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "a3e9444d-c7db-417e-ae30-308a6abbb4b6",
    "firstName": "Mikaella",
    "lastName": "Al haddad",
    "fullName": "Mikaella Al haddad",
    "mobile": "+96176088688",
    "district": "Keserwan",
    "area": "Zouk Mosbeh",
    "dob": "2003-08-24",
    "gender": "Female",
    "vertical": "Tutoring,Other (Type Below)",
    "submittedAt": "2026-06-15T11:09:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "2-5 years",
        "skillLevel": "",
        "specialty": [
          "Chemistry, biology, english"
        ],
        "specialtyFilterable": [
          "Chemistry, biology, english"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "2446d6ea-e77a-4689-80bd-df19932927ad",
    "firstName": "Gilbert",
    "lastName": "Matar",
    "fullName": "Gilbert Matar",
    "mobile": "+96171968163",
    "district": "Mount Lebanon",
    "area": "",
    "dob": "2004-04-05",
    "gender": "Male",
    "vertical": "Music & Art Instructing",
    "submittedAt": "2026-06-15T10:56:00+03:00",
    "serviceDetails": {
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Guitar"
        ],
        "specialtyFilterable": [
          "Guitar"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "5b296a09-dea3-4ce2-b205-fa3c72e111b7",
    "firstName": "antonio",
    "lastName": "hobeika",
    "fullName": "antonio hobeika",
    "mobile": "+96181914750",
    "district": "Keserwan",
    "area": "Ajaltoun",
    "dob": "2008-11-27",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training",
    "submittedAt": "2026-06-15T13:28:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "calisthenics"
        ],
        "specialtyFilterable": [
          "calisthenics"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "a291db33-9ab8-4e8b-ad47-079bb112a7fa",
    "firstName": "Celine",
    "lastName": "Gerges",
    "fullName": "Celine Gerges",
    "mobile": "+9613197140",
    "district": "Jbeil",
    "area": "",
    "dob": "2003-06-12",
    "gender": "Female",
    "vertical": "Babysitting and Nannying,Pet Services",
    "submittedAt": "2026-06-15T19:39:00+03:00",
    "serviceDetails": {
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "**Childcare, babysitting, homework help, tutoring support, meal assistance, and engaging educational activities for children"
        ],
        "specialtyFilterable": [
          "**Childcare, babysitting, homework help, tutoring support, meal assistance, and engaging educational activities for children"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "**Pet sitting, dog walking, feeding, playtime, and basic pet care"
        ],
        "specialtyFilterable": [
          "**Pet sitting, dog walking, feeding, playtime, and basic pet care"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "05451d9d-c815-43f0-8c18-c3025341af3e",
    "firstName": "Nour",
    "lastName": "Abi Daoud",
    "fullName": "Nour Abi Daoud",
    "mobile": "+96181835844",
    "district": "Mount Lebanon",
    "area": "",
    "dob": "2006-02-16",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Pet Services",
    "submittedAt": "2026-06-16T11:31:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Agenda"
        ],
        "specialtyFilterable": [
          "Agenda"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "afterschool"
        ],
        "specialtyFilterable": [
          "afterschool"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "dog walking"
        ],
        "specialtyFilterable": [
          "dog walking"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "9127e917-65ca-4417-bee2-d29c7b78da6c",
    "firstName": "Rhéa",
    "lastName": "El Hajj",
    "fullName": "Rhéa El Hajj",
    "mobile": "+96181311269",
    "district": "Beirut",
    "area": "Achrafieh",
    "dob": "1901-01-01",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Pet Services",
    "submittedAt": "2026-06-17T16:36:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "French, English, SES,LLCER"
        ],
        "specialtyFilterable": [
          "French, English, SES,LLCER"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Afterschool"
        ],
        "specialtyFilterable": [
          "Afterschool"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Dog walking and Pet sitting"
        ],
        "specialtyFilterable": [
          "Dog walking and Pet sitting"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "74d1dfac-8793-4d02-98b8-ad6706471165",
    "firstName": "Michèle",
    "lastName": "Samaha",
    "fullName": "Michèle Samaha",
    "mobile": "+96171084848",
    "district": "Metn",
    "area": "Rabieh",
    "dob": "2005-08-24",
    "gender": "Female",
    "vertical": "Sport Coaching & Fitness Training",
    "submittedAt": "2026-06-18T10:58:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "PT"
        ],
        "specialtyFilterable": [
          "PT"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "6867edbc-9f61-4fb7-9990-2bfb95fa89bc",
    "firstName": "Maria",
    "lastName": "Korkis Kanaan",
    "fullName": "Maria Korkis Kanaan",
    "mobile": "+96171040961",
    "district": "Metn",
    "area": "Antelias",
    "dob": "2004-11-15",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-18T10:44:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Music theory, harmony, Music analysis, solfeggio, music history, organology, ..."
        ],
        "specialtyFilterable": [
          "Music theory, harmony, Music analysis, solfeggio, music history, organology, ..."
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b60e3978-1a89-4a85-953f-600f387cfb66",
    "firstName": "Charbel",
    "lastName": "Bejjani",
    "fullName": "Charbel Bejjani",
    "mobile": "+96171207952",
    "district": "Kahale",
    "area": "",
    "dob": "1995-08-14",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Music & Art Instructing,Tutoring",
    "submittedAt": "2026-06-18T11:41:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "All subjects for middle classes"
        ],
        "specialtyFilterable": [
          "All subjects for middle classes"
        ]
      },
      "Sport Coaching & Fitness Training": {
        "years": "5-10 years",
        "skillLevel": "",
        "specialty": [
          "Pt"
        ],
        "specialtyFilterable": [
          "Pt"
        ]
      },
      "Music & Art Instructing": {
        "years": "5-10 years",
        "skillLevel": "",
        "specialty": [
          "Percussion"
        ],
        "specialtyFilterable": [
          "Percussion"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b74d3d47-4f04-47c7-af94-c2d20df78fd0",
    "firstName": "Julie",
    "lastName": "Bou Fadel",
    "fullName": "Julie Bou Fadel",
    "mobile": "+96176504328",
    "district": "Metn",
    "area": "Bsalim",
    "dob": "2005-04-22",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-18T12:08:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Homework help, Exam preparation, English / French, Economics / Business studies, Mathematics, Physics, Chemistry, Biology"
        ],
        "specialtyFilterable": [
          "Homework help, Exam preparation, English / French, Economics / Business studies, Mathematics, Physics, Chemistry, Biology"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "5a62a529-91c0-497b-8177-2e3bfd88bcaa",
    "firstName": "jane",
    "lastName": "ibrahim",
    "fullName": "jane ibrahim",
    "mobile": "+96176306035",
    "district": "Keserwan",
    "area": "Zouk Mikael",
    "dob": "2004-02-08",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Caregiving",
    "submittedAt": "2026-06-18T14:12:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "all"
        ],
        "specialtyFilterable": [
          "all"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "all"
        ],
        "specialtyFilterable": [
          "all"
        ]
      },
      "Caregiving": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "elderly"
        ],
        "specialtyFilterable": [
          "elderly"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f79b4594-812b-48a2-8e8b-57b7a30e30a0",
    "firstName": "Marina",
    "lastName": "Sader",
    "fullName": "Marina Sader",
    "mobile": "+96171041688",
    "district": "Metn",
    "area": "Fanar",
    "dob": "2005-08-10",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-19T09:33:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Agenda, any materials for revision, devoir de vacance"
        ],
        "specialtyFilterable": [
          "Agenda, any materials for revision, devoir de vacance"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "acf10fe9-71c0-41c5-958e-285a827ce876",
    "firstName": "Elie",
    "lastName": "Farah",
    "fullName": "Elie Farah",
    "mobile": "+96171622616",
    "district": "Metn",
    "area": "Rabieh",
    "dob": "2000-11-17",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-19T11:28:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Physics and Math"
        ],
        "specialtyFilterable": [
          "Physics and Math"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "077360c3-7742-4dc1-a103-9c4f6e294095",
    "firstName": "Kamal",
    "lastName": "El Wazzan",
    "fullName": "Kamal El Wazzan",
    "mobile": "+96170948425",
    "district": "Metn",
    "area": "Sin el Fil",
    "dob": "2007-11-08",
    "gender": "Male",
    "vertical": "Tutoring,Babysitting and Nannying,Caregiving,Pet Services",
    "submittedAt": "2026-06-19T15:20:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Homework Assistance  Primary School Tutoring Study Support & Exam Preparation General Academic Support  English/French Language Support Study Skills & Organization"
        ],
        "specialtyFilterable": [
          "Homework Assistance  Primary School Tutoring Study Support & Exam Preparation General Academic Support  English/French Language Support Study Skills & Organization"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Childcare, Babysitting, Homework Assistance, Playtime Activities, Educational Activities, After-school Care."
        ],
        "specialtyFilterable": [
          "Childcare, Babysitting, Homework Assistance, Playtime Activities, Educational Activities, After-school Care."
        ]
      },
      "Caregiving": {
        "years": "2-5 years",
        "skillLevel": "",
        "specialty": [
          "Elderly Care Support, Companionship, Daily Assistance, Personal Support"
        ],
        "specialtyFilterable": [
          "Elderly Care Support, Companionship, Daily Assistance, Personal Support"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Pet Sitting, Dog Walking, Feeding, Basic Pet Care, Pet Companionship"
        ],
        "specialtyFilterable": [
          "Pet Sitting, Dog Walking, Feeding, Basic Pet Care, Pet Companionship"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "018c3b53-f53f-4aad-a33c-587a6e9bc542",
    "firstName": "Maria",
    "lastName": "Abi Fadel",
    "fullName": "Maria Abi Fadel",
    "mobile": "+96176384830",
    "district": "Keserwan",
    "area": "Jbeil",
    "dob": "2007-07-07",
    "gender": "Female",
    "vertical": "Music & Art Instructing",
    "submittedAt": "2026-06-22T09:54:00+03:00",
    "serviceDetails": {
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Fine arts (sketching, acrylic painting, watercolor)"
        ],
        "specialtyFilterable": [
          "Fine arts (sketching, acrylic painting, watercolor)"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "5949ce87-6b40-4d9e-b5cd-f2aea5c6df5f",
    "firstName": "Cecilina",
    "lastName": "Nassif",
    "fullName": "Cecilina Nassif",
    "mobile": "+96171110917",
    "district": "Metn",
    "area": "Bouchrieh",
    "dob": "2026-06-16",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-11T13:27:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math, Physics, Agenda"
        ],
        "specialtyFilterable": [
          "Math, Physics, Agenda"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "a0b2db71-d46c-4268-94e1-1a6b2b8405c1",
    "firstName": "Maria",
    "lastName": "Nader",
    "fullName": "Maria Nader",
    "mobile": "+96181324209",
    "district": "Keserwan",
    "area": "Jeita",
    "dob": "2003-08-17",
    "gender": "Female",
    "vertical": "Sport Coaching & Fitness Training",
    "submittedAt": "2026-06-26T08:27:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Tennis"
        ],
        "specialtyFilterable": [
          "Tennis"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "73ee3e9f-12ca-4c6e-b61b-d0cdde8699ff",
    "firstName": "Hanna",
    "lastName": "Yazbeck",
    "fullName": "Hanna Yazbeck",
    "mobile": "+96176760539",
    "district": "Metn",
    "area": "Beit el Chaar & Hadirat",
    "dob": "1995-05-10",
    "gender": "Male",
    "vertical": "Music & Art Instructing",
    "submittedAt": "2026-06-26T11:51:00+03:00",
    "serviceDetails": {
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Teaching drums"
        ],
        "specialtyFilterable": [
          "Teaching drums"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f6976a5c-b39d-4b13-8cac-66a3d2d57b74",
    "firstName": "Joyce",
    "lastName": "Sassine",
    "fullName": "Joyce Sassine",
    "mobile": "+96176963367",
    "district": "Metn",
    "area": "Dekwaneh",
    "dob": "2004-08-31",
    "gender": "Female",
    "vertical": "Tutoring,Home-Based Therapy,Nursing",
    "submittedAt": "2026-06-28T12:16:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Nursing"
        ],
        "specialtyFilterable": [
          "Nursing"
        ]
      },
      "Home-Based Therapy": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Education nursing care"
        ],
        "specialtyFilterable": [
          "Education nursing care"
        ]
      },
      "Nursing": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Wound care,Iv,education,garde.."
        ],
        "specialtyFilterable": [
          "Wound care,Iv,education,garde.."
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "bc6b5509-cb99-47b3-b52a-8f2879825fb9",
    "firstName": "Chloe",
    "lastName": "Naddaf",
    "fullName": "Chloe Naddaf",
    "mobile": "+96181777218",
    "district": "Metn",
    "area": "Bouchrieh",
    "dob": "2005-02-14",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-28T21:30:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "All subjects included, worked with students with hyperactivity and short attention spans"
        ],
        "specialtyFilterable": [
          "All subjects included, worked with students with hyperactivity and short attention spans"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "0e3bf671-7061-4451-a7da-b88eef6fed21",
    "firstName": "Jad",
    "lastName": "Kanaan",
    "fullName": "Jad Kanaan",
    "mobile": "+96176043348",
    "district": "Beirut",
    "area": "Ras El-Nabaa",
    "dob": "2007-06-25",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-06-30T09:32:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Organic Chemistry at the undergraduate level, sciences at the high school level"
        ],
        "specialtyFilterable": [
          "Organic Chemistry at the undergraduate level, sciences at the high school level"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "8c9c547e-4ad3-4ec0-be31-3f5d1fbaf905",
    "firstName": "Georges",
    "lastName": "Fakhoury",
    "fullName": "Georges Fakhoury",
    "mobile": "+96181401425",
    "district": "Sidon",
    "area": "",
    "dob": "2008-02-11",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Babysitting and Nannying,Tutoring",
    "submittedAt": "2026-06-30T09:41:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Chemistry, Biology"
        ],
        "specialtyFilterable": [
          "Chemistry, Biology"
        ]
      },
      "Sport Coaching & Fitness Training": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Basketball, Football"
        ],
        "specialtyFilterable": [
          "Basketball, Football"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "After school"
        ],
        "specialtyFilterable": [
          "After school"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "d4892886-0327-40f1-9f8b-5039d9406848",
    "firstName": "Sari",
    "lastName": "Alhakim",
    "fullName": "Sari Alhakim",
    "mobile": "+96178977385",
    "district": "Aley",
    "area": "",
    "dob": "2007-07-18",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training",
    "submittedAt": "2026-06-30T10:31:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Fitness and calisthenics"
        ],
        "specialtyFilterable": [
          "Fitness and calisthenics"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b31fed51-c624-4180-98c8-0d1a9256b8ad",
    "firstName": "Serena",
    "lastName": "Kallas",
    "fullName": "Serena Kallas",
    "mobile": "+96181349226",
    "district": "Keserwan",
    "area": "Zouk Mikael",
    "dob": "2006-07-10",
    "gender": "Female",
    "vertical": "Tutoring,Beauty Services",
    "submittedAt": "2026-06-30T10:52:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "BudyHub Tutoring"
        ],
        "specialtyFilterable": [
          "BudyHub Tutoring"
        ]
      },
      "Beauty Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Expert in Selling Makeup and Skincare Products"
        ],
        "specialtyFilterable": [
          "Expert in Selling Makeup and Skincare Products"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f43df871-cb27-4b07-9f53-850543e84e1e",
    "firstName": "Tracy",
    "lastName": "Jreij",
    "fullName": "Tracy Jreij",
    "mobile": "+96181961822",
    "district": "Metn",
    "area": "Ain Alak",
    "dob": "2026-06-06",
    "gender": "Male",
    "vertical": "Babysitting and Nannying,Tutoring,Other (Type Below)",
    "submittedAt": "2026-06-30T11:18:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "5-10 years",
        "skillLevel": "",
        "specialty": [
          "Math Biology Chemistry Physics"
        ],
        "specialtyFilterable": [
          "Math Biology Chemistry Physics"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "After School and Overnight"
        ],
        "specialtyFilterable": [
          "After School and Overnight"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b1be0500-6c5b-45ad-ab04-4c246553a89e",
    "firstName": "Jana",
    "lastName": "Houhou",
    "fullName": "Jana Houhou",
    "mobile": "+96176369150",
    "district": "Mount Lebanon",
    "area": "",
    "dob": "2005-03-21",
    "gender": "Female",
    "vertical": "Babysitting and Nannying,Other (Type Below),Tutoring",
    "submittedAt": "2026-06-30T11:23:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Math, English, Biology"
        ],
        "specialtyFilterable": [
          "Math, English, Biology"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Infants, 2-3 years old"
        ],
        "specialtyFilterable": [
          "Infants, 2-3 years old"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "1dcf06e7-a7e7-4125-9543-d99620460885",
    "firstName": "marielyn",
    "lastName": "hajj",
    "fullName": "marielyn hajj",
    "mobile": "+96171776492",
    "district": "Metn",
    "area": "Mansourieh",
    "dob": "2007-08-13",
    "gender": "Female",
    "vertical": "Tutoring,Music & Art Instructing",
    "submittedAt": "2026-06-30T11:34:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "bio,chemistry,agenda"
        ],
        "specialtyFilterable": [
          "bio,chemistry,agenda"
        ]
      },
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "drawing,painting,ceramics"
        ],
        "specialtyFilterable": [
          "drawing,painting,ceramics"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "8d5aff33-0dd0-4279-87f8-86bb4e4f6b83",
    "firstName": "Peter",
    "lastName": "Sfeir",
    "fullName": "Peter Sfeir",
    "mobile": "+96176587170",
    "district": "Keserwan",
    "area": "Ajaltoun",
    "dob": "2026-06-18",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Other (Type Below)",
    "submittedAt": "2026-06-30T13:23:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Basketball Coaching"
        ],
        "specialtyFilterable": [
          "Basketball Coaching"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f5e9baac-0d9b-4af2-a42e-51c052fe1b62",
    "firstName": "marie joe",
    "lastName": "maroun",
    "fullName": "marie joe maroun",
    "mobile": "+96171716777",
    "district": "Metn",
    "area": "Biakout",
    "dob": "2007-01-04",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Pet Services",
    "submittedAt": "2026-06-30T14:43:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "agenda (especially math, physics, and english)"
        ],
        "specialtyFilterable": [
          "agenda (especially math, physics, and english)"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "infants or afterschool"
        ],
        "specialtyFilterable": [
          "infants or afterschool"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "dog walking and pet sitting"
        ],
        "specialtyFilterable": [
          "dog walking and pet sitting"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "ab65831b-93bb-4da0-b8b0-84ee3885d6a4",
    "firstName": "Karl",
    "lastName": "Saroufim",
    "fullName": "Karl Saroufim",
    "mobile": "+96181338518",
    "district": "Keserwan",
    "area": "Haret Sakhr",
    "dob": "2004-01-09",
    "gender": "Male",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-06-30T17:22:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f6499ea0-683c-42a1-adc3-945da57fdbe9",
    "firstName": "Bryan",
    "lastName": "Bou Mansour",
    "fullName": "Bryan Bou Mansour",
    "mobile": "+96171372243",
    "district": "Keserwan",
    "area": "Bouar",
    "dob": "2002-08-05",
    "gender": "Male",
    "vertical": "Tutoring,Other (Type Below)",
    "submittedAt": "2026-06-30T23:03:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "2-5 years",
        "skillLevel": "",
        "specialty": [
          "Agenda/university scientific courses and civil/structural engineering courses and civil structural engineering softwares ETABS SAFE Plaxis 2D Adapt post tension and geo5 amd ram concept"
        ],
        "specialtyFilterable": [
          "Agenda/university scientific courses and civil/structural engineering courses and civil structural engineering softwares ETABS SAFE Plaxis 2D Adapt post tension and geo5 amd ram concept"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "a29d6ae0-1b8a-4ce5-9fb8-82c5dd1cf743",
    "firstName": "Elissa",
    "lastName": "Gerges",
    "fullName": "Elissa Gerges",
    "mobile": "+96170467760",
    "district": "Jbeil",
    "area": "",
    "dob": "2004-09-25",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-01T08:13:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Arabic, french, any course related to law"
        ],
        "specialtyFilterable": [
          "Arabic, french, any course related to law"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "1275c1c0-5cca-4ab9-8837-e4b89540999f",
    "firstName": "Rita Maria",
    "lastName": "ALDahr",
    "fullName": "Rita Maria ALDahr",
    "mobile": "+96170376366",
    "district": "North Lebanon",
    "area": "",
    "dob": "2002-02-14",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-01T11:20:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "1945e3a0-7925-4350-946f-df13d13ee592",
    "firstName": "Tarek",
    "lastName": "Hossari",
    "fullName": "Tarek Hossari",
    "mobile": "+96176954152",
    "district": "Beirut",
    "area": "Sanayeh",
    "dob": "2003-09-18",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Tutoring",
    "submittedAt": "2026-07-01T12:19:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math , biology"
        ],
        "specialtyFilterable": [
          "Math , biology"
        ]
      },
      "Sport Coaching & Fitness Training": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "PT , strength and conditionning"
        ],
        "specialtyFilterable": [
          "PT , strength and conditionning"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "59deffcd-5366-4f9b-9730-584559660d4a",
    "firstName": "Elie",
    "lastName": "Mounsef Abboud",
    "fullName": "Elie Mounsef Abboud",
    "mobile": "+96179317498",
    "district": "Metn",
    "area": "Dbayeh",
    "dob": "2002-08-10",
    "gender": "Male",
    "vertical": "Tutoring,Sport Coaching & Fitness Training",
    "submittedAt": "2026-06-15T14:09:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "History, Geography,English, French, Spanish, essay writing"
        ],
        "specialtyFilterable": [
          "History, Geography,English, French, Spanish, essay writing"
        ]
      },
      "Sport Coaching & Fitness Training": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Soccer, basketball"
        ],
        "specialtyFilterable": [
          "Soccer, basketball"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "39a8edcc-8fd8-47a7-a786-8a5005f79dcb",
    "firstName": "Charbel",
    "lastName": "Haddad",
    "fullName": "Charbel Haddad",
    "mobile": "+96176527774",
    "district": "Keserwan",
    "area": "Zouk Mikael",
    "dob": "2000-08-02",
    "gender": "Male",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-01T20:05:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "97e7fd06-7bd0-4583-9b67-9781991720cf",
    "firstName": "Marilynn",
    "lastName": "Bteich",
    "fullName": "Marilynn Bteich",
    "mobile": "+96171326238",
    "district": "Keserwan",
    "area": "Kfardebiane",
    "dob": "2004-05-14",
    "gender": "Female",
    "vertical": "Music & Art Instructing",
    "submittedAt": "2026-07-01T22:29:00+03:00",
    "serviceDetails": {
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Piano"
        ],
        "specialtyFilterable": [
          "Piano"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "ba1ce693-7bfb-44a2-bab1-7423ac3daf20",
    "firstName": "Maritta",
    "lastName": "Chahine",
    "fullName": "Maritta Chahine",
    "mobile": "+96176338443",
    "district": "Metn",
    "area": "Ain Alak",
    "dob": "2026-07-25",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-03T00:06:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "01676fd5-0510-4da5-bc92-45615a194027",
    "firstName": "Tanios",
    "lastName": "Bou Diwan",
    "fullName": "Tanios Bou Diwan",
    "mobile": "+96171475503",
    "district": "Metn",
    "area": "Baabdat",
    "dob": "2002-10-20",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-03T04:53:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math, Physics, Programming"
        ],
        "specialtyFilterable": [
          "Math, Physics, Programming"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f90868dc-357b-413b-bea3-5afad805c83b",
    "firstName": "Georges",
    "lastName": "Succar",
    "fullName": "Georges Succar",
    "mobile": "+96176099421",
    "district": "Metn",
    "area": "Rabweh",
    "dob": "2001-10-30",
    "gender": "Male",
    "vertical": "Tutoring,Caregiving,Home-Based Therapy,Other (Type Below)",
    "submittedAt": "2026-07-03T12:18:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "2-5 years",
        "skillLevel": "",
        "specialty": [
          "Agenda with focus on biology and humanities"
        ],
        "specialtyFilterable": [
          "Agenda with focus on biology and humanities"
        ]
      },
      "Home-Based Therapy": {
        "years": "2-5 years",
        "skillLevel": "",
        "specialty": [
          "Special education / ABA"
        ],
        "specialtyFilterable": [
          "Special education / ABA"
        ]
      },
      "Caregiving": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Disability and inclusion support"
        ],
        "specialtyFilterable": [
          "Disability and inclusion support"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "56e137e9-2e61-4138-81ec-361cf067b33f",
    "firstName": "Fatima",
    "lastName": "Cheaito",
    "fullName": "Fatima Cheaito",
    "mobile": "+96181102395",
    "district": "Beirut",
    "area": "Beirut",
    "dob": "2001-10-02",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-05T14:21:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math"
        ],
        "specialtyFilterable": [
          "Math"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "73a424e9-eb31-4b30-95ea-e8a4e45fca51",
    "firstName": "Amin",
    "lastName": "Fawaz",
    "fullName": "Amin Fawaz",
    "mobile": "+96171535010",
    "district": "Beirut",
    "area": "Mazraa",
    "dob": "2006-12-07",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-06T08:46:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math and Physics"
        ],
        "specialtyFilterable": [
          "Math and Physics"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "e582c80f-adda-4660-afaa-1668acf6bd64",
    "firstName": "Sally",
    "lastName": "Khairallah",
    "fullName": "Sally Khairallah",
    "mobile": "+9613486518",
    "district": "Keserwan",
    "area": "Zouk Mosbeh",
    "dob": "2004-01-04",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-06T16:29:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "e45fcf56-f1f4-4b47-8b42-36893b5df523",
    "firstName": "Alexa",
    "lastName": "Acaf",
    "fullName": "Alexa Acaf",
    "mobile": "+96181123540",
    "district": "Keserwan",
    "area": "Aramoun",
    "dob": "2006-11-06",
    "gender": "Female",
    "vertical": "Babysitting and Nannying",
    "submittedAt": "2026-07-06T16:29:00+03:00",
    "serviceDetails": {
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "After school"
        ],
        "specialtyFilterable": [
          "After school"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f7543dc9-d0d6-414f-bd4f-6cf9cfe80255",
    "firstName": "Patil",
    "lastName": "Ozkochian",
    "fullName": "Patil Ozkochian",
    "mobile": "+96181545752",
    "district": "Metn",
    "area": "Beit El Kekko",
    "dob": "2007-11-04",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-06T16:31:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "b85942a9-dc4a-4f1b-984a-520f355b3f0a",
    "firstName": "Nicolas",
    "lastName": "Salameh",
    "fullName": "Nicolas Salameh",
    "mobile": "+96181433211",
    "district": "Keserwan",
    "area": "Zouk Mosbeh",
    "dob": "2007-05-16",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-06T16:29:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math, physics , chemistry"
        ],
        "specialtyFilterable": [
          "Math, physics , chemistry"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "5eef478c-e31f-43f5-8366-c7101d52bf83",
    "firstName": "Anthony",
    "lastName": "Aouad",
    "fullName": "Anthony Aouad",
    "mobile": "+96183626498",
    "district": "Keserwan",
    "area": "Adonis",
    "dob": "2005-09-13",
    "gender": "Male",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-06T17:00:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f2c3323e-3712-4f35-8911-40f565ee1e5c",
    "firstName": "Joseph",
    "lastName": "Yammine",
    "fullName": "Joseph Yammine",
    "mobile": "+96171626646",
    "district": "Metn",
    "area": "Bsalim",
    "dob": "2026-04-07",
    "gender": "Male",
    "vertical": "Sport Coaching & Fitness Training,Babysitting and Nannying,Pet Services,Home-Based Therapy",
    "submittedAt": "2026-07-06T18:38:00+03:00",
    "serviceDetails": {
      "Sport Coaching & Fitness Training": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "PT, Taekwondo"
        ],
        "specialtyFilterable": [
          "PT, Taekwondo"
        ]
      },
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "After school, overnight"
        ],
        "specialtyFilterable": [
          "After school, overnight"
        ]
      },
      "Home-Based Therapy": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "OT"
        ],
        "specialtyFilterable": [
          "OT"
        ]
      },
      "Pet Services": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Dog walking, grooming, training"
        ],
        "specialtyFilterable": [
          "Dog walking, grooming, training"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "8de0dad2-4c97-45cf-92e7-67fb07f38274",
    "firstName": "julie",
    "lastName": "Abboud",
    "fullName": "julie Abboud",
    "mobile": "+39389955544",
    "district": "Metn",
    "area": "Dbayeh",
    "dob": "1999-05-28",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-06T22:42:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "46a99f4f-cbb7-4735-b7eb-d1ef54fbe55f",
    "firstName": "Ghada",
    "lastName": "Saliby",
    "fullName": "Ghada Saliby",
    "mobile": "+96171517741",
    "district": "Metn",
    "area": "Dbayeh",
    "dob": "1971-08-12",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-06T22:59:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Agenda, Technology, French, Maths, Physics, Chemistry, History, Arabic, Computer science,"
        ],
        "specialtyFilterable": [
          "Agenda, Technology, French, Maths, Physics, Chemistry, History, Arabic, Computer science,"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "f592772c-52c7-47b9-a4c4-78bd9a17e873",
    "firstName": "Karen",
    "lastName": "Fayad",
    "fullName": "Karen Fayad",
    "mobile": "+96181731136",
    "district": "Metn",
    "area": "Mansourieh",
    "dob": "2005-10-23",
    "gender": "Female",
    "vertical": "Tutoring,Babysitting and Nannying,Music & Art Instructing",
    "submittedAt": "2026-07-06T23:33:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Drawing"
        ],
        "specialtyFilterable": [
          "Drawing"
        ]
      },
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Drawing, painting, arts & crafts, creative workshops for kids"
        ],
        "specialtyFilterable": [
          "Drawing, painting, arts & crafts, creative workshops for kids"
        ]
      },
      "Babysitting and Nannying": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "After-school babysitting, creative play, homework help, arts & crafts, simple snacks, child supervision"
        ],
        "specialtyFilterable": [
          "After-school babysitting, creative play, homework help, arts & crafts, simple snacks, child supervision"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "297642b7-7a0f-43cd-a27b-a9d1f852d267",
    "firstName": "Christian",
    "lastName": "Achi",
    "fullName": "Christian Achi",
    "mobile": "+96178864096",
    "district": "Keserwan",
    "area": "Adma",
    "dob": "2006-04-13",
    "gender": "Male",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-07T00:58:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "6f037428-9438-43c9-ba1d-0f4f9d81b2b4",
    "firstName": "Anthony",
    "lastName": "Rizk",
    "fullName": "Anthony Rizk",
    "mobile": "+96170611431",
    "district": "Keserwan",
    "area": "Jounieh",
    "dob": "2002-07-27",
    "gender": "Male",
    "vertical": "Tutoring,Other (Type Below)",
    "submittedAt": "2026-07-07T11:28:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "Under 2 years",
        "skillLevel": "",
        "specialty": [
          "Math, Physics"
        ],
        "specialtyFilterable": [
          "Math, Physics"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "dfa4ac95-538c-4581-a996-367f36441114",
    "firstName": "charelle",
    "lastName": "assaf",
    "fullName": "charelle assaf",
    "mobile": "+96170553336",
    "district": "Keserwan",
    "area": "Bouar",
    "dob": "2006-04-21",
    "gender": "Female",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-07T11:02:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "agenda and all subjects ( specially: math, physics, chemistry)"
        ],
        "specialtyFilterable": [
          "agenda and all subjects ( specially: math, physics, chemistry)"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "fdae0d71-6902-4caf-ab9e-24c78cb37953",
    "firstName": "Oliver",
    "lastName": "Hanna",
    "fullName": "Oliver Hanna",
    "mobile": "+96170321652",
    "district": "Keserwan",
    "area": "Zouk Mikael",
    "dob": "2005-06-20",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-06T16:11:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Agenda for 6th grade students and below, scientific subjects for grade 7 and above,  entry business courses for university students."
        ],
        "specialtyFilterable": [
          "Agenda for 6th grade students and below, scientific subjects for grade 7 and above,  entry business courses for university students."
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "023179a6-d4ff-4b68-84de-c273a28244d5",
    "firstName": "Christopher",
    "lastName": "Farah",
    "fullName": "Christopher Farah",
    "mobile": "+96181399334",
    "district": "Keserwan",
    "area": "Zouk Mosbeh",
    "dob": "2007-07-18",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-08T12:43:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Mathematics"
        ],
        "specialtyFilterable": [
          "Mathematics"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "06a48a19-9f55-46fe-b3d9-3489308ea8c1",
    "firstName": "Hanadi",
    "lastName": "Slim",
    "fullName": "Hanadi Slim",
    "mobile": "+96176475961",
    "district": "Beirut",
    "area": "Barbir",
    "dob": "1973-02-22",
    "gender": "Female",
    "vertical": "Nursing",
    "submittedAt": "2026-07-09T16:53:00+03:00",
    "serviceDetails": {
      "Nursing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "All services"
        ],
        "specialtyFilterable": [
          "All services"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "ae34cd25-b36d-49c6-81c1-4572f857e468",
    "firstName": "Josiane",
    "lastName": "El Gemayel",
    "fullName": "Josiane El Gemayel",
    "mobile": "+96176662983",
    "district": "Metn",
    "area": "Antelias",
    "dob": "2025-06-01",
    "gender": "Female",
    "vertical": "Other (Type Below)",
    "submittedAt": "2026-07-10T11:16:00+03:00",
    "serviceDetails": {}
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "58e16103-6586-4397-ad3e-3d9141bb9dae",
    "firstName": "Charbel",
    "lastName": "El-Hajj",
    "fullName": "Charbel El-Hajj",
    "mobile": "+96176552517",
    "district": "Keserwan",
    "area": "Jounieh",
    "dob": "2002-07-21",
    "gender": "Male",
    "vertical": "Tutoring",
    "submittedAt": "2026-07-10T14:50:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Agenda"
        ],
        "specialtyFilterable": [
          "Agenda"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "a6c5ddba-40ca-418d-9c8d-358f34c5115e",
    "firstName": "Victoria",
    "lastName": "Aoun",
    "fullName": "Victoria Aoun",
    "mobile": "+96171193835",
    "district": "Keserwan",
    "area": "Jounieh",
    "dob": "2005-08-11",
    "gender": "Female",
    "vertical": "Tutoring,Caregiving",
    "submittedAt": "2026-07-09T15:09:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "grade 1 to grade 9"
        ],
        "specialtyFilterable": [
          "grade 1 to grade 9"
        ]
      },
      "Caregiving": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "kids"
        ],
        "specialtyFilterable": [
          "kids"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "70101f3f-5611-47af-be5d-c588ed2d671e",
    "firstName": "josine",
    "lastName": "kayem",
    "fullName": "josine kayem",
    "mobile": "+96181949977",
    "district": "Keserwan",
    "area": "Jeita",
    "dob": "2026-06-02",
    "gender": "Female",
    "vertical": "Babysitting and Nannying",
    "submittedAt": "2026-06-15T17:15:00+03:00",
    "serviceDetails": {
      "Babysitting and Nannying": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Summer camp"
        ],
        "specialtyFilterable": [
          "Summer camp"
        ]
      }
    }
  },
  {
    "source": "legacy",
    "legacy": true,
    "submissionId": "964b282f-c780-4b5f-a7a8-cd58857cfc2c",
    "firstName": "David",
    "lastName": "Waked",
    "fullName": "David Waked",
    "mobile": "+96178907680",
    "district": "Metn",
    "area": "Dik El Mehdi",
    "dob": "2006-01-04",
    "gender": "Male",
    "vertical": "Tutoring,Music & Art Instructing",
    "submittedAt": "2026-07-12T18:16:00+03:00",
    "serviceDetails": {
      "Tutoring": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Math, Physics, Agenda"
        ],
        "specialtyFilterable": [
          "Math, Physics, Agenda"
        ]
      },
      "Music & Art Instructing": {
        "years": "",
        "skillLevel": "",
        "specialty": [
          "Bass Guitar"
        ],
        "specialtyFilterable": [
          "Bass Guitar"
        ]
      }
    }
  }
];
