/**
 * Validation Queue Service
 *
 * Manages press release validation queue, issue tracking, and knowledge base enhancement
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const GrammarStyleChecker = require('./grammar-style-checker');

class ValidationQueueService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/validation-queue.db');
    this.db = null;
    this.grammarChecker = new GrammarStyleChecker();
    this.initDatabase();
  }

  /**
   * Initialize database
   */
  initDatabase() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Failed to open validation queue database:', err);
      } else {
        const schemaPath = path.join(__dirname, '../data/validation-queue-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        this.db.exec(schema, (err) => {
          if (err) {
            console.error('Failed to initialize validation schema:', err);
          } else {
            console.log('Validation queue database initialized');
          }
        });
      }
    });
  }

  /**
   * Load press releases from directory into queue
   */
  async loadPressReleasesIntoQueue(directoryPath, addedBy = 'system') {
    const files = fs.readdirSync(directoryPath)
      .filter(f => f.startsWith('spanberger_') && f.endsWith('.txt'))
      .sort();

    const results = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = content.split('\n')[0];

      const queueItemId = await this.addToQueue({
        sourceFile: file,
        sourceType: 'press_release',
        title: title.substring(0, 200),
        content: content,
        addedBy: addedBy
      });

      results.push({ file, queueItemId });
    }

    return results;
  }

  /**
   * Add item to validation queue
   */
  async addToQueue(itemData) {
    const { sourceFile, sourceType, title, content, addedBy, priority = 0 } = itemData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO validation_queue (source_file, source_type, title, content, added_by, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [sourceFile, sourceType, title, content, addedBy, priority], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * Analyze queue item and store issues
   */
  async analyzeQueueItem(queueItemId) {
    return new Promise(async (resolve, reject) => {
      // Get queue item
      this.db.get('SELECT * FROM validation_queue WHERE id = ?', [queueItemId], async (err, item) => {
        if (err) {
          reject(err);
          return;
        }

        if (!item) {
          reject(new Error('Queue item not found'));
          return;
        }

        // Run grammar/style analysis
        const analysis = await this.grammarChecker.checkContent(item.content);

        // Store issues
        for (const issue of analysis.issues) {
          await this.storeIssue(queueItemId, issue);
        }

        // Update queue item
        this.db.run(
          `UPDATE validation_queue
           SET analysis_completed = 1,
               analysis_completed_at = datetime('now'),
               overall_score = ?,
               issue_count = ?
           WHERE id = ?`,
          [analysis.overallScore, analysis.issues.length, queueItemId],
          (err) => {
            if (err) reject(err);
            else resolve({ queueItemId, issueCount: analysis.issues.length, score: analysis.overallScore });
          }
        );
      });
    });
  }

  /**
   * Store an issue
   */
  async storeIssue(queueItemId, issue) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO validation_issues (
          queue_item_id, category, type, severity, rule_id,
          offset, length, original_text, context_before, context_after,
          suggested_correction, message, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const contextBefore = issue.context?.text?.substring(0, issue.context?.highlightStart) || '';
      const contextAfter = issue.context?.text?.substring(
        (issue.context?.highlightStart || 0) + (issue.context?.highlightLength || 0)
      ) || '';

      const originalText = issue.context?.text?.substring(
        issue.context?.highlightStart || 0,
        (issue.context?.highlightStart || 0) + (issue.context?.highlightLength || 0)
      ) || '';

      this.db.run(sql, [
        queueItemId,
        issue.category,
        issue.type,
        issue.severity,
        issue.ruleId,
        issue.offset,
        issue.length,
        originalText,
        contextBefore,
        contextAfter,
        issue.correction,
        issue.message,
        issue.confidence || null
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * Get next item for review
   */
  async getNextForReview(reviewerInitials = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM validation_queue
        WHERE review_status = 'pending'
        AND analysis_completed = 1
        ORDER BY priority DESC, added_to_queue_at ASC
        LIMIT 1
      `;

      this.db.get(sql, [], async (err, item) => {
        if (err) {
          reject(err);
          return;
        }

        if (!item) {
          resolve(null);
          return;
        }

        // Get issues for this item
        const issues = await this.getIssuesForItem(item.id);

        resolve({ ...item, issues });
      });
    });
  }

  /**
   * Get issues for queue item
   */
  async getIssuesForItem(queueItemId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM validation_issues WHERE queue_item_id = ? ORDER BY offset ASC';

      this.db.all(sql, [queueItemId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Start reviewing an item
   */
  async startReview(queueItemId, reviewerInitials) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE validation_queue
        SET review_status = 'in_review',
            reviewer_initials = ?,
            review_started_at = datetime('now')
        WHERE id = ?
      `;

      this.db.run(sql, [reviewerInitials, queueItemId], (err) => {
        if (err) reject(err);
        else resolve({ queueItemId, reviewerInitials });
      });
    });
  }

  /**
   * Review an issue
   */
  async reviewIssue(issueId, reviewData) {
    const {
      reviewerInitials,
      reviewStatus,      // accepted, rejected, modified, noted
      reviewerAction,
      reviewerCorrection,
      reviewerComment,
      shouldAddToKb,
      kbCategory,
      kbNotes
    } = reviewData;

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE validation_issues
        SET review_status = ?,
            reviewer_initials = ?,
            reviewer_action = ?,
            reviewer_correction = ?,
            reviewer_comment = ?,
            should_add_to_kb = ?,
            kb_category = ?,
            kb_notes = ?,
            reviewed_at = datetime('now')
        WHERE id = ?
      `;

      this.db.run(sql, [
        reviewStatus,
        reviewerInitials,
        reviewerAction,
        reviewerCorrection,
        reviewerComment,
        shouldAddToKb ? 1 : 0,
        kbCategory,
        kbNotes,
        issueId
      ], (err) => {
        if (err) reject(err);
        else resolve({ issueId });
      });
    });
  }

  /**
   * Add comment to queue item
   */
  async addComment(commentData) {
    const {
      queueItemId,
      issueId,
      commentType,
      commentText,
      reviewerInitials,
      suggestsKbEntry,
      kbEntryType,
      kbEntryData
    } = commentData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO validation_comments (
          queue_item_id, issue_id, comment_type, comment_text, reviewer_initials,
          suggests_kb_entry, kb_entry_type, kb_entry_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        queueItemId,
        issueId || null,
        commentType,
        commentText,
        reviewerInitials,
        suggestsKbEntry ? 1 : 0,
        kbEntryType,
        kbEntryData ? JSON.stringify(kbEntryData) : null
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * Complete review of queue item
   */
  async completeReview(queueItemId, reviewerInitials, notes = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE validation_queue
        SET review_status = 'completed',
            reviewer_initials = ?,
            review_completed_at = datetime('now'),
            notes = COALESCE(?, notes)
        WHERE id = ?
      `;

      this.db.run(sql, [reviewerInitials, notes, queueItemId], (err) => {
        if (err) reject(err);
        else resolve({ queueItemId });
      });
    });
  }

  /**
   * Get validation queue summary
   */
  async getQueueSummary() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          review_status,
          COUNT(*) as count,
          AVG(overall_score) as avg_score,
          SUM(issue_count) as total_issues
        FROM validation_queue
        GROUP BY review_status
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Get pending KB suggestions
   */
  async getPendingKbSuggestions() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.*,
          v.original_text,
          v.suggested_correction,
          v.category,
          v.type,
          q.title as source_title
        FROM validation_comments c
        JOIN validation_issues v ON c.issue_id = v.id
        JOIN validation_queue q ON c.queue_item_id = q.id
        WHERE c.suggests_kb_entry = 1
        AND c.status = 'pending'
        ORDER BY c.created_at DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Get review session stats
   */
  async getSessionStats(reviewerInitials) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          COUNT(*) as items_reviewed,
          SUM(issue_count) as total_issues,
          AVG(overall_score) as avg_score,
          COUNT(DISTINCT reviewer_initials) as reviewers
        FROM validation_queue
        WHERE reviewer_initials = ?
        AND review_status = 'completed'
      `;

      this.db.get(sql, [reviewerInitials], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get all queue items with pagination
   */
  async getQueueItems(options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM validation_queue';
      const params = [];

      if (status) {
        sql += ' WHERE review_status = ?';
        params.push(status);
      }

      sql += ' ORDER BY priority DESC, added_to_queue_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Close database
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = ValidationQueueService;
