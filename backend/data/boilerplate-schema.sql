-- Boilerplate Management Schema
-- Stores and tracks boilerplate paragraphs for candidates

-- Boilerplate library - stores known boilerplate paragraphs
CREATE TABLE IF NOT EXISTS boilerplate_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identification
    candidate_name TEXT NOT NULL,
    campaign_id TEXT,

    -- Boilerplate content
    boilerplate_text TEXT NOT NULL,
    boilerplate_hash TEXT NOT NULL UNIQUE, -- SHA256 hash for quick matching

    -- Metadata
    is_active BOOLEAN DEFAULT 1,
    first_seen_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 1,

    -- Source tracking
    first_seen_in_release TEXT, -- Assignment ID or filename

    -- Classification
    boilerplate_type TEXT DEFAULT 'campaign', -- 'campaign', 'organization', 'issue-specific'
    confidence_score REAL DEFAULT 1.0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_boilerplate_candidate ON boilerplate_library(candidate_name);
CREATE INDEX IF NOT EXISTS idx_boilerplate_hash ON boilerplate_library(boilerplate_hash);
CREATE INDEX IF NOT EXISTS idx_boilerplate_active ON boilerplate_library(is_active);

-- Boilerplate usage tracking - records each use of boilerplate
CREATE TABLE IF NOT EXISTS boilerplate_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    boilerplate_id INTEGER NOT NULL,
    assignment_id INTEGER,

    -- Modification tracking
    was_modified BOOLEAN DEFAULT 0,
    original_text TEXT,
    modified_text TEXT,
    modification_type TEXT, -- 'minor', 'significant', 'complete-rewrite'
    similarity_score REAL, -- 0.0 to 1.0

    -- Editor who modified (if applicable)
    modified_by TEXT,
    modification_notes TEXT,

    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (boilerplate_id) REFERENCES boilerplate_library(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_boilerplate_usage_assignment ON boilerplate_usage(assignment_id);
CREATE INDEX IF NOT EXISTS idx_boilerplate_usage_modified ON boilerplate_usage(was_modified);

-- Boilerplate modification warnings - tracks when users try to edit boilerplate
CREATE TABLE IF NOT EXISTS boilerplate_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    assignment_id INTEGER,
    boilerplate_id INTEGER,

    warning_type TEXT NOT NULL, -- 'edit-attempt', 'deviation-detected', 'unauthorized-change'
    warning_severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'

    original_text TEXT,
    attempted_change TEXT,

    editor_user TEXT,
    editor_acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (boilerplate_id) REFERENCES boilerplate_library(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boilerplate_warnings_assignment ON boilerplate_warnings(assignment_id);

-- Trigger to update usage count
CREATE TRIGGER IF NOT EXISTS update_boilerplate_usage_count
AFTER INSERT ON boilerplate_usage
BEGIN
    UPDATE boilerplate_library
    SET usage_count = usage_count + 1,
        last_used_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.boilerplate_id;
END;

-- Sample boilerplate patterns (will be populated from actual releases)
-- This is just for documentation/examples
-- INSERT INTO boilerplate_library (candidate_name, boilerplate_text, boilerplate_hash, boilerplate_type) VALUES
-- ('John Smith',
--  'John Smith is a lifelong resident of Massachusetts and a proven leader in education reform. As State Senator, he has championed legislation to increase teacher pay and expand access to early childhood education. Smith holds a B.A. from Boston College and an M.Ed. from Harvard University.',
--  'hash_here',
--  'campaign');
