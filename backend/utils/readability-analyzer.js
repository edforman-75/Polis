/**
 * Readability Analyzer
 * Calculates multiple readability scores and provides suggestions to hit target grade levels
 */

const fs = require('fs');
const path = require('path');

class ReadabilityAnalyzer {
    constructor(customSettings = null) {
        // Grade level interpretations
        this.gradeLevels = {
            1: { label: '1st Grade', age: '6-7', description: 'Very simple, basic vocabulary' },
            2: { label: '2nd Grade', age: '7-8', description: 'Simple sentences, common words' },
            3: { label: '3rd Grade', age: '8-9', description: 'Elementary level' },
            4: { label: '4th Grade', age: '9-10', description: 'Upper elementary' },
            5: { label: '5th Grade', age: '10-11', description: 'Middle school entry' },
            6: { label: '6th Grade', age: '11-12', description: 'Middle school' },
            7: { label: '7th Grade', age: '12-13', description: 'Middle school' },
            8: { label: '8th Grade', age: '13-14', description: 'Middle school exit' },
            9: { label: '9th Grade', age: '14-15', description: 'High school freshman' },
            10: { label: '10th Grade', age: '15-16', description: 'High school sophomore' },
            11: { label: '11th Grade', age: '16-17', description: 'High school junior' },
            12: { label: '12th Grade', age: '17-18', description: 'High school senior' },
            13: { label: 'College Freshman', age: '18-19', description: 'College entry level' },
            14: { label: 'College Sophomore', age: '19-20', description: 'College intermediate' },
            15: { label: 'College Junior', age: '20-21', description: 'College upper level' },
            16: { label: 'College Senior', age: '21-22', description: 'College graduate level' },
            17: { label: 'Graduate School', age: '22+', description: 'Advanced academic' },
            18: { label: 'Professional', age: 'Adult', description: 'Professional/Academic' }
        };

        // Load settings from config file and merge with custom settings
        this.loadSettings(customSettings);

        // Syllable dictionary for common words (improves performance)
        this.syllableCache = new Map();
    }

    /**
     * Load readability settings from config file and merge with custom settings
     */
    loadSettings(customSettings = null) {
        try {
            // Default hardcoded settings (fallback if config file not found)
            const defaultSettings = {
                'press_release': { target: 8, range: [7, 10], note: 'General public audience' },
                'social_media': { target: 6, range: [5, 8], note: 'Broad accessibility' },
                'policy_document': { target: 12, range: [11, 14], note: 'Informed audience' },
                'speech': { target: 8, range: [7, 9], note: 'Spoken word, general public' },
                'talking_points': { target: 7, range: [6, 8], note: 'Quick comprehension' },
                'op_ed': { target: 11, range: [10, 13], note: 'Newspaper readers' },
                'email_blast': { target: 7, range: [6, 9], note: 'Wide audience' },
                'fundraising': { target: 8, range: [7, 10], note: 'Donor audience' }
            };

            // Try to load from config file
            const configPath = path.join(__dirname, '../config/readability-settings.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

                // Start with default settings from config
                this.recommendedLevels = { ...config.defaultSettings.contentTypes };
                this.tolerance = config.defaultSettings.tolerance || 1.0;

                // Apply campaign-specific overrides if enabled
                if (config.campaignSettings.enabled && config.campaignSettings.contentTypes) {
                    Object.keys(config.campaignSettings.contentTypes).forEach(contentType => {
                        this.recommendedLevels[contentType] = {
                            ...this.recommendedLevels[contentType],
                            ...config.campaignSettings.contentTypes[contentType]
                        };
                    });
                }
            } else {
                // Use hardcoded defaults if config file doesn't exist
                this.recommendedLevels = { ...defaultSettings };
                this.tolerance = 1.0;
            }

            // Apply custom settings passed to constructor (highest priority)
            if (customSettings && customSettings.contentTypes) {
                Object.keys(customSettings.contentTypes).forEach(contentType => {
                    this.recommendedLevels[contentType] = {
                        ...this.recommendedLevels[contentType],
                        ...customSettings.contentTypes[contentType]
                    };
                });
            }
            if (customSettings && customSettings.tolerance !== undefined) {
                this.tolerance = customSettings.tolerance;
            }

        } catch (error) {
            console.error('Error loading readability settings:', error);
            // Fall back to hardcoded defaults
            this.recommendedLevels = {
                'press_release': { target: 8, range: [7, 10], note: 'General public audience' },
                'social_media': { target: 6, range: [5, 8], note: 'Broad accessibility' },
                'policy_document': { target: 12, range: [11, 14], note: 'Informed audience' },
                'speech': { target: 8, range: [7, 9], note: 'Spoken word, general public' },
                'talking_points': { target: 7, range: [6, 8], note: 'Quick comprehension' },
                'op_ed': { target: 11, range: [10, 13], note: 'Newspaper readers' },
                'email_blast': { target: 7, range: [6, 9], note: 'Wide audience' },
                'fundraising': { target: 8, range: [7, 10], note: 'Donor audience' }
            };
            this.tolerance = 1.0;
        }
    }

