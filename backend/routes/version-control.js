/**
 * Version Control API Routes
 * Handles document versioning, comparisons, and restoration
 */

const express = require('express');
const router = express.Router();
const VersionControlService = require('../services/version-control-service');

const versionControlService = new VersionControlService();

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

// Create new version
router.post('/versions', (req, res) => {
  try {
    const { created_by = 1 } = req.body; // TODO: Get from session
    const version = versionControlService.createVersion(req.body, created_by);
    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific version
router.get('/versions/:contentType/:contentId/:versionNumber', (req, res) => {
  try {
    const version = versionControlService.getVersion(
      parseInt(req.params.contentId),
      req.params.contentType,
      parseInt(req.params.versionNumber)
    );

    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest version
router.get('/versions/:contentType/:contentId/latest', (req, res) => {
  try {
    const version = versionControlService.getLatestVersion(
      parseInt(req.params.contentId),
      req.params.contentType
    );

    if (!version) {
      return res.status(404).json({ success: false, error: 'No versions found' });
    }

    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get version history
router.get('/versions/:contentType/:contentId/history', (req, res) => {
  try {
    const { major_only, limit } = req.query;

    const options = {
      major_only: major_only === 'true',
      limit: limit ? parseInt(limit) : null
    };

    const history = versionControlService.getVersionHistory(
      parseInt(req.params.contentId),
      req.params.contentType,
      options
    );

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VERSION COMPARISON
// ============================================================================

// Compare two versions
router.get('/versions/:contentType/:contentId/compare/:fromVersion/:toVersion', (req, res) => {
  try {
    const { comparison_type = 'full' } = req.query;

    const comparison = versionControlService.compareVersions(
      parseInt(req.params.contentId),
      req.params.contentType,
      parseInt(req.params.fromVersion),
      parseInt(req.params.toVersion),
      comparison_type
    );

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VERSION RESTORATION
// ============================================================================

// Restore a version
router.post('/versions/:contentType/:contentId/:versionNumber/restore', (req, res) => {
  try {
    const { restored_by = 1 } = req.body; // TODO: Get from session

    const newVersion = versionControlService.restoreVersion(
      parseInt(req.params.contentId),
      req.params.contentType,
      parseInt(req.params.versionNumber),
      restored_by
    );

    res.json({ success: true, version: newVersion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VERSION TAGGING
// ============================================================================

// Add tags to version
router.post('/versions/:contentType/:contentId/:versionNumber/tags', (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ success: false, error: 'Tags array required' });
    }

    const version = versionControlService.tagVersion(
      parseInt(req.params.contentId),
      req.params.contentType,
      parseInt(req.params.versionNumber),
      tags
    );

    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove tag from version
router.delete('/versions/:contentType/:contentId/:versionNumber/tags/:tag', (req, res) => {
  try {
    const version = versionControlService.removeTag(
      parseInt(req.params.contentId),
      req.params.contentType,
      parseInt(req.params.versionNumber),
      req.params.tag
    );

    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATISTICS
// ============================================================================

// Get version statistics for content
router.get('/versions/:contentType/:contentId/stats', (req, res) => {
  try {
    const stats = versionControlService.getVersionStats(
      parseInt(req.params.contentId),
      req.params.contentType
    );

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all versioned content
router.get('/versioned-content', (req, res) => {
  try {
    const { content_type } = req.query;
    const content = versionControlService.getAllVersionedContent(content_type);

    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
