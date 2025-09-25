const express = require('express');
const router = express.Router();
const grammarService = require('../services/grammar-service');
const aiService = require('../services/ai-service');
const { requireAuth } = require('../middleware/auth');

// Grammar check endpoint
router.post('/grammar-check', requireAuth, async (req, res) => {
    try {
        const { text, context } = req.body;

        if (!text || text.trim().length === 0) {
            return res.json({
                score: 0,
                issues: [],
                overallFeedback: "No content to analyze",
                readabilityScore: 0,
                politicalTone: "unclear",
                wordCount: 0,
                characterCount: 0
            });
        }

        const grammarAnalysis = await grammarService.checkGrammar(text, context);

        res.json(grammarAnalysis);

    } catch (error) {
        console.error('Grammar check error:', error);
        res.status(500).json({ error: 'Failed to check grammar' });
    }
});

// Compliance check endpoint
router.post('/compliance-check', requireAuth, async (req, res) => {
    try {
        const { text, contentType } = req.body;

        const complianceAnalysis = await grammarService.checkCompliance(text);

        res.json(complianceAnalysis);

    } catch (error) {
        console.error('Compliance check error:', error);
        res.status(500).json({ error: 'Failed to check compliance' });
    }
});

// Schema completeness check
router.post('/schema-check', requireAuth, async (req, res) => {
    try {
        const { blocks } = req.body;

        const schemaAnalysis = grammarService.analyzeSchemaCompleteness(blocks);

        res.json(schemaAnalysis);

    } catch (error) {
        console.error('Schema check error:', error);
        res.status(500).json({ error: 'Failed to analyze schema completeness' });
    }
});

// Voice consistency check endpoint
router.post('/voice-check', requireAuth, async (req, res) => {
    try {
        const { text, candidateProfile } = req.body;

        if (!text || text.trim().length === 0) {
            return res.json({
                voiceScore: 0,
                authenticity: "unclear",
                issues: [],
                strengths: [],
                improvements: ["No content to analyze"]
            });
        }

        const voiceAnalysis = await grammarService.checkVoiceConsistency(text, candidateProfile);

        res.json(voiceAnalysis);

    } catch (error) {
        console.error('Voice check error:', error);
        res.status(500).json({ error: 'Failed to check voice consistency' });
    }
});

// Comprehensive content analysis
router.post('/analyze', requireAuth, async (req, res) => {
    try {
        const { text, blocks, context } = req.body;

        // Run all analyses in parallel
        const [grammarAnalysis, complianceAnalysis, schemaAnalysis, voiceAnalysis] = await Promise.all([
            grammarService.checkGrammar(text, context),
            grammarService.checkCompliance(text),
            grammarService.analyzeSchemaCompleteness(blocks || []),
            grammarService.checkVoiceConsistency(text, context.candidateProfile)
        ]);

        // Calculate overall quality score
        const scores = {
            grammar: grammarAnalysis.score,
            compliance: complianceAnalysis.compliant ? 100 : complianceAnalysis.riskLevel === 'low' ? 80 : complianceAnalysis.riskLevel === 'medium' ? 60 : 40,
            schema: schemaAnalysis.completeness,
            readability: grammarAnalysis.readabilityScore,
            voice: voiceAnalysis.voiceScore
        };

        const overallScore = Math.round(
            (scores.grammar * 0.3 + scores.compliance * 0.15 + scores.schema * 0.15 + scores.readability * 0.15 + scores.voice * 0.25)
        );

        res.json({
            overallScore,
            scores,
            grammar: grammarAnalysis,
            compliance: complianceAnalysis,
            schema: schemaAnalysis,
            voice: voiceAnalysis,
            recommendations: generateRecommendations(grammarAnalysis, complianceAnalysis, schemaAnalysis, voiceAnalysis)
        });

    } catch (error) {
        console.error('Content analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze content' });
    }
});

