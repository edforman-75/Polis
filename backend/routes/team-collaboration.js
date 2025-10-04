/**
 * Team Collaboration API Routes
 * Handles comments, mentions, notifications, and activity logging
 */

const express = require('express');
const router = express.Router();
const CollaborationService = require('../services/collaboration-service');

const collaborationService = new CollaborationService();

// ============================================================================
// COMMENTS
// ============================================================================

// Create comment
router.post('/comments', (req, res) => {
  try {
    const { author_id = 1 } = req.body; // TODO: Get from session
    const comment = collaborationService.createComment(req.body, author_id);
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get comment
router.get('/comments/:id', (req, res) => {
  try {
    const comment = collaborationService.getComment(parseInt(req.params.id));
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get comments for content
router.get('/content/:contentType/:contentId/comments', (req, res) => {
  try {
    const { include_resolved = 'false' } = req.query;
    const comments = collaborationService.getCommentsForContent(
      parseInt(req.params.contentId),
      req.params.contentType,
      include_resolved === 'true'
    );
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update comment
router.put('/comments/:id', (req, res) => {
  try {
    const { comment_text, user_id = 1 } = req.body; // TODO: Get from session
    const comment = collaborationService.updateComment(
      parseInt(req.params.id),
      comment_text,
      user_id
    );
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resolve comment
router.post('/comments/:id/resolve', (req, res) => {
  try {
    const { resolved_by = 1 } = req.body; // TODO: Get from session
    collaborationService.resolveComment(parseInt(req.params.id), resolved_by);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete comment
router.delete('/comments/:id', (req, res) => {
  try {
    const { user_id = 1 } = req.body; // TODO: Get from session
    collaborationService.deleteComment(parseInt(req.params.id), user_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// REACTIONS
// ============================================================================

// Add reaction
router.post('/comments/:commentId/reactions', (req, res) => {
  try {
    const { user_id = 1, reaction_type } = req.body; // TODO: Get from session
    collaborationService.addReaction(parseInt(req.params.commentId), user_id, reaction_type);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove reaction
router.delete('/comments/:commentId/reactions/:reactionType', (req, res) => {
  try {
    const { user_id = 1 } = req.body; // TODO: Get from session
    collaborationService.removeReaction(
      parseInt(req.params.commentId),
      user_id,
      req.params.reactionType
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MENTIONS
// ============================================================================

// Get user's mentions
router.get('/users/:userId/mentions', (req, res) => {
  try {
    const { unread_only = 'false' } = req.query;
    const mentions = collaborationService.getUserMentions(
      parseInt(req.params.userId),
      unread_only === 'true'
    );
    res.json({ success: true, mentions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark mention as read
router.post('/mentions/:id/read', (req, res) => {
  try {
    collaborationService.markMentionRead(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

// Create notification
router.post('/notifications', (req, res) => {
  try {
    const notificationId = collaborationService.createNotification(req.body);
    res.json({ success: true, notification_id: notificationId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's notifications
router.get('/users/:userId/notifications', (req, res) => {
  try {
    const { unread_only = 'false', limit = 50 } = req.query;
    const notifications = collaborationService.getUserNotifications(
      parseInt(req.params.userId),
      unread_only === 'true',
      parseInt(limit)
    );
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', (req, res) => {
  try {
    collaborationService.markNotificationRead(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all notifications as read
router.post('/users/:userId/notifications/read-all', (req, res) => {
  try {
    collaborationService.markAllNotificationsRead(parseInt(req.params.userId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
router.get('/users/:userId/notifications/unread-count', (req, res) => {
  try {
    const count = collaborationService.getUnreadNotificationCount(parseInt(req.params.userId));
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ACTIVITY LOG
// ============================================================================

// Log activity
router.post('/activity', (req, res) => {
  try {
    collaborationService.logActivity(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get activity log
router.get('/activity', (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id ? parseInt(req.query.user_id) : null,
      action_type: req.query.action_type,
      content_id: req.query.content_id ? parseInt(req.query.content_id) : null,
      content_type: req.query.content_type,
      since: req.query.since,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };

    const activities = collaborationService.getActivityLog(filters);
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATISTICS
// ============================================================================

// Get collaboration statistics
router.get('/stats', (req, res) => {
  try {
    const { user_id } = req.query;
    const stats = collaborationService.getCollaborationStats(
      user_id ? parseInt(user_id) : null
    );
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
