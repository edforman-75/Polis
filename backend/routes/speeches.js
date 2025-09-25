const express = require('express');
const router = express.Router();
const db = require('../database/init');
const speechProcessor = require('../services/speech-processor');
const undoRedoManager = require('../services/undo-redo-manager');

// Get all speeches for a user
router.get('/', async (req, res) => {
    try {
        const userId = req.session.user?.id || 1; // Default to demo user
        const { assignment_id } = req.query;

        let query = 'SELECT * FROM speeches WHERE created_by = ?';
        let params = [userId];

        if (assignment_id) {
            query += ' AND assignment_id = ?';
            params.push(assignment_id);
        }

        query += ' ORDER BY updated_at DESC';

        const speeches = await db.all(query, params);

        const speechesWithMetadata = speeches.map(speech => ({
            ...speech,
            metadata: JSON.parse(speech.metadata || '{}')
        }));

        res.json(speechesWithMetadata);
    } catch (error) {
        console.error('Error fetching speeches:', error);
        res.status(500).json({ error: 'Failed to fetch speeches' });
    }
});

// Get single speech
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user?.id || 1;

        const speech = await db.get(
            'SELECT * FROM speeches WHERE id = ? AND created_by = ?',
            [id, userId]
        );

        if (!speech) {
            return res.status(404).json({ error: 'Speech not found' });
        }

        res.json({
            ...speech,
            metadata: JSON.parse(speech.metadata || '{}')
        });
    } catch (error) {
        console.error('Error fetching speech:', error);
        res.status(500).json({ error: 'Failed to fetch speech' });
    }
});

// Create new speech
router.post('/', async (req, res) => {
    try {
        const { title, content, metadata, assignment_id } = req.body;
        const userId = req.session.user?.id || 1;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Process speech on server-side
        const processedMetadata = speechProcessor.extractMetadata(content);
        const sections = speechProcessor.parseStructure(content);

        // Merge provided metadata with processed metadata
        const finalMetadata = {
            ...processedMetadata,
            ...metadata,
            sections: sections,
            processedAt: new Date().toISOString()
        };

        const finalTitle = title || processedMetadata.title;
        const metadataStr = JSON.stringify(finalMetadata);

        const result = await db.run(
            'INSERT INTO speeches (title, content, metadata, assignment_id, created_by) VALUES (?, ?, ?, ?, ?)',
            [finalTitle, content, metadataStr, assignment_id, userId]
        );

        // Create initial version
        await db.run(
            'INSERT INTO speech_versions (speech_id, version_number, content, metadata, changes_summary, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [result.id, 1, content, metadataStr, 'Initial version', userId]
        );

        res.json({
            id: result.id,
            title,
            content,
            metadata,
            assignment_id,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating speech:', error);
        res.status(500).json({ error: 'Failed to create speech' });
    }
});

// Update speech
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, metadata, changes_summary, sessionId, operationType, position } = req.body;
        const userId = req.session.user?.id || 1;

        // Get current speech to create version
        const currentSpeech = await db.get(
            'SELECT * FROM speeches WHERE id = ? AND created_by = ?',
            [id, userId]
        );

        if (!currentSpeech) {
            return res.status(404).json({ error: 'Speech not found' });
        }

        // Record undo/redo operation if session is provided
        if (sessionId && operationType && position && currentSpeech.content !== content) {
            const operationData = {
                assignmentId: currentSpeech.assignment_id,
                contentType: 'speech',
                contentId: id,
                operationType: operationType,
                positionStart: position.start || 0,
                positionEnd: position.end || currentSpeech.content.length,
                contentBefore: currentSpeech.content,
                contentAfter: content,
                userId: userId
            };

            await undoRedoManager.recordOperation(sessionId, operationData);
        }

        // Get next version number
        const lastVersion = await db.get(
            'SELECT MAX(version_number) as max_version FROM speech_versions WHERE speech_id = ?',
            [id]
        );
        const nextVersion = (lastVersion?.max_version || 0) + 1;

        const metadataStr = JSON.stringify(metadata || {});

        // Create version entry
        await db.run(
            'INSERT INTO speech_versions (speech_id, version_number, content, metadata, changes_summary, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [id, nextVersion, content, metadataStr, changes_summary || 'Updated speech', userId]
        );

        // Update main speech
        const result = await db.run(
            'UPDATE speeches SET title = ?, content = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND created_by = ?',
            [title, content, metadataStr, id, userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Speech not found or unauthorized' });
        }

        // Get session status if sessionId provided
        let sessionStatus = null;
        if (sessionId) {
            sessionStatus = await undoRedoManager.getSessionStatus(sessionId);
        }

        res.json({
            id: parseInt(id),
            title,
            content,
            metadata,
            version: nextVersion,
            sessionStatus
        });
    } catch (error) {
        console.error('Error updating speech:', error);
        res.status(500).json({ error: 'Failed to update speech' });
    }
});

// Delete speech
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user?.id || 1;

        // Delete versions first
        await db.run('DELETE FROM speech_versions WHERE speech_id = ?', [id]);

        // Delete main speech
        const result = await db.run(
            'DELETE FROM speeches WHERE id = ? AND created_by = ?',
            [id, userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Speech not found or unauthorized' });
        }

        res.json({ deleted: true, id: parseInt(id) });
    } catch (error) {
        console.error('Error deleting speech:', error);
        res.status(500).json({ error: 'Failed to delete speech' });
    }
});

