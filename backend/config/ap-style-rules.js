/**
 * AP Style Rules for Political Campaign Communications
 *
 * Based on Associated Press Stylebook standards commonly used in
 * political press releases, journalism, and campaign communications.
 *
 * Key principle: NO Oxford commas (AP Style standard)
 */

const apStyleRules = {
  metadata: {
    version: '1.0.0',
    standard: 'AP Stylebook',
    lastUpdated: '2025-10-04',
    oxfordComma: false // AP Style does NOT use Oxford commas
  },

  /**
   * Comma Rules (AP Style)
   */
  commaRules: {
    oxfordComma: {
      rule: 'Do NOT use Oxford comma (serial comma)',
      correct: 'red, white and blue',
      incorrect: 'red, white, and blue',
      pattern: /,\s+and\s+/g,
      description: 'AP Style does not use the Oxford/serial comma before the final item in a list'
    },
    introductoryPhrases: {
      rule: 'Use comma after introductory phrases',
      correct: 'In Virginia, families are struggling with costs.',
      incorrect: 'In Virginia families are struggling with costs.',
      pattern: /^(?:In|On|At|For|With|During|After|Before)\s+[^,]+\s+[A-Z]/
    }
  },

  /**
   * Number Rules (AP Style)
   */
  numberRules: {
    spellOutOneToNine: {
      rule: 'Spell out numbers one through nine; use figures for 10 and above',
      correct: 'nine families, 10 businesses',
      incorrect: '9 families, ten businesses',
      exceptions: ['ages', 'percentages', 'money', 'addresses', 'times', 'votes', 'statistics']
    },
    percentages: {
      rule: 'Use figures for percentages, use "percent" not "%"',
      correct: '15 percent',
      incorrect: '15%',
      pattern: /\d+%/g
    },
    millions: {
      rule: 'Use figures with million, billion, trillion',
      correct: '$5 million',
      incorrect: '$5,000,000 or five million dollars',
      pattern: /\$\d+(?:,\d{3}){2,}/g
    },
    money: {
      rule: 'Use $ with figures, spell out cents',
      correct: '$5, $10 million, 5 cents',
      incorrect: 'five dollars, $0.05'
    }
  },

  /**
   * Date and Time Rules (AP Style)
   */
  dateTimeRules: {
    months: {
      rule: 'Abbreviate months when used with specific date; spell out when used alone',
      abbreviations: {
        'January': 'Jan.',
        'February': 'Feb.',
        'March': 'March',
        'April': 'April',
        'May': 'May',
        'June': 'June',
        'July': 'July',
        'August': 'Aug.',
        'September': 'Sept.',
        'October': 'Oct.',
        'November': 'Nov.',
        'December': 'Dec.'
      },
      correct: 'Oct. 15, 2025 (with date) or October 2025 (without date)',
      incorrect: 'October 15, 2025 or Oct. 2025'
    },
    daysOfWeek: {
      rule: 'Spell out days of week; do not abbreviate except in tables',
      correct: 'Monday, Tuesday',
      incorrect: 'Mon., Tues.'
    },
    time: {
      rule: 'Use figures; lowercase a.m. and p.m. with periods',
      correct: '9 a.m., 5:30 p.m., noon, midnight',
      incorrect: '9 AM, 5:30 PM, 12 p.m. (for noon)'
    }
  },

  /**
   * Title and Name Rules (AP Style)
   */
  titleRules: {
    capitalization: {
      rule: 'Capitalize formal titles before names; lowercase after names or when used alone',
      correct: 'President Biden, Gov. Youngkin, former Rep. Spanberger',
      incorrect: 'president Biden, Governor Youngkin'
    },
    abbreviations: {
      rule: 'Abbreviate certain titles before full names',
      abbreviations: {
        'Governor': 'Gov.',
        'Lieutenant Governor': 'Lt. Gov.',
        'Senator': 'Sen.',
        'Representative': 'Rep.',
        'Doctor': 'Dr.',
        'Reverend': 'Rev.',
        'Professor': 'Prof.'
      },
      doNotAbbreviate: ['President', 'Vice President', 'Attorney General']
    },
    former: {
      rule: 'Use "former" not "ex-" for past officeholders',
      correct: 'former Rep. Spanberger',
      incorrect: 'ex-Rep. Spanberger'
    }
  },

  /**
   * State Name Rules (AP Style)
   */
  stateRules: {
    abbreviations: {
      rule: 'Use AP state abbreviations in datelines and with city names',
      examples: {
        'Virginia': 'Va.',
        'California': 'Calif.',
        'Massachusetts': 'Mass.',
        'Pennsylvania': 'Pa.'
      },
      neverAbbreviate: [
        'Alaska', 'Hawaii', 'Idaho', 'Iowa', 'Maine', 'Ohio',
        'Texas', 'Utah'
      ],
      correct: 'Richmond, Va.',
      incorrect: 'Richmond, VA or Richmond, Virginia (in datelines)'
    },
    standalone: {
      rule: 'Spell out state names when used alone',
      correct: 'Virginia families',
      incorrect: 'Va. families'
    }
  },

  /**
   * Political Terms (AP Style)
   */
  politicalTerms: {
    party: {
      rule: 'Lowercase "party" unless part of formal name',
      correct: 'the Democratic Party, the Republican Party, party members',
      incorrect: 'the democratic party, Democratic party members'
    },
    administration: {
      rule: 'Lowercase "administration"',
      correct: 'the Biden administration, the Trump administration',
      incorrect: 'the Biden Administration'
    },
    congress: {
      rule: 'Capitalize "Congress" and "Congressional"',
      correct: 'Congress, Congressional district',
      incorrect: 'congress, congressional district'
    },
    federal: {
      rule: 'Lowercase "federal" unless part of formal name',
      correct: 'federal government, Federal Election Commission',
      incorrect: 'Federal Government'
    }
  },

  /**
   * Commonly Confused Words
   */
  confusedWords: {
    'affect vs. effect': {
      affect: 'verb (usually) - to influence',
      effect: 'noun (usually) - a result',
      correct: 'Policies affect families. The effect is harmful.',
      pattern: /\b(affect|effect)\b/gi
    },
    'compose vs. comprise': {
      compose: 'parts compose the whole',
      comprise: 'whole comprises the parts',
      correct: '50 states compose the nation. The nation comprises 50 states.',
      incorrect: 'comprised of (never use this)',
      pattern: /\bcomprised of\b/gi
    },
    'more than vs. over': {
      rule: 'Use "more than" with numbers; "over" for spatial relationships',
      correct: 'more than 100 people',
      incorrect: 'over 100 people',
      pattern: /\bover\s+\d+/gi
    }
  },

  /**
   * Quotation Rules (AP Style)
   */
  quotationRules: {
    punctuation: {
      rule: 'Periods and commas go INSIDE quotation marks',
      correct: '"We will fight," she said.',
      incorrect: '"We will fight", she said.'
    },
    attribution: {
      rule: 'Use "said" not "stated" for attribution',
      correct: 'Spanberger said',
      incorrect: 'Spanberger stated',
      avoidWords: ['stated', 'declared', 'proclaimed', 'articulated']
    }
  },

  /**
   * Capitalization Rules (AP Style)
   */
  capitalizationRules: {
    headlines: {
      rule: 'Capitalize first word and proper nouns only',
      correct: 'Spanberger announces healthcare plan',
      incorrect: 'Spanberger Announces Healthcare Plan'
    },
    jobTitles: {
      rule: 'Capitalize formal titles before names; lowercase after',
      correct: 'Gov. Spanberger, Spanberger, the governor',
      incorrect: 'the Governor'
    }
  },

  /**
   * Campaign-Specific Style Rules
   */
  campaignSpecificRules: {
    candidateName: {
      rule: 'First reference: Full name. Subsequent: Last name only',
      correct: 'Abigail Spanberger... Spanberger said...',
      incorrect: 'Abigail... Ms. Spanberger... Rep. Spanberger (after first ref)'
    },
    FOR_IMMEDIATE_RELEASE: {
      rule: 'All caps, followed by contact info',
      correct: 'FOR IMMEDIATE RELEASE\nContact: ...',
      pattern: /^FOR IMMEDIATE RELEASE/
    },
    tripleHash: {
      rule: 'End press releases with ### or -30-',
      correct: '###',
      pattern: /#{3}|-30-/
    }
  },

  /**
   * Readability Rules (Political Writing)
   */
  readabilityRules: {
    sentenceLength: {
      rule: 'Average sentence length should be 15-20 words',
      warning: 'Sentences over 30 words are hard to read',
      critical: 'Sentences over 40 words should be split'
    },
    paragraphLength: {
      rule: 'Press release paragraphs: 2-3 sentences max',
      warning: 'Paragraphs over 5 sentences are too long for media'
    },
    passiveVoice: {
      rule: 'Minimize passive voice; use active voice',
      correct: 'Spanberger announced the plan',
      incorrect: 'The plan was announced by Spanberger',
      pattern: /\b(?:was|were|is|are|been|being)\s+\w+ed\b/gi
    }
  },

  /**
   * Prohibited Patterns (Common Errors)
   */
  prohibitedPatterns: [
    {
      pattern: /\bcomprised of\b/gi,
      error: '"comprised of" is always wrong',
      correction: 'Use "composed of" or "comprises"'
    },
    {
      pattern: /\bover\s+\d+/gi,
      error: 'Use "more than" with numbers, not "over"',
      correction: 'more than [number]'
    },
    {
      pattern: /\d+%/g,
      error: 'Use "percent" not "%"',
      correction: '[number] percent'
    },
    {
      pattern: /,\s+and\s+(?=[A-Z])/g,
      error: 'Oxford comma detected (AP Style does not use)',
      correction: 'Remove comma before "and"',
      severity: 'warning' // Not always wrong, but flag for review
    },
    {
      pattern: /\bex-(?:Rep|Sen|Gov)/gi,
      error: 'Use "former" not "ex-"',
      correction: 'former [title]'
    },
    {
      pattern: /\b(?:Jan|Feb|Aug|Sept|Oct|Nov|Dec)\s+\d{4}\b/g,
      error: 'Do not abbreviate month without specific date',
      correction: 'Spell out month when used without date'
    }
  ],

  /**
   * Democratic Messaging Guidelines (Campaign-Specific)
   */
  democraticMessagingRules: {
    preferredTerms: {
      'healthcare': 'Use "healthcare" not "health care"',
      'working families': 'Preferred over "working class"',
      'reproductive rights': 'Preferred over "abortion rights"',
      'gun safety': 'Preferred over "gun control"',
      'climate crisis': 'Preferred over "climate change"',
      'extremist': 'Use for MAGA Republicans; avoid "radical"'
    },
    avoidTerms: [
      'illegal immigrant/alien (use "undocumented immigrant")',
      'Obamacare (use "Affordable Care Act" or "ACA")',
      'entitlements (use "earned benefits")',
      'welfare (use "public assistance")',
      'tax relief (Republican framing; use "tax cuts")'
    ],
    opponentNaming: {
      rule: 'Use full name on first reference, last name after',
      correct: 'Winsome Earle-Sears... Earle-Sears',
      attachModifiers: ['MAGA Republican', 'extremist', 'Trump ally']
    }
  }
};

module.exports = apStyleRules;
