/**
 * Fact Identification Analyzer
 * Identifies content requiring fact-checking verification with sophisticated detection
 */

class FactIdentificationAnalyzer {
    constructor() {
        // Patterns that strongly indicate factual claims requiring verification
        this.factualIndicators = {
            // Statistical claims
            statistical: {
                patterns: [
                    /\b\d+([,.]?\d+)*\s*%\b/g,                    // "47%", "3.2%"
                    /\b\d+([,.]?\d+)*\s*(percent|percentage)\b/gi, // "25 percent"
                    /\b\d+([,.]?\d+)*\s*(million|billion|thousand|trillion)\b/gi, // "2.3 million"
                    /\b\d+([,.]?\d+)*\s*(times (more|less|higher|lower))\b/gi,   // "3 times more"
                    /\b(doubled|tripled|quadrupled|halved)\b/gi,   // "doubled since"
                    /\b(increased|decreased|risen|fallen)\s+by\s+\d+/gi, // "increased by 25"
                    /\b\$\d+([,.]?\d+)*(k|K|m|M|b|B)?\b/g,        // "$5.2 million", "$100k"
                ],
                priority: 'high',
                description: 'Numerical claims that can be verified against data'
            },

            // Attribution claims (citing sources)
            attribution: {
                patterns: [
                    /\b(according to|as reported by|per|based on)\s+[A-Z]/gi,
                    /\b(study|report|survey|poll|analysis)\s+(shows|found|revealed|indicates)\b/gi,
                    /\b[A-Z][a-z]+\s+(University|Institute|Foundation|Center)\s+(study|research|found)\b/gi,
                    /\b(CDC|FBI|CIA|NASA|EPA|IRS|CBO|GAO|BLS)\s+(data|report|study|says|found)\b/gi,
                    /\b(Pew|Gallup|Harris|Quinnipiac|CNN|Fox|ABC|NBC|CBS)\s+(poll|survey)\b/gi,
                ],
                priority: 'critical',
                description: 'Claims citing specific sources that must be verified'
            },

            // Historical claims
            historical: {
                patterns: [
                    /\b(since|from)\s+\d{4}\b/g,                  // "since 2020"
                    /\b(during|under|when)\s+[A-Z][a-z]+('s)?\s+(presidency|administration|term)\b/gi,
                    /\b(first|last|only)\s+(time|president|governor|mayor)\s+(to|in|since)\b/gi,
                    /\bhappened\s+(before|after|during)\b/gi,
                    /\bnever\s+(before|again|in|since)\b/gi,
                    /\b(always|never)\s+(been|done|happened)\b/gi,
                ],
                priority: 'medium',
                description: 'Historical comparisons and temporal claims'
            },

            // Policy claims
            policy: {
                patterns: [
                    /\b(will (save|cost|create|eliminate))\s+\d+/gi,
                    /\b(plan\s+(will|would)\s+(reduce|increase|create))\b/gi,
                    /\bmyour plan (would|will)/gi,
                    /\b(promises|promised|pledged)\s+to\b/gi,
                    /\b(voted (for|against))\s+[A-Z]/gi,
                    /\b(supports|opposes|endorsed|backed)\s+[A-Z]/gi,
                ],
                priority: 'high',
                description: 'Policy positions and voting record claims'
            },

            // Comparative claims
            comparative: {
                patterns: [
                    /\b(more|less|higher|lower|better|worse)\s+than\s+[A-Z]/gi,
                    /\b(leads|trails|ahead of|behind)\s+[A-Z]/gi,
                    /\b(first|second|third|last|worst|best)\s+in\s+(the\s+)?(nation|country|state)\b/gi,
                    /\b(only|just)\s+(one|two|three|candidate|governor|president)\b/gi,
                    /\b(unlike|different from|compared to)\s+[A-Z]/gi,
                ],
                priority: 'medium',
                description: 'Comparative rankings and contrasts'
            },

            // Definitive statements
            definitive: {
                patterns: [
                    /\b(fact is|truth is|reality is)\b/gi,
                    /\b(proven|demonstrated|confirmed|verified)\s+(that|to be)\b/gi,
                    /\b(everyone knows|everybody knows|it's obvious)\b/gi,
                    /\b(without (a )?doubt|certainly|definitely|absolutely)\s+[a-z]/gi,
                    /\b(impossible|never|always|all|none|every)\s+[a-z]/gi,
                ],
                priority: 'medium',
                description: 'Absolute statements that may need qualification'
            },

            // Geographic/demographic claims
            demographic: {
                patterns: [
                    /\b(Americans|voters|families|workers|seniors|youth)\s+(believe|think|want|need)\b/gi,
                    /\b(majority|minority|most|few|many)\s+of\s+(Americans|voters|people)\b/gi,
                    /\bin\s+(my|our|this)\s+(state|district|city|county)\b/gi,
                    /\b(rural|urban|suburban)\s+(voters|families|communities)\s+(are|want|need)\b/gi,
                ],
                priority: 'medium',
                description: 'Claims about public opinion and demographics'
            }
        };

        // Context clues that increase fact-checking priority
        this.contextClues = {
            highPriority: [
                'breaking news', 'just reported', 'new study', 'latest data',
                'recent poll', 'just released', 'investigation found',
                'experts say', 'scientists confirm'
            ],
            mediumPriority: [
                'analysis shows', 'research indicates', 'data suggests',
                'reports indicate', 'studies show', 'evidence suggests'
            ],
            disputeIndicators: [
                'my opponent claims', 'they say', 'allegations', 'supposedly',
                'so-called', 'fake news', 'false narrative', 'misleading'
            ]
        };

        // Subject areas that require extra scrutiny
        this.sensitiveTopics = {
            health: ['COVID', 'vaccine', 'mortality', 'infection', 'disease', 'medical', 'healthcare', 'hospital'],
            economy: ['unemployment', 'inflation', 'GDP', 'recession', 'jobs', 'wage', 'poverty', 'budget'],
            crime: ['murder', 'assault', 'robbery', 'crime rate', 'police', 'violence', 'safety'],
            immigration: ['border', 'immigration', 'deportation', 'asylum', 'refugees', 'ICE', 'visa'],
            election: ['voting', 'election', 'ballot', 'fraud', 'turnout', 'registered voters', 'results'],
            environment: ['climate', 'temperature', 'carbon', 'emissions', 'pollution', 'renewable', 'fossil']
        };

        // Reliability indicators for sources
        this.sourceReliability = {
            highReliability: [
                'Bureau of Labor Statistics', 'Census Bureau', 'Federal Reserve',
                'Congressional Budget Office', 'Government Accountability Office',
                'CDC', 'FDA', 'EPA', 'Department of'
            ],
            mediumReliability: [
                'Pew Research', 'Gallup', 'Associated Press', 'Reuters',
                'Brookings', 'American Enterprise Institute', 'Heritage Foundation'
            ],
            requiresVerification: [
                'think tank', 'advocacy group', 'blog post', 'social media',
                'unnamed source', 'anonymous', 'rumor', 'report suggests'
            ]
        };

        // Temporal indicators that affect verification urgency
        this.temporalIndicators = {
            urgent: ['today', 'this week', 'just announced', 'breaking', 'developing'],
            recent: ['this month', 'recently', 'lately', 'current', 'now'],
            historical: ['historically', 'traditionally', 'over time', 'in the past']
        };
    }

    identifyFactualClaims(content) {
        const claims = [];
        const contentLower = content.toLowerCase();

        // Split content into sentences for analysis
        const sentences = this.splitIntoSentences(content);

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const sentenceLower = sentence.toLowerCase();

            // Analyze each sentence for factual claims
            const sentenceClaims = this.analyzeSentenceForClaims(sentence, i);
            claims.push(...sentenceClaims);
        }

        // Post-process claims to add context and prioritize
        return this.prioritizeAndContextualize(claims, content);
    }

    splitIntoSentences(content) {
        // Enhanced sentence splitting that handles political content
        const sentences = content
            .replace(/([.!?])\s*(?=[A-Z])/g, '$1|') // Mark sentence boundaries
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 10); // Filter out very short fragments

        return sentences;
    }

