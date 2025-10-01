/**
 * Quote Quality Analyzer
 * Enhanced analysis with contextual risk assessment
 * Works for any speaker (candidate, officials, supporters, etc.)
 */

class QuoteQualityAnalyzer {
    constructor() {
        // Risk patterns
        this.riskPatterns = {
            // Factual claims that need verification
            unverifiedClaims: {
                patterns: [
                    /\b\d+%\b/, // Percentages
                    /\$[\d,]+(?:million|billion|thousand)?\b/i, // Dollar amounts
                    /\b\d+(?:,\d{3})*\s+(?:people|families|voters|jobs)\b/i, // Numbers of people
                    /\b(?:most|majority|many|few)\s+(?:people|Americans|voters)\b/i, // Vague quantities
                    /\b(?:studies show|research shows|data shows)\b/i // Claims about research
                ],
                severity: 'warning',
                message: 'Quote contains factual claims that should be verified'
            },

            // Absolute statements that could be proven wrong
            absoluteCommitments: {
                patterns: [
                    /\b(?:never|always|guarantee|promise|definitely|certainly)\b/i,
                    /\b(?:will never|will always|I promise)\b/i,
                    /\b100%\b/
                ],
                severity: 'flag',
                message: 'Quote contains absolute commitment that may be difficult to keep'
            },

            // Attacks that could backfire or have legal risk
            attacks: {
                patterns: [
                    /\b(?:corrupt|corruption|criminal|illegal|liar|lying|fraud|fraudulent)\b/i,
                    /\b(?:incompetent|failure|failed|disaster)\b/i
                ],
                severity: 'warning',
                message: 'Quote contains strong attack language - verify accuracy and consider legal review'
            },

            // Naming opponents (can seem negative)
            namesOpponents: {
                patterns: [
                    /\b(?:opponent|rival|competitor)\b/i
                    // Actual names would be campaign-specific
                ],
                severity: 'info',
                message: 'Quote mentions opponent by name or reference'
            },

            // Sensitive topics
            sensitiveTopic: {
                keywords: ['abortion', 'religion', 'religious', 'guns', 'second amendment',
                          'immigration', 'transgender', 'race', 'racial'],
                severity: 'info',
                message: 'Quote addresses potentially sensitive topic'
            },

            // Ambiguous language
            ambiguousPronouns: {
                patterns: [
                    /\bthey\b.*\bthey\b/i, // Multiple "they" references
                    /\bit\b.*\bit\b/i // Multiple "it" references
                ],
                severity: 'info',
                message: 'Quote may have ambiguous pronoun references'
            },

            // Legal terms that sound unnatural
            legalLanguage: {
                keywords: ['alleged', 'purported', 'aforementioned', 'heretofore',
                          'wherein', 'thereof', 'pursuant to'],
                severity: 'warning',
                message: 'Quote uses legal terminology that sounds unnatural in speech'
            },

            // Defensive language
            defensiveLanguage: {
                patterns: [
                    /\b(?:despite what|contrary to what|regardless of what).*(?:critics|opponents|they)\b/i,
                    /\bI'm not (?:a|an)\b/i, // "I'm not a criminal"
                    /\bthat's not true\b/i,
                    /\blet me be clear\b/i // Often precedes defensive statement
                ],
                severity: 'info',
                message: 'Quote uses defensive language'
            },

            // Empty platitudes
            platitudes: {
                phrases: [
                    'at the end of the day',
                    'it is what it is',
                    'moving forward',
                    'going forward',
                    'boots on the ground',
                    'think outside the box',
                    'game changer',
                    'paradigm shift'
                ],
                severity: 'info',
                message: 'Quote contains clichéd phrases or platitudes'
            }
        };

        // Communication issues
        this.communicationIssues = {
            // Quote doesn't make a clear point
            vagueness: {
                indicators: [
                    /\b(?:something|things|stuff|issues|matters|areas)\b/gi, // Vague nouns
                    /\b(?:kind of|sort of|basically|essentially)\b/gi // Hedging
                ],
                threshold: 3,
                severity: 'flag',
                message: 'Quote is vague and doesn\'t make a clear point'
            },

            // Run-on quote
            complexity: {
                threshold: 40, // words
                severity: 'info',
                message: 'Quote is complex - consider breaking into multiple quotes'
            },

            // Run-on sentences (long sentences with many clauses)
            runOnSentence: {
                // Multiple indicators for run-on sentences
                wordThreshold: 35, // Single sentence over 35 words
                clauseThreshold: 4, // 4+ independent/dependent clauses
                conjunctionThreshold: 3, // 3+ conjunctions in one sentence
                severity: 'warning',
                message: 'Quote contains run-on sentence that is hard to follow'
            },

            // No action/impact stated
            noImpact: {
                patterns: [
                    /\b(?:good|bad|important|significant|concerned|worried)\b/i
                ],
                requiresAction: true,
                severity: 'info',
                message: 'Quote expresses opinion but doesn\'t state action or impact'
            }
        };
    }

