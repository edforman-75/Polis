const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const { EditorialAIAssistant } = require('../services/editorial-ai-assistant');

const aiAssistant = new EditorialAIAssistant();

// Pre-process content when submitted by writer
router.post('/preprocess', requireAuth, requirePermission('content.edit'), async (req, res) => {
    try {
        const { content, contentType, metadata } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const results = await aiAssistant.preProcessContent(content, contentType, metadata);

        res.json({
            success: true,
            results,
            metadata: {
                processedBy: req.user.name,
                processedAt: new Date().toISOString(),
                userId: req.user.id
            }
        });

    } catch (error) {
        console.error('Error in content preprocessing:', error);
        res.status(500).json({ error: 'Failed to preprocess content' });
    }
});

// Apply direct edits (Press Secretary primary tool)
router.post('/direct-edit', requireAuth, requirePermission('press_releases.approve'), async (req, res) => {
    try {
        const { content, editType, options } = req.body;

        if (!content || !editType) {
            return res.status(400).json({ error: 'Content and editType are required' });
        }

        const result = await aiAssistant.applyDirectEdits(content, editType, options);

        if (result.success) {
            res.json({
                success: true,
                result,
                metadata: {
                    editedBy: req.user.name,
                    editedAt: new Date().toISOString(),
                    editType: editType
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Edit failed',
                original: result.original
            });
        }

    } catch (error) {
        console.error('Error in direct editing:', error);
        res.status(500).json({ error: 'Failed to apply direct edit' });
    }
});

// Apply quick fixes (one-click improvements)
router.post('/quick-fix', requireAuth, requirePermission('content.edit'), async (req, res) => {
    try {
        const { content, fixType } = req.body;

        if (!content || !fixType) {
            return res.status(400).json({ error: 'Content and fixType are required' });
        }

        const result = await aiAssistant.applyQuickFix(content, fixType);

        res.json({
            success: true,
            result,
            metadata: {
                fixedBy: req.user.name,
                fixedAt: new Date().toISOString(),
                fixType: fixType
            }
        });

    } catch (error) {
        console.error('Error in quick fix:', error);
        res.status(500).json({ error: 'Failed to apply quick fix' });
    }
});

// Get media readiness score
router.post('/readiness-score', requireAuth, requirePermission('content.read'), async (req, res) => {
    try {
        const { content, contentType } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const score = await aiAssistant.calculateMediaReadiness(content, contentType);

        res.json({
            success: true,
            score,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error calculating readiness score:', error);
        res.status(500).json({ error: 'Failed to calculate readiness score' });
    }
});

// Get available AI capabilities based on user role
router.get('/capabilities', requireAuth, async (req, res) => {
    try {
        const userRole = req.user.role;
        const capabilities = aiAssistant.capabilities;
        const workflow = aiAssistant.workflow;

        // Filter capabilities based on user permissions
        const availableCapabilities = {};

        // Direct editing capabilities (mainly for Press Secretary and Senior roles)
        if (['press_secretary', 'communications_director', 'senior_writer'].includes(userRole)) {
            availableCapabilities.directEditing = capabilities.directEditing;
        }

        // Quick fixes available to most content editors
        if (req.user.permissions && req.user.permissions.includes('content.edit')) {
            availableCapabilities.quickFixes = capabilities.quickFixes;
        }

        // Pre-processing available to all content creators
        availableCapabilities.preProcessing = capabilities.preProcessing;

        // Consistency tools available to senior roles
        if (['press_secretary', 'communications_director', 'campaign_manager'].includes(userRole)) {
            availableCapabilities.consistency = capabilities.consistency;
        }

        res.json({
            success: true,
            capabilities: availableCapabilities,
            workflow: workflow,
            userRole: userRole,
            recommendations: {
                primaryTools: this.getPrimaryToolsForRole(userRole),
                quickToolbar: workflow.quickToolbar
            }
        });

    } catch (error) {
        console.error('Error fetching AI capabilities:', error);
        res.status(500).json({ error: 'Failed to fetch AI capabilities' });
    }
});

// Batch processing for multiple quick fixes
router.post('/batch-fixes', requireAuth, requirePermission('content.edit'), async (req, res) => {
    try {
        const { content, fixTypes } = req.body;

        if (!content || !Array.isArray(fixTypes)) {
            return res.status(400).json({ error: 'Content and fixTypes array are required' });
        }

        let processed = content;
        const results = [];

        for (const fixType of fixTypes) {
            try {
                const result = await aiAssistant.applyQuickFix(processed, fixType);
                if (result.changed) {
                    processed = result.edited;
                    results.push({
                        fixType,
                        success: true,
                        applied: true
                    });
                } else {
                    results.push({
                        fixType,
                        success: true,
                        applied: false,
                        reason: 'No changes needed'
                    });
                }
            } catch (error) {
                results.push({
                    fixType,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            original: content,
            processed: processed,
            changed: processed !== content,
            fixes: results,
            metadata: {
                processedBy: req.user.name,
                processedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error in batch processing:', error);
        res.status(500).json({ error: 'Failed to apply batch fixes' });
    }
});

// Check content consistency against previous content
router.post('/consistency-check', requireAuth, requirePermission('content.approve'), async (req, res) => {
    try {
        const { content, metadata } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const consistency = await aiAssistant.checkConsistency(content, metadata);

        res.json({
            success: true,
            consistency,
            checkedAt: new Date().toISOString(),
            checkedBy: req.user.name
        });

    } catch (error) {
        console.error('Error in consistency check:', error);
        res.status(500).json({ error: 'Failed to check consistency' });
    }
});

// AI workflow suggestions based on content state and user role
router.post('/workflow-suggestions', requireAuth, async (req, res) => {
    try {
        const { content, contentType, currentStage } = req.body;
        const userRole = req.user.role;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const suggestions = [];

        // Role-based workflow suggestions
        if (userRole === 'press_secretary') {
            if (currentStage === 'editing') {
                suggestions.push(
                    'headline_optimization',
                    'lead_paragraph_punch',
                    'quote_enhancement'
                );
            }
        } else if (userRole === 'staff_writer' || userRole === 'junior_writer') {
            suggestions.push('technical_cleanup', 'structure_analysis');
        }

        // Content-based suggestions
        const readinessScore = await aiAssistant.calculateMediaReadiness(content, contentType);
        if (readinessScore.total < 70) {
            suggestions.push('preProcessing_required');
        }

        res.json({
            success: true,
            suggestions,
            readinessScore: readinessScore.total,
            userRole,
            nextSteps: this.getNextStepsForRole(userRole, currentStage)
        });

    } catch (error) {
        console.error('Error generating workflow suggestions:', error);
        res.status(500).json({ error: 'Failed to generate workflow suggestions' });
    }
});

// Helper function to get primary tools for each role
function getPrimaryToolsForRole(role) {
    const toolsByRole = {
        'press_secretary': [
            'headline_optimization',
            'lead_paragraph_punch',
            'quote_enhancement',
            'message_discipline'
        ],
        'communications_director': [
            'message_discipline',
            'tone_consistency',
            'fact_consistency'
        ],
        'senior_writer': [
            'direct_editing',
            'quick_fixes',
            'readiness_scoring'
        ],
        'staff_writer': [
            'technical_cleanup',
            'quick_fixes',
            'self_editing_tools'
        ],
        'junior_writer': [
            'technical_cleanup',
            'basic_quick_fixes'
        ]
    };

    return toolsByRole[role] || ['basic_tools'];
}

// Helper function to get next steps based on role and stage
function getNextStepsForRole(role, stage) {
    if (role === 'press_secretary') {
        return [
            'Apply direct edits for media impact',
            'Ensure message discipline alignment',
            'Final approval and distribution'
        ];
    } else if (role === 'staff_writer') {
        return [
            'Self-edit using AI pre-processing',
            'Submit for Press Secretary review',
            'Incorporate feedback if returned'
        ];
    }

    return ['Continue with standard workflow'];
}

module.exports = router;