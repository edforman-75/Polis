/**
 * Server-side Speech Processing Service
 * Handles all speech analysis, structure detection, and content processing
 */

class SpeechProcessor {

    // Extract metadata from raw speech content
    extractMetadata(content) {
        const metadata = {
            title: this.extractTitle(content),
            date: this.extractDate(content),
            location: this.extractLocation(content),
            speaker: this.extractSpeaker(content),
            source: this.extractSource(content),
            wordCount: this.getWordCount(content),
            duration: this.estimateDuration(content),
            readingLevel: this.analyzeReadingLevel(content),
            themes: this.extractThemes(content),
            tone: this.analyzeTone(content)
        };

        return metadata;
    }

    // Parse speech structure into sections
    parseStructure(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const sections = [];
        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const analysis = this.analyzeParagraph(line, i, lines);

            if (analysis.isNewSection) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    type: analysis.type,
                    title: analysis.title,
                    content: line,
                    wordCount: this.getWordCount(line),
                    position: i
                };
            } else if (currentSection) {
                currentSection.content += '\n' + line;
                currentSection.wordCount = this.getWordCount(currentSection.content);
            } else {
                // First section
                currentSection = {
                    type: analysis.type,
                    title: analysis.title,
                    content: line,
                    wordCount: this.getWordCount(line),
                    position: i
                };
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }

    // Analyze individual paragraph
    analyzeParagraph(text, index, allLines) {
        const trimmed = text.trim();

        // Title detection (first line, usually starts with TRANSCRIPT:)
        if (index === 0) {
            const cleanTitle = trimmed.replace(/^transcript:\s*/i, '').trim();
            return {
                type: 'title',
                title: 'Speech Title',
                isNewSection: true
            };
        }

        // Date-location detection (second line with date pattern and dash)
        if (index === 1 && /[-–—]/.test(trimmed)) {
            const parts = trimmed.split(/\s*[-–—]\s*/);
            if (parts.length === 2) {
                const datePart = parts[0].trim();
                const locationPart = parts[1].trim();

                if (this.isDatePattern(datePart)) {
                    return {
                        type: 'date-location',
                        title: 'Date & Location',
                        isNewSection: true
                    };
                }
            }
        }

        // Source detection (starts with "Source:")
        if (trimmed.toLowerCase().startsWith('source:')) {
            return {
                type: 'source',
                title: 'Source Information',
                isNewSection: true
            };
        }

        // Opening paragraph (usually first speech content)
        if (index <= 3 && this.isOpeningParagraph(trimmed)) {
            return {
                type: 'opening',
                title: 'Opening',
                isNewSection: true
            };
        }

        // Closing paragraph (contains typical closing phrases)
        if (this.isClosingParagraph(trimmed)) {
            return {
                type: 'closing',
                title: 'Closing',
                isNewSection: true
            };
        }

        // Default to body paragraph
        return {
            type: 'body',
            title: 'Body Paragraph',
            isNewSection: false
        };
    }

    // Extract title from content
    extractTitle(content) {
        if (!content) return 'Untitled Speech';

        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            let title = lines[0].replace(/^transcript:\s*/i, '').trim();
            if (title.length > 100) {
                title = title.substring(0, 97) + '...';
            }
            return title || 'Untitled Speech';
        }
        return 'Untitled Speech';
    }

    // Extract date from content
    extractDate(content) {
        const dateRegex = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i;
        const numericDateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/;

        const dateMatch = content.match(dateRegex) || content.match(numericDateRegex);
        return dateMatch ? dateMatch[0] : null;
    }

    // Extract location from content
    extractLocation(content) {
        // Look for location after dash on second line
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
            const secondLine = lines[1];
            const dashSplit = secondLine.split(/[-–—]/);
            if (dashSplit.length > 1) {
                const location = dashSplit[1].trim();
                if (location.length < 100) {
                    return location;
                }
            }
        }

        // Look for common location patterns
        const locationRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/;
        const locationMatch = content.match(locationRegex);

        return locationMatch ? locationMatch[0] : null;
    }

    // Extract speaker from content
    extractSpeaker(content) {
        // Look for speaker patterns
        const speakerPatterns = [
            /(?:speaker|remarks by|delivered by)\s*:?\s*([^,\n]+)/i,
            /^([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,|\s*-|\s*:)/m
        ];

        for (const pattern of speakerPatterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }

    // Extract source information
    extractSource(content) {
        const sourceMatch = content.match(/source:\s*(.+?)(?:\n\n|\n$|$)/is);
        return sourceMatch ? sourceMatch[1].trim() : null;
    }

    // Count words
    getWordCount(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Estimate speaking duration (average 150 words per minute)
    estimateDuration(text) {
        const wordCount = this.getWordCount(text);
        const wordsPerMinute = 150;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    // Analyze reading level (simplified Flesch formula)
    analyzeReadingLevel(text) {
        const words = this.getWordCount(text);
        const sentences = (text.match(/[.!?]+/g) || []).length || 1;
        const syllables = this.countSyllables(text);

        const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));

        if (fleschScore >= 90) return 'Very Easy';
        if (fleschScore >= 80) return 'Easy';
        if (fleschScore >= 70) return 'Fairly Easy';
        if (fleschScore >= 60) return 'Standard';
        if (fleschScore >= 50) return 'Fairly Difficult';
        if (fleschScore >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    // Extract themes from content
    extractThemes(content) {
        const themes = [];
        const themePatterns = {
            'Healthcare': /\b(health\s*care|medical|medicare|medicaid|insurance|hospital|doctor|patient)\b/gi,
            'Economy': /\b(econom|job|employment|business|market|trade|finance|budget)\b/gi,
            'Education': /\b(educat|school|student|teacher|university|college|learn)\b/gi,
            'Security': /\b(secur|defense|military|terror|safe|protect)\b/gi,
            'Environment': /\b(environment|climate|energy|green|renewable|carbon|pollution)\b/gi,
            'Immigration': /\b(immigr|border|citizen|visa|refugee)\b/gi,
            'Technology': /\b(technolog|digital|internet|cyber|innovation|ai|artificial)\b/gi,
            'Veterans': /\b(veteran|military|service|armed\s+forces|sacrifice)\b/gi,
            'Social Justice': /\b(justice|equality|rights|discrimination|fairness)\b/gi
        };

        for (const [theme, pattern] of Object.entries(themePatterns)) {
            const matches = content.match(pattern);
            if (matches && matches.length >= 2) {
                themes.push({
                    name: theme,
                    frequency: matches.length,
                    confidence: Math.min(matches.length * 0.1, 1)
                });
            }
        }

        return themes.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
    }

    // Analyze tone
    analyzeTone(content) {
        const toneIndicators = {
            assertive: /\b(will|must|shall|determined|commit|promise|ensure)\b/gi,
            inspirational: /\b(inspire|hope|dream|believe|achieve|together|future|possible)\b/gi,
            urgent: /\b(urgent|crisis|immediately|now|today|cannot\s+wait|time\s+is)\b/gi,
            empathetic: /\b(understand|feel|share|compassion|sympathy|concern)\b/gi,
            confident: /\b(confident|certain|sure|know|proven|successful)\b/gi
        };

        const scores = {};
        let totalWords = this.getWordCount(content);

        for (const [tone, pattern] of Object.entries(toneIndicators)) {
            const matches = content.match(pattern) || [];
            scores[tone] = (matches.length / totalWords) * 100;
        }

        const dominantTone = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0];

        return {
            primary: dominantTone ? dominantTone[0] : 'neutral',
            scores
        };
    }

    // Helper methods
    isDatePattern(text) {
        const datePatterns = [
            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i,
            /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
            /\b\d{4}-\d{2}-\d{2}\b/
        ];

        return datePatterns.some(pattern => pattern.test(text));
    }

    isOpeningParagraph(text) {
        const openingPhrases = [
            /^(my\s+fellow|fellow|thank\s+you|ladies\s+and\s+gentlemen|good\s+morning|good\s+afternoon|good\s+evening)/i,
            /^(it'?s\s+(?:an\s+)?honor|i'?m\s+honored|i'?m\s+pleased|i'?m\s+grateful)/i
        ];

        return openingPhrases.some(pattern => pattern.test(text));
    }

    isClosingParagraph(text) {
        const closingPhrases = [
            /\b(thank\s+you|god\s+bless|in\s+conclusion|finally|let\s+me\s+close)/i,
            /\b(together\s+we\s+can|together\s+we\s+will|the\s+future|our\s+nation|our\s+country)/i
        ];

        return closingPhrases.some(pattern => pattern.test(text));
    }

    countSyllables(text) {
        // Simplified syllable counting
        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        return words.reduce((count, word) => {
            const syllableCount = word.match(/[aeiouy]+/g);
            return count + (syllableCount ? syllableCount.length : 1);
        }, 0);
    }

    // Generate export formats
    generateExports(speech, format) {
        switch (format.toLowerCase()) {
            case 'teleprompter':
                return this.generateTeleprompterFormat(speech.content);
            case 'pdf':
                return this.generatePDFFormat(speech);
            case 'docx':
                return this.generateDocxFormat(speech);
            case 'text':
                return this.generatePlainText(speech.content);
            default:
                return speech.content;
        }
    }

    generateTeleprompterFormat(content) {
        // Clean content for teleprompter (large font, clean paragraphs)
        return content
            .replace(/^source:.*$/gmi, '') // Remove source lines
            .replace(/^transcript:\s*/gmi, '') // Remove transcript prefix
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())
            .join('\n\n'); // Double spacing for readability
    }

    generatePlainText(content) {
        return content.replace(/^transcript:\s*/gmi, '').trim();
    }

    generatePDFFormat(speech) {
        // Return structured data for PDF generation
        return {
            title: speech.metadata?.title || 'Speech',
            date: speech.metadata?.date,
            location: speech.metadata?.location,
            content: this.generatePlainText(speech.content),
            wordCount: speech.metadata?.wordCount,
            duration: speech.metadata?.duration
        };
    }

    generateDocxFormat(speech) {
        // Return structured data for DOCX generation
        return {
            title: speech.metadata?.title || 'Speech',
            metadata: speech.metadata,
            sections: this.parseStructure(speech.content)
        };
    }
}

module.exports = new SpeechProcessor();