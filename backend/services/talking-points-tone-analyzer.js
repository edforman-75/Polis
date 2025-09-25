const OpenAI = require('openai');

/**
 * Talking Points Tone Analyzer
 * AI-powered tool for optimizing messaging tone based on professional campaign talking points
 * Designed to match the format and effectiveness observed in DNC daily briefings
 */
class TalkingPointsToneAnalyzer {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    // Analyze and enhance talking points for maximum impact
    async optimizeTone(content, options = {}) {
        try {
            const {
                messageType = 'attack',
                urgency = 'high',
                targetAudience = 'surrogates',
                emotionalTone = 'aggressive',
                platform = 'tv'
            } = options;

            const analysisPrompt = this.buildTonePrompt(content, {
                messageType,
                urgency,
                targetAudience,
                emotionalTone,
                platform
            });

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional campaign communications strategist specializing in message discipline and surrogate coordination. Your expertise is in creating the coordinated messaging that creates effective echo chambers across media. Analyze and optimize talking points for maximum impact based on proven DNC/campaign messaging strategies."
                    },
                    { role: "user", content: analysisPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1500
            });

            return this.parseOptimizationResults(completion.choices[0].message.content);

        } catch (error) {
            console.error('Tone Analysis Error:', error);
            return this.getFallbackOptimization(content, options);
        }
    }

    // Generate sound bites optimized for different platforms
    async generateSoundBites(content, duration = '10-second') {
        try {
            const soundBitePrompt = `
Transform this talking point into perfect TV sound bites:

"${content}"

Generate 3 variations optimized for ${duration} TV delivery:

1. **Attack Version** - Direct, punchy criticism
2. **Pivot Version** - Defensive response that redirects to offense
3. **Vision Version** - Forward-looking, inspiring closer

Each sound bite must:
- Fit in ${duration} (approximately 25-30 words)
- Use emotional language ("shameless," "corrupt," "historic," "unprecedented")
- End with quotable closer
- Be immediately usable on TV without context

Format as ready-to-use quotes with attribution placeholders.
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a TV media consultant specializing in creating viral, quotable sound bites for political campaigns. Focus on emotional impact and memorability."
                    },
                    { role: "user", content: soundBitePrompt }
                ],
                temperature: 0.4,
                max_tokens: 800
            });

            return this.parseSoundBites(completion.choices[0].message.content);

        } catch (error) {
            console.error('Sound Bite Generation Error:', error);
            return this.getFallbackSoundBites(content, duration);
        }
    }

    // Analyze emotional language effectiveness
    async analyzeEmotionalImpact(content) {
        try {
            const emotionPrompt = `
Analyze the emotional impact of this talking point content:

"${content}"

Evaluate:
1. **Emotional Language Strength** (1-10 scale)
2. **Visceral Impact Words** (identify specific words that trigger emotion)
3. **Moral Framing** (how it positions right vs wrong)
4. **Urgency Level** (how it creates sense of immediate action needed)
5. **Memorability Score** (how likely to stick in listener's mind)

Provide specific recommendations to increase emotional impact using words like:
- Attack words: "shameless," "corrupt," "betrayal," "reckless," "dangerous"
- Moral words: "wrong," "immoral," "unethical," "unconscionable"
- Urgency words: "crisis," "emergency," "urgent," "immediate," "now"
- Scale words: "historic," "unprecedented," "massive," "devastating"

Give 3 enhanced versions with increasing emotional intensity.
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a communications psychologist specializing in emotional messaging impact for political campaigns. Focus on word choice that maximizes emotional response while maintaining credibility."
                    },
                    { role: "user", content: emotionPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1200
            });

            return this.parseEmotionalAnalysis(completion.choices[0].message.content);

        } catch (error) {
            console.error('Emotional Analysis Error:', error);
            return this.getFallbackEmotionalAnalysis(content);
        }
    }

    // Analyze press release for AP style and news value
    async analyzePressRelease(content, options = {}) {
        try {
            const {
                headline = '',
                targetMedia = 'general',
                newsValue = 'moderate'
            } = options;

            const pressAnalysisPrompt = `
Analyze this press release content for professional standards and optimization:

**Headline:** "${headline}"
**Content:** "${content}"

**Analysis Requirements:**

1. **AP Style Compliance** (1-10 score)
   - Proper attribution and sourcing
   - Correct formatting and style
   - Professional tone and structure

2. **News Value Assessment** (1-10 score)
   - Timeliness and relevance
   - Impact and significance
   - Human interest angle

3. **Headline Analysis**
   - Clarity and impact
   - SEO optimization potential
   - Click-worthiness vs credibility

4. **Structure Assessment**
   - Lead paragraph effectiveness
   - Quote integration and attribution
   - Supporting information flow

5. **Media Appeal** (1-10 score)
   - Likelihood of pickup
   - Quotable content quality
   - Visual/photo opportunities

**Optimization Recommendations:**
- Headline improvements
- Lead paragraph enhancements
- Quote selections and placements
- Supporting information priorities
- Media hook strengthening

Provide 2 enhanced versions:
- **News-Focused Version** - Maximum news value and media appeal
- **Campaign-Focused Version** - Strong messaging while maintaining credibility
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional press secretary and former journalist specializing in AP style and news value assessment. Your expertise is in creating press releases that get media pickup while maintaining credibility and professional standards."
                    },
                    { role: "user", content: pressAnalysisPrompt }
                ],
                temperature: 0.2,
                max_tokens: 1500
            });

            return this.parsePressReleaseAnalysis(completion.choices[0].message.content);

        } catch (error) {
            console.error('Press Release Analysis Error:', error);
            return this.getFallbackPressAnalysis(content, options);
        }
    }

    // Optimize press advisory for media logistics and appeal
    async optimizePressAdvisory(content, options = {}) {
        try {
            const {
                eventType = 'announcement',
                targetMedia = 'local',
                visualOpportunity = 'moderate'
            } = options;

            const advisoryPrompt = `
Optimize this press advisory (media alert) for maximum media attendance and coverage:

**Current Content:** "${content}"

**Optimization Parameters:**
- Event Type: ${eventType}
- Target Media: ${targetMedia}
- Visual Opportunity: ${visualOpportunity}

**Analysis Requirements:**

1. **Logistics Completeness** (1-10 score)
   - WHO/WHAT/WHEN/WHERE/WHY clarity
   - RSVP and contact information
   - Parking and access details

2. **Media Appeal Assessment** (1-10 score)
   - Visual/photo opportunities
   - Exclusive access or interviews
   - Newsworthy hook strength

3. **Timing Analysis**
   - News cycle positioning
   - Deadline considerations
   - Competition assessment

4. **Format Optimization**
   - Subject line effectiveness
   - Scanning-friendly structure
   - Key information prominence

**Enhancement Recommendations:**
- Subject line variations
- Visual opportunity emphasis
- Exclusive angles
- Urgency indicators
- Follow-up procedures

Provide 2 optimized versions:
- **High-Impact Version** - Maximum urgency and news value
- **Professional Version** - Standard format with strong appeal
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a media relations expert specializing in press advisories that get results. Your expertise is in creating media alerts that maximize attendance while maintaining professional credibility with journalists."
                    },
                    { role: "user", content: advisoryPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1200
            });

            return this.parsePressAdvisoryOptimization(completion.choices[0].message.content);

        } catch (error) {
            console.error('Press Advisory Optimization Error:', error);
            return this.getFallbackAdvisoryOptimization(content, options);
        }
    }

    // Generate defensive pivot responses
    async createDefensivePivots(attackVector, ourPosition) {
        try {
            const pivotPrompt = `
Create professional defensive pivot responses for this attack:

**Opponent's Attack:** "${attackVector}"
**Our Position:** "${ourPosition}"

Generate 3 defensive pivot strategies:

1. **Acknowledge & Redirect** - Brief acknowledgment then immediate pivot to offense
2. **Dismiss & Attack** - Confident dismissal then counterattack
3. **Flip & Own** - Turn their attack into our strength

Each response must:
- Spend maximum 10 seconds on defense
- Pivot immediately to attacking them
- End with forward-looking action
- Use exact phrasing surrogates can memorize
- Include statistical backup where possible

Format as if writing for DNC daily talking points memo.
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a crisis communications specialist for political campaigns. Your expertise is in creating defensive responses that quickly pivot to offense and maintain message discipline."
                    },
                    { role: "user", content: pivotPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            return this.parsePivotStrategies(completion.choices[0].message.content);

        } catch (error) {
            console.error('Pivot Generation Error:', error);
            return this.getFallbackPivots(attackVector, ourPosition);
        }
    }

    // Build comprehensive tone analysis prompt
    buildTonePrompt(content, options) {
        return `
Analyze and optimize this talking point for maximum campaign effectiveness:

**Original Content:** "${content}"

**Optimization Parameters:**
- Message Type: ${options.messageType} (attack/defense/vision)
- Urgency Level: ${options.urgency} (low/medium/high/critical)
- Target Audience: ${options.targetAudience} (surrogates/media/public)
- Emotional Tone: ${options.emotionalTone} (measured/aggressive/inspiring)
- Platform: ${options.platform} (tv/radio/digital/print)

**Analysis Required:**

1. **Tone Assessment** (Current effectiveness 1-10)
2. **Language Power Audit** (Identify weak/strong words)
3. **Message Discipline Check** (How quotable/repeatable?)
4. **Emotional Impact Score** (Will it create visceral response?)
5. **Echo Chamber Potential** (Will surrogates use exact phrases?)

**Optimization Recommendations:**

Provide 3 enhanced versions:
- **Sharpened Attack** - Maximum aggression and impact
- **TV-Ready Quote** - Perfect for sound bite usage
- **Surrogate Script** - Exact phrases for message discipline

Each version must be immediately usable in today's news cycle and designed for coordinated surrogate repetition across media platforms.

Focus on creating the "echo chamber effect" where the same powerful phrases appear across multiple media appearances.
        `;
    }

    // Parse optimization results from AI
    parseOptimizationResults(aiResponse) {
        const sections = aiResponse.split(/(?:\*\*|\#\#)\s*/).filter(s => s.trim());

        return {
            originalScore: this.extractScore(aiResponse),
            analysis: {
                toneAssessment: this.extractSection(aiResponse, 'Tone Assessment'),
                languageAudit: this.extractSection(aiResponse, 'Language Power Audit'),
                messageDiscipline: this.extractSection(aiResponse, 'Message Discipline'),
                emotionalImpact: this.extractSection(aiResponse, 'Emotional Impact'),
                echoChamberPotential: this.extractSection(aiResponse, 'Echo Chamber')
            },
            optimizedVersions: {
                sharpenedAttack: this.extractVersion(aiResponse, 'Sharpened Attack'),
                tvReadyQuote: this.extractVersion(aiResponse, 'TV-Ready Quote'),
                surrogateScript: this.extractVersion(aiResponse, 'Surrogate Script')
            },
            recommendations: this.extractRecommendations(aiResponse),
            generatedAt: new Date().toISOString()
        };
    }

    // Parse sound bite results
    parseSoundBites(aiResponse) {
        return {
            attackVersion: this.extractQuote(aiResponse, 'Attack Version'),
            pivotVersion: this.extractQuote(aiResponse, 'Pivot Version'),
            visionVersion: this.extractQuote(aiResponse, 'Vision Version'),
            metadata: {
                wordCounts: this.calculateWordCounts(aiResponse),
                estimatedTiming: '8-12 seconds each',
                platform: 'TV-optimized'
            },
            generatedAt: new Date().toISOString()
        };
    }

    // Parse emotional analysis results
    parseEmotionalAnalysis(aiResponse) {
        return {
            scores: {
                emotionalStrength: this.extractScore(aiResponse, 'Emotional Language Strength'),
                visceralImpact: this.extractScore(aiResponse, 'Visceral Impact'),
                moralFraming: this.extractScore(aiResponse, 'Moral Framing'),
                urgencyLevel: this.extractScore(aiResponse, 'Urgency Level'),
                memorability: this.extractScore(aiResponse, 'Memorability')
            },
            impactWords: this.extractList(aiResponse, 'Visceral Impact Words'),
            recommendations: this.extractRecommendations(aiResponse),
            enhancedVersions: this.extractEnhancedVersions(aiResponse),
            generatedAt: new Date().toISOString()
        };
    }

    // Parse defensive pivot strategies
    parsePivotStrategies(aiResponse) {
        return {
            strategies: {
                acknowledgeRedirect: this.extractStrategy(aiResponse, 'Acknowledge & Redirect'),
                dismissAttack: this.extractStrategy(aiResponse, 'Dismiss & Attack'),
                flipOwn: this.extractStrategy(aiResponse, 'Flip & Own')
            },
            timing: '10 seconds maximum on defense',
            usage: 'Memorize exact phrases for message discipline',
            generatedAt: new Date().toISOString()
        };
    }

    // Parse press release analysis results
    parsePressReleaseAnalysis(aiResponse) {
        return {
            scores: {
                apStyleCompliance: this.extractScore(aiResponse, 'AP Style Compliance'),
                newsValue: this.extractScore(aiResponse, 'News Value Assessment'),
                mediaAppeal: this.extractScore(aiResponse, 'Media Appeal')
            },
            analysis: {
                headlineAnalysis: this.extractSection(aiResponse, 'Headline Analysis'),
                structureAssessment: this.extractSection(aiResponse, 'Structure Assessment'),
                quotabilityReview: this.extractSection(aiResponse, 'Quotable Content')
            },
            optimizedVersions: {
                newsFocused: this.extractVersion(aiResponse, 'News-Focused Version'),
                campaignFocused: this.extractVersion(aiResponse, 'Campaign-Focused Version')
            },
            recommendations: this.extractRecommendations(aiResponse),
            generatedAt: new Date().toISOString()
        };
    }

    // Parse press advisory optimization results
    parsePressAdvisoryOptimization(aiResponse) {
        return {
            scores: {
                logisticsCompleteness: this.extractScore(aiResponse, 'Logistics Completeness'),
                mediaAppeal: this.extractScore(aiResponse, 'Media Appeal Assessment'),
                timingAnalysis: this.extractScore(aiResponse, 'Timing Analysis')
            },
            analysis: {
                formatOptimization: this.extractSection(aiResponse, 'Format Optimization'),
                visualOpportunities: this.extractSection(aiResponse, 'Visual/photo opportunities'),
                exclusiveAngles: this.extractSection(aiResponse, 'Exclusive angles')
            },
            optimizedVersions: {
                highImpact: this.extractVersion(aiResponse, 'High-Impact Version'),
                professional: this.extractVersion(aiResponse, 'Professional Version')
            },
            recommendations: this.extractRecommendations(aiResponse),
            generatedAt: new Date().toISOString()
        };
    }

    // Helper methods for parsing AI responses
    extractScore(text, label = '') {
        const scoreRegex = new RegExp(`${label}.*?(\\d+(?:\\.\\d+)?(?:/10)?|\\d+(?:\\.\\d+)?\\s*(?:out of|/)\\s*10)`, 'i');
        const match = text.match(scoreRegex);
        if (match) {
            const score = match[1].replace(/\/10|out of 10/i, '').trim();
            return parseFloat(score);
        }
        return 7; // Default moderate score
    }

    extractSection(text, sectionName) {
        const regex = new RegExp(`\\*\\*${sectionName}[^*]*\\*\\*[^*]*([^*]+(?:\\*(?!\\*)[^*]+)*)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }

    extractVersion(text, versionName) {
        const regex = new RegExp(`\\*\\*${versionName}[^*]*\\*\\*[^*]*([^*]+(?:\\*(?!\\*)[^*]+)*)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }

    extractQuote(text, quoteName) {
        const regex = new RegExp(`\\*\\*${quoteName}[^*]*\\*\\*[^"]*"([^"]+)"`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }

    extractRecommendations(text) {
        const recommendations = [];
        const regex = /(?:•|-|\d+\.)\s*([^•\-\d\n]+)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            recommendations.push(match[1].trim());
        }
        return recommendations.slice(0, 5); // Limit to top 5
    }

    extractList(text, listName) {
        const section = this.extractSection(text, listName);
        return section.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    extractEnhancedVersions(text) {
        const versions = [];
        const regex = /(?:Enhanced Version|Version) (\d+)[:\s]*"([^"]+)"/gi;
        let match;
        while ((match = regex.exec(text)) !== null) {
            versions.push({
                level: parseInt(match[1]),
                content: match[2].trim()
            });
        }
        return versions;
    }

    extractStrategy(text, strategyName) {
        return {
            description: this.extractSection(text, strategyName),
            script: this.extractQuote(text, strategyName) || this.extractSection(text, strategyName)
        };
    }

    calculateWordCounts(text) {
        const quotes = text.match(/"([^"]+)"/g) || [];
        return quotes.map(quote => quote.replace(/"/g, '').split(' ').length);
    }

    // Fallback responses for when AI is unavailable
    getFallbackOptimization(content, options) {
        return {
            originalScore: 6,
            analysis: {
                toneAssessment: 'Moderate effectiveness, could be more impactful',
                languageAudit: 'Consider stronger emotional language',
                messageDiscipline: 'Structure for better quotability',
                emotionalImpact: 'Increase visceral response words',
                echoChamberPotential: 'Optimize for surrogate repetition'
            },
            optimizedVersions: {
                sharpenedAttack: `${content} - This is shameless and wrong.`,
                tvReadyQuote: `"${content}" - We must act now.`,
                surrogateScript: `Every surrogate should say: "${content}"`
            },
            recommendations: [
                'Add emotional impact words',
                'Create quotable closers',
                'Ensure message discipline',
                'Include statistical backup'
            ],
            generatedAt: new Date().toISOString()
        };
    }

    getFallbackSoundBites(content, duration) {
        return {
            attackVersion: `${content.substring(0, 100)}... This is wrong.`,
            pivotVersion: `That's false. The real issue is...`,
            visionVersion: `We will fight for what's right.`,
            metadata: {
                wordCounts: [15, 12, 10],
                estimatedTiming: '8-12 seconds each',
                platform: 'TV-optimized'
            },
            generatedAt: new Date().toISOString()
        };
    }

    getFallbackEmotionalAnalysis(content) {
        return {
            scores: {
                emotionalStrength: 6,
                visceralImpact: 5,
                moralFraming: 6,
                urgencyLevel: 5,
                memorability: 6
            },
            impactWords: ['important', 'significant', 'necessary'],
            recommendations: [
                'Use stronger emotional language',
                'Add moral framing',
                'Increase urgency'
            ],
            enhancedVersions: [
                { level: 1, content: content + ' This matters.' },
                { level: 2, content: content + ' This is wrong.' },
                { level: 3, content: content + ' This is shameless and dangerous.' }
            ],
            generatedAt: new Date().toISOString()
        };
    }

    getFallbackPivots(attackVector, ourPosition) {
        return {
            strategies: {
                acknowledgeRedirect: {
                    description: 'Acknowledge briefly then pivot to attack',
                    script: `That's false. The real issue is ${ourPosition}`
                },
                dismissAttack: {
                    description: 'Dismiss confidently then counterattack',
                    script: `That's completely wrong. What's really happening is ${ourPosition}`
                },
                flipOwn: {
                    description: 'Turn their attack into our strength',
                    script: `They attack us because they know ${ourPosition} is right`
                }
            },
            timing: '10 seconds maximum on defense',
            usage: 'Memorize exact phrases for message discipline',
            generatedAt: new Date().toISOString()
        };
    }

    getFallbackPressAnalysis(content, options) {
        return {
            scores: {
                apStyleCompliance: 7,
                newsValue: 6,
                mediaAppeal: 6
            },
            analysis: {
                headlineAnalysis: 'Headline could be stronger and more specific',
                structureAssessment: 'Lead paragraph should include more newsworthy elements',
                quotabilityReview: 'Add more compelling quotes from key stakeholders'
            },
            optimizedVersions: {
                newsFocused: `${content} - Enhanced for immediate news value`,
                campaignFocused: `${content} - Optimized for campaign messaging`
            },
            recommendations: [
                'Strengthen headline with specific details',
                'Lead with most newsworthy information',
                'Add compelling quotes',
                'Include statistical support',
                'Emphasize visual opportunities'
            ],
            generatedAt: new Date().toISOString()
        };
    }

    getFallbackAdvisoryOptimization(content, options) {
        return {
            scores: {
                logisticsCompleteness: 6,
                mediaAppeal: 7,
                timingAnalysis: 6
            },
            analysis: {
                formatOptimization: 'Structure for quick scanning by busy reporters',
                visualOpportunities: 'Emphasize photo and video opportunities',
                exclusiveAngles: 'Offer exclusive access or first interviews'
            },
            optimizedVersions: {
                highImpact: `URGENT MEDIA ALERT: ${content}`,
                professional: `PRESS ADVISORY: ${content}`
            },
            recommendations: [
                'Create urgent, compelling subject line',
                'Highlight visual opportunities',
                'Include parking and logistics details',
                'Offer exclusive interviews',
                'Provide multiple contact options'
            ],
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = new TalkingPointsToneAnalyzer();