    /**
     * Update settings dynamically (useful for campaign-specific configurations)
     */
    updateSettings(contentType, settings) {
        if (!this.recommendedLevels[contentType]) {
            this.recommendedLevels[contentType] = {};
        }
        this.recommendedLevels[contentType] = {
            ...this.recommendedLevels[contentType],
            ...settings
        };
    }

    /**
     * Get current settings for a content type
     */
    getSettings(contentType = null) {
        if (contentType) {
            return this.recommendedLevels[contentType] || null;
        }
        return {
            contentTypes: this.recommendedLevels,
            tolerance: this.tolerance
        };
    }

    /**
     * Analyze text readability with multiple formulas
     */
    analyzeReadability(text, targetGrade = 8, contentType = 'press_release') {
        const stats = this.calculateTextStats(text);

        const analysis = {
            text: text,
            targetGrade: targetGrade,
            contentType: contentType,
            statistics: stats,
            scores: {},
            averageGradeLevel: 0,
            difficulty: '',
            onTarget: false,
            deviation: 0,
            suggestions: []
        };

        // Calculate multiple readability formulas
        analysis.scores.fleschKincaid = this.fleschKincaidGrade(stats);
        analysis.scores.gunningFog = this.gunningFogIndex(stats);
        analysis.scores.smog = this.smogIndex(stats);
        analysis.scores.colemanLiau = this.colemanLiauIndex(stats);
        analysis.scores.automatedReadability = this.automatedReadabilityIndex(stats);
        analysis.scores.fleschReadingEase = this.fleschReadingEase(stats);

        // Calculate average (excluding Flesch Reading Ease which uses different scale)
        const gradeScores = [
            analysis.scores.fleschKincaid,
            analysis.scores.gunningFog,
            analysis.scores.smog,
            analysis.scores.colemanLiau,
            analysis.scores.automatedReadability
        ];
        analysis.averageGradeLevel = gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length;
        analysis.averageGradeLevel = Math.round(analysis.averageGradeLevel * 10) / 10; // Round to 1 decimal

        // Determine difficulty level
        analysis.difficulty = this.getDifficultyLevel(analysis.averageGradeLevel);

        // Check if on target
        const tolerance = this.tolerance || 1.0; // Use configured tolerance
        analysis.deviation = analysis.averageGradeLevel - targetGrade;
        analysis.onTarget = Math.abs(analysis.deviation) <= tolerance;

        // Generate suggestions if not on target
        if (!analysis.onTarget) {
            analysis.suggestions = this.generateReadabilitySuggestions(
                analysis.averageGradeLevel,
                targetGrade,
                stats,
                text
            );
        }

        return analysis;
    }

    /**
     * Calculate comprehensive text statistics
     */
    calculateTextStats(text) {
        // Clean text
        const cleanText = text
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/\s+/g, ' ')
            .trim();

        // Split into sentences
        const sentences = this.splitIntoSentences(cleanText);

