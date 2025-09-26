/**
 * Editorial AI Assistant for Press Secretary and Senior Editors
 * Direct editing tools for campaign content optimization
 */

const { APStyleChecker } = require('./ap-style-checker');
const { EditorialCommentService } = require('./editorial-comments');

// AI Enhancement Categories
const AI_CAPABILITIES = {
    // Direct Editing Functions (Press Secretary Primary Tools)
    directEditing: {
        'headline_optimization': {
            name: 'Headline Optimizer',
            description: 'Strengthen headlines for media impact',
            authority: 'press_secretary',
            autoApply: true,
            examples: {
                before: "Smith Discusses Healthcare Ideas at Town Hall",
                after: "Smith Pledges 15% Healthcare Cost Cut for Working Families"
            }
        },
        'lead_paragraph_punch': {
            name: 'Lead Paragraph Enhancement',
            description: 'Make opening paragraphs immediately newsworthy',
            authority: 'press_secretary',
            autoApply: true,
            examples: {
                before: "The candidate visited a factory today where she talked about economic issues.",
                after: "Smith announced a bold $2 billion manufacturing investment plan today at Wilson Steel, promising 5,000 new union jobs within two years."
            }
        },
        'quote_enhancement': {
            name: 'Quote Strengthener',
            description: 'Make quotes more quotable and media-ready',
            authority: 'press_secretary',
            autoApply: true,
            examples: {
                before: '"We need to think about ways to help people," Smith said.',
                after: '"Every working family deserves a shot at the American Dream, not just the wealthy few," Smith declared.'
            }
        },
        'message_discipline': {
            name: 'Message Discipline Enforcer',
            description: 'Align content with campaign messaging pillars',
            authority: 'press_secretary',
            autoApply: true,
            keyMessages: [
                'Working families first',
                'Economic opportunity for all',
                'Healthcare as a right',
                'Education investment',
                'Climate action now'
            ]
        },
        'fact_precision': {
            name: 'Fact Precision Tool',
            description: 'Replace vague claims with specific, verifiable facts',
            authority: 'press_secretary',
            autoApply: false, // Requires verification
            examples: {
                before: "many people are struggling",
                after: "62% of families report difficulty paying medical bills (Kaiser Family Foundation, 2024)"
            }
        }
    },

    // Pre-Processing Tools (Run Before Press Secretary Review)
    preProcessing: {
        'technical_cleanup': {
            name: 'Technical Pre-Processor',
            description: 'Fix grammar, spelling, AP style basics',
            authority: 'automatic',
            autoApply: true,
            checks: [
                'spelling',
                'basic_grammar',
                'ap_style_numbers',
                'political_titles',
                'attribution_style'
            ]
        },
        'structure_analysis': {
            name: 'Structure Analyzer',
            description: 'Flag structural issues for editor attention',
            authority: 'automatic',
            autoApply: false,
            flags: [
                'buried_lead',
                'weak_conclusion',
                'missing_attribution',
                'fact_checking_needed',
                'tone_inconsistency'
            ]
        },
        'media_readiness_score': {
            name: 'Media Readiness Scorer',
            description: 'Assess how ready content is for distribution',
            authority: 'automatic',
            autoApply: false,
            criteria: {
                newsworthiness: 0.25,
                clarity: 0.20,
                brevity: 0.15,
                quotability: 0.20,
                factual_precision: 0.20
            }
        }
    },

    // Quick Fix Tools (One-Click Improvements)
    quickFixes: {
        'activate_voice': {
            name: 'Activate Voice',
            description: 'Convert passive to active voice',
            authority: 'press_secretary',
            autoApply: true,
            example: {
                before: "The bill was passed by the legislature",
                after: "The legislature passed the bill"
            }
        },
        'shorten_sentences': {
            name: 'Sentence Shortener',
            description: 'Break long sentences for readability',
            authority: 'press_secretary',
            autoApply: true,
            maxWords: 20
        },
        'remove_hedging': {
            name: 'Confidence Booster',
            description: 'Remove hedging language',
            authority: 'press_secretary',
            autoApply: true,
            hedgeWords: ['might', 'possibly', 'perhaps', 'seems', 'appears', 'arguably', 'somewhat']
        },
        'strengthen_verbs': {
            name: 'Verb Strengthener',
            description: 'Replace weak verbs with action verbs',
            authority: 'press_secretary',
            autoApply: true,
            replacements: {
                'said': ['declared', 'announced', 'pledged', 'vowed', 'emphasized'],
                'went': ['rushed', 'traveled', 'visited', 'toured', 'campaigned'],
                'talked about': ['addressed', 'tackled', 'confronted', 'outlined', 'detailed']
            }
        }
    },

    // Consistency Tools (Cross-Content Checking)
    consistency: {
        'fact_consistency': {
            name: 'Fact Consistency Checker',
            description: 'Ensure facts align across all content',
            authority: 'automatic',
            autoApply: false,
            checkAgainst: ['previous_releases', 'policy_positions', 'speech_archive']
        },
        'tone_consistency': {
            name: 'Tone Alignment',
            description: 'Maintain consistent campaign voice',
            authority: 'press_secretary',
            autoApply: false,
            toneAttributes: ['hopeful', 'determined', 'inclusive', 'forward-looking']
        },
        'name_style_consistency': {
            name: 'Name/Title Standardizer',
            description: 'Ensure consistent naming conventions',
            authority: 'automatic',
            autoApply: true,
            rules: {
                firstMention: 'full_title_and_name',
                subsequent: 'last_name_only',
                opponent: 'consistent_formal_reference'
            }
        }
    }
};

