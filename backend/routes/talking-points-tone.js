const express = require('express');
const router = express.Router();
const talkingPointsToneAnalyzer = require('../services/talking-points-tone-analyzer');

// Optimize talking points tone for maximum impact
router.post('/optimize-tone', async (req, res) => {
    try {
        const {
            content,
            messageType = 'attack',
            urgency = 'high',
            targetAudience = 'surrogates',
            emotionalTone = 'aggressive',
            platform = 'tv'
        } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const optimization = await talkingPointsToneAnalyzer.optimizeTone(content, {
            messageType,
            urgency,
            targetAudience,
            emotionalTone,
            platform
        });

        res.json({
            success: true,
            optimization,
            originalContent: content,
            options: {
                messageType,
                urgency,
                targetAudience,
                emotionalTone,
                platform
            }
        });

    } catch (error) {
        console.error('Tone optimization error:', error);
        res.status(500).json({
            error: 'Failed to optimize tone',
            details: error.message
        });
    }
});

// Generate TV-ready sound bites
router.post('/generate-soundbites', async (req, res) => {
    try {
        const { content, duration = '10-second' } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const soundBites = await talkingPointsToneAnalyzer.generateSoundBites(content, duration);

        res.json({
            success: true,
            soundBites,
            originalContent: content,
            duration
        });

    } catch (error) {
        console.error('Sound bite generation error:', error);
        res.status(500).json({
            error: 'Failed to generate sound bites',
            details: error.message
        });
    }
});

// Analyze emotional impact of messaging
router.post('/analyze-emotional-impact', async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const analysis = await talkingPointsToneAnalyzer.analyzeEmotionalImpact(content);

        res.json({
            success: true,
            analysis,
            originalContent: content
        });

    } catch (error) {
        console.error('Emotional impact analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze emotional impact',
            details: error.message
        });
    }
});

// Create defensive pivot responses
router.post('/create-defensive-pivots', async (req, res) => {
    try {
        const { attackVector, ourPosition } = req.body;

        if (!attackVector || !ourPosition) {
            return res.status(400).json({
                error: 'Both attackVector and ourPosition are required'
            });
        }

        const pivots = await talkingPointsToneAnalyzer.createDefensivePivots(attackVector, ourPosition);

        res.json({
            success: true,
            pivots,
            attackVector,
            ourPosition
        });

    } catch (error) {
        console.error('Defensive pivot creation error:', error);
        res.status(500).json({
            error: 'Failed to create defensive pivots',
            details: error.message
        });
    }
});

// Comprehensive analysis - combines multiple AI tools
router.post('/comprehensive-analysis', async (req, res) => {
    try {
        const {
            content,
            attackVector,
            ourPosition,
            messageType = 'attack',
            urgency = 'high',
            targetAudience = 'surrogates',
            emotionalTone = 'aggressive',
            platform = 'tv'
        } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Run multiple analyses in parallel for efficiency
        const [
            toneOptimization,
            soundBites,
            emotionalAnalysis,
            defensivePivots
        ] = await Promise.all([
            talkingPointsToneAnalyzer.optimizeTone(content, {
                messageType, urgency, targetAudience, emotionalTone, platform
            }),
            talkingPointsToneAnalyzer.generateSoundBites(content, '10-second'),
            talkingPointsToneAnalyzer.analyzeEmotionalImpact(content),
            attackVector && ourPosition
                ? talkingPointsToneAnalyzer.createDefensivePivots(attackVector, ourPosition)
                : null
        ]);

        const comprehensiveResults = {
            overview: {
                originalContent: content,
                analysisDate: new Date().toISOString(),
                overallEffectivenessScore: toneOptimization.originalScore || 7,
                recommendations: [
                    ...toneOptimization.recommendations || [],
                    ...emotionalAnalysis.recommendations || []
                ].slice(0, 8) // Top 8 recommendations
            },
            toneOptimization,
            soundBites,
            emotionalAnalysis,
            defensivePivots,
            readyToUse: {
                bestAttackLine: toneOptimization.optimizedVersions?.sharpenedAttack || soundBites.attackVersion,
                bestTVQuote: toneOptimization.optimizedVersions?.tvReadyQuote || soundBites.pivotVersion,
                surrogateScript: toneOptimization.optimizedVersions?.surrogateScript,
                defensiveResponse: defensivePivots?.strategies?.acknowledgeRedirect?.script
            }
        };

        res.json({
            success: true,
            results: comprehensiveResults,
            processingTime: 'Analysis completed'
        });

    } catch (error) {
        console.error('Comprehensive analysis error:', error);
        res.status(500).json({
            error: 'Failed to complete comprehensive analysis',
            details: error.message
        });
    }
});

