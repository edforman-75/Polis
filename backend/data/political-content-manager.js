/**
 * Political Content Manager - Manages all political content types with security
 */

class PoliticalContentManager {
    constructor(db) {
        this.db = db;
    }

    /**
     * Validate table name against whitelist to prevent SQL injection
     * @param {string} tableName - Table name to validate
     * @returns {string} Validated table name
     * @throws {Error} If table name is not in whitelist
     */
    validateTableName(tableName) {
        const allowedTables = [
            'social_posts',
            'policy_documents',
            'press_releases',
            'event_content',
            'campaign_materials',
            'opposition_research',
            'voter_outreach',
            'media_relations'
        ];

        if (!allowedTables.includes(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }

        return tableName;
    }

    /**
     * Get all items from a content table
     * @param {string} tableName - Content table name
     * @param {Object} filters - Query filters
     * @param {number} filters.userId - User ID filter
     * @param {number} filters.assignmentId - Optional assignment ID filter
     * @param {string} filters.status - Optional status filter
     * @param {number} filters.limit - Result limit (default 50)
     * @returns {Promise<Array>} Array of content items
     */
    async getAll(tableName, filters = {}) {
        const validTable = this.validateTableName(tableName);
        const { userId, assignmentId, status, limit = 50 } = filters;

        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM ${validTable} WHERE created_by = ?`;
            const params = [userId];

            if (assignmentId) {
                query += ' AND assignment_id = ?';
                params.push(assignmentId);
            }

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            query += ' ORDER BY updated_at DESC LIMIT ?';
            params.push(parseInt(limit));

            this.db.all(query, params, (err, rows) => {
                if (err) return reject(err);

                // Parse JSON fields
                const processedRows = rows.map(row => this.parseJsonFields(row));
                resolve(processedRows);
            });
        });
    }

    /**
     * Get single item by ID
     * @param {string} tableName - Content table name
     * @param {number} id - Item ID
     * @param {number} userId - User ID for ownership check
     * @returns {Promise<Object|null>} Content item or null
     */
    async getById(tableName, id, userId) {
        const validTable = this.validateTableName(tableName);

        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM ${validTable} WHERE id = ? AND created_by = ?`,
                [id, userId],
                (err, row) => {
                    if (err) return reject(err);
                    if (!row) return resolve(null);

                    resolve(this.parseJsonFields(row));
                }
            );
        });
    }

    /**
     * Create new content item
     * @param {string} tableName - Content table name
     * @param {Object} data - Item data
     * @param {number} userId - User ID for created_by
     * @returns {Promise<Object>} Created item with ID
     */
    async create(tableName, data, userId) {
        const validTable = this.validateTableName(tableName);
        const insertData = { ...data, created_by: userId };

        // Stringify JSON fields
        this.stringifyJsonFields(insertData);

        return new Promise((resolve, reject) => {
            const fields = Object.keys(insertData);
            const placeholders = fields.map(() => '?').join(', ');
            const values = fields.map(field => insertData[field]);

            const query = `INSERT INTO ${validTable} (${fields.join(', ')}) VALUES (${placeholders})`;

            this.db.run(query, values, function(err) {
                if (err) return reject(err);

                // Fetch the created item
                this.db.get(
                    `SELECT * FROM ${validTable} WHERE id = ?`,
                    [this.lastID],
                    (err, row) => {
                        if (err) return reject(err);
                        resolve({
                            id: this.lastID,
                            ...row
                        });
                    }
                );
            }.bind(this));
        });
    }

    /**
     * Update content item
     * @param {string} tableName - Content table name
     * @param {number} id - Item ID
     * @param {Object} data - Fields to update
     * @param {number} userId - User ID for ownership check
     * @returns {Promise<Object>} Updated item
     */
    async update(tableName, id, data, userId) {
        const validTable = this.validateTableName(tableName);

        // First verify ownership
        const existing = await this.getById(tableName, id, userId);
        if (!existing) {
            throw new Error('Content not found or unauthorized');
        }

        const updateData = { ...data, updated_at: 'CURRENT_TIMESTAMP' };
        delete updateData.id;
        delete updateData.created_by;
        delete updateData.created_at;

        // Stringify JSON fields
        this.stringifyJsonFields(updateData);

        return new Promise((resolve, reject) => {
            const fields = Object.keys(updateData);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = [...fields.map(field => updateData[field]), id, userId];

            const query = `UPDATE ${validTable} SET ${setClause} WHERE id = ? AND created_by = ?`;

            this.db.run(query, values, function(err) {
                if (err) return reject(err);

                if (this.changes === 0) {
                    return reject(new Error('Content not found or no changes made'));
                }

                // Fetch updated item
                this.db.get(
                    `SELECT * FROM ${validTable} WHERE id = ?`,
                    [id],
                    (err, row) => {
                        if (err) return reject(err);
                        resolve(this.parseJsonFields(row));
                    }
                );
            }.bind(this));
        });
    }

    /**
     * Delete content item
     * @param {string} tableName - Content table name
     * @param {number} id - Item ID
     * @param {number} userId - User ID for ownership check
     * @returns {Promise<Object>} Deletion result with ID
     */
    async delete(tableName, id, userId) {
        const validTable = this.validateTableName(tableName);

        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM ${validTable} WHERE id = ? AND created_by = ?`,
                [id, userId],
                function(err) {
                    if (err) return reject(err);

                    if (this.changes === 0) {
                        return reject(new Error('Content not found or unauthorized'));
                    }

                    resolve({ deleted: true, id: parseInt(id) });
                }
            );
        });
    }

    /**
     * Bulk delete items
     * @param {string} tableName - Content table name
     * @param {Array<number>} ids - Array of item IDs
     * @param {number} userId - User ID for ownership check
     * @returns {Promise<Object>} Deletion result
     */
    async bulkDelete(tableName, ids, userId) {
        const validTable = this.validateTableName(tableName);

        return new Promise((resolve, reject) => {
            const placeholders = ids.map(() => '?').join(',');
            const query = `DELETE FROM ${validTable} WHERE id IN (${placeholders}) AND created_by = ?`;

            this.db.run(query, [...ids, userId], function(err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes, ids });
            });
        });
    }

    /**
     * Bulk update items (typically status)
     * @param {string} tableName - Content table name
     * @param {Array<number>} ids - Array of item IDs
     * @param {Object} data - Fields to update
     * @param {number} userId - User ID for ownership check
     * @returns {Promise<Object>} Update result
     */
    async bulkUpdate(tableName, ids, data, userId) {
        const validTable = this.validateTableName(tableName);

        return new Promise(async (resolve, reject) => {
            try {
                let updated = 0;
                for (const id of ids) {
                    const result = await new Promise((res, rej) => {
                        this.db.run(
                            `UPDATE ${validTable} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND created_by = ?`,
                            [data.status, id, userId],
                            function(err) {
                                if (err) return rej(err);
                                res(this.changes);
                            }
                        );
                    });
                    updated += result;
                }
                resolve({ updated, ids });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Search content
     * @param {string} tableName - Content table name
     * @param {string} query - Search query
     * @param {Array<string>} searchFields - Fields to search in
     * @param {number} userId - User ID filter
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Matching items
     */
    async search(tableName, query, searchFields, userId, limit = 20) {
        const validTable = this.validateTableName(tableName);
        const searchTerm = `%${query}%`;

        return new Promise((resolve, reject) => {
            const conditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
            const searchParams = searchFields.map(() => searchTerm);

            this.db.all(
                `SELECT * FROM ${validTable}
                 WHERE created_by = ? AND (${conditions})
                 ORDER BY updated_at DESC LIMIT ?`,
                [userId, ...searchParams, parseInt(limit)],
                (err, rows) => {
                    if (err) return reject(err);
                    const processedRows = rows.map(row => this.parseJsonFields(row));
                    resolve(processedRows);
                }
            );
        });
    }

    /**
     * Get analytics for content type
     * @param {string} tableName - Content table name
     * @param {number} userId - User ID filter
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(tableName, userId) {
        const validTable = this.validateTableName(tableName);

        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT
                    status,
                    COUNT(*) as count,
                    DATE(created_at) as date
                 FROM ${validTable}
                 WHERE created_by = ?
                 GROUP BY status, DATE(created_at)
                 ORDER BY date DESC
                 LIMIT 30`,
                [userId],
                (err, stats) => {
                    if (err) return reject(err);

                    this.db.get(
                        `SELECT COUNT(*) as total FROM ${validTable} WHERE created_by = ?`,
                        [userId],
                        (err, totalCount) => {
                            if (err) return reject(err);

                            this.db.all(
                                `SELECT * FROM ${validTable} WHERE created_by = ? ORDER BY updated_at DESC LIMIT 10`,
                                [userId],
                                (err, recentActivity) => {
                                    if (err) return reject(err);

                                    resolve({
                                        stats,
                                        total: totalCount.total,
                                        recentActivity: recentActivity.map(row => this.parseJsonFields(row)),
                                        contentType: tableName
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    /**
     * Parse JSON fields in a row
     * @private
     */
    parseJsonFields(row) {
        const processedRow = { ...row };
        const jsonFields = ['metadata', 'key_points', 'hashtags', 'media_urls', 'sources', 'tags'];

        jsonFields.forEach(field => {
            if (processedRow[field]) {
                try {
                    processedRow[field] = JSON.parse(processedRow[field]);
                } catch (e) {
                    // Leave as string if not valid JSON
                }
            }
        });

        return processedRow;
    }

    /**
     * Stringify JSON fields for database storage
     * @private
     */
    stringifyJsonFields(data) {
        const jsonFields = ['metadata', 'key_points', 'hashtags', 'media_urls', 'sources', 'tags'];

        jsonFields.forEach(field => {
            if (data[field] && typeof data[field] === 'object') {
                data[field] = JSON.stringify(data[field]);
            }
        });
    }
}

module.exports = PoliticalContentManager;
