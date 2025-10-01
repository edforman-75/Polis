/**
 * Text Quality Analyzer
 * Analyzes any text (body paragraphs, headlines, etc.) for quality issues
 * Including run-on sentences, readability, clarity, etc.
 */

class TextQualityAnalyzer {
    constructor() {
        // Quality thresholds
        this.thresholds = {
            // Run-on sentence detection
            runOnSentence: {
                wordThreshold: 35, // Single sentence over 35 words
                conjunctionThreshold: 3, // 3+ conjunctions in one sentence
                clauseThreshold: 4 // 4+ clause indicators
            },

            // Readability
            paragraphLength: {
                short: 50, // < 50 words = short
                ideal: 150, // 50-150 words = ideal
                long: 250 // > 250 words = too long
            },

            // Sentence variety
            sentenceVariety: {
                minVariation: 5 // Sentences should vary by at least 5 words
            }
        };

        // Issue patterns
        this.patterns = {
            // Passive voice indicators
            passiveVoice: [
                /\bis\s+\w+ed\b/gi,
                /\bwas\s+\w+ed\b/gi,
                /\bare\s+\w+ed\b/gi,
                /\bwere\s+\w+ed\b/gi,
                /\bhave\s+been\s+\w+ed\b/gi,
                /\bhas\s+been\s+\w+ed\b/gi,
                /\bhad\s+been\s+\w+ed\b/gi,
                /\bwill\s+be\s+\w+ed\b/gi
            ],

            // Weak verbs
            weakVerbs: ['is', 'are', 'was', 'were', 'be', 'been', 'being',
                       'has', 'have', 'had', 'do', 'does', 'did'],

            // Filler words/phrases
            fillerWords: ['really', 'very', 'quite', 'rather', 'somewhat',
                         'actually', 'basically', 'literally', 'just'],

            // Vague language
            vagueTerms: ['thing', 'things', 'stuff', 'something', 'someone',
                        'somewhere', 'somehow', 'kind of', 'sort of'],

            // Redundant phrases
            redundancies: [
                'absolutely certain', 'absolutely essential', 'advance planning',
                'completely full', 'end result', 'final outcome', 'free gift',
                'future plans', 'past history', 'personal opinion', 'true fact',
                'unexpected surprise', 'usual custom'
            ],

            // Double negatives (confusing constructions)
            doubleNegatives: [
                /\bnot\s+un\w+/gi, // not uncommon, not unlikely, etc.
                /\bno\s+lack\s+of\b/gi, // no lack of
                /\bnot\s+without\b/gi, // not without
                /\bcan'?t\s+deny\b/gi, // can't deny
                /\bwon'?t\s+fail\s+to\b/gi, // won't fail to
                /\bdidn'?t\s+refuse\b/gi, // didn't refuse
                /\bnever\s+fails?\s+to\b/gi // never fails to
            ],

            // Nominalization (turning verbs into nouns - makes writing abstract)
            nominalizations: [
                /\bmake\s+a\s+decision\b/gi, // should be "decide"
                /\bhave\s+a\s+discussion\b/gi, // should be "discuss"
                /\bgive\s+consideration\b/gi, // should be "consider"
                /\btake\s+into\s+consideration\b/gi, // should be "consider"
                /\bprovide\s+assistance\b/gi, // should be "assist"
                /\bconduct\s+an?\s+investigation\b/gi, // should be "investigate"
                /\bmake\s+an?\s+assumption\b/gi, // should be "assume"
                /\bperform\s+an?\s+analysis\b/gi // should be "analyze"
            ],

            // Complex conditionals (hard to parse)
            complexConditionals: [
                /\bif\s+\w+\s+were\s+not\s+to\b/gi, // if X were not to
                /\bunless\s+\w+\s+fails?\s+to\b/gi, // unless X fails to
                /\bexcept\s+if\s+\w+\s+doesn'?t\b/gi // except if X doesn't
            ],

            // Excessive hedging (undermines confidence)
            excessiveHedging: [
                'it seems', 'it appears', 'arguably', 'possibly', 'probably',
                'might be', 'could be', 'may be', 'tends to', 'seems to'
            ],

            // Buried subjects (subject too far from verb)
            // Will be detected programmatically in checkSentenceClarity()

            // Jargon (political)
            politicalJargon: [
                'synergy', 'paradigm', 'leverage', 'moving forward', 'at the end of the day',
                'boots on the ground', 'game changer', 'low-hanging fruit', 'think outside the box',
                'circle back', 'touch base', 'reach out', 'drill down'
            ]
        };
    }

