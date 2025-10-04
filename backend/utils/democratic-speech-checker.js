/**
 * Democratic Speech Simplification Checker
 *
 * Helps Democratic campaigns speak clearly to voters at all education levels.
 * Flags overly complex language and provides actionable simplification suggestions.
 */

class DemocraticSpeechChecker {
    constructor() {
        // Thresholds
        this.WARNING_WORD_COUNT = 25;
        this.CRITICAL_WORD_COUNT = 30;

        // Complex word replacements (expanded from readability analyzer)
        this.complexWordReplacements = {
            // Democratic speech patterns
            'previously': 'before',
            'individuals': 'people',
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

            // Policy/government terms
            'assistance': 'help',
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
            'infrastructure': 'roads and bridges',
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

            // Adverbs
            'approximately': 'about',
            'currently': 'now',
            'subsequently': 'later',
            'consequently': 'so',
            'nevertheless': 'but',
            'accordingly': 'so',
            'furthermore': 'also',
            'additionally': 'also',
            'therefore': 'so',
            'however': 'but',
            'moreover': 'also',

            // Phrases that appear as single tokens
            'majority': 'most',
            'minority': 'few',
            'utilize': 'use',
            'facilitate': 'help',
            'demonstrate': 'show'
        };

        // Passive voice patterns
        this.passivePatterns = [
            {
                pattern: /\b(is|are|was|were|be|been|being)\s+(\w+ed)\b/gi,
                type: 'regular'
            },
            {
                pattern: /\b(is|are|was|were|be|been|being)\s+(shown|given|taken|made|done|seen|known|found|threatened|affected|impacted)\b/gi,
                type: 'irregular'
            }
        ];
    }

    /**
     * Main analysis method - checks text for Democratic messaging clarity
     */
    analyzeSpeech(text) {
        const sentences = this.splitIntoSentences(text);
        const issues = [];

        sentences.forEach((sentence, idx) => {
            // Check sentence length
            const lengthIssues = this.checkSentenceLength(sentence, idx);
            issues.push(...lengthIssues);

            // Check passive voice
            const passiveIssues = this.checkPassiveVoice(sentence, idx);
            issues.push(...passiveIssues);

            // Check complex words
            const wordIssues = this.checkComplexWords(sentence, idx);
            issues.push(...wordIssues);
        });

        return {
            totalSentences: sentences.length,
            issueCount: issues.length,
            issues: issues,
            summary: this.generateSummary(issues)
        };
    }

    /**
     * Check sentence length and provide splitting suggestions
     */
    checkSentenceLength(sentence, sentenceIdx) {
        const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        const issues = [];

        if (wordCount >= this.CRITICAL_WORD_COUNT) {
            // Critical: 30+ words
            const suggestedSplit = this.generateSentenceSplit(sentence);

            issues.push({
                type: 'sentence_length_critical',
                severity: 'error',
                sentenceNumber: sentenceIdx + 1,
                sentence: sentence,
                wordCount: wordCount,
                message: `${wordCount} words (critical - target max 25)`,
                details: `This sentence is too long. Voters will struggle to follow.`,
                suggestion: `Break into 2-3 shorter sentences:`,
                rewrite: suggestedSplit,
                replaceable: false
            });
        } else if (wordCount >= this.WARNING_WORD_COUNT) {
            // Warning: 25-29 words
            const suggestedSplit = this.generateSentenceSplit(sentence);

            issues.push({
                type: 'sentence_length_warning',
                severity: 'warning',
                sentenceNumber: sentenceIdx + 1,
                sentence: sentence,
                wordCount: wordCount,
                message: `${wordCount} words (getting long - target max 25)`,
                details: `Consider breaking this into shorter sentences for clarity.`,
                suggestion: `Suggested split:`,
                rewrite: suggestedSplit,
                replaceable: false
            });
        }

        return issues;
    }