// Get tone optimization suggestions
router.get('/tone-suggestions', (req, res) => {
    const suggestions = {
        messageTypes: [
            { value: 'attack', label: 'Attack', description: 'Direct criticism and offensive messaging' },
            { value: 'defense', label: 'Defense', description: 'Defensive responses and rebuttals' },
            { value: 'vision', label: 'Vision', description: 'Forward-looking inspirational messaging' },
            { value: 'pivot', label: 'Pivot', description: 'Redirect conversation to favorable topics' }
        ],
        urgencyLevels: [
            { value: 'low', label: 'Low', description: 'Standard messaging cadence' },
            { value: 'medium', label: 'Medium', description: 'Heightened attention needed' },
            { value: 'high', label: 'High', description: 'Immediate response required' },
            { value: 'critical', label: 'Critical', description: 'Breaking news/crisis response' }
        ],
        targetAudiences: [
            { value: 'surrogates', label: 'Surrogates', description: 'Campaign representatives and spokespeople' },
            { value: 'media', label: 'Media', description: 'Journalists and news outlets' },
            { value: 'public', label: 'Public', description: 'General voters and constituents' },
            { value: 'donors', label: 'Donors', description: 'Financial supporters and fundraising' }
        ],
        emotionalTones: [
            { value: 'measured', label: 'Measured', description: 'Calm, factual, diplomatic' },
            { value: 'aggressive', label: 'Aggressive', description: 'Strong, confrontational, urgent' },
            { value: 'inspiring', label: 'Inspiring', description: 'Uplifting, hopeful, motivating' },
            { value: 'authoritative', label: 'Authoritative', description: 'Confident, commanding, decisive' }
        ],
        platforms: [
            { value: 'tv', label: 'TV', description: 'Television interviews and appearances' },
            { value: 'radio', label: 'Radio', description: 'Radio shows and podcasts' },
            { value: 'digital', label: 'Digital', description: 'Social media and online content' },
            { value: 'print', label: 'Print', description: 'Newspapers and written statements' }
        ],
        powerWords: {
            attack: ['shameless', 'corrupt', 'betrayal', 'reckless', 'dangerous', 'failed', 'broken'],
            moral: ['wrong', 'immoral', 'unethical', 'unconscionable', 'unjust', 'unfair'],
            urgency: ['crisis', 'emergency', 'urgent', 'immediate', 'now', 'today', 'must'],
            scale: ['historic', 'unprecedented', 'massive', 'devastating', 'overwhelming', 'catastrophic'],
            positive: ['hope', 'progress', 'future', 'together', 'strong', 'united', 'forward']
        }
    };

    res.json(suggestions);
});

// Analyze press release for AP style and news value
router.post('/analyze-press-release', async (req, res) => {
    try {
        const {
            content,
            headline = '',
            targetMedia = 'general',
            newsValue = 'moderate'
        } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const analysis = await talkingPointsToneAnalyzer.analyzePressRelease(content, {
            headline,
            targetMedia,
            newsValue
        });

        res.json({
            success: true,
            analysis,
            originalContent: content,
            options: {
                headline,
                targetMedia,
                newsValue
            }
        });

    } catch (error) {
        console.error('Press release analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze press release',
            details: error.message
        });
    }
});

// Optimize press advisory for media logistics and appeal
router.post('/optimize-press-advisory', async (req, res) => {
    try {
        const {
            content,
            eventType = 'announcement',
            targetMedia = 'local',
            visualOpportunity = 'moderate'
        } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const optimization = await talkingPointsToneAnalyzer.optimizePressAdvisory(content, {
            eventType,
            targetMedia,
            visualOpportunity
        });

        res.json({
            success: true,
            optimization,
            originalContent: content,
            options: {
                eventType,
                targetMedia,
                visualOpportunity
            }
        });

    } catch (error) {
        console.error('Press advisory optimization error:', error);
        res.status(500).json({
            error: 'Failed to optimize press advisory',
            details: error.message
        });
    }
});

// Test endpoint for AI functionality
router.post('/test-ai', async (req, res) => {
    try {
        const testContent = "This policy will hurt working families";

        const quickTest = await talkingPointsToneAnalyzer.optimizeTone(testContent, {
            messageType: 'attack',
            urgency: 'high',
            targetAudience: 'surrogates',
            emotionalTone: 'aggressive',
            platform: 'tv'
        });

        res.json({
            success: true,
            message: 'AI functionality is working',
            testResults: quickTest,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI test error:', error);
        res.status(500).json({
            error: 'AI functionality test failed',
            details: error.message,
            fallbackAvailable: true
        });
    }
});

module.exports = router;