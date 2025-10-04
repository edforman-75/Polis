/**
 * Election Law Compliance Checker Service
 *
 * Analyzes political campaign communications for potential violations of:
 * - Federal Election Commission (FEC) regulations
 * - Virginia election laws
 * - Fraud statutes
 * - Violence/threat prohibitions
 *
 * Supports both Federal and Virginia state election law compliance checking.
 */

const federalKB = require('../config/federal-election-law-kb');
const virginiaKB = require('../config/virginia-election-law-kb');

class ElectionLawComplianceChecker {
  constructor() {
    this.federalKB = federalKB;
    this.virginiaKB = virginiaKB;
  }

  /**
   * Main compliance check function
   *
   * @param {string} text - The content to check
   * @param {object} metadata - Additional context (type, candidate, office, etc.)
   * @returns {object} Compliance report with violations and risk scores
   */
  async checkCompliance(text, metadata = {}) {
    const {
      jurisdiction = 'federal', // 'federal' or 'virginia'
      communicationType = 'press_release',
      candidate = '',
      office = '',
      isFederalRace = false,
      medium = 'print',
      date = new Date().toISOString()
    } = metadata;

    // Determine which knowledge base to use
    const kb = jurisdiction === 'virginia' ? this.virginiaKB : this.federalKB;

    // Run all compliance checks
    const results = {
      overallRiskScore: 0,
      riskLevel: 'MINIMAL',
      jurisdiction: jurisdiction === 'virginia' ? 'Virginia' : 'Federal',
      violations: [],
      categoryResults: [],
      checkedAt: new Date().toISOString(),
      version: kb.metadata.version,
      metadata: {
        communicationType,
        candidate,
        office,
        medium,
        isFederalRace
      }
    };

    // Category-specific checks
    const categoryScores = [];

    // 1. Disclaimer Check
    const disclaimerResult = this.checkDisclaimers(text, metadata, kb);
    if (disclaimerResult.violations.length > 0) {
      results.violations.push(...disclaimerResult.violations);
      categoryScores.push(disclaimerResult.riskScore);
    }
    results.categoryResults.push(disclaimerResult);

    // 2. Coordination Check (federal races)
    if (isFederalRace || jurisdiction === 'federal') {
      const coordinationResult = this.checkCoordination(text, metadata, kb);
      if (coordinationResult.violations.length > 0) {
        results.violations.push(...coordinationResult.violations);
        categoryScores.push(coordinationResult.riskScore);
      }
      results.categoryResults.push(coordinationResult);
    }

    // 3. Contribution Solicitation Check
    const contributionResult = this.checkContributions(text, metadata, kb);
    if (contributionResult.violations.length > 0) {
      results.violations.push(...contributionResult.violations);
      categoryScores.push(contributionResult.riskScore);
    }
    results.categoryResults.push(contributionResult);

    // 4. Fraud Indicators Check
    const fraudResult = this.checkFraud(text, metadata, kb);
    if (fraudResult.violations.length > 0) {
      results.violations.push(...fraudResult.violations);
      categoryScores.push(fraudResult.riskScore);
    }
    results.categoryResults.push(fraudResult);

    // 5. Violence/Threat Language Check
    const violenceResult = this.checkViolence(text, metadata, kb);
    if (violenceResult.violations.length > 0) {
      results.violations.push(...violenceResult.violations);
      categoryScores.push(violenceResult.riskScore);
    }
    results.categoryResults.push(violenceResult);

    // 6. Virginia-specific: Voter Suppression Check
    if (jurisdiction === 'virginia') {
      const voterSuppressionResult = this.checkVoterSuppression(text, metadata, kb);
      if (voterSuppressionResult.violations.length > 0) {
        results.violations.push(...voterSuppressionResult.violations);
        categoryScores.push(voterSuppressionResult.riskScore);
      }
      results.categoryResults.push(voterSuppressionResult);
    }

    // Calculate overall risk score
    results.overallRiskScore = this.calculateOverallRisk(categoryScores);
    results.riskLevel = this.getRiskLevel(results.overallRiskScore);

    // Add recommended actions based on risk level
    results.recommendedActions = this.getRecommendedActions(results.riskLevel, results.violations);

    return results;
  }

