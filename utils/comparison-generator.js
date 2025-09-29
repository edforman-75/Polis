const { createTwoFilesPatch } = require('diff');
const { Diff2Html } = require('diff2html');

class ComparisonGenerator {
    constructor() {
        this.changeTypes = {
            addition: 'Content Added',
            deletion: 'Content Removed',
            modification: 'Content Modified',
            structural: 'Structure Changed',
            factual: 'Factual Update',
            stylistic: 'Style Improvement',
            clarity: 'Clarity Enhancement',
            compliance: 'Compliance Fix'
        };
    }

    generateComparison(originalText, revisedText) {
        // Generate unified diff
        const patch = createTwoFilesPatch(
            'Original Draft',
            'Revised Draft',
            originalText,
            revisedText,
            '',
            '',
            { context: 3 }
        );

        // Generate HTML diff visualization
        const diffHtml = Diff2Html.html(patch, {
            drawFileList: false,
            matching: 'lines',
            outputFormat: 'side-by-side',
            synchronisedScroll: true,
            highlight: true
        });

        // Analyze changes for editorial summary
        const changeAnalysis = this.analyzeChanges(originalText, revisedText);
        const editorialSummary = this.generateEditorialSummary(changeAnalysis);

        // Generate change statistics
        const statistics = this.calculateStatistics(originalText, revisedText, changeAnalysis);

        return {
            patch: patch,
            html_diff: diffHtml,
            change_analysis: changeAnalysis,
            editorial_summary: editorialSummary,
            statistics: statistics,
            generated_at: new Date().toISOString()
        };
    }

    analyzeChanges(originalText, revisedText) {
        const originalParagraphs = this.splitIntoParagraphs(originalText);
        const revisedParagraphs = this.splitIntoParagraphs(revisedText);

        const changes = [];
        let changeId = 1;

        // Analyze paragraph-level changes
        const maxLength = Math.max(originalParagraphs.length, revisedParagraphs.length);

        for (let i = 0; i < maxLength; i++) {
            const original = originalParagraphs[i] || '';
            const revised = revisedParagraphs[i] || '';

            if (original && !revised) {
                // Paragraph deleted
                changes.push({
                    id: changeId++,
                    type: 'deletion',
                    paragraph_index: i,
                    original_content: original,
                    revised_content: '',
                    reason: this.inferChangeReason(original, ''),
                    significance: this.assessSignificance(original, '')
                });
            } else if (!original && revised) {
                // Paragraph added
                changes.push({
                    id: changeId++,
                    type: 'addition',
                    paragraph_index: i,
                    original_content: '',
                    revised_content: revised,
                    reason: this.inferChangeReason('', revised),
                    significance: this.assessSignificance('', revised)
                });
            } else if (original && revised && original !== revised) {
                // Paragraph modified
                const sentenceChanges = this.analyzeSentenceChanges(original, revised);
                changes.push({
                    id: changeId++,
                    type: 'modification',
                    paragraph_index: i,
                    original_content: original,
                    revised_content: revised,
                    reason: this.inferChangeReason(original, revised),
                    significance: this.assessSignificance(original, revised),
                    sentence_changes: sentenceChanges
                });
            }
        }

        return changes;
    }

    splitIntoParagraphs(text) {
        return text.split(/\n\s*\n/)
                  .map(p => p.trim())
                  .filter(p => p.length > 0);
    }

    analyzeSentenceChanges(originalParagraph, revisedParagraph) {
        const originalSentences = originalParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const revisedSentences = revisedParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const sentenceChanges = [];
        const maxSentences = Math.max(originalSentences.length, revisedSentences.length);

        for (let i = 0; i < maxSentences; i++) {
            const original = originalSentences[i]?.trim() || '';
            const revised = revisedSentences[i]?.trim() || '';

            if (original !== revised) {
                sentenceChanges.push({
                    sentence_index: i,
                    original: original,
                    revised: revised,
                    change_type: this.classifySentenceChange(original, revised)
                });
            }
        }

        return sentenceChanges;
    }

