class GrammarAnalyzer {
    constructor() {
        this.grammarRules = {
            punctuation: {
                name: 'Punctuation',
                description: 'Proper punctuation usage',
                weight: 0.15,
                rules: [
                    {
                        pattern: /[A-Z][^.!?]*[a-z]\s+[A-Z]/g,
                        type: 'missing_end_punctuation',
                        message: 'Missing end punctuation before new sentence'
                    },
                    {
                        pattern: /\s{2,}/g,
                        type: 'multiple_spaces',
                        message: 'Multiple consecutive spaces'
                    },
                    {
                        pattern: /\s+[,.!?]/g,
                        type: 'space_before_punctuation',
                        message: 'Unnecessary space before punctuation'
                    },
                    {
                        pattern: /[,.!?]{2,}/g,
                        type: 'repeated_punctuation',
                        message: 'Repeated punctuation marks'
                    }
                ]
            },
            sentence_structure: {
                name: 'Sentence Structure',
                description: 'Sentence construction and variety',
                weight: 0.25,
                rules: [
                    {
                        pattern: /^[a-z]/m,
                        type: 'lowercase_sentence_start',
                        message: 'Sentence should start with capital letter'
                    },
                    {
                        pattern: /\b(and|but|or|so)\s+[A-Z]/g,
                        type: 'conjunction_sentence_start',
                        message: 'Avoid starting sentences with conjunctions in formal writing'
                    }
                ]
            },
            word_usage: {
                name: 'Word Usage',
                description: 'Proper word choice and common errors',
                weight: 0.2,
                rules: [
                    {
                        pattern: /\b(there|their|they're)\b/gi,
                        type: 'homophone_check',
                        message: 'Verify correct usage of there/their/they\'re'
                    },
                    {
                        pattern: /\b(your|you're)\b/gi,
                        type: 'homophone_check',
                        message: 'Verify correct usage of your/you\'re'
                    },
                    {
                        pattern: /\b(its|it's)\b/gi,
                        type: 'homophone_check',
                        message: 'Verify correct usage of its/it\'s'
                    },
                    {
                        pattern: /\bvery\s+/gi,
                        type: 'weak_intensifier',
                        message: 'Consider stronger alternatives to "very"'
                    },
                    {
                        pattern: /\b(really|actually|basically|literally)\b/gi,
                        type: 'filler_words',
                        message: 'Consider removing unnecessary filler words'
                    }
                ]
            },
            readability: {
                name: 'Readability',
                description: 'Text clarity and accessibility',
                weight: 0.2,
                rules: [
                    {
                        type: 'sentence_length',
                        message: 'Very long sentences may reduce readability'
                    },
                    {
                        type: 'paragraph_length',
                        message: 'Long paragraphs may reduce readability'
                    },
                    {
                        type: 'passive_voice',
                        message: 'Consider using active voice for stronger impact'
                    }
                ]
            },
            style: {
                name: 'Style and Clarity',
                description: 'Writing style consistency',
                weight: 0.2,
                rules: [
                    {
                        pattern: /\b(I think|I believe|I feel)\b/gi,
                        type: 'weak_opinion',
                        message: 'Consider more assertive language for campaign content'
                    },
                    {
                        pattern: /\b(may|might|could|should)\b/gi,
                        type: 'tentative_language',
                        message: 'Consider more definitive language for stronger impact'
                    },
                    {
                        pattern: /\bthat\s+(is|was|are|were)\b/gi,
                        type: 'wordy_construction',
                        message: 'Consider more concise phrasing'
                    }
                ]
            }
        };

        this.campaignStylePreferences = {
            oxford_comma: true,
            formal_tone: true,
            active_voice_preferred: true,
            max_sentence_length: 25,
            max_paragraph_sentences: 4,
            avoid_contractions: false
        };
    }

    analyze(text) {
        const sentences = this.extractSentences(text);
        const paragraphs = this.extractParagraphs(text);

        const grammarIssues = this.checkGrammarRules(text, sentences, paragraphs);
        const readabilityMetrics = this.calculateReadabilityMetrics(text, sentences, paragraphs);
        const styleAnalysis = this.analyzeWritingStyle(text, sentences);
        const recommendations = this.generateRecommendations(grammarIssues, readabilityMetrics, styleAnalysis);

        const overallScore = this.calculateOverallScore(grammarIssues, readabilityMetrics, styleAnalysis);

        return {
            overall_score: overallScore,
            grammar_issues: grammarIssues,
            readability_metrics: readabilityMetrics,
            style_analysis: styleAnalysis,
            recommendations,
            issue_summary: this.generateIssueSummary(grammarIssues),
            improvement_priority: this.prioritizeImprovements(grammarIssues, recommendations),
            statistics: {
                total_sentences: sentences.length,
                total_paragraphs: paragraphs.length,
                avg_sentence_length: Math.round(text.split(/\s+/).length / sentences.length),
                avg_paragraph_length: Math.round(sentences.length / paragraphs.length)
            }
        };
    }

    extractSentences(text) {
        return text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    extractParagraphs(text) {
        return text.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }

    checkGrammarRules(text, sentences, paragraphs) {
        const issues = [];

        Object.entries(this.grammarRules || {}).forEach(([categoryName, category]) => {
            category.rules.forEach(rule => {
                if (rule.type === 'sentence_length') {
                    sentences.forEach((sentence, index) => {
                        const wordCount = sentence.split(/\s+/).length;
                        if (wordCount > this.campaignStylePreferences.max_sentence_length) {
                            issues.push({
                                category: categoryName,
                                type: rule.type,
                                message: rule.message,
                                severity: wordCount > 35 ? 'high' : 'medium',
                                location: `Sentence ${index + 1}`,
                                suggestion: 'Consider breaking into shorter sentences'
                            });
                        }
                    });
                } else if (rule.type === 'paragraph_length') {
                    paragraphs.forEach((paragraph, index) => {
                        const sentenceCount = paragraph.split(/[.!?]+/).length - 1;
                        if (sentenceCount > this.campaignStylePreferences.max_paragraph_sentences) {
                            issues.push({
                                category: categoryName,
                                type: rule.type,
                                message: rule.message,
                                severity: sentenceCount > 6 ? 'high' : 'medium',
                                location: `Paragraph ${index + 1}`,
                                suggestion: 'Consider breaking into shorter paragraphs'
                            });
                        }
                    });
                } else if (rule.type === 'passive_voice') {
                    const passiveMatches = text.match(/\b(is|are|was|were|being|been)\s+\w*ed\b/gi) || [];
                    if (passiveMatches.length > sentences.length * 0.2) {
                        issues.push({
                            category: categoryName,
                            type: rule.type,
                            message: rule.message,
                            severity: 'medium',
                            count: passiveMatches.length,
                            suggestion: 'Rewrite in active voice for stronger impact'
                        });
                    }
                } else if (rule.pattern) {
                    const globalPattern = new RegExp(rule.pattern.source, rule.pattern.flags + (rule.pattern.global ? '' : 'g'));
                    const matches = [...text.matchAll(globalPattern)];
                    matches.forEach(match => {
                        issues.push({
                            category: categoryName,
                            type: rule.type,
                            message: rule.message,
                            severity: this.determineSeverity(rule.type),
                            location: match.index,
                            text: match[0],
                            suggestion: this.getSuggestion(rule.type, match[0])
                        });
                    });
                }
            });
        });

        return issues;
    }

    calculateReadabilityMetrics(text, sentences, paragraphs) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSentencesPerParagraph = sentences.length / paragraphs.length;

        // Simple syllable estimation
        const syllableCount = words.reduce((count, word) => {
            return count + this.estimateSyllables(word);
        }, 0);

        // Flesch Reading Ease approximation
        const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (syllableCount / words.length));

        return {
            flesch_reading_ease: Math.max(0, Math.min(100, Math.round(fleschScore))),
            avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10,
            avg_sentences_per_paragraph: Math.round(avgSentencesPerParagraph * 10) / 10,
            total_words: words.length,
            total_syllables: syllableCount,
            readability_level: this.getReadabilityLevel(fleschScore),
            complexity_score: this.calculateComplexityScore(text, words, sentences)
        };
    }

    estimateSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;

        const vowels = word.match(/[aeiouy]+/g);
        let syllables = vowels ? vowels.length : 1;

        if (word.endsWith('e')) syllables--;
        if (word.endsWith('le') && word.length > 2) syllables++;

        return Math.max(1, syllables);
    }

    getReadabilityLevel(score) {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    calculateComplexityScore(text, words, sentences) {
        const complexWords = words.filter(word => this.estimateSyllables(word) >= 3).length;
        const complexWordRatio = complexWords / words.length;
        const avgSentenceLength = words.length / sentences.length;

        // Normalize to 0-100 scale
        return Math.round((complexWordRatio * 50) + (Math.min(avgSentenceLength / 25, 1) * 50));
    }

    analyzeWritingStyle(text, sentences) {
        const analysis = {
            tone_indicators: this.identifyToneIndicators(text),
            sentence_variety: this.analyzeSentenceVariety(sentences),
            word_choice: this.analyzeWordChoice(text),
            formality_level: this.assessFormalityLevel(text),
            clarity_score: this.assessClarity(text, sentences)
        };

        return analysis;
    }

    identifyToneIndicators(text) {
        const indicators = {
            assertive: (text.match(/\b(will|must|shall|committed|determined)\b/gi) || []).length,
            tentative: (text.match(/\b(may|might|perhaps|possibly|could)\b/gi) || []).length,
            emphatic: (text.match(/\b(absolutely|definitely|certainly|clearly)\b/gi) || []).length,
            collaborative: (text.match(/\b(together|partnership|community|shared)\b/gi) || []).length
        };

        const safeIndicators = indicators || {};
        const total = Object.values(safeIndicators).reduce((sum, count) => sum + count, 0);
        const percentages = {};

        Object.entries(safeIndicators).forEach(([key, count]) => {
            percentages[key] = total > 0 ? Math.round((count / total) * 100) : 0;
        });

        const entries = Object.entries(percentages || {});
        const dominantTone = entries.length > 0 ?
            entries.reduce((a, b) => percentages[a[0]] > percentages[b[0]] ? a : b)[0] :
            'neutral';

        return {
            raw_counts: indicators,
            percentages: percentages || {},
            dominant_tone: dominantTone
        };
    }

    analyzeSentenceVariety(sentences) {
        const lengths = sentences.map(s => s.split(/\s+/).length);
        const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

        const variety = {
            short: lengths.filter(len => len <= 10).length,
            medium: lengths.filter(len => len > 10 && len <= 20).length,
            long: lengths.filter(len => len > 20).length
        };

        const totalSentences = sentences.length;
        const varietyScore = Math.min(100,
            (Math.min(variety.short / totalSentences, 0.3) * 100) +
            (Math.min(variety.medium / totalSentences, 0.5) * 100) +
            (Math.min(variety.long / totalSentences, 0.2) * 100)
        );

        return {
            average_length: Math.round(avgLength * 10) / 10,
            distribution: variety,
            variety_score: Math.round(varietyScore),
            recommendation: varietyScore < 70 ? 'Increase sentence length variety' : 'Good sentence variety'
        };
    }

    analyzeWordChoice(text) {
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const lexicalDiversity = uniqueWords.size / words.length;

        const politicalTerms = words.filter(word =>
            /\b(policy|legislation|government|citizens|democracy|freedom|justice|equality)\b/.test(word)
        ).length;

        const actionWords = words.filter(word =>
            /\b(fight|defend|protect|build|create|strengthen|improve|deliver)\b/.test(word)
        ).length;

        return {
            lexical_diversity: Math.round(lexicalDiversity * 100),
            political_vocabulary: politicalTerms,
            action_oriented: actionWords,
            vocabulary_strength: lexicalDiversity > 0.6 ? 'Strong' : lexicalDiversity > 0.4 ? 'Moderate' : 'Limited'
        };
    }

    assessFormalityLevel(text) {
        const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;
        const formalWords = (text.match(/\b(furthermore|moreover|consequently|therefore|nevertheless)\b/gi) || []).length;
        const informalWords = (text.match(/\b(gonna|wanna|kinda|sorta|yeah|okay)\b/gi) || []).length;

        const words = text.split(/\s+/).length;
        const formalityScore = Math.max(0, Math.min(100,
            50 + (formalWords / words * 100) - (informalWords / words * 100) - (contractions / words * 50)
        ));

        return {
            score: Math.round(formalityScore),
            level: formalityScore > 75 ? 'Very Formal' : formalityScore > 50 ? 'Formal' : 'Informal',
            contractions_count: contractions,
            formal_markers: formalWords,
            informal_markers: informalWords
        };
    }

    assessClarity(text, sentences) {
        const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;
        const complexSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
        const clarityScore = Math.max(0, 100 - (avgWordsPerSentence * 2) - (complexSentences / sentences.length * 50));

        return {
            score: Math.round(clarityScore),
            level: clarityScore > 80 ? 'Very Clear' : clarityScore > 60 ? 'Clear' : 'Needs Improvement',
            complex_sentences: complexSentences,
            avg_sentence_length: Math.round(avgWordsPerSentence)
        };
    }

    determineSeverity(ruleType) {
        const highSeverity = ['missing_end_punctuation', 'lowercase_sentence_start'];
        const mediumSeverity = ['repeated_punctuation', 'space_before_punctuation', 'conjunction_sentence_start'];

        if (highSeverity.includes(ruleType)) return 'high';
        if (mediumSeverity.includes(ruleType)) return 'medium';
        return 'low';
    }

    getSuggestion(ruleType, matchedText) {
        const suggestions = {
            'missing_end_punctuation': 'Add appropriate punctuation at sentence end',
            'multiple_spaces': 'Use single spaces between words',
            'space_before_punctuation': 'Remove space before punctuation',
            'repeated_punctuation': 'Use single punctuation marks',
            'lowercase_sentence_start': 'Capitalize first letter of sentence',
            'conjunction_sentence_start': 'Consider starting with a different word',
            'homophone_check': 'Verify correct word usage in context',
            'weak_intensifier': 'Use more specific descriptive words',
            'filler_words': 'Remove or replace with more precise language',
            'weak_opinion': 'Use more assertive, confident language',
            'tentative_language': 'Consider more definitive statements',
            'wordy_construction': 'Simplify phrasing for clarity'
        };

        return suggestions[ruleType] || 'Review for improvement';
    }

    generateRecommendations(grammarIssues, readabilityMetrics, styleAnalysis) {
        const recommendations = [];

        // Grammar-based recommendations
        const highSeverityIssues = grammarIssues.filter(issue => issue.severity === 'high');
        if (highSeverityIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Grammar',
                title: 'Fix Critical Grammar Issues',
                description: `Address ${highSeverityIssues.length} high-priority grammar issues`,
                action_items: highSeverityIssues.slice(0, 3).map(issue => issue.suggestion)
            });
        }

        // Readability recommendations
        if (readabilityMetrics.flesch_reading_ease < 60) {
            recommendations.push({
                priority: 'medium',
                category: 'Readability',
                title: 'Improve Text Readability',
                description: 'Current readability level may be too complex for general audience',
                action_items: [
                    'Shorten average sentence length',
                    'Use simpler vocabulary where possible',
                    'Break up long paragraphs'
                ]
            });
        }

        // Style recommendations
        if (styleAnalysis.sentence_variety.variety_score < 70) {
            recommendations.push({
                priority: 'medium',
                category: 'Style',
                title: 'Increase Sentence Variety',
                description: 'Mix short, medium, and long sentences for better flow',
                action_items: [
                    'Vary sentence lengths',
                    'Use different sentence structures',
                    'Combine related short sentences'
                ]
            });
        }

        if (styleAnalysis.tone_indicators.dominant_tone === 'tentative') {
            recommendations.push({
                priority: 'high',
                category: 'Tone',
                title: 'Strengthen Campaign Voice',
                description: 'Use more assertive language for stronger impact',
                action_items: [
                    'Replace tentative words with definitive statements',
                    'Use active voice',
                    'Make stronger commitments'
                ]
            });
        }

        return recommendations;
    }

