/**
 * Parser Learning Module
 * Observes editor corrections and extracts training patterns for parser improvement
 */

export class ParserLearning {
    constructor(changeTracker) {
        this.changeTracker = changeTracker;
        this.originalParsedFields = {};
        this.corrections = [];
        this.patterns = {
            fieldMovements: [],      // Content moved from one field to another
            textCleanups: [],        // Deletions of excess spacing, boilerplate, etc.
            fieldExtractions: [],    // Text extracted from body to specific field
            formatCorrections: []    // Formatting fixes (dates, phone numbers, etc.)
        };
    }

    /**
     * Store the initial parsed fields from the parser
     * @param {Object} parsedFields - The fields as initially parsed
     * @param {string} originalText - The original raw text that was parsed
     */
    recordInitialParse(parsedFields, originalText) {
        console.log('🧠 Recording initial parse for learning');

        this.originalParsedFields = JSON.parse(JSON.stringify(parsedFields));
        this.originalText = originalText;
        this.corrections = [];

        console.log('✅ Initial parse recorded:', Object.keys(parsedFields).length, 'fields');
    }

    /**
     * Detect when editor moves content from one field to another
     * This is a key parser error pattern
     */
    detectFieldMovement(fromField, toField, movedText) {
        const pattern = {
            type: 'field-movement',
            timestamp: new Date().toISOString(),
            fromField: fromField,
            toField: toField,
            movedText: movedText,
            originalFromValue: this.originalParsedFields[fromField] || '',
            originalToValue: this.originalParsedFields[toField] || '',
            // Try to detect WHY it was moved
            reason: this.inferMovementReason(fromField, toField, movedText)
        };

        this.patterns.fieldMovements.push(pattern);
        console.log('📦 Field movement detected:', `${fromField} → ${toField}`);

        return pattern;
    }

    /**
     * Detect text cleanup patterns (deletions that improve quality)
     */
    detectTextCleanup(field, originalValue, cleanedValue) {
        const deleted = this.findDeletedText(originalValue, cleanedValue);

        if (deleted.length === 0) return null;

        const pattern = {
            type: 'text-cleanup',
            timestamp: new Date().toISOString(),
            field: field,
            deletedSegments: deleted,
            originalValue: originalValue,
            cleanedValue: cleanedValue,
            cleanupType: this.classifyCleanup(deleted)
        };

        this.patterns.textCleanups.push(pattern);
        console.log('🧹 Text cleanup detected:', pattern.cleanupType);

        return pattern;
    }

    /**
     * Detect when editor extracts text from body and puts it in a specific field
     * This is a critical parser improvement signal
     */
    detectFieldExtraction(bodyField, targetField, extractedText) {
        const pattern = {
            type: 'field-extraction',
            timestamp: new Date().toISOString(),
            bodyField: bodyField,
            targetField: targetField,
            extractedText: extractedText,
            // Find the text in the original body
            originalContext: this.findTextContext(
                this.originalParsedFields[bodyField] || '',
                extractedText
            ),
            // What type of field was it extracted to?
            targetFieldType: this.classifyFieldType(targetField),
            // Extract signals for pattern matching
            signals: this.extractFieldSignals(extractedText, targetField)
        };

        this.patterns.fieldExtractions.push(pattern);
        console.log('📤 Field extraction detected:', `${bodyField} → ${targetField}`);

        return pattern;
    }

    /**
     * Find deleted text segments
     */
    findDeletedText(original, cleaned) {
        const deleted = [];

        // Simple diff - find chunks that exist in original but not in cleaned
        const originalChunks = original.split(/\s+/);
        const cleanedSet = new Set(cleaned.split(/\s+/));

        let currentSegment = [];
        for (const chunk of originalChunks) {
            if (!cleanedSet.has(chunk)) {
                currentSegment.push(chunk);
            } else if (currentSegment.length > 0) {
                deleted.push({
                    text: currentSegment.join(' '),
                    position: original.indexOf(currentSegment.join(' '))
                });
                currentSegment = [];
            }
        }

        if (currentSegment.length > 0) {
            deleted.push({
                text: currentSegment.join(' '),
                position: original.indexOf(currentSegment.join(' '))
            });
        }

        return deleted;
    }

