class ComplianceAnalyzer {
    constructor() {
        this.complianceCategories = {
            campaign_finance: {
                name: 'Campaign Finance Compliance',
                priority: 'critical',
                checks: [
                    'paid_for_disclaimer',
                    'authorization_statement',
                    'funding_source_disclosure',
                    'coordination_compliance'
                ]
            },
            election_law: {
                name: 'Election Law Compliance',
                priority: 'high',
                checks: [
                    'candidate_authorization',
                    'office_designation',
                    'election_date_accuracy',
                    'jurisdiction_compliance'
                ]
            },
            content_standards: {
                name: 'Content Standards',
                priority: 'medium',
                checks: [
                    'truthfulness_standard',
                    'defamation_risk',
                    'privacy_concerns',
                    'accessibility_compliance'
                ]
            },
            media_ethics: {
                name: 'Media Ethics',
                priority: 'medium',
                checks: [
                    'source_attribution',
                    'fact_verification',
                    'bias_disclosure',
                    'conflict_of_interest'
                ]
            }
        };

        this.requiredElements = {
            paid_for_disclaimer: {
                patterns: [/paid for by/i, /authorized by/i, /sponsored by/i],
                severity: 'critical',
                description: 'FEC-required "Paid for by" disclaimer'
            },
            authorization_statement: {
                patterns: [/authorized by.*candidate/i, /approved.*message/i],
                severity: 'high',
                description: 'Candidate authorization statement'
            },
            contact_information: {
                patterns: [/\d{3}[-.]?\d{3}[-.]?\d{4}/, /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/],
                severity: 'medium',
                description: 'Valid contact information'
            }
        };

        this.prohibitedContent = {
            false_statements: {
                indicators: ['guaranteed', 'promises', 'will definitely', 'impossible to'],
                severity: 'high',
                description: 'Potentially false or misleading statements'
            },
            personal_attacks: {
                indicators: ['corrupt', 'criminal', 'dishonest', 'liar'],
                severity: 'medium',
                description: 'Personal attacks that may constitute defamation'
            },
            voter_suppression: {
                indicators: ['wrong date', 'voting closed', 'id required'],
                severity: 'critical',
                description: 'Potential voter suppression content'
            }
        };
    }

    analyze(text, metadata = {}) {
        const complianceResults = this.checkCompliance(text);
        const legalRisks = this.assessLegalRisks(text);
        const ethicalConcerns = this.evaluateEthics(text);
        const recommendations = this.generateComplianceRecommendations(complianceResults, legalRisks, ethicalConcerns);

        const overallScore = this.calculateComplianceScore(complianceResults, legalRisks);

        return {
            overall_compliance: {
                score: overallScore,
                status: this.getComplianceStatus(overallScore),
                risk_level: this.getRiskLevel(legalRisks)
            },
            compliance_checks: complianceResults,
            legal_assessment: legalRisks,
            ethical_evaluation: ethicalConcerns,
            recommendations: recommendations,
            action_items: this.generateActionItems(complianceResults, legalRisks)
        };
    }

    checkCompliance(text) {
        const results = {};

        for (const [category, config] of Object.entries(this.complianceCategories)) {
            results[category] = {
                name: config.name,
                priority: config.priority,
                checks: {},
                category_score: 0,
                issues_found: 0
            };

            for (const checkType of config.checks) {
                const checkResult = this.performComplianceCheck(text, checkType);
                results[category].checks[checkType] = checkResult;

                if (checkResult.status === 'fail') {
                    results[category].issues_found++;
                } else if (checkResult.status === 'pass') {
                    results[category].category_score += 25; // Each check worth 25 points
                }
            }

            results[category].category_score = Math.min(results[category].category_score, 100);
        }

        return results;
    }

    performComplianceCheck(text, checkType) {
        const textLower = text.toLowerCase();

        switch (checkType) {
            case 'paid_for_disclaimer':
                return this.checkPaidForDisclaimer(text);
            case 'authorization_statement':
                return this.checkAuthorizationStatement(text);
            case 'funding_source_disclosure':
                return this.checkFundingDisclosure(text);
            case 'candidate_authorization':
                return this.checkCandidateAuthorization(text);
            case 'office_designation':
                return this.checkOfficeDesignation(text);
            case 'truthfulness_standard':
                return this.checkTruthfulness(text);
            case 'source_attribution':
                return this.checkSourceAttribution(text);
            default:
                return { status: 'not_implemented', message: 'Check not yet implemented' };
        }
    }