// Fact-checking endpoint (enhanced research)
router.post('/fact-check', requireAuth, async (req, res) => {
    try {
        const { text, claims } = req.body;

        // Use AI service to fact-check specific claims
        const factCheckPrompt = `Fact-check these claims from campaign content:

Claims to verify:
${claims ? claims.map(claim => `- ${claim}`).join('\n') : `Text: "${text}"`}

For each claim, provide:
1. Verifiability (can this be fact-checked?)
2. Source recommendations (where to verify)
3. Risk level (high/medium/low if unverified)
4. Suggested modifications if needed

Focus on:
- Statistical claims
- Policy statements
- Historical references
- Comparative statements`;

        const factCheckResult = await aiService.performResearch(factCheckPrompt, {
            contextType: 'fact-check'
        });

        res.json({
            analysis: factCheckResult.text,
            sources: factCheckResult.sources,
            riskAssessment: extractRiskLevel(factCheckResult.text),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Fact-check error:', error);
        res.status(500).json({ error: 'Failed to fact-check content' });
    }
});

// Content enhancement suggestions
router.post('/enhance', requireAuth, async (req, res) => {
    try {
        const { text, blocks, targetAudience, platform } = req.body;

        const enhancementPrompt = `Analyze this campaign content and suggest improvements:

Content: "${text}"
Target Audience: ${targetAudience || 'general voters'}
Platform: ${platform || 'general'}

Provide specific suggestions for:
1. Message clarity and impact
2. Call-to-action effectiveness
3. Emotional resonance
4. Missing information that would strengthen the message
5. Schema/structured data opportunities

Keep suggestions practical and campaign-focused.`;

        const enhancementResult = await aiService.performResearch(enhancementPrompt, {
            contextType: 'enhancement',
            audience: targetAudience,
            platform: platform
        });

        res.json({
            suggestions: parseEnhancementSuggestions(enhancementResult.text),
            rawAnalysis: enhancementResult.text,
            actions: enhancementResult.actions,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Content enhancement error:', error);
        res.status(500).json({ error: 'Failed to generate enhancement suggestions' });
    }
});

// Helper functions
function generateRecommendations(grammar, compliance, schema, voice) {
    const recommendations = [];

    if (grammar.score < 80) {
        recommendations.push({
            type: 'grammar',
            priority: 'high',
            message: 'Review grammar and style suggestions to improve clarity',
            action: 'review_grammar'
        });
    }

    if (!compliance.compliant) {
        recommendations.push({
            type: 'compliance',
            priority: 'high',
            message: 'Address compliance issues before publishing',
            action: 'fix_compliance'
        });
    }

    if (schema.completeness < 70) {
        recommendations.push({
            type: 'schema',
            priority: 'medium',
            message: 'Complete missing schema data for better SEO and organization',
            action: 'complete_schema'
        });
    }

    if (grammar.readabilityScore < 70) {
        recommendations.push({
            type: 'readability',
            priority: 'medium',
            message: 'Simplify language for better voter accessibility',
            action: 'improve_readability'
        });
    }

    if (voice && voice.voiceScore < 75) {
        recommendations.push({
            type: 'voice',
            priority: 'high',
            message: 'Review content for authentic candidate voice and tone',
            action: 'improve_voice'
        });
    }

    if (voice && voice.authenticity === 'low') {
        recommendations.push({
            type: 'authenticity',
            priority: 'high',
            message: 'Content may not sound authentic to the candidate - review tone and language',
            action: 'enhance_authenticity'
        });
    }

    return recommendations;
}

function extractRiskLevel(analysisText) {
    const text = analysisText.toLowerCase();
    if (text.includes('high risk') || text.includes('unverifiable')) return 'high';
    if (text.includes('medium risk') || text.includes('needs verification')) return 'medium';
    return 'low';
}

function parseEnhancementSuggestions(analysisText) {
    // Simple parsing of AI suggestions - in production, this could be more sophisticated
    const lines = analysisText.split('\n').filter(line => line.trim());
    const suggestions = [];

    lines.forEach((line, index) => {
        if (line.match(/^\d+\./) || line.includes('suggest') || line.includes('consider')) {
            suggestions.push({
                id: index,
                text: line.trim(),
                category: extractCategory(line),
                priority: extractPriority(line)
            });
        }
    });

    return suggestions;
}

function extractCategory(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('clarity') || lowerText.includes('clear')) return 'clarity';
    if (lowerText.includes('call-to-action') || lowerText.includes('cta')) return 'cta';
    if (lowerText.includes('emotional') || lowerText.includes('emotion')) return 'emotional';
    if (lowerText.includes('schema') || lowerText.includes('structure')) return 'schema';
    return 'general';
}

function extractPriority(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('important') || lowerText.includes('critical')) return 'high';
    if (lowerText.includes('should') || lowerText.includes('recommend')) return 'medium';
    return 'low';
}

module.exports = router;