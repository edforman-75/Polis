const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// Save content blocks
router.post('/blocks', requireAuth, async (req, res) => {
    try {
        const { assignmentId, blocks } = req.body;

        if (!assignmentId || !blocks) {
            return res.status(400).json({ error: 'Assignment ID and blocks are required' });
        }

        // Delete existing blocks for this assignment
        await db.run(
            'DELETE FROM content_blocks WHERE assignment_id = ?',
            [assignmentId]
        );

        // Insert new blocks
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            await db.run(
                `INSERT INTO content_blocks (assignment_id, block_id, type, content, data, position)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    assignmentId,
                    block.id,
                    block.type,
                    block.content,
                    JSON.stringify(block.data || {}),
                    i
                ]
            );
        }

        // Update assignment modification time
        await db.run(
            'UPDATE assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [assignmentId]
        );

        res.json({ success: true, message: 'Content saved successfully' });

    } catch (error) {
        console.error('Error saving blocks:', error);
        res.status(500).json({ error: 'Failed to save content' });
    }
});

// Get content blocks
router.get('/blocks/:assignmentId', requireAuth, async (req, res) => {
    try {
        const blocks = await db.all(
            'SELECT * FROM content_blocks WHERE assignment_id = ? ORDER BY position',
            [req.params.assignmentId]
        );

        const formattedBlocks = blocks.map(block => ({
            id: block.block_id,
            type: block.type,
            content: block.content,
            data: JSON.parse(block.data || '{}'),
            position: block.position
        }));

        res.json(formattedBlocks);

    } catch (error) {
        console.error('Error fetching blocks:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// Save version (for tracking changes)
router.post('/version', requireAuth, async (req, res) => {
    try {
        const { assignmentId, versionData, message } = req.body;

        await db.run(
            `INSERT INTO content_versions (assignment_id, user_id, version_data, message)
             VALUES (?, ?, ?, ?)`,
            [assignmentId, req.user.id, JSON.stringify(versionData), message]
        );

        res.json({ success: true, message: 'Version saved' });

    } catch (error) {
        console.error('Error saving version:', error);
        res.status(500).json({ error: 'Failed to save version' });
    }
});

// Get version history
router.get('/versions/:assignmentId', requireAuth, async (req, res) => {
    try {
        const versions = await db.all(`
            SELECT v.*, u.name as user_name
            FROM content_versions v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.assignment_id = ?
            ORDER BY v.created_at DESC
            LIMIT 20
        `, [req.params.assignmentId]);

        res.json(versions.map(v => ({
            ...v,
            version_data: JSON.parse(v.version_data)
        })));

    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ error: 'Failed to fetch version history' });
    }
});

// Export content
router.post('/export', requireAuth, async (req, res) => {
    try {
        const { assignmentId, format } = req.body;

        // Get blocks
        const blocks = await db.all(
            'SELECT * FROM content_blocks WHERE assignment_id = ? ORDER BY position',
            [assignmentId]
        );

        // Format content based on export type
        let exportedContent = '';

        if (format === 'text') {
            exportedContent = blocks.map(b => b.content).join('\n\n');
        } else if (format === 'html') {
            exportedContent = '<html><body>\n';
            blocks.forEach(block => {
                switch (block.type) {
                    case 'heading1':
                        exportedContent += `<h1>${block.content}</h1>\n`;
                        break;
                    case 'heading2':
                        exportedContent += `<h2>${block.content}</h2>\n`;
                        break;
                    case 'quote':
                        exportedContent += `<blockquote>${block.content}</blockquote>\n`;
                        break;
                    default:
                        exportedContent += `<p>${block.content}</p>\n`;
                }
            });
            exportedContent += '</body></html>';
        } else if (format === 'markdown') {
            blocks.forEach(block => {
                switch (block.type) {
                    case 'heading1':
                        exportedContent += `# ${block.content}\n\n`;
                        break;
                    case 'heading2':
                        exportedContent += `## ${block.content}\n\n`;
                        break;
                    case 'quote':
                        exportedContent += `> ${block.content}\n\n`;
                        break;
                    default:
                        exportedContent += `${block.content}\n\n`;
                }
            });
        }

        res.json({
            content: exportedContent,
            format: format,
            assignmentId: assignmentId
        });

    } catch (error) {
        console.error('Error exporting content:', error);
        res.status(500).json({ error: 'Failed to export content' });
    }
});

module.exports = router;