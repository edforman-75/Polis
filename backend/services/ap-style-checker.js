/**
 * AP Style and Grammar Checking Service for Political Campaign Content
 * Based on Associated Press Stylebook standards and political writing conventions
 */

const { requirePermission } = require('../middleware/authorization');

// AP Style Rules Database
const AP_STYLE_RULES = {
    // Basic Grammar and Style
    grammar: {
        // Comma Rules
        oxford_comma: {
            rule: 'AP style does not use Oxford commas except when necessary for clarity',
            check: (text) => {
                const oxfordCommaPattern = /, and [a-z]/gi;
                const matches = text.match(oxfordCommaPattern) || [];
                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: match.replace(', and', ' and'),
                        reason: 'AP style avoids Oxford commas unless needed for clarity'
                    }))
                };
            }
        },

        // Contractions
        contractions: {
            rule: 'AP style allows contractions in quotes and informal writing but avoids them in formal news writing',
            check: (text) => {
                const contractions = [
                    "don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't",
                    "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
                    "hadn't", "doesn't", "didn't", "we're", "they're", "you're",
                    "it's", "that's", "there's", "here's"
                ];
                const pattern = new RegExp(`\\b(${contractions.join('|')})\\b`, 'gi');
                const matches = text.match(pattern) || [];
                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: expandContraction(match),
                        reason: 'Consider expanding contractions in formal political communications'
                    }))
                };
            }
        },

        // Active Voice Preference
        passive_voice: {
            rule: 'AP style prefers active voice for clarity and directness',
            check: (text) => {
                // Simple passive voice detection patterns
                const passivePatterns = [
                    /\b(was|were|is|are|been|being)\s+\w+ed\b/gi,
                    /\b(was|were|is|are|been|being)\s+\w+en\b/gi
                ];
                let violations = [];
                passivePatterns.forEach(pattern => {
                    const matches = text.match(pattern) || [];
                    violations = violations.concat(matches.map(match => ({
                        text: match,
                        suggestion: 'Consider rewriting in active voice',
                        reason: 'Active voice is more direct and engaging in political communication'
                    })));
                });
                return {
                    violations: violations.length,
                    suggestions: violations
                };
            }
        }
    },

    // Numbers and Dates
    numbers: {
        spell_out_small: {
            rule: 'Spell out numbers one through nine, use figures for 10 and above',
            check: (text) => {
                const smallNumberPattern = /\b([1-9])\b(?!\d)/g;
                const matches = text.match(smallNumberPattern) || [];
                const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: numberWords[parseInt(match) - 1],
                        reason: 'AP style spells out numbers one through nine'
                    }))
                };
            }
        },

        percentage: {
            rule: 'Use % symbol with numbers, spell out percent in quotes',
            check: (text) => {
                const percentSpelledPattern = /\d+\s+percent\b/gi;
                const matches = text.match(percentSpelledPattern) || [];
                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: match.replace('percent', '%'),
                        reason: 'Use % symbol with numbers in AP style'
                    }))
                };
            }
        },

        millions_billions: {
            rule: 'Use million, billion with figures, not M or B',
            check: (text) => {
                const abbreviatedPattern = /\d+[MB]\b/g;
                const matches = text.match(abbreviatedPattern) || [];
                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: match.replace('M', ' million').replace('B', ' billion'),
                        reason: 'AP style spells out million and billion'
                    }))
                };
            }
        }
    },

    // Political Titles and Names
    titles: {
        political_titles: {
            rule: 'Capitalize formal titles when used before names, lowercase after names',
            check: (text) => {
                // Check for common political title errors
                const titlePatterns = [
                    { pattern: /\bpresident\s+[A-Z][a-z]+/g, correct: 'President' },
                    { pattern: /\bsenator\s+[A-Z][a-z]+/g, correct: 'Sen.' },
                    { pattern: /\brepresentative\s+[A-Z][a-z]+/g, correct: 'Rep.' },
                    { pattern: /\bgovernor\s+[A-Z][a-z]+/g, correct: 'Gov.' },
                    { pattern: /\bmayor\s+[A-Z][a-z]+/g, correct: 'Mayor' }
                ];

                let violations = [];
                titlePatterns.forEach(({pattern, correct}) => {
                    const matches = text.match(pattern) || [];
                    violations = violations.concat(matches.map(match => ({
                        text: match,
                        suggestion: match.replace(/^\w+/, correct),
                        reason: `Capitalize ${correct} when used before names`
                    })));
                });

                return {
                    violations: violations.length,
                    suggestions: violations
                };
            }
        },

        party_abbreviations: {
            rule: 'Use standard political party abbreviations: R-State, D-State',
            check: (text) => {
                const partyPattern = /\((Republican|Democratic|Democrat)[-\s]([A-Z]{2})\)/g;
                const matches = text.match(partyPattern) || [];
                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: match.replace('Republican', 'R').replace(/Democratic?/, 'D'),
                        reason: 'Use standard party abbreviations: R-State, D-State'
                    }))
                };
            }
        }
    },

    // Political Writing Conventions
    political: {
        election_terms: {
            rule: 'Use specific election terminology correctly',
            check: (text) => {
                const corrections = {
                    'voting booth': 'polling place',
                    'voting machine': 'voting equipment',
                    'ballot box': 'ballot container'
                };

                let violations = [];
                Object.entries(corrections).forEach(([incorrect, correct]) => {
                    const pattern = new RegExp(`\\b${incorrect}\\b`, 'gi');
                    const matches = text.match(pattern) || [];
                    violations = violations.concat(matches.map(match => ({
                        text: match,
                        suggestion: correct,
                        reason: `Use '${correct}' instead of '${incorrect}'`
                    })));
                });

                return {
                    violations: violations.length,
                    suggestions: violations
                };
            }
        },

        campaign_terminology: {
            rule: 'Use proper campaign and political terminology',
            check: (text) => {
                const campaignTerms = {
                    'fundraiser': 'fundraising event',
                    'get out the vote': 'voter turnout effort',
                    'stump speech': 'campaign speech',
                    'war chest': 'campaign funds'
                };

                let suggestions = [];
                Object.entries(campaignTerms).forEach(([informal, formal]) => {
                    const pattern = new RegExp(`\\b${informal}\\b`, 'gi');
                    const matches = text.match(pattern) || [];
                    if (matches.length > 0) {
                        suggestions.push({
                            text: informal,
                            suggestion: `Consider '${formal}' for formal communications`,
                            reason: 'More formal alternative available'
                        });
                    }
                });

                return {
                    violations: 0, // These are suggestions, not violations
                    suggestions: suggestions
                };
            }
        }
    },

    // Attribution and Quotes
    attribution: {
        quote_attribution: {
            rule: 'Attribution comes after quotes, use said instead of stated/claimed/etc.',
            check: (text) => {
                const attributionVerbs = ['stated', 'claimed', 'expressed', 'mentioned', 'declared', 'announced'];
                const pattern = new RegExp(`"[^"]+",?\\s+(${attributionVerbs.join('|')})`, 'gi');
                const matches = text.match(pattern) || [];

                return {
                    violations: matches.length,
                    suggestions: matches.map(match => ({
                        text: match,
                        suggestion: match.replace(new RegExp(`(${attributionVerbs.join('|')})`, 'gi'), 'said'),
                        reason: 'AP style prefers "said" over other attribution verbs'
                    }))
                };
            }
        }
    }
};

