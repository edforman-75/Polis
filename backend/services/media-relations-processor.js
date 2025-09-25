/**
 * Media Relations Processor
 */

class MediaRelationsProcessor {
    process(data, existing = null) {
        return {
            ...data,
            metadata: {
                ...data.metadata,
                outletType: this.categorizeOutlet(data.outlet_name),
                contactPriority: this.assessContactPriority(data),
                relationshipStrength: this.assessRelationshipStrength(data.relationship_notes || '')
            },
            processedAt: new Date().toISOString()
        };
    }

    categorizeOutlet(outletName) {
        const name = outletName.toLowerCase();

        if (name.includes('times') || name.includes('post') || name.includes('journal')) {
            return 'newspaper';
        }
        if (name.includes('tv') || name.includes('channel') || name.includes('news')) {
            return 'television';
        }
        if (name.includes('radio') || name.includes('fm') || name.includes('am')) {
            return 'radio';
        }
        if (name.includes('blog') || name.includes('.com') || name.includes('online')) {
            return 'digital';
        }

        return 'print';
    }

    assessContactPriority(data) {
        let score = 0;

        // Base priority level
        if (data.priority_level === 'high') score += 3;
        else if (data.priority_level === 'medium') score += 2;
        else score += 1;

        // Recent contact bonus
        if (data.last_contact) {
            const daysSince = (Date.now() - new Date(data.last_contact)) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) score += 2;
            else if (daysSince < 90) score += 1;
        }

        // Beat relevance
        if (data.beat && /politic|government|campaign/i.test(data.beat)) score += 2;

        return score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low';
    }

    assessRelationshipStrength(notes) {
        if (!notes) return 'new';

        if (/strong|excellent|positive|responsive/i.test(notes)) return 'strong';
        if (/neutral|professional|standard/i.test(notes)) return 'neutral';
        if (/difficult|hostile|negative|unresponsive/i.test(notes)) return 'challenging';

        return 'developing';
    }
}

module.exports = new MediaRelationsProcessor();