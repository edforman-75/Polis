# Sherrill Parser Update - City-Only Dateline Support

## Date
October 1, 2025

## Summary
Extended parser to handle press releases with city-only datelines (no state abbreviation) in non-ISO date formats.

## Test Case
New press release: `sherrill_06_matching_funds.txt`
- Format: Multi-line date (NOV / 19 / 2024) followed by city-only dateline
- Date line: `WEST CALDWELL —`
- No state abbreviation in dateline

## Changes Made

### 1. Added City-Only Location Detection (lines 1503-1517)
**File:** `backend/utils/press-release-parser.js:1503-1517`

Added detection for city-only locations followed by em dash (—):
```javascript
// Also check for city-only locations (no state) followed by em dash
if (!result.location) {
    const cityOnlyMatch = firstLines.match(/\b([A-Z][A-Z\s]{3,}?)\s*[–—-]\s/);
    if (cityOnlyMatch) {
        const city = cityOnlyMatch[1].trim();
        const inferredState = this.inferStateFromContext(text);
        if (inferredState) {
            result.location = `${city}, ${inferredState}`;
        } else {
            result.location = city;
        }
        result.confidence = 'medium';
        result.issues.push('Location found but not in formal dateline format');
    }
}
```

### 2. Expanded Search Area (line 1484)
**File:** `backend/utils/press-release-parser.js:1484`

Changed from 5 to 8 lines to accommodate longer headers:
```javascript
// Before: const firstLines = text.split('\n').slice(0, 5).join(' ');
// After:
const firstLines = text.split('\n').slice(0, 8).join(' ');
```

**Reason:** Multi-line date formats (NOV / 19 / 2024 / PRESS RELEASE / Headline) push the dateline to line 6.

## Test Results

### New Release (sherrill_06_matching_funds.txt)
- ✅ Headline: Found correctly
- ✅ Date: NOV 19 2024
- ✅ Location: WEST CALDWELL, NJ (state inferred from context)
- ✅ Confidence: medium
- ✅ Quote attribution: Correct (Sean Higgins, spokesperson)

### Existing Releases (Regression Test)
All 5 ISO-format releases still parse with high confidence:
- ✅ sherrill_01_trump_funding.txt - BLOOMFIELD, NJ
- ✅ sherrill_02_lt_gov_debate.txt - UNION, NJ  
- ✅ sherrill_03_tax_returns.txt - BLOOMFIELD, NJ
- ✅ sherrill_04_utility_emergency.txt - BLOOMFIELD, NJ
- ✅ sherrill_05_pcm_endorse.txt - BLOOMFIELD, NJ

## Key Features

1. **Universal City Detection**: Works for any city in any state (not hardcoded)
2. **Context-Based State Inference**: Uses document content to infer state
3. **Format Flexibility**: Handles both ISO dates and conventional date formats
4. **Backward Compatible**: All existing releases continue to parse correctly

## Files Modified
- `backend/utils/press-release-parser.js` - Core extraction logic
- `cpo_examples/sherrill_06_matching_funds.txt` - New test case added

## Next Steps
To further improve parser:
1. Improve headline detection for releases with long subheadlines
2. Enhance quote attribution for statement-format releases
3. Filter out false positive quotes (like video titles in quotes)
