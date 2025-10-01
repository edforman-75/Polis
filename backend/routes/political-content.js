const express = require('express');
const router = express.Router();
const db = require('../database/init');
const PoliticalContentManager = require('../data/political-content-manager');

// Create manager instance
const politicalContentManager = new PoliticalContentManager(db);

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

        const items = await politicalContentManager.getAll(config.table, {
            userId,
            assignmentId: assignment_id,
            status,
            limit
        });

        res.json(items);
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

        const item = await politicalContentManager.getById(config.table, id, userId);

        if (!item) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json(item);
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

        const createdItem = await politicalContentManager.create(config.table, processedData, userId);

        res.status(201).json(createdItem);
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

        // Get existing item for processor
        const existing = await politicalContentManager.getById(config.table, id, userId);

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

        const updatedItem = await politicalContentManager.update(config.table, id, processedData, userId);

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

        const result = await politicalContentManager.delete(config.table, id, userId);

        res.json(result);
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
                result = await politicalContentManager.bulkDelete(config.table, ids, userId);
                res.json(result);
                break;

            case 'update':
                result = await politicalContentManager.bulkUpdate(config.table, ids, data, userId);
                res.json(result);
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

        // Dynamic search across different fields based on content type
        let searchFields = ['title', 'content', 'description'];
        if (contentType === 'social_posts') searchFields = ['content', 'hashtags'];
        if (contentType === 'media_relations') searchFields = ['outlet_name', 'contact_name'];
        if (contentType === 'opposition_research') searchFields = ['subject', 'content', 'tags'];

        const items = await politicalContentManager.search(config.table, query, searchFields, userId, parseInt(limit));

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

        const analytics = await politicalContentManager.getAnalytics(config.table, userId);

        res.json(analytics);
    } catch (error) {
        console.error(`Error getting analytics for ${req.params.contentType}:`, error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

module.exports = router;