    /**
     * Perform comprehensive quality analysis
     */
    analyzeQuote(quoteText, context = {}) {
        const analysis = {
            quote: quoteText,
            baseQualityScore: 100,
            riskLevel: 'low', // low, medium, high, critical
            flags: [],
            recommendations: []
        };

        // Run all checks
        this.checkRiskPatterns(quoteText, analysis);
        this.checkCommunicationIssues(quoteText, analysis);
        this.checkContextualRisks(quoteText, context, analysis);

        // Check candidate style consistency (only for candidate quotes)
        if (context.speakerRole === 'candidate' && context.previousCandidateQuotes) {
            this.checkCandidateStyleConsistency(quoteText, context.previousCandidateQuotes, analysis);
        }

        // Determine overall risk level
        analysis.riskLevel = this.calculateRiskLevel(analysis.flags);

        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    /**
     * Check risk patterns
     */
    checkRiskPatterns(quoteText, analysis) {
        // Check unverified claims
        const claimMatches = this.riskPatterns.unverifiedClaims.patterns.filter(p =>
            p.test(quoteText)
        ).length;

        if (claimMatches > 0) {
            analysis.flags.push({
                type: 'unverified_claims',
                severity: this.riskPatterns.unverifiedClaims.severity,
                message: this.riskPatterns.unverifiedClaims.message,
                details: `Found ${claimMatches} factual claim(s) to verify`,
                action: 'verify_facts'
            });
            analysis.baseQualityScore -= 15;
        }

        // Check absolute commitments
        const absoluteMatches = this.riskPatterns.absoluteCommitments.patterns.filter(p =>
            p.test(quoteText)
        ).length;

        if (absoluteMatches > 0) {
            analysis.flags.push({
                type: 'absolute_commitment',
                severity: this.riskPatterns.absoluteCommitments.severity,
                message: this.riskPatterns.absoluteCommitments.message,
                details: `Found ${absoluteMatches} absolute statement(s)`,
                action: 'review_commitment'
            });
            analysis.baseQualityScore -= 5;
        }

        // Check attack language
        const attackMatches = this.riskPatterns.attacks.patterns.filter(p =>
            p.test(quoteText)
        ).length;

        if (attackMatches > 0) {
            analysis.flags.push({
                type: 'attack_language',
                severity: this.riskPatterns.attacks.severity,
                message: this.riskPatterns.attacks.message,
                details: `Found ${attackMatches} strong attack term(s)`,
                action: 'legal_review'
            });
            analysis.baseQualityScore -= 20; // High risk
        }

        // Check sensitive topics
        const sensitiveCount = this.riskPatterns.sensitiveTopic.keywords.filter(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(quoteText)
        ).length;

        if (sensitiveCount > 0) {
            analysis.flags.push({
                type: 'sensitive_topic',
                severity: this.riskPatterns.sensitiveTopic.severity,
                message: this.riskPatterns.sensitiveTopic.message,
                details: 'Review for messaging consistency'
            });
            analysis.baseQualityScore -= 5;
        }

        // Check ambiguous language
        const ambiguousMatches = this.riskPatterns.ambiguousPronouns.patterns.filter(p =>
            p.test(quoteText)
        ).length;

        if (ambiguousMatches > 0) {
            analysis.flags.push({
                type: 'ambiguous_language',
                severity: this.riskPatterns.ambiguousPronouns.severity,
                message: this.riskPatterns.ambiguousPronouns.message,
                action: 'clarify_references'
            });
            analysis.baseQualityScore -= 5;
        }

        // Check legal language
        const legalCount = this.riskPatterns.legalLanguage.keywords.filter(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(quoteText)
        ).length;

        if (legalCount > 0) {
            analysis.flags.push({
                type: 'legal_language',
                severity: this.riskPatterns.legalLanguage.severity,
                message: this.riskPatterns.legalLanguage.message,
                details: `Sounds overly formal (${legalCount} legal term(s))`
            });
            analysis.baseQualityScore -= 10;
        }

        // Check defensive language
        const defensiveMatches = this.riskPatterns.defensiveLanguage.patterns.filter(p =>
            p.test(quoteText)
        ).length;

        if (defensiveMatches > 0) {
            analysis.flags.push({
                type: 'defensive_language',
                severity: this.riskPatterns.defensiveLanguage.severity,
                message: this.riskPatterns.defensiveLanguage.message,
                details: 'Consider more positive framing'
            });
            analysis.baseQualityScore -= 5;
        }

        // Check platitudes
        const platitudeCount = this.riskPatterns.platitudes.phrases.filter(phrase =>
            quoteText.toLowerCase().includes(phrase)
        ).length;

        if (platitudeCount > 0) {
            analysis.flags.push({
                type: 'platitudes',
                severity: this.riskPatterns.platitudes.severity,
                message: this.riskPatterns.platitudes.message,
                details: `Found ${platitudeCount} cliché(s)`
            });
            analysis.baseQualityScore -= 5;
        }
    }

    /**
     * Check communication issues
     */
    checkCommunicationIssues(quoteText, analysis) {
        // Check vagueness
        const vaguenessMatches = quoteText.match(this.communicationIssues.vagueness.indicators[0]);
        const hedgingMatches = quoteText.match(this.communicationIssues.vagueness.indicators[1]);
        const totalVague = (vaguenessMatches?.length || 0) + (hedgingMatches?.length || 0);

        if (totalVague >= this.communicationIssues.vagueness.threshold) {
            analysis.flags.push({
                type: 'vagueness',
                severity: this.communicationIssues.vagueness.severity,
                message: this.communicationIssues.vagueness.message,
                details: `${totalVague} vague terms found`
            });
            analysis.baseQualityScore -= 10;
        }

        // Check complexity
        const wordCount = quoteText.split(/\s+/).length;
        if (wordCount > this.communicationIssues.complexity.threshold) {
            analysis.flags.push({
                type: 'complexity',
                severity: this.communicationIssues.complexity.severity,
                message: this.communicationIssues.complexity.message,
                details: `${wordCount} words`
            });
            analysis.baseQualityScore -= 5;
        }

        // Check for run-on sentences
        const runOnIssues = this.checkRunOnSentences(quoteText);
        if (runOnIssues.isRunOn) {
            analysis.flags.push({
                type: 'run_on_sentence',
                severity: this.communicationIssues.runOnSentence.severity,
                message: this.communicationIssues.runOnSentence.message,
                details: runOnIssues.details,
                action: 'break_into_shorter_sentences'
            });
            analysis.baseQualityScore -= 15;
        }

        // Check if quote has action/impact
        const hasOpinion = this.communicationIssues.noImpact.patterns.some(p => p.test(quoteText));
        const hasAction = /\b(?:will|going to|plan to|committed to|working to|fighting for)\b/i.test(quoteText);

        if (hasOpinion && !hasAction) {
            analysis.flags.push({
                type: 'no_action',
                severity: this.communicationIssues.noImpact.severity,
                message: this.communicationIssues.noImpact.message,
                details: 'Consider adding what action will be taken'
            });
            analysis.baseQualityScore -= 5;
        }
    }

    /**
     * Check for run-on sentences
     * Detects sentences that are too long and complex
     */
    checkRunOnSentences(quoteText) {
        // Split into sentences (rough approximation)
        const sentences = quoteText.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const runOnConfig = this.communicationIssues.runOnSentence;
        const issues = [];

        sentences.forEach((sentence, idx) => {
            const words = sentence.trim().split(/\s+/);
            const wordCount = words.length;

            // Check 1: Single sentence with too many words
            if (wordCount > runOnConfig.wordThreshold) {
                issues.push(`Sentence ${idx + 1}: ${wordCount} words (over ${runOnConfig.wordThreshold})`);
            }

            // Check 2: Count coordinating conjunctions (and, but, or, nor, for, so, yet)
            const conjunctions = (sentence.match(/\b(and|but|or|nor|for|so|yet)\b/gi) || []).length;
            if (conjunctions >= runOnConfig.conjunctionThreshold) {
                issues.push(`Sentence ${idx + 1}: ${conjunctions} conjunctions (creates run-on feel)`);
            }

            // Check 3: Count clause-forming patterns
            // Commas often separate clauses
            const commas = (sentence.match(/,/g) || []).length;
            // Subordinating conjunctions (because, although, since, while, when, if, etc.)
            const subordinators = (sentence.match(/\b(because|although|since|while|when|if|unless|until|before|after|though|whereas)\b/gi) || []).length;
            // Relative pronouns (who, which, that, where)
            const relatives = (sentence.match(/\b(who|which|that|where)\b/gi) || []).length;

            const totalClauses = commas + subordinators + relatives;
            if (totalClauses >= runOnConfig.clauseThreshold) {
                issues.push(`Sentence ${idx + 1}: ${totalClauses} clause indicators (too complex)`);
            }
        });

        return {
            isRunOn: issues.length > 0,
            details: issues.length > 0 ? issues.join('; ') : null,
            sentenceCount: sentences.length
        };
    }

    /**
     * Check contextual risks based on campaign context
     */
    checkContextualRisks(quoteText, context, analysis) {
        // Check if quote contradicts known campaign positions
        if (context.campaignPositions) {
            // This would require semantic analysis - placeholder for now
            // Could integrate with AI to check semantic contradictions
        }

        // Check if speaker role matches quote content
        if (context.speakerRole) {
            // Spokesperson shouldn't make policy commitments
            if (context.speakerRole === 'spokesperson' &&
                /\b(?:we will|I will|promise|guarantee)\b/i.test(quoteText)) {

                analysis.flags.push({
                    type: 'role_mismatch',
                    severity: 'warning',
                    message: 'Spokesperson appears to make policy commitments (should come from candidate)',
                    action: 'verify_authority'
                });
                analysis.baseQualityScore -= 15;
            }
        }

        // Check timing sensitivity
        if (context.releaseDate) {
            // Could check against news cycles, events, etc.
            // Placeholder for future implementation
        }
    }

    /**
     * Calculate overall risk level
     */
    calculateRiskLevel(flags) {
        const warningCount = flags.filter(f => f.severity === 'warning').length;
        const flagCount = flags.filter(f => f.severity === 'flag').length;

        // Check for critical issues
        const hasCriticalIssue = flags.some(f =>
            f.type === 'attack_language' ||
            f.action === 'legal_review'
        );

        if (hasCriticalIssue) return 'critical';
        if (warningCount >= 3) return 'high';
        if (warningCount >= 1 || flagCount >= 3) return 'medium';
        return 'low';
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Based on risk level
        if (analysis.riskLevel === 'critical') {
            recommendations.push({
                priority: 'high',
                action: 'Require legal review before publication',
                reason: 'Quote contains attack language or unverified claims that could have legal implications'
            });
        }

        if (analysis.riskLevel === 'high') {
            recommendations.push({
                priority: 'high',
                action: 'Request revised quote from speaker',
                reason: 'Multiple significant issues identified'
            });
        }

        // Specific issue-based recommendations
        const hasFactClaims = analysis.flags.some(f => f.type === 'unverified_claims');
        if (hasFactClaims) {
            recommendations.push({
                priority: 'high',
                action: 'Verify all factual claims with sources',
                reason: 'Quote contains statistics or facts that must be accurate'
            });
        }

        const isVague = analysis.flags.some(f => f.type === 'vagueness');
        if (isVague) {
            recommendations.push({
                priority: 'medium',
                action: 'Ask speaker to clarify specific points',
                reason: 'Quote is too vague to effectively communicate the message'
            });
        }

        const isDefensive = analysis.flags.some(f => f.type === 'defensive_language');
        if (isDefensive) {
            recommendations.push({
                priority: 'medium',
                action: 'Consider reframing in positive terms',
                reason: 'Defensive language can seem weak - focus on positive vision'
            });
        }

        return recommendations;
    }

    /**
     * Check candidate style consistency
     * Compares current quote against historical candidate quotes
     */
    checkCandidateStyleConsistency(quoteText, previousQuotes, analysis) {
        if (!previousQuotes || previousQuotes.length === 0) {
            return; // No historical data to compare
        }

        // Build style profile from previous quotes
        const styleProfile = this.buildCandidateStyleProfile(previousQuotes);
        const currentStyle = this.analyzeQuoteStyle(quoteText);

        const deviations = [];

        // Check 1: Average sentence length deviation
        const avgLengthDiff = Math.abs(currentStyle.avgSentenceLength - styleProfile.avgSentenceLength);
        const lengthVariance = styleProfile.sentenceLengthStdDev || 10;

        if (avgLengthDiff > lengthVariance * 2) {
            deviations.push({
                aspect: 'sentence_length',
                message: `Sentence length (${currentStyle.avgSentenceLength.toFixed(1)} words) differs from candidate's typical style (${styleProfile.avgSentenceLength.toFixed(1)} words)`,
                severity: avgLengthDiff > lengthVariance * 3 ? 'warning' : 'info'
            });
        }

        // Check 2: Formality level
        const formalityDiff = Math.abs(currentStyle.formalityScore - styleProfile.avgFormalityScore);
        if (formalityDiff > 2.0) {
            const currentLevel = currentStyle.formalityScore > styleProfile.avgFormalityScore ? 'more formal' : 'less formal';
            deviations.push({
                aspect: 'formality',
                message: `Quote is ${currentLevel} than candidate's typical style`,
                severity: formalityDiff > 3.0 ? 'warning' : 'info'
            });
        }

        // Check 3: Contraction usage
        const contractionDiff = Math.abs(currentStyle.contractionRate - styleProfile.avgContractionRate);
        if (contractionDiff > 0.3 && styleProfile.avgContractionRate > 0.1) {
            deviations.push({
                aspect: 'contractions',
                message: `Contraction usage differs from candidate's typical style (${(currentStyle.contractionRate * 100).toFixed(0)}% vs ${(styleProfile.avgContractionRate * 100).toFixed(0)}%)`,
                severity: 'info'
            });
        }

        // Check 4: First-person usage pattern
        const firstPersonDiff = Math.abs(currentStyle.firstPersonRate - styleProfile.avgFirstPersonRate);
        if (firstPersonDiff > 0.2) {
            const currentUsage = currentStyle.firstPersonRate > styleProfile.avgFirstPersonRate ? 'more' : 'less';
            deviations.push({
                aspect: 'first_person',
                message: `${currentUsage.charAt(0).toUpperCase() + currentUsage.slice(1)} first-person language ("I", "my") than candidate's typical style`,
                severity: 'info'
            });
        }

        // Check 5: Exclamation mark usage (enthusiasm indicator)
        if (currentStyle.hasExclamation && styleProfile.exclamationRate < 0.1) {
            deviations.push({
                aspect: 'enthusiasm',
                message: 'Quote uses exclamation mark, which is unusual for this candidate',
                severity: 'info'
            });
        } else if (!currentStyle.hasExclamation && styleProfile.exclamationRate > 0.4) {
            deviations.push({
                aspect: 'enthusiasm',
                message: 'Quote lacks exclamation mark, which candidate typically uses',
                severity: 'info'
            });
        }

        // Check 6: Vocabulary complexity
        const vocabDiff = Math.abs(currentStyle.avgWordLength - styleProfile.avgWordLength);
        if (vocabDiff > 1.0) {
            const complexity = currentStyle.avgWordLength > styleProfile.avgWordLength ? 'more complex' : 'simpler';
            deviations.push({
                aspect: 'vocabulary',
                message: `Vocabulary is ${complexity} than candidate's typical style`,
                severity: vocabDiff > 1.5 ? 'warning' : 'info'
            });
        }

        // Add flags for significant deviations
        deviations.forEach(deviation => {
            analysis.flags.push({
                type: 'style_inconsistency',
                severity: deviation.severity,
                message: `Style inconsistency: ${deviation.message}`,
                details: `Aspect: ${deviation.aspect}`,
                action: 'review_with_candidate'
            });

            if (deviation.severity === 'warning') {
                analysis.baseQualityScore -= 10;
            } else {
                analysis.baseQualityScore -= 5;
            }
        });

        // Add summary if multiple deviations
        if (deviations.length >= 3) {
            analysis.flags.push({
                type: 'style_inconsistency_multiple',
                severity: 'warning',
                message: `Quote has ${deviations.length} style inconsistencies with candidate's previous quotes`,
                details: 'Multiple style deviations detected - may not sound like the candidate',
                action: 'verify_authenticity'
            });
            analysis.baseQualityScore -= 10;
        }
    }

    /**
     * Build style profile from previous quotes
     */
    buildCandidateStyleProfile(quotes) {
        const styles = quotes.map(q => this.analyzeQuoteStyle(q.quote_text || q));

        return {
            avgSentenceLength: this.average(styles.map(s => s.avgSentenceLength)),
            sentenceLengthStdDev: this.stdDev(styles.map(s => s.avgSentenceLength)),
            avgFormalityScore: this.average(styles.map(s => s.formalityScore)),
            avgContractionRate: this.average(styles.map(s => s.contractionRate)),
            avgFirstPersonRate: this.average(styles.map(s => s.firstPersonRate)),
            avgWordLength: this.average(styles.map(s => s.avgWordLength)),
            exclamationRate: styles.filter(s => s.hasExclamation).length / styles.length
        };
    }

    /**
     * Analyze style characteristics of a single quote
     */
    analyzeQuoteStyle(quoteText) {
        const words = quoteText.split(/\s+/);
        const sentences = quoteText.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const avgSentenceLength = sentences.length > 0
            ? words.length / sentences.length
            : words.length;

        // Formality score (0-10, higher = more formal)
        let formalityScore = 5; // Start neutral

        // Formal indicators (+)
        if (!/\b(don't|won't|can't|I'm|we're|you're|he's|she's|it's|they're)\b/i.test(quoteText)) {
            formalityScore += 2; // No contractions = more formal
        }
        if (/\b(therefore|furthermore|moreover|however|nevertheless|consequently)\b/i.test(quoteText)) {
            formalityScore += 1; // Formal transition words
        }

        // Informal indicators (-)
        if (/\b(yeah|gonna|wanna|gotta|kinda|sorta)\b/i.test(quoteText)) {
            formalityScore -= 2; // Casual language
        }
        if (/!/.test(quoteText)) {
            formalityScore -= 0.5; // Exclamations are less formal
        }

        // Contraction rate
        const contractions = (quoteText.match(/\b(don't|won't|can't|shouldn't|wouldn't|couldn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|I'm|we're|they're|you're|he's|she's|it's|I'll|we'll|they'll|you'll)\b/gi) || []).length;
        const contractionRate = words.length > 0 ? contractions / words.length : 0;

        // First-person rate
        const firstPerson = (quoteText.match(/\b(I|my|me|mine|myself)\b/gi) || []).length;
        const firstPersonRate = words.length > 0 ? firstPerson / words.length : 0;

        // Average word length (vocabulary complexity)
        const avgWordLength = words.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0) / words.length;

        return {
            avgSentenceLength,
            formalityScore: Math.max(0, Math.min(10, formalityScore)),
            contractionRate,
            firstPersonRate,
            avgWordLength,
            hasExclamation: /!/.test(quoteText)
        };
    }

    /**
     * Calculate average
     */
    average(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    }

    /**
     * Calculate standard deviation
     */
    stdDev(numbers) {
        if (numbers.length === 0) return 0;
        const avg = this.average(numbers);
        const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
        const avgSquareDiff = this.average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    /**
     * Get display severity icon
     */
    getSeverityIcon(severity) {
        const icons = {
            'critical': '🔴',
            'warning': '🟡',
            'flag': '🟢',
            'info': 'ℹ️'
        };
        return icons[severity] || 'ℹ️';
    }
}

module.exports = QuoteQualityAnalyzer;
