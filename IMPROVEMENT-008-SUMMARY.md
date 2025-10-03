# Improvement 008: Automatic Subtype and Issue Detection (Type-Specific)

**Date:** 2025-10-02
**Status:** ✅ Completed
**Updated:** 2025-10-02 - Made subtypes type-specific

## Overview

Implemented automatic detection of press release **subtypes** and **issues/topics** based on pattern matching trained from real press releases. This enhancement builds upon the existing type detection (STATEMENT, NEWS_RELEASE, etc.) to provide richer metadata for classification and analysis.

**Key Feature:** Subtypes are **type-specific** - different release types have different available subtypes. For example, STATEMENT types get "condemnation" and "policy_position" while NEWS_RELEASE types get "campaign_announcement" and "endorsement".

## Problem Statement

The parser could detect basic types (STATEMENT, NEWS_RELEASE, MEDIA_ADVISORY, etc.) but lacked the ability to:
1. Detect **subtypes** (e.g., endorsement, campaign announcement, response to opposition)
2. Detect **issues/topics** (e.g., healthcare, infrastructure, israel_palestine)

The user wanted to build a training dataset by manually tagging press releases, then use those patterns to automatically detect subtypes and issues in future releases.

## Solution

### 1. Training Data Analysis

Analyzed 17 real press releases (excluding 50 synthetic files) to identify common patterns:

**Press Releases Analyzed:**
- AOC releases: `aoc_01_kirk.txt`, `aoc_02_israel.txt`, `aoc_03_healthy_start.txt`
- Porter releases: `porter_01_launch.txt`, `porter_02_momentum.txt`, `porter_03_poll.txt`, `porter_04_min_endorsement.txt`
- Sherrill releases: `sherrill_01_trump_funding.txt` through `sherrill_07_gateway_trump.txt`
- Warren releases: `warren_01_shutdown.txt`, `warren_02_crypto.txt`, `warren_03_social_security.txt`

### 2. Pattern Extraction

**Subtype Patterns Identified:**

1. **campaign_announcement**: "announced candidacy", "launches campaign", "running for"
2. **endorsement**: "endorses", "endorsement", "support in this race"
3. **response_opposition**: "responds to", "criticizes", "refuses to stand up", "while [Opponent] does X"
4. **policy_announcement**: "introduces", "legislation", "bill", "act"
5. **legislative_action**: "hearing", "questioned witnesses", "Senate floor", "press conference"
6. **funding_announcement**: "secures funding", "federal funding", "grants"
7. **personnel_announcement**: "appoints", "names", "joins campaign"

**Issue Patterns Identified:**

- **healthcare**: "health care", "medical", "coverage", "Affordable Care Act"
- **infrastructure**: "infrastructure", "gateway", "transit", "roads", "bridges"
- **israel_palestine**: "Israel", "Gaza", "Palestine", "Block the Bombs"
- **cryptocurrency**: "crypto", "bitcoin", "digital assets"
- **government_shutdown**: "government shutdown", "keep the government open"
- **taxes**: "tax", "taxation", "IRS"
- **elections**: "campaign", "election", "voter", "ballot"
- **civil_rights**: "Civil Rights Act", "discrimination", "voting rights"
- **free_speech**: "free speech", "First Amendment", "censorship"
- **political_violence**: "political violence", "assassination", "murder"
- **foreign_policy**: "foreign policy", "international", "diplomatic"
- **education**: "education", "school", "student", "teacher"
- **climate**: "climate", "clean energy", "renewable"
- **immigration**: "immigration", "border", "DACA"
- **economy**: "economy", "jobs", "employment", "inflation"
- **housing**: "housing", "affordable housing", "homelessness"
- **criminal_justice**: "criminal justice", "police", "incarceration"
- **gun_control**: "gun", "firearm", "Second Amendment"
- **abortion**: "abortion", "reproductive", "Roe v. Wade"
- **opponent_record**: mentions of "Trump" or "opponent" with "record", "failed", "refuses"

### 3. Implementation

**Files Modified:**
- `/Users/edf/campaign-ai-editor/backend/utils/press-release-parser.js`

**New Methods Added:**

```javascript
detectSubtypes(text) {
    // Returns array of detected subtypes with confidence scores
    // Example: [
    //   { subtype: 'endorsement', confidence: 'high', keywords: [...] },
    //   { subtype: 'response_opposition', confidence: 'medium', keywords: [...] }
    // ]
}

detectIssues(text) {
    // Returns array of detected issues with confidence scores
    // Example: [
    //   { issue: 'healthcare', confidence: 'high' },
    //   { issue: 'infrastructure', confidence: 'high' }
    // ]
}
```

**Integration with parse():**

Updated `parse()` method to include subtype and issue detection:

```javascript
parse(pressReleaseText) {
    const text = pressReleaseText.trim();

    const release_type = this.detectReleaseType(text);
    const subtypes = this.detectSubtypes(text);      // NEW
    const issues = this.detectIssues(text);          // NEW

    return {
        release_info: this.extractReleaseInfo(text),
        release_type: release_type,
        subtypes: subtypes,      // NEW
        issues: issues,          // NEW
        content_structure: this.extractContentStructure(text),
        // ... rest of fields
    };
}
```

### 4. Testing

