/**
 * Collaboration Service
 * Manages comments, mentions, notifications, and team collaboration
 */

const Database = require('better-sqlite3');
const path = require('path');

class CollaborationService {
  constructor() {
    const dbPath = path.join(__dirname, '../data/workflow.db');
    this.db = new Database(dbPath);
  }

  // ========================================================================
  // COMMENTS
  // ========================================================================

  createComment(commentData, authorId) {
    const {
      content_id,
      content_type,
      parent_comment_id,
      comment_text,
      comment_type,
      position_start,
      position_end
    } = commentData;

    const insert = this.db.prepare(`
      INSERT INTO comments
      (content_id, content_type, parent_comment_id, author_id, comment_text, comment_type, position_start, position_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      content_id,
      content_type,
      parent_comment_id || null,
      authorId,
      comment_text,
      comment_type || 'general',
      position_start || null,
      position_end || null
    );

    const commentId = result.lastInsertRowid;

    // Extract and process mentions
    this.processMentions(commentId, comment_text);

    return this.getComment(commentId);
  }

  getComment(commentId) {
    const comment = this.db.prepare(`
      SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    if (!comment) return null;

    // Get mentions
    comment.mentions = this.db.prepare(`
      SELECT cm.*, u.full_name, u.username
      FROM comment_mentions cm
      JOIN users u ON cm.mentioned_user_id = u.id
      WHERE cm.comment_id = ?
    `).all(commentId);

    // Get reactions
    comment.reactions = this.db.prepare(`
      SELECT reaction_type, COUNT(*) as count
      FROM comment_reactions
      WHERE comment_id = ?
      GROUP BY reaction_type
    `).all(commentId);

    // Get replies if this is a parent comment
    comment.replies = this.db.prepare(`
      SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.parent_comment_id = ?
      ORDER BY c.created_at
    `).all(commentId);

    return comment;
  }

  getCommentsForContent(contentId, contentType, includeResolved = false) {
    let query = `
      SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.content_id = ? AND c.content_type = ? AND c.parent_comment_id IS NULL
    `;

    const params = [contentId, contentType];

    if (!includeResolved) {
      query += ` AND c.status != 'resolved'`;
    }

    query += ' ORDER BY c.created_at DESC';

    const comments = this.db.prepare(query).all(...params);

    // Get reply counts and reactions for each comment
    comments.forEach(comment => {
      comment.reply_count = this.db.prepare(`
        SELECT COUNT(*) as count FROM comments WHERE parent_comment_id = ?
      `).get(comment.id).count;

      comment.reactions = this.db.prepare(`
        SELECT reaction_type, COUNT(*) as count
        FROM comment_reactions
        WHERE comment_id = ?
        GROUP BY reaction_type
      `).all(comment.id);
    });

    return comments;
  }

  updateComment(commentId, commentText, userId) {
    const comment = this.getComment(commentId);

    if (!comment || comment.author_id !== userId) {
      throw new Error('Unauthorized to edit this comment');
    }

    const update = this.db.prepare(`
      UPDATE comments
      SET comment_text = ?, updated_at = CURRENT_TIMESTAMP, edited = 1
      WHERE id = ?
    `);

    update.run(commentText, commentId);

    // Reprocess mentions
    this.db.prepare('DELETE FROM comment_mentions WHERE comment_id = ?').run(commentId);
    this.processMentions(commentId, commentText);

    return this.getComment(commentId);
  }

  resolveComment(commentId, resolvedBy) {
    const update = this.db.prepare(`
      UPDATE comments
      SET status = 'resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return update.run(resolvedBy, commentId);
  }

  deleteComment(commentId, userId) {
    const comment = this.getComment(commentId);

    if (!comment || comment.author_id !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Delete comment and all replies (cascade)
    this.db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
  }

  // ========================================================================
  // MENTIONS
  // ========================================================================

  processMentions(commentId, commentText) {
    // Extract @username mentions from text
    const mentionPattern = /@(\w+)/g;
    const matches = [...commentText.matchAll(mentionPattern)];

    if (matches.length === 0) return;

    const insertMention = this.db.prepare(`
      INSERT INTO comment_mentions (comment_id, mentioned_user_id)
      VALUES (?, ?)
    `);

    matches.forEach(match => {
      const username = match[1];
      const user = this.db.prepare('SELECT id FROM users WHERE username = ?').get(username);

      if (user) {
        insertMention.run(commentId, user.id);

        // Create notification
        this.createNotification({
          user_id: user.id,
          notification_type: 'mention',
          title: 'You were mentioned in a comment',
          message: commentText.substring(0, 200),
          related_content_id: commentId
        });
      }
    });
  }

  getUserMentions(userId, unreadOnly = false) {
    let query = `
      SELECT cm.*, c.comment_text, c.content_id, c.content_type,
             u.full_name as author_name, c.created_at
      FROM comment_mentions cm
      JOIN comments c ON cm.comment_id = c.id
      JOIN users u ON c.author_id = u.id
      WHERE cm.mentioned_user_id = ?
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND cm.read = 0';
    }

    query += ' ORDER BY c.created_at DESC';

    return this.db.prepare(query).all(...params);
  }

  markMentionRead(mentionId) {
    this.db.prepare(`
      UPDATE comment_mentions
      SET read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(mentionId);
  }

  // ========================================================================
  // REACTIONS
  // ========================================================================

  addReaction(commentId, userId, reactionType) {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO comment_reactions (comment_id, user_id, reaction_type)
      VALUES (?, ?, ?)
    `);

    return insert.run(commentId, userId, reactionType);
  }

  removeReaction(commentId, userId, reactionType) {
    const del = this.db.prepare(`
      DELETE FROM comment_reactions
      WHERE comment_id = ? AND user_id = ? AND reaction_type = ?
    `);

    return del.run(commentId, userId, reactionType);
  }

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================

  createNotification(notificationData) {
    const {
      user_id,
      notification_type,
      title,
      message,
      action_url,
      related_content_id,
      related_content_type,
      priority
    } = notificationData;

    const insert = this.db.prepare(`
      INSERT INTO notifications
      (user_id, notification_type, title, message, action_url, related_content_id, related_content_type, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      user_id,
      notification_type,
      title,
      message,
      action_url || null,
      related_content_id || null,
      related_content_type || null,
      priority || 'normal'
    );

    return result.lastInsertRowid;
  }

  getUserNotifications(userId, unreadOnly = false, limit = 50) {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return this.db.prepare(query).all(...params);
  }

  markNotificationRead(notificationId) {
    this.db.prepare(`
      UPDATE notifications
      SET read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(notificationId);
  }

  markAllNotificationsRead(userId) {
    this.db.prepare(`
      UPDATE notifications
      SET read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND read = 0
    `).run(userId);
  }

  getUnreadNotificationCount(userId) {
    return this.db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND read = 0
    `).get(userId).count;
  }

  // ========================================================================
  // ACTIVITY LOG
  // ========================================================================

  logActivity(activityData) {
    const { user_id, action_type, content_id, content_type, description, metadata } = activityData;

    const insert = this.db.prepare(`
      INSERT INTO activity_log
      (user_id, action_type, content_id, content_type, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    return insert.run(
      user_id,
      action_type,
      content_id || null,
      content_type || null,
      description,
      metadata ? JSON.stringify(metadata) : null
    );
  }

  getActivityLog(filters = {}) {
    let query = `
      SELECT al.*, u.full_name as user_name
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action_type) {
      query += ' AND al.action_type = ?';
      params.push(filters.action_type);
    }

    if (filters.content_id && filters.content_type) {
      query += ' AND al.content_id = ? AND al.content_type = ?';
      params.push(filters.content_id, filters.content_type);
    }

    if (filters.since) {
      query += ' AND al.created_at >= ?';
      params.push(filters.since);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(filters.limit || 100);

    const activities = this.db.prepare(query).all(...params);

    // Parse metadata
    activities.forEach(activity => {
      if (activity.metadata) {
        try {
          activity.metadata = JSON.parse(activity.metadata);
        } catch (e) {
          activity.metadata = null;
        }
      }
    });

    return activities;
  }

  // ========================================================================
  // COLLABORATION STATISTICS
  // ========================================================================

  getCollaborationStats(userId = null) {
    const stats = {
      total_comments: 0,
      unresolved_comments: 0,
      unread_mentions: 0,
      unread_notifications: 0
    };

    if (userId) {
      // User-specific stats
      stats.unread_mentions = this.db.prepare(`
        SELECT COUNT(*) as count FROM comment_mentions
        WHERE mentioned_user_id = ? AND read = 0
      `).get(userId).count;

      stats.unread_notifications = this.getUnreadNotificationCount(userId);
    }

    // Global stats
    stats.total_comments = this.db.prepare(`
      SELECT COUNT(*) as count FROM comments
    `).get().count;

    stats.unresolved_comments = this.db.prepare(`
      SELECT COUNT(*) as count FROM comments
      WHERE status = 'open'
    `).get().count;

    return stats;
  }
}

module.exports = CollaborationService;
