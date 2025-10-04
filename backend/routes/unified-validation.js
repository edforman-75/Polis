/**
 * Unified Validation API Routes
 * Handles ALL validators through a single queuing system
 */

const express = require('express');
const router = express.Router();
const UnifiedValidationService = require('../services/unified-validation-service');

const validationService = new UnifiedValidationService();

// ============================================================================
// QUEUE SETUP
// ============================================================================

// Load press releases into queue
router.post('/load-releases', async (req, res) => {
  try {
    const { directory, added_by = 'system' } = req.body;
    const directoryPath = directory || './cpo_examples';

    const result = await validationService.loadPressReleasesIntoQueue(directoryPath, added_by);

    res.json({
      success: true,
      loaded: result.loaded,
      total: result.total,
      message: `Loaded ${result.loaded} new releases (${result.total} total files)`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze specific queue item
router.post('/analyze/:id', async (req, res) => {
  try {
    const { validators = ['grammar', 'compliance', 'tone', 'fact_check'] } = req.body;

    const result = await validationService.analyzeQueueItem(parseInt(req.params.id), validators);

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze all unanalyzed items
router.post('/analyze-all', async (req, res) => {
  try {
    const { validators = ['grammar', 'compliance'] } = req.body;

    const items = validationService.db.prepare(`
      SELECT id FROM unified_validation_queue
      WHERE overall_score IS NULL
    `).all();

    let analyzed = 0;
    for (const item of items) {
      await validationService.analyzeQueueItem(item.id, validators);
      analyzed++;
    }

    res.json({
      success: true,
      analyzed,
      message: `Analyzed ${analyzed} queue items`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// REVIEW WORKFLOW
// ============================================================================

// Get next pending item
router.get('/next', (req, res) => {
  try {
    const { reviewer_initials, validator_type } = req.query;

    const item = validationService.getNextPendingItem(
      reviewer_initials || 'REVIEWER',
      validator_type || null
    );

    if (!item) {
      return res.json({
        success: true,
        item: null,
        message: 'No pending items in queue'
      });
    }

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start review
router.post('/:id/start-review', (req, res) => {
  try {
    const { reviewer_initials } = req.body;

    const sessionId = validationService.startReview(
      parseInt(req.params.id),
      reviewer_initials
    );

    res.json({ success: true, session_id: sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Review an issue
router.post('/issue/:id/review', (req, res) => {
  try {
    validationService.reviewIssue(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete review
router.post('/:id/complete', (req, res) => {
  try {
    const { reviewer_initials, validator_type, notes } = req.body;

    validationService.completeReview(
      parseInt(req.params.id),
      reviewer_initials,
      validator_type || null,
      notes || null
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// QUEUE INFORMATION
// ============================================================================

// Get queue summary
router.get('/summary', (req, res) => {
  try {
    const summary = validationService.getQueueSummary();
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get validator-specific summary
router.get('/summary/:validatorType', (req, res) => {
  try {
    const summary = validationService.getValidatorSummary(req.params.validatorType);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific queue item
router.get('/:id', (req, res) => {
  try {
    const item = validationService.getQueueItem(parseInt(req.params.id));

    if (!item) {
      return res.status(404).json({ success: false, error: 'Queue item not found' });
    }

    // Get issues and validation results
    item.issues = validationService.getIssuesForItem(item.id);
    item.validation_results = validationService.db.prepare(`
      SELECT * FROM validation_results WHERE queue_item_id = ?
    `).all(item.id);

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reviewer stats
router.get('/stats/:reviewerInitials', (req, res) => {
  try {
    const stats = validationService.getReviewerStats(req.params.reviewerInitials);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// KNOWLEDGE BASE ENHANCEMENTS
// ============================================================================

// Get pending KB enhancements
router.get('/kb-enhancements/pending', (req, res) => {
  try {
    const { validator_type } = req.query;
    const enhancements = validationService.getKBPendingEnhancements(validator_type || null);

    res.json({ success: true, enhancements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve KB enhancement
router.post('/kb-enhancements/:id/approve', (req, res) => {
  try {
    const { reviewed_by, implementation_notes } = req.body;

    validationService.db.prepare(`
      UPDATE kb_pending_enhancements
      SET status = 'approved',
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          implementation_notes = ?
      WHERE id = ?
    `).run(reviewed_by, implementation_notes || '', parseInt(req.params.id));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject KB enhancement
router.post('/kb-enhancements/:id/reject', (req, res) => {
  try {
    const { reviewed_by, implementation_notes } = req.body;

    validationService.db.prepare(`
      UPDATE kb_pending_enhancements
      SET status = 'rejected',
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          implementation_notes = ?
      WHERE id = ?
    `).run(reviewed_by, implementation_notes || '', parseInt(req.params.id));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