// Grammar Rules Database
const GRAMMAR_RULES = {
    // Subject-Verb Agreement
    subject_verb_agreement: {
        rule: 'Subjects and verbs must agree in number',
        check: (text) => {
            const disagreementPatterns = [
                /\b(he|she|it)\s+are\b/gi,
                /\b(I|you|we|they)\s+is\b/gi,
                /\b(was)\s+(you|we|they)\b/gi,
                /\b(were)\s+(I|he|she|it)\b/gi
            ];

            let violations = [];
            disagreementPatterns.forEach(pattern => {
                const matches = text.match(pattern) || [];
                violations = violations.concat(matches.map(match => ({
                    text: match,
                    suggestion: 'Check subject-verb agreement',
                    reason: 'Subject and verb must agree in number'
                })));
            });

            return {
                violations: violations.length,
                suggestions: violations
            };
        }
    },

    // Pronoun Agreement
    pronoun_agreement: {
        rule: 'Pronouns must agree with their antecedents',
        check: (text) => {
            // Simple checks for common pronoun errors
            const pronounErrors = [
                /\bevery\w+\s+[^.]*\bthey\b/gi, // "everyone...they" errors
                /\bsomeone\s+[^.]*\btheir\b/gi  // "someone...their" errors
            ];

            let violations = [];
            pronounErrors.forEach(pattern => {
                const matches = text.match(pattern) || [];
                violations = violations.concat(matches.map(match => ({
                    text: match,
                    suggestion: 'Check pronoun-antecedent agreement',
                    reason: 'Pronouns must agree with their antecedents in number and gender'
                })));
            });

            return {
                violations: violations.length,
                suggestions: violations
            };
        }
    },

    // Comma Splices
    comma_splice: {
        rule: 'Do not join independent clauses with only a comma',
        check: (text) => {
            // Simple pattern for potential comma splices
            const commaSplicePattern = /\b[a-z]+,\s+[a-z]+\s+(is|are|was|were|have|has|had|will|would|can|could|should|may|might)\b/gi;
            const matches = text.match(commaSplicePattern) || [];

            return {
                violations: matches.length,
                suggestions: matches.map(match => ({
                    text: match,
                    suggestion: 'Consider using semicolon or period instead of comma',
                    reason: 'Comma splice: independent clauses need stronger punctuation'
                }))
            };
        }
    },

    // Dangling Modifiers
    dangling_modifiers: {
        rule: 'Modifiers must clearly modify the intended word',
        check: (text) => {
            // Pattern for potential dangling modifiers at sentence beginnings
            const danglingPattern = /^(After|Before|While|During|Upon)\s+[^,]+,\s+[^a-z]/gm;
            const matches = text.match(danglingPattern) || [];

            return {
                violations: matches.length,
                suggestions: matches.map(match => ({
                    text: match,
                    suggestion: 'Check that modifier clearly relates to subject',
                    reason: 'Potential dangling modifier - ensure clear connection to subject'
                }))
            };
        }
    }
};

