-- Validation Queue Schema
-- System for reviewing press releases with issue tracking and knowledge base enhancement

-- Validation Queue Items
CREATE TABLE IF NOT EXISTS validation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Source document
    source_file TEXT NOT NULL,              -- Original file path
    source_type TEXT DEFAULT 'press_release', -- press_release, speech, social, etc.
    title TEXT,
    content TEXT NOT NULL,

    -- Validation metadata
    added_to_queue_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by TEXT,

    -- Analysis results
    analysis_completed BOOLEAN DEFAULT 0,
    analysis_completed_at DATETIME,
    overall_score INTEGER,
    issue_count INTEGER DEFAULT 0,

    -- Review status
    review_status TEXT DEFAULT 'pending',   -- pending, in_review, completed, skipped
    reviewer_initials TEXT,
    review_started_at DATETIME,
    review_completed_at DATETIME,

    -- Priority
    priority INTEGER DEFAULT 0,             -- Higher number = higher priority

    -- Notes
    notes TEXT
);

-- Issues found in validation
CREATE TABLE IF NOT EXISTS validation_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    queue_item_id INTEGER NOT NULL,

    -- Issue details
    category TEXT NOT NULL,                 -- grammar, ap_style, capitalization, etc.
    type TEXT NOT NULL,
    severity TEXT NOT NULL,                 -- error, warning, suggestion
    rule_id TEXT,

    -- Location in text
    offset INTEGER NOT NULL,
    length INTEGER NOT NULL,
    original_text TEXT NOT NULL,
    context_before TEXT,
    context_after TEXT,

    -- Suggestion
    suggested_correction TEXT,
    message TEXT,
    confidence REAL,

    -- Review decision
    review_status TEXT DEFAULT 'pending',   -- pending, accepted, rejected, modified, noted
    reviewer_initials TEXT,
    reviewer_action TEXT,                   -- What reviewer decided to do
    reviewer_correction TEXT,               -- If modified, what correction was used
    reviewer_comment TEXT,                  -- Reviewer notes
    reviewed_at DATETIME,

    -- Knowledge base enhancement
    should_add_to_kb BOOLEAN DEFAULT 0,
    kb_category TEXT,                       -- terminology, style_rule, exception, etc.
    kb_notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (queue_item_id) REFERENCES validation_queue(id) ON DELETE CASCADE
);

-- Reviewer comments and knowledge base suggestions
CREATE TABLE IF NOT EXISTS validation_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    queue_item_id INTEGER NOT NULL,
    issue_id INTEGER,                       -- Optional: link to specific issue

    -- Comment details
    comment_type TEXT NOT NULL,             -- general, kb_suggestion, rule_suggestion, correction
    comment_text TEXT NOT NULL,
    reviewer_initials TEXT NOT NULL,

    -- Knowledge base enhancement
    suggests_kb_entry BOOLEAN DEFAULT 0,
    kb_entry_type TEXT,                     -- terminology, proper_noun, style_exception, etc.
    kb_entry_data TEXT,                     -- JSON: structured data for KB entry

    -- Implementation status
    status TEXT DEFAULT 'pending',          -- pending, approved, implemented, rejected
    implemented_at DATETIME,
    implemented_by TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (queue_item_id) REFERENCES validation_queue(id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES validation_issues(id) ON DELETE SET NULL
);

-- Batch processing sessions
CREATE TABLE IF NOT EXISTS validation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_name TEXT,
    reviewer_initials TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,

    -- Stats
    items_reviewed INTEGER DEFAULT 0,
    issues_reviewed INTEGER DEFAULT 0,
    kb_suggestions_made INTEGER DEFAULT 0,

    notes TEXT
);

-- Link queue items to sessions
CREATE TABLE IF NOT EXISTS validation_session_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    queue_item_id INTEGER NOT NULL,
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES validation_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (queue_item_id) REFERENCES validation_queue(id) ON DELETE CASCADE
);

-- Knowledge base entries pending implementation
CREATE TABLE IF NOT EXISTS validation_kb_pending (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Source
    source_type TEXT NOT NULL,              -- comment, pattern_cluster, manual
    source_id INTEGER,                      -- Link to comment or cluster
    suggested_by TEXT NOT NULL,             -- Reviewer initials

    -- Entry details
    entry_type TEXT NOT NULL,               -- custom_term, style_rule, exception, capitalization_rule
    entry_category TEXT,                    -- campaign_specific, political, local, etc.

    -- Data
    term TEXT,                              -- For terminology
    correct_form TEXT,
    pattern TEXT,                           -- For rules
    correction TEXT,
    message TEXT,
    examples TEXT,                          -- JSON array

    -- Metadata
    confidence REAL,
    supporting_evidence TEXT,               -- JSON: links to issues/comments

    -- Status
    status TEXT DEFAULT 'pending',          -- pending, approved, rejected, implemented
    reviewed_by TEXT,
    reviewed_at DATETIME,
    implemented_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_validation_queue_status ON validation_queue(review_status);
CREATE INDEX IF NOT EXISTS idx_validation_queue_reviewer ON validation_queue(reviewer_initials);
CREATE INDEX IF NOT EXISTS idx_validation_queue_priority ON validation_queue(priority DESC);

CREATE INDEX IF NOT EXISTS idx_validation_issues_queue ON validation_issues(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_validation_issues_status ON validation_issues(review_status);
CREATE INDEX IF NOT EXISTS idx_validation_issues_reviewer ON validation_issues(reviewer_initials);

CREATE INDEX IF NOT EXISTS idx_validation_comments_queue ON validation_comments(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_validation_comments_kb ON validation_comments(suggests_kb_entry);

CREATE INDEX IF NOT EXISTS idx_validation_sessions_reviewer ON validation_sessions(reviewer_initials);

CREATE INDEX IF NOT EXISTS idx_validation_kb_pending_status ON validation_kb_pending(status);
CREATE INDEX IF NOT EXISTS idx_validation_kb_pending_type ON validation_kb_pending(entry_type);

-- Triggers
CREATE TRIGGER IF NOT EXISTS update_queue_item_issue_count
AFTER INSERT ON validation_issues
BEGIN
    UPDATE validation_queue
    SET issue_count = (
        SELECT COUNT(*) FROM validation_issues WHERE queue_item_id = NEW.queue_item_id
    )
    WHERE id = NEW.queue_item_id;
END;

CREATE TRIGGER IF NOT EXISTS update_session_stats
AFTER UPDATE ON validation_queue
WHEN NEW.review_status = 'completed' AND OLD.review_status != 'completed'
BEGIN
    UPDATE validation_sessions
    SET items_reviewed = items_reviewed + 1
    WHERE reviewer_initials = NEW.reviewer_initials
    AND ended_at IS NULL;
END;