// Get speech versions (revision history)
router.get('/:id/versions', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user?.id || 1;

        // Verify user owns the speech
        const speech = await db.get(
            'SELECT id FROM speeches WHERE id = ? AND created_by = ?',
            [id, userId]
        );

        if (!speech) {
            return res.status(404).json({ error: 'Speech not found or unauthorized' });
        }

        const versions = await db.all(
            `SELECT sv.*, u.name as created_by_name
             FROM speech_versions sv
             LEFT JOIN users u ON sv.created_by = u.id
             WHERE sv.speech_id = ?
             ORDER BY sv.created_at DESC`,
            [id]
        );

        const versionsWithMetadata = versions.map(version => ({
            ...version,
            metadata: JSON.parse(version.metadata || '{}')
        }));

        res.json(versionsWithMetadata);
    } catch (error) {
        console.error('Error fetching speech versions:', error);
        res.status(500).json({ error: 'Failed to fetch speech versions' });
    }
});

// Search speeches
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const userId = req.session.user?.id || 1;
        const searchTerm = `%${query}%`;

        const speeches = await db.all(
            `SELECT * FROM speeches
             WHERE created_by = ? AND (title LIKE ? OR content LIKE ?)
             ORDER BY updated_at DESC LIMIT 20`,
            [userId, searchTerm, searchTerm]
        );

        const speechesWithMetadata = speeches.map(speech => ({
            ...speech,
            metadata: JSON.parse(speech.metadata || '{}')
        }));

        res.json(speechesWithMetadata);
    } catch (error) {
        console.error('Error searching speeches:', error);
        res.status(500).json({ error: 'Failed to search speeches' });
    }
});

// Communications briefs routes
router.get('/briefs', async (req, res) => {
    try {
        const userId = req.session.user?.id || 1;

        const briefs = await db.all(
            `SELECT cb.*, u1.name as created_by_name, u2.name as assigned_to_name
             FROM communications_briefs cb
             LEFT JOIN users u1 ON cb.created_by = u1.id
             LEFT JOIN users u2 ON cb.assigned_to = u2.id
             WHERE cb.created_by = ? OR cb.assigned_to = ?
             ORDER BY cb.updated_at DESC`,
            [userId, userId]
        );

        const briefsWithKeyPoints = briefs.map(brief => ({
            ...brief,
            key_points: JSON.parse(brief.key_points || '[]')
        }));

        res.json(briefsWithKeyPoints);
    } catch (error) {
        console.error('Error fetching briefs:', error);
        res.status(500).json({ error: 'Failed to fetch communications briefs' });
    }
});

router.post('/briefs', async (req, res) => {
    try {
        const { title, description, audience, tone, key_points, assignment_id, assigned_to } = req.body;
        const userId = req.session.user?.id || 1;

        const keyPointsStr = JSON.stringify(key_points || []);

        const result = await db.run(
            'INSERT INTO communications_briefs (title, description, audience, tone, key_points, assignment_id, created_by, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, audience, tone, keyPointsStr, assignment_id, userId, assigned_to]
        );

        res.json({
            id: result.id,
            title,
            description,
            audience,
            tone,
            key_points,
            assignment_id,
            created_by: userId,
            assigned_to
        });
    } catch (error) {
        console.error('Error creating brief:', error);
        res.status(500).json({ error: 'Failed to create communications brief' });
    }
});

// Process speech content (analyze without saving)
router.post('/process', async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const metadata = speechProcessor.extractMetadata(content);
        const sections = speechProcessor.parseStructure(content);

        res.json({
            metadata,
            sections,
            processedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error processing speech:', error);
        res.status(500).json({ error: 'Failed to process speech content' });
    }
});

// Export speech in different formats
router.get('/:id/export/:format', async (req, res) => {
    try {
        const { id, format } = req.params;
        const userId = req.session.user?.id || 1;

        const speech = await db.get(
            'SELECT * FROM speeches WHERE id = ? AND created_by = ?',
            [id, userId]
        );

        if (!speech) {
            return res.status(404).json({ error: 'Speech not found' });
        }

        const speechData = {
            ...speech,
            metadata: JSON.parse(speech.metadata || '{}')
        };

        const exportedContent = speechProcessor.generateExports(speechData, format);

        // Set appropriate headers based on format
        switch (format.toLowerCase()) {
            case 'teleprompter':
            case 'text':
                res.setHeader('Content-Type', 'text/plain');
                break;
            case 'json':
                res.setHeader('Content-Type', 'application/json');
                break;
            default:
                res.setHeader('Content-Type', 'application/octet-stream');
        }

        res.setHeader('Content-Disposition', `attachment; filename="speech_${id}.${format}"`);

        if (typeof exportedContent === 'object') {
            res.json(exportedContent);
        } else {
            res.send(exportedContent);
        }
    } catch (error) {
        console.error('Error exporting speech:', error);
        res.status(500).json({ error: 'Failed to export speech' });
    }
});

module.exports = router;