// Helper function to expand contractions
function expandContraction(contraction) {
    const expansions = {
        "don't": "do not",
        "won't": "will not",
        "can't": "cannot",
        "shouldn't": "should not",
        "wouldn't": "would not",
        "couldn't": "could not",
        "isn't": "is not",
        "aren't": "are not",
        "wasn't": "was not",
        "weren't": "were not",
        "haven't": "have not",
        "hasn't": "has not",
        "hadn't": "had not",
        "doesn't": "does not",
        "didn't": "did not",
        "we're": "we are",
        "they're": "they are",
        "you're": "you are",
        "it's": "it is",
        "that's": "that is",
        "there's": "there is",
        "here's": "here is"
    };
    return expansions[contraction.toLowerCase()] || contraction;
}

/**
 * Main AP Style Checker Class
 */
class APStyleChecker {
    constructor() {
        this.rules = AP_STYLE_RULES;
        this.grammarRules = GRAMMAR_RULES;
    }

    /**
     * Check content for AP Style compliance
     * @param {string} content - The content to check
     * @param {string} contentType - Type of content (press_release, speech, social_media, etc.)
     * @param {Object} options - Additional checking options
     * @returns {Object} Style checking results
     */
    checkAPStyle(content, contentType = 'general', options = {}) {
        const results = {
            contentType,
            wordCount: content.split(/\s+/).length,
            characterCount: content.length,
            overallScore: 0,
            categories: {},
            summary: {
                totalViolations: 0,
                totalSuggestions: 0,
                criticalIssues: [],
                recommendations: []
            }
        };

        // Check each category of AP Style rules
        Object.entries(this.rules).forEach(([category, rules]) => {
            results.categories[category] = {
                name: category,
                violations: 0,
                suggestions: 0,
                issues: []
            };

            Object.entries(rules).forEach(([ruleName, ruleData]) => {
                const checkResult = ruleData.check(content);

                if (checkResult.violations > 0 || checkResult.suggestions.length > 0) {
                    results.categories[category].violations += checkResult.violations;
                    results.categories[category].suggestions += checkResult.suggestions.length;
                    results.categories[category].issues.push({
                        rule: ruleName,
                        description: ruleData.rule,
                        violations: checkResult.violations,
                        suggestions: checkResult.suggestions
                    });
                }
            });

            results.summary.totalViolations += results.categories[category].violations;
            results.summary.totalSuggestions += results.categories[category].suggestions;
        });

        // Calculate overall score (0-100)
        const maxPossibleViolations = content.split(/\s+/).length * 0.1; // Assume max 10% of words could have issues
        results.overallScore = Math.max(0, Math.round(100 - (results.summary.totalViolations / Math.max(1, maxPossibleViolations)) * 100));

        // Add content-type specific recommendations
        this.addContentTypeRecommendations(results, contentType);

        return results;
    }

