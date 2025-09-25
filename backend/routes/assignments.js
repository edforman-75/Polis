const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const draftGenerator = require('../services/draft-generator');

// Get all assignments
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status, assignee } = req.query;
        let query = `
            SELECT a.*, u1.name as assignor_name, u2.name as assignee_name
            FROM assignments a
            LEFT JOIN users u1 ON a.assignor_id = u1.id
            LEFT JOIN users u2 ON a.assignee_id = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        if (assignee) {
            query += ' AND a.assignee_id = ?';
            params.push(assignee);
        }

        query += ' ORDER BY a.due_date ASC';

        const assignments = await db.all(query, params);
        res.json(assignments);

    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Get single assignment
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const assignment = await db.get(`
            SELECT a.*, u1.name as assignor_name, u2.name as assignee_name
            FROM assignments a
            LEFT JOIN users u1 ON a.assignor_id = u1.id
            LEFT JOIN users u2 ON a.assignee_id = u2.id
            WHERE a.id = ?
        `, [req.params.id]);

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Get content blocks for this assignment
        const blocks = await db.all(
            'SELECT * FROM content_blocks WHERE assignment_id = ? ORDER BY position',
            [req.params.id]
        );

        assignment.blocks = blocks.map(block => ({
            ...block,
            data: JSON.parse(block.data || '{}')
        }));

        res.json(assignment);

    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
});

// Update assignment status
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const assignmentId = req.params.id;

        // Get current status
        const current = await db.get(
            'SELECT status FROM assignments WHERE id = ?',
            [assignmentId]
        );

        if (!current) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Update status
        await db.run(
            'UPDATE assignments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, assignmentId]
        );

        // Log workflow change
        await db.run(
            `INSERT INTO workflows (assignment_id, from_status, to_status, user_id, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [assignmentId, current.status, status, req.user.id, notes]
        );

        res.json({ success: true, status });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Get workflow history
router.get('/:id/workflow', requireAuth, async (req, res) => {
    try {
        const history = await db.all(`
            SELECT w.*, u.name as user_name
            FROM workflows w
            LEFT JOIN users u ON w.user_id = u.id
            WHERE w.assignment_id = ?
            ORDER BY w.created_at DESC
        `, [req.params.id]);

        res.json(history);

    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ error: 'Failed to fetch workflow history' });
    }
});

// Create new assignment with type-specific brief development
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, description, brief, assignee_id, priority, due_date, assignment_type } = req.body;

        // Generate assignment ID
        const year = new Date().getFullYear();
        const count = await db.get(
            'SELECT COUNT(*) as count FROM assignments WHERE id LIKE ?',
            [`A-${year}-%`]
        );
        const nextNumber = (count.count + 1).toString().padStart(3, '0');
        const assignmentId = `A-${year}-${nextNumber}`;

        // Generate type-specific enhanced brief using AI
        let enhancedBrief = brief;
        let structuredDraft = null;

        if (assignment_type && brief) {
            try {
                // Create assignment data for draft generator
                const assignmentData = {
                    title,
                    type: assignment_type,
                    brief,
                    priority,
                    deadline: due_date,
                    targetAudience: 'general', // Default, could be expanded
                    keyMessages: description ? [description] : [],
                    platform: 'general'
                };

                // Generate structured draft with AI
                structuredDraft = await draftGenerator.generateDraft(assignmentData, assignment_type);

                // Create enhanced brief by combining original with AI suggestions
                enhancedBrief = `${brief}\n\n--- AI-Generated Brief Enhancement ---\n\nStructured Content Outline:\n`;

                if (structuredDraft && structuredDraft.blocks) {
                    structuredDraft.blocks.forEach((block, index) => {
                        enhancedBrief += `\n${index + 1}. ${block.type.toUpperCase()}: ${block.content?.substring(0, 100)}${block.content?.length > 100 ? '...' : ''}`;
                    });
                }

                // Add content suggestions
                const suggestions = await draftGenerator.generateContentSuggestions(assignmentData, assignment_type);
                enhancedBrief += `\n\n--- Content Development Suggestions ---\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

                console.log(`✅ Generated ${assignment_type} brief for assignment ${assignmentId}`);
            } catch (aiError) {
                console.warn('AI brief generation failed, using original brief:', aiError.message);
                enhancedBrief = brief; // Fallback to original
            }
        }

        // Store assignment with enhanced brief
        await db.run(
            `INSERT INTO assignments (id, title, description, brief, assignor_id, assignee_id, priority, due_date, status, assignment_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [assignmentId, title, description, enhancedBrief, req.user.id, assignee_id, priority, due_date, 'pending', assignment_type]
        );

        res.json({
            id: assignmentId,
            message: `${assignment_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} assignment created successfully`,
            enhanced: structuredDraft ? true : false,
            contentType: assignment_type
        });

    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});

module.exports = router;