        // Split into words
        const words = cleanText
            .toLowerCase()
            .replace(/[^a-z0-9\s'-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);

        // Count syllables
        const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

        // Count complex words (3+ syllables)
        const complexWords = words.filter(word => this.countSyllables(word) >= 3).length;

        // Count polysyllabic words (for SMOG)
        const polysyllabicWords = words.filter(word => this.countSyllables(word) >= 3).length;

        // Count characters (letters only, no spaces/punctuation)
        const characters = words.join('').length;

        // Average word length
        const avgWordLength = characters / words.length;

        // Average sentence length
        const avgSentenceLength = words.length / sentences.length;

        // Average syllables per word
        const avgSyllablesPerWord = syllables / words.length;

        return {
            text: cleanText,
            sentences: sentences.length,
            words: words.length,
            syllables: syllables,
            characters: characters,
            complexWords: complexWords,
            polysyllabicWords: polysyllabicWords,
            avgWordLength: avgWordLength,
            avgSentenceLength: avgSentenceLength,
            avgSyllablesPerWord: avgSyllablesPerWord,
            longestSentence: Math.max(...sentences.map(s => s.split(/\s+/).length)),
            shortestSentence: Math.min(...sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length))
        };
    }

    /**
     * Flesch-Kincaid Grade Level
     * Most widely used formula
     */
    fleschKincaidGrade(stats) {
        const grade = 0.39 * stats.avgSentenceLength + 11.8 * stats.avgSyllablesPerWord - 15.59;
        return Math.max(0, Math.round(grade * 10) / 10);
    }

    /**
     * Gunning Fog Index
     * Estimates years of formal education needed
     */
    gunningFogIndex(stats) {
        const complexWordPercentage = (stats.complexWords / stats.words) * 100;
        const grade = 0.4 * (stats.avgSentenceLength + complexWordPercentage);
        return Math.round(grade * 10) / 10;
    }

    /**
     * SMOG Index (Simple Measure of Gobbledygook)
     * Particularly good for healthcare and technical writing
     */
    smogIndex(stats) {
        if (stats.sentences < 30) {
            // SMOG is less accurate for short texts, use approximation
            const grade = 1.0430 * Math.sqrt(stats.polysyllabicWords * (30 / stats.sentences)) + 3.1291;
            return Math.round(grade * 10) / 10;
        }
        const grade = 1.0430 * Math.sqrt(stats.polysyllabicWords) + 3.1291;
        return Math.round(grade * 10) / 10;
    }

    /**
     * Coleman-Liau Index
     * Based on characters instead of syllables
     */
    colemanLiauIndex(stats) {
        const L = (stats.characters / stats.words) * 100; // Average letters per 100 words
        const S = (stats.sentences / stats.words) * 100; // Average sentences per 100 words
        const grade = 0.0588 * L - 0.296 * S - 15.8;
        return Math.max(0, Math.round(grade * 10) / 10);
    }

    /**
     * Automated Readability Index (ARI)
     * Character-based formula
     */
    automatedReadabilityIndex(stats) {
        const grade = 4.71 * (stats.characters / stats.words) + 0.5 * (stats.words / stats.sentences) - 21.43;
        return Math.max(0, Math.round(grade * 10) / 10);
    }

    /**
     * Flesch Reading Ease
     * Scale: 0-100 (higher = easier)
     */
    fleschReadingEase(stats) {
        const score = 206.835 - 1.015 * stats.avgSentenceLength - 84.6 * stats.avgSyllablesPerWord;
        return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
    }