    /**
     * Check content for grammar issues
     * @param {string} content - The content to check
     * @returns {Object} Grammar checking results
     */
    checkGrammar(content) {
        const results = {
            wordCount: content.split(/\s+/).length,
            overallScore: 0,
            issues: [],
            summary: {
                totalIssues: 0,
                criticalIssues: [],
                suggestions: []
            }
        };

        // Check each grammar rule
        Object.entries(this.grammarRules).forEach(([ruleName, ruleData]) => {
            const checkResult = ruleData.check(content);

            if (checkResult.violations > 0) {
                results.issues.push({
                    rule: ruleName,
                    description: ruleData.rule,
                    violations: checkResult.violations,
                    suggestions: checkResult.suggestions
                });
                results.summary.totalIssues += checkResult.violations;
            }
        });

        // Calculate grammar score
        const maxPossibleIssues = Math.ceil(content.split(/\s+/).length * 0.05); // Max 5% grammar issues
        results.overallScore = Math.max(0, Math.round(100 - (results.summary.totalIssues / Math.max(1, maxPossibleIssues)) * 100));

        return results;
    }

    /**
     * Comprehensive style and grammar check
     * @param {string} content - Content to check
     * @param {string} contentType - Type of content
     * @param {Object} options - Checking options
     * @returns {Object} Complete analysis results
     */
    comprehensiveCheck(content, contentType = 'general', options = {}) {
        const apStyleResults = this.checkAPStyle(content, contentType, options);
        const grammarResults = this.checkGrammar(content);

        return {
            content: {
                type: contentType,
                wordCount: content.split(/\s+/).length,
                characterCount: content.length,
                readabilityLevel: this.calculateReadabilityLevel(content)
            },
            apStyle: apStyleResults,
            grammar: grammarResults,
            overallAssessment: {
                combinedScore: Math.round((apStyleResults.overallScore + grammarResults.overallScore) / 2),
                readinessLevel: this.determineReadinessLevel(apStyleResults, grammarResults),
                priorityIssues: this.identifyPriorityIssues(apStyleResults, grammarResults),
                recommendations: this.generateRecommendations(apStyleResults, grammarResults, contentType)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Add content-type specific recommendations
     */
    addContentTypeRecommendations(results, contentType) {
        const recommendations = {
            press_release: [
                'Include dateline and contact information',
                'Use inverted pyramid structure',
                'Keep paragraphs short (1-2 sentences)',
                'Include relevant quotes from officials'
            ],
            speech: [
                'Use conversational tone appropriate for spoken delivery',
                'Include clear transitions between topics',
                'Consider rhythm and pacing for oral delivery',
                'End with strong call to action'
            ],
            social_media: [
                'Keep within platform character limits',
                'Use hashtags strategically',
                'Include call-to-action when appropriate',
                'Consider visual elements'
            ],
            statement: [
                'Lead with strongest point',
                'Maintain message discipline',
                'Include background context',
                'End with forward-looking statement'
            ]
        };

        if (recommendations[contentType]) {
            results.summary.recommendations = recommendations[contentType];
        }
    }

    /**
     * Calculate basic readability level
     */
    calculateReadabilityLevel(content) {
        const words = content.split(/\s+/).length;
        const sentences = content.split(/[.!?]+/).length;
        const avgWordsPerSentence = words / Math.max(1, sentences);

        if (avgWordsPerSentence <= 12) return 'Easy';
        if (avgWordsPerSentence <= 17) return 'Moderate';
        if (avgWordsPerSentence <= 22) return 'Challenging';
        return 'Difficult';
    }

    /**
     * Determine content readiness level
     */
    determineReadinessLevel(apResults, grammarResults) {
        const combinedScore = (apResults.overallScore + grammarResults.overallScore) / 2;

        if (combinedScore >= 90) return 'ready_for_approval';
        if (combinedScore >= 80) return 'ready_for_review';
        if (combinedScore >= 70) return 'needs_improvement';
        if (combinedScore >= 50) return 'needs_revision';
        return 'needs_major_revision';
    }

    /**
     * Identify priority issues that need immediate attention
     */
    identifyPriorityIssues(apResults, grammarResults) {
        const priorityIssues = [];

        // Critical AP Style issues
        Object.values(apResults.categories).forEach(category => {
            category.issues.forEach(issue => {
                if (issue.violations > 3) { // More than 3 violations of same rule
                    priorityIssues.push({
                        type: 'ap_style',
                        category: category.name,
                        rule: issue.rule,
                        description: issue.description,
                        severity: 'high',
                        violations: issue.violations
                    });
                }
            });
        });

        // Critical grammar issues
        grammarResults.issues.forEach(issue => {
            if (issue.violations > 2) { // More than 2 grammar violations
                priorityIssues.push({
                    type: 'grammar',
                    rule: issue.rule,
                    description: issue.description,
                    severity: 'high',
                    violations: issue.violations
                });
            }
        });

        return priorityIssues.sort((a, b) => b.violations - a.violations);
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations(apResults, grammarResults, contentType) {
        const recommendations = [];

        // Style recommendations
        if (apResults.overallScore < 80) {
            recommendations.push({
                type: 'ap_style',
                priority: 'high',
                suggestion: 'Focus on AP Style compliance, particularly numbers and attribution',
                impact: 'Improves professional credibility and media standards'
            });
        }

        // Grammar recommendations
        if (grammarResults.overallScore < 85) {
            recommendations.push({
                type: 'grammar',
                priority: 'high',
                suggestion: 'Address grammar issues before editorial review',
                impact: 'Ensures clear communication and professional quality'
            });
        }

        // Content-type specific recommendations
        if (contentType === 'press_release' && apResults.summary.totalViolations > 5) {
            recommendations.push({
                type: 'content_structure',
                priority: 'medium',
                suggestion: 'Review press release format and structure',
                impact: 'Improves media pickup and professional presentation'
            });
        }

        return recommendations;
    }
}

module.exports = {
    APStyleChecker,
    AP_STYLE_RULES,
    GRAMMAR_RULES
};