/**
 * Version Control Service
 * Manages document versioning, diffs, and change tracking
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const { diffChars, diffWords, diffLines } = require('diff');

class VersionControlService {
  constructor() {
    const dbPath = path.join(__dirname, '../data/workflow.db');
    this.db = new Database(dbPath);
  }

  // ========================================================================
  // VERSION CREATION
  // ========================================================================

  createVersion(versionData, createdBy) {
    const { content_id, content_type, title, content, change_summary, is_major_version, tags } = versionData;

    // Get current version number
    const currentVersion = this.db.prepare(`
      SELECT MAX(version_number) as max_version
      FROM document_versions
      WHERE content_id = ? AND content_type = ?
    `).get(content_id, content_type);

    const newVersionNumber = (currentVersion?.max_version || 0) + 1;

    // Generate content hash
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // Check if content actually changed
    if (currentVersion && currentVersion.max_version > 0) {
      const lastVersion = this.db.prepare(`
        SELECT content_hash FROM document_versions
        WHERE content_id = ? AND content_type = ? AND version_number = ?
      `).get(content_id, content_type, currentVersion.max_version);

      if (lastVersion && lastVersion.content_hash === contentHash) {
        // No changes, return existing version
        return this.getVersion(content_id, content_type, currentVersion.max_version);
      }
    }

    const insert = this.db.prepare(`
      INSERT INTO document_versions
      (content_id, content_type, version_number, title, content, content_hash, created_by, change_summary, is_major_version, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      content_id,
      content_type,
      newVersionNumber,
      title || null,
      content,
      contentHash,
      createdBy,
      change_summary || null,
      is_major_version || 0,
      tags ? JSON.stringify(tags) : null
    );

    return this.getVersion(content_id, content_type, newVersionNumber);
  }

  getVersion(contentId, contentType, versionNumber) {
    const version = this.db.prepare(`
      SELECT dv.*, u.full_name as created_by_name
      FROM document_versions dv
      JOIN users u ON dv.created_by = u.id
      WHERE dv.content_id = ? AND dv.content_type = ? AND dv.version_number = ?
    `).get(contentId, contentType, versionNumber);

    if (!version) return null;

    // Parse tags
    if (version.tags) {
      try {
        version.tags = JSON.parse(version.tags);
      } catch (e) {
        version.tags = [];
      }
    }

    return version;
  }

  getLatestVersion(contentId, contentType) {
    const latest = this.db.prepare(`
      SELECT MAX(version_number) as max_version
      FROM document_versions
      WHERE content_id = ? AND content_type = ?
    `).get(contentId, contentType);

    if (!latest || !latest.max_version) return null;

    return this.getVersion(contentId, contentType, latest.max_version);
  }

  getVersionHistory(contentId, contentType, options = {}) {
    let query = `
      SELECT dv.id, dv.version_number, dv.title, dv.created_at, dv.change_summary,
             dv.is_major_version, dv.tags, u.full_name as created_by_name
      FROM document_versions dv
      JOIN users u ON dv.created_by = u.id
      WHERE dv.content_id = ? AND dv.content_type = ?
    `;

    const params = [contentId, contentType];

    if (options.major_only) {
      query += ' AND dv.is_major_version = 1';
    }

    query += ' ORDER BY dv.version_number DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const versions = this.db.prepare(query).all(...params);

    // Parse tags for each version
    versions.forEach(version => {
      if (version.tags) {
        try {
          version.tags = JSON.parse(version.tags);
        } catch (e) {
          version.tags = [];
        }
      }
    });

    return versions;
  }

  // ========================================================================
  // VERSION COMPARISON
  // ========================================================================

  compareVersions(contentId, contentType, fromVersion, toVersion, comparisonType = 'full') {
    const versionFrom = this.getVersion(contentId, contentType, fromVersion);
    const versionTo = this.getVersion(contentId, contentType, toVersion);

    if (!versionFrom || !versionTo) {
      throw new Error('One or both versions not found');
    }

    // Check if comparison already exists
    const existing = this.db.prepare(`
      SELECT * FROM version_comparisons
      WHERE version_from_id = ? AND version_to_id = ? AND comparison_type = ?
    `).get(versionFrom.id, versionTo.id, comparisonType);

    if (existing) {
      try {
        return {
          ...existing,
          diff_data: JSON.parse(existing.diff_data)
        };
      } catch (e) {
        // Fall through to regenerate
      }
    }

    // Generate diff
    const diffData = this.generateDiff(versionFrom.content, versionTo.content, comparisonType);

    // Store comparison
    const insert = this.db.prepare(`
      INSERT INTO version_comparisons (version_from_id, version_to_id, diff_data, comparison_type)
      VALUES (?, ?, ?, ?)
    `);

    insert.run(versionFrom.id, versionTo.id, JSON.stringify(diffData), comparisonType);

    return {
      version_from: fromVersion,
      version_to: toVersion,
      comparison_type: comparisonType,
      diff_data: diffData
    };
  }

  generateDiff(contentFrom, contentTo, comparisonType) {
    const diffData = {
      type: comparisonType,
      stats: {
        additions: 0,
        deletions: 0,
        changes: 0,
        unchanged: 0
      },
      changes: []
    };

    let diff;

    switch (comparisonType) {
      case 'text_only':
        diff = diffChars(contentFrom, contentTo);
        break;
      case 'structural':
        diff = diffWords(contentFrom, contentTo);
        break;
      default: // 'full'
        diff = diffLines(contentFrom, contentTo);
        break;
    }

    diff.forEach(part => {
      if (part.added) {
        diffData.stats.additions += part.count || 1;
        diffData.changes.push({
          type: 'addition',
          value: part.value,
          count: part.count
        });
      } else if (part.removed) {
        diffData.stats.deletions += part.count || 1;
        diffData.changes.push({
          type: 'deletion',
          value: part.value,
          count: part.count
        });
      } else {
        diffData.stats.unchanged += part.count || 1;
      }
    });

    diffData.stats.changes = diffData.stats.additions + diffData.stats.deletions;

    return diffData;
  }

  // ========================================================================
  // VERSION RESTORATION
  // ========================================================================

  restoreVersion(contentId, contentType, versionNumber, restoredBy) {
    const versionToRestore = this.getVersion(contentId, contentType, versionNumber);

    if (!versionToRestore) {
      throw new Error('Version not found');
    }

    // Create new version with restored content
    return this.createVersion(
      {
        content_id: contentId,
        content_type: contentType,
        title: versionToRestore.title,
        content: versionToRestore.content,
        change_summary: `Restored from version ${versionNumber}`,
        is_major_version: 1,
        tags: ['restored', `from_v${versionNumber}`]
      },
      restoredBy
    );
  }

  // ========================================================================
  // VERSION TAGGING
  // ========================================================================

  tagVersion(contentId, contentType, versionNumber, tags) {
    const version = this.getVersion(contentId, contentType, versionNumber);

    if (!version) {
      throw new Error('Version not found');
    }

    const currentTags = version.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])]; // Merge and deduplicate

    this.db.prepare(`
      UPDATE document_versions
      SET tags = ?
      WHERE id = ?
    `).run(JSON.stringify(newTags), version.id);

    return this.getVersion(contentId, contentType, versionNumber);
  }

  removeTag(contentId, contentType, versionNumber, tagToRemove) {
    const version = this.getVersion(contentId, contentType, versionNumber);

    if (!version) {
      throw new Error('Version not found');
    }

    const currentTags = version.tags || [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);

    this.db.prepare(`
      UPDATE document_versions
      SET tags = ?
      WHERE id = ?
    `).run(JSON.stringify(newTags), version.id);

    return this.getVersion(contentId, contentType, versionNumber);
  }

  // ========================================================================
  // VERSION STATISTICS
  // ========================================================================

  getVersionStats(contentId, contentType) {
    const stats = {
      total_versions: 0,
      major_versions: 0,
      contributors: [],
      first_version_date: null,
      last_version_date: null,
      total_changes: 0
    };

    const versionData = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_major_version = 1 THEN 1 ELSE 0 END) as major,
        MIN(created_at) as first_date,
        MAX(created_at) as last_date
      FROM document_versions
      WHERE content_id = ? AND content_type = ?
    `).get(contentId, contentType);

    if (versionData) {
      stats.total_versions = versionData.total;
      stats.major_versions = versionData.major;
      stats.first_version_date = versionData.first_date;
      stats.last_version_date = versionData.last_date;
    }

    // Get contributors
    const contributors = this.db.prepare(`
      SELECT DISTINCT u.id, u.full_name, COUNT(*) as version_count
      FROM document_versions dv
      JOIN users u ON dv.created_by = u.id
      WHERE dv.content_id = ? AND dv.content_type = ?
      GROUP BY u.id, u.full_name
      ORDER BY version_count DESC
    `).all(contentId, contentType);

    stats.contributors = contributors;

    return stats;
  }

  getAllVersionedContent(contentType = null) {
    let query = `
      SELECT
        content_id,
        content_type,
        COUNT(*) as version_count,
        MAX(version_number) as latest_version,
        MAX(created_at) as last_updated
      FROM document_versions
    `;

    const params = [];

    if (contentType) {
      query += ' WHERE content_type = ?';
      params.push(contentType);
    }

    query += ' GROUP BY content_id, content_type ORDER BY last_updated DESC';

    return this.db.prepare(query).all(...params);
  }
}

module.exports = VersionControlService;
