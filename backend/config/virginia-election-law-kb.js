/**
 * Virginia Election Law Knowledge Base
 *
 * Comprehensive knowledge base for Virginia Campaign Finance Disclosure Act (CFDA),
 * Virginia Political Campaign Advertisement laws, and Virginia election fraud statutes.
 *
 * Focus: Abigail Spanberger's gubernatorial campaign in Virginia.
 *
 * Key Difference: Virginia has NO contribution limits for state candidates (as of 2024).
 */

const virginiaElectionLawKB = {
  metadata: {
    version: '1.0.0-VA',
    lastUpdated: '2025-10-04',
    jurisdiction: 'Commonwealth of Virginia',
    nextReview: '2026-01-01',
    applicableTo: 'Spanberger for Governor campaign',
    importantNote: 'Virginia has NO contribution limits for state candidates as of 2024'
  },

  /**
   * Virginia Campaign Finance Disclosure Act (CFDA)
   * Code of Virginia Title 24.2, Chapters 9.3, 9.4, and 9.5
   */
  campaignFinanceDisclosure: {
    statementOfOrganization: {
      statute: '§ 24.2-947.1',
      description: 'Statement of Organization requirements',
      requiresFilingWithin10Days: [
        'Receiving contributions totaling $200 or more',
        'Making expenditures totaling $200 or more',
        'Appointing a campaign treasurer',
        'Designating a campaign committee or depository'
      ],
      detectionSignals: [
        'Fundraising solicitations without registered committee',
        'Expenditure announcements without proper registration',
        'References to campaign account without treasurer'
      ],
      riskLevel: 'MEDIUM',
      penalties: 'Administrative violation, correctable',
      patterns: [
        /campaign\s+(?:committee|treasurer|account)/i,
        /\$200|\$\d{3,}/,
        /(?:contribution|donation|fundrais)/i
      ]
    },

    contributionReporting: {
      statute: '§ 24.2-947 et seq.',
      description: 'Regular campaign finance reporting',
      requirements: [
        'Statement of Organization within 10 days of establishing campaign committee',
        'Regular campaign finance reports (schedules vary by election cycle)',
        'Large contribution reporting ($10,000+ within 72 hours for some races)',
        'Detailed disclosure of contributions over $100'
      ],
      commonViolations: [
        'Failure to file required reports',
        'Late filing of reports',
        'Missing or incomplete contribution information',
        'Failure to report large contributions within 72 hours'
      ],
      riskLevel: 'HIGH',
      penalties: 'Civil penalties, potential criminal charges for willful violations',
      largeContributionThreshold: 10000,
      itemizationThreshold: 100,
      largeContributionReporting72Hours: true
    },

    outOfStatePACRestrictions: {
      statute: '§ 24.2-947.3:1',
      description: 'Out-of-state and federal PAC disclosure requirements',
      requirements: [
        'Special disclosure for contributions from federal PACs',
        'Special disclosure for out-of-state political committees',
        'Designated contribution reporting'
      ],
      detectionSignals: [
        'References to PAC contributions without proper attribution',
        'Out-of-state fundraising without disclosures'
      ],
      riskLevel: 'MEDIUM',
      penalties: 'Reporting violation'
    },

    noContributionLimits: {
      statute: 'None (no limits exist)',
      description: 'Virginia has NO contribution limits for state candidates',
      importantFacts: [
        'Virginia is one of only 12 states with NO contribution limits',
        'Individuals can contribute unlimited amounts to state candidates',
        'Corporations can contribute unlimited amounts to state candidates',
        'Unions can contribute unlimited amounts to state candidates',
        'Proposed legislation exists to limit contributions ($20,000 statewide/Senate, $10,000 House)',
        'As of 2024, no limits are in effect'
      ],
      reportingRequirements: [
        'All contributions must be reported',
        'Contributions over $100 must be itemized',
        'Contributions of $10,000+ trigger 72-hour reporting'
      ],
      riskLevel: 'N/A',
      note: 'While no limits exist, all contributions must still be properly disclosed'
    }
  },

  /**
   * Political Campaign Advertisement Disclosure (Chapter 9.5)
   */
  advertisementDisclosure: {
    printMediaRequirements: {
      statute: '§ 24.2-956 and § 24.2-956.1',
      description: 'Print media disclaimer requirements',
      requirements: [
        '"Paid for by [Name]" on all paid advertisements',
        'Authorization statement ("Authorized by [candidate]" or "Not authorized by a candidate")',
        'If opposing a candidate, must disclose intended beneficiary if coordinated',
        'Minimum 7-point font for electronic ads (with landing page exception)'
      ],
      exemptions: [
        'Individuals spending under $1,000 for statewide races',
        'Individuals spending under $200 for other races',
        'Novelty items (pens, buttons, magnets)'
      ],
      commonViolations: [
        'Missing "Paid for by" disclaimer',
        'Missing authorization statement',
        'Font too small for electronic ads',
        'No landing page for small electronic ads'
      ],
      riskLevel: 'HIGH',
      penalties: 'Civil penalty up to $2,500 per violation',
      patterns: [
        /paid\s+for\s+by/i,
        /authorized\s+by/i,
        /not\s+authorized\s+by/i
      ]
    },

    televisionRequirements: {
      statute: '§ 24.2-957',
      description: 'Television advertisement requirements',
      requirements: [
        'Visual disclaimer in minimum 4% of screen height',
        'Disclaimer must appear for at least 4 seconds',
        'For candidate-authorized ads: candidate must appear on screen or in voiceover',
        '"Paid for by" and authorization statements required'
      ],
      commonViolations: [
        'Disclaimer too small or too brief',
        'Missing candidate appearance/voiceover',
        'Ambiguous authorization'
      ],
      riskLevel: 'HIGH',
      penalties: 'Civil penalties',
      technicalSpecs: {
        minScreenHeight: 0.04,
        minDuration: 4,
        candidateAppearanceRequired: true
      }
    },

    radioRequirements: {
      statute: '§ 24.2-958',
      description: 'Radio advertisement requirements',
      requirements: [
        'Audio disclaimer clearly stating who paid for ad',
        'Duration sufficient to be clearly heard',
        'Authorization statement required'
      ],
      commonViolations: [
        'Disclaimer too fast or unclear',
        'Missing authorization'
      ],
      riskLevel: 'HIGH',
      penalties: 'Civil penalties'
    },

    onlinePlatformRequirements: {
      statute: '§ 24.2-960',
      description: 'Online platform requirements',
      requirements: [
        'Online advertisers must certify they\'re permitted to purchase political ads',
        'Must identify themselves as political advertisers to platforms',
        'Online video ads subject to TV rules',
        'Online audio ads subject to radio rules',
        'Non-video/audio ads subject to print media rules'
      ],
      commonViolations: [
        'Ads on platforms without proper certification',
        'Missing disclaimers on social media ads',
        'Inconsistent disclosure across platforms'
      ],
      riskLevel: 'HIGH',
      penalties: 'Platform may reject ads, civil penalties'
    },

    campaignTelephoneCalls: {
      statute: '§ 24.2-959',
      description: 'Campaign telephone call requirements',
      requirements: [
        'For series of 25+ calls during election period',
        'Must disclose who\'s responsible for calls',
        'Subject to fraud provisions'
      ],
      detectionSignals: [
        'Mass calling/texting without disclosure',
        'Robocalls without required information'
      ],
      riskLevel: 'MEDIUM',
      penalties: 'Civil penalties'
    }
  },

  /**
   * Virginia Election Fraud Statutes
   */
  fraudStatutes: {
    falseStatementsElectionFraud: {
      statute: '§ 24.2-1016',
      description: 'False statements - election fraud',
      classification: 'Class 5 felony',
      prohibitions: [
        'Willfully false material statements on election forms/reports'
      ],
      penalties: '1-10 years imprisonment and/or up to $2,500 fine',
      detectionSignals: [
        'Verifiably false statements in campaign finance reports',
        'False information on registration or election forms',
        'Materially misleading statements in official filings'
      ],
      riskLevel: 'CRITICAL',
      note: 'Felony criminal prosecution'
    },

    communicatingFalseInformation: {
      statute: '§ 24.2-1005.1',
      description: 'Communicating false information about voting',
      classification: 'Class 1 misdemeanor',
      prohibitions: [
        'Communicating materially false information about voting procedures',
        'Information likely to impede or prevent voting',
        'Applies to election officers, candidates, committees, parties, PACs'
      ],
      penalties: 'Up to 12 months jail and/or $2,500 fine',
      additionalLiability: 'Civil cause of action for affected voters',
      detectionSignals: [
        'False information about polling locations',
        'Incorrect voting dates or times',
        'Misleading information about voter qualifications',
        'False information about vote-by-mail procedures'
      ],
      riskLevel: 'HIGH',
      note: 'Criminal charges plus civil liability',
      patterns: [
        /(?:vote|voting)\s+on\s+(?:the\s+)?(?:wrong|incorrect)\s+(?:date|day)/i,
        /(?:polling|voting)\s+(?:place|location|site)\s+(?:is\s+at|moved\s+to)/i,
        /you\s+(?:can|must)\s+vote\s+(?:via|by|through)\s+(?:text|phone|email)/i,
        /(?:undocumented|illegal)\s+(?:immigrants|aliens)\s+can\s+vote/i,
        /voter\s+id\s+(?:not\s+)?required/i
      ]
    },

    illegalVoting: {
      statute: '§ 24.2-1004',
      description: 'Illegal voting',
      classification: 'Class 6 felony',
      prohibitions: [
        'Voting more than once',
        'Voting while knowing one is not qualified',
        'Procuring/assisting others to vote illegally'
      ],
      penalties: '1-5 years imprisonment',
      detectionSignals: [
        'Encouraging ineligible voters to vote',
        'Facilitating double voting',
        'Knowingly assisting unqualified voters'
      ],
      riskLevel: 'CRITICAL',
      note: 'Felony prosecution'
    },

    absenteeVotingFraud: {
      statute: '§ 24.2-1012',
      description: 'Absentee voting fraud',
      classification: 'Class 5 felony (general); Class 4 felony (forgery)',
      prohibitions: [
        'Aiding/abetting violations of absentee procedures',
        'Fraudulently signing another\'s name on absentee ballot'
      ],
      penalties: 'Class 5: 1-10 years; Class 4: 2-10 years',
      detectionSignals: [
        'Organizing fraudulent absentee ballot operations',
        'Ballot harvesting schemes',
        'Impersonation of absentee voters'
      ],
      riskLevel: 'CRITICAL',
      note: 'Felony prosecution'
    }
  },

  /**
   * Violence and Threat Statutes (Virginia Criminal Law)
   */
  violenceLaws: {
    trueThreats: {
      description: 'True threats (intent to place victim in fear of harm)',
      applicableLaw: 'First Amendment case law + Virginia criminal statutes',
      detectionSignals: [
        'Threatening language toward opponents',
        'Violent imagery combined with targeting',
        '"Will be held accountable" + violent context'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Criminal prosecution, potential Secret Service involvement'
    },

    incitement: {
      description: 'Incitement to imminent lawless action',
      applicableLaw: 'Brandenburg test + Virginia criminal law',
      detectionSignals: [
        'Direct calls to violence',
        'Specific threats against individuals',
        'Encouragement of illegal actions at specific times/places'
      ],
      riskLevel: 'CRITICAL',
      penalties: 'Criminal charges, immediate content removal required'
    },

    assault: {
      statute: '§ 18.2-57',
      description: 'Assault/Battery threats',
      riskLevel: 'CRITICAL'
    },

    electronicThreats: {
      statute: '§ 18.2-152.7:1',
      description: 'Threats via electronic means',
      riskLevel: 'CRITICAL'
    },

    patterns: [
      /(?:shoot|kill|destroy|eliminate)\s+(?:the|our|them)/i,
      /take\s+(?:them\s+)?(?:out|down)/i,
      /(?:violent|armed)\s+(?:action|response)/i,
      /(?:blood|war|fight)\s+(?:in\s+the\s+streets|at\s+the\s+polls)/i,
      /by\s+any\s+means\s+necessary/i,
      /will\s+(?:pay|suffer|regret)/i,
      /(?:coming|going)\s+after\s+you/i
    ]
  },

  /**
   * Compliance Categories
   */
  complianceCategories: {
    VIRGINIA_DISCLAIMERS: {
      name: 'Virginia Disclaimers',
      description: 'Required disclaimers on political communications',
      checkFor: [
        'Presence of "Paid for by" statement',
        'Authorization statements (authorized/not authorized)',
        'Intended beneficiary disclosure (if opposing candidate)',
        'Format compliance (font size, duration, placement)',
        'Medium-specific requirements (print/TV/radio/online)'
      ],
      riskLevels: {
        CRITICAL: 'Paid communication with no disclaimer',
        HIGH: 'Disclaimer present but inadequate/non-compliant',
        MEDIUM: 'Format issues (font size, duration)',
        LOW: 'Minor technical deficiencies'
      }
    },

    REPORTING_VIOLATIONS: {
      name: 'Reporting Violations',
      description: 'Campaign finance reporting compliance',
      checkFor: [
        'Statement of Organization status',
        'Report filing deadlines',
        'Large contribution reporting ($10,000+)',
        'Contribution itemization (over $100)',
        'Out-of-state/federal PAC disclosures'
      ],
      riskLevels: {
        HIGH: 'Willful failure to file reports',
        MEDIUM: 'Late filing',
        MEDIUM: 'Missing required disclosures',
        LOW: 'Technical reporting errors'
      }
    },

    FALSE_STATEMENTS_VA: {
      name: 'False Statements - Virginia Law',
      description: 'Virginia-specific false statement violations',
      checkFor: [
        'Factual accuracy in campaign finance reports',
        'Truthfulness of voting information communicated',
        'Material misrepresentations in official filings',
        'False statements in campaign communications'
      ],
      riskLevels: {
        CRITICAL: 'Willfully false statements in official filings (felony)',
        CRITICAL: 'False voting information (misdemeanor + civil liability)',
        HIGH: 'Materially misleading statements for fundraising',
        MEDIUM: 'Questionable characterizations'
      }
    },

    COORDINATION_FLAGS: {
      name: 'Coordination Flags',
      description: 'Coordination with outside groups',
      checkFor: [
        'Coordination language with outside groups (if federal race)',
        'Proper disclosure of coordinated opposition ads',
        'Independent expenditure compliance'
      ],
      riskLevels: {
        CRITICAL: 'Coordination violations (federal races)',
        HIGH: 'Failure to disclose intended beneficiary',
        MEDIUM: 'Ambiguous coordination language'
      },
      note: 'Less critical for state races; primarily federal concern'
    },

    VIOLENCE_THREAT_LANGUAGE: {
      name: 'Violence/Threat Language',
      description: 'Threatening or violent rhetoric',
      checkFor: [
        'Direct calls to violence',
        'Threatening language',
        'Incitement to illegal action',
        'True threats'
      ],
      riskLevels: {
        CRITICAL: 'True threats, direct incitement',
        HIGH: 'Implied threats, violent rhetoric with targeting',
        MEDIUM: 'Aggressive language without specific threats',
        LOW: 'Generic tough talk'
      }
    },

    VOTER_SUPPRESSION: {
      name: 'Voter Suppression/Misinformation',
      description: 'False or misleading voting information',
      checkFor: [
        'False information about voting procedures',
        'Misleading polling place information',
        'Incorrect voting dates/times',
        'False voter qualification information'
      ],
      riskLevels: {
        CRITICAL: 'Intentional voter suppression efforts',
        HIGH: 'Materially false voting information',
        MEDIUM: 'Ambiguous or confusing information',
        LOW: 'Minor errors in voting information'
      }
    }
  },

  /**
   * Risk Scoring System (same as federal)
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
          'Complaint probable',
          'Media attention likely'
        ],
        actions: [
          'Urgent legal review',
          'Content correction/removal',
          'Self-reporting consideration',
          'Corrective communications'
        ]
      },
      MEDIUM: {
        range: [40, 59],
        characteristics: [
          'Probable compliance issue',
          'Inquiry possible',
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
   * Virginia Contribution Rules (2024)
   */
  virginiaContributionRules: {
    stateCandidates: {
      individual: 'UNLIMITED',
      corporation: 'UNLIMITED',
      union: 'UNLIMITED',
      statePAC: 'UNLIMITED',
      partyCommittee: 'UNLIMITED',
      note: 'Virginia is one of only 12 states with NO contribution limits'
    },
    proposedLegislation: {
      statewideSenate: 20000,
      house: 10000,
      status: 'Proposed but not enacted as of 2024'
    },
    reportingThresholds: {
      itemization: 100,
      largeContribution72Hour: 10000
    }
  },

  /**
   * Virginia Criminal Penalties Quick Reference
   */
  criminalPenalties: [
    {
      statute: '§ 24.2-1016',
      violation: 'False statements (campaign finance)',
      classification: 'Class 5 felony',
      penalty: '1-10 years and/or up to $2,500'
    },
    {
      statute: '§ 24.2-1005.1',
      violation: 'False voting information',
      classification: 'Class 1 misdemeanor',
      penalty: 'Up to 12 months and/or $2,500 + civil liability'
    },
    {
      statute: '§ 24.2-1004(B)',
      violation: 'Illegal voting',
      classification: 'Class 6 felony',
      penalty: '1-5 years'
    },
    {
      statute: '§ 24.2-1012',
      violation: 'Absentee voting fraud',
      classification: 'Class 5 felony',
      penalty: '1-10 years'
    },
    {
      statute: '§ 24.2-1012',
      violation: 'Forgery (absentee ballots)',
      classification: 'Class 4 felony',
      penalty: '2-10 years'
    }
  ],

  /**
   * Virginia-Specific Resources
   */
  resources: {
    virginiaElections: {
      name: 'Virginia Department of Elections',
      website: 'https://www.elections.virginia.gov/',
      campaignFinance: 'https://www.elections.virginia.gov/candidatepac-info/',
      phone: '(800) 552-9745'
    },
    attorneyGeneral: {
      name: 'Virginia Attorney General\'s Office',
      phone: '(804) 786-2071'
    },
    comet: {
      name: 'COMET (Campaign Finance System)',
      description: 'Virginia\'s online campaign finance reporting system',
      website: 'https://www.elections.virginia.gov/candidatepac-info/'
    },
    virginiaCode: {
      name: 'Code of Virginia',
      website: 'https://law.lis.virginia.gov/vacode/'
    },
    stateBar: {
      name: 'State Bar of Virginia Lawyer Referral Service',
      phone: '(804) 775-0500'
    }
  },

  /**
   * Federal vs State Compliance (for federal candidates in Virginia)
   */
  federalStateCompliance: {
    note: 'Federal candidates running in Virginia must comply with BOTH federal (FEC) and Virginia state laws',
    contributionLimits: 'FEC limits apply (more restrictive)',
    coordinationRules: 'FEC rules apply (stricter)',
    disclaimerContent: 'Must meet BOTH FEC and Virginia requirements',
    disclaimerFormat: 'Must meet BOTH FEC and Virginia specifications',
    reporting: 'Must file with BOTH FEC and Virginia',
    falseStatements: 'BOTH federal and Virginia statutes can apply',
    keyPrinciple: 'Federal candidates must comply with the MORE RESTRICTIVE of federal or state requirements'
  },

  /**
   * Spanberger Campaign Notes
   */
  spanbergerCampaignNotes: {
    office: 'Governor of Virginia',
    raceType: 'State (not federal)',
    contributionLimits: 'NONE (unlimited contributions allowed)',
    disclaimerRequirements: 'Virginia state law applies',
    reportingRequirements: 'Virginia Department of Elections',
    keyConsiderations: [
      'No contribution limits - can accept unlimited individual/corporate contributions',
      'All contributions must still be properly disclosed',
      'Contributions over $10,000 trigger 72-hour reporting',
      'Must comply with Virginia disclaimer requirements on all ads',
      'False voting information carries criminal penalties',
      'Voter suppression efforts are Class 1 misdemeanor + civil liability'
    ]
  }
};

module.exports = virginiaElectionLawKB;
