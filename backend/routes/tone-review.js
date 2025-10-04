const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const REVIEW_QUEUE_PATH = path.join(__dirname, '../data/tone-review-queue.json');

// Initialize queue file if it doesn't exist
function ensureQueueFile() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(REVIEW_QUEUE_PATH)) {
        fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify({
            queue: [],
            reviewed: [],
            stats: {
                total: 0,
                approved: 0,
                rejected: 0,
                modified: 0
            }
        }, null, 2));
    }
}

// Get queue data
function getQueue() {
    ensureQueueFile();
    return JSON.parse(fs.readFileSync(REVIEW_QUEUE_PATH, 'utf8'));
}

// Save queue data
function saveQueue(data) {
    fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify(data, null, 2));
}

/**
 * Add content to review queue
 */
router.post('/tone-review/queue', async (req, res) => {
    try {
        const {
            content,
            contentType,
            context,
            analysis,
            metadata = {}
        } = req.body;

        if (!content || !analysis) {
            return res.status(400).json({
                success: false,
                error: 'Content and analysis are required'
            });
        }

        const queueData = getQueue();

        const item = {
            id: Date.now().toString(),
            content,
            contentType,
            context,
            analysis,
            metadata,
            queuedAt: new Date().toISOString(),
            status: 'pending'
        };

        queueData.queue.push(item);
        queueData.stats.total++;

        saveQueue(queueData);

        res.json({
            success: true,
            message: 'Added to review queue',
            queuePosition: queueData.queue.length,
            itemId: item.id
        });

    } catch (error) {
        console.error('Failed to add to queue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add to queue',
            details: error.message
        });
    }
});

/**
 * Get next item for review
 */
router.get('/tone-review/next', (req, res) => {
    try {
        const queueData = getQueue();

        if (queueData.queue.length === 0) {
            return res.json({
                success: true,
                hasNext: false,
                remaining: 0
            });
        }

        const nextItem = queueData.queue[0];

        res.json({
            success: true,
            hasNext: true,
            item: nextItem,
            remaining: queueData.queue.length,
            stats: queueData.stats
        });

    } catch (error) {
        console.error('Failed to get next item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get next item',
            details: error.message
        });
    }
});

/**
 * Submit review decision
 */
router.post('/tone-review/decision', (req, res) => {
    try {
        const {
            itemId,
            decision, // 'approve' | 'reject' | 'modify'
            feedback,
            modifications = {}
        } = req.body;

        if (!itemId || !decision) {
            return res.status(400).json({
                success: false,
                error: 'Item ID and decision are required'
            });
        }

        const queueData = getQueue();

        // Find item in queue
        const itemIndex = queueData.queue.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in queue'
            });
        }

        const item = queueData.queue[itemIndex];

        // Create reviewed item
        const reviewedItem = {
            ...item,
            reviewedAt: new Date().toISOString(),
            decision,
            feedback,
            modifications
        };

        // Move to reviewed list
        queueData.reviewed.push(reviewedItem);
        queueData.queue.splice(itemIndex, 1);

        // Update stats
        if (decision === 'approve') {
            queueData.stats.approved++;
        } else if (decision === 'reject') {
            queueData.stats.rejected++;
        } else if (decision === 'modify') {
            queueData.stats.modified++;
        }

        saveQueue(queueData);

        res.json({
            success: true,
            message: `Review ${decision}ed`,
            remaining: queueData.queue.length,
            stats: queueData.stats
        });

    } catch (error) {
        console.error('Failed to submit decision:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit decision',
            details: error.message
        });
    }
});

/**
 * Get review statistics
 */
router.get('/tone-review/stats', (req, res) => {
    try {
        const queueData = getQueue();

        const accuracyStats = {
            total: queueData.stats.total,
            approved: queueData.stats.approved,
            rejected: queueData.stats.rejected,
            modified: queueData.stats.modified,
            accuracyRate: queueData.stats.total > 0
                ? Math.round((queueData.stats.approved / queueData.stats.total) * 100)
                : 0,
            pending: queueData.queue.length
        };

        res.json({
            success: true,
            stats: accuracyStats,
            recentReviews: queueData.reviewed.slice(-10).reverse()
        });

    } catch (error) {
        console.error('Failed to get stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stats',
            details: error.message
        });
    }
});

/**
 * Clear queue or reviewed items
 */
router.post('/tone-review/clear', (req, res) => {
    try {
        const { target = 'queue' } = req.body; // 'queue' | 'reviewed' | 'all'

        const queueData = getQueue();

        if (target === 'queue' || target === 'all') {
            queueData.queue = [];
        }

        if (target === 'reviewed' || target === 'all') {
            queueData.reviewed = [];
        }

        if (target === 'all') {
            queueData.stats = {
                total: 0,
                approved: 0,
                rejected: 0,
                modified: 0
            };
        }

        saveQueue(queueData);

        res.json({
            success: true,
            message: `Cleared ${target}`,
            stats: queueData.stats
        });

    } catch (error) {
        console.error('Failed to clear:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear',
            details: error.message
        });
    }
});

module.exports = router;