    /**
     * Check for passive voice and suggest active alternatives
     */
    checkPassiveVoice(sentence, sentenceIdx) {
        const issues = [];

        this.passivePatterns.forEach(({ pattern, type }) => {
            const matches = sentence.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const activeRewrite = this.convertToActive(sentence, match);

                    issues.push({
                        type: 'passive_voice',
                        severity: 'info',
                        sentenceNumber: sentenceIdx + 1,
                        sentence: sentence,
                        passivePhrase: match,
                        message: `Passive voice: "${match}"`,
                        details: `Active voice is stronger and shows who's responsible.`,
                        suggestion: activeRewrite.suggestion,
                        rewrite: activeRewrite.text,
                        replaceable: true,
                        searchText: sentence,
                        replaceWith: activeRewrite.text
                    });
                });
            }
        });

        return issues;
    }

    /**
     * Check for complex words and provide simple alternatives
     */
    checkComplexWords(sentence, sentenceIdx) {
        const issues = [];
        const words = sentence.toLowerCase().match(/\b[a-z]+\b/g) || [];
        const foundReplacements = new Set();

        words.forEach(word => {
            if (this.complexWordReplacements[word] && !foundReplacements.has(word)) {
                foundReplacements.add(word);
                const simpler = this.complexWordReplacements[word];

                issues.push({
                    type: 'complex_word',
                    severity: 'info',
                    sentenceNumber: sentenceIdx + 1,
                    sentence: sentence,
                    complexWord: word,
                    message: `Replace "${word}" with "${simpler}"`,
                    details: `Simpler words reach more voters.`,
                    suggestion: `Click to replace all instances`,
                    replaceable: true,
                    searchText: word,
                    replaceWith: simpler,
                    actionLabel: 'Replace all'
                });
            }
        });

        return issues;
    }

    /**
     * Generate suggested sentence splits at natural break points
     */
    generateSentenceSplit(sentence) {
        // Find natural split points: coordinating conjunctions, commas with "and/but"
        const coordinatingConjunctions = /\b(,?\s+and\s+|,?\s+but\s+|,?\s+so\s+|;\s+)/gi;

        // Split at first major conjunction
        const parts = sentence.split(coordinatingConjunctions);

        if (parts.length >= 2) {
            // Clean up parts
            const cleaned = parts
                .filter(p => p && p.trim().length > 5 && !/^(and|but|so)$/i.test(p.trim()))
                .map(p => {
                    let s = p.trim();
                    // Capitalize first letter
                    s = s.charAt(0).toUpperCase() + s.slice(1);
                    // Add period if not present
                    if (!/[.!?]$/.test(s)) {
                        s += '.';
                    }
                    return s;
                });

            return cleaned.join(' ');
        }

        // If no natural split, suggest breaking at midpoint
        const words = sentence.split(/\s+/);
        if (words.length > 15) {
            const mid = Math.floor(words.length / 2);
            const part1 = words.slice(0, mid).join(' ').trim() + '.';
            const part2 = words.slice(mid).join(' ').trim();
            const part2Cap = part2.charAt(0).toUpperCase() + part2.slice(1);
            return `${part1} ${part2Cap}`;
        }

        return sentence + ' [Consider splitting this sentence]';
    }

    /**
     * Convert passive voice to active (basic heuristic)
     */
    convertToActive(sentence, passivePhrase) {
        // This is a simplified conversion - in practice, may need AI assistance
        // For now, provide guidance

        if (passivePhrase.includes('are seeing') || passivePhrase.includes('is seeing')) {
            return {
                text: sentence.replace(/are seeing (\w+) threatened/i, 'face threats to $1'),
                suggestion: 'Show who is doing the action'
            };
        }

        if (passivePhrase.includes('threatened')) {
            return {
                text: sentence.replace(/(\w+) (?:is|are|was|were) threatened/i, 'Trump threatens $1'),
                suggestion: 'Name who is responsible'
            };
        }

        // Generic suggestion
        return {
            text: sentence,
            suggestion: 'Rewrite to show who is taking the action (e.g., "Trump cuts jobs" not "jobs are being cut")'
        };
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
     * Generate summary of issues
     */
    generateSummary(issues) {
        const bySeverity = {
            error: issues.filter(i => i.severity === 'error').length,
            warning: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length
        };

        const byType = {};
        issues.forEach(issue => {
            byType[issue.type] = (byType[issue.type] || 0) + 1;
        });

        return {
            bySeverity,
            byType,
            readableMessage: this.getReadableSummary(bySeverity, byType)
        };
    }

    /**
     * Get human-readable summary
     */
    getReadableSummary(bySeverity, byType) {
        const parts = [];

        if (bySeverity.error > 0) {
            parts.push(`${bySeverity.error} critical issue${bySeverity.error > 1 ? 's' : ''}`);
        }
        if (bySeverity.warning > 0) {
            parts.push(`${bySeverity.warning} warning${bySeverity.warning > 1 ? 's' : ''}`);
        }
        if (bySeverity.info > 0) {
            parts.push(`${bySeverity.info} suggestion${bySeverity.info > 1 ? 's' : ''}`);
        }

        return parts.length > 0 ? parts.join(', ') : 'No issues found - clear and accessible!';
    }
}

module.exports = DemocraticSpeechChecker;
