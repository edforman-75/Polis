-- Campaign Settings Schema
-- Stores campaign-specific configuration for this installation
-- Each installation = one campaign, so this is effectively a singleton settings table

CREATE TABLE IF NOT EXISTS campaign_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton: only one row allowed

    -- Candidate Information
    candidate_name TEXT NOT NULL,
    candidate_first_name TEXT,
    candidate_last_name TEXT,
    candidate_title TEXT,                   -- e.g., "State Senator", "Former Governor"
    candidate_pronouns TEXT,                -- e.g., "she/her", "he/him", "they/them"

    -- Campaign Organization
    organization_name TEXT NOT NULL,        -- e.g., "Smith for Senate"
    organization_legal_name TEXT,           -- Full legal name if different

    -- Race Information
    office_sought TEXT,                     -- e.g., "U.S. Senate", "Governor of California"
    district TEXT,                          -- e.g., "California", "District 5"
    party_affiliation TEXT,                 -- Democratic, Republican, Independent, etc.
    election_date DATE,
    election_type TEXT,                     -- primary, general, special

    -- Campaign Branding
    campaign_tagline TEXT,                  -- e.g., "A Voice for Working Families"
    primary_issues TEXT,                    -- Comma-separated list

    -- Voice & Tone Settings
    voice_profile TEXT DEFAULT 'professional', -- professional, conversational, bold, etc.
    tone_guidelines TEXT,                   -- Specific tone guidance for AI
    ap_style_strict BOOLEAN DEFAULT 1,      -- Enforce AP Style strictly

    -- Contact Information (for press releases)
    press_contact_name TEXT,
    press_contact_title TEXT,
    press_contact_email TEXT,
    press_contact_phone TEXT,
    campaign_website TEXT,

    -- Social Media Handles
    twitter_handle TEXT,
    facebook_handle TEXT,
    instagram_handle TEXT,

    -- Boilerplate Text
    boilerplate_short TEXT,                 -- Short bio (100 words)
    boilerplate_long TEXT,                  -- Full bio (200-300 words)

    -- Parser Settings
    auto_extract_context BOOLEAN DEFAULT 0, -- If true, still run context extraction each time
    default_release_type TEXT DEFAULT 'general', -- Default type if not specified

    -- Content Preferences
    preferred_quote_style TEXT DEFAULT 'conversational', -- conversational, formal, bold
    include_call_to_action BOOLEAN DEFAULT 1,
    default_cta_text TEXT,                  -- e.g., "Learn more at www.example.com"

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    configured_by TEXT,                     -- Who set up the campaign
    last_modified_by TEXT
);

-- Campaign team members (optional multi-user support)
CREATE TABLE IF NOT EXISTS campaign_team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    role TEXT NOT NULL,                     -- parser-reviewer, content-editor, admin
    permissions TEXT,                       -- JSON array of permissions
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Campaign style guide (custom rules)
CREATE TABLE IF NOT EXISTS campaign_style_guide (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL,                -- terminology, formatting, voice, etc.
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    examples TEXT,                          -- JSON array of examples
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_campaign_settings_timestamp
AFTER UPDATE ON campaign_settings
BEGIN
    UPDATE campaign_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = 1;
END;

-- Insert default settings if none exist
INSERT OR IGNORE INTO campaign_settings (id, candidate_name, organization_name)
VALUES (1, 'Not Configured', 'Not Configured');