**Test Script:** `test-enhanced-detection.js`

Tests the enhanced detection (type + subtype + issue) on 17 real press releases.

**Results:**

```
Type Detection:
- 2 STATEMENT (11.8%)
- 15 NEWS_RELEASE (88.2%)
- 0 UNKNOWN (100% detection rate!)

Subtype Detection:
- response_opposition: 7 occurrences
- legislative_action: 5 occurrences
- general: 4 occurrences
- personnel_announcement: 3 occurrences
- campaign_announcement: 3 occurrences
- endorsement: 3 occurrences

Issue Detection:
- elections: 10 occurrences
- opponent_record: 7 occurrences
- healthcare: 6 occurrences
- infrastructure: 4 occurrences
- political_violence: 3 occurrences
- education: 3 occurrences
- taxes: 3 occurrences
- economy: 3 occurrences
- (and 10 more issues with 1-2 occurrences each)
```

**Success Rate:**
- **76%** of files have specific subtypes detected (13/17)
- **88%** of files have specific issues detected (15/17)

## Example Output

**Input:** `porter_04_min_endorsement.txt`

**Output:**
```javascript
{
    release_type: { type: 'NEWS_RELEASE', confidence: 'high', score: 10 },
    subtypes: [
        { subtype: 'endorsement', confidence: 'high', keywords: ['endorses', 'endorsement'] },
        { subtype: 'response_opposition', confidence: 'medium', keywords: ['attacks', 'Trump'] }
    ],
    issues: [
        { issue: 'healthcare', confidence: 'high' },
        { issue: 'elections', confidence: 'medium' },
        { issue: 'housing', confidence: 'high' },
        { issue: 'opponent_record', confidence: 'medium' }
    ],
    // ... rest of parsed data
}
```

## Type-Specific Subtypes

**STATEMENT subtypes:**
- response_statement - Responding to events/opposition
- condemnation - Condemning/opposing actions
- support_statement - Praising/supporting
- policy_position - Stating position on issues

**NEWS_RELEASE subtypes:**
- campaign_announcement - Announcing candidacy
- endorsement - Endorsing candidates/legislation
- response_opposition - Attacking/responding to opponents
- policy_announcement - Introducing legislation
- legislative_action - Hearings, floor speeches
- funding_announcement - Securing grants/funding
- personnel_announcement - Appointments, hires
- poll_results - Poll/survey results

**MEDIA_ADVISORY subtypes:**
- press_conference
- photo_opportunity
- interview_availability
- event_announcement

**LETTER subtypes:**
- call_to_action
- inquiry_letter

**TRANSCRIPT subtypes:**
- debate_transcript
- interview_transcript
- speech_transcript

## Benefits

1. **Type-Specific Subtypes**: Only relevant subtypes shown based on detected type
2. **Richer Metadata**: Provides multi-dimensional classification (type + subtype + issues)
3. **Multi-label Support**: Releases can have multiple subtypes and multiple issues
4. **Confidence Scoring**: Each detection includes confidence level (high/medium/low)
5. **Training Dataset Foundation**: Pattern-based approach can be refined with more training data
6. **Non-breaking Change**: Adds new fields without modifying existing functionality
7. **Dynamic UI**: Verification interface updates subtype options when type changes

## Files Changed

1. `/Users/edf/campaign-ai-editor/backend/utils/press-release-parser.js`
   - Modified `detectSubtypes()` to accept `releaseType` parameter and return type-specific subtypes (lines 410-524)
   - Added `detectIssues()` method (lines 527-632)
   - Updated `parse()` method to pass type to detectSubtypes (line 122)

2. `/Users/edf/campaign-ai-editor/public/type-verification.html`
   - Added `subtypesByType` configuration object (lines 465-504)
   - Added `updateSubtypeOptions()` function to dynamically update dropdown (lines 552-571)
   - Added event listener for type selection change (lines 854-859)
   - Updated loadFile to call updateSubtypeOptions (lines 728, 737)

## Files Added

1. `/Users/edf/campaign-ai-editor/test-enhanced-detection.js` - Test script
2. `/Users/edf/campaign-ai-editor/enhanced-detection-results.json` - Test results

## Next Steps

1. **Human Verification**: User can manually verify detected subtypes/issues in the web interface
2. **Pattern Refinement**: Use human corrections to refine detection patterns
3. **Database Storage**: Store verified subtypes/issues in `type_verifications` table
4. **Machine Learning**: Eventually replace pattern matching with ML model trained on verified data

## Related Files

- Database schema: `/Users/edf/campaign-ai-editor/backend/data/assignments-schema.sql`
- Verification interface: `/Users/edf/campaign-ai-editor/public/type-verification.html`
- Type detection test: `/Users/edf/campaign-ai-editor/test-real-releases.js`

## Technical Notes

- Detection uses **case-insensitive regex pattern matching**
- Patterns are based on **keyword/phrase analysis** of real press releases
- Multiple subtypes/issues can be detected per release
- **Fallback behavior**: If no patterns match, returns `[{ subtype: 'general', confidence: 'low' }]`
- **Confidence levels**:
  - `high`: Strong keyword matches (e.g., "endorses", "legislation")
  - `medium`: Contextual matches (e.g., "attacks" + "Trump")
  - `low`: No specific pattern matched (fallback)