    /**
     * Analyze full text (entire press release body)
     */
    analyzeText(text, options = {}) {
        const analysis = {
            text: text,
            overallScore: 100,
            issues: [],
            recommendations: [],
            statistics: {}
        };

        // Split into paragraphs
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

        // Analyze each paragraph
        paragraphs.forEach((paragraph, idx) => {
            const paragraphIssues = this.analyzeParagraph(paragraph, idx + 1);
            analysis.issues.push(...paragraphIssues);
        });

        // Calculate statistics
        analysis.statistics = this.calculateStatistics(text);

        // Check overall text issues
        this.checkOverallIssues(text, analysis);

        // Calculate final score
        analysis.overallScore = Math.max(0, analysis.overallScore -
            analysis.issues.reduce((sum, issue) => sum + (issue.penalty || 0), 0));

        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    /**
     * Analyze a single paragraph
     */
    analyzeParagraph(paragraphText, paragraphNumber) {
        const issues = [];
        const sentences = this.splitIntoSentences(paragraphText);

        // Check each sentence for run-ons
        sentences.forEach((sentence, idx) => {
            const runOnCheck = this.checkRunOnSentence(sentence);
            if (runOnCheck.isRunOn) {
                issues.push({
                    type: 'run_on_sentence',
                    severity: 'warning',
                    location: `Paragraph ${paragraphNumber}, Sentence ${idx + 1}`,
                    message: 'Run-on sentence detected',
                    details: runOnCheck.details,
                    penalty: 15,
                    suggestion: 'Break into shorter sentences or remove unnecessary clauses',
                    sentenceText: sentence.substring(0, 100) + (sentence.length > 100 ? '...' : '')
                });
            }
        });

        // Check paragraph length
        const wordCount = paragraphText.split(/\s+/).length;
        if (wordCount > this.thresholds.paragraphLength.long) {
            issues.push({
                type: 'paragraph_too_long',
                severity: 'info',
                location: `Paragraph ${paragraphNumber}`,
                message: `Paragraph is very long (${wordCount} words)`,
                details: 'Long paragraphs are harder to read',
                penalty: 5,
                suggestion: 'Consider breaking into 2-3 shorter paragraphs'
            });
        }

        // Check passive voice density
        const passiveCount = this.countPassiveVoice(paragraphText);
        const passiveRate = passiveCount / sentences.length;
        if (passiveRate > 0.5 && sentences.length >= 3) {
            issues.push({
                type: 'passive_voice_heavy',
                severity: 'warning',
                location: `Paragraph ${paragraphNumber}`,
                message: `High passive voice usage (${passiveCount} instances in ${sentences.length} sentences)`,
                details: 'Passive voice can make writing less direct and engaging',
                penalty: 10,
                suggestion: 'Use active voice where possible'
            });
        }

        // Check for filler words
        const fillerCount = this.countFillerWords(paragraphText);
        if (fillerCount >= 3) {
            issues.push({
                type: 'filler_words',
                severity: 'info',
                location: `Paragraph ${paragraphNumber}`,
                message: `Contains ${fillerCount} filler words`,
                details: 'Filler words weaken the message',
                penalty: 3,
                suggestion: 'Remove unnecessary qualifiers like "really", "very", "quite"'
            });
        }

        // Check for vague language
        const vagueCount = this.countVagueTerms(paragraphText);
        if (vagueCount >= 2) {
            issues.push({
                type: 'vague_language',
                severity: 'warning',
                location: `Paragraph ${paragraphNumber}`,
                message: `Contains ${vagueCount} vague terms`,
                details: 'Vague language lacks specificity and impact',
                penalty: 10,
                suggestion: 'Replace vague terms with specific details'
            });
        }

        // Check for double negatives
        const doubleNegatives = this.findDoubleNegatives(paragraphText);
        if (doubleNegatives.length > 0) {
            issues.push({
                type: 'double_negative',
                severity: 'warning',
                location: `Paragraph ${paragraphNumber}`,
                message: `Contains ${doubleNegatives.length} double negative(s)`,
                details: `Found: "${doubleNegatives.join('", "')}"`,
                penalty: 12,
                suggestion: 'Rewrite with positive construction for clarity',
                examples: doubleNegatives
            });
        }

        // Check for nominalizations
        const nominalizations = this.findNominalizations(paragraphText);
        if (nominalizations.length > 0) {
            issues.push({
                type: 'nominalization',
                severity: 'info',
                location: `Paragraph ${paragraphNumber}`,
                message: `Contains ${nominalizations.length} nominalization(s)`,
                details: 'Abstract noun phrases make writing less direct',
                penalty: 5,
                suggestion: 'Use simple verbs instead (e.g., "decide" not "make a decision")',
                examples: nominalizations
            });
        }

        // Check for complex conditionals
        const complexConditionals = this.findComplexConditionals(paragraphText);
        if (complexConditionals.length > 0) {
            issues.push({
                type: 'complex_conditional',
                severity: 'warning',
                location: `Paragraph ${paragraphNumber}`,
                message: `Contains ${complexConditionals.length} complex conditional(s)`,
                details: 'Complex conditionals are hard to parse',
                penalty: 8,
                suggestion: 'Rewrite with simpler if/then structure',
                examples: complexConditionals
            });
        }

        // Check for excessive hedging
        const hedgingCount = this.countHedging(paragraphText);
        if (hedgingCount >= 2) {
            issues.push({
                type: 'excessive_hedging',
                severity: 'info',
                location: `Paragraph ${paragraphNumber}`,
                message: `Contains ${hedgingCount} hedging phrase(s)`,
                details: 'Too much hedging undermines confidence and authority',
                penalty: 5,
                suggestion: 'State claims more directly'
            });
        }

        return issues;
    }

    /**
     * Check if a sentence is run-on
     */
    checkRunOnSentence(sentence) {
        const words = sentence.trim().split(/\s+/);
        const wordCount = words.length;
        const details = [];
        let isRunOn = false;

        // Check 1: Word count threshold
        if (wordCount > this.thresholds.runOnSentence.wordThreshold) {
            details.push(`${wordCount} words (over ${this.thresholds.runOnSentence.wordThreshold})`);
            isRunOn = true;
        }

        // Check 2: Coordinating conjunctions
        const conjunctions = (sentence.match(/\b(and|but|or|nor|for|so|yet)\b/gi) || []).length;
        if (conjunctions >= this.thresholds.runOnSentence.conjunctionThreshold) {
            details.push(`${conjunctions} coordinating conjunctions (creates run-on feel)`);
            isRunOn = true;
        }

        // Check 3: Clause complexity
        const commas = (sentence.match(/,/g) || []).length;
        const subordinators = (sentence.match(/\b(because|although|since|while|when|if|unless|until|before|after|though|whereas|as)\b/gi) || []).length;
        const relatives = (sentence.match(/\b(who|which|that|where|whose|whom)\b/gi) || []).length;
        const totalClauses = commas + subordinators + relatives;

        if (totalClauses >= this.thresholds.runOnSentence.clauseThreshold) {
            details.push(`${totalClauses} clause indicators (too complex)`);
            isRunOn = true;
        }

        return {
            isRunOn,
            details: details.join('; '),
            wordCount,
            conjunctions,
            clauses: totalClauses
        };
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        // Split on periods, exclamation marks, question marks
        // But not on abbreviations like "U.S." or "Dr."
        return text
            .replace(/([.!?])\s+(?=[A-Z])/g, '$1|')
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Count passive voice instances
     */
    countPassiveVoice(text) {
        return this.patterns.passiveVoice.reduce((count, pattern) => {
            const matches = text.match(pattern);
            return count + (matches ? matches.length : 0);
        }, 0);
    }

    /**
     * Count filler words
     */
    countFillerWords(text) {
        const lowerText = text.toLowerCase();
        return this.patterns.fillerWords.filter(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(lowerText)
        ).length;
    }

    /**
     * Count vague terms
     */
    countVagueTerms(text) {
        const lowerText = text.toLowerCase();
        return this.patterns.vagueTerms.filter(term =>
            lowerText.includes(term)
        ).length;
    }

    /**
     * Calculate text statistics
     */
    calculateStatistics(text) {
        const sentences = this.splitIntoSentences(text);
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

        const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
        const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

        const wordLengths = words.map(w => w.replace(/[^\w]/g, '').length);
        const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;

        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            avgSentenceLength: avgSentenceLength.toFixed(1),
            avgWordLength: avgWordLength.toFixed(1),
            longestSentence: Math.max(...sentenceLengths),
            shortestSentence: Math.min(...sentenceLengths)
        };
    }

    /**
     * Check overall text issues
     */
    checkOverallIssues(text, analysis) {
        // Check for redundant phrases
        const redundancyCount = this.patterns.redundancies.filter(phrase =>
            new RegExp(phrase, 'i').test(text)
        ).length;

        if (redundancyCount > 0) {
            analysis.issues.push({
                type: 'redundancies',
                severity: 'info',
                location: 'Overall text',
                message: `Found ${redundancyCount} redundant phrase(s)`,
                details: 'Redundant phrases waste words',
                penalty: 3,
                suggestion: 'Remove redundant words (e.g., "advance planning" → "planning")'
            });
        }

        // Check for political jargon
        const jargonCount = this.patterns.politicalJargon.filter(term =>
            new RegExp(`\\b${term}\\b`, 'i').test(text)
        ).length;

        if (jargonCount > 0) {
            analysis.issues.push({
                type: 'jargon',
                severity: 'warning',
                location: 'Overall text',
                message: `Contains ${jargonCount} clichéd phrase(s) or jargon`,
                details: 'Overused phrases lose impact',
                penalty: 5,
                suggestion: 'Use fresh, specific language instead of clichés'
            });
        }

        // Check sentence variety
        const sentences = this.splitIntoSentences(text);
        if (sentences.length >= 5) {
            const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
            const variation = Math.max(...sentenceLengths) - Math.min(...sentenceLengths);

            if (variation < this.thresholds.sentenceVariety.minVariation) {
                analysis.issues.push({
                    type: 'monotonous_rhythm',
                    severity: 'info',
                    location: 'Overall text',
                    message: 'Sentences are similar length',
                    details: `Variation of only ${variation} words between shortest and longest`,
                    penalty: 5,
                    suggestion: 'Vary sentence length for better rhythm and readability'
                });
            }
        }
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Prioritize by severity and type
        const runOnIssues = analysis.issues.filter(i => i.type === 'run_on_sentence');
        if (runOnIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                action: `Fix ${runOnIssues.length} run-on sentence(s)`,
                reason: 'Run-on sentences are hard to follow and reduce readability',
                locations: runOnIssues.map(i => i.location)
            });
        }

