-- Quote Management Schema
-- Tracks extracted quotes and their modifications

-- Extracted quotes from press releases
CREATE TABLE IF NOT EXISTS extracted_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Source tracking
    assignment_id INTEGER,
    release_id TEXT,

    -- Quote content
    quote_text TEXT NOT NULL,
    quote_number INTEGER, -- 1, 2, 3, etc.

    -- Attribution
    speaker_name TEXT,
    speaker_title TEXT,
    speaker_role TEXT, -- 'candidate', 'spokesperson', 'supporter', 'official'

    -- Position in document
    position_in_text INTEGER,
    paragraph_number INTEGER,

    -- Quality metrics
    quality_score INTEGER DEFAULT 100, -- 0-100
    quality_issues TEXT, -- JSON array of issues
    needs_review BOOLEAN DEFAULT 0,

    -- Protection
    is_protected BOOLEAN DEFAULT 1, -- Quotes are protected by default
    preapproved BOOLEAN DEFAULT 0,
    approved_by TEXT,
    approved_at DATETIME,

    -- Modification tracking
    original_quote TEXT, -- If quote was modified
    was_modified BOOLEAN DEFAULT 0,
    modified_at DATETIME,
    modified_by TEXT,
    modification_reason TEXT,

    -- Pattern detection
    extraction_pattern TEXT, -- Which pattern matched
    extraction_confidence REAL DEFAULT 1.0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quotes_assignment ON extracted_quotes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quotes_speaker ON extracted_quotes(speaker_name);
CREATE INDEX IF NOT EXISTS idx_quotes_needs_review ON extracted_quotes(needs_review);
CREATE INDEX IF NOT EXISTS idx_quotes_protected ON extracted_quotes(is_protected);

-- Quote modification warnings
CREATE TABLE IF NOT EXISTS quote_modification_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    quote_id INTEGER NOT NULL,
    assignment_id INTEGER,

    warning_type TEXT NOT NULL, -- 'edit-attempt', 'unapproved-change', 'context-change'
    warning_severity TEXT DEFAULT 'high', -- 'low', 'medium', 'high', 'critical'

    original_text TEXT NOT NULL,
    attempted_change TEXT NOT NULL,

    editor_user TEXT,
    editor_acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at DATETIME,
    acknowledgment_notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quote_id) REFERENCES extracted_quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_warnings_quote ON quote_modification_warnings(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_warnings_assignment ON quote_modification_warnings(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quote_warnings_acknowledged ON quote_modification_warnings(editor_acknowledged);

-- Quote quality issues (denormalized for reporting)
CREATE TABLE IF NOT EXISTS quote_quality_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    quote_id INTEGER NOT NULL,

    issue_type TEXT NOT NULL, -- 'too_short', 'too_long', 'jargon_heavy', 'passive_voice', etc.
    issue_severity TEXT NOT NULL, -- 'info', 'warning', 'error'
    issue_message TEXT NOT NULL,
    issue_details TEXT,

    auto_detected BOOLEAN DEFAULT 1,
    reported_by TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quote_id) REFERENCES extracted_quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quality_issues_quote ON quote_quality_issues(quote_id);
CREATE INDEX IF NOT EXISTS idx_quality_issues_type ON quote_quality_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_quality_issues_severity ON quote_quality_issues(issue_severity);

-- Quote approval workflow
CREATE TABLE IF NOT EXISTS quote_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    quote_id INTEGER NOT NULL,
    assignment_id INTEGER,

    -- Approval request
    requested_by TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    requested_for TEXT, -- Email of person who needs to approve

    -- Approval response
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'revision-requested'
    approved_by TEXT,
    approved_at DATETIME,

    -- Feedback
    feedback_notes TEXT,
    suggested_revision TEXT,

    -- Tracking
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_at DATETIME,

    FOREIGN KEY (quote_id) REFERENCES extracted_quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_approvals_status ON quote_approvals(status);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_requested_for ON quote_approvals(requested_for);

-- Trigger to update quote modification status
CREATE TRIGGER IF NOT EXISTS update_quote_modified
AFTER UPDATE OF quote_text ON extracted_quotes
WHEN NEW.quote_text != OLD.quote_text
BEGIN
    UPDATE extracted_quotes
    SET was_modified = 1,
        modified_at = CURRENT_TIMESTAMP,
        original_quote = COALESCE(OLD.original_quote, OLD.quote_text)
    WHERE id = NEW.id;
END;
