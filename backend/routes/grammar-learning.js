/**
 * Grammar Learning API Routes
 * Endpoints for feedback collection and rule management
 */

const express = require('express');
const router = express.Router();
const GrammarLearningService = require('../services/grammar-learning-service');

const learningService = new GrammarLearningService();

/**
 * POST /api/grammar-learning/feedback
 * Record user feedback on a grammar/AP style suggestion
 */
router.post('/feedback', async (req, res) => {
  try {
    const result = await learningService.recordFeedback(req.body);
    res.json({
      success: true,
      feedbackId: result.feedbackId,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/grammar-learning/stats
 * Get feedback statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { category, ruleId, timeframe } = req.query;
    const stats = await learningService.getFeedbackStats({ category, ruleId, timeframe });

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
 * GET /api/grammar-learning/clusters/pending
 * Get pending pattern clusters for review
 */
router.get('/clusters/pending', async (req, res) => {
  try {
    const clusters = await learningService.getPendingClusters();

    res.json({
      success: true,
      clusters,
      count: clusters.length
    });
  } catch (error) {
    console.error('Error getting clusters:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/grammar-learning/clusters/:id/approve
 * Approve a cluster and create learned rule
 */
router.post('/clusters/:id/approve', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const { approvedBy } = req.body;

    const result = await learningService.approveLearnedRule(clusterId, approvedBy || 'system');

    res.json({
      success: true,
      learnedRuleId: result.learnedRuleId,
      message: 'Rule approved and activated'
    });
  } catch (error) {
    console.error('Error approving cluster:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/grammar-learning/rules/active
 * Get all active learned rules
 */
router.get('/rules/active', async (req, res) => {
  try {
    const { category } = req.query;
    const rules = await learningService.getActiveLearnedRules(category);

    res.json({
      success: true,
      rules,
      count: rules.length
    });
  } catch (error) {
    console.error('Error getting active rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/grammar-learning/terminology
 * Add custom terminology
 */
router.post('/terminology', async (req, res) => {
  try {
    const result = await learningService.addCustomTerm(req.body);

    res.json({
      success: true,
      termId: result.termId,
      message: 'Custom term added successfully'
    });
  } catch (error) {
    console.error('Error adding custom term:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/grammar-learning/terminology
 * Get all custom terminology
 */
router.get('/terminology', async (req, res) => {
  try {
    const { category } = req.query;
    const terms = await learningService.getCustomTerminology(category);

    res.json({
      success: true,
      terms,
      count: terms.length
    });
  } catch (error) {
    console.error('Error getting terminology:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/grammar-learning/terminology/batch
 * Bulk import terminology
 */
router.post('/terminology/batch', async (req, res) => {
  try {
    const { terms } = req.body;
    const results = [];

    for (const term of terms) {
      const result = await learningService.addCustomTerm(term);
      results.push(result);
    }

    res.json({
      success: true,
      imported: results.length,
      message: `${results.length} terms imported successfully`
    });
  } catch (error) {
    console.error('Error importing terms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