// Workflow Integration Points
const WORKFLOW_INTEGRATION = {
    // When content arrives from writer
    onWriterSubmission: [
        'technical_cleanup',
        'structure_analysis',
        'media_readiness_score',
        'fact_consistency',
        'name_style_consistency'
    ],

    // During Press Secretary editing
    duringEditing: [
        'headline_optimization',
        'lead_paragraph_punch',
        'quote_enhancement',
        'activate_voice',
        'shorten_sentences',
        'remove_hedging',
        'strengthen_verbs'
    ],

    // Before final approval
    beforeApproval: [
        'message_discipline',
        'fact_precision',
        'tone_consistency',
        'final_media_readiness_score'
    ],

    // Quick toolbar for editors
    quickToolbar: [
        'activate_voice',
        'shorten_sentences',
        'remove_hedging',
        'strengthen_verbs'
    ]
};

class EditorialAIAssistant {
    constructor() {
        this.apStyleChecker = new APStyleChecker();
        this.commentService = new EditorialCommentService();
        this.capabilities = AI_CAPABILITIES;
        this.workflow = WORKFLOW_INTEGRATION;
    }

    /**
     * Pre-process content when received from writer
     */
    async preProcessContent(content, contentType, metadata) {
        const results = {
            processed: false,
            originalContent: content,
            processedContent: content,
            changes: [],
            flags: [],
            score: null,
            recommendations: []
        };

        try {
            // Run technical cleanup
            const cleaned = await this.runTechnicalCleanup(content);
            if (cleaned.changed) {
                results.processedContent = cleaned.content;
                results.changes.push(...cleaned.changes);
            }

            // Analyze structure
            const structure = await this.analyzeStructure(results.processedContent, contentType);
            results.flags.push(...structure.flags);
            results.recommendations.push(...structure.recommendations);

            // Calculate media readiness
            results.score = await this.calculateMediaReadiness(results.processedContent, contentType);

            // Check consistency
            const consistency = await this.checkConsistency(results.processedContent, metadata);
            results.flags.push(...consistency.issues);

            results.processed = true;
        } catch (error) {
            console.error('Pre-processing error:', error);
            results.error = error.message;
        }

        return results;
    }

    /**
     * Apply direct edits during Press Secretary review
     */
    async applyDirectEdits(content, editType, options = {}) {
        const edit = this.capabilities.directEditing[editType];
        if (!edit) {
            throw new Error(`Unknown edit type: ${editType}`);
        }

        const result = {
            success: false,
            original: content,
            edited: content,
            changes: [],
            explanation: ''
        };

        try {
            switch (editType) {
                case 'headline_optimization':
                    result.edited = await this.optimizeHeadline(content, options);
                    break;
                case 'lead_paragraph_punch':
                    result.edited = await this.enhanceLeadParagraph(content, options);
                    break;
                case 'quote_enhancement':
                    result.edited = await this.strengthenQuotes(content, options);
                    break;
                case 'message_discipline':
                    result.edited = await this.enforceMessageDiscipline(content, options);
                    break;
                case 'fact_precision':
                    result.edited = await this.improveFactPrecision(content, options);
                    break;
            }

            if (result.edited !== content) {
                result.success = true;
                result.changes = this.diffContent(content, result.edited);
                result.explanation = edit.description;
            }
        } catch (error) {
            result.error = error.message;
        }

        return result;
    }

