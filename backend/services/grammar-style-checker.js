/**
 * Grammar and Style Checker Service
 *
 * Combines:
 * - LanguageTool for grammar/spelling
 * - write-good for clarity
 * - AP Style rules
 * - Campaign-specific messaging guidelines
 */

const fetch = require('node-fetch');
const writeGood = require('write-good');
const apStyleRules = require('../config/ap-style-rules');
const CapitalizationChecker = require('./capitalization-checker');
const RuleEnhancementEngine = require('./rule-enhancement-engine');

class GrammarStyleChecker {
  constructor() {
    this.apRules = apStyleRules;
    this.capitalizationChecker = new CapitalizationChecker();
    this.enhancementEngine = new RuleEnhancementEngine();
    // Use public LanguageTool API (free tier)
    this.languageToolURL = 'https://api.languagetool.org/v2/check';

    // Initialize enhancement engine
    this.enhancementEngine.initialize().catch(console.error);
  }

  /**
   * Main checking function
   */
  async checkContent(text, options = {}) {
    const {
      checkGrammar = true,
      checkAPStyle = true,
      checkCampaignStyle = true,
      checkClarity = true
    } = options;

    const results = {
      overallScore: 100,
      issueCount: 0,
      issues: [],
      categories: {
        grammar: { score: 100, issues: [] },
        apStyle: { score: 100, issues: [] },
        campaignStyle: { score: 100, issues: [] },
        clarity: { score: 100, issues: [] }
      },
      summary: {},
      checkedAt: new Date().toISOString()
    };

    // 1. Grammar and spelling check (LanguageTool)
    if (checkGrammar) {
      const grammarIssues = await this.checkGrammar(text);
      results.categories.grammar.issues = grammarIssues;
      results.issues.push(...grammarIssues);
    }

    // 2. AP Style check
    if (checkAPStyle) {
      const apStyleIssues = this.checkAPStyle(text);
      results.categories.apStyle.issues = apStyleIssues;
      results.issues.push(...apStyleIssues);
    }

    // 2.5 Capitalization check (political terms & proper nouns)
    const capitalizationIssues = this.capitalizationChecker.checkCapitalization(text);
    results.categories.apStyle.issues.push(...capitalizationIssues);
    results.issues.push(...capitalizationIssues);

    // 3. Campaign messaging style
    if (checkCampaignStyle) {
      const campaignStyleIssues = this.checkCampaignStyle(text);
      results.categories.campaignStyle.issues = campaignStyleIssues;
      results.issues.push(...campaignStyleIssues);
    }

    // 4. Clarity and readability
    if (checkClarity) {
      const clarityIssues = this.checkClarity(text);
      results.categories.clarity.issues = clarityIssues;
      results.issues.push(...clarityIssues);
    }

    // 5. Apply learned rules
    const learnedRuleIssues = await this.enhancementEngine.applyLearnedRules(text);
    results.issues.push(...learnedRuleIssues);

    // 6. Check custom terminology
    const customTermIssues = await this.enhancementEngine.checkCustomTerminology(text);
    results.categories.apStyle.issues.push(...customTermIssues);
    results.issues.push(...customTermIssues);

    // Calculate scores
    this.calculateScores(results);

    // Generate summary
    results.summary = this.generateSummary(results);

    return results;
  }

