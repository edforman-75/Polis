const OpenAI = require('openai');

class GrammarService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    // Check grammar and provide suggestions
    async checkGrammar(text, context = {}) {
        try {
            const prompt = `You are a grammar and style checker for political campaign content.

Analyze this text for:
1. Grammar errors
2. Spelling mistakes
3. Style improvements for political communication
4. Readability and clarity
5. Tone appropriateness for campaign content
6. Voice consistency with candidate personality and campaign messaging

Text to check: "${text}"

Return a JSON response with:
{
    "score": 0-100,
    "issues": [
        {
            "type": "grammar|spelling|style|readability|tone|voice",
            "severity": "error|warning|suggestion",
            "message": "Description of the issue",
            "suggestion": "Suggested correction",
            "start": characterStartPosition,
            "end": characterEndPosition,
            "original": "original text",
            "replacement": "suggested replacement"
        }
    ],
    "overallFeedback": "Brief summary of main improvements needed",
    "readabilityScore": 0-100,
    "politicalTone": "appropriate|too_formal|too_casual|unclear",
    "voiceConsistency": 0-100
}

Focus on:
- Clear, accessible language for voters
- Active voice when possible
- Avoiding jargon or overly technical terms
- Maintaining professional but approachable tone
- Ensuring compliance with political communication standards
- Voice consistency: authentic, relatable, and matching candidate's established communication style
- Consistent messaging tone across all content types
- Personal connection while maintaining authority and trustworthiness`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert grammar checker and political communications editor. Always return valid JSON."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            const response = completion.choices[0].message.content;

            // Parse JSON response
            let grammarAnalysis;
            try {
                grammarAnalysis = JSON.parse(response);
            } catch (parseError) {
                // Fallback if JSON parsing fails
                grammarAnalysis = this.fallbackGrammarCheck(text);
            }

            return {
                ...grammarAnalysis,
                timestamp: new Date().toISOString(),
                wordCount: text.split(/\s+/).length,
                characterCount: text.length,
                voiceConsistency: grammarAnalysis.voiceConsistency || 85
            };

        } catch (error) {
            console.error('Grammar Service Error:', error);
            // Return fallback analysis
            return this.fallbackGrammarCheck(text);
        }
    }

    // Fallback grammar checking for when AI is unavailable
    fallbackGrammarCheck(text) {
        const issues = [];
        const words = text.split(/\s+/);

        // Basic checks
        if (text.length === 0) {
            return {
                score: 0,
                issues: [],
                overallFeedback: "No content to analyze",
                readabilityScore: 0,
                politicalTone: "unclear",
                wordCount: 0,
                characterCount: 0
            };
        }

        // Check for very long sentences
        const sentences = text.split(/[.!?]+/);
        sentences.forEach((sentence, index) => {
            if (sentence.trim().split(/\s+/).length > 25) {
                issues.push({
                    type: "readability",
                    severity: "warning",
                    message: "Consider breaking this long sentence into shorter ones for better readability",
                    suggestion: "Split into multiple sentences",
                    start: 0,
                    end: sentence.length,
                    original: sentence.trim(),
                    replacement: sentence.trim() + " [Consider breaking this up]"
                });
            }
        });

        // Basic political communication checks
        const formalWords = ['utilize', 'facilitate', 'commence', 'aforementioned'];
        formalWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                issues.push({
                    type: "style",
                    severity: "suggestion",
                    message: `Consider using simpler language instead of "${word}"`,
                    suggestion: word === 'utilize' ? 'use' : word === 'facilitate' ? 'help' : word === 'commence' ? 'start' : 'this',
                    start: text.indexOf(word),
                    end: text.indexOf(word) + word.length,
                    original: word,
                    replacement: word === 'utilize' ? 'use' : word === 'facilitate' ? 'help' : word === 'commence' ? 'start' : 'this'
                });
            }
        });

        // Calculate basic scores
        const score = Math.max(0, 100 - (issues.length * 10));
        const readabilityScore = Math.max(0, 100 - (words.length > 20 ? (words.length - 20) * 2 : 0));

        return {
            score: score,
            issues: issues,
            overallFeedback: issues.length === 0 ? "Content looks good!" : `Found ${issues.length} potential improvements`,
            readabilityScore: readabilityScore,
            politicalTone: words.length > 10 ? "appropriate" : "unclear",
            voiceConsistency: Math.max(60, 100 - (issues.length * 5)), // Basic voice score
            wordCount: words.length,
            characterCount: text.length
        };
    }

    // Check for campaign compliance issues
    async checkCompliance(text) {
        const issues = [];

        // Check for required disclaimers
        const hasDisclaimer = /paid for by|authorized by/i.test(text);
        if (!hasDisclaimer && text.length > 200) {
            issues.push({
                type: "compliance",
                severity: "warning",
                message: "Consider adding campaign disclaimer for longer content",
                suggestion: "Add 'Paid for by [Campaign Name]' if this will be published"
            });
        }

        // Check for potentially problematic claims
        const strongClaims = /guarantee|promise|definitely will|absolutely/gi;
        const matches = text.match(strongClaims);
        if (matches) {
            issues.push({
                type: "compliance",
                severity: "warning",
                message: "Strong claims may require fact verification",
                suggestion: "Consider softer language like 'will work to' or 'plans to'"
            });
        }

        return {
            compliant: issues.length === 0,
            issues: issues,
            riskLevel: issues.length === 0 ? 'low' : issues.length < 3 ? 'medium' : 'high'
        };
    }

    // Analyze schema completeness
    analyzeSchemaCompleteness(blocks) {
        const analysis = {
            total: blocks.length,
            withSchema: 0,
            missing: [],
            suggestions: []
        };

        blocks.forEach((block, index) => {
            switch (block.type) {
                case 'event':
                    if (!block.data?.date || !block.data?.location) {
                        analysis.missing.push({
                            block: index,
                            type: 'event',
                            missing: !block.data?.date ? 'date' : 'location',
                            suggestion: `Add ${!block.data?.date ? 'event date' : 'location'} for better SEO and schema markup`
                        });
                    } else {
                        analysis.withSchema++;
                    }
                    break;
                case 'quote':
                    if (!block.data?.author) {
                        analysis.missing.push({
                            block: index,
                            type: 'quote',
                            missing: 'author',
                            suggestion: 'Add quote attribution for credibility and schema markup'
                        });
                    } else {
                        analysis.withSchema++;
                    }
                    break;
                case 'policy':
                    if (!block.data?.title || !block.data?.audience) {
                        analysis.missing.push({
                            block: index,
                            type: 'policy',
                            missing: !block.data?.title ? 'title' : 'audience',
                            suggestion: `Add ${!block.data?.title ? 'policy title' : 'target audience'} for better organization`
                        });
                    } else {
                        analysis.withSchema++;
                    }
                    break;
                default:
                    // Text blocks don't require schema
                    analysis.withSchema++;
            }
        });

        analysis.completeness = analysis.total === 0 ? 100 : Math.round((analysis.withSchema / analysis.total) * 100);

        return analysis;
    }

    // Dedicated voice consistency check
    async checkVoiceConsistency(text, candidateProfile = {}) {
        try {
            const voicePrompt = `Analyze this political content for voice consistency and authenticity:

Text: "${text}"

Candidate Profile:
- Communication Style: ${candidateProfile.style || 'Professional yet approachable, authentic, connects with working families'}
- Key Values: ${candidateProfile.values || 'Community, service, practical solutions, unity over division'}
- Background: ${candidateProfile.background || 'Public servant with grassroots experience'}
- Tone Preferences: ${candidateProfile.tone || 'Hopeful, determined, inclusive, down-to-earth'}

Evaluate:
1. Does this sound like the candidate would actually say it?
2. Is the tone consistent with their established voice?
3. Does it reflect their values and communication style?
4. Would voters recognize this as authentic to the candidate?
5. Any specific phrases that feel inauthentic or off-brand?

Return JSON:
{
    "voiceScore": 0-100,
    "authenticity": "high|medium|low",
    "issues": [
        {
            "type": "tone|authenticity|values|style",
            "message": "Issue description",
            "suggestion": "How to make it more authentic"
        }
    ],
    "strengths": ["What works well for the candidate's voice"],
    "improvements": ["Specific suggestions to enhance authenticity"]
}`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a political communications expert specializing in candidate voice and authenticity. Always return valid JSON."
                    },
                    { role: "user", content: voicePrompt }
                ],
                temperature: 0.4,
                max_tokens: 1000
            });

            const response = completion.choices[0].message.content;

            try {
                const voiceAnalysis = JSON.parse(response);
                return {
                    ...voiceAnalysis,
                    timestamp: new Date().toISOString()
                };
            } catch (parseError) {
                // Fallback voice analysis
                return {
                    voiceScore: 75,
                    authenticity: "medium",
                    issues: [],
                    strengths: ["Clear communication"],
                    improvements: ["Review for authentic candidate voice"],
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('Voice check error:', error);
            return {
                voiceScore: 75,
                authenticity: "medium",
                issues: [],
                strengths: [],
                improvements: ["Unable to analyze voice - try again"],
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new GrammarService();