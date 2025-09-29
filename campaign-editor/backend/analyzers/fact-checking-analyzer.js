class FactCheckingAnalyzer {
    constructor() {
        this.claimTypes = {
            statistical: {
                name: 'Statistical Claims',
                priority: 'high',
                patterns: [
                    /\d+%|\d+\s*percent/gi,
                    /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|trillion))?/gi,
                    /\d+(?:,\d{3})*(?:\s*(?:million|billion|trillion))?/gi,
                    /\d+\s*(?:times|fold)\s+(?:more|less|higher|lower)/gi,
                    /increased|decreased|rose|fell.*?(?:by|to)\s*\d+/gi
                ]
            },
            factual: {
                name: 'Factual Claims',
                priority: 'high',
                patterns: [
                    /(?:first|only|never|always|every|all|none|no one).*?(?:to|in|has|have|will|was|were)/gi,
                    /according to|study shows|research indicates|experts say/gi,
                    /proven|established|documented|confirmed|verified/gi,
                    /since \d{4}|in \d{4}|during the/gi
                ]
            },
            comparative: {
                name: 'Comparative Claims',
                priority: 'medium',
                patterns: [
                    /(?:better|worse|higher|lower|more|less|faster|slower).*?than/gi,
                    /(?:best|worst|highest|lowest|most|least|fastest|slowest).*?in/gi,
                    /leads|leading|tops|ranks.*?(?:first|#1|number one)/gi,
                    /compared to|versus|vs\./gi
                ]
            },
            predictive: {
                name: 'Predictive Claims',
                priority: 'medium',
                patterns: [
                    /will\s+(?:create|eliminate|reduce|increase|improve|fix)/gi,
                    /plan to|intend to|going to|promise to/gi,
                    /by \d{4}|within.*?(?:years|months|days)/gi,
                    /predicts?|forecasts?|estimates?|projects?/gi
                ]
            }
        };

        this.verifiabilityIndicators = {
            high: {
                sources: ['according to', 'study by', 'research from', 'data from', 'statistics show', 'census data'],
                specificity: ['specific dates', 'exact numbers', 'named institutions', 'cited studies'],
                transparency: ['source:', 'reference:', 'study:', 'report:']
            },
            medium: {
                vague_sources: ['experts say', 'studies show', 'research indicates', 'analysts believe'],
                general_claims: ['many', 'most', 'often', 'typically', 'generally']
            },
            low: {
                unsupported: ['everyone knows', 'it\'s obvious', 'clearly', 'obviously'],
                absolutes: ['never', 'always', 'all', 'none', 'every', 'no one'],
                opinions: ['believe', 'think', 'feel', 'seems', 'appears']
            }
        };

        this.redFlags = {
            misleading_language: {
                patterns: [
                    /up to \d+/gi, // "up to 50%" could mean anything from 0-50%
                    /as much as/gi,
                    /could save/gi,
                    /may reduce/gi,
                    /might increase/gi
                ],
                severity: 'medium',
                description: 'Potentially misleading qualifiers'
            },
            correlation_causation: {
                patterns: [
                    /because of.*(?:increased|decreased|rose|fell)/gi,
                    /due to.*(?:resulted in|caused|led to)/gi,
                    /as a result of/gi
                ],
                severity: 'medium',
                description: 'Potential correlation vs causation confusion'
            },
            cherry_picking: {
                patterns: [
                    /in one study/gi,
                    /according to one/gi,
                    /a single/gi,
                    /one example/gi
                ],
                severity: 'low',
                description: 'Potential cherry-picking of evidence'
            },
            outdated_claims: {
                patterns: [
                    /in \d{4}/g, // Will check if year is more than 5 years old
                    /since \d{4}/g,
                    /back in/gi,
                    /years ago/gi
                ],
                severity: 'medium',
                description: 'Potentially outdated information'
            }
        };

        this.factCheckingSources = [
            'PolitiFact', 'FactCheck.org', 'Snopes', 'Washington Post Fact Checker',
            'AP Fact Check', 'Reuters Fact Check', 'BBC Reality Check',
            'NPR Fact Check', 'USA Today Fact Check'
        ];
    }

    analyze(text, metadata = {}) {
        const claims = this.extractClaims(text);
        const verifiability = this.assessVerifiability(text, claims);
        const redFlags = this.identifyRedFlags(text);
        const recommendations = this.generateRecommendations(claims, verifiability, redFlags);
        const factCheckPriority = this.prioritizeFactChecking(claims, verifiability);

        const overallScore = this.calculateFactCheckScore(claims, verifiability, redFlags);

        return {
            overall_assessment: {
                score: overallScore,
                status: this.getFactCheckStatus(overallScore),
                total_claims: claims.length,
                high_priority_claims: claims.filter(claim => claim.priority === 'high').length,
                verification_level: this.getVerificationLevel(verifiability)
            },
            extracted_claims: claims,
            verifiability_assessment: verifiability,
            red_flags: redFlags,
            fact_check_priorities: factCheckPriority,
            recommendations: recommendations,
            suggested_sources: this.suggestFactCheckSources(claims),
            action_items: this.generateActionItems(claims, redFlags)
        };
    }

    extractClaims(text) {
        const claims = [];
        let claimId = 1;

        for (const [type, config] of Object.entries(this.claimTypes)) {
            for (const pattern of config.patterns) {
                const matches = [...text.matchAll(pattern)];

                for (const match of matches) {
                    const claim = {
                        id: claimId++,
                        type: type,
                        category: config.name,
                        priority: config.priority,
                        text: match[0],
                        context: this.getContext(text, match.index, 50),
                        position: match.index,
                        verifiability: this.assessClaimVerifiability(match[0]),
                        suggested_verification: this.suggestVerificationMethod(match[0], type)
                    };

                    claims.push(claim);
                }
            }
        }

        // Remove duplicates and overlapping claims
        return this.deduplicateClaims(claims);
    }

    getContext(text, position, contextLength) {
        const start = Math.max(0, position - contextLength);
        const end = Math.min(text.length, position + contextLength);
        return text.substring(start, end).replace(/\n/g, ' ').trim();
    }

    assessClaimVerifiability(claimText) {
        const textLower = claimText.toLowerCase();

        // High verifiability indicators
        for (const indicator of this.verifiabilityIndicators.high.sources) {
            if (textLower.includes(indicator)) {
                return {
                    level: 'high',
                    reason: 'Contains source attribution',
                    confidence: 0.8
                };
            }
        }

        // Check for specific numbers/dates
        if (/\d{4}|\d+%|\$[\d,]+/.test(claimText)) {
            return {
                level: 'medium',
                reason: 'Contains specific measurable data',
                confidence: 0.6
            };
        }

        // Low verifiability indicators
        for (const indicator of this.verifiabilityIndicators.low.absolutes) {
            if (textLower.includes(indicator)) {
                return {
                    level: 'low',
                    reason: 'Contains absolute statements without evidence',
                    confidence: 0.3
                };
            }
        }

        return {
            level: 'medium',
            reason: 'General claim requiring verification',
            confidence: 0.5
        };
    }

    suggestVerificationMethod(claimText, claimType) {
        const suggestions = [];

        switch (claimType) {
            case 'statistical':
                suggestions.push('Check original data source');
                suggestions.push('Verify calculation methodology');
                suggestions.push('Confirm time period and scope');
                if (claimText.includes('$')) {
                    suggestions.push('Adjust for inflation if historical');
                }
                break;

            case 'factual':
                suggestions.push('Cross-reference with authoritative sources');
                suggestions.push('Check publication date of source material');
                suggestions.push('Verify context wasn\'t stripped away');
                break;

            case 'comparative':
                suggestions.push('Verify comparison methodology');
                suggestions.push('Check if like-for-like comparison');
                suggestions.push('Confirm time period consistency');
                break;

            case 'predictive':
                suggestions.push('Review basis for prediction');
                suggestions.push('Check expert consensus');
                suggestions.push('Verify feasibility assessment');
                break;
        }

        return suggestions;
    }

    assessVerifiability(text, claims) {
        const assessment = {
            overall_level: 'medium',
            source_attribution: this.checkSourceAttribution(text),
            specificity_score: this.calculateSpecificity(claims),
            transparency_indicators: this.findTransparencyIndicators(text),
            verification_barriers: this.identifyVerificationBarriers(text, claims)
        };

        // Calculate overall level
        if (assessment.source_attribution.score > 0.7 && assessment.specificity_score > 0.7) {
            assessment.overall_level = 'high';
        } else if (assessment.source_attribution.score < 0.3 || assessment.specificity_score < 0.3) {
            assessment.overall_level = 'low';
        }

        return assessment;
    }

    checkSourceAttribution(text) {
        const sourcePatterns = [
            /according to [^,.\n]{10,}/gi,
            /study by [^,.\n]{5,}/gi,
            /research from [^,.\n]{5,}/gi,
            /data from [^,.\n]{5,}/gi,
            /source: [^,.\n]{5,}/gi
        ];

        const attributions = [];
        let totalMatches = 0;

        for (const pattern of sourcePatterns) {
            const matches = [...text.matchAll(pattern)];
            totalMatches += matches.length;
            attributions.push(...matches.map(m => m[0]));
        }

        const wordCount = text.split(/\s+/).length;
        const attributionDensity = totalMatches / (wordCount / 100); // per 100 words

        return {
            score: Math.min(attributionDensity / 2, 1), // Normalize to 0-1
            count: totalMatches,
            examples: attributions.slice(0, 3),
            density: attributionDensity
        };
    }

    calculateSpecificity(claims) {
        if (claims.length === 0) return 0;

        const specificClaims = claims.filter(claim =>
            /\d{4}|\d+%|\$[\d,]+|specific|exact|precisely/.test(claim.text)
        );

        return specificClaims.length / claims.length;
    }

    findTransparencyIndicators(text) {
        const indicators = [];

        const transparencyPatterns = [
            { pattern: /methodology:/gi, type: 'methodology' },
            { pattern: /sample size:/gi, type: 'sample_size' },
            { pattern: /margin of error:/gi, type: 'margin_of_error' },
            { pattern: /confidence level:/gi, type: 'confidence_level' },
            { pattern: /time period:/gi, type: 'time_period' },
            { pattern: /limitations?:/gi, type: 'limitations' }
        ];

        for (const { pattern, type } of transparencyPatterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                indicators.push({
                    type: type,
                    count: matches.length,
                    examples: matches.slice(0, 2).map(m => m[0])
                });
            }
        }

        return indicators;
    }

    identifyVerificationBarriers(text, claims) {
        const barriers = [];

        // Check for vague language
        const vaguePatterns = [
            { pattern: /many experts/gi, barrier: 'Vague expert references' },
            { pattern: /studies show/gi, barrier: 'Unspecified studies' },
            { pattern: /research indicates/gi, barrier: 'Unspecified research' },
            { pattern: /some say/gi, barrier: 'Unattributed opinions' }
        ];

        for (const { pattern, barrier } of vaguePatterns) {
            if (pattern.test(text)) {
                barriers.push(barrier);
            }
        }

        // Check for paywalled or restricted sources
        if (/proprietary|internal|confidential|classified/.test(text.toLowerCase())) {
            barriers.push('Restricted access sources');
        }

        // Check for very recent claims
        const currentYear = new Date().getFullYear();
        const recentYearPattern = new RegExp(`in ${currentYear}|this year`, 'gi');
        if (recentYearPattern.test(text)) {
            barriers.push('Very recent claims may lack comprehensive verification');
        }

        return barriers;
    }

    identifyRedFlags(text) {
        const flags = [];

        for (const [flagType, config] of Object.entries(this.redFlags)) {
            for (const pattern of config.patterns) {
                const matches = [...text.matchAll(pattern)];

                for (const match of matches) {
                    let severity = config.severity;

                    // Special handling for outdated claims
                    if (flagType === 'outdated_claims') {
                        const yearMatch = match[0].match(/\d{4}/);
                        if (yearMatch) {
                            const year = parseInt(yearMatch[0]);
                            const currentYear = new Date().getFullYear();
                            const yearsOld = currentYear - year;

                            if (yearsOld > 10) severity = 'high';
                            else if (yearsOld > 5) severity = 'medium';
                            else continue; // Skip if less than 5 years old
                        }
                    }

                    flags.push({
                        type: flagType,
                        severity: severity,
                        text: match[0],
                        description: config.description,
                        position: match.index,
                        context: this.getContext(text, match.index, 30)
                    });
                }
            }
        }

        return flags;
    }

    prioritizeFactChecking(claims, verifiability) {
        const priorities = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };

        for (const claim of claims) {
            let priority = 'medium';

            // High priority factors
            if (claim.priority === 'high' && claim.verifiability.level === 'low') {
                priority = 'critical';
            } else if (claim.type === 'statistical' || claim.type === 'factual') {
                priority = 'high';
            } else if (claim.verifiability.level === 'low') {
                priority = 'high';
            } else if (claim.type === 'predictive') {
                priority = 'low';
            }

            priorities[priority].push({
                claim_id: claim.id,
                text: claim.text,
                reason: this.getPriorityReason(claim, priority),
                verification_steps: claim.suggested_verification
            });
        }

        return priorities;
    }

    getPriorityReason(claim, priority) {
        switch (priority) {
            case 'critical':
                return 'High-impact claim with low verifiability';
            case 'high':
                return `${claim.category} requiring verification`;
            case 'medium':
                return 'Standard fact-checking priority';
            case 'low':
                return 'Lower verification priority';
            default:
                return 'Standard priority';
        }
    }

    generateRecommendations(claims, verifiability, redFlags) {
        const recommendations = [];

        // Source attribution recommendations
        if (verifiability.source_attribution.score < 0.5) {
            recommendations.push({
                priority: 'high',
                category: 'Source Attribution',
                action: 'Add specific source citations for statistical and factual claims',
                impact: 'Significantly improves verifiability and credibility'
            });
        }

        // Red flag mitigation
        const highSeverityFlags = redFlags.filter(flag => flag.severity === 'high');
        if (highSeverityFlags.length > 0) {
            recommendations.push({
                priority: 'critical',
                category: 'Content Quality',
                action: `Address ${highSeverityFlags.length} high-severity content issues`,
                impact: 'Prevents potential misinformation or credibility damage'
            });
        }

        // Specificity improvements
        if (verifiability.specificity_score < 0.4) {
            recommendations.push({
                priority: 'medium',
                category: 'Specificity',
                action: 'Add specific dates, numbers, and details to claims',
                impact: 'Makes claims more verifiable and convincing'
            });
        }

        // Verification preparation
        const highPriorityClaims = claims.filter(claim => claim.priority === 'high').length;
        if (highPriorityClaims > 3) {
            recommendations.push({
                priority: 'medium',
                category: 'Fact-Checking Preparation',
                action: 'Prepare documentation for high-priority claims before publication',
                impact: 'Enables rapid response to fact-checking inquiries'
            });
        }

        return recommendations.slice(0, 5); // Top 5 recommendations
    }

    suggestFactCheckSources(claims) {
        const suggestions = [...this.factCheckingSources];

        // Add specialized sources based on claim types
        const claimTypes = [...new Set(claims.map(claim => claim.type))];

        if (claimTypes.includes('statistical')) {
            suggestions.push('Bureau of Labor Statistics', 'Census Bureau', 'Federal Reserve Economic Data');
        }

        if (claimTypes.includes('factual')) {
            suggestions.push('Government accountability databases', 'Academic research databases');
        }

        return suggestions.slice(0, 8); // Return top 8 suggestions
    }

    generateActionItems(claims, redFlags) {
        const actionItems = [];

        // Critical red flags
        const criticalFlags = redFlags.filter(flag => flag.severity === 'high');
        for (const flag of criticalFlags) {
            actionItems.push({
                urgency: 'immediate',
                action: `Review and revise: "${flag.text}"`,
                reason: flag.description,
                type: 'content_revision'
            });
        }

        // High-priority unverifiable claims
        const unverifiableClaims = claims.filter(claim =>
            claim.priority === 'high' && claim.verifiability.level === 'low'
        );

        for (const claim of unverifiableClaims.slice(0, 3)) {
            actionItems.push({
                urgency: 'high',
                action: `Verify or add source for: "${claim.text.substring(0, 50)}..."`,
                reason: 'High-impact claim lacks verification',
                type: 'fact_checking'
            });
        }

        return actionItems;
    }

    calculateFactCheckScore(claims, verifiability, redFlags) {
        let score = 100;

        // Deduct for unverifiable claims
        const unverifiableClaims = claims.filter(claim => claim.verifiability.level === 'low').length;
        score -= unverifiableClaims * 10;

        // Deduct for poor source attribution
        score -= (1 - verifiability.source_attribution.score) * 20;

        // Deduct for red flags
        const flagPenalty = redFlags.reduce((penalty, flag) => {
            switch (flag.severity) {
                case 'high': return penalty + 15;
                case 'medium': return penalty + 10;
                case 'low': return penalty + 5;
                default: return penalty;
            }
        }, 0);
        score -= flagPenalty;

        // Bonus for high specificity
        score += verifiability.specificity_score * 10;

        return Math.max(0, Math.round(score));
    }

    getFactCheckStatus(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Acceptable';
        if (score >= 60) return 'Needs Review';
        return 'Requires Significant Fact-Checking';
    }

    getVerificationLevel(verifiability) {
        return verifiability.overall_level;
    }

    deduplicateClaims(claims) {
        const seen = new Set();
        const deduplicated = [];

        for (const claim of claims) {
            const normalized = claim.text.toLowerCase().replace(/\s+/g, ' ').trim();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                deduplicated.push(claim);
            }
        }

        return deduplicated;
    }
}

module.exports = FactCheckingAnalyzer;