    /**
     * Count syllables in a word
     */
    countSyllables(word) {
        if (this.syllableCache.has(word)) {
            return this.syllableCache.get(word);
        }

        word = word.toLowerCase().replace(/[^a-z]/g, '');

        if (word.length <= 3) {
            this.syllableCache.set(word, 1);
            return 1;
        }

        // Remove silent 'e' at end
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');

        // Count vowel groups
        const matches = word.match(/[aeiouy]{1,2}/g);
        let count = matches ? matches.length : 1;

        this.syllableCache.set(word, count);
        return count;
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        return text
            .replace(/([.!?])\s+(?=[A-Z])/g, '$1|')
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Get difficulty level description
     */
    getDifficultyLevel(gradeLevel) {
        if (gradeLevel <= 6) return 'Very Easy';
        if (gradeLevel <= 8) return 'Easy';
        if (gradeLevel <= 10) return 'Fairly Easy';
        if (gradeLevel <= 12) return 'Standard';
        if (gradeLevel <= 14) return 'Fairly Difficult';
        if (gradeLevel <= 16) return 'Difficult';
        return 'Very Difficult';
    }

    /**
     * Generate suggestions to reach target grade level
     */
    generateReadabilitySuggestions(currentGrade, targetGrade, stats, text) {
        const suggestions = [];
        const diff = currentGrade - targetGrade;

        if (diff > 0) {
            // Text is too difficult, need to simplify
            suggestions.push({
                type: 'readability_too_high',
                severity: 'warning',
                location: 'Overall text',
                message: `Grade level ${currentGrade.toFixed(1)} is ${Math.abs(diff).toFixed(1)} grades above target (${targetGrade})`,
                details: `Your text reads at ${currentGrade.toFixed(1)} grade level. Target is ${targetGrade}th grade (general public).`,
                suggestion: `Focus on: shorter sentences (15-20 words), simpler words (1-2 syllables), and active voice`,
                category: 'readability_grade_level'
            });

            // Check sentence length with specific examples
            if (stats.avgSentenceLength > 20) {
                const longestSentences = this.findLongestSentences(text, 3);
                const exampleFix = this.generateSentenceSplitExample(longestSentences[0]);

                suggestions.push({
                    type: 'sentence_too_long',
                    severity: 'warning',
                    location: 'Multiple sentences',
                    message: `Sentences average ${stats.avgSentenceLength.toFixed(1)} words (target: 15-20)`,
                    details: `Long sentences are harder to read. Your longest: ${longestSentences[0]?.split(' ').length || 0} words.\n\nExample:\n"${longestSentences[0]?.substring(0, 120)}..."`,
                    suggestion: `Break long sentences into 2-3 shorter ones. Could reduce grade level by ~${Math.min(2, (stats.avgSentenceLength / 20 - 1)).toFixed(1)} grades`,
                    category: 'readability_sentence_length',
                    examples: longestSentences.slice(0, 3)
                });
            }

            // Check word complexity - Create individual replacements
            const complexWordPercent = (stats.complexWords / stats.words * 100).toFixed(1);
            if (complexWordPercent > 15) {
                const difficultWords = this.identifyDifficultWords(text);

                // Add summary suggestion
                suggestions.push({
                    type: 'words_too_complex_summary',
                    severity: 'warning',
                    location: 'Throughout text',
                    message: `${complexWordPercent}% of words have 3+ syllables (target: <15%)`,
                    details: `Found ${difficultWords.length} complex words that can be simplified. Click individual replacement suggestions below to apply.`,
                    suggestion: `Simplify complex words to reduce grade level by ~0.5 grades per 5% reduction`,
                    category: 'readability_word_complexity'
                });

                // Add individual word replacements (one-click actions)
                difficultWords.slice(0, 10).forEach(word => {
                    suggestions.push({
                        type: 'word_replacement',
                        severity: 'info',
                        location: `Word: "${word.word}"`,
                        message: `Replace "${word.word}" with "${word.simpler}"`,
                        details: `"${word.word}" has ${word.syllables} syllables. "${word.simpler}" is clearer and easier to read.`,
                        suggestion: `Click to replace all instances in your text`,
                        category: 'readability_word_replacement',
                        replaceable: true,
                        searchText: word.word,
                        replaceWith: word.simpler,
                        actionLabel: `Replace all`
                    });
                });
            }

            // Check syllables per word
            if (stats.avgSyllablesPerWord > 1.7) {
                suggestions.push({
                    type: 'syllables_too_high',
                    severity: 'info',
                    location: 'Throughout text',
                    message: `Words average ${stats.avgSyllablesPerWord.toFixed(2)} syllables (target: 1.5-1.7)`,
                    details: `Shorter words are processed faster.\n\nExamples:\n• "get" not "obtain"\n• "show" not "demonstrate"\n• "help" not "facilitate"`,
                    suggestion: `Choose 1-2 syllable words that your audience uses in daily conversation`,
                    category: 'readability_syllables'
                });
            }

            // Add writing style tips
            suggestions.push({
                type: 'readability_style_tips',
                severity: 'info',
                location: 'Writing approach',
                message: `Style tips to reach ${targetGrade}th grade level`,
                details: `✓ Use active voice: "Smith signed the bill"\n✓ Write like you speak\n✓ One idea per sentence\n✓ Use concrete examples: "50,000 families"\n✓ Cut unnecessary words: "use" not "utilize"`,
                suggestion: `Apply these techniques to make your message accessible to all voters`,
                category: 'readability_writing_style'
            });

            // Check for passive voice
            const passiveCount = this.countPassiveVoice(text);
            if (passiveCount > 0) {
                suggestions.push({
                    type: 'passive_voice',
                    severity: 'info',
                    location: `${passiveCount} instances found`,
                    message: `Passive voice detected`,
                    details: `Active voice is more direct.\n\nExamples:\n❌ "The bill was passed"\n✅ "The legislature passed the bill"`,
                    suggestion: `Convert to active voice to show who is responsible`,
                    category: 'readability_voice'
                });
            }

        } else if (diff < 0) {
            // Text is too simple, need to make more sophisticated
            suggestions.push({
                type: 'readability_too_low',
                severity: 'info',
                location: 'Overall text',
                message: `Grade level ${currentGrade.toFixed(1)} is ${Math.abs(diff).toFixed(1)} grades below target (${targetGrade})`,
                details: `Your text reads at ${currentGrade.toFixed(1)} grade level. Target is ${targetGrade}th grade.`,
                suggestion: `Add variety and precision to reach your target audience`,
                category: 'readability_grade_level'
            });

            suggestions.push({
                type: 'sentence_variety',
                severity: 'info',
                location: 'Throughout text',
                message: 'Add more varied sentence structure',
                details: 'Mix short, punchy sentences (5-10 words) with longer, detailed ones (20-25 words) to create rhythm and sophistication.',
                suggestion: 'Vary sentence length to maintain reader engagement',
                category: 'readability_sentence_variety'
            });

            suggestions.push({
                type: 'vocabulary_precision',
                severity: 'info',
                location: 'Throughout text',
                message: 'Use more precise vocabulary',
                details: 'Replace general terms with specific, descriptive words that add clarity without complexity.',
                suggestion: 'Choose words that paint a clearer picture for your audience',
                category: 'readability_vocabulary'
            });
        }

        return suggestions;
    }

    /**
     * Identify difficult words and suggest simpler alternatives
     */
    identifyDifficultWords(text) {
        const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const difficultWords = [];

        // Common difficult words and their simpler alternatives
        const simplifications = {
            // Action verbs
            'utilize': 'use',
            'facilitate': 'help',
            'demonstrate': 'show',
            'implement': 'do',
            'establish': 'set up',
            'commence': 'start',
            'terminate': 'end',
            'obtain': 'get',
            'acquire': 'get',
            'provide': 'give',
            'require': 'need',
            'assist': 'help',
            'endeavor': 'try',
            'attempt': 'try',
            'indicate': 'show',
            'accomplish': 'do',
            'participate': 'take part',
            'eliminate': 'remove',
            'investigate': 'look into',
            'anticipate': 'expect',

            // Nouns
            'assistance': 'help',
            'individuals': 'people',
            'component': 'part',
            'modification': 'change',
            'legislation': 'law',
            'initiative': 'plan',
            'referendum': 'vote',
            'constituent': 'voter',
            'authorization': 'approval',
            'implementation': 'rollout',
            'comprehensive': 'full',
            'opportunity': 'chance',
            'prescription': 'drug',
            'recommendation': 'advice',
            'alternative': 'choice',
            'expenditure': 'cost',
            'infrastructure': 'system',
            'methodology': 'method',
            'priorities': 'goals',

            // Adjectives
            'sufficient': 'enough',
            'numerous': 'many',
            'additional': 'more',
            'substantial': 'large',
            'beneficial': 'helpful',
            'detrimental': 'harmful',
            'significant': 'important',
            'equivalent': 'equal',
            'fundamental': 'basic',
            'preliminary': 'early',
            'subsequent': 'next',
            'excessive': 'too much',
            'inadequate': 'not enough',
            'optimum': 'best',
            'paramount': 'most important',

            // Adverbs & Others
            'approximately': 'about',
            'currently': 'now',
            'subsequently': 'later',
            'previously': 'before',
            'consequently': 'so',
            'nevertheless': 'but',
            'accordingly': 'so',
            'furthermore': 'also',
            'additionally': 'also',
            'therefore': 'so',
            'however': 'but',
            'moreover': 'also',

            // Common phrases
            'majority': 'most',
            'minority': 'few',
            'in order to': 'to',
            'prior to': 'before',
            'due to': 'because',
            'with regard to': 'about',
            'in the event that': 'if'
        };

        const seen = new Set();
        words.forEach(word => {
            if (simplifications[word] && !seen.has(word)) {
                difficultWords.push({
                    word: word,
                    simpler: simplifications[word],
                    syllables: this.countSyllables(word)
                });
                seen.add(word);
            }
        });

        return difficultWords.sort((a, b) => b.syllables - a.syllables);
    }

    /**
     * Find longest sentences in text
     */
    findLongestSentences(text, count = 3) {
        const sentences = this.splitIntoSentences(text);
        return sentences
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length)
            .slice(0, count);
    }

