const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Unified content management for all political content types
const CONTENT_TYPES = {
    'social_posts': {
        table: 'social_posts',
        requiredFields: ['platform', 'content'],
        processor: require('../services/social-media-processor')
    },
    'policy_documents': {
        table: 'policy_documents',
        requiredFields: ['title', 'type', 'content'],
        processor: require('../services/policy-processor')
    },
    'press_releases': {
        table: 'press_releases',
        requiredFields: ['headline', 'content'],
        processor: require('../services/press-release-processor')
    },
    'event_content': {
        table: 'event_content',
        requiredFields: ['event_name', 'event_type', 'date'],
        processor: require('../services/event-processor')
    },
    'campaign_materials': {
        table: 'campaign_materials',
        requiredFields: ['title', 'type'],
        processor: require('../services/campaign-materials-processor')
    },
    'opposition_research': {
        table: 'opposition_research',
        requiredFields: ['subject', 'category', 'content'],
        processor: require('../services/opposition-research-processor')
    },
    'voter_outreach': {
        table: 'voter_outreach',
        requiredFields: ['campaign_name', 'message'],
        processor: require('../services/voter-outreach-processor')
    },
    'media_relations': {
        table: 'media_relations',
        requiredFields: ['outlet_name'],
        processor: require('../services/media-relations-processor')
    }
};

