# Fact-Checking Database Schema

## Overview

The fact-checking system uses five interconnected tables to track the complete lifecycle from claim extraction through verification and source documentation.

---

## Table Relationships

```
fact_checks (1)
    ↓
    └── extracted_claims (N)
            ↓
            └── claim_verifications (N)
                    ↓
                    └── verification_sources (N)

claim_types (reference table)
```

---

## Tables

### 1. fact_checks

Main table storing fact-check records.

**Schema:**
```sql
CREATE TABLE fact_checks (
    id TEXT PRIMARY KEY,                    -- e.g., "FC-2025-001234"
    assignment_id TEXT,
    source_assignment_id TEXT,
    content TEXT NOT NULL,                  -- Text being fact-checked
    claims_to_verify TEXT,                  -- JSON array of claim texts
    verified_claims TEXT,                   -- JSON array of verified claims
    disputed_claims TEXT,                   -- JSON array of disputed claims
    sources TEXT,                           -- JSON array of source URLs
    overall_rating TEXT,                    -- Overall fact-check rating
    status TEXT DEFAULT 'pending',
    assigned_to INTEGER,
    created_by INTEGER,
    completed_by INTEGER,
    fact_checker_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (source_assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);
```

**Status Values:**
- `pending` - Initial creation
- `extracting_claims` - AI extraction in progress
- `in_progress` - Assigned and being worked on
- `completed` - All claims verified
- `published` - Results published

**Example Record:**
```json
{
  "id": "FC-2025-001234",
  "content": "According to FBI statistics, crime has decreased by 15%...",
  "status": "in_progress",
  "created_by": 10,
  "assigned_to": 11,
  "created_at": "2025-10-02T12:00:00Z"
}
```

---

### 2. extracted_claims

Individual claims extracted from fact-check content.

**Schema:**
```sql
CREATE TABLE extracted_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fact_check_id TEXT NOT NULL,
    claim_text TEXT NOT NULL,
    claim_type TEXT,                        -- direct_factual, hearsay, etc.
    sentence_index INTEGER,                 -- Position in original text
    span_start INTEGER,                     -- Character offset start
    span_end INTEGER,                       -- Character offset end
    verifiable BOOLEAN DEFAULT 1,
    verification_type TEXT,                 -- standard, two-step, etc.
    confidence_score REAL,                  -- 0.0 to 1.0
    patterns_matched TEXT,                  -- JSON array of patterns
    deniability_score REAL,                 -- For plausible deniability
    hearsay_confidence REAL,                -- For hearsay detection
    private_data_detected BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fact_check_id) REFERENCES fact_checks(id) ON DELETE CASCADE
);
```

**Claim Types:**
- `direct_factual` - Standard verifiable claim
- `private_data` - Unverifiable (private sources)
- `hearsay` - Reported speech
- `plausible_deniability` - Deniable framing

**Verification Types:**
- `standard` - Check against public sources
- `two-step` - Verify attribution + content
- `extract-underlying-claim` - Extract then verify
- `unverifiable` - Cannot be verified

**Status Values:**
- `pending` - Awaiting verification
- `in_progress` - Being verified
- `verified` - Verification complete (true/false/mixed)
- `disputed` - Conflicting evidence
- `flagged` - Needs special attention

**Example Record:**
```json
{
  "id": 1,
  "fact_check_id": "FC-2025-001234",
  "claim_text": "According to FBI statistics, crime has decreased by 15%",
  "claim_type": "direct_factual",
  "verifiable": true,
  "verification_type": "standard",
  "confidence_score": 0.95,
  "status": "verified"
}
```

---

### 3. claim_verifications

Verification attempts and results for claims.

**Schema:**
```sql
CREATE TABLE claim_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL,
    verification_status TEXT DEFAULT 'pending',
    rating TEXT,                            -- true, mostly_true, etc.
    credibility_score REAL,                 -- Overall source credibility
    sources_found TEXT,                     -- JSON array of URLs
    verification_method TEXT,               -- manual, automated, etc.
    verification_notes TEXT,
    verified_by INTEGER,
    verified_at DATETIME,
    time_spent_seconds INTEGER,             -- Time spent verifying
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES extracted_claims(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id)
);
```