    /**
     * Generate example of how to split a long sentence
     */
    generateSentenceSplitExample(sentence) {
        if (!sentence || sentence.length < 50) return 'Split into shorter sentences.';

        // Find natural break points (conjunctions, commas)
        const words = sentence.split(/\s+/);
        if (words.length < 15) return sentence;

        const midPoint = Math.floor(words.length / 2);
        const part1 = words.slice(0, midPoint).join(' ');
        const part2 = words.slice(midPoint).join(' ');

        return `"${part1.substring(0, 60)}..." + "${part2.substring(0, 60)}..."`;
    }

    /**
     * Count passive voice instances
     */
    countPassiveVoice(text) {
        const passivePatterns = [
            /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
            /\b(is|are|was|were|be|been|being)\s+(shown|given|taken|made|done|seen|known|found)\b/gi
        ];

        let count = 0;
        passivePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) count += matches.length;
        });

        return count;
    }

    /**
     * Format readability report
     */
    formatReport(analysis) {
        const gradeInfo = this.gradeLevels[Math.round(analysis.averageGradeLevel)] ||
                         this.gradeLevels[18];

        return {
            summary: {
                currentGrade: analysis.averageGradeLevel,
                targetGrade: analysis.targetGrade,
                gradeLabel: gradeInfo.label,
                difficulty: analysis.difficulty,
                onTarget: analysis.onTarget,
                deviation: analysis.deviation
            },
            scores: analysis.scores,
            fleschInterpretation: this.interpretFleschScore(analysis.scores.fleschReadingEase),
            statistics: analysis.statistics,
            suggestions: analysis.suggestions
        };
    }

    /**
     * Interpret Flesch Reading Ease score
     */
    interpretFleschScore(score) {
        if (score >= 90) return '5th grade - Very easy to read';
        if (score >= 80) return '6th grade - Easy to read';
        if (score >= 70) return '7th grade - Fairly easy to read';
        if (score >= 60) return '8-9th grade - Plain English';
        if (score >= 50) return '10-12th grade - Fairly difficult';
        if (score >= 30) return 'College - Difficult';
        return 'College graduate - Very difficult';
    }
}

module.exports = ReadabilityAnalyzer;