    checkPaidForDisclaimer(text) {
        const patterns = [
            /paid for by\s+[^\n.]{5,}/i,
            /authorized by\s+[^\n.]{5,}/i,
            /sponsored by\s+[^\n.]{5,}/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    status: 'pass',
                    message: 'Paid for disclaimer found',
                    found_text: match[0],
                    location: text.indexOf(match[0])
                };
            }
        }

        return {
            status: 'fail',
            message: 'Required "Paid for by" disclaimer missing',
            severity: 'critical',
            fix_suggestion: 'Add "Paid for by [Organization Name]" at the end of the content'
        };
    }

    checkAuthorizationStatement(text) {
        const patterns = [
            /authorized by.*candidate/i,
            /approved.*message/i,
            /\w+\s+for\s+\w+.*campaign/i
        ];

        for (const pattern of patterns) {
            if (pattern.test(text)) {
                return {
                    status: 'pass',
                    message: 'Authorization statement found'
                };
            }
        }

        return {
            status: 'warning',
            message: 'Authorization statement recommended',
            severity: 'medium',
            fix_suggestion: 'Consider adding candidate authorization statement'
        };
    }

    checkFundingDisclosure(text) {
        // Check for common funding sources
        const fundingSources = [
            /individual contributions/i,
            /small donor/i,
            /grassroots/i,
            /self-funded/i,
            /committee/i
        ];

        for (const source of fundingSources) {
            if (source.test(text)) {
                return {
                    status: 'pass',
                    message: 'Funding source information present'
                };
            }
        }

        return {
            status: 'info',
            message: 'Consider including funding source information',
            severity: 'low'
        };
    }

    checkCandidateAuthorization(text) {
        // Look for candidate approval language
        const approvalPatterns = [
            /I'm\s+\w+.*and I approve/i,
            /approved by.*candidate/i,
            /\w+.*approves this message/i
        ];

        for (const pattern of approvalPatterns) {
            if (pattern.test(text)) {
                return {
                    status: 'pass',
                    message: 'Candidate authorization found'
                };
            }
        }

        return {
            status: 'warning',
            message: 'Candidate authorization statement recommended',
            fix_suggestion: 'Add "I\'m [Name] and I approve this message"'
        };
    }

    checkOfficeDesignation(text) {
        const officePatterns = [
            /for\s+(mayor|governor|senator|representative|commissioner|council)/i,
            /(mayor|governor|senator|representative|commissioner|council).*candidate/i,
            /running for\s+\w+/i
        ];

        for (const pattern of officePatterns) {
            if (pattern.test(text)) {
                return {
                    status: 'pass',
                    message: 'Office designation found'
                };
            }
        }

        return {
            status: 'warning',
            message: 'Clear office designation recommended',
            fix_suggestion: 'Clearly state the office being sought'
        };
    }

    checkTruthfulness(text) {
        const problematicClaims = [
            /will eliminate all/i,
            /promises to/i,
            /guarantees/i,
            /never fails/i,
            /always works/i
        ];

        const issues = [];
        for (const pattern of problematicClaims) {
            const matches = [...text.matchAll(new RegExp(pattern.source, 'gi'))];
            for (const match of matches) {
                issues.push({
                    text: match[0],
                    concern: 'Potentially overstated claim'
                });
            }
        }

        if (issues.length === 0) {
            return {
                status: 'pass',
                message: 'No obvious truthfulness concerns detected'
            };
        }

        return {
            status: 'warning',
            message: `${issues.length} potentially overstated claims found`,
            details: issues,
            fix_suggestion: 'Consider moderating absolute claims'
        };
    }

    checkSourceAttribution(text) {
        const citationPatterns = [
            /according to/i,
            /source:/i,
            /study by/i,
            /research shows/i,
            /data from/i
        ];

        const statsWithoutSources = text.match(/\d+%|\$[\d,]+|\d+\s+(percent|million|billion)/g) || [];
        const citations = citationPatterns.filter(pattern => pattern.test(text)).length;

        if (statsWithoutSources.length > 0 && citations === 0) {
            return {
                status: 'warning',
                message: 'Statistics found without source attribution',
                fix_suggestion: 'Add sources for statistical claims'
            };
        }

        return {
            status: 'pass',
            message: 'Source attribution appears adequate'
        };
    }

    assessLegalRisks(text) {
        const risks = [];

        // Check for potential defamation
        const defamationIndicators = [
            /corrupt/i, /criminal/i, /dishonest/i, /liar/i, /fraud/i
        ];

        for (const indicator of defamationIndicators) {
            if (indicator.test(text)) {
                risks.push({
                    type: 'defamation',
                    severity: 'high',
                    description: 'Potential defamatory language detected',
                    recommendation: 'Review statements about opponents for factual accuracy'
                });
                break;
            }
        }

        // Check for copyright issues
        if (text.includes('©') || text.includes('copyright')) {
            risks.push({
                type: 'copyright',
                severity: 'medium',
                description: 'Copyrighted material may be referenced',
                recommendation: 'Verify proper licensing for any copyrighted content'
            });
        }

        return risks;
    }

    evaluateEthics(text) {
        const concerns = [];

        // Check for transparency
        if (!text.toLowerCase().includes('paid for') && !text.toLowerCase().includes('sponsored')) {
            concerns.push({
                category: 'transparency',
                level: 'medium',
                issue: 'Funding transparency could be improved',
                suggestion: 'Consider more prominent funding disclosure'
            });
        }

        // Check for accessibility
        if (text.length > 0 && !/contact|information|phone|email|website/i.test(text)) {
            concerns.push({
                category: 'accessibility',
                level: 'low',
                issue: 'Limited contact information',
                suggestion: 'Ensure accessible contact methods are provided'
            });
        }

        return concerns;
    }

    generateComplianceRecommendations(complianceResults, legalRisks, ethicalConcerns) {
        const recommendations = [];

        // High priority compliance issues
        for (const [category, results] of Object.entries(complianceResults)) {
            if (results.priority === 'critical' && results.issues_found > 0) {
                recommendations.push({
                    priority: 'critical',
                    category: results.name,
                    action: `Address ${results.issues_found} critical compliance issue(s)`,
                    details: Object.values(results.checks).filter(check => check.status === 'fail')
                });
            }
        }

        // Legal risk mitigation
        for (const risk of legalRisks) {
            if (risk.severity === 'high') {
                recommendations.push({
                    priority: 'high',
                    category: 'Legal Risk',
                    action: risk.recommendation,
                    details: risk.description
                });
            }
        }

        return recommendations.slice(0, 5); // Top 5 recommendations
    }

    generateActionItems(complianceResults, legalRisks) {
        const actionItems = [];

        // Critical fixes needed
        for (const [category, results] of Object.entries(complianceResults)) {
            for (const [checkType, check] of Object.entries(results.checks)) {
                if (check.status === 'fail' && check.fix_suggestion) {
                    actionItems.push({
                        urgency: 'immediate',
                        action: check.fix_suggestion,
                        reason: check.message
                    });
                }
            }
        }

        return actionItems;
    }

    calculateComplianceScore(complianceResults, legalRisks) {
        let totalScore = 0;
        let categoryCount = 0;

        for (const [category, results] of Object.entries(complianceResults)) {
            totalScore += results.category_score;
            categoryCount++;
        }

        const baseScore = categoryCount > 0 ? totalScore / categoryCount : 0;

        // Deduct points for legal risks
        const riskPenalty = legalRisks.filter(risk => risk.severity === 'high').length * 10;

        return Math.max(0, Math.round(baseScore - riskPenalty));
    }

    getComplianceStatus(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Acceptable';
        if (score >= 60) return 'Needs Improvement';
        return 'Non-Compliant';
    }

    getRiskLevel(risks) {
        const highRisks = risks.filter(risk => risk.severity === 'high').length;
        const mediumRisks = risks.filter(risk => risk.severity === 'medium').length;

        if (highRisks > 0) return 'High';
        if (mediumRisks > 1) return 'Medium';
        if (mediumRisks > 0) return 'Low';
        return 'Minimal';
    }
}

module.exports = ComplianceAnalyzer;