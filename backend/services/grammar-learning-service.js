/**
 * Grammar & AP Style Learning Service
 *
 * Captures user feedback on suggestions and learns patterns to enhance rules
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class GrammarLearningService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/grammar-learning.db');
    this.db = null;
    this.initDatabase();
  }

  /**
   * Initialize database with schema
   */
  initDatabase() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Failed to open grammar learning database:', err);
      } else {
        // Load schema
        const fs = require('fs');
        const schemaPath = path.join(__dirname, '../data/grammar-learning-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        this.db.exec(schema, (err) => {
          if (err) {
            console.error('Failed to initialize schema:', err);
          } else {
            console.log('Grammar learning database initialized');
          }
        });
      }
    });
  }

  /**
   * Record user feedback on a grammar/AP style suggestion
   */
  async recordFeedback(feedbackData) {
    const {
      ruleId,
      category,
      issueType,
      originalText,
      suggestedCorrection,
      contextBefore,
      contextAfter,
      fullSentence,
      userAction,           // accepted, rejected, modified, ignored
      userCorrection,
      userComment,
      contentId,
      userId
    } = feedbackData;

    // Create pattern hash for clustering
    const patternHash = this.createPatternHash(originalText, category, issueType);

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO grammar_feedback (
          rule_id, category, issue_type, original_text, suggested_correction,
          context_before, context_after, full_sentence, user_action, user_correction,
          user_comment, content_id, user_id, pattern_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        ruleId, category, issueType, originalText, suggestedCorrection,
        contextBefore, contextAfter, fullSentence, userAction, userCorrection,
        userComment, contentId, userId, patternHash
      ], function(err) {
        if (err) reject(err);
        else {
          resolve({ feedbackId: this.lastID });

          // Asynchronously analyze patterns
          this.analyzePatterns(patternHash).catch(console.error);
        }
      }.bind(this));
    });
  }

  /**
   * Create a hash for pattern matching
   */
  createPatternHash(text, category, issueType) {
    // Normalize text for pattern matching
    const normalized = text
      .toLowerCase()
      .replace(/[0-9]/g, '#')           // Replace numbers with #
      .replace(/[A-Z][a-z]+/g, 'NAME')  // Replace capitalized words with NAME
      .replace(/\s+/g, ' ')
      .trim();

    const signature = `${category}:${issueType}:${normalized}`;
    return crypto.createHash('md5').update(signature).digest('hex');
  }

  /**
   * Analyze patterns from similar feedback
   */
  async analyzePatterns(patternHash) {
    return new Promise((resolve, reject) => {
      // Get all feedback with same pattern hash
      const sql = `
        SELECT * FROM grammar_feedback
        WHERE pattern_hash = ?
        ORDER BY timestamp DESC
      `;

      this.db.all(sql, [patternHash], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        if (rows.length >= 3) {  // Need at least 3 examples to form a pattern
          const acceptanceRate = rows.filter(r => r.user_action === 'accepted').length / rows.length;
          const rejectionRate = rows.filter(r => r.user_action === 'rejected').length / rows.length;

          // If 80%+ acceptance or rejection, create/update cluster
          if (acceptanceRate >= 0.8 || rejectionRate >= 0.8) {
            this.createOrUpdateCluster(patternHash, rows, acceptanceRate).catch(console.error);
          }
        }

        resolve({ analyzed: rows.length });
      });
    });
  }

  /**
   * Create or update a feedback cluster
   */
  async createOrUpdateCluster(patternHash, feedbackRows, acceptanceRate) {
    const feedbackIds = feedbackRows.map(r => r.id);
    const commonPattern = this.extractCommonPattern(feedbackRows);
    const suggestedRule = this.generateRuleSuggestion(feedbackRows, acceptanceRate);

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO feedback_clusters (
          cluster_type, pattern_signature, feedback_ids, feedback_count,
          common_pattern, pattern_confidence, acceptance_rate, suggested_rule
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pattern_signature) DO UPDATE SET
          feedback_ids = excluded.feedback_ids,
          feedback_count = excluded.feedback_count,
          acceptance_rate = excluded.acceptance_rate,
          suggested_rule = excluded.suggested_rule
      `;

      this.db.run(sql, [
        'similar_patterns',
        patternHash,
        JSON.stringify(feedbackIds),
        feedbackRows.length,
        commonPattern,
        acceptanceRate,
        acceptanceRate,
        JSON.stringify(suggestedRule)
      ], function(err) {
        if (err) reject(err);
        else resolve({ clusterId: this.lastID });
      });
    });
  }

  /**
   * Extract common pattern from feedback examples
   */
  extractCommonPattern(feedbackRows) {
    // Find common structure
    const texts = feedbackRows.map(r => r.original_text);

    // Simple pattern: find common prefix/suffix
    let commonPrefix = texts[0];
    for (let text of texts) {
      while (!text.startsWith(commonPrefix)) {
        commonPrefix = commonPrefix.slice(0, -1);
      }
    }

    return commonPrefix || texts[0];
  }

  /**
   * Generate rule suggestion from pattern
   */
  generateRuleSuggestion(feedbackRows, acceptanceRate) {
    const firstRow = feedbackRows[0];
    const action = acceptanceRate >= 0.8 ? 'auto_correct' : 'ignore';

    return {
      ruleType: 'pattern',
      category: firstRow.category,
      pattern: this.extractCommonPattern(feedbackRows),
      action: action,
      correction: firstRow.suggested_correction,
      message: firstRow.user_comment || `Learned from ${feedbackRows.length} examples`,
      confidence: acceptanceRate,
      supportCount: feedbackRows.filter(r => r.user_action === 'accepted').length
    };
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(options = {}) {
    const { category, ruleId, timeframe = '30 days' } = options;

    return new Promise((resolve, reject) => {
      let sql = `
        SELECT
          category,
          rule_id,
          user_action,
          COUNT(*) as count,
          AVG(CASE WHEN user_action = 'accepted' THEN 1 ELSE 0 END) as acceptance_rate
        FROM grammar_feedback
        WHERE timestamp >= datetime('now', '-${timeframe}')
      `;

      const params = [];
      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (ruleId) {
        sql += ' AND rule_id = ?';
        params.push(ruleId);
      }

      sql += ' GROUP BY category, rule_id, user_action ORDER BY count DESC';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Get pending clusters for review
   */
  async getPendingClusters() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM feedback_clusters
        WHERE status = 'pending'
        ORDER BY feedback_count DESC, acceptance_rate DESC
        LIMIT 50
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Approve a learned rule
   */
  async approveLearnedRule(clusterId, approvedBy) {
    return new Promise((resolve, reject) => {
      // Get cluster
      this.db.get('SELECT * FROM feedback_clusters WHERE id = ?', [clusterId], (err, cluster) => {
        if (err) {
          reject(err);
          return;
        }

        const suggestedRule = JSON.parse(cluster.suggested_rule);

        // Create learned rule
        const sql = `
          INSERT INTO learned_rules (
            rule_type, category, pattern, pattern_type, action, correction,
            message, severity, confidence, support_count, learned_from,
            source_feedback_ids, status, approved_by, approved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `;

        this.db.run(sql, [
          suggestedRule.ruleType,
          suggestedRule.category,
          suggestedRule.pattern,
          'regex',
          suggestedRule.action,
          suggestedRule.correction,
          suggestedRule.message,
          'suggestion',
          suggestedRule.confidence,
          suggestedRule.supportCount,
          'user_feedback',
          cluster.feedback_ids,
          'approved',
          approvedBy
        ], function(err) {
          if (err) {
            reject(err);
            return;
          }

          const learnedRuleId = this.lastID;

          // Update cluster
          this.db.run(
            'UPDATE feedback_clusters SET status = ?, learned_rule_id = ?, reviewed_by = ?, reviewed_at = datetime("now") WHERE id = ?',
            ['rule_created', learnedRuleId, approvedBy, clusterId],
            (err) => {
              if (err) reject(err);
              else resolve({ learnedRuleId, clusterId });
            }
          );
        }.bind(this));
      });
    });
  }

  /**
   * Get active learned rules
   */
  async getActiveLearnedRules(category = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM learned_rules
        WHERE status = 'active'
      `;

      const params = [];
      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }

      sql += ' ORDER BY confidence DESC, support_count DESC';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Add custom terminology
   */
  async addCustomTerm(termData) {
    const {
      term,
      correctForm,
      termType,
      category,
      capitalizationRule,
      commonMisspellings,
      acceptableVariations,
      source = 'manual'
    } = termData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO custom_terminology (
          term, correct_form, term_type, category, capitalization_rule,
          common_misspellings, acceptable_variations, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(term) DO UPDATE SET
          correct_form = excluded.correct_form,
          capitalization_rule = excluded.capitalization_rule,
          common_misspellings = excluded.common_misspellings,
          updated_at = CURRENT_TIMESTAMP
      `;

      this.db.run(sql, [
        term, correctForm, termType, category, capitalizationRule,
        JSON.stringify(commonMisspellings || []),
        JSON.stringify(acceptableVariations || []),
        source
      ], function(err) {
        if (err) reject(err);
        else resolve({ termId: this.lastID });
      });
    });
  }

  /**
   * Get all custom terminology
   */
  async getCustomTerminology(category = null) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM custom_terminology';
      const params = [];

      if (category) {
        sql += ' WHERE category = ?';
        params.push(category);
      }

      sql += ' ORDER BY term';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Parse JSON fields
          const terms = rows.map(row => ({
            ...row,
            commonMisspellings: JSON.parse(row.common_misspellings || '[]'),
            acceptableVariations: JSON.parse(row.acceptable_variations || '[]')
          }));
          resolve(terms);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = GrammarLearningService;
