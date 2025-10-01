/**
 * Boilerplate Detector
 * Identifies boilerplate paragraphs in press releases using pattern matching and ML heuristics
 */

class BoilerplateDetector {
    constructor() {
        // Common boilerplate indicators
        this.boilerplateIndicators = {
            // Phrases that commonly appear in boilerplate
            openingPhrases: [
                /^[A-Z][\w\s]+ is a\b/i,
                /^[A-Z][\w\s]+ was born and raised in\b/i,
                /^[A-Z][\w\s]+ has served as\b/i,
                /^[A-Z][\w\s]+ currently serves as\b/i,
                /^[A-Z][\w\s]+ represents\b/i,
                /^[A-Z][\w\s]+ holds a\b/i,
                /^A lifelong resident of\b/i
            ],

            // Content patterns
            biographicalTerms: [
                'graduated', 'degree', 'university', 'college', 'education',
                'born', 'raised', 'resident', 'lives in', 'resides in',
                'served as', 'elected', 'appointed', 'represents',
                'career', 'experience', 'background'
            ],

            // Position indicators (usually last paragraph)
            positionKeywords: [
                'senator', 'representative', 'councilmember', 'mayor',
                'delegate', 'assemblymember', 'governor', 'candidate',
                'district', 'state', 'city', 'county'
            ]
        };
    }

    /**
     * Detect boilerplate in a press release
     * Returns array of detected boilerplate paragraphs with confidence scores
     */
    detectBoilerplate(pressReleaseText, candidateName = null) {
        const paragraphs = this.extractParagraphs(pressReleaseText);
        const results = [];

        paragraphs.forEach((paragraph, index) => {
            const score = this.scoreAsBoilerplate(paragraph, index, paragraphs.length, candidateName);

            if (score.confidence >= 0.5) {
                results.push({
                    text: paragraph.text,
                    paragraphIndex: index,
                    confidence: score.confidence,
                    indicators: score.indicators,
                    isLikelyBoilerplate: score.confidence >= 0.7,
                    position: index === paragraphs.length - 1 ? 'last' :
                             index === paragraphs.length - 2 ? 'second-to-last' : 'middle'
                });
            }
        });

        // Return highest confidence match (usually the last paragraph)
        return results.length > 0 ? results.sort((a, b) => b.confidence - a.confidence) : [];
    }

    /**
     * Extract paragraphs from text
     */
    extractParagraphs(text) {
        // Remove header material (FOR IMMEDIATE RELEASE, contact info, etc.)
        const cleanText = text
            .replace(/^FOR\s+(?:IMMEDIATE\s+)?RELEASE.*?\n/im, '')
            .replace(/^CONTACT:.*?\n/im, '')
            .replace(/^MEDIA\s+CONTACT:.*?\n/im, '');

        // Split into paragraphs
        const paragraphs = cleanText
            .split(/\n\s*\n+/)
            .map((p, idx) => ({
                text: p.trim(),
                index: idx,
                wordCount: p.trim().split(/\s+/).length
            }))
            .filter(p => p.text.length > 50); // Filter out very short paragraphs

        return paragraphs;
    }

    /**
     * Score a paragraph's likelihood of being boilerplate
     */
    scoreAsBoilerplate(paragraph, index, totalParagraphs, candidateName) {
        let confidence = 0;
        const indicators = [];
        const text = paragraph.text;

        // 1. Position scoring (boilerplate is usually last or second-to-last)
        if (index === totalParagraphs - 1) {
            confidence += 0.4;
            indicators.push('last-paragraph');
        } else if (index === totalParagraphs - 2) {
            confidence += 0.25;
            indicators.push('second-to-last-paragraph');
        }

        // 2. Opening phrase matching
        const hasBoilerplateOpening = this.boilerplateIndicators.openingPhrases.some(pattern => {
            return pattern.test(text);
        });

        if (hasBoilerplateOpening) {
            confidence += 0.3;
            indicators.push('boilerplate-opening-phrase');
        }

        // 3. Candidate name at start (common in boilerplate)
        if (candidateName) {
            const nameRegex = new RegExp(`^${candidateName.replace(/\s+/g, '\\s+')}\\b`, 'i');
            if (nameRegex.test(text)) {
                confidence += 0.15;
                indicators.push('starts-with-candidate-name');
            }
        }

        // 4. Biographical terms density
        const bioTermCount = this.boilerplateIndicators.biographicalTerms.filter(term => {
            return new RegExp(`\\b${term}\\b`, 'i').test(text);
        }).length;

        if (bioTermCount >= 3) {
            confidence += 0.2;
            indicators.push(`biographical-terms-${bioTermCount}`);
        } else if (bioTermCount >= 2) {
            confidence += 0.1;
            indicators.push(`biographical-terms-${bioTermCount}`);
        }

        // 5. Position/title keywords
        const hasPositionKeywords = this.boilerplateIndicators.positionKeywords.some(keyword => {
            return new RegExp(`\\b${keyword}\\b`, 'i').test(text);
        });

        if (hasPositionKeywords) {
            confidence += 0.15;
            indicators.push('position-keywords-present');
        }

        // 6. Length check (boilerplate is usually 50-150 words)
        const wordCount = text.split(/\s+/).length;
        if (wordCount >= 50 && wordCount <= 200) {
            confidence += 0.1;
            indicators.push(`optimal-length-${wordCount}-words`);
        }

        // 7. Structural patterns (e.g., contains educational background)
        if (/\b(B\.A\.|M\.A\.|B\.S\.|M\.S\.|Ph\.D\.|J\.D\.|M\.D\.)\b/i.test(text)) {
            confidence += 0.15;
            indicators.push('educational-credentials');
        }

        // 8. Check for past tense narrative (biographical)
        const pastTenseVerbs = (text.match(/\b(was|were|served|held|worked|graduated|earned|received)\b/gi) || []).length;
        if (pastTenseVerbs >= 2) {
            confidence += 0.1;
            indicators.push(`past-tense-biographical-${pastTenseVerbs}`);
        }

        // Cap confidence at 1.0
        confidence = Math.min(confidence, 1.0);

        return {
            confidence,
            indicators,
            wordCount,
            text
        };
    }

    /**
     * Extract the most likely boilerplate paragraph
     */
    extractPrimaryBoilerplate(pressReleaseText, candidateName = null) {
        const detected = this.detectBoilerplate(pressReleaseText, candidateName);

        if (detected.length === 0) {
            return null;
        }

        // Return the highest confidence match
        const primary = detected[0];

        return {
            text: primary.text,
            confidence: primary.confidence,
            position: primary.position,
            indicators: primary.indicators,
            metadata: {
                paragraphIndex: primary.paragraphIndex,
                detectedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Check if a paragraph matches known boilerplate patterns
     * (Used during editing to warn if boilerplate is being modified)
     */
    isBoilerplateParagraph(paragraphText, candidateName = null) {
        const score = this.scoreAsBoilerplate(
            { text: paragraphText },
            -1, // Unknown position
            -1,
            candidateName
        );

        return {
            isBoilerplate: score.confidence >= 0.6,
            confidence: score.confidence,
            indicators: score.indicators
        };
    }
}

module.exports = BoilerplateDetector;
