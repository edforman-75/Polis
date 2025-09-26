const express = require('express');
const router = express.Router();
const aiService = require('../services/ai-service');
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');

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

// Research Director Management Routes

// Get research dashboard statistics
router.get('/dashboard/stats', requireAuth, requirePermission('research.read.all'), async (req, res) => {
    try {
        // Get active research requests
        const activeRequests = await db.get(`
            SELECT COUNT(*) as count
            FROM assignments a
            JOIN users u ON a.assignee_id = u.id
            WHERE u.department = 'Research' AND a.status IN ('assigned', 'in_progress')
        `);

        // Get pending fact checks
        const pendingFactChecks = await db.get(`
            SELECT COUNT(*) as count
            FROM assignments a
            WHERE a.assignment_type = 'fact_check' AND a.status = 'assigned'
        `);

        // Get completed research this month
        const completedResearch = await db.get(`
            SELECT COUNT(*) as count
            FROM assignments a
            JOIN users u ON a.assignee_id = u.id
            WHERE u.department = 'Research'
                AND a.status = 'completed'
                AND a.completed_at >= date('now', 'start of month')
        `);

        // Get urgent requests
        const urgentRequests = await db.get(`
            SELECT COUNT(*) as count
            FROM assignments a
            JOIN users u ON a.assignee_id = u.id
            WHERE u.department = 'Research'
                AND a.priority = 'urgent'
                AND a.status IN ('assigned', 'in_progress')
        `);

        res.json({
            success: true,
            stats: {
                active_requests: activeRequests.count,
                fact_checks_pending: pendingFactChecks.count,
                research_completed: completedResearch.count,
                urgent_requests: urgentRequests.count
            }
        });

    } catch (error) {
        console.error('Error fetching research dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Get incoming research requests for Research Director
router.get('/requests/incoming', requireAuth, requirePermission('research.read.all'), async (req, res) => {
    try {
        const { tab = 'all', status = 'assigned' } = req.query;

        let whereClause = `
            WHERE u.department = 'Research'
            AND a.status IN ('assigned', 'in_progress', 'revision_requested')
        `;

        if (tab === 'urgent') {
            whereClause += ` AND a.priority = 'urgent'`;
        } else if (tab === 'fact-checks') {
            whereClause += ` AND a.assignment_type LIKE '%fact%'`;
        }

        const requests = await db.all(`
            SELECT
                a.*,
                u1.name as assignor_name,
                u2.name as assignee_name,
                CASE
                    WHEN a.due_date <= datetime('now', '+2 hours') THEN 'urgent'
                    WHEN a.due_date <= datetime('now', '+1 day') THEN 'high'
                    WHEN a.due_date <= datetime('now', '+3 days') THEN 'medium'
                    ELSE 'low'
                END as calculated_priority
            FROM assignments a
            LEFT JOIN users u1 ON a.assignor_id = u1.id
            LEFT JOIN users u2 ON a.assignee_id = u2.id
            JOIN users u ON a.assignee_id = u.id
            ${whereClause}
            ORDER BY
                CASE a.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    ELSE 4
                END,
                a.due_date ASC
        `);

        res.json({
            success: true,
            requests,
            count: requests.length
        });

    } catch (error) {
        console.error('Error fetching research requests:', error);
        res.status(500).json({ error: 'Failed to fetch research requests' });
    }
});

// Assign research request to specific researcher
router.post('/requests/:id/assign-researcher', requireAuth, requirePermission('research.assign'), async (req, res) => {
    try {
        const { id } = req.params;
        const { researcher_id, deadline_extension, notes } = req.body;

        if (!researcher_id) {
            return res.status(400).json({ error: 'Researcher ID is required' });
        }

        // Update assignment
        await db.run(`
            UPDATE assignments
            SET assignee_id = ?,
                status = 'assigned',
                due_date = CASE
                    WHEN ? IS NOT NULL THEN datetime(due_date, '+' || ? || ' hours')
                    ELSE due_date
                END,
                notes = COALESCE(notes || '\n\n', '') || 'Research Director Assignment: ' || ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [researcher_id, deadline_extension, deadline_extension, notes || 'Assigned by Research Director', id]);

        res.json({
            success: true,
            message: 'Research request assigned successfully'
        });

    } catch (error) {
        console.error('Error assigning research request:', error);
        res.status(500).json({ error: 'Failed to assign research request' });
    }
});

// Emergency research assignment
router.post('/emergency-assign', requireAuth, requirePermission('research.emergency'), async (req, res) => {
    try {
        const {
            title,
            description,
            priority = 'urgent',
            deadline_hours = 2,
            research_type = 'emergency'
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // Find available researcher with lowest workload
        const availableResearcher = await db.get(`
            SELECT
                u.id,
                u.name,
                COUNT(a.id) as current_load
            FROM users u
            LEFT JOIN assignments a ON u.id = a.assignee_id
                AND a.status IN ('assigned', 'in_progress')
            WHERE u.department = 'Research'
                AND u.role IN ('researcher', 'research_director')
                AND u.is_active = 1
            GROUP BY u.id, u.name
            ORDER BY current_load ASC
            LIMIT 1
        `);

        if (!availableResearcher) {
            return res.status(503).json({ error: 'No researchers available for emergency assignment' });
        }

        // Create emergency assignment
        const year = new Date().getFullYear();
        const assignmentId = `URGENT-${year}-${Date.now()}`;

        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + deadline_hours);

        await db.run(`
            INSERT INTO assignments (
                id, title, description, assignment_type, priority,
                assignor_id, assignee_id, due_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'assigned')
        `, [
            assignmentId, title, description, research_type, priority,
            req.user.id, availableResearcher.id, dueDate.toISOString()
        ]);

        res.json({
            success: true,
            assignment_id: assignmentId,
            assigned_to: availableResearcher.name,
            message: 'Emergency research assignment created and assigned'
        });

    } catch (error) {
        console.error('Error creating emergency assignment:', error);
        res.status(500).json({ error: 'Failed to create emergency assignment' });
    }
});

// Get research team workload
router.get('/team/workload', requireAuth, requirePermission('research.read.all'), async (req, res) => {
    try {
        const teamWorkload = await db.all(`
            SELECT
                u.id,
                u.name,
                u.role,
                COUNT(CASE WHEN a.status IN ('assigned', 'in_progress') THEN 1 END) as active_assignments,
                COUNT(CASE WHEN a.priority = 'urgent' AND a.status IN ('assigned', 'in_progress') THEN 1 END) as urgent_assignments,
                COUNT(CASE WHEN a.status = 'completed' AND a.completed_at >= date('now', '-7 days') THEN 1 END) as completed_this_week,
                AVG(CASE
                    WHEN a.status = 'completed' AND a.completed_at >= date('now', '-30 days')
                    THEN julianday(a.completed_at) - julianday(a.created_at)
                    ELSE NULL
                END) as avg_completion_days
            FROM users u
            LEFT JOIN assignments a ON u.id = a.assignee_id
            WHERE u.department = 'Research' AND u.is_active = 1
            GROUP BY u.id, u.name, u.role
            ORDER BY active_assignments DESC, urgent_assignments DESC
        `);

        res.json({
            success: true,
            team_workload: teamWorkload
        });

    } catch (error) {
        console.error('Error fetching team workload:', error);
        res.status(500).json({ error: 'Failed to fetch team workload' });
    }
});

// Create research assignment (Research Director creates work for team)
router.post('/assignments/create', requireAuth, requirePermission('research.create'), async (req, res) => {
    try {
        const {
            title,
            description,
            assignment_type = 'research',
            priority = 'medium',
            assigned_to,
            due_date,
            research_scope,
            specific_requirements
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // Generate assignment ID
        const year = new Date().getFullYear();
        const count = await db.get(
            'SELECT COUNT(*) as count FROM assignments WHERE id LIKE ?',
            [`RES-${year}-%`]
        );
        const nextNumber = (count.count + 1).toString().padStart(3, '0');
        const assignmentId = `RES-${year}-${nextNumber}`;

        await db.run(`
            INSERT INTO assignments (
                id, title, description, assignment_type, priority,
                assignor_id, assignee_id, due_date, status, brief
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'assigned', ?)
        `, [
            assignmentId, title, description, assignment_type, priority,
            req.user.id, assigned_to, due_date,
            `Research Scope: ${research_scope || 'Standard research'}\n\nSpecific Requirements:\n${specific_requirements || 'See description'}`
        ]);

        res.status(201).json({
            success: true,
            assignment_id: assignmentId,
            message: 'Research assignment created successfully'
        });

    } catch (error) {
        console.error('Error creating research assignment:', error);
        res.status(500).json({ error: 'Failed to create research assignment' });
    }
});

// Fact-checking workflow routes

// Submit content for fact-checking
router.post('/fact-check/submit', requireAuth, requirePermission('research.fact_check'), async (req, res) => {
    try {
        const { content, source_assignment_id, priority = 'medium', claims_to_verify } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required for fact-checking' });
        }

        // Create fact-check assignment
        const year = new Date().getFullYear();
        const count = await db.get(
            'SELECT COUNT(*) as count FROM assignments WHERE id LIKE ?',
            [`FC-${year}-%`]
        );
        const nextNumber = (count.count + 1).toString().padStart(3, '0');
        const factCheckId = `FC-${year}-${nextNumber}`;

        // Find available fact-checker with lowest workload
        const availableFactChecker = await db.get(`
            SELECT
                u.id, u.name,
                COUNT(a.id) as current_load
            FROM users u
            LEFT JOIN assignments a ON u.id = a.assignee_id
                AND a.status IN ('assigned', 'in_progress')
                AND a.assignment_type = 'fact_check'
            WHERE u.department = 'Research'
                AND u.role IN ('researcher', 'research_director')
                AND u.is_active = 1
            GROUP BY u.id, u.name
            ORDER BY current_load ASC
            LIMIT 1
        `);

        if (!availableFactChecker) {
            return res.status(503).json({ error: 'No fact-checkers available' });
        }

        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + (priority === 'urgent' ? 2 : priority === 'high' ? 6 : 24));

        await db.run(`
            INSERT INTO assignments (
                id, title, description, assignment_type, priority,
                assignor_id, assignee_id, due_date, status, brief
            ) VALUES (?, ?, ?, 'fact_check', ?, ?, ?, ?, 'assigned', ?)
        `, [
            factCheckId,
            `Fact-check: ${content.substring(0, 50)}...`,
            `Verify factual claims in content from assignment ${source_assignment_id || 'external'}`,
            priority,
            req.user.id,
            availableFactChecker.id,
            dueDate.toISOString(),
            `Claims to verify: ${claims_to_verify || 'All factual statements'}\n\nContent to fact-check:\n${content}`
        ]);

        // Create fact-check record
        await db.run(`
            INSERT INTO fact_checks (
                id, assignment_id, source_assignment_id, content,
                claims_to_verify, assigned_to, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `, [
            factCheckId, factCheckId, source_assignment_id, content,
            claims_to_verify, availableFactChecker.id, req.user.id
        ]);

        res.json({
            success: true,
            fact_check_id: factCheckId,
            assigned_to: availableFactChecker.name,
            due_date: dueDate.toISOString(),
            message: 'Content submitted for fact-checking'
        });

    } catch (error) {
        console.error('Error submitting fact-check:', error);
        res.status(500).json({ error: 'Failed to submit content for fact-checking' });
    }
});

// Complete fact-check with results
router.post('/fact-check/:id/complete', requireAuth, requirePermission('research.fact_check.complete'), async (req, res) => {
    try {
        const { id } = req.params;
        const { verified_claims, disputed_claims, sources, overall_rating, notes } = req.body;

        // Update fact-check record
        await db.run(`
            UPDATE fact_checks
            SET status = 'completed',
                verified_claims = ?,
                disputed_claims = ?,
                sources = ?,
                overall_rating = ?,
                fact_checker_notes = ?,
                completed_at = CURRENT_TIMESTAMP,
                completed_by = ?
            WHERE id = ?
        `, [
            JSON.stringify(verified_claims),
            JSON.stringify(disputed_claims),
            JSON.stringify(sources),
            overall_rating,
            notes,
            req.user.id,
            id
        ]);

        // Update assignment status
        await db.run(`
            UPDATE assignments
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Fact-check completed successfully',
            overall_rating
        });

    } catch (error) {
        console.error('Error completing fact-check:', error);
        res.status(500).json({ error: 'Failed to complete fact-check' });
    }
});

// Get fact-check results
router.get('/fact-check/:id/results', requireAuth, requirePermission('research.read.assigned'), async (req, res) => {
    try {
        const { id } = req.params;

        const factCheck = await db.get(`
            SELECT fc.*, u.name as fact_checker_name
            FROM fact_checks fc
            LEFT JOIN users u ON fc.completed_by = u.id
            WHERE fc.id = ?
        `, [id]);

        if (!factCheck) {
            return res.status(404).json({ error: 'Fact-check not found' });
        }

        // Parse JSON fields
        const result = {
            ...factCheck,
            verified_claims: factCheck.verified_claims ? JSON.parse(factCheck.verified_claims) : [],
            disputed_claims: factCheck.disputed_claims ? JSON.parse(factCheck.disputed_claims) : [],
            sources: factCheck.sources ? JSON.parse(factCheck.sources) : []
        };

        res.json(result);

    } catch (error) {
        console.error('Error fetching fact-check results:', error);
        res.status(500).json({ error: 'Failed to fetch fact-check results' });
    }
});

// Research Request Tracking System

// Track research request progress
router.post('/requests/:id/track', requireAuth, requirePermission('research.track'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, milestone, notes, time_estimate, resources_needed } = req.body;

        // Update assignment tracking
        await db.run(`
            INSERT INTO research_tracking (
                assignment_id, user_id, status, milestone, notes,
                time_estimate, resources_needed, logged_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [id, req.user.id, status, milestone, notes, time_estimate, resources_needed]);

        // Update assignment status if provided
        if (status) {
            await db.run(`
                UPDATE assignments
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, id]);
        }

        res.json({
            success: true,
            message: 'Research progress tracked successfully',
            logged_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error tracking research progress:', error);
        res.status(500).json({ error: 'Failed to track research progress' });
    }
});

// Get research request tracking history
router.get('/requests/:id/tracking', requireAuth, requirePermission('research.read.assigned'), async (req, res) => {
    try {
        const { id } = req.params;

        const tracking = await db.all(`
            SELECT rt.*, u.name as logged_by_name
            FROM research_tracking rt
            LEFT JOIN users u ON rt.user_id = u.id
            WHERE rt.assignment_id = ?
            ORDER BY rt.logged_at DESC
        `, [id]);

        res.json({
            success: true,
            assignment_id: id,
            tracking_history: tracking
        });

    } catch (error) {
        console.error('Error fetching research tracking:', error);
        res.status(500).json({ error: 'Failed to fetch research tracking' });
    }
});

// Research performance analytics
router.get('/analytics/performance', requireAuth, requirePermission('research.read.all'), async (req, res) => {
    try {
        const { period = '30', researcher_id } = req.query;

        let whereClause = `WHERE u.department = 'Research' AND a.created_at >= date('now', '-${period} days')`;
        const params = [];

        if (researcher_id) {
            whereClause += ' AND a.assignee_id = ?';
            params.push(researcher_id);
        }

        const performance = await db.all(`
            SELECT
                u.id,
                u.name,
                COUNT(a.id) as total_assignments,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
                COUNT(CASE WHEN a.status = 'completed' AND a.completed_at <= a.due_date THEN 1 END) as on_time_completions,
                AVG(CASE
                    WHEN a.status = 'completed'
                    THEN julianday(a.completed_at) - julianday(a.created_at)
                    ELSE NULL
                END) as avg_completion_days,
                COUNT(CASE WHEN a.assignment_type = 'fact_check' THEN 1 END) as fact_checks_completed,
                COUNT(CASE WHEN a.priority = 'urgent' AND a.status = 'completed' THEN 1 END) as urgent_completed
            FROM users u
            LEFT JOIN assignments a ON u.id = a.assignee_id
            ${whereClause}
            GROUP BY u.id, u.name
            ORDER BY completed_assignments DESC
        `, params);

        res.json({
            success: true,
            period_days: parseInt(period),
            performance_metrics: performance
        });

    } catch (error) {
        console.error('Error fetching research analytics:', error);
        res.status(500).json({ error: 'Failed to fetch research analytics' });
    }
});

// Research bottleneck analysis
router.get('/analytics/bottlenecks', requireAuth, requirePermission('research.read.all'), async (req, res) => {
    try {
        const bottlenecks = await db.all(`
            SELECT
                a.assignment_type,
                a.priority,
                COUNT(*) as count,
                AVG(julianday('now') - julianday(a.created_at)) as avg_age_days,
                COUNT(CASE WHEN a.due_date <= datetime('now') THEN 1 END) as overdue_count
            FROM assignments a
            JOIN users u ON a.assignee_id = u.id
            WHERE u.department = 'Research'
                AND a.status IN ('assigned', 'in_progress')
            GROUP BY a.assignment_type, a.priority
            ORDER BY avg_age_days DESC
        `);

        const delayedRequests = await db.all(`
            SELECT
                a.id,
                a.title,
                a.assignment_type,
                a.priority,
                a.due_date,
                u.name as assignee_name,
                julianday('now') - julianday(a.created_at) as age_days,
                CASE
                    WHEN a.due_date <= datetime('now') THEN 'overdue'
                    WHEN a.due_date <= datetime('now', '+1 day') THEN 'due_soon'
                    ELSE 'on_track'
                END as urgency_status
            FROM assignments a
            JOIN users u ON a.assignee_id = u.id
            WHERE u.department = 'Research'
                AND a.status IN ('assigned', 'in_progress')
                AND (a.due_date <= datetime('now', '+2 days') OR julianday('now') - julianday(a.created_at) > 3)
            ORDER BY a.due_date ASC
        `);

        res.json({
            success: true,
            bottleneck_analysis: bottlenecks,
            delayed_requests: delayedRequests
        });

    } catch (error) {
        console.error('Error analyzing research bottlenecks:', error);
        res.status(500).json({ error: 'Failed to analyze research bottlenecks' });
    }
});

// Opposition Research Management Tools

// Create opposition research entry
router.post('/opposition-research', requireAuth, requirePermission('opposition_research.create'), async (req, res) => {
    try {
        const {
            subject,
            category,
            content,
            sources,
            sensitivity_level = 'internal',
            tags,
            notes,
            assignment_id
        } = req.body;

        if (!subject || !category || !content) {
            return res.status(400).json({ error: 'Subject, category, and content are required' });
        }

        await db.run(`
            INSERT INTO opposition_research (
                subject, category, content, sources, sensitivity_level,
                tags, notes, assignment_id, researched_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            subject, category, content, JSON.stringify(sources || []),
            sensitivity_level, tags, notes, assignment_id, req.user.id
        ]);

        res.json({
            success: true,
            message: 'Opposition research entry created successfully'
        });

    } catch (error) {
        console.error('Error creating opposition research:', error);
        res.status(500).json({ error: 'Failed to create opposition research entry' });
    }
});

// Get opposition research entries with filtering
router.get('/opposition-research', requireAuth, requirePermission('opposition_research.read'), async (req, res) => {
    try {
        const { category, subject, sensitivity_level, verified_only } = req.query;
        let query = `
            SELECT or.*, u1.name as researched_by_name, u2.name as verified_by_name
            FROM opposition_research or
            LEFT JOIN users u1 ON or.researched_by = u1.id
            LEFT JOIN users u2 ON or.verified_by = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND or.category = ?';
            params.push(category);
        }

        if (subject) {
            query += ' AND or.subject LIKE ?';
            params.push(`%${subject}%`);
        }

        if (sensitivity_level) {
            query += ' AND or.sensitivity_level = ?';
            params.push(sensitivity_level);
        }

        if (verified_only === 'true') {
            query += ' AND or.verification_status = "verified"';
        }

        query += ' ORDER BY or.created_at DESC';

        const research = await db.all(query, params);

        // Parse JSON fields and filter by security clearance
        const formattedResearch = research
            .map(item => ({
                ...item,
                sources: JSON.parse(item.sources || '[]')
            }))
            .filter(item => {
                // Filter based on user's security clearance
                const userClearance = req.user.security_clearance;
                const itemSensitivity = item.sensitivity_level;

                if (itemSensitivity === 'confidential' && !['confidential', 'restricted', 'top_secret'].includes(userClearance)) {
                    return false;
                }
                if (itemSensitivity === 'restricted' && !['restricted', 'top_secret'].includes(userClearance)) {
                    return false;
                }
                if (itemSensitivity === 'top_secret' && userClearance !== 'top_secret') {
                    return false;
                }
                return true;
            });

        res.json({
            success: true,
            opposition_research: formattedResearch
        });

    } catch (error) {
        console.error('Error fetching opposition research:', error);
        res.status(500).json({ error: 'Failed to fetch opposition research' });
    }
});

// Verify opposition research entry
router.post('/opposition-research/:id/verify', requireAuth, requirePermission('opposition_research.verify'), async (req, res) => {
    try {
        const { id } = req.params;
        const { verification_status, verification_notes } = req.body;

        if (!['verified', 'disputed', 'unverified'].includes(verification_status)) {
            return res.status(400).json({ error: 'Invalid verification status' });
        }

        await db.run(`
            UPDATE opposition_research
            SET verification_status = ?,
                verified_by = ?,
                verification_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [verification_status, req.user.id, verification_notes, id]);

        res.json({
            success: true,
            message: 'Opposition research verification updated',
            verification_status
        });

    } catch (error) {
        console.error('Error verifying opposition research:', error);
        res.status(500).json({ error: 'Failed to verify opposition research' });
    }
});

// Get opposition research categories and subjects
router.get('/opposition-research/taxonomy', requireAuth, requirePermission('opposition_research.read'), async (req, res) => {
    try {
        const categories = await db.all(`
            SELECT category, COUNT(*) as count
            FROM opposition_research
            GROUP BY category
            ORDER BY count DESC
        `);

        const subjects = await db.all(`
            SELECT subject, category, COUNT(*) as mentions
            FROM opposition_research
            GROUP BY subject, category
            ORDER BY mentions DESC
            LIMIT 50
        `);

        const tags = await db.all(`
            SELECT tags, COUNT(*) as usage
            FROM opposition_research
            WHERE tags IS NOT NULL AND tags != ''
            GROUP BY tags
            ORDER BY usage DESC
            LIMIT 30
        `);

        res.json({
            success: true,
            taxonomy: {
                categories,
                popular_subjects: subjects,
                common_tags: tags
            }
        });

    } catch (error) {
        console.error('Error fetching opposition research taxonomy:', error);
        res.status(500).json({ error: 'Failed to fetch research taxonomy' });
    }
});

// Opposition research summary report
router.get('/opposition-research/summary', requireAuth, requirePermission('opposition_research.read'), async (req, res) => {
    try {
        const { subject } = req.query;

        if (!subject) {
            return res.status(400).json({ error: 'Subject parameter is required' });
        }

        const entries = await db.all(`
            SELECT or.*, u1.name as researched_by_name, u2.name as verified_by_name
            FROM opposition_research or
            LEFT JOIN users u1 ON or.researched_by = u1.id
            LEFT JOIN users u2 ON or.verified_by = u2.id
            WHERE or.subject LIKE ?
            ORDER BY or.verification_status DESC, or.created_at DESC
        `, [`%${subject}%`]);

        const summary = {
            subject,
            total_entries: entries.length,
            verified_entries: entries.filter(e => e.verification_status === 'verified').length,
            disputed_entries: entries.filter(e => e.verification_status === 'disputed').length,
            categories: [...new Set(entries.map(e => e.category))],
            key_findings: entries
                .filter(e => e.verification_status === 'verified')
                .map(e => ({
                    category: e.category,
                    content: e.content.substring(0, 200) + '...',
                    sources: JSON.parse(e.sources || '[]').length,
                    researched_by: e.researched_by_name,
                    created_at: e.created_at
                }))
                .slice(0, 5)
        };

        res.json({
            success: true,
            summary
        });

    } catch (error) {
        console.error('Error generating opposition research summary:', error);
        res.status(500).json({ error: 'Failed to generate research summary' });
    }
});

module.exports = router;