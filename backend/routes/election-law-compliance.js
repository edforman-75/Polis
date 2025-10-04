/**
 * Election Law Compliance API Routes
 *
 * Provides endpoints for checking campaign communications against:
 * - Federal election law (FEC)
 * - Virginia state election law
 */

const express = require('express');
const router = express.Router();
const ElectionLawComplianceChecker = require('../services/election-law-compliance-checker');

const complianceChecker = new ElectionLawComplianceChecker();

/**
 * POST /api/election-law-compliance/check
 *
 * Check content for election law compliance
 *
 * Request body:
 * {
 *   "text": "Content to check",
 *   "jurisdiction": "federal" | "virginia",
 *   "communicationType": "press_release" | "social_media" | "ad" | etc.,
 *   "candidate": "Candidate name",
 *   "office": "Office sought",
 *   "isFederalRace": true/false,
 *   "medium": "print" | "television" | "radio" | "online",
 *   "mediumDetails": {
 *     "disclaimerDuration": 4.5,
 *     "disclaimerScreenHeight": 0.05,
 *     "candidateAppears": true
 *   }
 * }
 */
router.post('/check', async (req, res) => {
  try {
    const {
      text,
      jurisdiction = 'federal',
      communicationType = 'press_release',
      candidate = '',
      office = '',
      isFederalRace = false,
      medium = 'print',
      mediumDetails = {}
    } = req.body;

    // Validate required fields
    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    // Validate jurisdiction
    if (!['federal', 'virginia'].includes(jurisdiction)) {
      return res.status(400).json({
        error: 'Invalid jurisdiction. Must be "federal" or "virginia"'
      });
    }

    // Prepare metadata
    const metadata = {
      jurisdiction,
      communicationType,
      candidate,
      office,
      isFederalRace,
      medium,
      ...mediumDetails
    };

    // Run compliance check
    const result = await complianceChecker.checkCompliance(text, metadata);

    res.json(result);
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({
      error: 'Internal server error during compliance check',
      message: error.message
    });
  }
});

/**
 * GET /api/election-law-compliance/jurisdictions
 *
 * Get available jurisdictions and their details
 */
