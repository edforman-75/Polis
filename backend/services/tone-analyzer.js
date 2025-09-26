/**
 * Advanced Tone Analyzer for Political Content
 * Evaluates tone across multiple dimensions relevant to campaign communications
 */

const aiService = require('./ai-service');

class ToneAnalyzer {
    constructor() {
        // Tone dimensions for political content
        this.toneDimensions = {
            emotional: {
                positive: ['hopeful', 'optimistic', 'inspiring', 'confident', 'enthusiastic', 'determined'],
                negative: ['angry', 'fearful', 'frustrated', 'pessimistic', 'defensive', 'desperate'],
                neutral: ['factual', 'informative', 'analytical', 'objective', 'measured']
            },
            rhetorical: {
                assertive: ['strong', 'decisive', 'bold', 'commanding', 'authoritative'],
                collaborative: ['inclusive', 'unifying', 'cooperative', 'consensus-building'],
                confrontational: ['combative', 'aggressive', 'attacking', 'divisive', 'hostile']
            },
            formality: {
                formal: ['professional', 'official', 'ceremonial', 'diplomatic'],
                informal: ['conversational', 'casual', 'friendly', 'approachable'],
                colloquial: ['folksy', 'down-to-earth', 'everyday', 'relatable']
            },
            urgency: {
                urgent: ['immediate', 'critical', 'pressing', 'time-sensitive', 'crisis'],
                measured: ['thoughtful', 'deliberate', 'careful', 'considered'],
                passive: ['wait-and-see', 'non-committal', 'hesitant', 'uncertain']
            }
        };

        // Linguistic markers for tone detection
        this.linguisticMarkers = {
            defensiveness: {
                phrases: [
                    'I deny', 'that\'s false', 'not true', 'they claim',
                    'allegedly', 'so-called', 'supposedly', 'misleading',
                    'taken out of context', 'distorted', 'misrepresented'
                ],
                weight: -15 // Negative impact on tone score
            },
            empowerment: {
                phrases: [
                    'we can', 'together we', 'our future', 'let\'s build',
                    'join us', 'stand with', 'fight for', 'believe in',
                    'stronger together', 'united we', 'our movement'
                ],
                weight: 10
            },
            fear_based: {
                phrases: [
                    'dangerous', 'threat', 'risk', 'destroy', 'radical',
                    'extreme', 'disaster', 'crisis', 'catastrophe', 'ruin'
                ],
                weight: -10
            },
            solution_oriented: {
                phrases: [
                    'solution', 'plan', 'proposal', 'initiative', 'strategy',
                    'approach', 'framework', 'roadmap', 'path forward'
                ],
                weight: 15
            },
            local_connection: {
                phrases: [
                    'our community', 'local', 'neighborhood', 'hometown',
                    'Main Street', 'working families', 'small business'
                ],
                weight: 10
            }
        };

        // Context-specific tone requirements
        this.contextRequirements = {
            statement: {
                preferred: ['assertive', 'solution-oriented', 'confident'],
                avoid: ['defensive', 'uncertain', 'confrontational'],
                formalityLevel: 'professional'
            },
            speech: {
                preferred: ['inspiring', 'inclusive', 'passionate'],
                avoid: ['monotone', 'divisive', 'overly-technical'],
                formalityLevel: 'varies' // Depends on audience
            },
            press_release: {
                preferred: ['factual', 'authoritative', 'newsworthy'],
                avoid: ['promotional', 'vague', 'emotional'],
                formalityLevel: 'formal'
            },
            social_media: {
                preferred: ['conversational', 'engaging', 'authentic'],
                avoid: ['stiff', 'verbose', 'preachy'],
                formalityLevel: 'informal'
            },
            fundraising: {
                preferred: ['urgent', 'motivating', 'grateful'],
                avoid: ['desperate', 'guilt-inducing', 'entitled'],
                formalityLevel: 'personal'
            },
            debate: {
                preferred: ['strong', 'factual', 'quick'],
                avoid: ['rambling', 'evasive', 'angry'],
                formalityLevel: 'formal'
            }
        };

        // Audience-specific tone calibration
        this.audienceProfiles = {
            base_supporters: {
                preferredTone: ['passionate', 'rallying', 'us-vs-them'],
                emotionalRange: 'high',
                formalityPreference: 'informal'
            },
            swing_voters: {
                preferredTone: ['reasonable', 'balanced', 'pragmatic'],
                emotionalRange: 'moderate',
                formalityPreference: 'professional'
            },
            donors: {
                preferredTone: ['grateful', 'urgent', 'insider'],
                emotionalRange: 'moderate-high',
                formalityPreference: 'personal'
            },
            media: {
                preferredTone: ['factual', 'quotable', 'newsworthy'],
                emotionalRange: 'controlled',
                formalityPreference: 'formal'
            },
            youth: {
                preferredTone: ['authentic', 'progressive', 'energetic'],
                emotionalRange: 'high',
                formalityPreference: 'casual'
            }
        };
    }

