# Press Release Parser - Test Results

## Test Date: 2025-10-01

## Summary
Tested parser with 2 sample press releases (Detroit economy, Healthcare). Found 3 critical bugs that prevent correct quote extraction.

---

## ✅ What's Working

1. **Headline Extraction** - Works correctly
   - Detroit: "Detroit Secures $800 Million Battery Plant, Creating 2,500 Good-Paying Jobs" ✓
   - Healthcare: "Governor Smith Unveils Plan to Expand Healthcare Access to 150,000 Uninsured Residents" ✓

2. **Dateline Extraction** - Works with generic patterns (no hardcoded cities)
   - Detroit: "DETROIT, MI - October 1, 2025" ✓
   - Healthcare: "BOSTON, MA - October 1, 2025" ✓

3. **Lead Paragraph** - Correctly includes dateline
   - Detroit: "DETROIT, MI - October 1, 2025 - Mayor James Wilson announced..." ✓

4. **Quote Text Extraction** - Finds text between quotation marks
   - All 6 quote segments found correctly

5. **Corporate Title Enhancement** - Extracts company name
   - "ElectricFuture CEO" → "CEO of ElectricFuture" ✓

6. **Government Title Enhancement** - Adds location from dateline
   - "Mayor Wilson" → "Mayor of Detroit" ✓

---

## ❌ Critical Bugs

### Bug 1: Multi-Part Quotes Not Being Combined

**Expected Behavior:**
Quote with `,"` pattern should be combined with next quote until `."` is found.

**Actual Behavior:**
Each quote segment is treated separately.

**Example:**
```
INPUT TEXT:
"This is exactly the kind of good-paying, advanced manufacturing jobs Detroit needs," said Mayor Wilson at the groundbreaking ceremony. "Our city is leading the electric vehicle revolution."

EXPECTED OUTPUT (1 quote):
Quote 1:
  Text: This is exactly the kind of good-paying, advanced manufacturing jobs Detroit needs, Our city is leading the electric vehicle revolution.
  Speaker: James Wilson
  Title: Mayor of Detroit

ACTUAL OUTPUT (2 quotes):
Quote 1:
  Text: This is exactly the kind of good-paying, advanced manufacturing jobs Detroit needs,
  Speaker: James Wilson
  Title: Mayor of Detroit

Quote 2:
  Text: Our city is leading the electric vehicle revolution.
  Speaker: (empty)
  Title: (empty)
  Attribution: Unknown Speaker
```

**Root Cause:**
The `extractQuotes()` method detects `isMultiPart` and `isEnd` flags, but the combining logic in lines 245-271 isn't working correctly.

**Impact:** HIGH - Quotes are split incorrectly, losing context and speaker attribution for continuation quotes.

---

### Bug 2: Corporate Speaker Name Extraction Broken

**Expected Behavior:**
For "ElectricFuture CEO Jennifer Martinez", extract "Jennifer Martinez" as speaker name.

**Actual Behavior:**
Extracts "Electric" as speaker name.

**Example:**
```
INPUT TEXT:
"Detroit's skilled workforce and strategic location make it the perfect home for our expansion," said ElectricFuture CEO Jennifer Martinez.

EXPECTED OUTPUT:
Speaker: Jennifer Martinez

ACTUAL OUTPUT:
Speaker: Electric
```

**Root Cause:**
The `extractSpeakerName()` method searches for "FirstName LastName" patterns. It's finding "Electric Future" and matching "Electric" as a first name before realizing "ElectricFuture" is one word.

**Location:** `backend/utils/press-release-parser.js:326-349`

**Impact:** HIGH - Corporate speaker names are completely wrong.

---

### Bug 3: Governor Location Using City Instead of State

**Expected Behavior:**
For Governor titles, use STATE from dateline, not city.

**Actual Behavior:**
Uses city from dateline.

**Example:**
```
INPUT TEXT:
Dateline: BOSTON, MA - October 1, 2025
Attribution: Governor Smith

EXPECTED OUTPUT:
Title: Governor of Massachusetts

ACTUAL OUTPUT:
Title: Governor of Boston
```

**Root Cause:**
The `extractSpeakerTitle()` method at lines 420-426 extracts the entire location from dateline (e.g., "BOSTON, MA") and converts only the first part to title case ("Boston"). For Governors, it should extract the state abbreviation and expand it.

**Impact:** MEDIUM - Inaccurate but contextually understandable. However, "Governor of Boston" is factually wrong.

---

## 🔧 Recommended Fixes

### Fix #1: Multi-Part Quote Combining

Check the combining logic at lines 245-271. The flags are being set correctly:
```javascript
const isMultiPartQuote = (charAfterQuote === ','); // ," means more quotes coming
const isEndOfQuote = (charAfterQuote === '.'); // ." means end of quote sequence
```

But the loop that combines them might not be properly:
1. Checking if consecutive quotes have the same speaker
2. Accumulating quote text correctly
3. Preserving speaker/title from first quote

**Suggested approach:**
- Group consecutive quotes by position
- If quotes are within 200 characters of each other AND previous quote has `isMultiPart=true`, combine them
- Stop combining when finding a quote with `isEnd=true`

### Fix #2: Corporate Speaker Name Extraction

Add special handling before the name search:
1. Check if attribution contains "CompanyName Title Name" pattern
2. Extract company name (single capitalized word before title)
3. Extract person name after title
4. Don't use generic "FirstName LastName" search for corporate titles

**Example code:**
```javascript
// Check for company title pattern: "ElectricFuture CEO Jennifer Martinez"
const corpPattern = /([A-Z][a-zA-Z]+)\s+(CEO|CFO|CTO|President|etc\.)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/;
const corpMatch = attribution.match(corpPattern);
if (corpMatch) {
    return corpMatch[3]; // Return "Jennifer Martinez"
}
```

### Fix #3: Governor Location

For Governor/Lt. Governor titles:
1. Extract state abbreviation from dateline location (e.g., "MA" from "BOSTON, MA")
2. Expand abbreviation to full state name ("Massachusetts")
3. Return "Governor of Massachusetts"

**State abbreviation map needed:**
```javascript
const stateMap = {
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'CA': 'California',
    'NY': 'New York',
    // ... all 50 states
};
```

---

## Test Coverage Needed

Current testing: 2 samples, manual inspection

**Recommended:**
1. Create automated test suite with 10+ press releases
2. Test cases for:
   - Single quotes
   - Multi-part quotes (2, 3, 4 segments)
   - Multiple speakers in one release
   - Corporate vs government titles
   - Different dateline formats
   - Press releases without quotes
3. Add regression tests when bugs are fixed

---

## Next Steps

1. Fix Bug #1 (multi-part quotes) - HIGHEST PRIORITY
2. Fix Bug #2 (corporate names) - HIGH PRIORITY
3. Fix Bug #3 (governor location) - MEDIUM PRIORITY
4. Add automated test suite
5. Add logging to parser for debugging
6. Store corrections from UI for training data
