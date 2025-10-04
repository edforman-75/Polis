/**
 * Validation Queue API Routes
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const ValidationQueueService = require('../services/validation-queue-service');

const validationService = new ValidationQueueService();

/**
 * POST /api/validation/load-press-releases
 * Load Spanberger press releases into validation queue
 */
router.post('/load-press-releases', async (req, res) => {
  try {
    const { addedBy = 'system' } = req.body;
    const directoryPath = path.join(__dirname, '../../cpo_examples');

    const results = await validationService.loadPressReleasesIntoQueue(directoryPath, addedBy);

    res.json({
      success: true,
      loaded: results.length,
      items: results
    });
  } catch (error) {
    console.error('Error loading press releases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validation/analyze/:id
 * Analyze a queue item
 */
router.post('/analyze/:id', async (req, res) => {
  try {
    const queueItemId = parseInt(req.params.id);
    const result = await validationService.analyzeQueueItem(queueItemId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error analyzing queue item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validation/analyze-all
 * Analyze all unanalyzed queue items
 */
router.post('/analyze-all', async (req, res) => {
  try {
    const items = await validationService.getQueueItems({ status: 'pending' });
    const results = [];

    for (const item of items) {
      if (!item.analysis_completed) {
        const result = await validationService.analyzeQueueItem(item.id);
        results.push(result);
      }
    }

    res.json({
      success: true,
      analyzed: results.length,
      results
    });
  } catch (error) {
    console.error('Error analyzing all items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/validation/next
 * Get next item for review
 */
router.get('/next', async (req, res) => {
  try {
    const { reviewerInitials } = req.query;
    const item = await validationService.getNextForReview(reviewerInitials);

    if (!item) {
      res.json({
        success: true,
        item: null,
        message: 'No items pending review'
      });
    } else {
      res.json({
        success: true,
        item
      });
    }
  } catch (error) {
    console.error('Error getting next item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validation/:id/start-review
 * Start reviewing an item
 */
router.post('/:id/start-review', async (req, res) => {
  try {
    const queueItemId = parseInt(req.params.id);
    const { reviewerInitials } = req.body;

    const result = await validationService.startReview(queueItemId, reviewerInitials);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error starting review:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validation/issue/:id/review
 * Review an issue
 */
router.post('/issue/:id/review', async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const result = await validationService.reviewIssue(issueId, req.body);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error reviewing issue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validation/:id/comment
 * Add comment to queue item
 */
router.post('/:id/comment', async (req, res) => {
  try {
    const queueItemId = parseInt(req.params.id);
    const commentId = await validationService.addComment({
      queueItemId,
      ...req.body
    });

    res.json({
      success: true,
      commentId
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validation/:id/complete
 * Complete review of queue item
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const queueItemId = parseInt(req.params.id);
    const { reviewerInitials, notes } = req.body;

    const result = await validationService.completeReview(queueItemId, reviewerInitials, notes);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error completing review:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/validation/summary
 * Get queue summary
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await validationService.getQueueSummary();

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/validation/kb-suggestions
 * Get pending KB suggestions
 */
router.get('/kb-suggestions', async (req, res) => {
  try {
    const suggestions = await validationService.getPendingKbSuggestions();

    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Error getting KB suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/validation/stats/:reviewerInitials
 * Get session stats for reviewer
 */
router.get('/stats/:reviewerInitials', async (req, res) => {
  try {
    const { reviewerInitials } = req.params;
    const stats = await validationService.getSessionStats(reviewerInitials);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/validation/items
 * Get queue items
 */
router.get('/items', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const items = await validationService.getQueueItems({
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    });

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