    analyzeSentenceForClaims(sentence, index) {
        const claims = [];
        const sentenceLower = sentence.toLowerCase();

        // Check each type of factual indicator
        for (const [type, config] of Object.entries(this.factualIndicators)) {
            for (const pattern of config.patterns) {
                const matches = sentence.match(pattern);
                if (matches) {
                    const claim = {
                        text: sentence,
                        type: type,
                        priority: config.priority,
                        description: config.description,
                        position: index,
                        matches: matches,
                        confidence: this.calculateConfidence(sentence, type),
                        verificationComplexity: this.assessVerificationComplexity(sentence, type),
                        sensitiveTopics: this.identifySensitiveTopics(sentence),
                        sourceReliability: this.assessSourceReliability(sentence),
                        temporalUrgency: this.assessTemporalUrgency(sentence)
                    };

                    claims.push(claim);
                    break; // One claim per sentence to avoid duplicates
                }
            }
        }

        return claims;
    }

    calculateConfidence(sentence, type) {
        let confidence = 0.5; // Base confidence

        const sentenceLower = sentence.toLowerCase();

        // Increase confidence for strong indicators
        if (type === 'attribution' && /according to|study found|data shows/i.test(sentence)) {
            confidence += 0.3;
        }

        if (type === 'statistical' && /\d+([,.]?\d+)*\s*%/.test(sentence)) {
            confidence += 0.2;
        }

        // Increase for specific numbers vs vague claims
        if (/\b\d+([,.]?\d+)*\b/.test(sentence)) {
            confidence += 0.2;
        }

        // Increase for citing specific sources
        if (/\b(CDC|FBI|Census|Bureau|Department of)\b/i.test(sentence)) {
            confidence += 0.2;
        }

        // Decrease for vague language
        if (/\b(some|many|several|often|usually|typically)\b/i.test(sentence)) {
            confidence -= 0.1;
        }

        // Decrease for opinion markers
        if (/\b(I believe|I think|seems|appears|likely|probably)\b/i.test(sentence)) {
            confidence -= 0.2;
        }

        return Math.max(0.1, Math.min(1.0, confidence));
    }

