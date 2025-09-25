/**
 * Press Release Processor
 */

class PressReleaseProcessor {
    process(data, existing = null) {
        return {
            ...data,
            wordCount: this.getWordCount(data.content),
            metadata: {
                ...data.metadata,
                urgency: this.analyzeUrgency(data.content),
                mediaAppeal: this.analyzeMediaAppeal(data.content)
            },
            processedAt: new Date().toISOString()
        };
    }

    analyzeUrgency(content) {
        const urgentWords = /\b(urgent|immediate|breaking|crisis|emergency)\b/gi;
        return urgentWords.test(content) ? 'high' : 'standard';
    }

    analyzeMediaAppeal(content) {
        const appealWords = /\b(exclusive|first|announces|launches|reveals)\b/gi;
        return appealWords.test(content) ? 'high' : 'standard';
    }

    getWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

module.exports = new PressReleaseProcessor();