  /**
   * Check for FEC/Virginia disclaimer compliance
   */
  checkDisclaimers(text, metadata, kb) {
    const violations = [];
    let riskScore = 0;

    const isPaidCommunication = this.isPaidCommunication(text, metadata);

    if (!isPaidCommunication) {
      return {
        category: kb === this.virginiaKB ? 'VIRGINIA_DISCLAIMERS' : 'FEC_DISCLAIMERS',
        riskScore: 0,
        violations: [],
        compliant: true
      };
    }

    // Check for "Paid for by" statement
    const hasPaidForBy = /paid\s+for\s+by/i.test(text);
    const hasAuthorization = /authorized\s+by|not\s+authorized/i.test(text);

    if (!hasPaidForBy) {
      riskScore = 95;
      violations.push({
        type: 'missing_disclaimer',
        category: kb === this.virginiaKB ? 'VIRGINIA_DISCLAIMERS' : 'FEC_DISCLAIMERS',
        riskScore: 95,
        confidence: 0.90,
        description: `Paid political communication lacks required "Paid for by" disclaimer`,
        regulatoryCitation: kb === this.virginiaKB ? 'Code of Virginia § 24.2-956.1' : '52 U.S.C. § 30120',
        penalty: kb === this.virginiaKB ? 'Civil penalty up to $2,500 per violation' : 'Civil penalties up to $19,000+ per violation',
        recommendedAction: 'Add disclaimer: "Paid for by [Committee Name]" immediately',
        context: 'All paid political communications require proper disclaimers'
      });
    }

    if (!hasAuthorization && kb === this.virginiaKB) {
      const authScore = 85;
      if (authScore > riskScore) riskScore = authScore;
      violations.push({
        type: 'missing_authorization',
        category: 'VIRGINIA_DISCLAIMERS',
        riskScore: 85,
        confidence: 0.88,
        description: 'Missing Virginia-required authorization statement',
        regulatoryCitation: 'Code of Virginia § 24.2-956.1(2)',
        penalty: 'Civil penalty up to $2,500 per violation',
        recommendedAction: 'Add: "Authorized by [candidate name], candidate for [office]" or "Not authorized by a candidate"',
        context: 'Virginia law requires authorization statements on all paid political ads'
      });
    }

    // Check medium-specific requirements
    if (metadata.medium === 'television') {
      const tvViolations = this.checkTelevisionDisclaimer(text, metadata, kb);
      violations.push(...tvViolations);
      if (tvViolations.length > 0) {
        riskScore = Math.max(riskScore, 80);
      }
    }

    return {
      category: kb === this.virginiaKB ? 'VIRGINIA_DISCLAIMERS' : 'FEC_DISCLAIMERS',
      riskScore,
      violations,
      compliant: violations.length === 0
    };
  }

  /**
   * Check for coordination language
   */
  checkCoordination(text, metadata, kb) {
    const violations = [];
    let riskScore = 0;

    const coordinationPatterns = kb.fecRegulations?.coordinationRestrictions?.patterns || [];

    for (const pattern of coordinationPatterns) {
      if (pattern.test(text)) {
        riskScore = 95;
        violations.push({
          type: 'coordination_language',
          category: 'COORDINATION',
          riskScore: 95,
          confidence: 0.88,
          description: 'Language suggests potential coordination with independent expenditure organization',
          regulatoryCitation: '52 U.S.C. § 30116(a)(7)(B)',
          penalty: 'Can convert contributions to illegal coordinated expenditures',
          matchedPattern: pattern.source,
          recommendedAction: 'IMMEDIATELY consult FEC counsel. Remove content. File amended reports if coordination occurred.',
          context: 'Candidates cannot coordinate with independent expenditure committees'
        });
        break;
      }
    }

    return {
      category: 'COORDINATION',
      riskScore,
      violations,
      compliant: violations.length === 0
    };
  }