    async analyzeTone(content, assignmentType, targetAudience = 'general', briefData = null) {
        const analysis = {
            overallToneScore: 0,
            dimensions: {},
            appropriateness: {},
            issues: [],
            recommendations: [],
            emotionalProfile: {},
            readabilityMetrics: {},
            audienceAlignment: 0
        };

        // 1. Analyze linguistic markers
        const markerAnalysis = this.analyzeLinguisticMarkers(content);

        // 2. Analyze emotional dimensions
        analysis.emotionalProfile = this.analyzeEmotionalDimensions(content);

        // 3. Analyze rhetorical style
        analysis.dimensions.rhetorical = this.analyzeRhetoricalStyle(content);

        // 4. Analyze formality level
        analysis.dimensions.formality = this.analyzeFormalityLevel(content);

        // 5. Analyze urgency and pacing
        analysis.dimensions.urgency = this.analyzeUrgency(content);

        // 6. Check context appropriateness
        analysis.appropriateness = this.checkContextAppropriateness(
            analysis.dimensions,
            assignmentType,
            targetAudience
        );

        // 7. Calculate readability metrics
        analysis.readabilityMetrics = this.calculateReadability(content);

        // 8. Analyze audience alignment
        analysis.audienceAlignment = this.analyzeAudienceAlignment(
            analysis.dimensions,
            targetAudience
        );

        // 9. Run AI-powered tone analysis
        const aiAnalysis = await this.runAIToneAnalysis(content, assignmentType, targetAudience);

        // 10. Combine all analyses
        analysis.overallToneScore = this.calculateOverallToneScore(
            markerAnalysis,
            analysis.appropriateness,
            analysis.audienceAlignment,
            aiAnalysis
        );

        // Generate specific recommendations
        analysis.recommendations = this.generateRecommendations(
            analysis,
            assignmentType,
            targetAudience,
            briefData
        );

        // Identify critical issues
        analysis.issues = this.identifyToneIssues(analysis, markerAnalysis);

        return analysis;
    }

    analyzeLinguisticMarkers(content) {
        const analysis = {
            markers: [],
            totalWeight: 0,
            positiveMarkers: 0,
            negativeMarkers: 0
        };

        const contentLower = content.toLowerCase();

        for (const [markerType, config] of Object.entries(this.linguisticMarkers)) {
            for (const phrase of config.phrases) {
                if (contentLower.includes(phrase)) {
                    analysis.markers.push({
                        type: markerType,
                        phrase: phrase,
                        weight: config.weight
                    });
                    analysis.totalWeight += config.weight;

                    if (config.weight > 0) {
                        analysis.positiveMarkers++;
                    } else {
                        analysis.negativeMarkers++;
                    }
                }
            }
        }

        return analysis;
    }