    /**
     * Apply quick fixes with one click
     */
    async applyQuickFix(content, fixType) {
        const fix = this.capabilities.quickFixes[fixType];
        if (!fix) {
            throw new Error(`Unknown fix type: ${fixType}`);
        }

        let edited = content;

        switch (fixType) {
            case 'activate_voice':
                edited = this.convertToActiveVoice(content);
                break;
            case 'shorten_sentences':
                edited = this.shortenSentences(content, fix.maxWords);
                break;
            case 'remove_hedging':
                edited = this.removeHedgingLanguage(content, fix.hedgeWords);
                break;
            case 'strengthen_verbs':
                edited = this.replaceWeakVerbs(content, fix.replacements);
                break;
        }

        return {
            original: content,
            edited: edited,
            changed: edited !== content
        };
    }

    /**
     * Technical cleanup operations
     */
    async runTechnicalCleanup(content) {
        const changes = [];
        let processed = content;

        // Fix common technical issues
        const fixes = [
            { pattern: /\s+([.,!?;:])/g, replacement: '$1', description: 'Remove space before punctuation' },
            { pattern: /([.,!?;:])\s{2,}/g, replacement: '$1 ', description: 'Fix multiple spaces after punctuation' },
            { pattern: /\s+$/gm, replacement: '', description: 'Remove trailing spaces' },
            { pattern: /^\s+/gm, replacement: '', description: 'Remove leading spaces' }
        ];

        fixes.forEach(fix => {
            const before = processed;
            processed = processed.replace(fix.pattern, fix.replacement);
            if (before !== processed) {
                changes.push(fix.description);
            }
        });

        // Run AP style checker
        const apResults = this.apStyleChecker.checkAPStyle(processed);

        // Apply automatic AP fixes
        apResults.categories.numbers?.issues.forEach(issue => {
            if (issue.rule === 'spell_out_small' && issue.suggestions) {
                issue.suggestions.forEach(suggestion => {
                    processed = processed.replace(suggestion.text, suggestion.suggestion);
                    changes.push(`AP Style: ${suggestion.reason}`);
                });
            }
        });

        return {
            content: processed,
            changed: processed !== content,
            changes: changes
        };
    }

    /**
     * Convert passive voice to active voice
     */
    convertToActiveVoice(content) {
        // Simple passive voice patterns and conversions
        const conversions = [
            { passive: /was (\w+ed) by/gi, active: (match, verb) => `${verb}` },
            { passive: /were (\w+ed) by/gi, active: (match, verb) => `${verb}` },
            { passive: /is being (\w+ed)/gi, active: (match, verb) => `${verb}` },
            { passive: /has been (\w+ed)/gi, active: (match, verb) => `${verb}` }
        ];

        let result = content;
        conversions.forEach(({ passive, active }) => {
            result = result.replace(passive, active);
        });

        return result;
    }

    /**
     * Break long sentences for readability
     */
    shortenSentences(content, maxWords = 20) {
        const sentences = content.split(/(?<=[.!?])\s+/);
        const processed = sentences.map(sentence => {
            const words = sentence.split(/\s+/);
            if (words.length > maxWords) {
                // Find natural breaking points
                const conjunctions = ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'];
                for (let i = Math.floor(words.length / 2); i < words.length - 5; i++) {
                    if (conjunctions.includes(words[i].toLowerCase())) {
                        // Split at conjunction
                        const part1 = words.slice(0, i).join(' ') + '.';
                        const part2 = words[i].charAt(0).toUpperCase() + words[i].slice(1) + ' ' +
                                     words.slice(i + 1).join(' ');
                        return part1 + ' ' + part2;
                    }
                }
            }
            return sentence;
        });

        return processed.join(' ');
    }