    assessVerificationComplexity(sentence, type) {
        const sentenceLower = sentence.toLowerCase();

        // Easy to verify: specific statistics with clear sources
        if (type === 'statistical' && /according to|per|based on/i.test(sentence)) {
            return 'easy';
        }

        // Medium complexity: historical claims with specific dates
        if (type === 'historical' && /\d{4}/.test(sentence)) {
            return 'medium';
        }

        // Hard to verify: subjective comparisons or vague claims
        if (type === 'comparative' || /\b(better|worse|more effective)\b/i.test(sentence)) {
            return 'hard';
        }

        // Very hard: future predictions or complex policy impacts
        if (/\b(will (save|cost|create)|would (result|lead))\b/i.test(sentence)) {
            return 'very_hard';
        }

        return 'medium';
    }

    identifySensitiveTopics(sentence) {
        const sentenceLower = sentence.toLowerCase();
        const topics = [];

        for (const [topic, keywords] of Object.entries(this.sensitiveTopics)) {
            if (keywords.some(keyword => sentenceLower.includes(keyword.toLowerCase()))) {
                topics.push(topic);
            }
        }

        return topics;
    }

    assessSourceReliability(sentence) {
        const sentenceLower = sentence.toLowerCase();

        // Check for high-reliability sources
        for (const source of this.sourceReliability.highReliability) {
            if (sentenceLower.includes(source.toLowerCase())) {
                return 'high';
            }
        }

        // Check for medium-reliability sources
        for (const source of this.sourceReliability.mediumReliability) {
            if (sentenceLower.includes(source.toLowerCase())) {
                return 'medium';
            }
        }

        // Check for sources requiring verification
        for (const source of this.sourceReliability.requiresVerification) {
            if (sentenceLower.includes(source.toLowerCase())) {
                return 'requires_verification';
            }
        }

        // No source mentioned
        if (!/according to|per|based on|study|report|data from/i.test(sentence)) {
            return 'no_source';
        }

        return 'unknown';
    }

