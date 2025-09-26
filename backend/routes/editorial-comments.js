const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const { EditorialCommentService } = require('../services/editorial-comments');
const { APStyleChecker } = require('../services/ap-style-checker');

const commentService = new EditorialCommentService();
const apStyleChecker = new APStyleChecker();

// Get all comments for a resource
router.get('/:resourceType/:resourceId', requireAuth, requirePermission('comments.read'), async (req, res) => {
    try {
        const { resourceType, resourceId } = req.params;
        const { status, commentType, resolved, includeReplies } = req.query;

        const comments = await commentService.getCommentsForResource(resourceType, resourceId, {
            status,
            commentType,
            resolved: resolved !== undefined ? resolved === 'true' : null,
            includeReplies: includeReplies !== 'false'
        });

        res.json({
            success: true,
            comments,
            count: comments.length
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Add a new comment
router.post('/', requireAuth, requirePermission('comments.create'), async (req, res) => {
    try {
        const commentData = {
            ...req.body,
            userId: req.user.id
        };

        const comment = await commentService.addComment(commentData);

        res.status(201).json({
            success: true,
            comment
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update a comment
router.put('/:commentId', requireAuth, requirePermission('comments.edit_own'), async (req, res) => {
    try {
        const { commentId } = req.params;
        const updateData = req.body;

        const comment = await commentService.updateComment(commentId, req.user.id, updateData);

        res.json({
            success: true,
            comment
        });

    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get available comment types
router.get('/types', requireAuth, (req, res) => {
    try {
        const commentTypes = commentService.getCommentTypes();
        const reviewStages = commentService.getReviewStages();
        const priorityLevels = commentService.getPriorityLevels();

        res.json({
            success: true,
            commentTypes,
            reviewStages,
            priorityLevels
        });

    } catch (error) {
        console.error('Error fetching comment types:', error);
        res.status(500).json({ error: 'Failed to fetch comment types' });
    }
});

// Run AP Style check on content
router.post('/style-check', requireAuth, requirePermission('ap_style.enforce'), async (req, res) => {
    try {
        const { content, contentType = 'general' } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const results = apStyleChecker.comprehensiveCheck(content, contentType);

        res.json({
            success: true,
            styleCheck: results,
            metadata: {
                checkedBy: req.user.name,
                checkedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error running style check:', error);
        res.status(500).json({ error: 'Failed to run style check' });
    }
});

module.exports = router;