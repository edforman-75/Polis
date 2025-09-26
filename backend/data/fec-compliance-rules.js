/**
 * FEC Compliance Rules Database
 * Based on Federal Election Campaign Act and FEC regulations
 *
 * This implementation provides rule-based detection for common FEC compliance issues.
 *
 * LEGAL DISCLAIMER: This tool provides automated assistance only and should not replace
 * legal review. All flagged content should be reviewed by qualified legal counsel
 * familiar with campaign finance law.
 *
 * Sources:
 * - 52 U.S.C. § 30101 et seq. (Federal Election Campaign Act)
 * - 11 CFR Part 100-116 (FEC Regulations)
 * - FEC Advisory Opinions and Enforcement Matters
 * - Citizens United v. FEC, 558 U.S. 310 (2010)
 */

module.exports = {
    // Express advocacy "magic words" that trigger FEC regulations
    // Based on Buckley v. Valeo, 424 U.S. 1 (1976) and subsequent rulings
    magicWords: {
        explicit: [
            'vote for', 'elect', 'support', 'cast your ballot for',
            'vote against', 'defeat', 'reject', 'oppose'
        ],
        contextual: [
            'Smith for Congress', 'Re-elect', 'Vote Smith',
            'Smith in November', 'Smith on Election Day'
        ]
    },

    // Coordination indicators (11 CFR § 109.21)
    coordinationIndicators: {
        // Direct coordination language
        direct: [
            'coordinate', 'coordinating', 'coordination',
            'work together', 'joint effort', 'collaboration',
            'in consultation with', 'working with the campaign'
        ],
        // Indirect indicators
        indirect: [
            'shared vendor', 'common consultant', 'strategic planning',
            'message coordination', 'timing coordination'
        ],
        // Safe harbor language that indicates proper independence
        safeHarbor: [
            'independent expenditure', 'not coordinated',
            'independent of any candidate', 'without coordination'
        ]
    },

    // Foreign national prohibitions (52 U.S.C. § 30121)
    foreignNationalProhibitions: {
        // Prohibited activities for foreign nationals
        prohibited: [
            'foreign contribution', 'foreign donation', 'overseas funding',
            'international support', 'foreign national', 'non-U.S. citizen',
            'foreign government', 'foreign corporation'
        ],
        // Context that makes foreign involvement clearer
        contexts: [
            'contribute', 'donate', 'support financially', 'fund',
            'expenditure', 'payment', 'in-kind contribution'
        ]
    },

    // Disclaimer requirements (11 CFR § 110.11)
    disclaimerRequirements: {
        // Required disclaimers for different content types
        paidFor: [
            'Paid for by', 'Authorized by', 'Sponsored by'
        ],
        // Express advocacy requiring disclaimers
        requiresDisclaimer: ['press_release', 'advertisement', 'public_communication'],
        // Content that typically needs disclaimers
        triggers: [
            'vote for', 'elect', 'support', 'vote against', 'defeat'
        ]
    },

    // Corporate and union restrictions (52 U.S.C. § 30118)
    corporateRestrictions: {
        // Prohibited corporate activities
        prohibited: [
            'corporate contribution', 'corporate donation',
            'company funds', 'business contribution',
            'union dues', 'treasury funds'
        ],
        // Permitted activities (independent expenditures, PACs)
        permitted: [
            'independent expenditure', 'separate segregated fund',
            'PAC contribution', 'Super PAC'
        ]
    },

    // Contribution limits (52 U.S.C. § 30116)
    contributionLimits: {
        // 2024 contribution limits (adjusted for inflation)
        individual: {
            candidate: 3300, // per election
            pac: 5000, // per year
            party: 41300 // per year to national party
        },
        // Patterns indicating potential limit violations
        limitIndicators: [
            /\$\d+,\d+/, // Large dollar amounts
            'maximum contribution', 'contribution limit',
            'bundling', 'straw donor'
        ]
    },

    // Legal review triggers
    legalReviewRequired: {
        // Critical violations requiring immediate legal review
        critical: [
            'foreign_national_violation',
            'express_advocacy_no_disclaimer',
            'coordination_violation',
            'corporate_treasury_funds'
        ],
        // Warning level - should be reviewed but not necessarily critical
        warning: [
            'coordination_indicators',
            'disclaimer_missing',
            'ambiguous_funding_source',
            'large_contribution_reference'
        ],
        // Info level - flag for awareness but likely compliant
        info: [
            'political_activity_mentioned',
            'fundraising_referenced',
            'election_timing_discussed'
        ]
    },

    // Specific rules for different content types
    contentTypeRules: {
        press_release: {
            requiresDisclaimer: true,
            magicWordTrigger: true,
            coordinationSensitive: false
        },
        advertisement: {
            requiresDisclaimer: true,
            magicWordTrigger: true,
            coordinationSensitive: true
        },
        statement: {
            requiresDisclaimer: false,
            magicWordTrigger: true,
            coordinationSensitive: false
        },
        fundraising: {
            requiresDisclaimer: true,
            magicWordTrigger: false,
            coordinationSensitive: true
        },
        social_media: {
            requiresDisclaimer: false, // Unless it's a paid ad
            magicWordTrigger: true,
            coordinationSensitive: false
        }
    },

    // Regulatory citations for violations
    citations: {
        express_advocacy: '52 U.S.C. § 30104(f), Buckley v. Valeo',
        coordination: '11 CFR § 109.21',
        foreign_national: '52 U.S.C. § 30121',
        disclaimer: '11 CFR § 110.11',
        corporate: '52 U.S.C. § 30118, Citizens United v. FEC',
        contribution_limits: '52 U.S.C. § 30116'
    },

    // Common exceptions and safe harbors
    safeHarbors: {
        news_media: {
            description: 'News media exemption',
            citation: '11 CFR § 100.73'
        },
        volunteer_activity: {
            description: 'Volunteer activity exemption',
            citation: '11 CFR § 100.74'
        },
        candidate_personal_funds: {
            description: 'Candidate personal funds',
            citation: '11 CFR § 100.33'
        }
    }
};