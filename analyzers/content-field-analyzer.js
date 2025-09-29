class ContentFieldAnalyzer {
    constructor() {
        this.fieldPatterns = {
            headline: {
                patterns: [
                    /^([A-Z][^\.!?]*?)(?=\n)/m,
                    /^(.{10,100})(?=\n\n)/m,
                    /(?:^|\n)([A-Z][A-Z\s]{5,}[A-Z])(?=\n)/m
                ],
                description: 'Main headline or title',
                required: true,
                maxLength: 100
            },
            subhead: {
                patterns: [
                    /(?:headline|title).*?\n\n?(.{20,200})(?=\n\n)/si,
                    /^.+?\n\n?(.{20,150})(?=\n\n)/sm,
                    /(?:^|\n)(.{25,120})(?=\n\n[A-Z])/m
                ],
                description: 'Secondary headline or subtitle',
                required: false,
                maxLength: 200
            },
            assignment_type: {
                patterns: [
                    /(?:press release|news release|statement|announcement|advisory)/i,
                    /(?:FOR IMMEDIATE RELEASE|IMMEDIATE RELEASE)/i,
                    /(?:PRESS STATEMENT|MEDIA ADVISORY)/i
                ],
                description: 'Type of press assignment',
                required: true,
                options: ['Press Release', 'Statement', 'Media Advisory', 'Announcement']
            },
            assignment_subtype: {
                patterns: [
                    /(?:policy|endorsement|campaign|event|response|reaction)/i,
                    /(?:announcement|launch|victory|defeat|support)/i
                ],
                description: 'Subtype or category',
                required: false,
                options: ['Policy', 'Endorsement', 'Campaign Event', 'Response', 'Announcement', 'Other']
            },
            date: {
                patterns: [
                    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
                    /\d{1,2}\/\d{1,2}\/\d{2,4}/,
                    /\d{4}-\d{2}-\d{2}/,
                    /(?:FOR IMMEDIATE RELEASE|RELEASE:)\s*([A-Za-z]+ \d{1,2}, \d{4})/i
                ],
                description: 'Release date',
                required: true,
                format: 'MM/DD/YYYY or Month DD, YYYY'
            },
            location: {
                patterns: [
                    /([A-Z][A-Za-z\s]+(?:,\s*[A-Z]{2})?)\s*[-–—]\s*/,
                    /(?:^|\n)([A-Z][A-Za-z\s]+,\s*[A-Z]{2})\s*[-–—]/m,
                    /\(([A-Z][A-Za-z\s]+(?:,\s*[A-Z]{2})?)\)/
                ],
                description: 'Geographic location',
                required: false,
                format: 'City, ST'
            },
            opening_paragraph: {
                patterns: [
                    /(?:(?:[A-Z][A-Z\s]*[A-Z]|.{10,100})\s*[-–—]\s*)(.{50,300})(?=\n\n)/s,
                    /^(?:[^\n]*\n){0,5}([A-Z][^\.]*?[\.!?](?:\s+[A-Z][^\.]*?[\.!?]){1,3})/m
                ],
                description: 'Opening paragraph with key message',
                required: true,
                minLength: 50,
                maxLength: 300
            },
            body_text: {
                patterns: [
                    /(?:opening.*?\n\n)(.{200,})(?=\n\n(?:"|\w+\s+said|Contact|###))/is,
                    /^(?:[^\n]*\n){3,}(.{200,})(?=\n\n)/sm
                ],
                description: 'Main body content',
                required: true,
                minLength: 200
            },
            candidate_quote: {
                patterns: [
                    /"([^"]{20,500})"/g,
                    /(?:said|stated|commented|declared)[^"]*"([^"]{20,500})"/gi,
                    /(["""][^"""]{20,500}["""])/g
                ],
                description: 'Direct quotes from the candidate',
                required: false,
                minLength: 20,
                maxLength: 500
            },
            other_quotes: {
                patterns: [
                    /"([^"]{15,400})"/g,
                    /(["""][^"""]{15,400}["""])/g
                ],
                description: 'Quotes from other sources',
                required: false,
                minLength: 15,
                maxLength: 400
            },
            boilerplate: {
                patterns: [
                    /(?:###|About|Background).*?([A-Z][^\.]*(?:campaign|candidate|election)[^\.]*\.(?:\s+[A-Z][^\.]*\.){0,3})/is,
                    /(?:\n\n)([A-Z][^\.]*(?:served|represents|elected)[^\.]*\.(?:\s+[A-Z][^\.]*\.){0,2})(?:\s*\n)/m
                ],
                description: 'Standard candidate/campaign description',
                required: false,
                minLength: 50
            },
            media_contact: {
                patterns: [
                    /(?:Contact|Media|Press)(?:\s*Contact)?:?\s*([A-Za-z\s]+)(?:\n|\s{2,})([^\n]*(?:phone|cell|\d{3}[-\.\s]\d{3}[-\.\s]\d{4})[^\n]*)/i,
                    /([A-Za-z\s]+)\n([^\n]*\d{3}[-\.\s]\d{3}[-\.\s]\d{4}[^\n]*)/,
                    /([A-Za-z\s]+)\n([^\n]*@[^\n\s]+)/
                ],
                description: 'Media contact information',
                required: true,
                format: 'Name, phone, email'
            },
            paid_for_by: {
                patterns: [
                    /paid for by ([^\.]+)/i,
                    /authorized by ([^\.]+)/i,
                    /sponsored by ([^\.]+)/i
                ],
                description: 'Legal disclaimer',
                required: true,
                format: 'Paid for by [Organization Name]'
            }
        };
    }

    analyze(text) {
        const extractedFields = {};
        const fieldStatuses = {};
        const recommendations = [];
        let totalScore = 0;
        let maxScore = 0;

        // Analyze each field
        Object.entries(this.fieldPatterns).forEach(([fieldName, fieldConfig]) => {
            const result = this.extractField(text, fieldName, fieldConfig);
            extractedFields[fieldName] = result;

            // Calculate field status
            const status = this.evaluateFieldStatus(result, fieldConfig);
            fieldStatuses[fieldName] = status;

            // Add to scoring
            if (fieldConfig.required) {
                maxScore += 10;
                if (status.present) {
                    totalScore += status.quality === 'good' ? 10 : status.quality === 'warning' ? 7 : 4;
                }
            } else {
                maxScore += 5;
                if (status.present) {
                    totalScore += status.quality === 'good' ? 5 : status.quality === 'warning' ? 3 : 2;
                }
            }

            // Generate recommendations
            if (status.issues.length > 0) {
                recommendations.push({
                    field: fieldName,
                    priority: fieldConfig.required ? 'high' : 'medium',
                    issues: status.issues,
                    suggestions: status.suggestions
                });
            }
        });

        // Overall assessment
        const overallScore = Math.round((totalScore / maxScore) * 100);
        const completeness = this.calculateCompleteness(fieldStatuses);

        return {
            overall_score: overallScore,
            completeness_score: completeness,
            extracted_fields: extractedFields,
            field_statuses: fieldStatuses,
            recommendations,
            missing_required_fields: this.getMissingRequiredFields(fieldStatuses),
            field_summary: this.generateFieldSummary(fieldStatuses),
            formatting_issues: this.checkFormattingIssues(extractedFields),
            suggested_improvements: this.generateSuggestedImprovements(fieldStatuses, extractedFields)
        };
    }

    extractField(text, fieldName, fieldConfig) {
        const results = [];

        fieldConfig.patterns.forEach(pattern => {
            if (pattern.global) {
                const matches = [...text.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1] && match[1].trim()) {
                        results.push({
                            text: match[1].trim(),
                            confidence: this.calculateConfidence(match[1], fieldConfig),
                            position: match.index
                        });
                    }
                });
            } else {
                const match = text.match(pattern);
                if (match && match[1] && match[1].trim()) {
                    results.push({
                        text: match[1].trim(),
                        confidence: this.calculateConfidence(match[1], fieldConfig),
                        position: match.index
                    });
                }
            }
        });

        // Deduplicate and sort by confidence
        const uniqueResults = this.deduplicateResults(results);
        return uniqueResults.sort((a, b) => b.confidence - a.confidence);
    }

    calculateConfidence(text, fieldConfig) {
        let confidence = 0.7;

        // Length checks
        if (fieldConfig.minLength && text.length < fieldConfig.minLength) {
            confidence -= 0.3;
        }
        if (fieldConfig.maxLength && text.length > fieldConfig.maxLength) {
            confidence -= 0.2;
        }

        // Format checks
        if (fieldConfig.format) {
            if (fieldConfig.format.includes('MM/DD/YYYY') && !/\d{1,2}\/\d{1,2}\/\d{4}/.test(text)) {
                confidence -= 0.2;
            }
            if (fieldConfig.format.includes('phone') && !/\d{3}[-\.\s]\d{3}[-\.\s]\d{4}/.test(text)) {
                confidence -= 0.2;
            }
        }

        return Math.max(0.1, Math.min(1.0, confidence));
    }

    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const normalized = result.text.toLowerCase().replace(/\s+/g, ' ').trim();
            if (seen.has(normalized)) {
                return false;
            }
            seen.add(normalized);
            return true;
        });
    }

    evaluateFieldStatus(results, fieldConfig) {
        const status = {
            present: results.length > 0,
            quality: 'missing',
            issues: [],
            suggestions: []
        };

        if (results.length === 0) {
            if (fieldConfig.required) {
                status.issues.push(`Missing required field: ${fieldConfig.description}`);
                status.suggestions.push(`Add ${fieldConfig.description.toLowerCase()}`);
            }
            return status;
        }

        const bestResult = results[0];
        status.present = true;

        // Quality assessment
        if (bestResult.confidence >= 0.8) {
            status.quality = 'good';
        } else if (bestResult.confidence >= 0.6) {
            status.quality = 'warning';
            status.issues.push(`Low confidence extraction for ${fieldConfig.description}`);
        } else {
            status.quality = 'error';
            status.issues.push(`Poor quality match for ${fieldConfig.description}`);
        }

        // Length validation
        if (fieldConfig.minLength && bestResult.text.length < fieldConfig.minLength) {
            status.quality = 'warning';
            status.issues.push(`${fieldConfig.description} too short (${bestResult.text.length} chars, min ${fieldConfig.minLength})`);
            status.suggestions.push(`Expand ${fieldConfig.description.toLowerCase()} to at least ${fieldConfig.minLength} characters`);
        }

        if (fieldConfig.maxLength && bestResult.text.length > fieldConfig.maxLength) {
            status.quality = 'warning';
            status.issues.push(`${fieldConfig.description} too long (${bestResult.text.length} chars, max ${fieldConfig.maxLength})`);
            status.suggestions.push(`Shorten ${fieldConfig.description.toLowerCase()} to under ${fieldConfig.maxLength} characters`);
        }

        return status;
    }

    calculateCompleteness(fieldStatuses) {
        const totalFields = Object.keys(fieldStatuses).length;
        const presentFields = Object.values(fieldStatuses).filter(status => status.present).length;
        return Math.round((presentFields / totalFields) * 100);
    }

    getMissingRequiredFields(fieldStatuses) {
        return Object.entries(fieldStatuses)
            .filter(([fieldName, status]) => this.fieldPatterns[fieldName].required && !status.present)
            .map(([fieldName, status]) => ({
                field: fieldName,
                description: this.fieldPatterns[fieldName].description,
                suggestion: `Add ${this.fieldPatterns[fieldName].description.toLowerCase()}`
            }));
    }

    generateFieldSummary(fieldStatuses) {
        const summary = { present: 0, missing: 0, warning: 0, error: 0 };

        Object.values(fieldStatuses).forEach(status => {
            if (!status.present) {
                summary.missing++;
            } else if (status.quality === 'good') {
                summary.present++;
            } else if (status.quality === 'warning') {
                summary.warning++;
            } else {
                summary.error++;
            }
        });

        return summary;
    }

    checkFormattingIssues(extractedFields) {
        const issues = [];

        // Check date formatting
        if (extractedFields.date && extractedFields.date.length > 0) {
            const dateText = extractedFields.date[0].text;
            if (!/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/.test(dateText)) {
                issues.push({
                    field: 'date',
                    issue: 'Date not in preferred format',
                    suggestion: 'Use format: Month DD, YYYY (e.g., January 15, 2024)'
                });
            }
        }

        // Check headline capitalization
        if (extractedFields.headline && extractedFields.headline.length > 0) {
            const headline = extractedFields.headline[0].text;
            if (headline !== headline.toUpperCase() && !/^[A-Z][^A-Z]*$/.test(headline)) {
                issues.push({
                    field: 'headline',
                    issue: 'Inconsistent headline capitalization',
                    suggestion: 'Use title case or all caps for headlines'
                });
            }
        }

        return issues;
    }

    generateSuggestedImprovements(fieldStatuses, extractedFields) {
        const improvements = [];

        // Missing critical fields
        const missingCritical = ['headline', 'date', 'media_contact', 'paid_for_by']
            .filter(field => !fieldStatuses[field]?.present);

        if (missingCritical.length > 0) {
            improvements.push({
                priority: 'critical',
                type: 'missing_fields',
                description: `Add required fields: ${missingCritical.join(', ')}`,
                fields: missingCritical
            });
        }

        // Weak extractions
        const weakFields = Object.entries(fieldStatuses)
            .filter(([field, status]) => status.present && status.quality !== 'good')
            .map(([field, status]) => field);

        if (weakFields.length > 0) {
            improvements.push({
                priority: 'medium',
                type: 'quality_improvement',
                description: `Improve formatting and clarity for: ${weakFields.join(', ')}`,
                fields: weakFields
            });
        }

        // Enhancement opportunities
        const enhanceableFields = ['subhead', 'candidate_quote', 'boilerplate']
            .filter(field => !fieldStatuses[field]?.present);

        if (enhanceableFields.length > 0) {
            improvements.push({
                priority: 'low',
                type: 'enhancement',
                description: `Consider adding: ${enhanceableFields.join(', ')}`,
                fields: enhanceableFields
            });
        }

        return improvements;
    }
}

module.exports = ContentFieldAnalyzer;