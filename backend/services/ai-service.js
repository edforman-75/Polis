const OpenAI = require('openai');
const campaignIntel = require('../config/campaign-intelligence');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    // Main research function - uses campaign intelligence to provide context-aware responses
    async performResearch(query, context = {}) {
        try {
            // Determine the topic area using both query and content context
            const topic = this.detectTopic(query, context);

            // Get relevant campaign intelligence
            const intelligence = this.getRelevantIntelligence(topic, context);

            // Build the system prompt with campaign context
            const systemPrompt = this.buildSystemPrompt(intelligence, context);

            // Build messages array with conversation history
            let messages = [
                { role: "system", content: systemPrompt }
            ];

            // Add conversation history if available
            if (context.conversationHistory && context.conversationHistory.length > 0) {
                // Add recent conversation messages (last 6 to keep it manageable)
                const recentHistory = context.conversationHistory.slice(-6);
                messages = messages.concat(recentHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })));
            }

            // Add the current query
            messages.push({ role: "user", content: query });

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            });

            const response = completion.choices[0].message.content;

            // Extract actionable insights
            const actions = this.extractActions(response, topic);

            return {
                text: response,
                topic: topic,
                sources: this.generateSources(topic),
                actions: actions,
                metadata: {
                    model: "gpt-4-turbo-preview",
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('AI Service Error:', error);
            throw new Error('Failed to perform research');
        }
    }

    // Generate content with platform optimization
    async generateContent(type, params = {}) {
        const { platform, topic, tone, length } = params;

        // Get platform-specific strategy
        const platformStrategy = campaignIntel.platformStrategies[platform] || {};

        // Get appropriate prompt template
        const promptTemplate = campaignIntel.aiPromptTemplates[type] || campaignIntel.aiPromptTemplates.socialPost;

        // Build the prompt with campaign intelligence
        const prompt = this.buildContentPrompt(promptTemplate, {
            topic,
            platform,
            platformStrategy,
            tone: tone || campaignIntel.voiceGuidelines.tone,
            maxLength: length || platformStrategy.maxLength || 500
        });

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a skilled political communications strategist. Create compelling, authentic content that resonates with voters."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 1000
            });

            return {
                content: completion.choices[0].message.content,
                platform: platform,
                optimizations: this.getPlatformOptimizations(platform),
                metadata: {
                    type: type,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Content Generation Error:', error);
            throw new Error('Failed to generate content');
        }
    }

    // Analyze sentiment and provide strategic feedback
    async analyzeContent(content, context = {}) {
        const analysisPrompt = `
            Analyze this political content for effectiveness:
            "${content}"

            Consider:
            1. Tone and emotional appeal
            2. Clarity of message
            3. Call to action strength
            4. Potential negative interpretations
            5. Compliance with campaign guidelines

            Provide specific, actionable feedback.
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a campaign communications expert. Analyze content for political effectiveness and compliance."
                    },
                    { role: "user", content: analysisPrompt }
                ],
                temperature: 0.5,
                max_tokens: 500
            });

            const analysis = completion.choices[0].message.content;

            return {
                analysis: analysis,
                suggestions: this.extractSuggestions(analysis),
                riskLevel: this.assessRisk(content),
                complianceCheck: this.checkCompliance(content)
            };
        } catch (error) {
            console.error('Content Analysis Error:', error);
            throw new Error('Failed to analyze content');
        }
    }

    // Helper methods
    detectTopic(query, context = {}) {
        const q = query.toLowerCase();

        // Check document content first for topic context
        const content = (context.currentContent || '').toLowerCase();

        if (q.includes('veteran') || q.includes('military') || content.includes('veteran') || content.includes('military') || content.includes('veterans day')) return 'veterans';
        if (q.includes('health') || q.includes('medicare') || content.includes('health') || content.includes('medicare')) return 'healthcare';
        if (q.includes('job') || q.includes('economy') || content.includes('job') || content.includes('economy')) return 'economy';
        if (q.includes('education') || q.includes('school') || content.includes('education') || content.includes('school')) return 'education';
        if (q.includes('climate') || q.includes('environment') || content.includes('climate') || content.includes('environment')) return 'environment';
        return 'general';
    }

    getRelevantIntelligence(topic, context) {
        const intelligence = {
            messaging: campaignIntel.messagingFrameworks[topic] || campaignIntel.messagingFrameworks.economy,
            voice: campaignIntel.voiceGuidelines,
            audience: context.audience || 'general'
        };

        // Add audience-specific adjustments
        if (context.audience && campaignIntel.audienceSegments[context.audience]) {
            intelligence.audienceStrategy = campaignIntel.audienceSegments[context.audience];
        }

        return intelligence;
    }

    buildSystemPrompt(intelligence, context) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let systemPrompt = `You are a campaign research assistant providing information for political content creation.

IMPORTANT: Today's date is ${currentDate}. When referring to "this year" or current events, use 2025.

Key Messaging Themes: ${JSON.stringify(intelligence.messaging.primaryThemes)}
Tone: ${intelligence.voice.tone}
Reading Level: ${intelligence.voice.readingLevel}

CONTEXT ANALYSIS PRIORITY:
1. FIRST: Analyze any highlighted/selected text for immediate context
2. SECOND: Consider the full assignment content and document context
3. THIRD: Use conversation history to understand follow-up questions
4. FOURTH: Apply general knowledge

When providing information:
- Focus on local, concrete impacts
- Use accessible language
- Emphasize solutions and hope
- Include specific examples when possible
- Avoid partisan triggers
- Always be aware that we are in 2025
- CRITICAL: If the user asks contextual questions like "what date", "when", or "what year" - analyze the FULL CONTEXT of what they're working on to provide relevant answers

RESPONSE LENGTH REQUIREMENT:
- Keep ALL responses to 2-3 sentences maximum
- Be concise and actionable
- Avoid long explanations, lists, or detailed breakdowns
- Provide only the most essential information requested`;

        // Add conversation history for context
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            systemPrompt += `\n\nRECENT CONVERSATION CONTEXT:`;
            const recentMessages = context.conversationHistory.slice(-3); // Last 3 exchanges
            recentMessages.forEach(msg => {
                systemPrompt += `\n${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`;
            });
            systemPrompt += `\n\nWhen the user asks follow-up questions, consider this conversation context. For example, if discussing Veterans Day and they ask "what is the date this year", they likely mean Veterans Day 2025 (November 11, 2025).`;
        }

        // Add full document context first
        if (context.currentContent && context.currentContent.trim().length > 0) {
            systemPrompt += `\n\nFULL DOCUMENT CONTEXT: The user is working on content that includes: "${context.currentContent.substring(0, 500)}${context.currentContent.length > 500 ? '...' : ''}"`;
        }

        // Add assignment context
        if (context.assignment && context.assignment.title) {
            systemPrompt += `\n\nASSIGNMENT CONTEXT: Working on "${context.assignment.title}"`;
            if (context.assignment.brief) {
                systemPrompt += ` - ${context.assignment.brief.substring(0, 200)}${context.assignment.brief.length > 200 ? '...' : ''}`;
            }
        }

        // Add highlighted text context (priority)
        if (context.selectedText) {
            systemPrompt += `\n\nHIGHLIGHTED TEXT (PRIORITY): The user has specifically selected "${context.selectedText}" and is seeking research help about this topic. However, consider the full document context when answering questions.`;
        }

        if (context.contextType === 'selection') {
            systemPrompt += `\n\nTASK: Provide immediate, actionable information about the selected text. Keep responses concise (2-3 sentences max). Focus on specific facts, statistics, or details that can directly enhance the selected content. Avoid long lists or generic advice.`;
        }

        // Add instruction for contextual questions
        systemPrompt += `\n\nIMPORTANT: When answering questions about dates, times, or events, ALWAYS consider what the user is writing about in their document. For example, if they're writing about Veterans Day and ask "what is the date this year?", they likely want to know when Veterans Day 2025 occurs (November 11, 2025), not today's date.`;

        systemPrompt += `\n\nDetailed Context: ${JSON.stringify(context)}`;

        return systemPrompt;
    }

    buildContentPrompt(template, params) {
        let prompt = template;

        // Replace placeholders
        prompt = prompt.replace('[TOPIC]', params.topic);
        prompt = prompt.replace('[PLATFORM]', params.platform);

        // Add platform-specific constraints
        if (params.maxLength) {
            prompt += `\n\nMaximum length: ${params.maxLength} characters`;
        }

        if (params.platformStrategy) {
            prompt += `\n\nPlatform considerations: ${JSON.stringify(params.platformStrategy)}`;
        }

        return prompt;
    }

    extractActions(response, topic) {
        // Generate relevant actions based on response content
        const actions = [];

        if (response.includes('statistic') || response.includes('number')) {
            actions.push({
                type: 'insert_stat',
                label: 'Insert statistic',
                data: this.extractFirstNumber(response)
            });
        }

        if (topic === 'veterans' || response.includes('event')) {
            actions.push({
                type: 'create_event',
                label: 'Create event block',
                data: topic
            });
        }

        if (response.includes('quote') || response.includes('said')) {
            actions.push({
                type: 'create_quote',
                label: 'Create quote block',
                data: this.extractFirstQuote(response)
            });
        }

        actions.push({
            type: 'follow_up',
            label: 'Ask follow-up',
            data: `Tell me more about ${topic}`
        });

        return actions;
    }

    generateSources(topic) {
        const sourcesMap = {
            veterans: ['VA.gov', 'Veterans Administration', 'Bureau of Labor Statistics'],
            healthcare: ['CMS.gov', 'CDC', 'Health Policy Institute'],
            economy: ['Bureau of Labor Statistics', 'Federal Reserve', 'Commerce Department'],
            education: ['Department of Education', 'NEA', 'Local School Districts'],
            general: ['Government Accountability Office', 'Congressional Research Service']
        };

        return sourcesMap[topic] || sourcesMap.general;
    }

    getPlatformOptimizations(platform) {
        const strategy = campaignIntel.platformStrategies[platform];
        if (!strategy) return {};

        return {
            maxLength: strategy.maxLength,
            hashtagLimit: strategy.hashtagLimit,
            optimalTimes: strategy.optimalPostTime,
            visualStrategy: strategy.visualFirst || strategy.useImages,
            engagement: strategy.engagement
        };
    }

    extractSuggestions(analysis) {
        const suggestions = [];
        const lines = analysis.split('\n');

        lines.forEach(line => {
            if (line.includes('suggest') || line.includes('recommend') || line.includes('consider')) {
                suggestions.push(line.trim());
            }
        });

        return suggestions;
    }

    assessRisk(content) {
        const c = content.toLowerCase();

        // High risk indicators
        if (c.includes('guarantee') || c.includes('promise') || c.includes('definitely')) {
            return 'high';
        }

        // Medium risk indicators
        if (c.includes('attack') || c.includes('opponent') || c.includes('enemy')) {
            return 'medium';
        }

        // Check against avoid topics
        for (const framework of Object.values(campaignIntel.messagingFrameworks)) {
            if (framework.avoidTopics) {
                for (const avoid of framework.avoidTopics) {
                    if (c.includes(avoid.toLowerCase())) {
                        return 'medium';
                    }
                }
            }
        }

        return 'low';
    }

    checkCompliance(content) {
        const checks = {
            hasDisclaimer: false,
            lengthCompliant: true,
            toneAppropriate: true
        };

        // Check for required disclaimers
        const disclaimers = Object.values(campaignIntel.compliance.disclaimers);
        checks.hasDisclaimer = disclaimers.some(d => content.includes(d));

        // Check length constraints
        if (content.length > 5000) {
            checks.lengthCompliant = false;
        }

        // Basic tone check
        const inappropriateTones = ['hate', 'violence', 'discriminat'];
        checks.toneAppropriate = !inappropriateTones.some(t => content.toLowerCase().includes(t));

        return checks;
    }

    extractFirstNumber(text) {
        const match = text.match(/\d+,?\d*/);
        return match ? match[0] : null;
    }

    extractFirstQuote(text) {
        const match = text.match(/"([^"]*)"/);
        return match ? match[1] : null;
    }
}

module.exports = new AIService();