  /**
   * Check contribution solicitations
   */
  checkContributions(text, metadata, kb) {
    const violations = [];
    let riskScore = 0;

    // Extract dollar amounts from text
    const amountMatches = text.match(/\$([0-9,]+)/g);

    if (!amountMatches) {
      return {
        category: 'CONTRIBUTION_SOLICITATION',
        riskScore: 0,
        violations: [],
        compliant: true
      };
    }

    // Check if this looks like a donation solicitation
    const isDonationContext = /donate|contribute|give|contribution/i.test(text);

    if (isDonationContext) {
      for (const match of amountMatches) {
        const amount = parseInt(match.replace(/[$,]/g, ''));

        // Federal races have limits
        if (metadata.isFederalRace || kb === this.federalKB) {
          const limit = kb.fecRegulations?.contributionLimits?.limits2024?.individualToCandidate || 3300;

          if (amount > limit) {
            riskScore = 80;
            violations.push({
              type: 'excessive_solicitation',
              category: 'CONTRIBUTION_SOLICITATION',
              riskScore: 80,
              confidence: 0.85,
              description: `Solicitation of $${amount.toLocaleString()} exceeds individual contribution limit of $${limit.toLocaleString()} per election`,
              regulatoryCitation: '52 U.S.C. § 30116(a)(1)(A)',
              solicitedAmount: amount,
              legalLimit: limit,
              penalty: 'Civil penalties, potential criminal prosecution for knowing violations',
              recommendedAction: `Revise solicitation to comply with limits. Add disclaimer: 'Federal law allows $${limit.toLocaleString()} per election'`,
              context: 'Individual contributions to federal candidates limited to $3,300 per election (primary and general are separate)'
            });
          }
        } else if (kb === this.virginiaKB) {
          // Virginia has no limits, but check for reporting thresholds
          const largeContribThreshold = kb.campaignFinanceDisclosure?.contributionReporting?.largeContributionThreshold || 10000;

          if (amount >= largeContribThreshold) {
            // Not a violation, but a note
            violations.push({
              type: 'large_contribution_note',
              category: 'REPORTING_VIOLATIONS',
              riskScore: 5,
              confidence: 1.0,
              description: `Contribution of $${amount.toLocaleString()} exceeds Virginia's $10,000 large contribution threshold`,
              regulatoryCitation: 'Code of Virginia § 24.2-947.9',
              penalty: 'None (not a violation)',
              recommendedAction: 'Remember to file 72-hour large contribution report if received',
              context: 'Virginia has no contribution limits, but contributions of $10,000+ trigger 72-hour reporting requirement',
              isNote: true
            });
          }
        }
      }
    }

    return {
      category: 'CONTRIBUTION_SOLICITATION',
      riskScore,
      violations: violations.filter(v => !v.isNote),
      notes: violations.filter(v => v.isNote),
      compliant: violations.filter(v => !v.isNote).length === 0
    };
  }

