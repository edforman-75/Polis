/**
 * Content Manager - Manages content blocks and versions
 */

class ContentManager {
    constructor(db) {
        this.db = db;
    }

    /**
     * Save content blocks for an assignment
     * Replaces existing blocks with new ones in a transaction
     */
    async saveBlocks(assignmentId, blocks) {
        if (!assignmentId || !blocks) {
            throw new Error('Assignment ID and blocks are required');
        }

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);

                    // Delete existing blocks
                    this.db.run(
                        'DELETE FROM content_blocks WHERE assignment_id = ?',
                        [assignmentId],
                        (err) => {
                            if (err) {
                                this.db.run('ROLLBACK');
                                return reject(err);
                            }

                            // Insert new blocks
                            let completed = 0;
                            let hasError = false;

                            if (blocks.length === 0) {
                                // No blocks to insert, just update assignment
                                this.updateAssignmentTimestamp(assignmentId)
                                    .then(() => {
                                        this.db.run('COMMIT', (err) => {
                                            if (err) reject(err);
                                            else resolve({ success: true, blocksCount: 0 });
                                        });
                                    })
                                    .catch((err) => {
                                        this.db.run('ROLLBACK');
                                        reject(err);
                                    });
                                return;
                            }

                            blocks.forEach((block, i) => {
                                this.db.run(
                                    `INSERT INTO content_blocks (assignment_id, block_id, type, content, data, position)
                                     VALUES (?, ?, ?, ?, ?, ?)`,
                                    [
                                        assignmentId,
                                        block.id,
                                        block.type,
                                        block.content,
                                        JSON.stringify(block.data || {}),
                                        i
                                    ],
                                    (err) => {
                                        if (err && !hasError) {
                                            hasError = true;
                                            this.db.run('ROLLBACK');
                                            return reject(err);
                                        }

                                        completed++;
                                        if (completed === blocks.length && !hasError) {
                                            // All blocks inserted, update assignment timestamp
                                            this.updateAssignmentTimestamp(assignmentId)
                                                .then(() => {
                                                    this.db.run('COMMIT', (err) => {
                                                        if (err) reject(err);
                                                        else resolve({ success: true, blocksCount: blocks.length });
                                                    });
                                                })
                                                .catch((err) => {
                                                    this.db.run('ROLLBACK');
                                                    reject(err);
                                                });
                                        }
                                    }
                                );
                            });
                        }
                    );
                });
            });
        });
    }

    /**
     * Get content blocks for an assignment
     */
    async getBlocks(assignmentId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM content_blocks WHERE assignment_id = ? ORDER BY position',
                [assignmentId],
                (err, blocks) => {
                    if (err) return reject(err);

                    const formattedBlocks = blocks.map(block => ({
                        id: block.block_id,
                        type: block.type,
                        content: block.content,
                        data: JSON.parse(block.data || '{}'),
                        position: block.position
                    }));

                    resolve(formattedBlocks);
                }
            );
        });
    }

    /**
     * Save a version of content
     */
    async saveVersion(assignmentId, versionData, message, userId = null) {
        if (!assignmentId || !versionData) {
            throw new Error('Assignment ID and version data are required');
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO content_versions (assignment_id, version_data, message, created_by)
                 VALUES (?, ?, ?, ?)`,
                [assignmentId, JSON.stringify(versionData), message || null, userId],
                function(err) {
                    if (err) return reject(err);
                    resolve({ versionId: this.lastID });
                }
            );
        });
    }

    /**
     * Get all versions for an assignment
     */
    async getVersions(assignmentId, limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT id, assignment_id, message, created_by, created_at
                 FROM content_versions
                 WHERE assignment_id = ?
                 ORDER BY created_at DESC
                 LIMIT ?`,
                [assignmentId, limit],
                (err, versions) => {
                    if (err) return reject(err);
                    resolve(versions);
                }
            );
        });
    }

    /**
     * Get a specific version
     */
    async getVersion(versionId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM content_versions WHERE id = ?',
                [versionId],
                (err, version) => {
                    if (err) return reject(err);
                    if (!version) return reject(new Error('Version not found'));

                    resolve({
                        ...version,
                        version_data: JSON.parse(version.version_data)
                    });
                }
            );
        });
    }

    /**
     * Update assignment modification timestamp
     */
    async updateAssignmentTimestamp(assignmentId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [assignmentId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    /**
     * Delete content blocks for an assignment
     */
    async deleteBlocks(assignmentId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM content_blocks WHERE assignment_id = ?',
                [assignmentId],
                function(err) {
                    if (err) return reject(err);
                    resolve({ deletedCount: this.changes });
                }
            );
        });
    }

    /**
     * Get a single block by ID
     */
    async getBlockById(assignmentId, blockId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM content_blocks WHERE assignment_id = ? AND block_id = ?',
                [assignmentId, blockId],
                (err, block) => {
                    if (err) return reject(err);
                    if (!block) return resolve(null);

                    resolve({
                        id: block.block_id,
                        type: block.type,
                        content: block.content,
                        data: JSON.parse(block.data || '{}'),
                        position: block.position
                    });
                }
            );
        });
    }
}

module.exports = ContentManager;