    assessTemporalUrgency(sentence) {
        const sentenceLower = sentence.toLowerCase();

        for (const indicator of this.temporalIndicators.urgent) {
            if (sentenceLower.includes(indicator)) {
                return 'urgent';
            }
        }

        for (const indicator of this.temporalIndicators.recent) {
            if (sentenceLower.includes(indicator)) {
                return 'recent';
            }
        }

        for (const indicator of this.temporalIndicators.historical) {
            if (sentenceLower.includes(indicator)) {
                return 'historical';
            }
        }

        return 'not_specified';
    }

    prioritizeAndContextualize(claims, fullContent) {
        // Sort claims by priority and confidence
        const prioritizedClaims = claims.sort((a, b) => {
            const priorityWeight = {
                'critical': 4,
                'high': 3,
                'medium': 2,
                'low': 1
            };

            const aScore = priorityWeight[a.priority] + a.confidence;
            const bScore = priorityWeight[b.priority] + b.confidence;

            return bScore - aScore;
        });

        // Add verification recommendations
        return prioritizedClaims.map(claim => ({
            ...claim,
            verificationSteps: this.generateVerificationSteps(claim),
            riskAssessment: this.assessFactCheckingRisk(claim),
            suggestedSources: this.suggestVerificationSources(claim)
        }));
    }

    generateVerificationSteps(claim) {
        const steps = [];

        switch (claim.type) {
            case 'statistical':
                steps.push('Locate original data source');
                steps.push('Verify numbers are current and accurate');
                steps.push('Check if context or methodology affects interpretation');
                break;

            case 'attribution':
                steps.push('Verify source exists and is credible');
                steps.push('Confirm claim accurately represents source material');
                steps.push('Check if source has been updated or corrected');
                break;

            case 'historical':
                steps.push('Cross-reference with historical records');
                steps.push('Verify dates and timeline accuracy');
                steps.push('Check for missing context or nuance');
                break;

            case 'policy':
                steps.push('Review actual policy text or voting records');
                steps.push('Check for changes in position over time');
                steps.push('Verify implementation details and timeline');
                break;

            case 'comparative':
                steps.push('Verify both sides of comparison');
                steps.push('Ensure fair and equivalent comparison metrics');
                steps.push('Check for cherry-picked data or timeframes');
                break;

            default:
                steps.push('Research claim through multiple sources');
                steps.push('Verify factual accuracy and context');
                steps.push('Check for potential bias or selective presentation');
        }

        // Add complexity-specific steps
        if (claim.verificationComplexity === 'very_hard') {
            steps.push('Consult subject matter experts');
            steps.push('Review methodology and assumptions');
        }

        return steps;
    }

    assessFactCheckingRisk(claim) {
        let riskScore = 0;
        const factors = [];

        // High confidence claims are lower risk
        riskScore += (1 - claim.confidence) * 30;

        // Sensitive topics increase risk
        if (claim.sensitiveTopics.length > 0) {
            riskScore += claim.sensitiveTopics.length * 15;
            factors.push('Covers sensitive topic areas');
        }

        // Poor source reliability increases risk
        if (claim.sourceReliability === 'no_source') {
            riskScore += 25;
            factors.push('No source provided');
        } else if (claim.sourceReliability === 'requires_verification') {
            riskScore += 20;
            factors.push('Source reliability questionable');
        }

        // Hard to verify claims are riskier
        const complexityRisk = {
            'easy': 5,
            'medium': 10,
            'hard': 20,
            'very_hard': 30
        };
        riskScore += complexityRisk[claim.verificationComplexity] || 10;

        // Temporal urgency affects risk
        if (claim.temporalUrgency === 'urgent') {
            riskScore += 15;
            factors.push('Time-sensitive claim');
        }

        return {
            score: Math.min(100, riskScore),
            level: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
            factors: factors
        };
    }

