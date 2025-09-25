/**
 * Campaign Materials Processor
 */

class CampaignMaterialsProcessor {
    process(data, existing = null) {
        return {
            ...data,
            metadata: {
                ...data.metadata,
                materialCategory: this.categorizeType(data.type),
                designComplexity: this.analyzeDesignComplexity(data.design_notes || ''),
                audienceReach: this.estimateReach(data.target_audience || '')
            },
            processedAt: new Date().toISOString()
        };
    }

    categorizeType(type) {
        const categories = {
            'flyer': 'print',
            'brochure': 'print',
            'poster': 'print',
            'banner': 'display',
            'digital': 'online',
            'video': 'media'
        };
        return categories[type.toLowerCase()] || 'print';
    }

    analyzeDesignComplexity(notes) {
        if (/complex|detailed|multi/i.test(notes)) return 'high';
        if (/simple|basic/i.test(notes)) return 'low';
        return 'medium';
    }

    estimateReach(audience) {
        if (/broad|general|all/i.test(audience)) return 'broad';
        if (/specific|targeted|niche/i.test(audience)) return 'targeted';
        return 'medium';
    }
}

module.exports = new CampaignMaterialsProcessor();