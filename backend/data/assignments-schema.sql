-- Press Release Assignments Schema
-- Tracks complete lifecycle of each press release from import to publication

-- Main assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Basic Info
    title TEXT NOT NULL,                    -- Headline or identifier
    slug TEXT UNIQUE NOT NULL,              -- URL-friendly identifier
    status TEXT NOT NULL DEFAULT 'parsing', -- parsing, needs_validation, validating, validated, editing, reviewed, published
    priority TEXT DEFAULT 'normal',         -- urgent, high, normal, low

    -- Original submission
    original_text TEXT NOT NULL,            -- Raw text from writer
    submitted_by TEXT,                      -- Writer name/email
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Parser stage
    parsed_at DATETIME,
    parsed_by TEXT,                         -- System or user who ran parser
    parsed_fields JSON,                     -- Extracted fields as JSON
    parser_confidence REAL,                 -- Overall confidence score

    -- Validation stage (Parser Reviewer)
    validation_started_at DATETIME,
    validation_started_by TEXT,
    validation_completed_at DATETIME,
    validation_completed_by TEXT,
    validation_time_seconds INTEGER,        -- Time spent validating
    validation_corrections_count INTEGER DEFAULT 0,
    validated_fields JSON,                  -- Corrected fields as JSON

    -- Editing stage (Content Editor)
    editing_started_at DATETIME,
    editing_started_by TEXT,
    editing_completed_at DATETIME,
    editing_completed_by TEXT,
    editing_time_seconds INTEGER,           -- Time spent editing
    edited_fields JSON,                     -- Enhanced fields as JSON

    -- Quality metrics
    quality_score REAL,                     -- 1-5 rating
    ap_style_score REAL,
    voice_consistency_score REAL,
    grammar_score REAL,

    -- Final output
    final_html TEXT,                        -- HTML export
    final_text TEXT,                        -- Plain text export
    final_jsonld TEXT,                      -- JSON-LD export
    tracked_changes_html TEXT,              -- Tracked changes HTML
    cms_bridge_json TEXT,                   -- CMS integration format

    -- Publication
    published_at DATETIME,
    published_by TEXT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Audit trail
    notes TEXT,                             -- Any special notes
    tags TEXT                               -- Comma-separated tags
);

-- Assignment history table (tracks all state changes)
CREATE TABLE IF NOT EXISTS assignment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,

    -- Change details
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by TEXT NOT NULL,
    change_type TEXT NOT NULL,              -- status_change, field_edit, quality_check, export, etc.

    -- Old and new state
    field_name TEXT,                        -- Which field changed
    old_value TEXT,                         -- Previous value
    new_value TEXT,                         -- New value

    -- Context
    stage TEXT,                             -- validation, editing, publishing
    role TEXT,                              -- parser-reviewer, content-editor
    reason TEXT,                            -- Why the change was made

    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- Assignment versions table (stores snapshots at each stage)
CREATE TABLE IF NOT EXISTS assignment_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,

    -- Version info
    version_type TEXT NOT NULL,             -- original, parsed, validated, edited, final
    version_number INTEGER NOT NULL,        -- Incremental version within type
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,

    -- Content snapshot
    fields_json TEXT NOT NULL,              -- Complete field state as JSON
    html_snapshot TEXT,                     -- Rendered HTML at this version

    -- Metadata
    notes TEXT,

    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, version_type, version_number)
);

-- Parser feedback table (for learning)
CREATE TABLE IF NOT EXISTS parser_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,

    -- Feedback details
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_by TEXT NOT NULL,

    -- Field corrections
    field_name TEXT NOT NULL,
    parser_extracted TEXT,                  -- What parser got
    user_corrected TEXT,                    -- What user corrected to
    correction_type TEXT,                   -- field_movement, extraction, cleanup, format

    -- Learning signals
    pattern_signals JSON,                   -- Signals for ML training

    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- Editorial changes table (for content improvement patterns)
CREATE TABLE IF NOT EXISTS editorial_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,

    -- Change details
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by TEXT NOT NULL,

    -- Field modification
    field_name TEXT NOT NULL,
    original_value TEXT,
    edited_value TEXT,

    -- AI involvement
    change_type TEXT,                       -- ai-suggested, editor-manual, auto-fix
    category TEXT,                          -- AP Style, Grammar, Voice, Enhancement
    ai_recommendation_accepted BOOLEAN,

    -- Quality impact
    quality_improvement REAL,               -- Estimated improvement

    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_validation_by ON assignments(validation_completed_by);
CREATE INDEX IF NOT EXISTS idx_assignments_editing_by ON assignments(editing_completed_by);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment ON assignment_history(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_versions_assignment ON assignment_versions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_parser_feedback_assignment ON parser_feedback(assignment_id);
CREATE INDEX IF NOT EXISTS idx_editorial_changes_assignment ON editorial_changes(assignment_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_assignments_timestamp
AFTER UPDATE ON assignments
BEGIN
    UPDATE assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