    /**
     * Remove hedging and uncertain language
     */
    removeHedgingLanguage(content, hedgeWords) {
        let result = content;
        hedgeWords.forEach(word => {
            const pattern = new RegExp(`\\b${word}\\b`, 'gi');
            result = result.replace(pattern, '').replace(/\s+/g, ' ');
        });
        return result.trim();
    }

    /**
     * Replace weak verbs with stronger alternatives
     */
    replaceWeakVerbs(content, replacements) {
        let result = content;
        Object.entries(replacements).forEach(([weak, strong]) => {
            const pattern = new RegExp(`\\b${weak}\\b`, 'gi');
            // Randomly select a strong verb for variety
            const replacement = strong[Math.floor(Math.random() * strong.length)];
            result = result.replace(pattern, replacement);
        });
        return result;
    }

    /**
     * Calculate media readiness score
     */
    async calculateMediaReadiness(content, contentType) {
        const criteria = this.capabilities.preProcessing.media_readiness_score.criteria;
        const scores = {};
        let totalScore = 0;

        // Newsworthiness (0-100)
        scores.newsworthiness = this.assessNewsworthiness(content);

        // Clarity (0-100)
        const readability = this.apStyleChecker.calculateReadabilityLevel(content);
        scores.clarity = readability === 'Easy' ? 100 : readability === 'Moderate' ? 75 : 50;

        // Brevity (0-100)
        const wordCount = content.split(/\s+/).length;
        const idealLength = contentType === 'press_release' ? 400 : 600;
        scores.brevity = Math.max(0, 100 - Math.abs(wordCount - idealLength) / 10);

        // Quotability (0-100)
        scores.quotability = this.assessQuotability(content);

        // Factual precision (0-100)
        scores.factual_precision = this.assessFactualPrecision(content);

        // Calculate weighted total
        Object.entries(criteria).forEach(([key, weight]) => {
            totalScore += scores[key] * weight;
        });

        return {
            total: Math.round(totalScore),
            breakdown: scores,
            recommendation: totalScore >= 80 ? 'ready' : totalScore >= 60 ? 'needs_minor_edits' : 'needs_major_revision'
        };
    }

    /**
     * Assess newsworthiness of content
     */
    assessNewsworthiness(content) {
        let score = 50; // Base score

        // Check for news hooks
        const newsHooks = ['announce', 'reveal', 'first', 'exclusive', 'breaking', 'new', 'unprecedented'];
        newsHooks.forEach(hook => {
            if (content.toLowerCase().includes(hook)) score += 5;
        });

        // Check for specific numbers/data
        if (/\d+%/.test(content)) score += 10;
        if (/\$[\d,]+/.test(content)) score += 10;

        // Check for quotes
        if (/"[^"]{20,}"/.test(content)) score += 10;

        return Math.min(100, score);
    }

    /**
     * Assess quotability of content
     */
    assessQuotability(content) {
        const quotes = content.match(/"[^"]+"/g) || [];
        if (quotes.length === 0) return 0;

        let score = 0;
        quotes.forEach(quote => {
            const length = quote.length;
            if (length > 20 && length < 100) score += 20; // Good length for media
            if (length > 15 && length < 50) score += 10;  // Excellent for social media
        });

        return Math.min(100, score);
    }