    analyzeEmotionalDimensions(content) {
        const profile = {
            primary: null,
            secondary: [],
            valence: 0, // -1 (negative) to 1 (positive)
            intensity: 0, // 0 (low) to 1 (high)
            consistency: 0 // 0 (mixed) to 1 (consistent)
        };

        const contentLower = content.toLowerCase();
        const emotionScores = {};

        // Count emotional indicators
        for (const [category, emotions] of Object.entries(this.toneDimensions.emotional)) {
            for (const emotion of emotions) {
                // Simple keyword matching - could be enhanced with sentiment analysis
                const regex = new RegExp(`\\b${emotion}\\w*\\b`, 'gi');
                const matches = (contentLower.match(regex) || []).length;
                if (matches > 0) {
                    emotionScores[emotion] = matches;
                }
            }
        }

        // Determine primary emotion
        const sortedEmotions = Object.entries(emotionScores)
            .sort(([,a], [,b]) => b - a);

        if (sortedEmotions.length > 0) {
            profile.primary = sortedEmotions[0][0];
            profile.secondary = sortedEmotions.slice(1, 3).map(([emotion]) => emotion);
        }

        // Calculate valence
        const positiveWords = this.toneDimensions.emotional.positive;
        const negativeWords = this.toneDimensions.emotional.negative;

        let positiveCount = 0;
        let negativeCount = 0;

        for (const [emotion, count] of Object.entries(emotionScores)) {
            if (positiveWords.includes(emotion)) positiveCount += count;
            if (negativeWords.includes(emotion)) negativeCount += count;
        }

        profile.valence = positiveCount > negativeCount ?
            Math.min(1, positiveCount / (positiveCount + negativeCount)) :
            Math.max(-1, -negativeCount / (positiveCount + negativeCount));

        // Calculate intensity (based on emotional word density)
        const wordCount = content.split(/\s+/).length;
        const emotionalWordCount = Object.values(emotionScores).reduce((a, b) => a + b, 0);
        profile.intensity = Math.min(1, emotionalWordCount / (wordCount * 0.1)); // 10% threshold

        // Calculate consistency
        if (sortedEmotions.length > 0) {
            const dominantScore = sortedEmotions[0][1];
            const totalScore = Object.values(emotionScores).reduce((a, b) => a + b, 0);
            profile.consistency = dominantScore / totalScore;
        }

        return profile;
    }

