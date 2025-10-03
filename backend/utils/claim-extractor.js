/**
 * Claim Extraction and Normalization
 * Extracts structured claims from assertive sentences with numbers, dates, and actions
 */

class ClaimExtractor {
    constructor() {
        // Regex patterns for extraction
        this.patterns = {
            date: /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}|\b20\d{2}\b|Q[1-4]\s*20\d{2}|last year|this year|in \d{4})/i,
            percentage: /\b(-?\d{1,3}(?:\.\d+)?\s*%)\b/,
            currency: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\b/,
            count: /\b(\d{1,3})\b/,
            direction: /\b(rose|increased|fell|decreased|dropped|flat)\b/i,

            // Action patterns
            vote: /\b(voted\s+(?:for|against))\s+([\w\-''""\"&., ]{3,120})/i,
            raiseTax: /\b(raised?\s+tax(?:es)?)\b/i,
            crime: /\b(crime|violent crime|property crime)\s+(rose|increased|fell|decreased|dropped)\b/i,
            quote: /\b(?:said|claimed|stated)\s+(?:that|,)\s+/i
        };
    }

    /**
     * Extract quantity information from text
     */
    extractQuantity(text) {
        const quantity = {
            value: null,
            unit: null,
            direction: null,
            date_range: null
        };

        // Check for percentage
        const pctMatch = text.match(this.patterns.percentage);
        if (pctMatch) {
            quantity.value = parseFloat(pctMatch[1].replace('%', '').trim());
            quantity.unit = '%';
        }
        // Check for currency
        else if (this.patterns.currency.test(text)) {
            const currMatch = text.match(this.patterns.currency);
            if (currMatch) {
                quantity.value = parseFloat(currMatch[1].replace(/,/g, ''));
                quantity.unit = '$';
            }
        }
        // Check for simple count
        else {
            const countMatch = text.match(this.patterns.count);
            if (countMatch) {
                quantity.value = parseFloat(countMatch[1]);
                quantity.unit = 'count';
            }
        }

        // Check for direction
        const dirMatch = text.match(this.patterns.direction);
        if (dirMatch) {
            quantity.direction = dirMatch[1].toLowerCase();
        }

        return quantity;
    }

    /**
     * Normalize time references
     */
    normalizeTime(text) {
        const timeMatch = text.match(this.patterns.date);
        return {
            as_text: timeMatch ? timeMatch[0] : null,
            start: null, // TODO: parse to ISO date
            end: null
        };
    }

    /**
     * Classify predicate type
     */
    classifyPredicate(text) {
        if (this.patterns.vote.test(text)) return 'event';
        if (this.patterns.crime.test(text)) return 'quantity';
        if (this.patterns.raiseTax.test(text)) return 'event';
        if (this.patterns.quote.test(text)) return 'quote';
        if (this.patterns.percentage.test(text) || this.patterns.currency.test(text)) {
            return 'quantity';
        }
        return 'status';
    }

    /**
     * Extract action and object from text
     */
    extractActionObject(text) {
        // Check for vote pattern
        const voteMatch = text.match(this.patterns.vote);
        if (voteMatch) {
            return {
                action: voteMatch[1],
                object: voteMatch[2].trim().replace(/[.""']/g, '')
            };
        }

        // Check for crime pattern
        const crimeMatch = text.match(this.patterns.crime);
        if (crimeMatch) {
            return {
                action: 'changed',
                object: crimeMatch[1]
            };
        }

        // Check for tax pattern
        if (this.patterns.raiseTax.test(text)) {
            return {
                action: 'raised taxes',
                object: 'taxes'
            };
        }

        return { action: '', object: '' };
    }

    /**
     * Normalize actor name (placeholder - can be enhanced with NER)
     */
    normalizeActor(sentence, fallbackActor = null) {
        // TODO: Implement NER-based actor extraction
        // For now, return fallback or empty string
        return fallbackActor || '';
    }

    /**
     * Build a structured claim record from a sentence
     */
    buildClaim(options) {
        const {
            sentence,
            docId,
            sentenceId,
            deniabilityLabels = [],
            assertiveness = 0.0,
            fallbackActor = null
        } = options;

        const predicate = this.classifyPredicate(sentence);
        const time = this.normalizeTime(sentence);
        const quantity = this.extractQuantity(sentence);
        const actionObject = this.extractActionObject(sentence);

        return {
            meta: {
                schema_version: '1.0.0'
            },
            claim: {
                doc_id: docId,
                sentence_id: sentenceId,
                text: sentence,
                actor: this.normalizeActor(sentence, fallbackActor),
                predicate: predicate,
                action: actionObject.action,
                object: actionObject.object,
                quantity: quantity,
                time: time,
                location: null,
                deniability_markers: deniabilityLabels,
                assertiveness: assertiveness
            },
            verification: {
                status: 'unverified',
                confidence: 0.0,
                method: null,
                evidence: [],
                notes: ''
            }
        };
    }

    /**
     * Calculate assertiveness score from deniability
     * assertiveness = 1 - min(1, deniability_score)
     */
    calculateAssertiveness(deniabilityScore) {
        return Math.max(0.0, Math.round((1.0 - Math.min(1.0, deniabilityScore)) * 100) / 100);
    }

    /**
     * Determine if a sentence should be fact-checked
     * Keep if assertiveness >= 0.5 OR contains numbers/dates
     */
    shouldFactCheck(sentence, deniabilityScore) {
        const assertiveness = this.calculateAssertiveness(deniabilityScore);
        const hasNumbers = /\d/.test(sentence);
        return assertiveness >= 0.5 || hasNumbers;
    }
}

module.exports = ClaimExtractor;