router.get('/jurisdictions', (req, res) => {
  try {
    const jurisdictions = complianceChecker.getJurisdictions();
    res.json(jurisdictions);
  } catch (error) {
    console.error('Error getting jurisdictions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/election-law-compliance/federal/contribution-limits
 *
 * Get current federal contribution limits
 */
router.get('/federal/contribution-limits', (req, res) => {
  try {
    const limits = complianceChecker.federalKB.contributionLimitsTable;
    res.json(limits);
  } catch (error) {
    console.error('Error getting contribution limits:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/election-law-compliance/virginia/info
 *
 * Get Virginia-specific election law information
 */
router.get('/virginia/info', (req, res) => {
  try {
    const info = {
      contributionLimits: complianceChecker.virginiaKB.virginiaContributionRules,
      disclaimerRequirements: {
        print: complianceChecker.virginiaKB.advertisementDisclosure.printMediaRequirements.requirements,
        television: complianceChecker.virginiaKB.advertisementDisclosure.televisionRequirements.requirements,
        radio: complianceChecker.virginiaKB.advertisementDisclosure.radioRequirements.requirements,
        online: complianceChecker.virginiaKB.advertisementDisclosure.onlinePlatformRequirements.requirements
      },
      resources: complianceChecker.virginiaKB.resources,
      spanbergerCampaign: complianceChecker.virginiaKB.spanbergerCampaignNotes
    };
    res.json(info);
  } catch (error) {
    console.error('Error getting Virginia info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/election-law-compliance/categories
 *
 * Get compliance categories for a jurisdiction
 */
router.get('/categories', (req, res) => {
  try {
    const { jurisdiction = 'federal' } = req.query;

    const kb = jurisdiction === 'virginia'
      ? complianceChecker.virginiaKB
      : complianceChecker.federalKB;

    res.json(kb.complianceCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/election-law-compliance/risk-levels
 *
 * Get risk level definitions
 */
router.get('/risk-levels', (req, res) => {
  try {
    const { jurisdiction = 'federal' } = req.query;

    const kb = jurisdiction === 'virginia'
      ? complianceChecker.virginiaKB
      : complianceChecker.federalKB;

    res.json(kb.riskScoring.levels);
  } catch (error) {
    console.error('Error getting risk levels:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/election-law-compliance/batch-check
 *
 * Check multiple pieces of content at once
 *
 * Request body:
 * {
 *   "items": [
 *     { "text": "...", "metadata": {...} },
 *     { "text": "...", "metadata": {...} }
 *   ]
 * }
 */
router.post('/batch-check', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Missing or invalid items array'
      });
    }

    const results = [];

    for (const item of items) {
      const { text, metadata = {} } = item;

      if (!text) {
        results.push({
          error: 'Missing text',
          item
        });
        continue;
      }

      try {
        const result = await complianceChecker.checkCompliance(text, metadata);
        results.push({
          success: true,
          result,
          metadata
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          metadata
        });
      }
    }

    res.json({
      totalChecked: items.length,
      results
    });
  } catch (error) {
    console.error('Batch check error:', error);
    res.status(500).json({
      error: 'Internal server error during batch check',
      message: error.message
    });
  }
});

/**
 * GET /api/election-law-compliance/test-cases
 *
 * Get example test cases for demonstration
 */
router.get('/test-cases', (req, res) => {
  try {
    const { jurisdiction = 'federal' } = req.query;

    const testCases = jurisdiction === 'virginia' ? [
      {
        name: 'Missing Virginia Disclaimer',
        text: 'Vote for Sarah Johnson for House of Delegates! District 42 needs real leadership. Donate at www.sarahjohnson.com',
        metadata: {
          jurisdiction: 'virginia',
          communicationType: 'social_media',
          candidate: 'Sarah Johnson',
          office: 'House of Delegates, District 42',
          isFederalRace: false,
          medium: 'online'
        }
      },
      {
        name: 'Compliant Virginia Press Release',
        text: 'FOR IMMEDIATE RELEASE\n\nMartinez Announces Healthcare Plan\n\nRICHMOND - Delegate Maria Martinez today announced her plan to expand healthcare access for Virginia families.\n\n###\n\nPaid for by Martinez for Delegate\nAuthorized by Maria Martinez, candidate for House of Delegates, District 88',
        metadata: {
          jurisdiction: 'virginia',
          communicationType: 'press_release',
          candidate: 'Maria Martinez',
          office: 'House of Delegates, District 88',
          isFederalRace: false,
          medium: 'print'
        }
      },
      {
        name: 'Large Contribution (Virginia)',
        text: 'We just received a $50,000 contribution from a major supporter! This will help us reach voters across the Commonwealth. Donate at www.smithforgovernor.com\n\nPaid for by Smith for Governor\nAuthorized by John Smith, candidate for Governor',
        metadata: {
          jurisdiction: 'virginia',
          communicationType: 'social_media',
          candidate: 'John Smith',
          office: 'Governor',
          isFederalRace: false,
          medium: 'online'
        }
      }
    ] : [
      {
        name: 'Missing FEC Disclaimer',
        text: 'Join us for a rally this Saturday! Donate now at www.electjohnson.com #Johnson2024',
        metadata: {
          jurisdiction: 'federal',
          communicationType: 'social_media',
          candidate: 'Johnson',
          office: 'U.S. House',
          isFederalRace: true,
          medium: 'online'
        }
      },
      {
        name: 'Excessive Contribution Solicitation',
        text: 'We need your help! Donate $5,000 today to help us win this critical race. Every dollar counts. Contribute now at www.electsmith.com/donate',
        metadata: {
          jurisdiction: 'federal',
          communicationType: 'fundraising_email',
          candidate: 'Smith',
          office: 'U.S. Senate',
          isFederalRace: true,
          medium: 'online'
        }
      },
      {
        name: 'Compliant Federal Press Release',
        text: 'FOR IMMEDIATE RELEASE\n\nJohnson Announces Healthcare Plan\n\nWASHINGTON - Candidate Sarah Johnson today announced her comprehensive healthcare plan.\n\n###\n\nPaid for by Johnson for Congress',
        metadata: {
          jurisdiction: 'federal',
          communicationType: 'press_release',
          candidate: 'Sarah Johnson',
          office: 'U.S. House',
          isFederalRace: true,
          medium: 'print'
        }
      }
    ];

    res.json(testCases);
  } catch (error) {
    console.error('Error getting test cases:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