    classifySentenceChange(original, revised) {
        if (!original && revised) return 'added';
        if (original && !revised) return 'removed';

        // Check for specific types of modifications
        if (this.hasFactualChanges(original, revised)) return 'factual_update';
        if (this.hasStructuralChanges(original, revised)) return 'structural_change';
        if (this.hasClarityImprovements(original, revised)) return 'clarity_improvement';
        if (this.hasStyleImprovements(original, revised)) return 'style_improvement';

        return 'content_modification';
    }

    hasFactualChanges(original, revised) {
        // Check for changes in numbers, dates, names, etc.
        const numberPattern = /\d+/g;
        const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
        const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

        const originalNumbers = (original.match(numberPattern) || []).join(',');
        const revisedNumbers = (revised.match(numberPattern) || []).join(',');

        const originalDates = (original.match(datePattern) || []).join(',');
        const revisedDates = (revised.match(datePattern) || []).join(',');

        const originalNames = (original.match(namePattern) || []).join(',');
        const revisedNames = (revised.match(namePattern) || []).join(',');

        return originalNumbers !== revisedNumbers ||
               originalDates !== revisedDates ||
               originalNames !== revisedNames;
    }

    hasStructuralChanges(original, revised) {
        // Check for changes in sentence structure, punctuation, capitalization
        const originalStructure = original.replace(/[a-zA-Z0-9]/g, 'X');
        const revisedStructure = revised.replace(/[a-zA-Z0-9]/g, 'X');

        return originalStructure !== revisedStructure;
    }

    hasClarityImprovements(original, revised) {
        // Check for words that indicate clarity improvements
        const clarityIndicators = ['specifically', 'clearly', 'precisely', 'exactly', 'in other words', 'that is'];
        const revisedLower = revised.toLowerCase();

        return clarityIndicators.some(indicator =>
            !original.toLowerCase().includes(indicator) && revisedLower.includes(indicator)
        ) || revised.length > original.length * 1.2; // Significant expansion
    }

    hasStyleImprovements(original, revised) {
        // Check for style-related changes
        const stylePatterns = [
            { pattern: /\bvery\b/g, improvement: 'removed_weak_intensifiers' },
            { pattern: /\bthat\b/g, improvement: 'reduced_unnecessary_words' },
            { pattern: /\bwill be\b/g, improvement: 'active_voice' }
        ];

        return stylePatterns.some(({ pattern }) => {
            const originalMatches = (original.match(pattern) || []).length;
            const revisedMatches = (revised.match(pattern) || []).length;
            return revisedMatches < originalMatches;
        });
    }

    inferChangeReason(original, revised) {
        if (!original && revised) {
            if (this.containsFactualInformation(revised)) return 'Added factual information';
            if (this.containsCallToAction(revised)) return 'Added call to action';
            if (this.containsQuote(revised)) return 'Added supporting quote';
            return 'Added content for completeness';
        }

        if (original && !revised) {
            if (this.containsRedundantInformation(original)) return 'Removed redundant information';
            if (this.containsOffTopicContent(original)) return 'Removed off-topic content';
            return 'Removed unclear content';
        }

        if (original && revised) {
            if (this.hasFactualChanges(original, revised)) return 'Updated factual information';
            if (this.hasClarityImprovements(original, revised)) return 'Improved clarity and readability';
            if (this.hasStyleImprovements(original, revised)) return 'Enhanced writing style';
            if (revised.length > original.length * 1.3) return 'Expanded with additional detail';
            if (revised.length < original.length * 0.7) return 'Condensed for conciseness';
            return 'Refined content and messaging';
        }

        return 'Content adjustment';
    }

    containsFactualInformation(text) {
        const factualPatterns = [/\d+/, /\b(statistics|data|research|study)\b/i, /\b\d+%\b/];
        return factualPatterns.some(pattern => pattern.test(text));
    }

    containsCallToAction(text) {
        const ctaPatterns = [/\b(join|support|vote|contact|visit|volunteer|donate)\b/i];
        return ctaPatterns.some(pattern => pattern.test(text));
    }

    containsQuote(text) {
        return text.includes('"') && text.split('"').length > 2;
    }