  /**
   * Check for fraud indicators
   */
  checkFraud(text, metadata, kb) {
    const violations = [];
    let riskScore = 0;

    // Check for common fraud patterns
    const fraudPatterns = [
      { pattern: /donate.*(?:5x|10x|triple|double)/i, type: 'matching_claims' },
      { pattern: /(?:voted|supported).*\d+\s+times/i, type: 'voting_record_claims' },
      { pattern: /defund.*police/i, type: 'policy_claims' }
    ];

    for (const { pattern, type } of fraudPatterns) {
      if (pattern.test(text)) {
        riskScore = Math.max(riskScore, 70);
        violations.push({
          type: 'potentially_false_statements',
          category: 'FRAUD_INDICATORS',
          riskScore: 70,
          confidence: 0.60,
          description: 'Content contains claims that should be verified for accuracy',
          regulatoryCitation: kb === this.virginiaKB ? 'Code of Virginia § 24.2-1016' : '18 U.S.C. § 1343',
          penalty: kb === this.virginiaKB
            ? 'Class 5 felony (1-10 years and/or up to $2,500)'
            : 'Wire fraud: up to $250,000 or 20 years imprisonment',
          matchedPattern: pattern.source,
          recommendedAction: 'Verify all factual claims before publication. Consult legal counsel if claims cannot be substantiated.',
          context: 'False statements used to solicit funds can constitute wire fraud or election fraud',
          requiresVerification: true
        });
      }
    }

    return {
      category: 'FRAUD_INDICATORS',
      riskScore,
      violations,
      compliant: violations.length === 0
    };
  }

  /**
   * Check for violence/threat language
   */
  checkViolence(text, metadata, kb) {
    const violations = [];
    let riskScore = 0;

    const violencePatterns = kb === this.virginiaKB
      ? this.virginiaKB.violenceLaws?.patterns || []
      : this.federalKB.violenceLaws?.incitement?.patterns || [];

    for (const pattern of violencePatterns) {
      if (pattern.test(text)) {
        riskScore = 98;
        violations.push({
          type: 'violence_threat_language',
          category: 'VIOLENCE_LANGUAGE',
          riskScore: 98,
          confidence: 0.95,
          description: 'Language may constitute incitement to violence or true threats',
          regulatoryCitation: kb === this.virginiaKB
            ? 'Brandenburg v. Ohio (First Amendment) + Virginia criminal statutes'
            : 'Brandenburg v. Ohio, 395 U.S. 444 (1969); 18 U.S.C. § 373',
          penalty: 'Criminal prosecution; up to life imprisonment for solicitation to commit crime',
          matchedPattern: pattern.source,
          recommendedAction: 'IMMEDIATELY remove content. Consult legal counsel. Expect potential Secret Service contact. Issue clarifying statement.',
          legalRisk: 'Criminal prosecution possible; Civil liability for resulting violence; Campaign termination likely',
          context: 'Incitement to imminent lawless action and true threats are not protected speech'
        });
        break; // One match is enough
      }
    }

    return {
      category: 'VIOLENCE_LANGUAGE',
      riskScore,
      violations,
      compliant: violations.length === 0
    };
  }

  /**
   * Check for voter suppression (Virginia-specific)
   */
  checkVoterSuppression(text, metadata, kb) {
    const violations = [];
    let riskScore = 0;

    if (kb !== this.virginiaKB) {
      return {
        category: 'VOTER_SUPPRESSION',
        riskScore: 0,
        violations: [],
        compliant: true
      };
    }

    const falseVotingPatterns = kb.fraudStatutes?.communicatingFalseInformation?.patterns || [];

    for (const pattern of falseVotingPatterns) {
      if (pattern.test(text)) {
        riskScore = 96;
        violations.push({
          type: 'false_voting_information',
          category: 'VOTER_SUPPRESSION',
          riskScore: 96,
          confidence: 0.98,
          description: 'Communication may contain false information about voting procedures',
          regulatoryCitation: 'Code of Virginia § 24.2-1005.1',
          penalty: 'Class 1 misdemeanor (up to 12 months jail and/or $2,500 fine) + civil liability to affected voters',
          matchedPattern: pattern.source,
          recommendedAction: 'IMMEDIATELY verify accuracy with Virginia Department of Elections. Remove if false. Consult legal counsel.',
          legalRisk: 'Criminal prosecution likely; civil lawsuits from affected voters possible',
          context: 'Communicating false voting information is a criminal offense in Virginia with civil liability'
        });
        break;
      }
    }

    return {
      category: 'VOTER_SUPPRESSION',
      riskScore,
      violations,
      compliant: violations.length === 0
    };
  }