  /**
   * Check grammar and spelling via LanguageTool
   */
  async checkGrammar(text) {
    const issues = [];

    try {
      const response = await fetch(this.languageToolURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text,
          language: 'en-US',
          enabledOnly: 'false'
        })
      });

      const data = await response.json();

      data.matches.forEach(match => {
        issues.push({
          category: 'grammar',
          type: match.rule.issueType || 'grammar',
          message: match.message,
          context: match.context.text,
          offset: match.offset,
          length: match.length,
          replacements: match.replacements.slice(0, 3).map(r => r.value),
          severity: this.mapSeverity(match.rule.category.id),
          ruleId: match.rule.id
        });
      });
    } catch (error) {
      console.error('LanguageTool API error:', error.message);
      // Fail gracefully
    }

    return issues;
  }

  /**
   * Check AP Style compliance
   */
  checkAPStyle(text) {
    const issues = [];

    // 1. Check prohibited patterns
    this.apRules.prohibitedPatterns.forEach(rule => {
      const matches = text.matchAll(rule.pattern);
      for (const match of matches) {
        issues.push({
          category: 'ap_style',
          type: 'prohibited_pattern',
          message: rule.error,
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: rule.correction,
          severity: rule.severity || 'error',
          ruleId: 'ap_prohibited'
        });
      }
    });

    // 2. Check for "over" + number (should be "more than")
    const overPattern = /\bover\s+\d+/gi;
    let match;
    while ((match = overPattern.exec(text)) !== null) {
      issues.push({
        category: 'ap_style',
        type: 'number_usage',
        message: 'Use "more than" with numbers, not "over"',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace(/over/i, 'more than'),
        severity: 'warning',
        ruleId: 'ap_more_than'
      });
    }

    // 3. Check for % symbol (should be "percent")
    const percentPattern = /\d+%/g;
    while ((match = percentPattern.exec(text)) !== null) {
      issues.push({
        category: 'ap_style',
        type: 'abbreviation',
        message: 'Use "percent" not "%" in AP Style',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace('%', ' percent'),
        severity: 'error',
        ruleId: 'ap_percent'
      });
    }

    // 4. Check for "ex-" prefix (should be "former")
    const exPattern = /\bex-(?:Rep|Sen|Gov|President)/gi;
    while ((match = exPattern.exec(text)) !== null) {
      issues.push({
        category: 'ap_style',
        type: 'title_usage',
        message: 'Use "former" not "ex-" for past officeholders',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace(/ex-/i, 'former '),
        severity: 'error',
        ruleId: 'ap_former'
      });
    }

    // 5. Check sentence length
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    sentences.forEach((sentence, index) => {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 40) {
        const sentenceIndex = text.indexOf(sentence);
        issues.push({
          category: 'ap_style',
          type: 'sentence_length',
          message: `Sentence is ${wordCount} words (over 40 words is too long)`,
          context: sentence.substring(0, 100) + '...',
          offset: sentenceIndex,
          length: sentence.length,
          correction: 'Split into multiple sentences',
          severity: 'error',
          ruleId: 'ap_sentence_length'
        });
      } else if (wordCount > 30) {
        const sentenceIndex = text.indexOf(sentence);
        issues.push({
          category: 'ap_style',
          type: 'sentence_length',
          message: `Sentence is ${wordCount} words (consider splitting)`,
          context: sentence.substring(0, 100) + '...',
          offset: sentenceIndex,
          length: sentence.length,
          correction: 'Consider splitting into multiple sentences',
          severity: 'warning',
          ruleId: 'ap_sentence_length'
        });
      }
    });

    return issues;
  }

  /**
   * Check campaign messaging style
   */
  checkCampaignStyle(text) {
    const issues = [];

    // Check for avoided terms
    const avoidedTerms = {
      'illegal immigrant': 'Use "undocumented immigrant"',
      'illegal alien': 'Use "undocumented immigrant"',
      'Obamacare': 'Use "Affordable Care Act" or "ACA"',
      'entitlements': 'Use "earned benefits"',
      'welfare': 'Use "public assistance"',
      'tax relief': 'Republican framing; use "tax cuts for [beneficiary]"'
    };

    Object.entries(avoidedTerms).forEach(([term, correction]) => {
      const pattern = new RegExp(`\\b${term}\\b`, 'gi');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          category: 'campaign_style',
          type: 'messaging',
          message: `Avoid "${term}" - ${correction}`,
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction,
          severity: 'warning',
          ruleId: 'campaign_avoid_term'
        });
      }
    });

    // Check for preferred terms
    const preferredTerms = {
      'health care': { preferred: 'healthcare', message: 'Use "healthcare" (one word)' },
      'gun control': { preferred: 'gun safety', message: 'Use "gun safety" instead of "gun control"' },
      'climate change': { preferred: 'climate crisis', message: 'Consider "climate crisis" for stronger messaging' }
    };

    Object.entries(preferredTerms).forEach(([term, { preferred, message }]) => {
      const pattern = new RegExp(`\\b${term}\\b`, 'gi');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          category: 'campaign_style',
          type: 'terminology',
          message,
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: preferred,
          severity: 'suggestion',
          ruleId: 'campaign_preferred_term'
        });
      }
    });

    return issues;
  }

  /**
   * Check clarity and readability
   */
  checkClarity(text) {
    const issues = [];

    try {
      const suggestions = writeGood(text);

      suggestions.forEach(suggestion => {
        issues.push({
          category: 'clarity',
          type: 'readability',
          message: suggestion.reason,
          context: this.getContext(text, suggestion.index, suggestion.offset),
          offset: suggestion.index,
          length: suggestion.offset,
          severity: 'suggestion',
          ruleId: 'clarity_write_good'
        });
      });
    } catch (error) {
      console.error('write-good error:', error.message);
    }

    // Check for passive voice
    const passivePattern = /\b(?:was|were|is|are|been|being)\s+\w+ed\b/gi;
    let match;
    while ((match = passivePattern.exec(text)) !== null) {
      // Only flag if it looks like passive voice (not all "was [word]ed" is passive)
      issues.push({
        category: 'clarity',
        type: 'passive_voice',
        message: 'Consider using active voice for stronger messaging',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        severity: 'suggestion',
        ruleId: 'clarity_passive'
      });
    }

    return issues;
  }

  /**
   * Calculate scores for each category
   */
  calculateScores(results) {
    const categoryWeights = {
      grammar: 40,
      apStyle: 30,
      campaignStyle: 20,
      clarity: 10
    };

    let totalDeductions = 0;

    Object.entries(results.categories).forEach(([category, data]) => {
      let deduction = 0;

      data.issues.forEach(issue => {
        if (issue.severity === 'error') deduction += 10;
        else if (issue.severity === 'warning') deduction += 5;
        else if (issue.severity === 'suggestion') deduction += 2;
      });

      data.score = Math.max(0, 100 - deduction);
      totalDeductions += (deduction * categoryWeights[category]) / 100;
    });

    results.overallScore = Math.max(0, Math.round(100 - totalDeductions));
    results.issueCount = results.issues.length;
  }

  /**
   * Generate summary
   */
  generateSummary(results) {
    const summary = {
      overallGrade: this.getGrade(results.overallScore),
      totalIssues: results.issueCount,
      bySeverity: {
        error: results.issues.filter(i => i.severity === 'error').length,
        warning: results.issues.filter(i => i.severity === 'warning').length,
        suggestion: results.issues.filter(i => i.severity === 'suggestion').length
      },
      byCategory: {
        grammar: results.categories.grammar.issues.length,
        apStyle: results.categories.apStyle.issues.length,
        campaignStyle: results.categories.campaignStyle.issues.length,
        clarity: results.categories.clarity.issues.length
      },
      topIssues: this.getTopIssues(results.issues)
    };

    return summary;
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D';
    return 'F';
  }

  /**
   * Get top 5 most important issues
   */
  getTopIssues(issues) {
    return issues
      .filter(i => i.severity === 'error' || i.severity === 'warning')
      .slice(0, 5)
      .map(i => ({
        type: i.type,
        message: i.message,
        severity: i.severity
      }));
  }

  /**
   * Get context around an issue
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
   * Map LanguageTool severity to our system
   */
  mapSeverity(categoryId) {
    const severityMap = {
      'TYPOS': 'error',
      'GRAMMAR': 'error',
      'PUNCTUATION': 'warning',
      'STYLE': 'suggestion',
      'MISC': 'suggestion'
    };

    return severityMap[categoryId] || 'suggestion';
  }

  /**
   * Record user feedback on a suggestion
   */
  async recordFeedback(issue, userAction, userCorrection = null, userComment = null, contentId = null, userId = null) {
    return await this.enhancementEngine.recordFeedback(
      issue,
      userAction,
      userCorrection,
      userComment,
      contentId,
      userId
    );
  }

  /**
   * Get learning insights
   */
  async getLearningInsights() {
    return await this.enhancementEngine.getLearningInsights();
  }
}

module.exports = GrammarStyleChecker;
