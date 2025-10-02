# Sherrill Press Release Parsing Summary

## Overview
Successfully extended the press release parser to handle Sherrill campaign's format with ISO date timestamps and city-only datelines.

## Files Processed
5 press releases from Mikie Sherrill's New Jersey gubernatorial campaign:
1. `sherrill_01_trump_funding.txt` - Gateway Tunnel funding (254 words)
2. `sherrill_02_lt_gov_debate.txt` - Lt. Governor debate (183 words)
3. `sherrill_03_tax_returns.txt` - Tax returns transparency (298 words)
4. `sherrill_04_utility_emergency.txt` - Utility emergency declaration (1,356 words)
5. `sherrill_05_pcm_endorse.txt` - Campos-Medina endorsement (433 words)

## Format Characteristics
Sherrill releases have unique format:
```
[Headline]

Date: 2025-01-16T05:00:00.000Z

[Subheadline]

BLOOMFIELD — [Content...]
```

Key differences from standard format:
- ISO timestamp instead of formatted date
- City-only datelines without state abbreviation
- Subheadline between headline and dateline

## Parser Enhancements Made

### 1. ISO Date Pattern Recognition
**File:** `backend/utils/press-release-parser.js:16`
- Added regex pattern: `/^Date:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s*$/im`
- Recognizes ISO 8601 timestamp format

### 2. ISO Date Conversion Method
**File:** `backend/utils/press-release-parser.js:1009-1020`
```javascript
extractISODate(text) {
    const match = text.match(this.releasePatterns.iso_date);
    if (match) {
        const isoString = match[1];
        const date = new Date(isoString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    return null;
}
```
Converts: `2025-01-16T05:00:00.000Z` → `January 15, 2025`

### 3. Header Line Filtering
**File:** `backend/utils/press-release-parser.js:1000`
- Updated `isHeaderLine()` to skip ISO date lines
- Prevents ISO date from appearing in content

### 4. City-Only Dateline Support
**File:** `backend/utils/press-release-parser.js:1414-1438`
- Added pattern to match `CITY —` (without state)
- Minimum 4 characters to avoid false matches

### 5. Context-Based State Inference
**File:** `backend/utils/press-release-parser.js:61-110`

Two new methods:
- `inferStateFromContext(text)` - Detects state names in text
- `getStateAbbreviation(stateName)` - Converts full name to abbreviation

Detection patterns:
1. Direct state mentions: "New Jersey", "Virginia", etc.
2. Context patterns: "for Governor of [State]"
3. Office references: "[State] Governor", "[State] Senator"

When city-only dateline found, checks context for state mentions and appends abbreviation.

### 6. Content Cleaning
**File:** `backend/utils/press-release-parser.js:1453`
- Added ISO date to `safeRemovePatterns()` in paragraph extraction
- Prevents ISO date from becoming lead paragraph

### 7. Subheadline Detection
**File:** `backend/utils/press-release-parser.js:1069`
- Added ISO date line skip in `findSubhead()`
- Ensures actual subheadline is extracted, not ISO date

## Test Results

All 5 Sherrill releases parse successfully:

### Extraction Success Rates:
- ✅ Headlines: 5/5 (100%)
- ✅ Subheadlines: 4/5 (80% - file 5 has no subheadline)
- ✅ Dates: 5/5 (100% - all ISO dates converted)
- ✅ Locations: 5/5 (100% - all with ", NJ" appended)
- ✅ Dateline confidence: 5/5 high confidence
- ⚠️ Quotes: Variable quality (attribution needs improvement)

### Example Output:
```
Headline: While Trump Rips Away Funding, Jack Refuses To Stand Up For New Jersey — Again
Subheadline: Mikie is taking the fight to Trump, Jack's trying not to piss off his boss
Date: September 30, 2025
Location: BLOOMFIELD, NJ
Dateline confidence: high
```

## Remaining Issues

### Quote Attribution Quality
Many quotes lack speaker attribution:
- File 1: 4 quotes, 2 unknown speakers
- File 3: 4 quotes, 3 unknown speakers
- File 4: 13 quotes, 9 unknown speakers

**Cause:** Statement format not fully supported
- Pattern: "Mikie Sherrill released the following statement:" followed by quotes
- Implicit attribution not detected

### Subheadline in File 4
File 4 repeats headline as subheadline:
```
Headline: ICYMI: Mikie Sherrill To Declare A State of Emergency...
Subheadline: ICYMI: Mikie Sherrill To Declare A State of Emergency...
```
**Cause:** No distinct subheadline in source, parser defaults to headline

## Benefits of Context-Based Approach

Replacing hardcoded city list with context detection provides:

1. **Universal Support** - Works for any state's press releases
2. **No Maintenance** - No need to update city lists
3. **Intelligent** - Uses actual document content
4. **Accurate** - Only adds state when confident

Example context patterns detected:
- "New Jersey Governor"
- "running for Governor of New Jersey"
- "fix New Jersey's broken transit system"

## Files Modified

1. `backend/utils/press-release-parser.js` - Core parser enhancements
2. `test-sherrill-suite.js` - Test suite for validation

## Next Steps

To improve quote attribution:
1. Add statement format detection
2. Implement implicit quote attribution
3. Handle "released the following statement:" patterns
4. Track statement context across paragraphs