  /**
   * Helper: Check if communication is paid
   */
  isPaidCommunication(text, metadata) {
    const paidIndicators = [
      /donate/i,
      /contribute/i,
      /\$\d+/,
      /rally|event/i,
      /vote for/i
    ];

    // Press releases are typically not "paid" unless they contain solicitations
    if (metadata.communicationType === 'press_release') {
      return /donate|contribute/i.test(text);
    }

    // Ads are typically paid
    if (metadata.medium && ['television', 'radio', 'online', 'print'].includes(metadata.medium)) {
      return true;
    }

    return paidIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Helper: Check television disclaimer specifics
   */
  checkTelevisionDisclaimer(text, metadata, kb) {
    const violations = [];

    if (kb === this.virginiaKB) {
      const specs = kb.advertisementDisclosure?.televisionRequirements?.technicalSpecs || {};

      if (metadata.disclaimerDuration && metadata.disclaimerDuration < specs.minDuration) {
        violations.push({
          type: 'tv_disclaimer_too_brief',
          riskScore: 80,
          description: 'Television disclaimer duration below Virginia minimum',
          regulatoryCitation: 'Code of Virginia § 24.2-957.1',
          required: `At least ${specs.minDuration} seconds`,
          actual: `${metadata.disclaimerDuration} seconds`,
          recommendedAction: `Extend disclaimer to ${specs.minDuration}+ seconds`
        });
      }

      if (metadata.disclaimerScreenHeight && metadata.disclaimerScreenHeight < specs.minScreenHeight) {
        violations.push({
          type: 'tv_disclaimer_too_small',
          riskScore: 80,
          description: 'Television disclaimer text below Virginia minimum size',
          regulatoryCitation: 'Code of Virginia § 24.2-957.1',
          required: `At least ${specs.minScreenHeight * 100}% of screen height`,
          actual: `${metadata.disclaimerScreenHeight * 100}% of screen height`,
          recommendedAction: `Increase disclaimer text size to ${specs.minScreenHeight * 100}%+ of screen`
        });
      }
    }

    return violations;
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRisk(categoryScores) {
    if (!categoryScores || categoryScores.length === 0) return 0;

    const maxScore = Math.max(...categoryScores);
    const otherScores = categoryScores.filter(s => s !== maxScore);
    const avgOther = otherScores.length > 0
      ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length
      : 0;

    return Math.round(maxScore + (0.3 * avgOther));
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get recommended actions based on risk level
   */
  getRecommendedActions(riskLevel, violations) {
    const actions = {
      CRITICAL: [
        'IMMEDIATE ACTION REQUIRED',
        'Remove or correct content immediately',
        'Consult legal counsel urgently',
        'Consider crisis communication plan',
        'Document all actions taken'
      ],
      HIGH: [
        'Urgent review required',
        'Correct violations before publication/distribution',
        'Consult compliance team and legal counsel',
        'Consider self-reporting to relevant authorities'
      ],
      MEDIUM: [
        'Review and revise content',
        'Consult compliance team',
        'Implement staff training',
        'Update processes to prevent recurrence'
      ],
      LOW: [
        'Standard compliance review',
        'Update content when feasible',
        'Note for future reference'
      ],
      MINIMAL: [
        'Continue routine monitoring',
        'No immediate action needed'
      ]
    };

    return actions[riskLevel] || actions.MINIMAL;
  }

  /**
   * Get available jurisdictions
   */
  getJurisdictions() {
    return {
      federal: {
        name: 'Federal',
        description: 'FEC regulations for federal candidates (President, Senate, House)',
        hasContributionLimits: true,
        version: this.federalKB.metadata.version
      },
      virginia: {
        name: 'Virginia',
        description: 'Virginia state election law for state/local candidates',
        hasContributionLimits: false,
        note: 'Virginia has no contribution limits for state candidates',
        version: this.virginiaKB.metadata.version
      }
    };
  }
}

module.exports = ElectionLawComplianceChecker;
