/**
 * Rule Enhancement Engine
 *
 * Applies learned rules and custom terminology to enhance grammar checking
 */

const GrammarLearningService = require('./grammar-learning-service');

class RuleEnhancementEngine {
  constructor() {
    this.learningService = new GrammarLearningService();
    this.learnedRules = [];
    this.customTerms = [];
    this.lastRefresh = null;
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize and load learned rules
   */
  async initialize() {
    await this.refreshRules();
  }

  /**
   * Refresh learned rules and custom terminology from database
   */
  async refreshRules() {
    try {
      // Load active learned rules
      this.learnedRules = await this.learningService.getActiveLearnedRules();

      // Load custom terminology
      this.customTerms = await this.learningService.getCustomTerminology();

      this.lastRefresh = Date.now();

      console.log(`Loaded ${this.learnedRules.length} learned rules and ${this.customTerms.length} custom terms`);
    } catch (error) {
      console.error('Error refreshing rules:', error);
    }
  }

  /**
   * Check if rules need refresh
   */
  async checkRefresh() {
    if (!this.lastRefresh || Date.now() - this.lastRefresh > this.refreshInterval) {
      await this.refreshRules();
    }
  }

  /**
   * Apply learned rules to text
   */
  async applyLearnedRules(text) {
    await this.checkRefresh();

    const issues = [];

    // Apply each learned rule
    for (const rule of this.learnedRules) {
      try {
        const ruleIssues = this.applyRule(text, rule);
        issues.push(...ruleIssues);
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }

    return issues;
  }

  /**
   * Apply a single learned rule
   */
  applyRule(text, rule) {
    const issues = [];

    // Different rule types
    switch (rule.rule_type) {
      case 'pattern':
        return this.applyPatternRule(text, rule);

      case 'exception':
        // Exception rules modify other rules, handled elsewhere
        return [];

      case 'correction':
        return this.applyCorrectionRule(text, rule);

      case 'terminology':
        return this.applyTerminologyRule(text, rule);

      default:
        return [];
    }
  }

  /**
   * Apply pattern-based rule
   */
  applyPatternRule(text, rule) {
    const issues = [];

    try {
      const pattern = new RegExp(rule.pattern, 'gi');
      const matches = [...text.matchAll(pattern)];

      for (const match of matches) {
        // Only suggest if action is flag or suggest
        if (rule.action === 'flag' || rule.action === 'suggest') {
          issues.push({
            category: 'learned_rule',
            type: rule.category,
            message: rule.message,
            context: this.getContext(text, match.index, match[0].length),
            offset: match.index,
            length: match[0].length,
            correction: rule.correction,
            severity: rule.severity || 'suggestion',
            ruleId: `learned_${rule.id}`,
            confidence: rule.confidence,
            isLearnedRule: true
          });
        }
      }
    } catch (error) {
      console.error(`Invalid pattern in rule ${rule.id}:`, error);
    }

    return issues;
  }

  /**
   * Apply correction rule
   */
  applyCorrectionRule(text, rule) {
    const issues = [];

    try {
      const pattern = new RegExp(rule.pattern, 'gi');
      const matches = [...text.matchAll(pattern)];

      for (const match of matches) {
        issues.push({
          category: 'learned_rule',
          type: 'auto_correction',
          message: rule.message || 'Learned correction',
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: rule.correction,
          severity: 'suggestion',
          ruleId: `learned_${rule.id}`,
          autoFix: rule.action === 'auto_correct',
          isLearnedRule: true
        });
      }
    } catch (error) {
      console.error(`Error in correction rule ${rule.id}:`, error);
    }

    return issues;
  }

  /**
   * Apply terminology rule
   */
  applyTerminologyRule(text, rule) {
    // Terminology rules are applied through checkCustomTerminology
    return [];
  }

  /**
   * Check custom terminology
   */
  async checkCustomTerminology(text) {
    await this.checkRefresh();

    const issues = [];

    for (const term of this.customTerms) {
      // Check for misspellings
      const misspellings = term.commonMisspellings || [];

      for (const misspelling of misspellings) {
        const pattern = new RegExp(`\\b${this.escapeRegex(misspelling)}\\b`, 'gi');
        const matches = [...text.matchAll(pattern)];

        for (const match of matches) {
          issues.push({
            category: 'custom_terminology',
            type: 'name_spelling',
            message: `Incorrect spelling - should be "${term.correct_form}"`,
            context: this.getContext(text, match.index, match[0].length),
            offset: match.index,
            length: match[0].length,
            correction: term.correct_form,
            severity: 'error',
            ruleId: `custom_term_${term.id}`,
            isCustomTerm: true
          });
        }
      }

      // Check capitalization rules
      if (term.capitalization_rule === 'always_capitalize') {
        const pattern = new RegExp(`\\b${this.escapeRegex(term.term)}\\b`, 'g');
        const matches = [...text.matchAll(pattern)];

        for (const match of matches) {
          // Check if it's not properly capitalized
          if (match[0] !== term.correct_form) {
            issues.push({
              category: 'custom_terminology',
              type: 'capitalization',
              message: `Should be "${term.correct_form}"`,
              context: this.getContext(text, match.index, match[0].length),
              offset: match.index,
              length: match[0].length,
              correction: term.correct_form,
              severity: 'error',
              ruleId: `custom_term_cap_${term.id}`,
              isCustomTerm: true
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Get context around issue
   */
  getContext(text, offset, length, contextLength = 60) {
    const start = Math.max(0, offset - contextLength);
    const end = Math.min(text.length, offset + length + contextLength);
    const context = text.substring(start, end);

    return {
      text: context,
      highlightStart: offset - start,
      highlightLength: length
    };
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Record feedback on a suggestion
   */
  async recordFeedback(issue, userAction, userCorrection = null, userComment = null, contentId = null, userId = null) {
    // Extract context
    const fullSentence = this.extractSentence(issue.context.text, issue.context.highlightStart);

    const feedbackData = {
      ruleId: issue.ruleId,
      category: issue.category,
      issueType: issue.type,
      originalText: issue.context.text.substring(
        issue.context.highlightStart,
        issue.context.highlightStart + issue.context.highlightLength
      ),
      suggestedCorrection: issue.correction,
      contextBefore: issue.context.text.substring(0, issue.context.highlightStart),
      contextAfter: issue.context.text.substring(issue.context.highlightStart + issue.context.highlightLength),
      fullSentence: fullSentence,
      userAction: userAction,
      userCorrection: userCorrection,
      userComment: userComment,
      contentId: contentId,
      userId: userId
    };

    return await this.learningService.recordFeedback(feedbackData);
  }

  /**
   * Extract full sentence from context
   */
  extractSentence(text, highlightStart) {
    // Find sentence boundaries
    const beforeText = text.substring(0, highlightStart);
    const afterText = text.substring(highlightStart);

    const sentenceStart = Math.max(
      beforeText.lastIndexOf('.'),
      beforeText.lastIndexOf('!'),
      beforeText.lastIndexOf('?')
    );

    const sentenceEnd = Math.min(
      afterText.indexOf('.') !== -1 ? afterText.indexOf('.') : Infinity,
      afterText.indexOf('!') !== -1 ? afterText.indexOf('!') : Infinity,
      afterText.indexOf('?') !== -1 ? afterText.indexOf('?') : Infinity
    );

    const start = sentenceStart === -1 ? 0 : sentenceStart + 1;
    const end = sentenceEnd === Infinity ? text.length : highlightStart + sentenceEnd + 1;

    return text.substring(start, end).trim();
  }

  /**
   * Get rule performance metrics
   */
  async getRulePerformance(ruleId) {
    return await this.learningService.getFeedbackStats({ ruleId });
  }

  /**
   * Get learning insights
   */
  async getLearningInsights() {
    const [stats, clusters, activeRules] = await Promise.all([
      this.learningService.getFeedbackStats(),
      this.learningService.getPendingClusters(),
      this.learningService.getActiveLearnedRules()
    ]);

    return {
      totalFeedback: stats.reduce((sum, s) => sum + s.count, 0),
      acceptanceRate: this.calculateOverallAcceptanceRate(stats),
      pendingClusters: clusters.length,
      activeRules: activeRules.length,
      topPerformingRules: this.getTopPerformingRules(stats),
      needsReview: clusters.filter(c => c.feedback_count >= 5)
    };
  }

  /**
   * Calculate overall acceptance rate
   */
  calculateOverallAcceptanceRate(stats) {
    const accepted = stats.filter(s => s.user_action === 'accepted').reduce((sum, s) => sum + s.count, 0);
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    return total > 0 ? (accepted / total) : 0;
  }

  /**
   * Get top performing rules
   */
  getTopPerformingRules(stats) {
    const ruleStats = {};

    stats.forEach(s => {
      if (!ruleStats[s.rule_id]) {
        ruleStats[s.rule_id] = { accepted: 0, rejected: 0, total: 0 };
      }
      ruleStats[s.rule_id].total += s.count;
      if (s.user_action === 'accepted') ruleStats[s.rule_id].accepted += s.count;
      if (s.user_action === 'rejected') ruleStats[s.rule_id].rejected += s.count;
    });

    return Object.entries(ruleStats)
      .map(([ruleId, data]) => ({
        ruleId,
        ...data,
        acceptanceRate: data.total > 0 ? data.accepted / data.total : 0
      }))
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
      .slice(0, 10);
  }
}

module.exports = RuleEnhancementEngine;
