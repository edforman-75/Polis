/**
 * Boilerplate Manager - Manages boilerplate detection and tracking
 */

const crypto = require('crypto');

class BoilerplateManager {
    constructor(db) {
        this.db = db;
    }

    /**
     * Calculate text hash for comparison
     */
    calculateHash(text) {
        const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /**
     * Calculate similarity between two texts (0.0 to 1.0)
     */
    calculateSimilarity(text1, text2) {
        // Normalize texts
        const normalize = (t) => t.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        const a = normalize(text1);
        const b = normalize(text2);

        // Levenshtein distance-based similarity
        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 1.0;

        const distance = this.levenshteinDistance(a, b);
        return 1.0 - (distance / maxLen);
    }

    /**
     * Levenshtein distance algorithm
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Add or update boilerplate in library
     */
    async addBoilerplate(candidateName, boilerplateText, metadata = {}) {
        const hash = this.calculateHash(boilerplateText);

        return new Promise((resolve, reject) => {
            // Check if this boilerplate already exists
            this.db.get(
                'SELECT * FROM boilerplate_library WHERE boilerplate_hash = ?',
                [hash],
                (err, existing) => {
                    if (err) return reject(err);

                    if (existing) {
                        // Update existing
                        this.db.run(
                            `UPDATE boilerplate_library
                             SET last_used_date = CURRENT_TIMESTAMP,
                                 usage_count = usage_count + 1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE id = ?`,
                            [existing.id],
                            (err) => {
                                if (err) reject(err);
                                else resolve({ id: existing.id, isNew: false });
                            }
                        );
                    } else {
                        // Insert new
                        this.db.run(
                            `INSERT INTO boilerplate_library (
                                candidate_name, boilerplate_text, boilerplate_hash,
                                boilerplate_type, first_seen_in_release, confidence_score
                            ) VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                candidateName,
                                boilerplateText,
                                hash,
                                metadata.type || 'campaign',
                                metadata.firstSeenIn || null,
                                metadata.confidence || 1.0
                            ],
                            function(err) {
                                if (err) reject(err);
                                else {
                                    console.log(`📋 New boilerplate added for ${candidateName}`);
                                    resolve({ id: this.lastID, isNew: true });
                                }
                            }
                        );
                    }
                }
            );
        });
    }

    /**
     * Find matching boilerplate for a text
     */
    async findMatchingBoilerplate(candidateName, text, minSimilarity = 0.85) {
        const hash = this.calculateHash(text);

        return new Promise((resolve, reject) => {
            // First try exact match
            this.db.get(
                `SELECT * FROM boilerplate_library
                 WHERE candidate_name = ? AND boilerplate_hash = ? AND is_active = 1`,
                [candidateName, hash],
                (err, exact) => {
                    if (err) return reject(err);
                    if (exact) {
                        return resolve({
                            match: exact,
                            similarity: 1.0,
                            isExact: true
                        });
                    }

                    // Try fuzzy match
                    this.db.all(
                        `SELECT * FROM boilerplate_library
                         WHERE candidate_name = ? AND is_active = 1
                         ORDER BY usage_count DESC, last_used_date DESC
                         LIMIT 10`,
                        [candidateName],
                        (err, candidates) => {
                            if (err) return reject(err);
                            if (!candidates || candidates.length === 0) {
                                return resolve(null);
                            }

                            // Find best match
                            let bestMatch = null;
                            let bestSimilarity = 0;

                            candidates.forEach(candidate => {
                                const similarity = this.calculateSimilarity(text, candidate.boilerplate_text);
                                if (similarity > bestSimilarity && similarity >= minSimilarity) {
                                    bestSimilarity = similarity;
                                    bestMatch = candidate;
                                }
                            });

                            if (bestMatch) {
                                resolve({
                                    match: bestMatch,
                                    similarity: bestSimilarity,
                                    isExact: false
                                });
                            } else {
                                resolve(null);
                            }
                        }
                    );
                }
            );
        });
    }

    /**
     * Record boilerplate usage
     */
    async recordUsage(boilerplateId, assignmentId, originalText, modifiedText = null) {
        const wasModified = modifiedText && modifiedText !== originalText;
        let similarity = 1.0;
        let modificationType = null;

        if (wasModified) {
            similarity = this.calculateSimilarity(originalText, modifiedText);

            if (similarity >= 0.95) {
                modificationType = 'minor';
            } else if (similarity >= 0.75) {
                modificationType = 'significant';
            } else {
                modificationType = 'complete-rewrite';
            }
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO boilerplate_usage (
                    boilerplate_id, assignment_id, was_modified,
                    original_text, modified_text, modification_type, similarity_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    boilerplateId,
                    assignmentId,
                    wasModified ? 1 : 0,
                    originalText,
                    modifiedText,
                    modificationType,
                    similarity
                ],
                function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`📝 Boilerplate usage recorded (modified: ${wasModified})`);
                        resolve({ id: this.lastID, wasModified, modificationType, similarity });
                    }
                }
            );
        });
    }

    /**
     * Create warning when boilerplate is being edited
     */
    async createWarning(assignmentId, boilerplateId, warningType, originalText, attemptedChange, editorUser) {
        return new Promise((resolve, reject) => {
            // Determine severity based on modification type
            const similarity = this.calculateSimilarity(originalText, attemptedChange);
            let severity = 'low';

            if (similarity < 0.5) {
                severity = 'high';
            } else if (similarity < 0.85) {
                severity = 'medium';
            }

            this.db.run(
                `INSERT INTO boilerplate_warnings (
                    assignment_id, boilerplate_id, warning_type, warning_severity,
                    original_text, attempted_change, editor_user
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    assignmentId,
                    boilerplateId,
                    warningType,
                    severity,
                    originalText,
                    attemptedChange,
                    editorUser
                ],
                function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`⚠️  Boilerplate warning created: ${warningType} (${severity})`);
                        resolve({
                            id: this.lastID,
                            severity,
                            similarity
                        });
                    }
                }
            );
        });
    }

    /**
     * Get all boilerplates for a candidate
     */
    async getBoilerplatesForCandidate(candidateName) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM boilerplate_library
                 WHERE candidate_name = ? AND is_active = 1
                 ORDER BY usage_count DESC, last_used_date DESC`,
                [candidateName],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Get boilerplate modification history
     */
    async getModificationHistory(candidateName, limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT bu.*, bl.candidate_name, bl.boilerplate_text, a.title
                 FROM boilerplate_usage bu
                 JOIN boilerplate_library bl ON bu.boilerplate_id = bl.id
                 LEFT JOIN assignments a ON bu.assignment_id = a.id
                 WHERE bl.candidate_name = ? AND bu.was_modified = 1
                 ORDER BY bu.used_at DESC
                 LIMIT ?`,
                [candidateName, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Get warnings for an assignment
     */
    async getWarningsForAssignment(assignmentId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT bw.*, bl.boilerplate_text, bl.candidate_name
                 FROM boilerplate_warnings bw
                 JOIN boilerplate_library bl ON bw.boilerplate_id = bl.id
                 WHERE bw.assignment_id = ?
                 ORDER BY bw.created_at DESC`,
                [assignmentId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Acknowledge a warning
     */
    async acknowledgeWarning(warningId, editorUser) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE boilerplate_warnings
                 SET editor_acknowledged = 1,
                     acknowledged_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [warningId],
                (err) => {
                    if (err) reject(err);
                    else {
                        console.log(`✅ Warning ${warningId} acknowledged by ${editorUser}`);
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * Deactivate a boilerplate (when it's no longer used)
     */
    async deactivateBoilerplate(boilerplateId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE boilerplate_library SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [boilerplateId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}

module.exports = BoilerplateManager;