    /**
     * Assess factual precision
     */
    assessFactualPrecision(content) {
        let score = 60; // Base score

        // Check for specific numbers vs vague terms
        const vagueTerms = ['many', 'several', 'numerous', 'various', 'multiple', 'some'];
        const specificNumbers = content.match(/\b\d+\b/g) || [];

        vagueTerms.forEach(term => {
            if (content.toLowerCase().includes(term)) score -= 5;
        });

        score += Math.min(30, specificNumbers.length * 5);

        // Check for citations/sources
        if (/according to|survey|study|report|data/.test(content.toLowerCase())) score += 10;

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Optimize headlines for media impact
     */
    async optimizeHeadline(content, options = {}) {
        const lines = content.split('\n');
        const headline = lines[0];

        // Basic headline optimization
        let optimized = headline
            .replace(/discusses|talks about|mentions/gi, 'announces')
            .replace(/ideas|thoughts/gi, 'plan')
            .replace(/might|could|may/gi, 'will');

        lines[0] = optimized;
        return lines.join('\n');
    }

    /**
     * Enhance lead paragraphs for newsworthiness
     */
    async enhanceLeadParagraph(content, options = {}) {
        const paragraphs = content.split('\n\n');
        const lead = paragraphs[0];

        // Add specificity and urgency to lead
        let enhanced = lead
            .replace(/today/gi, 'today')
            .replace(/announced/gi, 'announced a bold')
            .replace(/plan/gi, 'comprehensive plan');

        paragraphs[0] = enhanced;
        return paragraphs.join('\n\n');
    }

    /**
     * Strengthen quotes for media appeal
     */
    async strengthenQuotes(content, options = {}) {
        const quotePattern = /"([^"]+)"/g;
        return content.replace(quotePattern, (match, quote) => {
            // Remove weak language from quotes
            const strengthened = quote
                .replace(/I think|I believe|I feel/gi, 'I know')
                .replace(/we should|we could/gi, 'we will')
                .replace(/maybe|perhaps/gi, 'absolutely');
            return `"${strengthened}"`;
        });
    }

    /**
     * Enforce campaign message discipline
     */
    async enforceMessageDiscipline(content, options = {}) {
        const keyMessages = this.capabilities.directEditing.message_discipline.keyMessages;
        let processed = content;

        // This would typically check against campaign messaging guidelines
        // For now, we'll do basic enforcement
        if (!keyMessages.some(msg => content.toLowerCase().includes(msg.toLowerCase()))) {
            // Add a key message if none present
            processed = content + '\n\n"This is about putting working families first," Smith emphasized.';
        }

        return processed;
    }

    /**
     * Improve factual precision
     */
    async improveFactPrecision(content, options = {}) {
        // Replace vague terms with more specific language
        return content
            .replace(/many people/gi, 'millions of Americans')
            .replace(/some time ago/gi, 'in recent months')
            .replace(/a lot of money/gi, 'billions in taxpayer funds')
            .replace(/very important/gi, 'critical to our future');
    }

    /**
     * Diff content changes for tracking
     */
    diffContent(original, edited) {
        // Simple diff implementation
        const changes = [];
        const originalLines = original.split('\n');
        const editedLines = edited.split('\n');

        for (let i = 0; i < Math.max(originalLines.length, editedLines.length); i++) {
            if (originalLines[i] !== editedLines[i]) {
                changes.push({
                    line: i + 1,
                    original: originalLines[i] || '',
                    edited: editedLines[i] || ''
                });
            }
        }

        return changes;
    }

    /**
     * Analyze content structure
     */
    async analyzeStructure(content, contentType) {
        const flags = [];
        const recommendations = [];

        const lines = content.split('\n');
        const firstParagraph = lines[0] || '';
        const lastParagraph = lines[lines.length - 1] || '';

        // Check for buried lead
        if (firstParagraph.length > 200 && !firstParagraph.includes('announce')) {
            flags.push('buried_lead');
            recommendations.push('Consider moving key announcement to first sentence');
        }

        // Check for weak conclusion
        if (lastParagraph.length < 50 || lastParagraph.endsWith('...')) {
            flags.push('weak_conclusion');
            recommendations.push('Strengthen conclusion with clear call-to-action or forward-looking statement');
        }

        // Check for missing attribution
        const quotes = content.match(/"[^"]+"/g) || [];
        if (quotes.length > 0 && !content.includes('said')) {
            flags.push('missing_attribution');
            recommendations.push('Add attribution for all quotes');
        }

        return { flags, recommendations };
    }

    /**
     * Check consistency across content
     */
    async checkConsistency(content, metadata) {
        const issues = [];

        // This would typically check against a database of previous content
        // For now, we'll do basic consistency checks

        // Check name consistency
        const names = content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
        const nameVariations = {};

        names.forEach(name => {
            const lastName = name.split(' ')[1];
            if (!nameVariations[lastName]) {
                nameVariations[lastName] = [];
            }
            nameVariations[lastName].push(name);
        });

        Object.entries(nameVariations).forEach(([lastName, variations]) => {
            if (variations.length > 1 && new Set(variations).size > 1) {
                issues.push(`Inconsistent naming for ${lastName}: ${variations.join(', ')}`);
            }
        });

        return { issues };
    }
}

module.exports = {
    EditorialAIAssistant,
    AI_CAPABILITIES,
    WORKFLOW_INTEGRATION
};