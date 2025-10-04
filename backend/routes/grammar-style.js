/**
 * Grammar and Style Checker API Routes
 *
 * Provides endpoints for checking grammar, AP Style, and campaign messaging
 */

const express = require('express');
const router = express.Router();
const GrammarStyleChecker = require('../services/grammar-style-checker');

const checker = new GrammarStyleChecker();

/**
 * POST /api/grammar-style/check
 *
 * Check content for grammar, AP Style, and campaign messaging
 *
 * Request body:
 * {
 *   "text": "Content to check",
 *   "options": {
 *     "checkGrammar": true,
 *     "checkAPStyle": true,
 *     "checkCampaignStyle": true,
 *     "checkClarity": true
 *   }
 * }
 */
router.post('/check', async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    const result = await checker.checkContent(text, options);

    res.json(result);
  } catch (error) {
    console.error('Grammar/style check error:', error);
    res.status(500).json({
      error: 'Internal server error during grammar/style check',
      message: error.message
    });
  }
});

/**
 * GET /api/grammar-style/ap-rules
 *
 * Get AP Style rules reference
 */
router.get('/ap-rules', (req, res) => {
  try {
    res.json(checker.apRules);
  } catch (error) {
    console.error('Error getting AP rules:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/grammar-style/ap-rules/category/:category
 *
 * Get specific AP Style rule category
 */
router.get('/ap-rules/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const categoryData = checker.apRules[category];

    if (!categoryData) {
      return res.status(404).json({
        error: 'Category not found',
        availableCategories: Object.keys(checker.apRules)
      });
    }

    res.json(categoryData);
  } catch (error) {
    console.error('Error getting AP rule category:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/grammar-style/check-grammar
 *
 * Check grammar only (LanguageTool)
 */
router.post('/check-grammar', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    const issues = await checker.checkGrammar(text);

    res.json({
      issueCount: issues.length,
      issues
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    res.status(500).json({
      error: 'Internal server error during grammar check',
      message: error.message
    });
  }
});

/**
 * POST /api/grammar-style/check-ap-style
 *
 * Check AP Style only
 */
router.post('/check-ap-style', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    const issues = checker.checkAPStyle(text);

    res.json({
      issueCount: issues.length,
      issues
    });
  } catch (error) {
    console.error('AP Style check error:', error);
    res.status(500).json({
      error: 'Internal server error during AP Style check',
      message: error.message
    });
  }
});

/**
 * POST /api/grammar-style/check-campaign-style
 *
 * Check campaign messaging style only
 */
router.post('/check-campaign-style', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    const issues = checker.checkCampaignStyle(text);

    res.json({
      issueCount: issues.length,
      issues
    });
  } catch (error) {
    console.error('Campaign style check error:', error);
    res.status(500).json({
      error: 'Internal server error during campaign style check',
      message: error.message
    });
  }
});

/**
 * POST /api/grammar-style/check-clarity
 *
 * Check clarity and readability only
 */
router.post('/check-clarity', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    const issues = checker.checkClarity(text);

    res.json({
      issueCount: issues.length,
      issues
    });
  } catch (error) {
    console.error('Clarity check error:', error);
    res.status(500).json({
      error: 'Internal server error during clarity check',
      message: error.message
    });
  }
});

module.exports = router;
