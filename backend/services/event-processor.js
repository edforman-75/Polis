/**
 * Event Content Processor
 */

class EventProcessor {
    process(data, existing = null) {
        return {
            ...data,
            metadata: {
                ...data.metadata,
                eventCategory: this.categorizeEvent(data.event_type),
                preparation: this.analyzePreparation(data.description || ''),
                logistics: this.extractLogistics(data.logistics || '')
            },
            processedAt: new Date().toISOString()
        };
    }

    categorizeEvent(type) {
        const categories = {
            'rally': 'public',
            'townhall': 'public',
            'fundraiser': 'private',
            'debate': 'media',
            'press': 'media',
            'meeting': 'internal'
        };
        return categories[type.toLowerCase()] || 'general';
    }

    analyzePreparation(description) {
        const prepItems = [];
        if (/speech|remarks/i.test(description)) prepItems.push('prepared_remarks');
        if (/q&a|questions/i.test(description)) prepItems.push('qa_prep');
        if (/media/i.test(description)) prepItems.push('media_training');
        return prepItems;
    }

    extractLogistics(logistics) {
        return {
            hasAV: /audio|video|mic|screen/i.test(logistics),
            hasSeating: /chair|seat|table/i.test(logistics),
            hasTransport: /transport|car|flight/i.test(logistics)
        };
    }
}

module.exports = new EventProcessor();