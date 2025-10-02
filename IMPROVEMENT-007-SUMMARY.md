# Improvement #007: Narrative Attribution Pattern

## Problem
Speech and event coverage press releases use narrative attribution where the speaker is introduced by pronoun with a "told" verb and colon:

**Pattern:** `She told students: "Quote"`

**Example (Hampton Convocation):**
```
Congresswoman Abigail Spanberger delivered the keynote address...
In her remarks, Spanberger emphasized themes of service.

She told students:

"Choose character over convenience; service over self-interest."
```

**Before Improvement #007:**
- Quote found: ✅
- Speaker attribution: ❌ (None)

## Analysis

### Narrative Attribution Format (General)
This is NOT release-specific. It's common in event coverage and speech reporting across campaigns:

**Common patterns:**
- "[Pronoun] told [audience]: 'quote'"
- "She told students:"
- "He told the crowd:"
- "Spanberger told attendees:"

### Why Existing Logic Failed
The parser looked for attribution patterns:
- After quote: `"quote," said Speaker` ❌
- Before quote: `Speaker said "quote"` ❌
- Pronoun after: `"quote," she said` ✅ (worked)

But narrative pattern is BEFORE the quote with:
- Pronoun subject ("She")
- Narrative verb ("told")
- Audience ("students")
- Colon introducing quote

### Additional Challenge: Pronoun Resolution
When pattern is `She told students:`, need to find who "She" refers to.

**Context analysis problem:**
Looking backward finds multiple capitalized names:
1. "Congresswoman Abigail Spanberger" ✅ (want this)
2. "Hampton University" ❌ (institution)
3. "Annual Opening Convocation" ❌ (event)

Must prioritize person names over institutions/events.

## Solution

Added narrative attribution detection with smart pronoun resolution:

### 1. Detect "told" pattern with colon (Line 218)
```javascript
const narrativePattern = /(she|he|they|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+told\s+[^:]+:\s*$/i;
```

### 2. Resolve pronoun to person name (Lines 221-262)
**Strategy:** Two-tier name matching

**Tier 1 (Preferred):** Title + Name pattern
- Searches for: "Congresswoman Abigail Spanberger", "Senator X", "Mayor Y"
- Most reliable indicator of person names
- Uses existing `titles` list

**Tier 2 (Fallback):** Capitalized multi-word names
- Filters out institutions: `/University|Institute|College|Convention|Convocation|Conference|Summit|Forum/i`
- Takes most recent remaining name

**Code (Lines 230-262):**
```javascript
// First try to find title + name pattern (most reliable for person names)
const titlesPattern = this.titles.map(t => t.replace(/\./g, '\\.')).join('|');
const titleNamePattern = new RegExp(`((?:${titlesPattern})\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'gi');
const titleNames = [];
let titleMatch;
while ((titleMatch = titleNamePattern.exec(contextWindow)) !== null) {
    titleNames.push(titleMatch[1]);
}

if (titleNames.length > 0) {
    // Found title+name, use the last one
    const fullName = titleNames[titleNames.length - 1];
    speaker_name = this.extractSpeakerName(fullName, text) || fullName;
    speaker_title = this.extractSpeakerTitle(fullName, text);
    attribution = fullName;
} else {
    // Fallback: look for any capitalized multi-word name
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    const names = [];
    let nameMatch;
    while ((nameMatch = namePattern.exec(contextWindow)) !== null) {
        // Filter out likely non-person names
        const name = nameMatch[1];
        if (!/University|Institute|College|Convention|Convocation|Conference|Summit|Forum/i.test(name)) {
            names.push(name);
        }
    }
    if (names.length > 0) {
        speaker_name = names[names.length - 1];
        speaker_title = this.extractSpeakerTitle(speaker_name, text);
        attribution = speaker_name;
    }
}
```

### 3. Also added "told" to pronoun pattern (Line 188)
Extended existing post-quote pronoun handling:
- Before: `"quote," she said` ✅
- After: `"quote," she told reporters` ✅

## Testing Results

### Hampton Convocation Test
**Before:**
- Quote count: 1/1 ✅
- Speaker attribution: 0/1 ❌
- Status: ❌ FAILED

**After:**
- Quote count: 1/1 ✅
- Speaker attribution: 1/1 ✅ (Abigail, Congresswoman)
- Status: ✅ PASS

### Spanberger Suite (4 releases)
**Before Improvement #007:**
- Passed: 2/4 (50%)
- Quote attribution: 7/9 (77.8%)

**After Improvement #007:**
- Passed: 3/4 (75%)
- Quote attribution: 8/9 (88.9%)

### Regression Testing
**Jane Smith Regression:**
- 2/2 tests passed ✅
- No regressions

**Hybrid Releases:**
- 25/25 releases parsed ✅
- 100% quote attribution maintained
- No regressions

## Impact

**Narrative attribution releases:**
- Before: 0% quote attribution
- After: 100% quote attribution

**General pattern recognition:**
- Handles speech/event coverage format
- Smart pronoun resolution prefers person names
- Filters out institutions/events automatically

## Key Design Principles

1. **General Pattern Matching** - Matches common event coverage conventions, not specific releases
2. **Prioritized Name Matching** - Title+name pattern is more reliable than generic capitalized names
3. **Institution Filtering** - Excludes "University", "Conference", etc. to avoid false matches
4. **Layered Fallbacks** - Tries title+name first, falls back to filtered generic names
5. **Backward Compatibility** - Doesn't interfere with existing attribution methods

## Code Locations

- **Narrative pattern detection:** Lines 216-268
- **Pronoun pattern extension:** Line 188 (`told` added to verb list)
- **Smart name resolution:** Lines 227-262

## Deployment Status

- ✅ Implemented in parser
- ✅ Tested on real-world example (Hampton Convocation)
- ✅ Regression tests passed (Jane Smith, Hybrid)
- ✅ Ready for production

## Remaining Issues

**Housing Data Release** still has 1 unattributed quote:
- Quote 1: `"four out of 10 people who are renting..."` - This is quoted data/statistics from a report (RadioIQ/WVTF), not a person speaking
- Quote 2: Correctly attributed to Connor Joseph ✅

**Decision needed:** Should quoted data/statistics be extracted as "quotes" or filtered out? This is a design question about what constitutes a "quote" for campaign messaging purposes.
