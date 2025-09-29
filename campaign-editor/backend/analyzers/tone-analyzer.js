class ToneAnalyzer {
    constructor(campaignProfile = null) {
        this.campaignProfile = campaignProfile;
        this.toneCategories = {
            professional: {
                name: 'Professional Tone',
                description: 'Formal, authoritative, and credible language',
                weight: 0.25,
                keywords: [
                    'announce', 'statement', 'position', 'policy', 'official', 'formal',
                    'administration', 'government', 'legislation', 'commitment', 'dedicated',
                    'responsible', 'accountability', 'transparency', 'integrity'
                ],
                anti_keywords: ['maybe', 'kinda', 'sorta', 'dunno', 'whatever', 'awesome', 'cool']
            },
            confident: {
                name: 'Confident Tone',
                description: 'Strong, decisive, and assertive language',
                weight: 0.2,
                keywords: [
                    'will', 'shall', 'committed', 'determined', 'strong', 'decisive',
                    'confident', 'certain', 'guarantee', 'ensure', 'deliver', 'achieve',
                    'accomplish', 'succeed', 'lead', 'champion', 'fight'
                ],
                anti_keywords: ['might', 'perhaps', 'possibly', 'uncertain', 'unsure', 'hesitant']
            },
            optimistic: {
                name: 'Optimistic Tone',
                description: 'Positive, hopeful, and forward-looking language',
                weight: 0.15,
                keywords: [
                    'opportunity', 'progress', 'growth', 'future', 'hope', 'bright',
                    'positive', 'improve', 'better', 'success', 'prosperity', 'advance',
                    'innovation', 'potential', 'promising', 'vision', 'dream'
                ],
                anti_keywords: ['decline', 'failure', 'hopeless', 'impossible', 'doomed']
            },
            empathetic: {
                name: 'Empathetic Tone',
                description: 'Understanding, compassionate, and relatable language',
                weight: 0.15,
                keywords: [
                    'understand', 'listen', 'hear', 'feel', 'care', 'compassion',
                    'concern', 'support', 'help', 'together', 'community', 'family',
                    'struggle', 'challenge', 'difficult', 'hardship', 'share'
                ],
                anti_keywords: ['indifferent', 'callous', 'ignore', 'dismiss']
            },
            urgent: {
                name: 'Urgent Tone',
                description: 'Immediate, pressing, and action-oriented language',
                weight: 0.1,
                keywords: [
                    'now', 'immediately', 'urgent', 'critical', 'essential', 'must',
                    'crisis', 'emergency', 'act', 'action', 'time', 'deadline',
                    'cannot wait', 'crucial', 'vital', 'pressing'
                ],
                anti_keywords: ['later', 'eventually', 'someday', 'casual']
            },
            inclusive: {
                name: 'Inclusive Tone',
                description: 'Welcoming, diverse, and representative language',
                weight: 0.15,
                keywords: [
                    'all', 'everyone', 'every', 'together', 'unite', 'inclusive',
                    'diverse', 'community', 'equal', 'fair', 'justice', 'opportunity',
                    'represent', 'voice', 'heard', 'belong', 'welcome'
                ],
                anti_keywords: ['exclusive', 'elite', 'only', 'separate', 'divide']
            }
        };

        this.sentimentIndicators = {
            positive: [
                'excellent', 'outstanding', 'remarkable', 'exceptional', 'successful',
                'effective', 'strong', 'powerful', 'impressive', 'significant',
                'important', 'valuable', 'beneficial', 'advantageous', 'productive'
            ],
            negative: [
                'terrible', 'awful', 'horrible', 'disastrous', 'failed', 'weak',
                'ineffective', 'poor', 'disappointing', 'concerning', 'problematic',
                'dangerous', 'harmful', 'detrimental', 'destructive'
            ],
            neutral: [
                'standard', 'typical', 'regular', 'normal', 'average', 'ordinary',
                'conventional', 'traditional', 'usual', 'common', 'general'
            ]
        };

        this.emotionalLanguage = {
            anger: ['outraged', 'furious', 'angry', 'frustrated', 'disgusted', 'appalled'],
            fear: ['worried', 'concerned', 'anxious', 'afraid', 'scared', 'terrified'],
            joy: ['excited', 'thrilled', 'delighted', 'pleased', 'happy', 'joyful'],
            sadness: ['disappointed', 'saddened', 'heartbroken', 'devastated', 'tragic'],
            surprise: ['shocked', 'amazed', 'stunned', 'astonished', 'incredible'],
            trust: ['confident', 'reliable', 'trustworthy', 'dependable', 'faithful']
        };

        this.setupCampaignToneSettings();
    }

    analyze(text) {
        const toneScores = this.analyzeTones(text);
        const sentimentAnalysis = this.analyzeSentiment(text);
        const emotionalAnalysis = this.analyzeEmotionalLanguage(text);
        const consistencyAnalysis = this.analyzeConsistency(text);
        const formalityAnalysis = this.analyzeFormality(text);

        const overallTone = this.calculateOverallTone(toneScores);
        const recommendations = this.generateToneRecommendations(toneScores, sentimentAnalysis, consistencyAnalysis);

        const compatibilityScore = {
            score: overallTone.overall_score,
            grade: this.getGradeFromScore(overallTone.overall_score)
        };

        return {
            overall_tone: overallTone,
            overall_score: compatibilityScore,
            tone_scores: toneScores,
            sentiment_analysis: sentimentAnalysis,
            emotional_analysis: emotionalAnalysis,
            consistency_analysis: consistencyAnalysis,
            formality_analysis: formalityAnalysis,
            recommendations: recommendations,
            tone_summary: this.generateToneSummary(toneScores, sentimentAnalysis)
        };
    }

    analyzeTones(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const wordCount = words.length;
        const toneScores = {};

        for (const [toneKey, toneConfig] of Object.entries(this.toneCategories)) {
            let score = 0;
            let positiveMatches = 0;
            let negativeMatches = 0;

            // Count positive tone indicators
            for (const keyword of toneConfig.keywords) {
                const matches = words.filter(word => word === keyword || word.includes(keyword)).length;
                positiveMatches += matches;
            }

            // Count negative tone indicators (anti-keywords)
            if (toneConfig.anti_keywords) {
                for (const antiKeyword of toneConfig.anti_keywords) {
                    const matches = words.filter(word => word === antiKeyword || word.includes(antiKeyword)).length;
                    negativeMatches += matches;
                }
            }

            // Calculate score (0-1 range)
            const positiveRatio = positiveMatches / (wordCount / 100); // per 100 words
            const negativeRatio = negativeMatches / (wordCount / 100); // per 100 words

            score = Math.max(0, Math.min(1, (positiveRatio * 0.1) - (negativeRatio * 0.05)));

            toneScores[toneKey] = {
                score: score,
                positive_matches: positiveMatches,
                negative_matches: negativeMatches,
                strength: this.getToneStrength(score),
                examples: this.findToneExamples(text, toneConfig.keywords)
            };
        }

        return toneScores;
    }

    analyzeSentiment(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const wordCount = words.length;

        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;

        for (const word of words) {
            if (this.sentimentIndicators.positive.some(pos => word.includes(pos))) {
                positiveCount++;
            } else if (this.sentimentIndicators.negative.some(neg => word.includes(neg))) {
                negativeCount++;
            } else if (this.sentimentIndicators.neutral.some(neu => word.includes(neu))) {
                neutralCount++;
            }
        }

        const totalSentimentWords = positiveCount + negativeCount + neutralCount;
        const sentimentScore = totalSentimentWords > 0 ?
            (positiveCount - negativeCount) / totalSentimentWords : 0;

        return {
            sentiment_score: sentimentScore,
            sentiment_label: this.getSentimentLabel(sentimentScore),
            positive_words: positiveCount,
            negative_words: negativeCount,
            neutral_words: neutralCount,
            sentiment_density: (totalSentimentWords / wordCount) * 100
        };
    }

    analyzeEmotionalLanguage(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const emotions = {};
        let totalEmotionalWords = 0;

        for (const [emotion, emotionWords] of Object.entries(this.emotionalLanguage)) {
            const matches = words.filter(word =>
                emotionWords.some(emotionWord => word.includes(emotionWord))
            ).length;

            emotions[emotion] = {
                count: matches,
                percentage: 0 // Will be calculated after total is known
            };
            totalEmotionalWords += matches;
        }

        // Calculate percentages
        for (const emotion of Object.keys(emotions)) {
            emotions[emotion].percentage = totalEmotionalWords > 0 ?
                Math.round((emotions[emotion].count / totalEmotionalWords) * 100) : 0;
        }

        return {
            emotions: emotions,
            total_emotional_words: totalEmotionalWords,
            emotional_density: (totalEmotionalWords / words.length) * 100,
            dominant_emotion: this.getDominantEmotion(emotions)
        };
    }

    analyzeConsistency(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const toneVariations = [];

        // Analyze tone consistency across sentences
        for (const sentence of sentences.slice(0, 10)) { // Limit to first 10 sentences
            const sentenceTones = this.analyzeTones(sentence);
            const dominantTone = Object.entries(sentenceTones)
                .sort((a, b) => b[1].score - a[1].score)[0];

            if (dominantTone && dominantTone[1].score > 0.1) {
                toneVariations.push({
                    sentence: sentence.trim().substring(0, 100) + '...',
                    tone: dominantTone[0],
                    score: dominantTone[1].score
                });
            }
        }

        const toneTypes = [...new Set(toneVariations.map(tv => tv.tone))];
        const consistencyScore = toneTypes.length <= 2 ? 1 : Math.max(0, 1 - (toneTypes.length - 2) * 0.2);

        return {
            consistency_score: consistencyScore,
            consistency_level: this.getConsistencyLevel(consistencyScore),
            tone_variations: toneVariations,
            dominant_tones: toneTypes.slice(0, 3),
            recommendations: this.generateConsistencyRecommendations(consistencyScore, toneTypes)
        };
    }

    analyzeFormality(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const formalIndicators = [
            'furthermore', 'therefore', 'however', 'nevertheless', 'consequently',
            'moreover', 'additionally', 'subsequently', 'accordingly', 'respectively'
        ];

        const informalIndicators = [
            "don't", "won't", "can't", "isn't", "aren't", "wasn't", "weren't",
            'gonna', 'wanna', 'gotta', 'yeah', 'ok', 'okay', 'cool', 'awesome'
        ];

        const formalCount = words.filter(word =>
            formalIndicators.some(formal => word.includes(formal))
        ).length;

        const informalCount = words.filter(word =>
            informalIndicators.some(informal => word.includes(informal))
        ).length;

        const avgWordsPerSentence = words.length / sentences.length;
        const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;

        // Calculate formality score
        let formalityScore = 0.5; // Base neutral score
        formalityScore += (formalCount / words.length) * 2; // Boost for formal words
        formalityScore -= (informalCount / words.length) * 2; // Reduce for informal words
        formalityScore += (avgWordsPerSentence > 15 ? 0.2 : -0.1); // Complex sentences
        formalityScore += (longSentences / sentences.length) * 0.3; // Long sentences

        formalityScore = Math.max(0, Math.min(1, formalityScore));

        return {
            formality_score: formalityScore,
            formality_level: this.getFormalityLevel(formalityScore),
            formal_indicators: formalCount,
            informal_indicators: informalCount,
            avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10,
            long_sentences: longSentences,
            recommendations: this.generateFormalityRecommendations(formalityScore)
        };
    }

    calculateOverallTone(toneScores) {
        const sortedTones = Object.entries(toneScores)
            .map(([tone, data]) => ({
                tone: tone,
                score: data.score,
                weight: this.toneCategories[tone].weight
            }))
            .sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

        const primaryTone = sortedTones[0];
        const secondaryTone = sortedTones[1];

        const overallScore = sortedTones.reduce((sum, tone) =>
            sum + (tone.score * tone.weight), 0
        );

        return {
            primary_tone: primaryTone ? primaryTone.tone : 'neutral',
            primary_score: primaryTone ? primaryTone.score : 0,
            secondary_tone: secondaryTone ? secondaryTone.tone : null,
            secondary_score: secondaryTone ? secondaryTone.score : 0,
            overall_score: Math.round(overallScore * 100),
            tone_strength: this.getToneStrength(overallScore)
        };
    }

    // Helper methods
    getToneStrength(score) {
        if (score >= 0.7) return 'strong';
        if (score >= 0.4) return 'moderate';
        if (score >= 0.2) return 'weak';
        return 'minimal';
    }

    getGradeFromScore(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    getSentimentLabel(score) {
        if (score > 0.2) return 'positive';
        if (score < -0.2) return 'negative';
        return 'neutral';
    }

    getConsistencyLevel(score) {
        if (score >= 0.8) return 'very consistent';
        if (score >= 0.6) return 'consistent';
        if (score >= 0.4) return 'somewhat consistent';
        return 'inconsistent';
    }

    getFormalityLevel(score) {
        if (score >= 0.7) return 'formal';
        if (score >= 0.4) return 'semi-formal';
        return 'informal';
    }

    getDominantEmotion(emotions) {
        const sortedEmotions = Object.entries(emotions)
            .sort((a, b) => b[1].count - a[1].count);

        return sortedEmotions[0] && sortedEmotions[0][1].count > 0 ?
            sortedEmotions[0][0] : 'neutral';
    }

    findToneExamples(text, keywords) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const examples = [];

        for (const sentence of sentences.slice(0, 5)) {
            for (const keyword of keywords.slice(0, 3)) {
                if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
                    examples.push({
                        sentence: sentence.trim(),
                        keyword: keyword
                    });
                    break;
                }
            }
        }

        return examples.slice(0, 3);
    }

    generateToneRecommendations(toneScores, sentimentAnalysis, consistencyAnalysis) {
        const recommendations = [];

        // Tone strength recommendations
        const weakTones = Object.entries(toneScores)
            .filter(([_, data]) => data.score < 0.3)
            .sort((a, b) => this.toneCategories[b[0]].weight - this.toneCategories[a[0]].weight);

        if (weakTones.length > 0) {
            const [weakTone, _] = weakTones[0];
            recommendations.push({
                type: 'tone_improvement',
                priority: 'medium',
                issue: `Weak ${this.toneCategories[weakTone].name}`,
                suggestion: `Strengthen ${weakTone} tone by using more ${this.toneCategories[weakTone].keywords.slice(0, 3).join(', ')} language`,
                examples: this.toneCategories[weakTone].keywords.slice(0, 3)
            });
        }

        // Sentiment recommendations
        if (sentimentAnalysis.sentiment_score < -0.1) {
            recommendations.push({
                type: 'sentiment',
                priority: 'high',
                issue: 'Negative sentiment detected',
                suggestion: 'Balance negative language with more positive and solution-oriented words',
                current_score: sentimentAnalysis.sentiment_score
            });
        }

        // Consistency recommendations
        if (consistencyAnalysis.consistency_score < 0.6) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                issue: 'Inconsistent tone throughout content',
                suggestion: 'Maintain a more consistent tone by focusing on 1-2 primary tones',
                tone_variations: consistencyAnalysis.dominant_tones.length
            });
        }

        return recommendations;
    }

    generateConsistencyRecommendations(score, toneTypes) {
        const recommendations = [];

        if (score < 0.6) {
            recommendations.push('Focus on 1-2 primary tones throughout the content');
            recommendations.push('Review content for conflicting tonal messages');
        }

        if (toneTypes.length > 3) {
            recommendations.push('Reduce the number of different tones used');
        }

        return recommendations;
    }

    generateFormalityRecommendations(score) {
        const recommendations = [];

        if (score < 0.3) {
            recommendations.push('Consider using more formal language for professional communication');
            recommendations.push('Avoid contractions and casual expressions');
            recommendations.push('Use complete sentences and proper grammar');
        } else if (score > 0.8) {
            recommendations.push('Consider making language more accessible and relatable');
            recommendations.push('Balance formality with warmth and approachability');
        }

        return recommendations;
    }

    generateToneSummary(toneScores, sentimentAnalysis) {
        const dominantTones = Object.entries(toneScores)
            .filter(([_, data]) => data.score > 0.2)
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 2);

        const summary = {
            primary_characteristics: dominantTones.map(([tone, _]) =>
                this.toneCategories[tone].name
            ),
            sentiment: sentimentAnalysis.sentiment_label,
            overall_assessment: this.getOverallAssessment(dominantTones, sentimentAnalysis)
        };

        return summary;
    }

    getOverallAssessment(dominantTones, sentimentAnalysis) {
        if (dominantTones.length === 0) {
            return 'Content has minimal tonal characteristics. Consider strengthening tone for better engagement.';
        }

        const toneNames = dominantTones.map(([tone, _]) => this.toneCategories[tone].name);
        const sentimentDesc = sentimentAnalysis.sentiment_label;

        return `Content demonstrates ${toneNames.join(' and ').toLowerCase()} characteristics with ${sentimentDesc} sentiment. ${
            sentimentDesc === 'positive' ? 'This creates an engaging and effective tone.' :
            sentimentDesc === 'negative' ? 'Consider balancing with more positive language.' :
            'The neutral sentiment may benefit from more emotional engagement.'
        }`;
    }

    setupCampaignToneSettings() {
        this.defaultProfile = {
            candidateName: 'Candidate',
            communicationStyle: 'balanced',
            primaryTones: ['professional', 'confident'],
            targetAudience: 'general',
            formalityLevel: 'formal',
            customKeywords: [],
            avoidWords: []
        };

        if (!this.campaignProfile) {
            this.campaignProfile = this.defaultProfile;
        }

        this.adjustToneWeights();
    }

    adjustToneWeights() {
        if (!this.campaignProfile || !this.campaignProfile.primaryTones) return;

        this.campaignProfile.primaryTones.forEach(tone => {
            if (this.toneCategories[tone]) {
                this.toneCategories[tone].weight += 0.1;
            }
        });

        if (this.campaignProfile.communicationStyle === 'aggressive') {
            this.toneCategories.confident.weight += 0.15;
            this.toneCategories.urgent.weight += 0.1;
        } else if (this.campaignProfile.communicationStyle === 'compassionate') {
            this.toneCategories.empathetic.weight += 0.15;
            this.toneCategories.inclusive.weight += 0.1;
        } else if (this.campaignProfile.communicationStyle === 'optimistic') {
            this.toneCategories.optimistic.weight += 0.15;
            this.toneCategories.confident.weight += 0.05;
        }

        if (this.campaignProfile.customKeywords && this.campaignProfile.customKeywords.length > 0) {
            this.toneCategories.professional.keywords.push(...this.campaignProfile.customKeywords);
        }

        if (this.campaignProfile.avoidWords && this.campaignProfile.avoidWords.length > 0) {
            Object.values(this.toneCategories).forEach(category => {
                if (!category.anti_keywords) category.anti_keywords = [];
                category.anti_keywords.push(...this.campaignProfile.avoidWords);
            });
        }
    }

    static createCampaignProfile(profileData) {
        const validationErrors = this.validateProfileData(profileData);
        if (validationErrors.length > 0) {
            throw new Error(`Invalid campaign profile: ${validationErrors.join(', ')}`);
        }

        return {
            candidateName: profileData.candidateName || 'Candidate',
            communicationStyle: profileData.communicationStyle || 'balanced',
            primaryTones: profileData.primaryTones || ['professional', 'confident'],
            targetAudience: profileData.targetAudience || 'general',
            formalityLevel: profileData.formalityLevel || 'formal',
            customKeywords: profileData.customKeywords || [],
            avoidWords: profileData.avoidWords || [],
            createdAt: new Date().toISOString()
        };
    }

    static validateProfileData(profileData) {
        const errors = [];
        const validStyles = ['aggressive', 'balanced', 'compassionate', 'optimistic'];
        const validTones = ['professional', 'confident', 'optimistic', 'empathetic', 'urgent', 'inclusive'];
        const validAudiences = ['general', 'youth', 'seniors', 'professionals', 'working_class'];
        const validFormality = ['formal', 'semi-formal', 'informal'];

        if (profileData.communicationStyle && !validStyles.includes(profileData.communicationStyle)) {
            errors.push(`Invalid communication style: ${profileData.communicationStyle}`);
        }

        if (profileData.primaryTones) {
            const invalidTones = profileData.primaryTones.filter(tone => !validTones.includes(tone));
            if (invalidTones.length > 0) {
                errors.push(`Invalid tone(s): ${invalidTones.join(', ')}`);
            }
        }

        if (profileData.targetAudience && !validAudiences.includes(profileData.targetAudience)) {
            errors.push(`Invalid target audience: ${profileData.targetAudience}`);
        }

        if (profileData.formalityLevel && !validFormality.includes(profileData.formalityLevel)) {
            errors.push(`Invalid formality level: ${profileData.formalityLevel}`);
        }

        return errors;
    }

    getCampaignProfile() {
        return this.campaignProfile;
    }

    updateCampaignProfile(updates) {
        const validationErrors = ToneAnalyzer.validateProfileData(updates);
        if (validationErrors.length > 0) {
            throw new Error(`Invalid profile updates: ${validationErrors.join(', ')}`);
        }

        this.campaignProfile = { ...this.campaignProfile, ...updates };
        this.adjustToneWeights();
        return this.campaignProfile;
    }
}

module.exports = ToneAnalyzer;