    suggestVerificationSources(claim) {
        const sources = [];

        // Government sources for statistics
        if (claim.type === 'statistical') {
            sources.push('Bureau of Labor Statistics', 'Census Bureau', 'Congressional Budget Office');
        }

        // Academic sources for research claims
        if (claim.type === 'attribution' && /study|research/i.test(claim.text)) {
            sources.push('Google Scholar', 'PubMed', 'University research databases');
        }

        // Voting record sources for policy claims
        if (claim.type === 'policy' && /voted|supports|opposes/i.test(claim.text)) {
            sources.push('Congress.gov', 'Vote Smart', 'Ballotpedia');
        }

        // Historical sources
        if (claim.type === 'historical') {
            sources.push('National Archives', 'Library of Congress', 'Historical newspapers');
        }

        // Topic-specific sources
        for (const topic of claim.sensitiveTopics) {
            switch (topic) {
                case 'health':
                    sources.push('CDC', 'FDA', 'WHO', 'Medical journals');
                    break;
                case 'economy':
                    sources.push('Federal Reserve', 'Treasury Department', 'Economic research institutes');
                    break;
                case 'crime':
                    sources.push('FBI Crime Statistics', 'Department of Justice', 'Local police reports');
                    break;
                case 'election':
                    sources.push('FEC filings', 'State election offices', 'Verified election data');
                    break;
            }
        }

        // Add fact-checking organizations
        sources.push('PolitiFact', 'FactCheck.org', 'Snopes', 'Washington Post Fact Checker');

        return [...new Set(sources)]; // Remove duplicates
    }

    // Main analysis function
    analyzeContentForFactChecking(content) {
        const claims = this.identifyFactualClaims(content);

        const analysis = {
            totalClaims: claims.length,
            highPriorityClaims: claims.filter(c => c.priority === 'critical' || c.priority === 'high').length,
            highRiskClaims: claims.filter(c => c.riskAssessment.level === 'high').length,
            sensitiveTopicClaims: claims.filter(c => c.sensitiveTopics.length > 0).length,
            unsourcedClaims: claims.filter(c => c.sourceReliability === 'no_source').length,
            claims: claims,
            overallRiskScore: this.calculateOverallRisk(claims),
            recommendations: this.generateOverallRecommendations(claims)
        };

        return analysis;
    }

    calculateOverallRisk(claims) {
        if (claims.length === 0) return 0;

        const totalRisk = claims.reduce((sum, claim) => sum + claim.riskAssessment.score, 0);
        return Math.round(totalRisk / claims.length);
    }

    generateOverallRecommendations(claims) {
        const recommendations = [];

        const highRiskClaims = claims.filter(c => c.riskAssessment.level === 'high');
        if (highRiskClaims.length > 0) {
            recommendations.push({
                priority: 'critical',
                message: `${highRiskClaims.length} high-risk claims require immediate fact-checking`,
                action: 'Verify these claims before publication'
            });
        }

        const unsourcedClaims = claims.filter(c => c.sourceReliability === 'no_source');
        if (unsourcedClaims.length > 2) {
            recommendations.push({
                priority: 'high',
                message: `${unsourcedClaims.length} claims lack source attribution`,
                action: 'Add credible sources for factual claims'
            });
        }

        const sensitiveClaims = claims.filter(c => c.sensitiveTopics.length > 0);
        if (sensitiveClaims.length > 0) {
            recommendations.push({
                priority: 'medium',
                message: `${sensitiveClaims.length} claims involve sensitive topics`,
                action: 'Extra verification recommended for health, crime, or election claims'
            });
        }

        if (claims.length > 10) {
            recommendations.push({
                priority: 'medium',
                message: 'High density of factual claims',
                action: 'Consider breaking content into smaller sections for easier verification'
            });
        }

        return recommendations;
    }
}

module.exports = new FactIdentificationAnalyzer();