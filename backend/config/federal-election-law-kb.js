/**
 * Federal Election Law Knowledge Base
 *
 * Comprehensive knowledge base for Federal Election Commission (FEC) regulations,
 * federal fraud statutes, and laws prohibiting incitement to violence.
 *
 * Used by the campaign compliance checker to identify potential violations in
 * political campaign communications.
 */

const federalElectionLawKB = {
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-10-04',
    jurisdiction: 'Federal',
    nextReview: '2026-01-01'
  },

  /**
   * FEC Regulations (Federal Elections)
   */
  fecRegulations: {
    disclaimerRequirements: {
      statute: '52 U.S.C. § 30120',
      description: 'Disclaimer requirements on all public communications',
      requirements: [
        '"Paid for by" disclaimers on all public communications',
        'Clear identification of who paid for the communication',
        'Authorization statements when applicable'
      ],
      commonViolations: [
        'Missing disclaimers on digital ads',
        'Ambiguous "paid for by" statements',
        'Font size too small (print) or duration too short (broadcast)'
      ],
      riskLevel: 'HIGH',
      penalties: 'Civil penalties up to $19,000+ per violation',
      patterns: [
        /paid\s+for\s+by/i,
        /authorized\s+by/i,
        /approved\s+(?:this|the)\s+(?:message|communication)/i,
        /not\s+authorized\s+by\s+any\s+candidate/i
      ],
      disclaimerFormats: {
        print: {
          required: 'Must clearly state "Paid for by [committee name]"',
          format: 'Contrasting font, readable size'
        },
        radio: {
          required: 'Audio disclaimer: "[Committee name] is responsible for the content of this advertising"',
          duration: 'Sufficient to be clearly heard'
        },
        television: {
          required: 'Visual disclaimer: "Paid for by [committee name]" in at least 4% of screen height',
          duration: 'At least 4 seconds',
          additional: 'Audio disclaimer for candidate communications'
        },
        internet: {
          required: '"Paid for by [committee name]" clearly visible',
          format: 'May be abbreviated "Pd" for "Paid"',
          placement: 'Must include on landing page if link-based'
        }
      }
    },

    coordinationRestrictions: {
      statute: '52 U.S.C. § 30116(a)(7)',
      description: 'Coordination between candidates and Super PACs',
      prohibitions: [
        'Coordination between candidates and Super PACs',
        'Sharing of strategic information',
        'Common vendors without proper firewalls'
      ],
      detectionSignals: [
        'Language suggesting "support our independent expenditure"',
        'References to coordination with outside groups',
        'Timing patterns suggesting coordination'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Can convert contributions to illegal coordinated expenditures',
      patterns: [
        /coordinate\s+(?:with|your\s+efforts)/i,
        /working\s+(?:together|with)\s+(?:our\s+)?independent/i,
        /shared\s+strategy/i,
        /joint\s+(?:effort|campaign)/i
      ]
    },

    contributionLimits: {
      statute: '52 U.S.C. § 30116(a)',
      description: 'Federal contribution limits',
      limits2024: {
        individualToCandidate: 3300,
        pacToCandidate: 5000,
        partyToCandidate: 5000,
        individualToNationalParty: 41300,
        individualToStatePac: 10000,
        individualToPac: 5000
      },
      requirements: [
        'Individual contributions: $3,300 per election (2024)',
        'PAC contributions: $5,000 per election',
        'Party committee contributions: varies by type',
        'Primary and general elections count separately'
      ],
      detectionSignals: [
        'Solicitations above legal limits',
        'Failure to mention "per election" limits',
        'Corporate/union solicitations to general public'
      ],
      riskLevel: 'HIGH',
      penalties: 'Criminal prosecution possible for knowing violations',
      patterns: [
        /donate\s+\$?\d+/i,
        /contribute\s+\$?\d+/i,
        /\$\d{4,}/,
        /maximum\s+(?:contribution|donation)/i
      ]
    },

    foreignNationalProhibitions: {
      statute: '52 U.S.C. § 30121',
      description: 'Prohibitions on foreign national contributions',
      prohibitions: [
        'Contributions from foreign nationals',
        'Solicitations directed at foreign nationals',
        'Use of foreign national services'
      ],
      detectionSignals: [
        'Appeals to international audiences',
        'References to foreign donations',
        'International payment methods'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Criminal penalties, campaign-ending scandal',
      patterns: [
        /international\s+(?:contribution|donation)/i,
        /foreign\s+(?:contribution|donation|support)/i,
        /donate\s+from\s+(?:abroad|overseas)/i
      ]
    }
  },

  /**
   * Fraud and Deception Laws
   */
  fraudStatutes: {
    wireFraud: {
      statute: '18 U.S.C. § 1343',
      description: 'Wire fraud statute',
      prohibitions: [
        'False statements to solicit funds',
        'Misrepresentation of how funds will be used',
        'Fraudulent fundraising schemes'
      ],
      detectionSignals: [
        'Verifiably false claims about candidate background',
        'Misleading statements about policy positions',
        'Deceptive matching gift claims'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Federal criminal statute, up to 20 years imprisonment',
      patterns: [
        /donate.*(?:match|triple|double)/i,
        /(?:false|fake)\s+(?:claim|statement)/i,
        /verified\s+(?:by|as)\s+false/i
      ]
    },

    falseStatements: {
      statute: '18 U.S.C. § 1001',
      description: 'False statements to federal officials',
      prohibitions: [
        'Knowingly false statements to federal officials',
        'False statements in official filings',
        'Material misrepresentations'
      ],
      detectionSignals: [
        'Contradictions with FEC filings',
        'False claims about opponent\'s record',
        'Misrepresentation of official positions'
      ],
      riskLevel: 'HIGH',
      penalties: 'Criminal prosecution for knowing violations'
    }
  },

  /**
   * Incitement and Violence Laws
   */
  violenceLaws: {
    incitement: {
      statute: 'Brandenburg v. Ohio, 395 U.S. 444 (1969)',
      description: 'Incitement to imminent lawless action',
      prohibitions: [
        'Speech directed to inciting imminent lawless action',
        'Speech likely to produce such action'
      ],
      detectionSignals: [
        'Direct calls to violence',
        'Specific threats against individuals',
        'Encouragement of illegal actions at specific times/places'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Criminal charges, immediate content removal required',
      patterns: [
        /(?:shoot|kill|destroy|eliminate)\s+(?:the|our|them)/i,
        /take\s+(?:them\s+)?(?:out|down)/i,
        /(?:violent|armed)\s+(?:action|response)/i,
        /(?:blood|war|fight)\s+(?:in\s+the\s+streets|at\s+the\s+polls)/i,
        /by\s+any\s+means\s+necessary/i
      ]
    },

    trueThreats: {
      statute: 'Virginia v. Black, 538 U.S. 343 (2003)',
      description: 'True threats doctrine',
      prohibitions: [
        'Statements intending to place victims in fear of harm',
        'Threats of violence'
      ],
      detectionSignals: [
        'Threatening language toward opponents',
        'Violent imagery combined with targeting',
        '"Will be held accountable" + violent context'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Criminal charges, Secret Service involvement possible',
      patterns: [
        /will\s+(?:pay|suffer|regret)/i,
        /(?:coming|going)\s+after\s+you/i,
        /(?:watch|find)\s+(?:your|his|her)\s+back/i,
        /(?:target|crosshairs)/i
      ]
    }
  },

  /**
   * Compliance Categories for Analysis
   */
  complianceCategories: {
    FEC_DISCLAIMERS: {
      name: 'FEC Disclaimers',
      description: 'Required disclaimers on political communications',
      checkFor: [
        'Presence of "Paid for by" statement',
        'Identification of payor',
        'Authorization statements',
        'Format compliance (size, duration, placement)'
      ],
      riskLevels: {
        CRITICAL: 'Paid communication with no disclaimer',
        HIGH: 'Disclaimer present but inadequate',
        MEDIUM: 'Disclaimer format issues',
        LOW: 'Minor technical deficiencies'
      }
    },

    COORDINATION_FLAGS: {
      name: 'Coordination Flags',
      description: 'Potential coordination with independent expenditures',
      checkFor: [
        'Language suggesting coordination with outside groups',
        'References to independent expenditures',
        'Strategic information sharing indicators',
        'Common vendor usage without disclosures'
      ],
      riskLevels: {
        CRITICAL: 'Direct coordination statements',
        HIGH: 'Strong coordination indicators',
        MEDIUM: 'Ambiguous coordination language',
        LOW: 'Incidental references'
      }
    },

    CONTRIBUTION_SOLICITATIONS: {
      name: 'Contribution Solicitations',
      description: 'Compliance with contribution limits',
      checkFor: [
        'Solicitation amounts vs. legal limits',
        'Proper disclosure of limits',
        'Corporate/union solicitation restrictions',
        'Foreign national prohibitions'
      ],
      riskLevels: {
        CRITICAL: 'Solicitation of illegal contributions (foreign, excessive)',
        HIGH: 'Solicitation without proper limit disclosures',
        MEDIUM: 'Ambiguous contribution language',
        LOW: 'Technical disclosure issues'
      }
    },

    FRAUD_INDICATORS: {
      name: 'Fraud Indicators',
      description: 'Potential fraudulent statements',
      checkFor: [
        'Factual accuracy of claims',
        'Consistency with public records',
        'Misleading characterizations',
        'Deceptive fundraising tactics'
      ],
      riskLevels: {
        CRITICAL: 'Verifiable false statements for fundraising',
        HIGH: 'Materially misleading claims',
        MEDIUM: 'Questionable characterizations',
        LOW: 'Minor exaggerations (political puffery)'
      }
    },

    VIOLENCE_THREAT_LANGUAGE: {
      name: 'Violence/Threat Language',
      description: 'Threatening or violent rhetoric',
      checkFor: [
        'Direct calls to violence',
        'Threatening language',
        'Incitement to illegal action',
        'Violent imagery with targeting'
      ],
      riskLevels: {
        CRITICAL: 'True threats, direct incitement',
        HIGH: 'Implied threats, violent rhetoric with targeting',
        MEDIUM: 'Aggressive language without specific threats',
        LOW: 'Generic tough talk'
      }
    },

    DECEPTIVE_PRACTICES: {
      name: 'Deceptive Practices',
      description: 'Misleading or deceptive content',
      checkFor: [
        'False endorsement claims',
        'Misrepresentation of opponent positions',
        'Fake sources or attributions',
        'Manipulated media'
      ],
      riskLevels: {
        CRITICAL: 'Completely fabricated information',
        HIGH: 'Significant misrepresentations',
        MEDIUM: 'Misleading context or framing',
        LOW: 'Selective quoting (within norms)'
      }
    }
  },

  /**
   * Risk Scoring Guidelines
   */
  riskScoring: {
    levels: {
      CRITICAL: {
        range: [80, 100],
        characteristics: [
          'Likely criminal violation',
          'Immediate legal/regulatory action required',
          'Potential campaign-ending scandal',
          'Secret Service/FBI involvement possible'
        ],
        actions: [
          'Immediate content removal',
          'Legal counsel consultation',
          'Law enforcement notification (if threats)',
          'Crisis communication plan activation'
        ]
      },
      HIGH: {
        range: [60, 79],
        characteristics: [
          'Clear regulatory violation',
          'Significant civil penalties likely',
          'FEC complaint probable',
          'Media attention likely'
        ],
        actions: [
          'Urgent legal review',
          'Content correction/removal',
          'FEC self-reporting consideration',
          'Corrective communications'
        ]
      },
      MEDIUM: {
        range: [40, 59],
        characteristics: [
          'Probable compliance issue',
          'FEC inquiry possible',
          'Correctable with guidance',
          'Minor penalties possible'
        ],
        actions: [
          'Compliance review',
          'Content revision',
          'Staff training',
          'Process improvements'
        ]
      },
      LOW: {
        range: [20, 39],
        characteristics: [
          'Technical issues',
          'Best practices violations',
          'Unlikely to result in penalties',
          'Should be addressed proactively'
        ],
        actions: [
          'Standard compliance review',
          'Content updates as feasible',
          'Training opportunities'
        ]
      },
      MINIMAL: {
        range: [0, 19],
        characteristics: [
          'No clear violations',
          'Industry standard practices',
          'Minor or no risk'
        ],
        actions: [
          'Routine monitoring',
          'No immediate action needed'
        ]
      }
    },

    /**
     * Calculate overall risk score
     * Formula: MAX(Category Risks) + (0.3 × AVERAGE(Other Category Risks))
     */
    calculateOverallRisk: function(categoryScores) {
      if (!categoryScores || categoryScores.length === 0) return 0;

      const maxScore = Math.max(...categoryScores);
      const otherScores = categoryScores.filter(s => s !== maxScore);
      const avgOther = otherScores.length > 0
        ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length
        : 0;

      return Math.round(maxScore + (0.3 * avgOther));
    },

    getRiskLevel: function(score) {
      if (score >= 80) return 'CRITICAL';
      if (score >= 60) return 'HIGH';
      if (score >= 40) return 'MEDIUM';
      if (score >= 20) return 'LOW';
      return 'MINIMAL';
    }
  },

  /**
   * Federal contribution limits table (2024)
   */
  contributionLimitsTable: {
    year: 2024,
    limits: [
      {
        recipient: 'Candidate Committee',
        individualLimit: 3300,
        pacLimit: 5000,
        partyLimit: 5000,
        note: 'Per election'
      },
      {
        recipient: 'National Party Committee',
        individualLimit: 41300,
        pacLimit: 15000,
        partyLimit: null,
        note: 'Per year; unlimited transfers between party committees'
      },
      {
        recipient: 'State/Local Party',
        individualLimit: 10000,
        pacLimit: 5000,
        partyLimit: null,
        note: 'Per year; unlimited transfers'
      },
      {
        recipient: 'PAC (multicandidate)',
        individualLimit: 5000,
        pacLimit: 5000,
        partyLimit: 5000,
        note: 'Per year'
      },
      {
        recipient: 'PAC (not multicandidate)',
        individualLimit: 3300,
        pacLimit: 5000,
        partyLimit: 5000,
        note: 'Per year'
      }
    ],
    importantNote: 'Primary and general elections count as separate elections'
  },

  /**
   * Criminal statutes quick reference
   */
  criminalStatutes: [
    {
      statute: '52 U.S.C. § 30109',
      offense: 'FEC violations (knowing and willful)',
      penalty: 'Up to $25,000 or 1 year'
    },
    {
      statute: '52 U.S.C. § 30121',
      offense: 'Foreign contributions',
      penalty: 'Up to $25,000 or 1 year'
    },
    {
      statute: '18 U.S.C. § 1001',
      offense: 'False statements',
      penalty: 'Up to $250,000 or 5 years'
    },
    {
      statute: '18 U.S.C. § 1343',
      offense: 'Wire fraud',
      penalty: 'Up to $250,000 or 20 years'
    },
    {
      statute: '18 U.S.C. § 373',
      offense: 'Solicitation to commit crime',
      penalty: 'Up to life imprisonment'
    },
    {
      statute: '18 U.S.C. § 875(c)',
      offense: 'Threatening communications',
      penalty: 'Up to $250,000 or 5 years'
    }
  ],

  /**
   * Resources
   */
  resources: {
    fec: {
      website: 'https://www.fec.gov',
      phone: '(800) 424-9530',
      email: 'info@fec.gov'
    },
    legalCounsel: {
      note: 'Always consult qualified legal counsel for compliance matters',
      resource: 'FEC maintains list of attorneys specializing in election law'
    }
  }
};

module.exports = federalElectionLawKB;
