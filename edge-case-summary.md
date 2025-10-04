# Press Release Parser - Edge Case Analysis Summary

**Analysis Date:** 2025-10-04
**Files Analyzed:** 14 Spanberger campaign press releases
**Total Issues Found:** 26

---

## ✅ WORKING CORRECTLY

### Datelines (14/14 = 100%)
All datelines extracted successfully after fixing field name bug:
- `extractDatelineEnhanced()` returns object with `{location, date, full}`
- Analysis script needed to use `.full` property instead of wrong field name
- Handles multiple formats:
  - "RICHMOND, Va — Oct 03, 2025"
  - "MECHANICSVILLE, Va. — May 21, 2025"
  - "Oct 02, 2025" (date-only format)

**Key Learning:** Always verify field names match between parser output and consuming code.

---

## ❌ ISSUES FOUND

### 1. Headlines with Hyphens (4 files) - FALSE POSITIVES

**Files affected:**
- spanberger_03_abortion_ad.txt
- spanberger_07_msnbc_appearance.txt
- spanberger_10_abortion_ad.txt
- spanberger_13_trump_tax_ad.txt

**Pattern:** All contain "Earle-Sears" (hyphenated last name)

**Example:** `"NEW TV AD: Winsome Earle-Sears Supports An Abortion Ban..."`

**Why flagged:** Analysis script checks for headlines containing hyphens without spaces around them

**Resolution:** These are CORRECT headlines. The hyphen in "Earle-Sears" is legitimate.

**Action needed:** Update validation logic to ignore hyphens within names

---

### 2. Unknown Quote Speakers (21 quotes across 10 files) - REAL ISSUE

#### 2A. Quoted Names/Titles/Phrases (Not Actual Speech)

**Pattern:** Proper names, rankings, or plan titles in quotes within narrative text

**Examples:**

1. **File:** spanberger_01_mass_firings.txt
   **Quote:** `"America's Top State for Business."`
   **Context:** `Virginia recently lost its CNBC ranking as "America's Top State for Business."`
   **Issue:** This is a ranking title, not a spoken quote

2. **File:** spanberger_02_jobs_economy.txt
   **Quote:** `"America's Top State for Business"`
   **Context:** `Virginia recently lost its CNBC ranking as "America's Top State for Business"`
   **Issue:** Same ranking title

3. **File:** spanberger_01_mass_firings.txt
   **Quote:** `"Growing Virginia Plan"`
   **Context:** `Spanberger has announced her "Growing Virginia Plan" focused on...`
   **Issue:** This is a plan name, not speech

4. **File:** spanberger_13_trump_tax_ad.txt
   **Quote:** `"Affordable Virginia Plan"`
   **Context:** Similar to above - plan name in narrative

**Current filters:** We have patterns for `announced her 'Plan'` but may need:
- Pattern for `ranking as "Title"`
- Pattern for `lost its "Name"`
- Pattern for `her "Plan Name"`

**Action needed:** Expand narrative quote filters to catch:
```javascript
// Add these patterns:
/(?:ranking|title|designation|status|position)\s+(?:as|of)\s+["']/i
/(?:lost|gained|earned|maintained|holds?)\s+(?:its|their|the)\s+.*?["']/i
```

---

#### 2B. Continuation Quotes (Same Speaker, Multiple Paragraphs)

**Pattern:** When one speaker has multiple consecutive quoted paragraphs, often only the first has attribution

**Example:**

**File:** spanberger_06_one_month_election.txt

**Paragraph 1 (HAS attribution):**
```
"Virginians want a Governor who puts them first. As I travel across the Commonwealth,
I continue to hear from Virginians who are working harder than ever, but are still
worried about making ends meet..." said Spanberger.
```

**Paragraph 2 (NO attribution - CONTINUATION):**
```
"This November — and while polls are open early, Virginians have an opportunity to
make their voices heard..."
```

**Issue:** Parser doesn't track previous speaker for continuation quotes

**Action needed:** Implement speaker tracking:
1. After each quote with attribution, store the speaker
2. For quotes without attribution, check if they immediately follow a quote
3. If yes, assign the same speaker
4. Reset speaker tracking when non-quote content appears

**Pseudocode:**
```javascript
let lastSpeaker = null;
let lastQuotePosition = -1;

for each quote:
    if (quote.has_attribution):
        quote.speaker = extract_attribution()
        lastSpeaker = quote.speaker
        lastQuotePosition = quote.position
    else if (!quote.speaker && lastSpeaker && quote.position == lastQuotePosition + 1):
        quote.speaker = lastSpeaker  // Continuation quote
        lastQuotePosition = quote.position
    else:
        lastSpeaker = null  // Reset if non-consecutive
```

---

#### 2C. Endorsement Quote Attribution

**Pattern:** Quotes from endorsement releases where speaker is named in context but not in traditional attribution

**Examples:**

**File:** spanberger_11_fire_fighters_endorsement.txt

**Quote 1:** `"We are pleased to endorse Abigail Spanberger..."`
**Context:** Press release is about Virginia Professional Fire Fighters endorsement
**Actual speaker:** VPFF leadership (stated elsewhere in release)

**Quote 2:** `"Simply put, Abigail was one of, if not the leading..."`
**Context:** Same endorsement release
**Actual speaker:** Same as above

**Issue:** Endorsement releases often have quotes without `said X` attribution, assuming reader knows context

**Action needed:**
- For endorsement-type releases (detected in type classification), check for organizational speaker in headline/lead
- Apply organizational speaker to unattributed quotes in endorsement context

---

#### 2D. Subhead as Quote Attribution

**Pattern:** Some releases use a subhead with speaker name/quote preview, then the actual quote follows