    analyzeRhetoricalStyle(content) {
        const sentences = content.match(/[.!?]+/g) || [];
        const questions = content.match(/\?/g) || [];
        const exclamations = content.match(/!/g) || [];

        const style = {
            type: 'balanced',
            assertiveness: 0,
            inclusiveness: 0,
            confrontationLevel: 0
        };

        // Check for assertive language
        const assertiveWords = ['must', 'will', 'shall', 'definitely', 'certainly', 'absolutely'];
        const assertiveCount = assertiveWords.reduce((count, word) => {
            return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);

        // Check for inclusive language
        const inclusiveWords = ['we', 'us', 'our', 'together', 'community', 'all'];
        const inclusiveCount = inclusiveWords.reduce((count, word) => {
            return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);

        // Check for confrontational language
        const confrontationalWords = ['fight', 'battle', 'defeat', 'destroy', 'attack', 'oppose'];
        const confrontationalCount = confrontationalWords.reduce((count, word) => {
            return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);

        const wordCount = content.split(/\s+/).length;

        style.assertiveness = Math.min(1, assertiveCount / (wordCount * 0.05));
        style.inclusiveness = Math.min(1, inclusiveCount / (wordCount * 0.1));
        style.confrontationLevel = Math.min(1, confrontationalCount / (wordCount * 0.05));

        // Determine primary style
        if (style.confrontationLevel > 0.5) {
            style.type = 'confrontational';
        } else if (style.assertiveness > 0.7) {
            style.type = 'assertive';
        } else if (style.inclusiveness > 0.7) {
            style.type = 'collaborative';
        } else if (questions.length > sentences.length * 0.3) {
            style.type = 'questioning';
        }

        return style;
    }

    analyzeFormalityLevel(content) {
        const analysis = {
            level: 'neutral',
            score: 0.5, // 0 (very informal) to 1 (very formal)
            indicators: []
        };

        // Formal indicators
        const formalIndicators = {
            longWords: (content.match(/\b\w{10,}\b/g) || []).length,
            passiveVoice: (content.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/g) || []).length,
            technicalTerms: (content.match(/\b(policy|legislation|implementation|framework|strategic)\b/gi) || []).length,
            thirdPerson: (content.match(/\b(he|she|they|it|one)\b/gi) || []).length
        };

        // Informal indicators
        const informalIndicators = {
            contractions: (content.match(/\b\w+'\w+\b/g) || []).length,
            firstPerson: (content.match(/\b(I|me|my|we|us|our)\b/gi) || []).length,
            exclamations: (content.match(/!/g) || []).length,
            colloquialisms: (content.match(/\b(folks|gonna|gotta|yeah|stuff)\b/gi) || []).length
        };

        const wordCount = content.split(/\s+/).length;

        // Calculate formality score
        const formalScore = Object.values(formalIndicators).reduce((a, b) => a + b, 0) / wordCount;
        const informalScore = Object.values(informalIndicators).reduce((a, b) => a + b, 0) / wordCount;

        analysis.score = Math.max(0, Math.min(1, 0.5 + (formalScore - informalScore) * 2));

        // Determine level
        if (analysis.score > 0.75) {
            analysis.level = 'very_formal';
        } else if (analysis.score > 0.6) {
            analysis.level = 'formal';
        } else if (analysis.score > 0.4) {
            analysis.level = 'neutral';
        } else if (analysis.score > 0.25) {
            analysis.level = 'informal';
        } else {
            analysis.level = 'very_informal';
        }

        // Record specific indicators
        if (formalIndicators.longWords > wordCount * 0.1) {
            analysis.indicators.push('complex vocabulary');
        }
        if (formalIndicators.passiveVoice > wordCount * 0.05) {
            analysis.indicators.push('passive voice usage');
        }
        if (informalIndicators.contractions > wordCount * 0.05) {
            analysis.indicators.push('frequent contractions');
        }

        return analysis;
    }

    analyzeUrgency(content) {
        const analysis = {
            level: 'measured',
            score: 0.5, // 0 (passive) to 1 (urgent)
            timeReferences: [],
            callsToAction: 0
        };

        // Time-related urgency markers
        const urgentTimeMarkers = ['now', 'today', 'immediately', 'urgent', 'deadline', 'quickly', 'asap'];
        const futureTimeMarkers = ['tomorrow', 'next week', 'soon', 'eventually', 'later', 'upcoming'];

        const contentLower = content.toLowerCase();

        // Count urgency markers
        let urgencyCount = 0;
        for (const marker of urgentTimeMarkers) {
            if (contentLower.includes(marker)) {
                urgencyCount++;
                analysis.timeReferences.push(marker);
            }
        }

        // Count calls to action
        const actionPhrases = ['call your', 'contact', 'donate', 'join us', 'act now', 'sign up', 'vote'];
        for (const phrase of actionPhrases) {
            if (contentLower.includes(phrase)) {
                analysis.callsToAction++;
            }
        }

        // Calculate urgency score
        const wordCount = content.split(/\s+/).length;
        analysis.score = Math.min(1, (urgencyCount + analysis.callsToAction) / (wordCount * 0.02));

        // Determine level
        if (analysis.score > 0.7) {
            analysis.level = 'urgent';
        } else if (analysis.score > 0.3) {
            analysis.level = 'measured';
        } else {
            analysis.level = 'passive';
        }

        return analysis;
    }

    checkContextAppropriateness(dimensions, assignmentType, targetAudience) {
        const requirements = this.contextRequirements[assignmentType] || this.contextRequirements.statement;
        const appropriateness = {
            score: 100,
            issues: [],
            strengths: []
        };

        // Check formality alignment
        if (requirements.formalityLevel !== 'varies') {
            const expectedFormality = requirements.formalityLevel;
            const actualFormality = dimensions.formality.level;

            if (expectedFormality === 'formal' && actualFormality.includes('informal')) {
                appropriateness.issues.push('Too informal for ' + assignmentType);
                appropriateness.score -= 20;
            } else if (expectedFormality === 'informal' && actualFormality.includes('formal')) {
                appropriateness.issues.push('Too formal for ' + assignmentType);
                appropriateness.score -= 15;
            } else {
                appropriateness.strengths.push('Appropriate formality level');
            }
        }

        // Check rhetorical style
        if (dimensions.rhetorical.type === 'confrontational' &&
            requirements.avoid.includes('confrontational')) {
            appropriateness.issues.push('Overly confrontational tone');
            appropriateness.score -= 25;
        }

        // Check urgency appropriateness
        if (assignmentType === 'fundraising' && dimensions.urgency.level === 'passive') {
            appropriateness.issues.push('Lacks urgency for fundraising appeal');
            appropriateness.score -= 20;
        }

        return appropriateness;
    }

    calculateReadability(content) {
        const sentences = content.match(/[.!?]+/) || [];
        const words = content.split(/\s+/);
        const syllables = this.countSyllables(content);

        const metrics = {
            fleschKincaid: 0,
            readingEase: 0,
            gradeLevel: 0,
            sentenceComplexity: 'medium'
        };

        if (sentences.length > 0 && words.length > 0) {
            // Flesch Reading Ease
            metrics.readingEase = 206.835 - 1.015 * (words.length / sentences.length)
                                - 84.6 * (syllables / words.length);

            // Flesch-Kincaid Grade Level
            metrics.gradeLevel = 0.39 * (words.length / sentences.length)
                               + 11.8 * (syllables / words.length) - 15.59;

            // Determine complexity
            if (metrics.gradeLevel > 12) {
                metrics.sentenceComplexity = 'complex';
            } else if (metrics.gradeLevel < 8) {
                metrics.sentenceComplexity = 'simple';
            }
        }

        return metrics;
    }

    countSyllables(text) {
        // Simple syllable counting approximation
        const words = text.toLowerCase().split(/\s+/);
        let totalSyllables = 0;

        for (const word of words) {
            const cleaned = word.replace(/[^a-z]/g, '');
            if (cleaned.length > 0) {
                // Count vowel groups as syllables (approximation)
                const vowelGroups = cleaned.match(/[aeiouy]+/g) || [];
                let syllables = vowelGroups.length;

                // Adjust for silent e
                if (cleaned.endsWith('e') && syllables > 1) {
                    syllables--;
                }

                // Minimum of 1 syllable per word
                totalSyllables += Math.max(1, syllables);
            }
        }

        return totalSyllables;
    }

    analyzeAudienceAlignment(dimensions, targetAudience) {
        const profile = this.audienceProfiles[targetAudience] || this.audienceProfiles.swing_voters;
        let alignmentScore = 100;

        // Check emotional range alignment
        const emotionalIntensity = dimensions.urgency?.score || 0.5;
        if (profile.emotionalRange === 'high' && emotionalIntensity < 0.3) {
            alignmentScore -= 20;
        } else if (profile.emotionalRange === 'controlled' && emotionalIntensity > 0.7) {
            alignmentScore -= 25;
        }

        // Check formality preference
        const formalityScore = dimensions.formality?.score || 0.5;
        if (profile.formalityPreference === 'informal' && formalityScore > 0.7) {
            alignmentScore -= 15;
        } else if (profile.formalityPreference === 'formal' && formalityScore < 0.3) {
            alignmentScore -= 20;
        }

        return Math.max(0, alignmentScore);
    }

    async runAIToneAnalysis(content, assignmentType, targetAudience) {
        try {
            const prompt = `Analyze the tone of this ${assignmentType} for a ${targetAudience} audience:

"${content}"

Evaluate:
1. Emotional resonance (0-100)
2. Authenticity (0-100)
3. Persuasiveness (0-100)
4. Clarity (0-100)
5. Main tone descriptors (3 words)
6. Potential tone issues
7. Recommended adjustments

Format as JSON.`;

            const response = await aiService.generateResponse(prompt, {
                maxLength: 500,
                temperature: 0.3
            });

            return this.parseAIResponse(response);
        } catch (error) {
            console.error('AI tone analysis failed:', error);
            return {
                emotionalResonance: 50,
                authenticity: 50,
                persuasiveness: 50,
                clarity: 50
            };
        }
    }

    parseAIResponse(response) {
        try {
            return JSON.parse(response);
        } catch {
            // Fallback parsing if not valid JSON
            return {
                emotionalResonance: 50,
                authenticity: 50,
                persuasiveness: 50,
                clarity: 50
            };
        }
    }

    calculateOverallToneScore(markerAnalysis, appropriateness, audienceAlignment, aiAnalysis) {
        // Weighted scoring
        let score = 0;
        let weight = 0;

        // Linguistic markers (25%)
        const markerScore = Math.max(0, 50 + markerAnalysis.totalWeight);
        score += markerScore * 0.25;
        weight += 0.25;

        // Context appropriateness (30%)
        score += appropriateness.score * 0.30;
        weight += 0.30;

        // Audience alignment (25%)
        score += audienceAlignment * 0.25;
        weight += 0.25;

        // AI analysis (20%)
        if (aiAnalysis && aiAnalysis.emotionalResonance) {
            const aiScore = (aiAnalysis.emotionalResonance + aiAnalysis.authenticity +
                           aiAnalysis.persuasiveness + aiAnalysis.clarity) / 4;
            score += aiScore * 0.20;
            weight += 0.20;
        }

        return Math.round(score / weight);
    }

    generateRecommendations(analysis, assignmentType, targetAudience, briefData) {
        const recommendations = [];

        // Emotional profile recommendations
        if (analysis.emotionalProfile.valence < -0.3) {
            recommendations.push({
                priority: 'high',
                category: 'emotional',
                suggestion: 'Balance negative messaging with positive vision and solutions'
            });
        }

        if (analysis.emotionalProfile.intensity < 0.2 && targetAudience === 'base_supporters') {
            recommendations.push({
                priority: 'medium',
                category: 'emotional',
                suggestion: 'Increase emotional intensity to energize base supporters'
            });
        }

        // Formality recommendations
        const requirements = this.contextRequirements[assignmentType];
        if (requirements && analysis.dimensions.formality) {
            if (requirements.formalityLevel === 'formal' &&
                analysis.dimensions.formality.level.includes('informal')) {
                recommendations.push({
                    priority: 'high',
                    category: 'formality',
                    suggestion: 'Increase formality: use complete sentences, avoid contractions, employ professional language'
                });
            }
        }

        // Rhetorical recommendations
        if (analysis.dimensions.rhetorical?.confrontationLevel > 0.7) {
            recommendations.push({
                priority: 'medium',
                category: 'rhetorical',
                suggestion: 'Reduce confrontational language to appeal to swing voters'
            });
        }

        // Readability recommendations
        if (analysis.readabilityMetrics.gradeLevel > 12) {
            recommendations.push({
                priority: 'high',
                category: 'readability',
                suggestion: 'Simplify language for broader accessibility (current grade level: ' +
                           Math.round(analysis.readabilityMetrics.gradeLevel) + ')'
            });
        }

        // Brief alignment recommendations
        if (briefData && briefData.emotional_tone) {
            const requestedTone = briefData.emotional_tone.toLowerCase();
            if (!analysis.emotionalProfile.primary?.includes(requestedTone)) {
                recommendations.push({
                    priority: 'high',
                    category: 'brief_alignment',
                    suggestion: `Adjust tone to match brief requirement: ${briefData.emotional_tone}`
                });
            }
        }

        return recommendations;
    }

    identifyToneIssues(analysis, markerAnalysis) {
        const issues = [];

        // Check for defensive language
        const defensiveMarkers = markerAnalysis.markers.filter(m => m.type === 'defensiveness');
        if (defensiveMarkers.length > 2) {
            issues.push({
                severity: 'high',
                type: 'defensive_tone',
                description: `Excessive defensive language detected (${defensiveMarkers.length} instances)`,
                impact: 'May appear weak or reactive rather than proactive'
            });
        }

        // Check for fear-based messaging
        const fearMarkers = markerAnalysis.markers.filter(m => m.type === 'fear_based');
        if (fearMarkers.length > 3) {
            issues.push({
                severity: 'medium',
                type: 'fear_based',
                description: 'Over-reliance on fear-based messaging',
                impact: 'May alienate voters seeking positive vision'
            });
        }

        // Check for tone inconsistency
        if (analysis.emotionalProfile.consistency < 0.4) {
            issues.push({
                severity: 'medium',
                type: 'inconsistent_tone',
                description: 'Tone shifts throughout the content',
                impact: 'May confuse message and reduce impact'
            });
        }

        // Check for inappropriate urgency
        if (analysis.dimensions.urgency?.level === 'urgent' &&
            analysis.dimensions.rhetorical?.type === 'confrontational') {
            issues.push({
                severity: 'high',
                type: 'alarmist_tone',
                description: 'Combination of high urgency and confrontational tone',
                impact: 'May be perceived as alarmist or desperate'
            });
        }

        return issues;
    }
}

module.exports = new ToneAnalyzer();