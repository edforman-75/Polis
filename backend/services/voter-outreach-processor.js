/**
 * Voter Outreach Processor
 */

class VoterOutreachProcessor {
    process(data, existing = null) {
        return {
            ...data,
            metadata: {
                ...data.metadata,
                demographics: this.analyzeDemographics(data.target_demographics || ''),
                channelEffectiveness: this.analyzeChannels(data.channels || ''),
                messagingTone: this.analyzeTone(data.message)
            },
            processedAt: new Date().toISOString()
        };
    }

    analyzeDemographics(demographics) {
        const analysis = {
            ageGroups: [],
            interests: [],
            locations: []
        };

        // Age groups
        if (/young|youth|18-30/i.test(demographics)) analysis.ageGroups.push('young');
        if (/middle|30-60/i.test(demographics)) analysis.ageGroups.push('middle');
        if (/senior|elderly|60\+/i.test(demographics)) analysis.ageGroups.push('senior');

        // Interests
        if (/healthcare|health/i.test(demographics)) analysis.interests.push('healthcare');
        if (/education|school/i.test(demographics)) analysis.interests.push('education');
        if (/economy|job|work/i.test(demographics)) analysis.interests.push('economy');

        return analysis;
    }

    analyzeChannels(channels) {
        const effectiveness = {};
        const channelList = channels.toLowerCase().split(',').map(c => c.trim());

        channelList.forEach(channel => {
            if (channel.includes('digital') || channel.includes('social')) {
                effectiveness[channel] = 'high';
            } else if (channel.includes('mail') || channel.includes('phone')) {
                effectiveness[channel] = 'medium';
            } else {
                effectiveness[channel] = 'standard';
            }
        });

        return effectiveness;
    }

    analyzeTone(message) {
        if (/urgent|act now|don't wait/i.test(message)) return 'urgent';
        if (/hope|together|future/i.test(message)) return 'inspirational';
        if (/facts|data|proven/i.test(message)) return 'factual';
        return 'neutral';
    }
}

module.exports = new VoterOutreachProcessor();