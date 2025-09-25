/**
 * Opposition Research Processor
 */

class OppositionResearchProcessor {
    process(data, existing = null) {
        return {
            ...data,
            tags: this.extractTags(data.content),
            metadata: {
                ...data.metadata,
                credibilityScore: this.assessCredibility(data.sources || ''),
                riskLevel: this.assessRisk(data.content, data.sensitivity_level),
                researchDepth: this.analyzeDepth(data.content)
            },
            processedAt: new Date().toISOString()
        };
    }

    extractTags(content) {
        const tags = [];
        const patterns = {
            'financial': /\b(money|financial|funding|donation|tax)\b/gi,
            'voting': /\b(vote|voting|bill|legislation|position)\b/gi,
            'personal': /\b(family|personal|private|background)\b/gi,
            'business': /\b(business|company|corporation|work)\b/gi,
            'public': /\b(statement|speech|public|quote)\b/gi
        };

        for (const [tag, pattern] of Object.entries(patterns)) {
            if (pattern.test(content)) tags.push(tag);
        }

        return tags;
    }

    assessCredibility(sources) {
        if (!sources) return 'unverified';
        const sourceCount = sources.split(',').length;
        if (sourceCount >= 3) return 'high';
        if (sourceCount === 2) return 'medium';
        return 'low';
    }

    assessRisk(content, sensitivityLevel) {
        if (sensitivityLevel === 'confidential') return 'high';
        if (/allegation|controversial|scandal/i.test(content)) return 'high';
        if (/public record|official/i.test(content)) return 'low';
        return 'medium';
    }

    analyzeDepth(content) {
        const wordCount = content.trim().split(/\s+/).length;
        if (wordCount > 500) return 'comprehensive';
        if (wordCount > 200) return 'detailed';
        return 'basic';
    }
}

module.exports = new OppositionResearchProcessor();