**Verification Status:**
- `pending` - Not yet verified
- `in_progress` - Being verified
- `verified_true` - Confirmed as true
- `verified_mostly_true` - Mostly accurate
- `verified_mixed` - Partially true/false
- `verified_mostly_false` - Mostly inaccurate
- `verified_false` - Confirmed as false
- `unverifiable` - Cannot verify

**Rating Values:**
- `true` - Completely accurate
- `mostly_true` - Minor inaccuracies
- `mixed` - Partially true, partially false
- `mostly_false` - Core claim inaccurate
- `false` - Completely inaccurate
- `unverifiable` - Cannot be determined

**Example Record:**
```json
{
  "id": 1,
  "claim_id": 2,
  "verification_status": "verified_true",
  "rating": "true",
  "verification_notes": "Confirmed via FBI UCR data",
  "verified_by": 11,
  "verified_at": "2025-10-02T12:30:00Z",
  "time_spent_seconds": 420
}
```

---

### 4. verification_sources

Sources used to verify claims.

**Schema:**
```sql
CREATE TABLE verification_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verification_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    domain TEXT,                            -- e.g., "fbi.gov"
    title TEXT,
    credibility_tier TEXT,                  -- federal_government, etc.
    credibility_score REAL,                 -- 0.0 to 1.0
    supports_claim BOOLEAN,                 -- Does source support claim?
    relevance_score REAL,                   -- How relevant (0.0 to 1.0)
    excerpt TEXT,                           -- Relevant quote from source
    date_published DATETIME,
    date_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (verification_id) REFERENCES claim_verifications(id) ON DELETE CASCADE
);
```

**Credibility Tiers:**
- `federal_government` - 1.0 (congress.gov, fbi.gov, cdc.gov)
- `fact_checkers` - 0.9 (factcheck.org, politifact.com)
- `research_institutions` - 0.85 (brookings.edu, pewresearch.org)
- `national_news` - 0.75 (nytimes.com, washingtonpost.com)
- `regional_news` - 0.65 (local newspapers)
- `blogs_opinion` - 0.3 (personal blogs)
- `unknown` - 0.5 (default)

**See:** `tier1_sources.json` for complete domain mappings

**Example Record:**
```json
{
  "id": 1,
  "verification_id": 1,
  "url": "https://ucr.fbi.gov/crime-in-the-u.s/2024/preliminary",
  "domain": "fbi.gov",
  "title": "FBI Uniform Crime Report 2024 Preliminary Data",
  "credibility_tier": "federal_government",
  "credibility_score": 1.0,
  "supports_claim": true,
  "relevance_score": 0.95,
  "excerpt": "Crime decreased 15.2% in District 12..."
}
```

---

### 5. claim_types

Reference table defining claim types and verification approaches.

**Schema:**
```sql
CREATE TABLE claim_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT UNIQUE NOT NULL,
    verification_approach TEXT NOT NULL,
    description TEXT,
    requires_sources BOOLEAN DEFAULT 1,
    typical_verification_time INTEGER,      -- Seconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Seeded Data:**
```sql
INSERT INTO claim_types VALUES
(1, 'direct_factual', 'standard',
 'Direct factual claims that can be verified against public sources',
 1, 300),
(2, 'private_data', 'unverifiable',
 'Claims based on private data not accessible to independent verification',
 0, 60),
(3, 'hearsay', 'two-step',
 'Reported speech requiring verification of both attribution and underlying claim',
 1, 600),
(4, 'plausible_deniability', 'extract-underlying-claim',
 'Claims made with deniability techniques that obscure direct assertion',
 1, 450);
```

---

## Indexes

For optimal query performance:

```sql
-- Fast lookups by fact-check ID
CREATE INDEX idx_claims_factcheck ON extracted_claims(fact_check_id);

-- Fast lookups by claim ID
CREATE INDEX idx_verifications_claim ON claim_verifications(claim_id);