    containsRedundantInformation(text) {
        // Simple check for repetitive phrases
        const words = text.toLowerCase().split(/\s+/);
        const wordCounts = {};

        for (const word of words) {
            if (word.length > 4) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        }

        return Object.values(wordCounts).some(count => count > 3);
    }

    containsOffTopicContent(text) {
        // This would need more sophisticated analysis in a real implementation
        // For now, just check for very generic phrases
        const genericPhrases = ['it is important to note', 'as we all know', 'needless to say'];
        return genericPhrases.some(phrase => text.toLowerCase().includes(phrase));
    }

    assessSignificance(original, revised) {
        if (!original && revised) {
            if (revised.length > 100) return 'high';
            if (revised.length > 50) return 'medium';
            return 'low';
        }

        if (original && !revised) {
            if (original.length > 100) return 'high';
            if (original.length > 50) return 'medium';
            return 'low';
        }

        if (original && revised) {
            const sizeDifference = Math.abs(revised.length - original.length);
            const percentChange = sizeDifference / original.length;

            if (percentChange > 0.5 || this.hasFactualChanges(original, revised)) return 'high';
            if (percentChange > 0.2) return 'medium';
            return 'low';
        }

        return 'low';
    }

    generateEditorialSummary(changes) {
        const summary = {
            total_changes: changes.length,
            change_breakdown: {},
            key_improvements: [],
            significant_changes: [],
            compliance_fixes: [],
            overall_assessment: ''
        };

        // Count changes by type
        for (const change of changes) {
            const type = change.type;
            summary.change_breakdown[type] = (summary.change_breakdown[type] || 0) + 1;
        }

        // Identify key improvements
        const highSignificanceChanges = changes.filter(c => c.significance === 'high');
        for (const change of highSignificanceChanges) {
            summary.key_improvements.push({
                description: change.reason,
                location: `Paragraph ${change.paragraph_index + 1}`,
                impact: change.significance
            });
        }

        // Identify significant changes for review
        const significantChanges = changes.filter(c =>
            c.type === 'deletion' && c.significance === 'high' ||
            c.reason.includes('factual') ||
            c.reason.includes('compliance')
        );

        for (const change of significantChanges) {
            summary.significant_changes.push({
                description: change.reason,
                original: change.original_content.substring(0, 100) + '...',
                revised: change.revised_content.substring(0, 100) + '...',
                requires_review: change.significance === 'high'
            });
        }

        // Generate overall assessment
        if (changes.length === 0) {
            summary.overall_assessment = 'No changes detected between drafts.';
        } else if (changes.length < 5) {
            summary.overall_assessment = 'Minor revisions focused on clarity and style improvements.';
        } else if (changes.length < 15) {
            summary.overall_assessment = 'Moderate revision with content additions and structural improvements.';
        } else {
            summary.overall_assessment = 'Substantial revision with significant content changes and reorganization.';
        }

        return summary;
    }

    calculateStatistics(originalText, revisedText, changes) {
        const originalWords = originalText.split(/\s+/).length;
        const revisedWords = revisedText.split(/\s+/).length;
        const wordChange = revisedWords - originalWords;
        const wordChangePercent = Math.round((wordChange / originalWords) * 100);

        const originalSentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const revisedSentences = revisedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        const changesBySignificance = {
            high: changes.filter(c => c.significance === 'high').length,
            medium: changes.filter(c => c.significance === 'medium').length,
            low: changes.filter(c => c.significance === 'low').length
        };

        return {
            word_count: {
                original: originalWords,
                revised: revisedWords,
                change: wordChange,
                change_percent: wordChangePercent
            },
            sentence_count: {
                original: originalSentences,
                revised: revisedSentences,
                change: revisedSentences - originalSentences
            },
            changes_by_significance: changesBySignificance,
            total_changes: changes.length,
            editing_intensity: this.calculateEditingIntensity(changes.length, originalWords)
        };
    }

    calculateEditingIntensity(changeCount, wordCount) {
        const intensity = (changeCount / (wordCount / 100)); // Changes per 100 words

        if (intensity < 1) return 'Light';
        if (intensity < 3) return 'Moderate';
        if (intensity < 6) return 'Heavy';
        return 'Extensive';
    }
}

module.exports = ComparisonGenerator;