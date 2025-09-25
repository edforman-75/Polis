const express = require('express');
const router = express.Router();
const briefEnhancementAnalyzer = require('../services/brief-enhancement-analyzer');

// Enhanced brief analysis - combines strategic framework, content requirements, and event context
router.post('/analyze-brief', async (req, res) => {
    try {
        const { briefData } = req.body;

        if (!briefData) {
            return res.status(400).json({ error: 'Brief data is required' });
        }

        const enhancement = await briefEnhancementAnalyzer.enhanceBrief(briefData);

        res.json({
            success: true,
            enhancement,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Brief analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze brief',
            details: error.message
        });
    }
});

// Strategic framework analysis only
router.post('/analyze-strategic-framework', async (req, res) => {
    try {
        const { briefData } = req.body;

        if (!briefData) {
            return res.status(400).json({ error: 'Brief data is required' });
        }

        const strategic = await briefEnhancementAnalyzer.analyzeStrategicFramework(briefData);

        res.json({
            success: true,
            strategic,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Strategic framework analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze strategic framework',
            details: error.message
        });
    }
});

// Content requirements generation
router.post('/generate-content-requirements', async (req, res) => {
    try {
        const { briefData } = req.body;

        if (!briefData) {
            return res.status(400).json({ error: 'Brief data is required' });
        }

        const requirements = await briefEnhancementAnalyzer.generateContentRequirements(briefData);

        res.json({
            success: true,
            requirements,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Content requirements generation error:', error);
        res.status(500).json({
            error: 'Failed to generate content requirements',
            details: error.message
        });
    }
});

// Event context analysis
router.post('/analyze-event-context', async (req, res) => {
    try {
        const { eventData } = req.body;

        if (!eventData) {
            return res.status(400).json({ error: 'Event data is required' });
        }

        const eventAnalysis = await briefEnhancementAnalyzer.analyzeEventContext(eventData);

        res.json({
            success: true,
            eventAnalysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Event context analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze event context',
            details: error.message
        });
    }
});

// Generate professional brief templates
router.post('/generate-template', async (req, res) => {
    try {
        const { templateType } = req.body;

        if (!templateType) {
            return res.status(400).json({ error: 'Template type is required' });
        }

        const validTemplates = [
            'healthcare-policy',
            'crisis-response',
            'endorsement-announcement',
            'debate-prep',
            'press-conference',
            'town-hall',
            'policy-brief'
        ];

        if (!validTemplates.includes(templateType)) {
            return res.status(400).json({
                error: 'Invalid template type',
                validTypes: validTemplates
            });
        }

        const template = await briefEnhancementAnalyzer.generateBriefTemplate(templateType);

        res.json({
            success: true,
            template,
            templateType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({
            error: 'Failed to generate template',
            details: error.message
        });
    }
});

// Get available brief templates
router.get('/available-templates', (req, res) => {
    const templates = [
        {
            type: 'healthcare-policy',
            name: 'Healthcare Policy Speech',
            description: 'For healthcare policy announcements and speeches',
            icon: '🏥'
        },
        {
            type: 'crisis-response',
            name: 'Crisis Response',
            description: 'Rapid response during campaign emergencies',
            icon: '🚨'
        },
        {
            type: 'endorsement-announcement',
            name: 'Endorsement Announcement',
            description: 'Securing and announcing key endorsements',
            icon: '🤝'
        },
        {
            type: 'debate-prep',
            name: 'Debate Preparation',
            description: 'Preparing candidates for political debates',
            icon: '⚡'
        },
        {
            type: 'press-conference',
            name: 'Press Conference',
            description: 'Major announcements and media events',
            icon: '📺'
        },
        {
            type: 'town-hall',
            name: 'Town Hall Meeting',
            description: 'Community engagement events',
            icon: '🏛️'
        },
        {
            type: 'policy-brief',
            name: 'Policy Brief',
            description: 'Comprehensive policy analysis and position development',
            icon: '📋'
        }
    ];

    res.json({
        success: true,
        templates,
        totalTemplates: templates.length
    });
});

// Brief quality scoring and recommendations
router.post('/score-brief-quality', async (req, res) => {
    try {
        const { briefData } = req.body;

        if (!briefData) {
            return res.status(400).json({ error: 'Brief data is required' });
        }

        // Quick quality assessment
        const qualityFactors = {
            hasTitle: !!briefData.title,
            hasDescription: !!briefData.description && briefData.description.length > 50,
            hasAudience: !!briefData.audience,
            hasTone: !!briefData.tone,
            hasContext: !!briefData.context,
            hasDueDate: !!briefData.dueDate,
            hasKeyPoints: !!briefData.keyPoints && briefData.keyPoints.length > 0
        };

        const completedFactors = Object.values(qualityFactors).filter(Boolean).length;
        const totalFactors = Object.keys(qualityFactors).length;
        const completionScore = (completedFactors / totalFactors) * 100;

        const recommendations = [];
        if (!qualityFactors.hasTitle) recommendations.push("Add a clear, specific title");
        if (!qualityFactors.hasDescription) recommendations.push("Expand description with more details");
        if (!qualityFactors.hasAudience) recommendations.push("Define target audience");
        if (!qualityFactors.hasTone) recommendations.push("Specify communication tone");
        if (!qualityFactors.hasContext) recommendations.push("Add strategic context");
        if (!qualityFactors.hasDueDate) recommendations.push("Set clear deadline");
        if (!qualityFactors.hasKeyPoints) recommendations.push("List key points to cover");

        res.json({
            success: true,
            qualityScore: {
                overall: Math.round(completionScore),
                completedFactors,
                totalFactors,
                factors: qualityFactors
            },
            recommendations,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Brief quality scoring error:', error);
        res.status(500).json({
            error: 'Failed to score brief quality',
            details: error.message
        });
    }
});

// Policy brief analysis - specialized analysis for policy documents
router.post('/analyze-policy-brief', async (req, res) => {
    try {
        const { policyData } = req.body;

        if (!policyData) {
            return res.status(400).json({ error: 'Policy data is required' });
        }

        const policyAnalysis = await briefEnhancementAnalyzer.analyzePolicyBrief(policyData);

        res.json({
            success: true,
            policyAnalysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Policy brief analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze policy brief',
            details: error.message
        });
    }
});

// Test AI functionality
router.post('/test-ai', async (req, res) => {
    try {
        const testBrief = {
            title: "Healthcare Policy Announcement",
            description: "Announce new healthcare affordability plan",
            audience: "Healthcare workers and patients",
            tone: "Empathetic but determined",
            context: "Springfield Medical Center event"
        };

        const quickTest = await briefEnhancementAnalyzer.analyzeStrategicFramework(testBrief);

        res.json({
            success: true,
            message: 'Brief enhancement AI functionality is working',
            testResults: quickTest,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI test error:', error);
        res.status(500).json({
            error: 'Brief enhancement AI functionality test failed',
            details: error.message,
            fallbackAvailable: true
        });
    }
});

module.exports = router;