-- Fast lookups by verification ID
CREATE INDEX idx_sources_verification ON verification_sources(verification_id);

-- Fast filtering by status
CREATE INDEX idx_claims_status ON extracted_claims(status);
CREATE INDEX idx_factchecks_status ON fact_checks(status);

-- Fast filtering by claim type
CREATE INDEX idx_claims_type ON extracted_claims(claim_type);

-- Fast lookups by domain
CREATE INDEX idx_sources_domain ON verification_sources(domain);
```

---

## Common Queries

### Get fact-check with all claims and verifications

```sql
SELECT
  fc.*,
  ec.id as claim_id,
  ec.claim_text,
  ec.claim_type,
  ec.status as claim_status,
  cv.rating,
  cv.verification_status
FROM fact_checks fc
LEFT JOIN extracted_claims ec ON fc.id = ec.fact_check_id
LEFT JOIN claim_verifications cv ON ec.id = cv.claim_id
WHERE fc.id = ?
ORDER BY ec.sentence_index;
```

### Get all pending claims needing verification

```sql
SELECT
  ec.*,
  fc.content as source_content,
  fc.created_by as fact_check_creator
FROM extracted_claims ec
JOIN fact_checks fc ON ec.fact_check_id = fc.id
WHERE ec.status = 'pending'
  AND ec.verifiable = 1
ORDER BY ec.priority DESC, ec.created_at ASC;
```

### Get verification statistics

```sql
SELECT
  claim_type,
  COUNT(*) as total_claims,
  SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
  AVG(CASE
    WHEN cv.time_spent_seconds IS NOT NULL
    THEN cv.time_spent_seconds
  END) as avg_verification_time
FROM extracted_claims ec
LEFT JOIN claim_verifications cv ON ec.id = cv.claim_id
GROUP BY claim_type;
```

### Get sources by credibility tier

```sql
SELECT
  credibility_tier,
  COUNT(*) as source_count,
  AVG(credibility_score) as avg_score,
  SUM(CASE WHEN supports_claim = 1 THEN 1 ELSE 0 END) as supporting,
  SUM(CASE WHEN supports_claim = 0 THEN 1 ELSE 0 END) as disputing
FROM verification_sources
GROUP BY credibility_tier
ORDER BY avg_score DESC;
```

---

## Data Integrity

### Cascade Deletes

When a fact-check is deleted, all related records are automatically removed:
- Delete `fact_check` → Deletes all `extracted_claims`
- Delete `extracted_claim` → Deletes all `claim_verifications`
- Delete `claim_verification` → Deletes all `verification_sources`

### Foreign Key Constraints

All foreign keys are enforced:
- Claims must reference valid fact-checks
- Verifications must reference valid claims
- Sources must reference valid verifications
- User references checked for assigned_to, created_by, verified_by

---

## Sample Data

The database is seeded with example data:

**Fact-Checks:**
- FC-2025-001: Crime statistics claim (in_progress)
- FC-2025-002: Election integrity claim (pending)

**Claims:** 4 extracted claims covering all claim types

**Verifications:** 1 completed verification with FBI source

**Sources:** 1 federal government source (fbi.gov)

---

## Backup and Maintenance

### Backup

```bash
sqlite3 campaign.db ".backup fact_checks_backup.db"
```

### Vacuum (optimize database)

```bash
sqlite3 campaign.db "VACUUM;"
```

### Check integrity

```bash
sqlite3 campaign.db "PRAGMA integrity_check;"
```

---

## Migration Notes

Tables created in `backend/database/init.js` during server initialization.

New tables added in this fact-checking system:
- `extracted_claims`
- `claim_verifications`
- `verification_sources`
- `claim_types`

Existing table used:
- `fact_checks` (already existed)

---

## Related Documentation

- **User Guide:** [FACT_CHECKING_GUIDE.md](./FACT_CHECKING_GUIDE.md)
- **API Documentation:** [FACT_CHECKING_API.md](./FACT_CHECKING_API.md)
- **Main Schema:** [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)

---

**Last Updated:** October 2, 2025
