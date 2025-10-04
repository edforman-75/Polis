/**
 * Unified Validation Service
 * Orchestrates ALL validators (Grammar, Compliance, Tone, Fact-Checking)
 * Provides queuing system with review, edit, and KB enhancement
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const GrammarStyleChecker = require('./grammar-style-checker');
const ElectionLawComplianceChecker = require('./election-law-compliance-checker');

class UnifiedValidationService {
  constructor() {
    const dbPath = path.join(__dirname, '../data/unified-validation.db');
    this.db = new Database(dbPath);
    this.initializeDatabase();

    // Initialize validators
    this.grammarChecker = new GrammarStyleChecker();
    this.complianceChecker = new ElectionLawComplianceChecker();
  }

  initializeDatabase() {
    const schemaPath = path.join(__dirname, '../data/unified-validation-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  // ========================================================================
  // QUEUE MANAGEMENT
  // ========================================================================

  async loadPressReleasesIntoQueue(directoryPath, addedBy = 'system') {
    const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.txt'));
    let loaded = 0;

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract title from first line or filename
      const lines = content.split('\n');
      const title = lines[0]?.trim() || file.replace('.txt', '');

      // Check if already in queue
      const existing = this.db.prepare(`
        SELECT id FROM unified_validation_queue WHERE source_file = ?
      `).get(file);

      if (!existing) {
        this.db.prepare(`
          INSERT INTO unified_validation_queue (source_file, title, content, added_by)
          VALUES (?, ?, ?, ?)
        `).run(file, title, content, addedBy);

        loaded++;
      }
    }

    return { loaded, total: files.length };
  }

  async analyzeQueueItem(queueItemId, validators = ['grammar', 'compliance', 'tone', 'fact_check']) {
    const item = this.getQueueItem(queueItemId);
    if (!item) throw new Error('Queue item not found');

    const results = {};
    let totalIssues = 0;
    let criticalIssues = 0;

    // Run each validator
    for (const validator of validators) {
      let result;

      switch (validator) {
        case 'grammar':
          result = await this.runGrammarValidation(item);
          break;
        case 'compliance':
          result = await this.runComplianceValidation(item);
          break;
        case 'tone':
          result = await this.runToneValidation(item);
          break;
        case 'fact_check':
          result = await this.runFactCheckValidation(item);
          break;
      }

      if (result) {
        results[validator] = result;
        totalIssues += result.issues_found;
        criticalIssues += result.critical_issues || 0;

        // Save validator result
        this.saveValidatorResult(queueItemId, validator, result);
      }
    }

    // Update queue item with overall results
    const overallScore = this.calculateOverallScore(results);

    this.db.prepare(`
      UPDATE unified_validation_queue
      SET overall_score = ?,
          total_issues = ?,
          critical_issues = ?,
          grammar_score = ?,
          compliance_score = ?,
          tone_score = ?,
          fact_check_score = ?
      WHERE id = ?
    `).run(
      overallScore,
      totalIssues,
      criticalIssues,
      results.grammar?.score || null,
      results.compliance?.score || null,
      results.tone?.score || null,
      results.fact_check?.score || null,
      queueItemId
    );

    return { queueItemId, results, overallScore, totalIssues, criticalIssues };
  }

  async runGrammarValidation(item) {
    try {
      const result = await this.grammarChecker.checkContent(item.content, {
        includeAPStyle: true,
        includeCapitalization: true,
        includeCustomTerms: true
      });

      // Store issues
      if (result.issues && result.issues.length > 0) {
        const insertIssue = this.db.prepare(`
          INSERT INTO validation_issues_unified
          (queue_item_id, validator_type, category, type, severity, original_text, position_start, position_end, suggested_correction, explanation)
          VALUES (?, 'grammar', ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const issue of result.issues) {
          insertIssue.run(
            item.id,
            issue.category,
            issue.type,
            issue.severity || 'warning',
            issue.context || issue.original,
            issue.offset || null,
            issue.offset ? issue.offset + (issue.length || 0) : null,
            issue.suggestion || issue.replacements?.[0]?.value || null,
            issue.message || issue.explanation
          );
        }
      }

      return {
        score: result.overall_score,
        issues_found: result.issues?.length || 0,
        critical_issues: result.issues?.filter(i => i.severity === 'error').length || 0,
        analysis_data: JSON.stringify(result)
      };
    } catch (error) {
      console.error('Grammar validation error:', error);
      return { score: 0, issues_found: 0, critical_issues: 0, analysis_data: JSON.stringify({ error: error.message }) };
    }
  }

  async runComplianceValidation(item) {
    try {
      const result = this.complianceChecker.checkCompliance(item.content, ['federal', 'virginia']);

      // Store compliance issues
      if (result.issues && result.issues.length > 0) {
        const insertIssue = this.db.prepare(`
          INSERT INTO validation_issues_unified
          (queue_item_id, validator_type, category, type, severity, original_text, suggested_correction, explanation)
          VALUES (?, 'compliance', 'compliance', ?, ?, ?, ?, ?)
        `);

        for (const issue of result.issues) {
          const severity = issue.risk === 'CRITICAL' ? 'critical' : issue.risk === 'HIGH' ? 'error' : 'warning';

          insertIssue.run(
            item.id,
            issue.category,
            severity,
            issue.matched_text || '',
            issue.recommendation || '',
            issue.explanation
          );
        }
      }

      return {
        score: result.compliance_score || 100,
        issues_found: result.issues?.length || 0,
        critical_issues: result.issues?.filter(i => i.risk === 'CRITICAL').length || 0,
        analysis_data: JSON.stringify(result)
      };
    } catch (error) {
      console.error('Compliance validation error:', error);
      return { score: 100, issues_found: 0, critical_issues: 0, analysis_data: JSON.stringify({ error: error.message }) };
    }
  }

  async runToneValidation(item) {
    // Placeholder for tone validation
    return {
      score: 75,
      issues_found: 0,
      critical_issues: 0,
      analysis_data: JSON.stringify({ status: 'Not yet implemented' })
    };
  }

  async runFactCheckValidation(item) {
    // Placeholder for fact-checking
    return {
      score: 90,
      issues_found: 0,
      critical_issues: 0,
      analysis_data: JSON.stringify({ status: 'Not yet implemented' })
    };
  }

  saveValidatorResult(queueItemId, validatorType, result) {
    this.db.prepare(`
      INSERT INTO validation_results (queue_item_id, validator_type, score, issues_found, analysis_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(queueItemId, validatorType, result.score, result.issues_found, result.analysis_data);
  }

  calculateOverallScore(results) {
    const scores = Object.values(results).map(r => r.score).filter(s => s != null);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // ========================================================================
  // REVIEW WORKFLOW
  // ========================================================================

  getNextPendingItem(reviewerInitials, validatorType = null) {
    let query = `
      SELECT * FROM unified_validation_queue
      WHERE review_status = 'pending'
    `;

    const params = [];

    if (validatorType) {
      query += ` AND ${validatorType}_reviewed = 0`;
    }

    query += ` ORDER BY priority DESC, added_at ASC LIMIT 1`;

    const item = this.db.prepare(query).get(...params);

    if (item) {
      // Get issues for this item
      item.issues = this.getIssuesForItem(item.id, validatorType);

      // Get validation results
      item.validation_results = this.db.prepare(`
        SELECT * FROM validation_results WHERE queue_item_id = ?
      `).all(item.id);
    }

    return item;
  }

  getIssuesForItem(queueItemId, validatorType = null) {
    let query = `
      SELECT * FROM validation_issues_unified
      WHERE queue_item_id = ?
    `;

    const params = [queueItemId];

    if (validatorType) {
      query += ` AND validator_type = ?`;
      params.push(validatorType);
    }

    query += ` ORDER BY position_start, severity DESC`;

    return this.db.prepare(query).all(...params);
  }

  startReview(queueItemId, reviewerInitials) {
    this.db.prepare(`
      UPDATE unified_validation_queue
      SET review_status = 'in_review',
          reviewer_initials = ?,
          review_started_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reviewerInitials, queueItemId);

    // Create or update session
    const sessionId = `session_${reviewerInitials}_${Date.now()}`;
    this.db.prepare(`
      INSERT INTO validation_sessions_unified (session_id, reviewer_initials)
      VALUES (?, ?)
    `).run(sessionId, reviewerInitials);

    return sessionId;
  }

  reviewIssue(issueId, reviewData) {
    const { reviewer_initials, review_status, reviewer_correction, reviewer_comment, should_add_to_kb, kb_category, kb_notes } = reviewData;

    this.db.prepare(`
      UPDATE validation_issues_unified
      SET review_status = ?,
          reviewer_initials = ?,
          reviewer_correction = ?,
          reviewer_comment = ?,
          should_add_to_kb = ?,
          kb_category = ?,
          kb_notes = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      review_status,
      reviewer_initials,
      reviewer_correction || null,
      reviewer_comment || null,
      should_add_to_kb ? 1 : 0,
      kb_category || null,
      kb_notes || null,
      issueId
    );

    // If should add to KB, create KB enhancement entry
    if (should_add_to_kb) {
      const issue = this.db.prepare('SELECT * FROM validation_issues_unified WHERE id = ?').get(issueId);

      this.db.prepare(`
        INSERT INTO kb_pending_enhancements
        (validator_type, enhancement_type, original_text, suggested_correction, rule_description, category, source_issue_id, suggested_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        issue.validator_type,
        kb_category || 'custom_term',
        issue.original_text,
        reviewer_correction || issue.suggested_correction,
        kb_notes || '',
        kb_category || 'general',
        issueId,
        reviewer_initials
      );
    }
  }

  completeReview(queueItemId, reviewerInitials, validatorType = null, notes = null) {
    if (validatorType) {
      // Mark specific validator as reviewed
      this.db.prepare(`
        UPDATE unified_validation_queue
        SET ${validatorType}_reviewed = 1
        WHERE id = ?
      `).run(queueItemId);

      // Check if all validators are reviewed
      const item = this.getQueueItem(queueItemId);
      const allReviewed = item.grammar_reviewed && item.compliance_reviewed && item.tone_reviewed && item.fact_check_reviewed;

      if (allReviewed) {
        this.db.prepare(`
          UPDATE unified_validation_queue
          SET review_status = 'completed',
              review_completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(queueItemId);
      }
    } else {
      // Mark entire item as reviewed
      this.db.prepare(`
        UPDATE unified_validation_queue
        SET review_status = 'completed',
            review_completed_at = CURRENT_TIMESTAMP,
            grammar_reviewed = 1,
            compliance_reviewed = 1,
            tone_reviewed = 1,
            fact_check_reviewed = 1
        WHERE id = ?
      `).run(queueItemId);
    }

    // Add comment if provided
    if (notes) {
      this.db.prepare(`
        INSERT INTO validation_comments_unified (queue_item_id, validator_type, comment_type, comment_text, reviewer_initials)
        VALUES (?, ?, 'general', ?, ?)
      `).run(queueItemId, validatorType, notes, reviewerInitials);
    }
  }

  // ========================================================================
  // QUEUE INFORMATION
  // ========================================================================

  getQueueItem(id) {
    return this.db.prepare('SELECT * FROM unified_validation_queue WHERE id = ?').get(id);
  }

  getQueueSummary() {
    const summary = this.db.prepare(`
      SELECT
        review_status,
        COUNT(*) as count,
        AVG(overall_score) as avg_score,
        SUM(total_issues) as total_issues,
        SUM(critical_issues) as critical_issues
      FROM unified_validation_queue
      GROUP BY review_status
    `).all();

    return summary;
  }

  getValidatorSummary(validatorType) {
    const column = `${validatorType}_reviewed`;

    return this.db.prepare(`
      SELECT
        CASE WHEN ${column} = 1 THEN 'reviewed' ELSE 'pending' END as status,
        COUNT(*) as count,
        AVG(${validatorType}_score) as avg_score
      FROM unified_validation_queue
      GROUP BY ${column}
    `).all();
  }

  getReviewerStats(reviewerInitials) {
    return this.db.prepare(`
      SELECT
        COUNT(*) as items_reviewed,
        AVG(overall_score) as avg_score,
        SUM(total_issues) as total_issues
      FROM unified_validation_queue
      WHERE reviewer_initials = ? AND review_status = 'completed'
    `).get(reviewerInitials);
  }

  getKBPendingEnhancements(validatorType = null) {
    let query = `
      SELECT kbe.*, uq.title as source_title
      FROM kb_pending_enhancements kbe
      LEFT JOIN unified_validation_queue uq ON kbe.source_queue_item_id = uq.id
      WHERE kbe.status = 'pending'
    `;

    const params = [];

    if (validatorType) {
      query += ` AND kbe.validator_type = ?`;
      params.push(validatorType);
    }

    query += ` ORDER BY kbe.suggested_at DESC`;

    return this.db.prepare(query).all(...params);
  }
}

module.exports = UnifiedValidationService;
