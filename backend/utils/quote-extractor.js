/**
 * Quote Extractor
 * Extracts, parses, and validates quotes from press releases
 */

class QuoteExtractor {
    constructor() {
        // Quote patterns
        this.quotePatterns = {
            // Standard quote with attribution
            standard: /"([^"]+)"\s*(?:said|stated|noted|explained|added|continued|declared|announced|emphasized|remarked)\s+([^.,]+(?:\s+[^.,]+)?),?\s*([^.]+)?/gi,

            // Attribution before quote
            attribution_first: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+),\s*([^,]+),\s*(?:said|stated|noted|explained|added):?\s*"([^"]+)"/gi,

            // Quote blocks (multiple paragraphs)
            block_quote: /"([^"]+)"/g,

            // According to pattern
            according_to: /"([^"]+)"\s*according\s+to\s+([^.,]+(?:\s+[^.,]+)?),?\s*([^.]+)?/gi
        };

        // Title indicators
        this.titleIndicators = [
            'senator', 'representative', 'congressman', 'congresswoman',
            'governor', 'mayor', 'councilmember', 'delegate',
            'president', 'vice president', 'secretary',
            'director', 'commissioner', 'chair', 'chairman', 'chairwoman',
            'candidate', 'nominee', 'attorney general',
            'state representative', 'state senator',
            'assemblymember', 'supervisor'
        ];

        // Quote quality issues
        this.qualityFlags = {
            // Length issues
            too_short: { threshold: 15, severity: 'warning', message: 'Quote is very short (less than 15 characters)' },
            too_long: { threshold: 300, severity: 'info', message: 'Quote is very long (consider breaking into multiple quotes)' },

            // Content issues
            jargon_heavy: { keywords: ['synergy', 'leverage', 'paradigm', 'disrupt', 'innovative solutions'], severity: 'warning', message: 'Quote contains business jargon' },
            passive_voice: { patterns: [/\bis\s+\w+ed\b/gi, /\bwas\s+\w+ed\b/gi, /\bhave\s+been\s+\w+ed\b/gi], severity: 'info', message: 'Quote uses passive voice' },
            weak_verbs: { keywords: ['is', 'was', 'are', 'were', 'has', 'have', 'had'], severity: 'info', message: 'Quote contains weak verbs' },

            // Authenticity issues
            too_formal: { patterns: [/\bherein\b/gi, /\bwherein\b/gi, /\bthereof\b/gi, /\bheretofore\b/gi], severity: 'warning', message: 'Quote sounds overly formal/legal' },
            no_contractions: { severity: 'info', message: 'Quote has no contractions (may sound unnatural)' },

            // Problematic content
            negative_tone: { keywords: ['unfortunately', 'sadly', 'regrettably', 'fail', 'failed', 'problem', 'crisis'], severity: 'info', message: 'Quote has negative tone' },
            uncertain: { keywords: ['maybe', 'perhaps', 'might', 'possibly', 'hopefully', 'we think'], severity: 'warning', message: 'Quote sounds uncertain or weak' }
        };
    }

    /**
     * Extract all quotes from press release text
     */
    extractQuotes(text) {
        const quotes = [];
        const seenQuotes = new Set(); // Prevent duplicates

        // Try standard pattern (quote then attribution)
        this.extractWithPattern(text, this.quotePatterns.standard, quotes, seenQuotes, 'standard');

        // Try attribution-first pattern
        this.extractWithPattern(text, this.quotePatterns.attribution_first, quotes, seenQuotes, 'attribution_first');

        // Try according-to pattern
        this.extractWithPattern(text, this.quotePatterns.according_to, quotes, seenQuotes, 'according_to');

        // Sort by position in text
        quotes.sort((a, b) => a.position - b.position);

        // Assign quote numbers
        quotes.forEach((quote, index) => {
            quote.quote_number = index + 1;
            quote.field_name = `quote_${index + 1}`;
        });

        return quotes;
    }

    /**
     * Extract quotes using a specific pattern
     */
    extractWithPattern(text, pattern, quotes, seenQuotes, patternType) {
        pattern.lastIndex = 0; // Reset regex
        let match;

        while ((match = pattern.exec(text)) !== null) {
            let quoteText, speaker, title;

            if (patternType === 'standard') {
                quoteText = match[1];
                speaker = this.cleanSpeakerName(match[2]);
                title = match[3] ? this.extractTitle(match[3]) : null;
            } else if (patternType === 'attribution_first') {
                speaker = this.cleanSpeakerName(match[1]);
                title = this.extractTitle(match[2]);
                quoteText = match[3];
            } else if (patternType === 'according_to') {
                quoteText = match[1];
                speaker = this.cleanSpeakerName(match[2]);
                title = match[3] ? this.extractTitle(match[3]) : null;
            }

            // Skip if we've seen this quote
            const quoteKey = `${speaker}:${quoteText}`;
            if (seenQuotes.has(quoteKey)) continue;
            seenQuotes.add(quoteKey);

            // Extract title if not found
            if (!title) {
                const context = text.substring(Math.max(0, match.index - 100), Math.min(text.length, match.index + 200));
                title = this.extractTitleFromContext(speaker, context);
            }

            // Quality check
            const qualityIssues = this.checkQuoteQuality(quoteText);

            quotes.push({
                quote_text: quoteText.trim(),
                speaker_name: speaker,
                speaker_title: title,
                position: match.index,
                is_protected: true, // Quotes should be protected by default
                quality_score: this.calculateQualityScore(qualityIssues),
                quality_issues: qualityIssues,
                needs_review: qualityIssues.some(issue => issue.severity === 'warning'),
                pattern_type: patternType,
                full_context: match[0]
            });
        }
    }

    /**
     * Clean speaker name
     */
    cleanSpeakerName(name) {
        if (!name) return null;

        return name
            .trim()
            .replace(/^(senator|representative|congressman|congresswoman|governor|mayor|dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '')
            .replace(/,.*$/, '') // Remove anything after comma
            .trim();
    }

    /**
     * Extract title from text
     */
    extractTitle(text) {
        if (!text) return null;

        const cleaned = text.trim().toLowerCase();

        // Check for known title patterns
        for (const titleIndicator of this.titleIndicators) {
            if (cleaned.includes(titleIndicator)) {
                // Extract the full title phrase
                const titleMatch = text.match(new RegExp(`([^,;.]+${titleIndicator}[^,;.]*)`, 'i'));
                if (titleMatch) {
                    return this.cleanTitle(titleMatch[1]);
                }
            }
        }

        // If no specific title found, return the whole text if it looks like a title
        if (text.length < 100 && !text.includes('"')) {
            return this.cleanTitle(text);
        }

        return null;
    }

    /**
     * Extract title from surrounding context
     */
    extractTitleFromContext(speakerName, context) {
        // Look for title patterns near the speaker's name
        const nameIndex = context.toLowerCase().indexOf(speakerName.toLowerCase());

        if (nameIndex === -1) return null;

        // Check text after name
        const afterName = context.substring(nameIndex + speakerName.length, nameIndex + speakerName.length + 100);

        // Look for common title patterns
        for (const titleIndicator of this.titleIndicators) {
            const pattern = new RegExp(`[,\\s]+([^,;."]+${titleIndicator}[^,;."]*)`, 'i');
            const match = afterName.match(pattern);
            if (match) {
                return this.cleanTitle(match[1]);
            }
        }

        return null;
    }

    /**
     * Clean title text
     */
    cleanTitle(title) {
        return title
            .trim()
            .replace(/^(who is|who was|the|a|an)\s+/i, '')
            .replace(/^\s*,\s*/, '')
            .replace(/\s*,\s*$/, '')
            .trim();
    }

    /**
     * Check quote quality and flag issues
     */
    checkQuoteQuality(quoteText) {
        const issues = [];

        // Length checks
        if (quoteText.length < this.qualityFlags.too_short.threshold) {
            issues.push({
                type: 'too_short',
                severity: this.qualityFlags.too_short.severity,
                message: this.qualityFlags.too_short.message
            });
        }

        if (quoteText.length > this.qualityFlags.too_long.threshold) {
            issues.push({
                type: 'too_long',
                severity: this.qualityFlags.too_long.severity,
                message: this.qualityFlags.too_long.message
            });
        }

        // Jargon check
        const jargonCount = this.qualityFlags.jargon_heavy.keywords.filter(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(quoteText)
        ).length;

        if (jargonCount >= 2) {
            issues.push({
                type: 'jargon_heavy',
                severity: this.qualityFlags.jargon_heavy.severity,
                message: this.qualityFlags.jargon_heavy.message,
                details: `Found ${jargonCount} jargon terms`
            });
        }

        // Passive voice check
        const passiveMatches = this.qualityFlags.passive_voice.patterns.filter(pattern =>
            pattern.test(quoteText)
        ).length;

        if (passiveMatches >= 2) {
            issues.push({
                type: 'passive_voice',
                severity: this.qualityFlags.passive_voice.severity,
                message: this.qualityFlags.passive_voice.message
            });
        }

        // Formal language check
        const formalPatternMatches = this.qualityFlags.too_formal.patterns.filter(pattern =>
            pattern.test(quoteText)
        ).length;

        if (formalPatternMatches > 0) {
            issues.push({
                type: 'too_formal',
                severity: this.qualityFlags.too_formal.severity,
                message: this.qualityFlags.too_formal.message
            });
        }

        // Contractions check (natural speech has contractions)
        const hasContractions = /\b(don't|won't|can't|shouldn't|wouldn't|couldn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|I'm|we're|they're|you're|he's|she's|it's|I'll|we'll|they'll|you'll)\b/i.test(quoteText);

        if (!hasContractions && quoteText.length > 50) {
            issues.push({
                type: 'no_contractions',
                severity: this.qualityFlags.no_contractions.severity,
                message: this.qualityFlags.no_contractions.message
            });
        }

        // Uncertain language check
        const uncertainCount = this.qualityFlags.uncertain.keywords.filter(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(quoteText)
        ).length;

        if (uncertainCount >= 2) {
            issues.push({
                type: 'uncertain',
                severity: this.qualityFlags.uncertain.severity,
                message: this.qualityFlags.uncertain.message
            });
        }

        // Negative tone check
        const negativeCount = this.qualityFlags.negative_tone.keywords.filter(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(quoteText)
        ).length;

        if (negativeCount >= 2) {
            issues.push({
                type: 'negative_tone',
                severity: this.qualityFlags.negative_tone.severity,
                message: this.qualityFlags.negative_tone.message
            });
        }

        // Weak verbs density check
        const words = quoteText.split(/\s+/);
        const weakVerbCount = words.filter(word =>
            this.qualityFlags.weak_verbs.keywords.includes(word.toLowerCase())
        ).length;

        if (words.length > 10 && (weakVerbCount / words.length) > 0.15) {
            issues.push({
                type: 'weak_verbs',
                severity: this.qualityFlags.weak_verbs.severity,
                message: this.qualityFlags.weak_verbs.message,
                details: `${Math.round((weakVerbCount / words.length) * 100)}% weak verbs`
            });
        }

        return issues;
    }

    /**
     * Calculate overall quality score (0-100)
     */
    calculateQualityScore(issues) {
        let score = 100;

        issues.forEach(issue => {
            if (issue.severity === 'warning') {
                score -= 15;
            } else if (issue.severity === 'info') {
                score -= 5;
            }
        });

        return Math.max(0, score);
    }

    /**
     * Parse quotes into structured fields
     */
    parseQuotesToFields(quotes) {
        const fields = {};

        quotes.forEach((quote, index) => {
            const num = index + 1;
            fields[`quote_${num}`] = quote.quote_text;
            fields[`quote_${num}_speaker`] = quote.speaker_name;
            fields[`quote_${num}_title`] = quote.speaker_title || '';
            fields[`quote_${num}_protected`] = true;
            fields[`quote_${num}_quality_score`] = quote.quality_score;
            fields[`quote_${num}_needs_review`] = quote.needs_review;
        });

        return fields;
    }

    /**
     * Generate LD-JSON for quotes
     */
    generateQuoteLDJSON(quote) {
        const ldJSON = {
            "@type": "Quotation",
            "text": quote.quote_text
        };

        if (quote.speaker_name) {
            ldJSON.creator = {
                "@type": "Person",
                "name": quote.speaker_name
            };

            if (quote.speaker_title) {
                ldJSON.creator.jobTitle = quote.speaker_title;
            }
        }

        return ldJSON;
    }

    /**
     * Generate all quotes LD-JSON
     */
    generateAllQuotesLDJSON(quotes) {
        return quotes.map(quote => this.generateQuoteLDJSON(quote));
    }
}

module.exports = QuoteExtractor;
