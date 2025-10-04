/**
 * Campaign-Specific Proper Nouns Dictionary
 *
 * Correct spellings and capitalizations for:
 * - Candidate names
 * - Politicians
 * - Organizations
 * - Programs
 * - Virginia-specific terms
 */

const campaignProperNounsDictionary = {
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-10-04',
    campaign: 'Spanberger for Governor',
    state: 'Virginia'
  },

  /**
   * Candidate Names - MUST be spelled exactly
   */
  candidates: {
    'Abigail Spanberger': {
      correctSpelling: 'Abigail Spanberger',
      commonMisspellings: ['Spanberg', 'Spanburger', 'Spamberger'],
      firstReference: 'Abigail Spanberger',
      subsequentReferences: ['Spanberger'],
      titles: ['Rep. Spanberger', 'former Rep. Spanberger', 'Congresswoman Spanberger'],
      notes: 'Former U.S. Representative, running for Governor of Virginia'
    },

    'Winsome Earle-Sears': {
      correctSpelling: 'Winsome Earle-Sears',
      commonMisspellings: ['Earl-Sears', 'Earle Sears', 'Winsom'],
      firstReference: 'Winsome Earle-Sears',
      subsequentReferences: ['Earle-Sears'],
      titles: ['Lt. Gov. Earle-Sears', 'Lieutenant Governor Earle-Sears'],
      notes: 'Current Lieutenant Governor of Virginia, hyphenated last name REQUIRED'
    }
  },

  /**
   * Virginia Politicians
   */
  virginiaPoliticians: {
    'Glenn Youngkin': {
      correctSpelling: 'Glenn Youngkin',
      titles: ['Gov. Youngkin', 'Governor Glenn Youngkin'],
      office: 'Governor of Virginia'
    },

    'Tim Kaine': {
      correctSpelling: 'Tim Kaine',
      titles: ['Sen. Kaine', 'Senator Tim Kaine'],
      office: 'U.S. Senator from Virginia'
    },

    'Mark Warner': {
      correctSpelling: 'Mark Warner',
      titles: ['Sen. Warner', 'Senator Mark Warner'],
      office: 'U.S. Senator from Virginia'
    }
  },

  /**
   * National Politicians
   */
  nationalPoliticians: {
    'Donald Trump': {
      correctSpelling: 'Donald Trump',
      commonMisspellings: ['Trump'],
      titles: ['President Trump', 'former President Trump'],
      notes: 'Use full name on first reference, "Trump" thereafter'
    },

    'Joe Biden': {
      correctSpelling: 'Joe Biden',
      titles: ['President Biden'],
      office: 'President of the United States'
    },

    'Kamala Harris': {
      correctSpelling: 'Kamala Harris',
      commonMisspellings: ['Kamela', 'Kamalla'],
      titles: ['Vice President Harris', 'VP Harris'],
      office: 'Vice President of the United States'
    }
  },

  /**
   * Organizations & Programs
   */
  organizations: {
    'DOGE': {
      fullName: 'Department of Government Efficiency',
      acronym: 'DOGE',
      usage: 'DOGE or Department of Government Efficiency',
      notes: 'Trump administration program for federal workforce reduction',
      context: 'Negative - threat to Virginia federal workers'
    },

    'FEC': {
      fullName: 'Federal Election Commission',
      acronym: 'FEC',
      correctSpelling: 'Federal Election Commission',
      usage: 'Spell out on first reference, FEC thereafter'
    },

    'U.S. Chamber of Commerce': {
      correctSpelling: 'U.S. Chamber of Commerce',
      commonMisspellings: ['US Chamber of Commerce', 'Chamber of Commerce'],
      notes: 'Include "U.S." for specificity'
    },

    'UVA': {
      fullName: 'University of Virginia',
      acronym: 'UVA',
      acceptableVariations: ['University of Virginia', 'UVA'],
      notes: 'Either form acceptable after first reference'
    },

    'CNBC': {
      fullName: 'CNBC',
      usage: 'CNBC (no need to spell out)',
      context: 'Reference to "America\'s Top State for Business" ranking'
    }
  },

  /**
   * Virginia-Specific Terms
   */
  virginiaTerms: {
    'Commonwealth': {
      usage: 'Commonwealth (when referring to Virginia)',
      correctSpelling: 'Commonwealth of Virginia',
      notes: 'Virginia is a Commonwealth, not a state (technically)'
    },

    'House of Delegates': {
      correctSpelling: 'House of Delegates',
      commonMisspellings: ['house of delegates', 'House of delegates'],
      abbreviation: 'None (spell out)',
      notes: 'Virginia\'s lower house of the General Assembly'
    },

    'General Assembly': {
      correctSpelling: 'General Assembly',
      usage: 'Virginia General Assembly',
      notes: 'Virginia\'s legislature'
    },

    'Richmond': {
      correctSpelling: 'Richmond, Va.',
      usage: 'Richmond (city) or Richmond, Va. (in datelines)',
      notes: 'Capital of Virginia'
    },

    'Norfolk': {
      correctSpelling: 'Norfolk, Va.',
      notes: 'Major Virginia city, home to military installations'
    }
  },

  /**
   * Policy Terms & Programs
   */
  policyTerms: {
    'Affordable Care Act': {
      correctSpelling: 'Affordable Care Act',
      acronym: 'ACA',
      avoid: ['Obamacare'],
      usage: 'Spell out as "Affordable Care Act" or use "ACA"',
      notes: 'Democratic preferred terminology'
    },

    'Right to Contraception Act': {
      correctSpelling: 'Right to Contraception Act',
      notes: 'Specific legislation'
    },

    'Medicare': {
      correctSpelling: 'Medicare',
      commonMisspellings: ['medicare', 'Medi-care'],
      notes: 'Always capitalize'
    },

    'Medicaid': {
      correctSpelling: 'Medicaid',
      commonMisspellings: ['medicaid', 'Medi-caid'],
      notes: 'Always capitalize'
    }
  },

  /**
   * Places & Geographic Terms
   */
  virginiaLocations: {
    'Virginia': {
      correctSpelling: 'Virginia',
      abbreviation: 'Va.',
      apStyleAbbreviation: 'Va. (in datelines and with city names)',
      notes: 'Do not abbreviate when standing alone'
    },

    'Northern Virginia': {
      correctSpelling: 'Northern Virginia',
      notes: 'Distinct region, capitalize both words'
    },

    'Hampton Roads': {
      correctSpelling: 'Hampton Roads',
      notes: 'Southeastern Virginia region'
    },

    'Shenandoah Valley': {
      correctSpelling: 'Shenandoah Valley',
      notes: 'Western Virginia region'
    }
  },

  /**
   * Common Acronyms & Abbreviations
   */
  acronyms: {
    'GOP': {
      meaning: 'Grand Old Party (Republican Party)',
      usage: 'GOP is acceptable without spelling out',
      notes: 'Widely recognized acronym for Republican Party'
    },

    'MAGA': {
      meaning: 'Make America Great Again',
      usage: 'MAGA (Trump slogan/movement)',
      context: 'Use as modifier: "MAGA Republican"',
      notes: 'Associated with Trump and far-right politics'
    },

    'PAC': {
      fullName: 'Political Action Committee',
      usage: 'Spell out on first reference, PAC thereafter'
    },

    'DNC': {
      fullName: 'Democratic National Committee',
      usage: 'Spell out on first reference, DNC thereafter'
    },

    'RNC': {
      fullName: 'Republican National Committee',
      usage: 'Spell out on first reference, RNC thereafter'
    }
  },

  /**
   * Validation Patterns
   */
  validationPatterns: {
    // Check for hyphen in Earle-Sears
    earleSearsHyphen: {
      correct: /Earle-Sears/,
      incorrect: /Earle\s+Sears|Earl-Sears/,
      error: 'Must be "Earle-Sears" with hyphen',
      correction: 'Earle-Sears'
    },

    // Check for proper Spanberger spelling
    spanbergerSpelling: {
      correct: /Spanberger/,
      incorrect: /Span(?:berg|burger|amberger)/i,
      error: 'Incorrect spelling of "Spanberger"',
      correction: 'Spanberger'
    },

    // Check DOGE capitalization
    dogeCapitalization: {
      correct: /DOGE/,
      incorrect: /doge|Doge/,
      error: 'DOGE should be all caps',
      correction: 'DOGE'
    },

    // Commonwealth capitalization
    commonwealthCap: {
      correct: /Commonwealth/,
      incorrect: /commonwealth/,
      error: 'Capitalize "Commonwealth" when referring to Virginia',
      correction: 'Commonwealth'
    }
  },

  /**
   * Name Spelling Checker
   */
  getCorrectSpelling(name) {
    // Search all dictionaries for the name
    const allDictionaries = [
      this.candidates,
      this.virginiaPoliticians,
      this.nationalPoliticians
    ];

    for (const dict of allDictionaries) {
      for (const [correctName, data] of Object.entries(dict)) {
        if (data.commonMisspellings) {
          for (const misspelling of data.commonMisspellings) {
            if (new RegExp(misspelling, 'i').test(name)) {
              return {
                incorrect: name,
                correct: correctName,
                error: `Misspelling of "${correctName}"`
              };
            }
          }
        }
      }
    }

    return null;
  }
};

module.exports = campaignProperNounsDictionary;