        const vagueIssues = analysis.issues.filter(i => i.type === 'vague_language');
        if (vagueIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                action: 'Replace vague language with specific details',
                reason: 'Specificity makes the message more compelling and credible',
                locations: vagueIssues.map(i => i.location)
            });
        }

        const passiveIssues = analysis.issues.filter(i => i.type === 'passive_voice_heavy');
        if (passiveIssues.length > 0) {
            recommendations.push({
                priority: 'medium',
                action: 'Convert passive voice to active voice',
                reason: 'Active voice is more direct and engaging',
                locations: passiveIssues.map(i => i.location)
            });
        }

        const longParaIssues = analysis.issues.filter(i => i.type === 'paragraph_too_long');
        if (longParaIssues.length > 0) {
            recommendations.push({
                priority: 'medium',
                action: 'Break up long paragraphs',
                reason: 'Shorter paragraphs improve readability and visual appeal',
                locations: longParaIssues.map(i => i.location)
            });
        }

        return recommendations;
    }

    /**
     * Find double negatives
     */
    findDoubleNegatives(text) {
        const found = [];
        this.patterns.doubleNegatives.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                found.push(...matches.map(m => m.trim()));
            }
        });
        return [...new Set(found)]; // Remove duplicates
    }

    /**
     * Find nominalizations
     */
    findNominalizations(text) {
        const found = [];
        this.patterns.nominalizations.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                found.push(...matches.map(m => m.trim()));
            }
        });
        return [...new Set(found)];
    }

    /**
     * Find complex conditionals
     */
    findComplexConditionals(text) {
        const found = [];
        this.patterns.complexConditionals.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                found.push(...matches.map(m => m.trim()));
            }
        });
        return [...new Set(found)];
    }

    /**
     * Count hedging phrases
     */
    countHedging(text) {
        const lowerText = text.toLowerCase();
        return this.patterns.excessiveHedging.filter(phrase =>
            lowerText.includes(phrase)
        ).length;
    }

    /**
     * Get severity color/icon
     */
    getSeverityDisplay(severity) {
        const displays = {
            'critical': { icon: '🔴', color: 'red', label: 'Critical' },
            'warning': { icon: '🟡', color: 'orange', label: 'Warning' },
            'info': { icon: 'ℹ️', color: 'blue', label: 'Info' }
        };
        return displays[severity] || displays['info'];
    }
}

module.exports = TextQualityAnalyzer;
