const db = require('./init');

/**
 * Initialize parsed press releases table
 */
function initializeParsedPressReleasesTable() {
    return new Promise((resolve, reject) => {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS parsed_press_releases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                release_type TEXT,
                release_subtype TEXT,
                confidence REAL,
                subtypes TEXT, -- JSON array
                issues TEXT, -- JSON array
                metadata TEXT, -- JSON object with candidate_name, state, word_count, etc.
                parsed_data TEXT, -- Full parsed data JSON
                source_file TEXT,
                reviewed_by TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('Error creating parsed_press_releases table:', err);
                reject(err);
                return;
            }

            console.log('✅ Parsed press releases table initialized');

            // Create indexes for common queries after table is created
            const createIndexes = [
                'CREATE INDEX IF NOT EXISTS idx_release_type ON parsed_press_releases(release_type)',
                'CREATE INDEX IF NOT EXISTS idx_created_at ON parsed_press_releases(created_at)',
                'CREATE INDEX IF NOT EXISTS idx_source_file ON parsed_press_releases(source_file)'
            ];

            if (createIndexes.length === 0) {
                resolve();
                return;
            }

            let indexCount = 0;
            let hasError = false;

            createIndexes.forEach(sql => {
                db.run(sql, (indexErr) => {
                    if (indexErr) {
                        console.error('Error creating index:', indexErr);
                        if (!hasError) {
                            hasError = true;
                            reject(indexErr);
                        }
                        return;
                    }
                    indexCount++;
                    if (indexCount === createIndexes.length && !hasError) {
                        resolve();
                    }
                });
            });
        });
    });
}

/**
 * Save a parsed press release
 */
async function saveParsedPressRelease(data) {
    const {
        title,
        content,
        release_type,
        release_subtype,
        confidence,
        subtypes,
        issues,
        metadata,
        parsed_data,
        source_file,
        reviewed_by
    } = data;

    const sql = `
        INSERT INTO parsed_press_releases
        (title, content, release_type, release_subtype, confidence, subtypes, issues, metadata, parsed_data, source_file, reviewed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // db.run() returns a Promise with { id, changes }
    const result = await db.run(
        sql,
        [
            title,
            content,
            release_type,
            release_subtype,
            confidence,
            JSON.stringify(subtypes || []),
            JSON.stringify(issues || []),
            JSON.stringify(metadata || {}),
            JSON.stringify(parsed_data || {}),
            source_file || null,
            reviewed_by || null
        ]
    );

    return { id: result.id };
}

/**
 * Update a parsed press release
 */
async function updateParsedPressRelease(id, data) {
    const {
        title,
        content,
        release_type,
        release_subtype,
        confidence,
        subtypes,
        issues,
        metadata,
        parsed_data,
        source_file,
        reviewed_by
    } = data;

    const sql = `
        UPDATE parsed_press_releases
        SET title = ?,
            content = ?,
            release_type = ?,
            release_subtype = ?,
            confidence = ?,
            subtypes = ?,
            issues = ?,
            metadata = ?,
            parsed_data = ?,
            source_file = ?,
            reviewed_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const result = await db.run(
        sql,
        [
            title,
            content,
            release_type,
            release_subtype,
            confidence,
            JSON.stringify(subtypes || []),
            JSON.stringify(issues || []),
            JSON.stringify(metadata || {}),
            JSON.stringify(parsed_data || {}),
            source_file || null,
            reviewed_by || null,
            id
        ]
    );

    return { id, changes: result.changes };
}

/**
 * Get a parsed press release by ID
 */
async function getParsedPressRelease(id) {
    const sql = 'SELECT * FROM parsed_press_releases WHERE id = ?';

    const row = await db.get(sql, [id]);

    if (row) {
        // Parse JSON fields
        row.subtypes = JSON.parse(row.subtypes || '[]');
        row.issues = JSON.parse(row.issues || '[]');
        row.metadata = JSON.parse(row.metadata || '{}');
        row.parsed_data = JSON.parse(row.parsed_data || '{}');
        return row;
    }

    return null;
}

/**
 * List all parsed press releases
 */
async function listParsedPressReleases(options = {}) {
    const { limit = 50, offset = 0, release_type = null } = options;

    let sql = 'SELECT id, title, release_type, release_subtype, confidence, subtypes, issues, source_file, reviewed_by, created_at, updated_at FROM parsed_press_releases';
    const params = [];

    if (release_type) {
        sql += ' WHERE release_type = ?';
        params.push(release_type);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await db.all(sql, params);

    // Parse JSON fields for each row
    const parsedRows = rows.map(row => ({
        ...row,
        subtypes: JSON.parse(row.subtypes || '[]'),
        issues: JSON.parse(row.issues || '[]')
    }));

    return parsedRows;
}

/**
 * Delete a parsed press release
 */
function deleteParsedPressRelease(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM parsed_press_releases WHERE id = ?';

        db.run(sql, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ deleted: this.changes > 0 });
            }
        });
    });
}

/**
 * Search parsed press releases
 */
function searchParsedPressReleases(query) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, title, release_type, release_subtype, confidence, created_at
            FROM parsed_press_releases
            WHERE title LIKE ? OR content LIKE ?
            ORDER BY created_at DESC
            LIMIT 20
        `;

        const searchTerm = `%${query}%`;
        db.all(sql, [searchTerm, searchTerm], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    initializeParsedPressReleasesTable,
    saveParsedPressRelease,
    updateParsedPressRelease,
    getParsedPressRelease,
    listParsedPressReleases,
    deleteParsedPressRelease,
    searchParsedPressReleases
};