    calculateOverallScore(grammarIssues, readabilityMetrics, styleAnalysis) {
        let score = 100;

        // Deduct for grammar issues
        const grammarDeductions = grammarIssues.reduce((total, issue) => {
            return total + (issue.severity === 'high' ? 5 : issue.severity === 'medium' ? 3 : 1);
        }, 0);

        score -= Math.min(grammarDeductions, 40);

        // Adjust for readability
        if (readabilityMetrics.flesch_reading_ease < 30) score -= 15;
        else if (readabilityMetrics.flesch_reading_ease < 50) score -= 10;
        else if (readabilityMetrics.flesch_reading_ease < 60) score -= 5;

        // Adjust for style
        if (styleAnalysis.clarity_score.score < 60) score -= 10;
        if (styleAnalysis.sentence_variety.variety_score < 70) score -= 5;

        return Math.max(0, Math.round(score));
    }

    generateIssueSummary(grammarIssues) {
        const summary = {
            total_issues: grammarIssues.length,
            by_severity: {
                high: grammarIssues.filter(i => i.severity === 'high').length,
                medium: grammarIssues.filter(i => i.severity === 'medium').length,
                low: grammarIssues.filter(i => i.severity === 'low').length
            },
            by_category: {}
        };

        grammarIssues.forEach(issue => {
            if (!summary.by_category[issue.category]) {
                summary.by_category[issue.category] = 0;
            }
            summary.by_category[issue.category]++;
        });

        return summary;
    }

    prioritizeImprovements(grammarIssues, recommendations) {
        const priorities = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };

        // Categorize issues by impact
        grammarIssues.forEach(issue => {
            if (issue.severity === 'high' && ['punctuation', 'sentence_structure'].includes(issue.category)) {
                priorities.critical.push(issue);
            } else if (issue.severity === 'high') {
                priorities.high.push(issue);
            } else if (issue.severity === 'medium') {
                priorities.medium.push(issue);
            } else {
                priorities.low.push(issue);
            }
        });

        return {
            ...priorities,
            recommended_order: [
                'Fix critical punctuation and structure issues',
                'Address high-severity grammar problems',
                'Improve readability and clarity',
                'Enhance style and variety',
                'Polish remaining minor issues'
            ]
        };
    }
}

module.exports = GrammarAnalyzer;