    /**
     * Classify the type of cleanup performed
     */
    classifyCleanup(deletedSegments) {
        const allText = deletedSegments.map(s => s.text).join(' ').toLowerCase();

        // Multiple spaces
        if (/\s{2,}/.test(allText)) {
            return 'excess-spacing';
        }

        // Boilerplate phrases
        if (/for immediate release|###|contact:|paid for by/i.test(allText)) {
            return 'boilerplate-removal';
        }

        // Duplicate content
        if (deletedSegments.length > 1 &&
            deletedSegments[0].text === deletedSegments[1]?.text) {
            return 'duplicate-removal';
        }

        // HTML/formatting artifacts
        if (/<[^>]+>|\&\w+;/.test(allText)) {
            return 'formatting-artifacts';
        }

        // Email signatures
        if (/sincerely|regards|best|thanks/i.test(allText)) {
            return 'signature-removal';
        }

        return 'general-cleanup';
    }

    /**
     * Infer why content was moved between fields
     */
    inferMovementReason(fromField, toField, movedText) {
        const text = movedText.toLowerCase();

        // Common patterns
        if (toField === 'headline' && fromField.includes('body')) {
            return 'headline-extraction';
        }

        if (toField === 'quote-1' || toField === 'quote-2') {
            if (text.includes('"') || text.includes("'")) {
                return 'quote-extraction';
            }
        }

        if (toField.includes('spokesperson')) {
            if (/said|stated|announced|according to/i.test(text)) {
                return 'attribution-extraction';
            }
        }

        if (toField === 'media-contact') {
            if (/\d{3}[-.)]\d{3}[-.)]\d{4}|@|email/i.test(text)) {
                return 'contact-extraction';
            }
        }

        if (toField === 'boilerplate') {
            return 'boilerplate-relocation';
        }

        return 'field-reassignment';
    }

    /**
     * Find the context around extracted text in the original
     */
    findTextContext(originalText, extractedText, contextWords = 10) {
        const index = originalText.indexOf(extractedText);
        if (index === -1) return null;

        const words = originalText.split(/\s+/);
        const extractedWords = extractedText.split(/\s+/);

        // Find position in words array
        let startWordIndex = 0;
        let foundIndex = -1;
        for (let i = 0; i < words.length; i++) {
            const chunk = words.slice(i, i + extractedWords.length).join(' ');
            if (chunk.includes(extractedText.substring(0, 20))) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex === -1) return null;

        return {
            before: words.slice(Math.max(0, foundIndex - contextWords), foundIndex).join(' '),
            extracted: extractedText,
            after: words.slice(foundIndex + extractedWords.length, foundIndex + extractedWords.length + contextWords).join(' ')
        };
    }

    /**
     * Classify field type for pattern matching
     */
    classifyFieldType(fieldId) {
        if (fieldId.includes('headline')) return 'headline';
        if (fieldId.includes('quote')) return 'quote';
        if (fieldId.includes('spokesperson')) return 'attribution';
        if (fieldId.includes('contact')) return 'contact';
        if (fieldId.includes('date')) return 'date';
        if (fieldId.includes('location')) return 'location';
        if (fieldId.includes('boilerplate')) return 'boilerplate';
        return 'body';
    }

    /**
     * Extract signals that help identify similar content in future
     */
    extractFieldSignals(text, targetField) {
        const signals = {
            length: text.length,
            wordCount: text.split(/\s+/).length,
            hasQuotes: /["']/.test(text),
            hasPhone: /\d{3}[-.)]\d{3}[-.)]\d{4}/.test(text),
            hasEmail: /@/.test(text),
            hasDate: /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(text),
            hasCurrency: /\$\d+/.test(text),
            hasURL: /https?:\/\//.test(text),
            startsWithQuote: /^["']/.test(text.trim()),
            endsWithPunctuation: /[.!?]$/.test(text.trim()),
            containsVerbs: /said|stated|announced|noted|added|explained/i.test(text),
            // Position-based signals
            nearBeginning: false, // Will be set based on context
            nearEnd: false,
            // Structural signals
            isAllCaps: text === text.toUpperCase(),
            hasParentheses: /\(.*\)/.test(text),
            hasBullets: /[•·-]\s/.test(text)
        };

        return signals;
    }

    /**
     * Generate training data from collected patterns
     */
    generateTrainingData() {
        const trainingData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                originalText: this.originalText,
                totalCorrections: this.corrections.length,
                totalPatterns: Object.values(this.patterns).flat().length
            },
            patterns: {
                fieldMovements: this.patterns.fieldMovements.map(p => ({
                    from: p.fromField,
                    to: p.toField,
                    text: p.movedText,
                    reason: p.reason,
                    context: this.findTextContext(this.originalText, p.movedText)
                })),
                textCleanups: this.patterns.textCleanups.map(p => ({
                    field: p.field,
                    deletedText: p.deletedSegments.map(s => s.text),
                    cleanupType: p.cleanupType
                })),
                fieldExtractions: this.patterns.fieldExtractions.map(p => ({
                    fromBody: p.bodyField,
                    toField: p.targetField,
                    extractedText: p.extractedText,
                    context: p.originalContext,
                    signals: p.signals
                }))
            },
            // Generate improvement suggestions for parser
            suggestions: this.generateParserSuggestions()
        };

        return trainingData;
    }

    /**
     * Generate specific suggestions for parser improvement
     */
    generateParserSuggestions() {
        const suggestions = [];

        // Analyze field extraction patterns
        const extractionsByTargetField = {};
        this.patterns.fieldExtractions.forEach(p => {
            if (!extractionsByTargetField[p.targetField]) {
                extractionsByTargetField[p.targetField] = [];
            }
            extractionsByTargetField[p.targetField].push(p);
        });

        Object.entries(extractionsByTargetField).forEach(([field, extractions]) => {
            if (extractions.length >= 2) {
                // Find common signals
                const commonSignals = this.findCommonSignals(extractions);

                suggestions.push({
                    type: 'extraction-rule',
                    field: field,
                    priority: extractions.length, // More occurrences = higher priority
                    rule: `Look for text with: ${Object.entries(commonSignals)
                        .filter(([k, v]) => v > extractions.length * 0.5)
                        .map(([k]) => k)
                        .join(', ')}`,
                    examples: extractions.slice(0, 3).map(e => e.extractedText)
                });
            }
        });

        // Analyze cleanup patterns
        const cleanupsByType = {};
        this.patterns.textCleanups.forEach(p => {
            if (!cleanupsByType[p.cleanupType]) {
                cleanupsByType[p.cleanupType] = [];
            }
            cleanupsByType[p.cleanupType].push(p);
        });

        Object.entries(cleanupsByType).forEach(([type, cleanups]) => {
            if (cleanups.length >= 2) {
                suggestions.push({
                    type: 'cleanup-rule',
                    cleanupType: type,
                    priority: cleanups.length,
                    rule: `Remove ${type} automatically`,
                    examples: cleanups.slice(0, 3).map(c => c.deletedSegments[0]?.text)
                });
            }
        });

        return suggestions;
    }

    /**
     * Find common signals across multiple extractions
     */
    findCommonSignals(extractions) {
        const signalCounts = {};

        extractions.forEach(e => {
            Object.entries(e.signals || {}).forEach(([signal, value]) => {
                if (value === true) {
                    signalCounts[signal] = (signalCounts[signal] || 0) + 1;
                }
            });
        });

        return signalCounts;
    }

    /**
     * Export training data to file or API
     */
    async exportTrainingData() {
        const data = this.generateTrainingData();

        // Send to backend for storage
        try {
            const response = await fetch('/api/press-release-parser/training-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('✅ Training data exported successfully');
                return true;
            } else {
                console.error('❌ Failed to export training data');
                return false;
            }
        } catch (error) {
            console.error('❌ Error exporting training data:', error);
            return false;
        }
    }

    /**
     * Get summary of learning patterns
     */
    getSummary() {
        return {
            totalFieldMovements: this.patterns.fieldMovements.length,
            totalTextCleanups: this.patterns.textCleanups.length,
            totalFieldExtractions: this.patterns.fieldExtractions.length,
            topMovements: this.getTopMovements(),
            topCleanups: this.getTopCleanupTypes(),
            suggestionsCount: this.generateParserSuggestions().length
        };
    }

    /**
     * Get most common field movements
     */
    getTopMovements() {
        const movements = {};
        this.patterns.fieldMovements.forEach(p => {
            const key = `${p.fromField} → ${p.toField}`;
            movements[key] = (movements[key] || 0) + 1;
        });

        return Object.entries(movements)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([movement, count]) => ({ movement, count }));
    }

    /**
     * Get most common cleanup types
     */
    getTopCleanupTypes() {
        const types = {};
        this.patterns.textCleanups.forEach(p => {
            types[p.cleanupType] = (types[p.cleanupType] || 0) + 1;
        });

        return Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({ type, count }));
    }
}

// Make available globally
window.ParserLearning = ParserLearning;