**Example:**

**File:** spanberger_06_one_month_election.txt

**Line 3:** `Spanberger: "As Virginia's Next Governor, I Will Get to Work on Day One..."`
**This is a SUBHEAD, not the quote itself**

**Line 9-11:** The actual full quotes from Spanberger

**Issue:** Parser may extract the subhead preview as a separate quote, or miss the connection between subhead and actual quotes

**Action needed:**
- Detect "Name: Quote preview" pattern as subhead
- Use the name from subhead as speaker for following quotes
- Don't extract subhead preview as a separate quote

---

### 3. Missing Body Paragraphs (1 file)

**File:** spanberger_13_trump_tax_ad.txt

**Format:** TV Ad Transcript

**Content structure:**
```
Headline
Date
[NARRATOR text]
[CANDIDATE text]
[NARRATOR text]
etc.
```

**Issue:** TV ad transcripts have dialogue format, not traditional body paragraphs

**Action needed:**
- Detect TV ad format (check for NARRATOR/CANDIDATE labels or transcript indicators)
- Extract dialogue as quotes instead of looking for traditional paragraphs
- Mark content type as "transcript" rather than "news_release"

---

## 📊 SUMMARY STATISTICS

| Category | Total | Success | Issues | Success Rate |
|----------|-------|---------|--------|--------------|
| Datelines | 14 | 14 | 0 | 100% |
| Headlines | 14 | 14 | 4* | 100%** |
| Body Paragraphs | 14 | 13 | 1 | 93% |
| Quote Speakers | ~50 | 29 | 21 | 58% |

\* False positives (legitimate hyphens)
\** All headlines extracted correctly

---

## 🎯 PRIORITY FIXES

### High Priority (Breaking Core Functionality)
1. ✅ Dateline field name mismatch - **FIXED**
2. **Continuation quote speaker tracking** - 21 affected quotes
3. **Quoted phrase filtering** - "America's Top State for Business" etc.

### Medium Priority (Improve Accuracy)
4. **Subhead-to-quote speaker mapping**
5. **Endorsement quote attribution**

### Low Priority (Edge Cases)
6. **TV ad transcript detection** - 1 file
7. **Headline hyphen validation** - 4 false positives

---

## 🔧 RECOMMENDED PARSER IMPROVEMENTS

### 1. Speaker Tracking State Machine
```javascript
class QuoteSpeakerTracker {
    constructor() {
        this.lastSpeaker = null;
        this.lastQuoteIndex = -1;
    }

    assignSpeaker(quote, index, hasNarrativeBetween) {
        if (quote.attribution) {
            this.lastSpeaker = quote.attribution;
            this.lastQuoteIndex = index;
            return quote.attribution;
        } else if (!hasNarrativeBetween && index === this.lastQuoteIndex + 1) {
            return this.lastSpeaker; // Continuation
        } else {
            this.reset();
            return null;
        }
    }

    reset() {
        this.lastSpeaker = null;
        this.lastQuoteIndex = -1;
    }
}
```

### 2. Enhanced Quoted Phrase Filters
```javascript
const extendedNarrativePatterns = [
    // Existing patterns
    /(?:announced|launched|unveiled|released)\s+(?:her|his|their)\s+$/i,

    // New patterns for rankings/titles
    /(?:ranking|title|designation|status|position)\s+(?:as|of)\s+$/i,
    /(?:lost|gained|earned|maintained|holds?)\s+(?:its|their|the)\s+[^'"]*$/i,
    /(?:named|called|dubbed|known as|referred to as)\s+$/i,

    // New patterns for plan names
    /\b(?:plan|program|initiative|proposal|policy)\s*$/i
];
```

### 3. TV Ad/Transcript Detection
```javascript
function detectTranscriptFormat(text) {
    const transcriptIndicators = [
        /\[NARRATOR[:\]]/i,
        /\[CANDIDATE[:\]]/i,
        /\(NARRATOR\)/i,
        /\(CANDIDATE\)/i,
        /^NARRATOR:/m,
        /^CANDIDATE:/m,
        /^Narrator:/m
    ];

    return transcriptIndicators.some(pattern => pattern.test(text));
}
```

### 4. Subhead Speaker Extraction
```javascript
function extractSubheadSpeaker(text) {
    // Pattern: "Name: 'Quote preview'" or "Name: Quote preview"
    const subheadPattern = /^([A-Z][a-zA-Z\s]+):\s*["'](.+?)["']/m;
    const match = text.match(subheadPattern);

    if (match) {
        return {
            speaker: match[1].trim(),
            preview: match[2].trim(),
            isSubhead: true
        };
    }
    return null;
}
```

---

## 📝 NEXT STEPS

1. Fix continuation quote speaker tracking (highest impact)
2. Expand quoted phrase filters to catch ranking/title patterns
3. Add TV ad transcript detection
4. Implement subhead speaker mapping
5. Create test suite with these 14 files as test cases
6. Document all patterns in parser inline comments

---

## 🧪 TEST CASES TO ADD

Based on this analysis, create test cases for:

1. **Continuation quotes:** Multiple paragraphs from same speaker
2. **Quoted rankings:** "America's Top State for Business"
3. **Quoted plan names:** "Growing Virginia Plan"
4. **TV ad transcripts:** NARRATOR/CANDIDATE format
5. **Subhead speakers:** "Spanberger: 'Quote preview'"
6. **Endorsement releases:** Organizational speaker attribution
7. **Hyphenated names in headlines:** "Earle-Sears"
8. **Date-only datelines:** "Oct 02, 2025"
9. **Mixed-case city/state:** "RICHMOND, Va"

---

END OF EDGE CASE ANALYSIS
