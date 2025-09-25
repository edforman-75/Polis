const express = require('express');
const router = express.Router();
const aiService = require('../services/ai-service');
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// Conversational research endpoint
router.post('/query', requireAuth, async (req, res) => {
    try {
        const { query, assignmentId, context } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Get assignment context if provided
        let assignmentContext = {};
        if (assignmentId) {
            const assignment = await db.get(
                'SELECT * FROM assignments WHERE id = ?',
                [assignmentId]
            );
            if (assignment) {
                assignmentContext = {
                    title: assignment.title,
                    brief: assignment.brief,
                    status: assignment.status
                };
            }
        }

        // Perform AI research with campaign intelligence
        const response = await aiService.performResearch(query, {
            ...context,
            assignment: assignmentContext,
            user: req.user.name
        });

        // Log the research query
        await db.run(
            `INSERT INTO research_queries (user_id, assignment_id, query, response, topic, sources)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                assignmentId || null,
                query,
                response.text,
                response.topic,
                JSON.stringify(response.sources)
            ]
        );

        // Return response with actions formatted for frontend
        res.json({
            text: response.text,
            sources: response.sources,
            actions: response.actions.map(action => ({
                label: action.label,
                type: action.type,
                data: action.data
            })),
            topic: response.topic,
            metadata: response.metadata
        });

    } catch (error) {
        console.error('Research query error:', error);
        res.status(500).json({
            error: 'Failed to process research query',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Generate content endpoint
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { type, platform, topic, tone, length, assignmentId } = req.body;

        // Validate required parameters
        if (!type || !topic) {
            return res.status(400).json({ error: 'Type and topic are required' });
        }

        // Generate content using AI service
        const result = await aiService.generateContent(type, {
            platform: platform || 'general',
            topic,
            tone,
            length
        });

        // If assignment is provided, optionally save as draft
        if (assignmentId) {
            // Update content blocks for this assignment
            await db.run(
                `INSERT INTO content_blocks (assignment_id, block_id, type, content, data)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    assignmentId,
                    `ai-generated-${Date.now()}`,
                    'generated',
                    result.content,
                    JSON.stringify(result.metadata)
                ]
            );
        }

        res.json({
            content: result.content,
            platform: result.platform,
            optimizations: result.optimizations,
            metadata: result.metadata
        });

    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({
            error: 'Failed to generate content',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Analyze content endpoint
router.post('/analyze', requireAuth, async (req, res) => {
    try {
        const { content, context } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Analyze content using AI service
        const analysis = await aiService.analyzeContent(content, context);

        res.json({
            analysis: analysis.analysis,
            suggestions: analysis.suggestions,
            riskLevel: analysis.riskLevel,
            compliance: analysis.complianceCheck
        });

    } catch (error) {
        console.error('Content analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze content',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get research history
router.get('/history', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { assignmentId, limit = 20 } = req.query;

        let query = 'SELECT * FROM research_queries WHERE user_id = ?';
        const params = [userId];

        if (assignmentId) {
            query += ' AND assignment_id = ?';
            params.push(assignmentId);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const history = await db.all(query, params);

        // Parse JSON fields
        const formattedHistory = history.map(item => ({
            ...item,
            sources: JSON.parse(item.sources || '[]')
        }));

        res.json(formattedHistory);

    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch research history'
        });
    }
});

// Get suggested queries based on context
router.post('/suggestions', requireAuth, async (req, res) => {
    try {
        const { assignmentId, currentContent } = req.body;

        // Generate contextual suggestions
        const suggestions = [];

        if (assignmentId) {
            const assignment = await db.get(
                'SELECT * FROM assignments WHERE id = ?',
                [assignmentId]
            );

            if (assignment) {
                // Generate suggestions based on assignment type
                if (assignment.title.toLowerCase().includes('veteran')) {
                    suggestions.push(
                        'How many veterans live in our district?',
                        'What are the top veterans\' healthcare concerns?',
                        'Find local veterans organizations'
                    );
                } else if (assignment.title.toLowerCase().includes('health')) {
                    suggestions.push(
                        'What are Medicare expansion benefits?',
                        'Healthcare access statistics for our district',
                        'Common healthcare concerns for seniors'
                    );
                } else if (assignment.title.toLowerCase().includes('econom')) {
                    suggestions.push(
                        'Local unemployment statistics',
                        'Small business support programs',
                        'Infrastructure investment opportunities'
                    );
                }
            }
        }

        // Add general suggestions if none specific
        if (suggestions.length === 0) {
            suggestions.push(
                'District demographic information',
                'Recent policy developments',
                'Upcoming events and deadlines'
            );
        }

        res.json({ suggestions });

    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            error: 'Failed to generate suggestions'
        });
    }
});

module.exports = router;