// Generic CRUD operations for all content types
router.get('/:contentType', async (req, res) => {
    try {
        const { contentType } = req.params;
        const { assignment_id, status, limit = 50 } = req.query;
        const userId = req.session.user?.id || 1;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        let query = `SELECT * FROM ${config.table} WHERE created_by = ?`;
        let params = [userId];

        if (assignment_id) {
            query += ' AND assignment_id = ?';
            params.push(assignment_id);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ` ORDER BY updated_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const items = await db.all(query, params);

        // Process items through their specific processor if available
        const processedItems = items.map(item => {
            try {
                const processed = { ...item };
                if (processed.metadata) {
                    processed.metadata = JSON.parse(processed.metadata);
                }
                if (processed.key_points) {
                    processed.key_points = JSON.parse(processed.key_points);
                }
                if (processed.hashtags) {
                    processed.hashtags = JSON.parse(processed.hashtags);
                }
                if (processed.media_urls) {
                    processed.media_urls = JSON.parse(processed.media_urls);
                }
                return processed;
            } catch (e) {
                return item;
            }
        });

        res.json(processedItems);
    } catch (error) {
        console.error(`Error fetching ${req.params.contentType}:`, error);
        res.status(500).json({ error: `Failed to fetch ${req.params.contentType}` });
    }
});

// Get single item
router.get('/:contentType/:id', async (req, res) => {
    try {
        const { contentType, id } = req.params;
        const userId = req.session.user?.id || 1;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        const item = await db.get(
            `SELECT * FROM ${config.table} WHERE id = ? AND created_by = ?`,
            [id, userId]
        );

        if (!item) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Parse JSON fields
        const processedItem = { ...item };
        ['metadata', 'key_points', 'hashtags', 'media_urls', 'sources', 'tags'].forEach(field => {
            if (processedItem[field]) {
                try {
                    processedItem[field] = JSON.parse(processedItem[field]);
                } catch (e) {
                    // Leave as string if not valid JSON
                }
            }
        });

        res.json(processedItem);
    } catch (error) {
        console.error(`Error fetching ${req.params.contentType}/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// Create new item
router.post('/:contentType', async (req, res) => {
    try {
        const { contentType } = req.params;
        const userId = req.session.user?.id || 1;
        const data = req.body;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        // Validate required fields
        for (const field of config.requiredFields) {
            if (!data[field]) {
                return res.status(400).json({ error: `${field} is required` });
            }
        }

        // Process content if processor available
        let processedData = { ...data };
        if (config.processor && config.processor.process) {
            try {
                processedData = await config.processor.process(data);
            } catch (processingError) {
                console.warn(`Processing failed for ${contentType}:`, processingError);
            }
        }

        // Prepare data for insertion
        const insertData = { ...processedData, created_by: userId };

        // Stringify JSON fields
        ['metadata', 'key_points', 'hashtags', 'media_urls', 'sources', 'tags'].forEach(field => {
            if (insertData[field] && typeof insertData[field] === 'object') {
                insertData[field] = JSON.stringify(insertData[field]);
            }
        });

        // Build dynamic INSERT query
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(field => insertData[field]);

        const query = `INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await db.run(query, values);

        // Return created item
        const createdItem = await db.get(`SELECT * FROM ${config.table} WHERE id = ?`, [result.id]);

        res.status(201).json({
            id: result.id,
            ...createdItem
        });
    } catch (error) {
        console.error(`Error creating ${req.params.contentType}:`, error);
        res.status(500).json({ error: `Failed to create ${req.params.contentType}` });
    }
});

// Update item
router.put('/:contentType/:id', async (req, res) => {
    try {
        const { contentType, id } = req.params;
        const userId = req.session.user?.id || 1;
        const data = req.body;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        // Verify ownership
        const existing = await db.get(
            `SELECT * FROM ${config.table} WHERE id = ? AND created_by = ?`,
            [id, userId]
        );

        if (!existing) {
            return res.status(404).json({ error: 'Content not found or unauthorized' });
        }

        // Process content if processor available
        let processedData = { ...data };
        if (config.processor && config.processor.process) {
            try {
                processedData = await config.processor.process(data, existing);
            } catch (processingError) {
                console.warn(`Processing failed for ${contentType}:`, processingError);
            }
        }

        // Prepare update data
        const updateData = { ...processedData, updated_at: 'CURRENT_TIMESTAMP' };
        delete updateData.id;
        delete updateData.created_by;
        delete updateData.created_at;

        // Stringify JSON fields
        ['metadata', 'key_points', 'hashtags', 'media_urls', 'sources', 'tags'].forEach(field => {
            if (updateData[field] && typeof updateData[field] === 'object') {
                updateData[field] = JSON.stringify(updateData[field]);
            }
        });

        // Build dynamic UPDATE query
        const fields = Object.keys(updateData);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...fields.map(field => updateData[field]), id, userId];

        const query = `UPDATE ${config.table} SET ${setClause} WHERE id = ? AND created_by = ?`;
        const result = await db.run(query, values);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Content not found or no changes made' });
        }

        // Return updated item
        const updatedItem = await db.get(`SELECT * FROM ${config.table} WHERE id = ?`, [id]);
        res.json(updatedItem);
    } catch (error) {
        console.error(`Error updating ${req.params.contentType}/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// Delete item
router.delete('/:contentType/:id', async (req, res) => {
    try {
        const { contentType, id } = req.params;
        const userId = req.session.user?.id || 1;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        const result = await db.run(
            `DELETE FROM ${config.table} WHERE id = ? AND created_by = ?`,
            [id, userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Content not found or unauthorized' });
        }

        res.json({ deleted: true, id: parseInt(id) });
    } catch (error) {
        console.error(`Error deleting ${req.params.contentType}/${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
});

// Bulk operations
router.post('/:contentType/bulk', async (req, res) => {
    try {
        const { contentType } = req.params;
        const { action, ids, data } = req.body;
        const userId = req.session.user?.id || 1;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        let result;
        switch (action) {
            case 'delete':
                const placeholders = ids.map(() => '?').join(',');
                result = await db.run(
                    `DELETE FROM ${config.table} WHERE id IN (${placeholders}) AND created_by = ?`,
                    [...ids, userId]
                );
                res.json({ deleted: result.changes, ids });
                break;

            case 'update':
                // Update multiple items with same data
                for (const id of ids) {
                    await db.run(
                        `UPDATE ${config.table} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND created_by = ?`,
                        [data.status, id, userId]
                    );
                }
                res.json({ updated: ids.length, ids });
                break;

            default:
                res.status(400).json({ error: 'Invalid bulk action' });
        }
    } catch (error) {
        console.error(`Error in bulk ${req.body.action} for ${req.params.contentType}:`, error);
        res.status(500).json({ error: 'Bulk operation failed' });
    }
});

// Search content
router.get('/:contentType/search/:query', async (req, res) => {
    try {
        const { contentType, query } = req.params;
        const { limit = 20 } = req.query;
        const userId = req.session.user?.id || 1;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        const searchTerm = `%${query}%`;

        // Dynamic search across different fields based on content type
        let searchFields = ['title', 'content', 'description'];
        if (contentType === 'social_posts') searchFields = ['content', 'hashtags'];
        if (contentType === 'media_relations') searchFields = ['outlet_name', 'contact_name'];
        if (contentType === 'opposition_research') searchFields = ['subject', 'content', 'tags'];

        const conditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
        const searchParams = searchFields.map(() => searchTerm);

        const items = await db.all(
            `SELECT * FROM ${config.table}
             WHERE created_by = ? AND (${conditions})
             ORDER BY updated_at DESC LIMIT ?`,
            [userId, ...searchParams, parseInt(limit)]
        );

        res.json(items);
    } catch (error) {
        console.error(`Error searching ${req.params.contentType}:`, error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Analytics endpoint
router.get('/:contentType/analytics', async (req, res) => {
    try {
        const { contentType } = req.params;
        const userId = req.session.user?.id || 1;

        const config = CONTENT_TYPES[contentType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        // Get basic analytics
        const stats = await db.all(`
            SELECT
                status,
                COUNT(*) as count,
                DATE(created_at) as date
            FROM ${config.table}
            WHERE created_by = ?
            GROUP BY status, DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `, [userId]);

        const totalCount = await db.get(
            `SELECT COUNT(*) as total FROM ${config.table} WHERE created_by = ?`,
            [userId]
        );

        const recentActivity = await db.all(
            `SELECT * FROM ${config.table} WHERE created_by = ? ORDER BY updated_at DESC LIMIT 10`,
            [userId]
        );

        res.json({
            stats,
            total: totalCount.total,
            recentActivity,
            contentType
        });
    } catch (error) {
        console.error(`Error getting analytics for ${req.params.contentType}:`, error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

module.exports = router;