/**
 * Political Capitalization Dictionary
 *
 * Context-aware rules for capitalizing political terms correctly.
 * Distinguishes between proper nouns (parties, titles) and common nouns (concepts, processes).
 */

const politicalCapitalizationDictionary = {
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-10-04',
    purpose: 'Context-aware capitalization for political writing'
  },

  /**
   * Party Names - Always capitalize when referring to political parties
   */
  partyNames: {
    'Democratic': {
      capitalize: 'When referring to the Democratic Party',
      lowercase: 'When referring to democratic principles/process/systems',
      patterns: {
        shouldCapitalize: [
          /Democratic\s+Party/i,
          /Democratic\s+(?:candidate|candidates|nominee|senator|representative|governor)/i,
          /Democratic\s+National\s+Committee/i,
          /the\s+Democrats/i
        ],
        shouldLowercase: [
          /democratic\s+(?:process|principles|values|system|society|government|institution)/i,
          /more\s+democratic/i,
          /truly\s+democratic/i,
          /democratic\s+way/i
        ]
      },
      examples: {
        correct: [
          'the Democratic Party',
          'Democratic candidates',
          'Democratic National Committee',
          'democratic process',
          'democratic values',
          'a democratic society'
        ],
        incorrect: [
          'the democratic Party (wrong - should be Democratic)',
          'Democratic process (wrong - should be democratic)'
        ]
      }
    },

    'Republican': {
      capitalize: 'When referring to the Republican Party',
      lowercase: 'When referring to republican form of government',
      patterns: {
        shouldCapitalize: [
          /Republican\s+Party/i,
          /Republican\s+(?:candidate|candidates|nominee|senator|representative|governor)/i,
          /the\s+Republicans/i,
          /GOP/
        ],
        shouldLowercase: [
          /republican\s+(?:form\s+of\s+)?government/i,
          /republican\s+principles/i
        ]
      },
      examples: {
        correct: [
          'the Republican Party',
          'Republican candidates',
          'republican form of government'
        ]
      }
    }
  },

  /**
   * Government Institutions - Capitalization rules
   */
  institutions: {
    'Congress': {
      rule: 'Always capitalize',
      rationale: 'Proper noun',
      patterns: {
        shouldCapitalize: [
          /\bCongress\b/,
          /Congressional/i,
          /U\.S\.\s+Congress/i
        ]
      },
      examples: {
        correct: ['Congress passed', 'Congressional district', 'member of Congress'],
        incorrect: ['congress passed', 'congressional district']
      }
    },

    'Senate': {
      rule: 'Capitalize when referring to U.S. Senate or state Senate',
      patterns: {
        shouldCapitalize: [
          /\bSenate\b/,
          /U\.S\.\s+Senate/i,
          /Virginia\s+Senate/i,
          /state\s+Senate/i
        ]
      },
      examples: {
        correct: ['the Senate', 'U.S. Senate', 'Virginia Senate'],
        incorrect: ['the senate']
      }
    },

    'House': {
      rule: 'Capitalize when referring to U.S. House of Representatives',
      patterns: {
        shouldCapitalize: [
          /House\s+of\s+Representatives/i,
          /U\.S\.\s+House/i,
          /the\s+House\b/
        ]
      },
      examples: {
        correct: ['House of Representatives', 'the House'],
        incorrect: ['house of representatives']
      }
    },

    'administration': {
      rule: 'Lowercase in AP Style',
      rationale: 'AP Style: lowercase administration unless part of formal name',
      patterns: {
        shouldLowercase: [
          /\w+\s+administration/i, // Biden administration, Trump administration
        ]
      },
      examples: {
        correct: ['Biden administration', 'Trump administration', 'the administration'],
        incorrect: ['Biden Administration', 'Trump Administration']
      }
    },

    'government': {
      rule: 'Lowercase unless part of formal name',
      patterns: {
        shouldLowercase: [
          /federal\s+government/i,
          /state\s+government/i,
          /local\s+government/i,
          /the\s+government/i
        ]
      },
      examples: {
        correct: ['federal government', 'the government'],
        incorrect: ['Federal Government', 'the Government']
      }
    }
  },

  /**
   * Political Titles - Context-dependent capitalization
   */
  titles: {
    'Representative': {
      capitalize: 'When used as a title before a name',
      lowercase: 'When used generically',
      patterns: {
        shouldCapitalize: [
          /Rep\.\s+[A-Z]/,
          /Representative\s+[A-Z][a-z]+\s+[A-Z]/i, // Representative John Smith
        ],
        shouldLowercase: [
          /a\s+representative\s+of/i,
          /representatives\s+from/i,
          /elected\s+representative/i,
          /their\s+representative/i
        ]
      },
      examples: {
        correct: [
          'Rep. Spanberger',
          'Representative Abigail Spanberger',
          'a representative of the people',
          'elected representatives'
        ],
        incorrect: [
          'rep. Spanberger (wrong - capitalize Rep.)',
          'a Representative of the people (wrong - lowercase)'
        ]
      }
    },

    'Senator': {
      capitalize: 'When used as a title before a name',
      lowercase: 'When used generically',
      patterns: {
        shouldCapitalize: [
          /Sen\.\s+[A-Z]/,
          /Senator\s+[A-Z][a-z]+\s+[A-Z]/i
        ],
        shouldLowercase: [
          /a\s+senator\s+from/i,
          /senators\s+voted/i,
          /elected\s+senator/i
        ]
      },
      examples: {
        correct: ['Sen. Warner', 'Senator Tim Kaine', 'a senator from Virginia'],
        incorrect: ['sen. Warner', 'a Senator from Virginia']
      }
    },

    'Governor': {
      capitalize: 'When used as a title before a name',
      lowercase: 'When used generically or after a name',
      patterns: {
        shouldCapitalize: [
          /Gov\.\s+[A-Z]/,
          /Governor\s+[A-Z][a-z]+\s+[A-Z]/i
        ],
        shouldLowercase: [
          /the\s+governor\b/i,
          /Virginia's\s+governor/i,
          /[A-Z][a-z]+,\s+the\s+governor/i
        ]
      },
      examples: {
        correct: ['Gov. Youngkin', 'Governor Glenn Youngkin', 'the governor', 'Youngkin, the governor'],
        incorrect: ['gov. Youngkin', 'the Governor']
      }
    },

    'President': {
      capitalize: 'When used as a title before a name or when referring to the office',
      lowercase: 'When used generically',
      patterns: {
        shouldCapitalize: [
          /President\s+[A-Z][a-z]+/i,
          /the\s+President\s+of\s+the\s+United\s+States/i
        ],
        shouldLowercase: [
          /a\s+president\s+who/i,
          /company\s+president/i
        ]
      },
      examples: {
        correct: ['President Biden', 'the President', 'a president who cares'],
        incorrect: ['president Biden', 'the president (when referring to POTUS)']
      },
      note: 'AP Style: Capitalize "President" when referring to U.S. president'
    },

    'Lieutenant Governor': {
      abbreviation: 'Lt. Gov.',
      capitalize: 'When used as title before name',
      lowercase: 'When used generically',
      examples: {
        correct: ['Lt. Gov. Earle-Sears', 'the lieutenant governor'],
        incorrect: ['lt. gov. Earle-Sears', 'the Lieutenant Governor']
      }
    }
  },

  /**
   * Special Political Terms
   */
  specialTerms: {
    'Federal': {
      capitalize: 'Only when part of formal agency name',
      lowercase: 'When used as adjective (federal government, federal workers)',
      patterns: {
        shouldCapitalize: [
          /Federal\s+Election\s+Commission/i,
          /Federal\s+Reserve/i,
          /Federal\s+Bureau\s+of\s+Investigation/i
        ],
        shouldLowercase: [
          /federal\s+government/i,
          /federal\s+workers/i,
          /federal\s+law/i,
          /federal\s+funding/i
        ]
      },
      examples: {
        correct: ['Federal Election Commission', 'federal government', 'federal workers'],
        incorrect: ['Federal government', 'Federal workers']
      }
    },

    'State': {
      capitalize: 'Only when part of formal name or referring to U.S. Department of State',
      lowercase: 'When referring to a state generally',
      patterns: {
        shouldCapitalize: [
          /State\s+Department/,
          /Secretary\s+of\s+State/,
          /State\s+of\s+Virginia/
        ],
        shouldLowercase: [
          /state\s+government/i,
          /state\s+law/i,
          /the\s+state\s+of\s+Virginia/i,
          /across\s+the\s+state/i
        ]
      },
      examples: {
        correct: ['State Department', 'Secretary of State', 'state government', 'across the state'],
        incorrect: ['State government', 'state department (when referring to U.S.)']
      }
    },

    'party': {
      rule: 'Lowercase unless part of formal party name',
      patterns: {
        shouldLowercase: [
          /party\s+members/i,
          /both\s+parties/i,
          /the\s+party/i
        ],
        shouldCapitalize: [
          /Democratic\s+Party/i,
          /Republican\s+Party/i
        ]
      },
      examples: {
        correct: ['Democratic Party', 'party members', 'both parties'],
        incorrect: ['democratic Party', 'Party members']
      }
    }
  },

  /**
   * Common Mistakes - Patterns to watch for
   */
  commonMistakes: [
    {
      incorrect: /democratic\s+Party/i,
      correct: 'Democratic Party',
      error: 'Party name should be capitalized'
    },
    {
      incorrect: /republican\s+Party/i,
      correct: 'Republican Party',
      error: 'Party name should be capitalized'
    },
    {
      incorrect: /Democratic\s+(?:process|principles|values|system)/i,
      correct: 'democratic [process/principles/values/system]',
      error: 'Lowercase when referring to democratic concepts, not party'
    },
    {
      incorrect: /the\s+Governor\b/,
      correct: 'the governor',
      error: 'Lowercase when used without name'
    },
    {
      incorrect: /the\s+Senator\b/,
      correct: 'the senator',
      error: 'Lowercase when used without name'
    },
    {
      incorrect: /Federal\s+(?:government|workers|employees|law)/i,
      correct: 'federal [government/workers/employees/law]',
      error: 'Lowercase "federal" when used as adjective'
    },
    {
      incorrect: /\b(?:Biden|Trump)\s+Administration\b/,
      correct: '[Name] administration',
      error: 'AP Style: lowercase "administration"'
    }
  ],

  /**
   * Context Detection Helpers
   */
  contextPatterns: {
    beforeProperName: /(?:Rep\.|Sen\.|Gov\.|President|Lt\.\s+Gov\.)\s+[A-Z]/,
    afterArticle: /(?:the|a|an)\s+[a-z]+/i,
    beforeOfPhrase: /\s+of\s+(?:the|a)/i,
    partyReference: /(?:Democratic|Republican)\s+Party/i,
    conceptReference: /(?:democratic|republican)\s+(?:process|principles|values|system|society)/i
  }
};

module.exports = politicalCapitalizationDictionary;
