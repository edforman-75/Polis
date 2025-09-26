const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const dbPath = process.env.DATABASE_PATH || './campaign.db';

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('📂 Connected to SQLite database');
                    this.createTables()
                        .then(() => this.seedData())
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async createTables() {
        const queries = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'writer',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )`,

            // Assignments table
            `CREATE TABLE IF NOT EXISTS assignments (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                brief TEXT,
                assignor_id INTEGER,
                assignee_id INTEGER,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                due_date DATETIME,
                assignment_type TEXT DEFAULT 'press-release',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignor_id) REFERENCES users(id),
                FOREIGN KEY (assignee_id) REFERENCES users(id)
            )`,

            // Content blocks table
            `CREATE TABLE IF NOT EXISTS content_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                block_id TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                data TEXT,
                position INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id)
            )`,

            // Content versions table (for tracking edits)
            `CREATE TABLE IF NOT EXISTS content_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                user_id INTEGER,
                version_data TEXT,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Research queries table (for tracking AI usage)
            `CREATE TABLE IF NOT EXISTS research_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                assignment_id TEXT,
                query TEXT NOT NULL,
                response TEXT,
                topic TEXT,
                sources TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (assignment_id) REFERENCES assignments(id)
            )`,

            // Workflows table
            `CREATE TABLE IF NOT EXISTS workflows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                from_status TEXT,
                to_status TEXT,
                user_id INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Schema exports table
            `CREATE TABLE IF NOT EXISTS schema_exports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                schema_data TEXT NOT NULL,
                platform TEXT,
                exported_by INTEGER,
                exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (exported_by) REFERENCES users(id)
            )`,

            // Templates table
            `CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Speeches table
            `CREATE TABLE IF NOT EXISTS speeches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Speech versions table (for revision history)
            `CREATE TABLE IF NOT EXISTS speech_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                speech_id INTEGER,
                version_number INTEGER,
                content TEXT NOT NULL,
                metadata TEXT,
                changes_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (speech_id) REFERENCES speeches(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Communications briefs table
            `CREATE TABLE IF NOT EXISTS communications_briefs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                audience TEXT,
                tone TEXT,
                key_points TEXT,
                assignment_id TEXT,
                status TEXT DEFAULT 'draft',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                assigned_to INTEGER,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id)
            )`,

            // Social media posts table
            `CREATE TABLE IF NOT EXISTS social_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                content TEXT NOT NULL,
                media_urls TEXT,
                hashtags TEXT,
                scheduled_for DATETIME,
                status TEXT DEFAULT 'draft',
                engagement_data TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Policy documents table
            `CREATE TABLE IF NOT EXISTS policy_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                key_points TEXT,
                status TEXT DEFAULT 'draft',
                version INTEGER DEFAULT 1,
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                reviewed_by INTEGER,
                approved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (reviewed_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // Press releases table
            `CREATE TABLE IF NOT EXISTS press_releases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                headline TEXT NOT NULL,
                subheadline TEXT,
                content TEXT NOT NULL,
                media_contact TEXT,
                embargo_date DATETIME,
                distribution_list TEXT,
                status TEXT DEFAULT 'draft',
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                approved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // Event content table
            `CREATE TABLE IF NOT EXISTS event_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_name TEXT NOT NULL,
                event_type TEXT NOT NULL,
                date DATETIME NOT NULL,
                location TEXT,
                description TEXT,
                talking_points TEXT,
                logistics TEXT,
                media_advisory TEXT,
                status TEXT DEFAULT 'planned',
                assignment_id TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Campaign materials table
            `CREATE TABLE IF NOT EXISTS campaign_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                design_notes TEXT,
                target_audience TEXT,
                distribution_channels TEXT,
                budget_allocated DECIMAL(10,2),
                status TEXT DEFAULT 'concept',
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                approved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // Opposition research table
            `CREATE TABLE IF NOT EXISTS opposition_research (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                content TEXT NOT NULL,
                sources TEXT,
                verification_status TEXT DEFAULT 'unverified',
                sensitivity_level TEXT DEFAULT 'internal',
                tags TEXT,
                notes TEXT,
                assignment_id TEXT,
                researched_by INTEGER,
                verified_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (researched_by) REFERENCES users(id),
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )`,

            // Voter outreach table
            `CREATE TABLE IF NOT EXISTS voter_outreach (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_name TEXT NOT NULL,
                target_demographics TEXT,
                message TEXT NOT NULL,
                channels TEXT,
                geographic_focus TEXT,
                budget DECIMAL(10,2),
                start_date DATE,
                end_date DATE,
                metrics TEXT,
                status TEXT DEFAULT 'planning',
                assignment_id TEXT,
                created_by INTEGER,
                managed_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (managed_by) REFERENCES users(id)
            )`,

            // Media relations table
            `CREATE TABLE IF NOT EXISTS media_relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                outlet_name TEXT NOT NULL,
                contact_name TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                beat TEXT,
                relationship_notes TEXT,
                last_contact DATE,
                priority_level TEXT DEFAULT 'medium',
                assignment_id TEXT,
                managed_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (managed_by) REFERENCES users(id)
            )`,

            // Editor operations table (for undo/redo functionality)
            `CREATE TABLE IF NOT EXISTS editor_operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                assignment_id TEXT,
                content_type TEXT,
                content_id TEXT,
                operation_type TEXT NOT NULL,
                operation_data TEXT NOT NULL,
                position_start INTEGER,
                position_end INTEGER,
                content_before TEXT,
                content_after TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                is_undone BOOLEAN DEFAULT FALSE,
                is_checkpoint BOOLEAN DEFAULT FALSE,
                sequence_number INTEGER,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Editor sessions table (for collaborative editing)
            `CREATE TABLE IF NOT EXISTS editor_sessions (
                id TEXT PRIMARY KEY,
                assignment_id TEXT,
                content_type TEXT,
                content_id TEXT,
                user_id INTEGER,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                cursor_position INTEGER DEFAULT 0,
                selection_start INTEGER DEFAULT 0,
                selection_end INTEGER DEFAULT 0,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`
        ];

        for (const query of queries) {
            await this.run(query);
        }

        // Migration: Add assignment_type column if it doesn't exist
        const hasAssignmentType = await this.columnExists('assignments', 'assignment_type');
        if (!hasAssignmentType) {
            await this.run(`ALTER TABLE assignments ADD COLUMN assignment_type TEXT DEFAULT 'press-release'`);
            console.log('📊 Added assignment_type column to assignments table');
        }

        // Migration: Add structured_data (LD-JSON) columns to all content tables
        const contentTables = [
            'speeches', 'social_posts', 'press_releases', 'policy_documents',
            'event_content', 'campaign_materials', 'opposition_research',
            'voter_outreach', 'media_relations', 'communications_briefs'
        ];

        for (const table of contentTables) {
            const hasStructuredData = await this.columnExists(table, 'structured_data');
            if (!hasStructuredData) {
                await this.run(`ALTER TABLE ${table} ADD COLUMN structured_data TEXT`);
                console.log(`📋 Added structured_data (LD-JSON) column to ${table} table`);
            }
        }

        console.log('✅ Database tables created');
    }

    async seedData() {
        // Check if data already exists
        const userCount = await this.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count > 0) {
            console.log('📊 Database already seeded');
            return;
        }

        // Create demo users
        const hashedPassword = await bcrypt.hash('demo123', 10);

        await this.run(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            ['david@campaign.com', hashedPassword, 'David Park', 'manager']
        );

        await this.run(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            ['writer@campaign.com', hashedPassword, 'Alex Writer', 'writer']
        );

        await this.run(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            ['reviewer@campaign.com', hashedPassword, 'Sam Reviewer', 'reviewer']
        );

        // Create demo assignments
        const assignments = [
            {
                id: 'A-2024-001',
                title: 'Healthcare Policy Statement',
                description: 'Draft statement on Medicare expansion proposal',
                brief: 'Create a comprehensive statement outlining our position on Medicare expansion...',
                status: 'in_progress',
                priority: 'high',
                due_date: '2024-11-15'
            },
            {
                id: 'A-2024-002',
                title: 'Veterans Day Op-Ed',
                description: 'Opinion piece for local newspaper',
                brief: 'Write a 600-word op-ed honoring veterans and outlining our veterans support policies...',
                status: 'review',
                priority: 'high',
                due_date: '2024-11-10'
            },
            {
                id: 'A-2024-003',
                title: 'Veterans Day Social Media Series',
                description: 'Multi-platform social media campaign for Veterans Day',
                brief: 'Develop a series of social media posts for Twitter, Facebook, and Instagram celebrating Veterans Day...',
                status: 'blocked',
                priority: 'urgent',
                due_date: '2024-11-11'
            },
            {
                id: 'A-2024-004',
                title: 'Economic Recovery Plan',
                description: 'Detailed policy brief on economic initiatives',
                brief: 'Prepare a policy brief outlining our economic recovery plan with focus on small business support...',
                status: 'pending',
                priority: 'medium',
                due_date: '2024-11-20'
            }
        ];

        for (const assignment of assignments) {
            await this.run(
                `INSERT INTO assignments (id, title, description, brief, assignor_id, assignee_id, status, priority, due_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [assignment.id, assignment.title, assignment.description, assignment.brief, 1, 2, assignment.status, assignment.priority, assignment.due_date]
            );
        }

        // Create demo templates
        await this.run(
            `INSERT INTO templates (name, type, content, created_by)
             VALUES (?, ?, ?, ?)`,
            ['Veterans Event Template', 'event', '{"blocks": [{"type": "heading1", "content": "Veterans Event"}, {"type": "event", "content": "Event details here"}]}', 1]
        );

        await this.run(
            `INSERT INTO templates (name, type, content, created_by)
             VALUES (?, ?, ?, ?)`,
            ['Policy Brief Template', 'policy', '{"blocks": [{"type": "heading1", "content": "Policy Brief"}, {"type": "policy", "content": "Policy details here"}]}', 1]
        );

        console.log('🌱 Database seeded with demo data');
    }

    // Helper methods
    async columnExists(tableName, columnName) {
        try {
            const result = await this.get(`PRAGMA table_info(${tableName})`);
            const columns = await this.all(`PRAGMA table_info(${tableName})`);
            return columns.some(col => col.name === columnName);
        } catch (error) {
            console.error(`Error checking column existence: ${tableName}.${columnName}`, error);
            return false;
        }
    }

    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

module.exports = new Database();