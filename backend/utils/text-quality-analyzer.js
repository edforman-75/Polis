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
    /**
     * Detect specific run-on sentence patterns
     */
    detectRunOnPattern(sentence) {
        const trimmed = sentence.trim();

        // Pattern 1A: Simple Comma Splice - Independent clause, independent clause
        if (/[^,]+,\s+[a-z]/i.test(trimmed) && !/(said|stated|noted|added|continued)\s*,/i.test(trimmed)) {
            const parts = trimmed.split(/,\s+/);
            if (parts.length === 2 && parts[1].match(/^[A-Z]?\w+\s+(is|are|was|were|will|would|can|could|has|have|had)\b/)) {
                return {
                    type: 'Type 1A: Simple Comma Splice',
                    category: 'Comma Splices',
                    explanation: 'Two complete thoughts joined only by comma',
                    fixSuggestions: [
                        'Use a period to separate sentences',
                        'Add a coordinating conjunction after the comma',
                        'Use a semicolon instead of comma'
                    ]
                };
            }
        }

        // Pattern 1C: Transitional Comma Splice - however, therefore, nevertheless, etc.
        const transitions = ['however', 'therefore', 'nevertheless', 'moreover', 'furthermore', 'consequently', 'thus'];
        for (const trans of transitions) {
            const regex = new RegExp(`,\\s+${trans}\\s+`, 'i');
            if (regex.test(trimmed)) {
                return {
                    type: 'Type 1C: Transitional Comma Splice',
                    category: 'Comma Splices',
                    explanation: `"${trans.charAt(0).toUpperCase() + trans.slice(1)}" is not a coordinating conjunction and cannot join independent clauses with just a comma`,
                    fixSuggestions: [
                        `Use a semicolon: "; ${trans},"`,
                        `Start new sentence: ". ${trans.charAt(0).toUpperCase() + trans.slice(1)},"`,
                        'Restructure to use coordinating conjunction'
                    ]
                };
            }
        }

        // Pattern 2A/2B: Fused Sentences - pronoun starts new clause without punctuation
        // Look for pattern where sentence has multiple subjects with verbs
        const pronounStarts = /(he|she|it|they|we)\s+(is|are|was|were|will|would|can|could|has|have|had|said|went|came|took|made)\b/gi;
        const pronounMatches = trimmed.match(pronounStarts);
        if (pronounMatches && pronounMatches.length > 1 && !trimmed.includes(',') && !trimmed.includes(';')) {
            return {
                type: 'Type 2B: Pronoun Fusion',
                category: 'Fused Sentences',
                explanation: 'Multiple independent clauses with no punctuation between them',
                fixSuggestions: [
                    'Add period between independent clauses',
                    'Use conjunction to connect related ideas',
                    'Combine clauses with shared subject'
                ]
            };
        }

        // Pattern 4A: Excessive "And" Chains - multiple "and" connecting independent clauses
        const andCount = (trimmed.match(/\s+and\s+/gi) || []).length;
        if (andCount >= 3) {
            return {
                type: 'Type 4A: Excessive "And" Chains',
                category: 'Compound Sentence Overload',
                explanation: 'Too many independent clauses chained with "and"',
                fixSuggestions: [
                    'Break into multiple sentences',
                    'Convert some clauses to participial phrases',
                    'Use parallel structure with single subject'
                ]
            };
        }

        // Pattern 6A: Implied Causation - looks like cause-effect but no connector
        if (/,\s+(the|it|this|that|these|those)\s+(will|would|can|could|should|must)\b/i.test(trimmed)) {
            return {
                type: 'Type 6A: Implied Causation Without Proper Connection',
                category: 'Cause-Effect Confusion',
                explanation: 'Causal relationship implied but not explicitly connected',
                fixSuggestions: [
                    'Add "so" after the comma to show causation',
                    'Start second clause with "Therefore," or "As a result,"',
                    'Use "enabling" or "allowing" to show relationship'
                ]
            };
        }

        // Pattern 7A: Time Sequence Errors - multiple time-based events with only commas
        const timeMarkers = (trimmed.match(/\b(then|next|after|before|first|second|finally|later|soon|yesterday|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|night|\d+\s*(am|pm|AM|PM))/gi) || []).length;
        const hasMultipleVerbs = (trimmed.match(/\b(arrived|departed|met|spoke|announced|visited|toured|addressed|began|ended|started|finished|completed)\b/gi) || []).length >= 3;

        if (timeMarkers >= 2 && hasMultipleVerbs) {
            return {
                type: 'Type 7A: Sequential Events Without Proper Punctuation',
                category: 'Time Sequence Errors',
                explanation: 'Multiple sequential events joined only by commas',
                fixSuggestions: [
                    'Break into separate sentences for clarity',
                    'Use semicolons between major events',
                    'Group related events with conjunctions'
                ]
            };
        }

        // Pattern 8A: Statistical/Data Overload - multiple statistics without structure
        const percentMatches = (trimmed.match(/\d+(\.\d+)?%/g) || []).length;
        const numberMatches = (trimmed.match(/\b\d{1,3}(,\d{3})*(\.\d+)?\b/g) || []).length;

        if ((percentMatches >= 3 || numberMatches >= 4) && !trimmed.includes(';')) {
            return {
                type: 'Type 8A: Multiple Data Points Without Structure',
                category: 'Statistical/Data Overload',
                explanation: 'Too many independent statistical facts without proper organization',
                fixSuggestions: [
                    'Break into multiple sentences',
                    'Use semicolons to group related statistics',
                    'Consider using a bulleted list'
                ]
            };
        }

        return null; // No specific pattern detected
    }

    checkRunOnSentence(sentence) {
        const words = sentence.trim().split(/\s+/);
        const wordCount = words.length;
        const details = [];
        let isRunOn = false;

        // First check for specific patterns
        const pattern = this.detectRunOnPattern(sentence);

        // Check 1: Word count threshold
        if (wordCount > this.thresholds.runOnSentence.wordThreshold) {
            details.push(`${wordCount} words (over ${this.thresholds.runOnSentence.wordThreshold})`);
            isRunOn = true;
        }

        // Check 2: Coordinating conjunctions (FANBOYS: For, And, Nor, But, Or, Yet, So)
        // Note: Excluding "for" as it's almost always a preposition in press releases, not a conjunction
        const conjunctions = (sentence.match(/\b(and|but|or|nor|so|yet)\b/gi) || []).length;
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

        // Check 4: Double negatives (confusing constructions)
        const doubleNegatives = this.findDoubleNegatives(sentence);
        if (doubleNegatives.length > 0) {
            details.push(`${doubleNegatives.length} double negative(s): "${doubleNegatives.join('", "')}"`);
            // Note: Double negatives alone don't make a run-on, but they add to complexity
            // Only flag if combined with other issues
            if (wordCount > 25 || conjunctions >= 2 || totalClauses >= 3) {
                isRunOn = true;
            }
        }

        // If pattern detected, it's definitely a run-on
        if (pattern) {
            isRunOn = true;
        }

        // Generate comprehensive fix suggestions
        const fixSuggestions = this.generateRunOnFixSuggestions({
            isRunOn,
            wordCount,
            conjunctions,
            clauses: totalClauses,
            doubleNegatives: doubleNegatives.length,
            doubleNegativeExamples: doubleNegatives,
            pattern: pattern,
            sentence: sentence
        });

        return {
            isRunOn,
            details: details.join('; '),
            wordCount,
            conjunctions,
            clauses: totalClauses,
            doubleNegatives: doubleNegatives.length,
            doubleNegativeExamples: doubleNegatives,
            pattern: pattern || undefined,
            patternType: pattern ? pattern.type : undefined,
            patternCategory: pattern ? pattern.category : undefined,
            explanation: pattern ? pattern.explanation : undefined,
            fixSuggestions: fixSuggestions
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
     * Generate fix suggestions for run-on sentences
     */
    generateRunOnFixSuggestions(analysis) {
        const suggestions = [];

        // Pattern-specific suggestions
        if (analysis.pattern && analysis.pattern.fixSuggestions) {
            suggestions.push(...analysis.pattern.fixSuggestions);
        }

        // Double negative fixes
        if (analysis.doubleNegatives > 0 && analysis.doubleNegativeExamples) {
            const doubleNegativeFixes = {
                'not uncommon': 'common / frequent / typical',
                'not unlikely': 'likely / probable',
                'not impossible': 'possible / feasible',
                'no lack of': 'plenty of / abundant / strong',
                'not without': 'has / includes / contains',
                "can't deny": 'must admit / acknowledge / recognize',
                "won't fail to": 'will / will definitely / will certainly',
                "didn't refuse": 'accepted / agreed',
                'never fails to': 'always / consistently'
            };

            analysis.doubleNegativeExamples.forEach(neg => {
                const negLower = neg.toLowerCase();
                for (const [pattern, fix] of Object.entries(doubleNegativeFixes)) {
                    if (negLower.includes(pattern)) {
                        suggestions.push(`Replace "${neg}" with "${fix}"`);
                        break;
                    }
                }
            });
        }

        // Word count suggestions
        if (analysis.wordCount > 35) {
            suggestions.push('Break into 2-3 shorter sentences (currently ' + analysis.wordCount + ' words)');
        }

        // Conjunction suggestions
        if (analysis.conjunctions >= 3) {
            suggestions.push('Reduce coordinating conjunctions (and/but/or) - use periods or semicolons instead');
        }

        // Clause complexity suggestions
        if (analysis.clauses >= 4) {
            suggestions.push('Simplify clause structure - too many subordinate clauses make the sentence hard to follow');
            suggestions.push('Consider splitting at conjunctions like "because", "although", or "which"');
        }

        // General suggestions if no specific ones
        if (suggestions.length === 0 && analysis.isRunOn) {
            suggestions.push('Break into multiple sentences for clarity');
            suggestions.push('Use active voice and simple structure');
        }

        return suggestions;
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
