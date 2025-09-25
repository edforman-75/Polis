/**
 * Policy Document Processor
 * Handles processing of policy documents
 */

class PolicyProcessor {
    process(data, existing = null) {
        // Extract key points from content
        const keyPoints = this.extractKeyPoints(data.content);

        // Analyze policy type
        const policyType = this.analyzePolicyType(data.content, data.type);

        // Generate summary
        const summary = this.generateSummary(data.content);

        return {
            ...data,
            summary,
            key_points: keyPoints,
            wordCount: this.getWordCount(data.content),
            metadata: {
                ...data.metadata,
                policyType,
                complexity: this.analyzeComplexity(data.content),
                stakeholders: this.identifyStakeholders(data.content)
            },
            processedAt: new Date().toISOString()
        };
    }

    extractKeyPoints(content) {
        // Simple extraction of bullet points or numbered lists
        const bulletPoints = content.match(/^[\s]*[•\-\*]\s+(.+)$/gm) || [];
        const numberedPoints = content.match(/^[\s]*\d+\.\s+(.+)$/gm) || [];

        return [...bulletPoints, ...numberedPoints]
            .map(point => point.replace(/^[\s]*[•\-\*\d\.]\s+/, '').trim())
            .slice(0, 10); // Limit to 10 key points
    }

    analyzePolicyType(content, providedType) {
        const types = {
            'healthcare': /\b(health|medical|medicare|medicaid|insurance|hospital)\b/gi,
            'economic': /\b(economy|economic|budget|tax|finance|trade)\b/gi,
            'education': /\b(education|school|student|teacher|university)\b/gi,
            'environment': /\b(environment|climate|energy|green|carbon)\b/gi,
            'foreign': /\b(foreign|international|diplomatic|treaty)\b/gi
        };

        if (providedType) return providedType;

        for (const [type, pattern] of Object.entries(types)) {
            if (pattern.test(content)) return type;
        }

        return 'general';
    }

    generateSummary(content) {
        // Simple summary generation - first paragraph or first 200 words
        const sentences = content.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length > 0) {
            const summary = sentences.slice(0, 2).join('. ').trim();
            return summary.length > 200 ? summary.substring(0, 197) + '...' : summary + '.';
        }
        return content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }

    analyzeComplexity(content) {
        const words = this.getWordCount(content);
        const avgWordsPerSentence = words / (content.split(/[.!?]+/).length || 1);

        if (avgWordsPerSentence > 25) return 'high';
        if (avgWordsPerSentence > 15) return 'medium';
        return 'low';
    }

    identifyStakeholders(content) {
        const stakeholders = [];
        const patterns = {
            'citizens': /\b(citizen|public|people|individual|family)\b/gi,
            'business': /\b(business|company|corporation|industry|employer)\b/gi,
            'government': /\b(government|federal|state|local|agency)\b/gi,
            'healthcare': /\b(patient|doctor|hospital|provider)\b/gi,
            'education': /\b(student|teacher|parent|school)\b/gi
        };

        for (const [stakeholder, pattern] of Object.entries(patterns)) {
            if (pattern.test(content)) {
                stakeholders.push(stakeholder);
            }
        }

        return stakeholders;
    }

    getWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

module.exports = new PolicyProcessor();