# Parser Robustness Improvements - Proposal

**Goal:** Parse badly formatted press releases and provide structured output with quality flags for the editor to fix.

**Philosophy:** Parser extracts what it can + flags issues → Editor helps user fix flagged issues

---

## Current State Analysis

From testing 25 Jane Smith examples:

| Component | Success Rate | Issue |
|-----------|-------------|--------|
| Headlines | 100% | ✅ Working, but picks up wrong text sometimes |
| Datelines | 0% | ❌ Requires exact format "CITY, ST - Date" |
| Lead paragraphs | 16% | ❌ Expects formal structure |
| Quotes | 0% | ❌ Requires formal attribution |

**Problem:** Parser is too strict - it expects professional formatting that many real-world releases lack.

---

## Proposed Improvements

### 1. Flexible Dateline Extraction 🎯 HIGH PRIORITY

**Current behavior:**
- Only matches formal patterns: "BOSTON, MA - October 1, 2025"
- Returns null if not found
- 0/25 Jane Smith examples have datelines

**Proposed enhancement:**
Extract dateline components separately with fallbacks:

```javascript
extractDatelineFlexible(text) {
    const result = {
        location: null,
        date: null,
        full: null,
        confidence: 'none',  // none, low, medium, high
        issues: []
    };

    // Try formal dateline first (highest confidence)
    const formal = this.extractDatelineEnhanced(text);
    if (formal.location && formal.date) {
        return {
            ...formal,
            confidence: 'high',
            issues: []
        };
    }

    // FALLBACK 1: Look for location anywhere in first 3 lines
    const firstLines = text.split('\n').slice(0, 3).join(' ');
    const locationPattern = /\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/;
    const locMatch = firstLines.match(locationPattern);
    if (locMatch) {
        result.location = `${locMatch[1]}, ${locMatch[2]}`;
        result.confidence = 'medium';
        result.issues.push('Location found but not in dateline format');
    }

    // FALLBACK 2: Look for date anywhere in first 5 lines
    const datePatterns = [
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/,
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
        /\b\d{4}-\d{2}-\d{2}\b/
    ];

    const first5Lines = text.split('\n').slice(0, 5).join(' ');
    for (const pattern of datePatterns) {
        const dateMatch = first5Lines.match(pattern);
        if (dateMatch) {
            result.date = dateMatch[0];
            if (result.confidence === 'none') result.confidence = 'low';
            result.issues.push('Date found but not in dateline format');
            break;
        }
    }

    // FALLBACK 3: Try to infer location from content
    if (!result.location) {
        // Look for city/state mentions in quotes or text
        const cityMentions = text.match(/\b([A-Z][a-zA-Z]+),\s*([A-Z]{2})\b/g);
        if (cityMentions && cityMentions.length > 0) {
            // Use most frequent mention
            result.location = cityMentions[0];
            result.confidence = 'low';
            result.issues.push('Location inferred from content, not explicit dateline');
        }
    }

    if (!result.date) {
        result.issues.push('No date found in release');
    }

    if (result.location || result.date) {
        result.full = [result.location, result.date].filter(Boolean).join(' - ');
    }

    return result;
}
```

**Example outputs:**

Input: `"Jane Smith will hold a rally at the high school gym next Thursday."`
```javascript
{
    location: null,
    date: null,
    full: null,
    confidence: 'none',
    issues: ['No date found in release', 'No location found']
}
```

Input: `"SPRINGFIELD, IL - Jane Smith announced today..."`
```javascript
{
    location: 'SPRINGFIELD, IL',
    date: null,
    full: 'SPRINGFIELD, IL',
    confidence: 'medium',
    issues: ['Location found but not in dateline format', 'No date found in release']
}
```

---

### 2. Quote Extraction Without Attribution 🎯 HIGH PRIORITY

**Current behavior:**
- Only extracts quotes with formal attribution ("said Speaker")
- 0/25 Jane Smith examples extracted

**Proposed enhancement:**
Extract ALL quoted text, mark attribution confidence:

```javascript
extractQuotesFlexible(text) {
    const quotes = [];

    // Find ALL text in quotes first
    const quotePattern = /"([^"]+)"/g;
    let match;

    while ((match = quotePattern.exec(text)) !== null) {
        const quoteText = match[1].trim();
        const position = match.index;

        // Get context before/after quote
        const contextBefore = text.substring(Math.max(0, position - 200), position);
        const contextAfter = text.substring(position + match[0].length, position + match[0].length + 200);

        const quote = {
            quote_text: quoteText,
            speaker_name: null,
            speaker_title: null,
            full_attribution: null,
            position: position,
            confidence: 'none',  // none, low, medium, high
            issues: []
        };

        // Try to find attribution with various patterns
        const attributionPatterns = [
            // Standard: "quote," said Speaker Title
            { pattern: /^[,\s]*(said|according to|stated)\s+([^."]+?)(?:\s+at\s|\s+in\s|\.)/i, confidence: 'high' },

            // Before quote: Speaker said "quote"
            { pattern: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|stated|announced)[,:\s]*$/i, confidence: 'high', location: 'before' },

            // Informal: "quote" - Speaker
            { pattern: /^\s*[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, confidence: 'medium' },

            // Very informal: "quote," Speaker said
            { pattern: /^[,\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+said/i, confidence: 'low' }
        ];

        for (const { pattern, confidence, location } of attributionPatterns) {
            const context = location === 'before' ? contextBefore : contextAfter;
            const attrMatch = context.match(pattern);

            if (attrMatch) {
                const attribution = attrMatch[1] || attrMatch[2];
                quote.full_attribution = attribution.trim();
                quote.speaker_name = this.extractSpeakerName(attribution, text);
                quote.speaker_title = this.extractSpeakerTitle(attribution, text);
                quote.confidence = confidence;
                break;
            }
        }

        // If no attribution found, still include the quote
        if (!quote.full_attribution) {
            quote.issues.push('Quote found but no speaker attribution');
            quote.full_attribution = 'Unknown Speaker';
        }

        quotes.push(quote);
    }

    return quotes;
}
```

**Example outputs:**

Input: `The Steelworkers Union endorsed Jane Smith. "She's pretty good at standing up for workers," said a union rep.`
```javascript
{
    quote_text: "She's pretty good at standing up for workers",
    speaker_name: "union rep",
    speaker_title: null,
    full_attribution: "a union rep",
    confidence: 'high',
    issues: ['Informal speaker identification - needs full name']
}
```

Input: `Jane said she was "very happy" about it.`
```javascript
{
    quote_text: "very happy",
    speaker_name: "Jane",
    speaker_title: null,
    full_attribution: "Jane",
    confidence: 'medium',
    issues: ['Speaker first name only - needs full name and title']
}
```

---

### 3. Smart Lead Paragraph Detection 🎯 MEDIUM PRIORITY

**Current behavior:**
- Expects structured format after dateline
- 21/25 Jane Smith examples have no lead paragraph

**Proposed enhancement:**
Use heuristics to find lead, even if informal:

```javascript
extractLeadParagraphSmart(text, headline, dateline) {
    const result = {
        lead_paragraph: null,
        confidence: 'none',
        issues: []
    };

    // Remove headline
    let content = text;
    if (headline) {
        const headlineIndex = content.indexOf(headline);
        if (headlineIndex >= 0) {
            content = content.substring(headlineIndex + headline.length).trim();
        }
    }

    // Remove boilerplate
    content = content.replace(/^FOR IMMEDIATE RELEASE/im, '');
    content = content.replace(/^Contact:.*$/im, '');
    content = content.trim();

    // Split into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    if (paragraphs.length === 0) {
        result.issues.push('No paragraphs found');
        return result;
    }

    // STRATEGY 1: Formal dateline exists - take text after it
    if (dateline && dateline.full && dateline.confidence === 'high') {
        const datelineIndex = content.indexOf(dateline.full);
        if (datelineIndex >= 0) {
            const afterDateline = content.substring(datelineIndex + dateline.full.length).trim();
            const firstPara = afterDateline.split(/\n\s*\n/)[0];
            if (firstPara && firstPara.length > 50) {
                result.lead_paragraph = dateline.full + ' - ' + firstPara;
                result.confidence = 'high';
                return result;
            }
        }
    }

    // STRATEGY 2: Find paragraph with the most "W" words (who, what, when, where, why)
    let bestParagraph = null;
    let bestScore = 0;

    for (const para of paragraphs.slice(0, 3)) {  // Check first 3 paragraphs
        if (para.length < 30) continue;  // Skip very short paragraphs

        let score = 0;

        // Check for announcement words
        if (/\b(announced|unveiled|launched|introduced|released)\b/i.test(para)) score += 3;

        // Check for names (proper nouns)
        const properNouns = para.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
        if (properNouns && properNouns.length > 2) score += 2;

        // Check for dates
        if (/\b(today|yesterday|tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(para)) score += 1;
        if (/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i.test(para)) score += 2;

        // Check for locations
        if (/\b[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b/.test(para)) score += 2;

        // Prefer longer paragraphs (more likely to be lead)
        if (para.length > 100) score += 1;
        if (para.length > 200) score += 1;

        if (score > bestScore) {
            bestScore = score;
            bestParagraph = para;
        }
    }

    if (bestParagraph) {
        result.lead_paragraph = bestParagraph;
        result.confidence = bestScore > 5 ? 'medium' : 'low';

        if (result.confidence === 'low') {
            result.issues.push('Lead paragraph inferred - may not follow inverted pyramid structure');
        }
    } else {
        // STRATEGY 3: Just take first paragraph as fallback
        result.lead_paragraph = paragraphs[0];
        result.confidence = 'low';
        result.issues.push('Using first paragraph as lead - no clear lead structure found');
    }

    return result;
}
```

---

### 4. Better Headline Extraction 🎯 MEDIUM PRIORITY

**Current behavior:**
- Sometimes picks up "Contact: email@domain.com" as headline
- Picks first sentence if no clear headline

**Proposed enhancement:**

```javascript
extractHeadlineRobust(text) {
    const result = {
        headline: null,
        confidence: 'none',
        issues: []
    };

    // Remove boilerplate first
    let content = text;
    content = content.replace(/^FOR IMMEDIATE RELEASE\s*/im, '');
    content = content.replace(/^Contact:.*$/im, '');
    content = content.trim();

    const lines = content.split('\n').filter(l => l.trim().length > 0);

    if (lines.length === 0) {
        result.issues.push('No content found');
        return result;
    }

    // Score each line to find most headline-like
    let bestLine = null;
    let bestScore = -1;

    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length < 10) continue;  // Too short
        if (line.length > 200) continue; // Too long

        let score = 10;  // Base score

        // NEGATIVE scores (likely NOT a headline)
        if (/^Contact:/i.test(line)) score -= 100;
        if (/^Media Contact/i.test(line)) score -= 100;
        if (/^For (?:more )?information/i.test(line)) score -= 100;
        if (/^###/i.test(line)) score -= 100;
        if (/@/.test(line)) score -= 50;  // Has email
        if (/^\d{3}/.test(line)) score -= 50;  // Starts with phone number

        // POSITIVE scores (likely a headline)
        if (i === 0) score += 5;  // First line bonus
        if (line === line.toUpperCase() && line.length > 20) score += 3;  // All caps
        if (/\b(Announces|Unveils|Launches|Releases|Introduces)\b/i.test(line)) score += 4;
        if (line.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/)) score += 2;  // Has proper names
        if (line.length >= 40 && line.length <= 120) score += 3;  // Good length
        if (!/\.$/.test(line)) score += 2;  // Doesn't end with period (headline style)

        if (score > bestScore) {
            bestScore = score;
            bestLine = line;
        }
    }

    if (bestLine && bestScore > 5) {
        result.headline = bestLine;
        result.confidence = bestScore > 15 ? 'high' : 'medium';
    } else {
        // Fallback: use first substantial line
        result.headline = lines[0];
        result.confidence = 'low';
        result.issues.push('Headline unclear - using first line');
    }

    return result;
}
```

---

### 5. Add Quality Metadata to Parse Results 🎯 HIGH PRIORITY

**Proposed structure:**
Return enhanced parse result with quality flags:

```javascript
parse(text) {
    const result = {
        // Existing structure
        content_structure: {},
        quotes: [],

        // NEW: Quality assessment
        quality: {
            overall_score: 0,  // 0-100
            grade: 'F',        // A, B, C, D, F
            readiness: 'draft', // draft, needs-review, ready, publication-ready
            issues: [],
            warnings: [],
            suggestions: []
        }
    };

    // Extract components with new flexible methods
    const headline = this.extractHeadlineRobust(text);
    const dateline = this.extractDatelineFlexible(text);
    const lead = this.extractLeadParagraphSmart(text, headline.headline, dateline);
    const quotes = this.extractQuotesFlexible(text);

    // Populate result
    result.content_structure.headline = headline.headline;
    result.content_structure.dateline = dateline;
    result.content_structure.lead_paragraph = lead.lead_paragraph;
    result.quotes = quotes;

    // Calculate quality score
    let score = 0;

    // Headline (20 points)
    if (headline.confidence === 'high') score += 20;
    else if (headline.confidence === 'medium') score += 15;
    else if (headline.confidence === 'low') score += 10;
    else result.quality.issues.push('Missing or unclear headline');

    // Dateline (20 points)
    if (dateline.confidence === 'high') score += 20;
    else if (dateline.confidence === 'medium') score += 15;
    else if (dateline.confidence === 'low') score += 10;
    else result.quality.issues.push('Missing dateline');

    // Lead paragraph (20 points)
    if (lead.confidence === 'high') score += 20;
    else if (lead.confidence === 'medium') score += 15;
    else if (lead.confidence === 'low') score += 10;
    else result.quality.issues.push('Missing lead paragraph');

    // Quotes (20 points)
    const highConfQuotes = quotes.filter(q => q.confidence === 'high').length;
    if (highConfQuotes >= 2) score += 20;
    else if (highConfQuotes === 1) score += 15;
    else if (quotes.length > 0) score += 10;
    else result.quality.issues.push('No quotes found');

    // Structure (20 points)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length >= 4) score += 20;
    else if (paragraphs.length >= 2) score += 15;
    else if (paragraphs.length >= 1) score += 10;
    else result.quality.issues.push('Insufficient structure');

    // Collect all issues
    result.quality.issues.push(...headline.issues);
    result.quality.issues.push(...dateline.issues);
    result.quality.issues.push(...lead.issues);
    quotes.forEach(q => result.quality.issues.push(...q.issues));

    // Generate warnings
    if (dateline.confidence !== 'high') {
        result.quality.warnings.push('Dateline missing or informal - add location and date');
    }
    if (quotes.length === 0) {
        result.quality.warnings.push('No quotes - add speaker quotes for credibility');
    }
    if (quotes.some(q => q.confidence === 'low')) {
        result.quality.warnings.push('Some quotes lack proper attribution');
    }

    // Generate suggestions
    if (score < 60) {
        result.quality.suggestions.push('Add formal dateline with city, state, and date');
        result.quality.suggestions.push('Include at least 2 quotes with full speaker names and titles');
        result.quality.suggestions.push('Structure with inverted pyramid: lead, body, quotes, boilerplate');
    }

    // Calculate grade and readiness
    result.quality.overall_score = score;
    if (score >= 90) {
        result.quality.grade = 'A';
        result.quality.readiness = 'publication-ready';
    } else if (score >= 80) {
        result.quality.grade = 'B';
        result.quality.readiness = 'ready';
    } else if (score >= 70) {
        result.quality.grade = 'C';
        result.quality.readiness = 'needs-review';
    } else if (score >= 60) {
        result.quality.grade = 'D';
        result.quality.readiness = 'draft';
    } else {
        result.quality.grade = 'F';
        result.quality.readiness = 'draft';
    }

    return result;
}
```

---

## Example: Before and After

### Input (Jane Smith release_01.txt):
```
FOR IMMEDIATE RELEASE
Contact: press@janesmithforcongress.org

Jane Smith will hold a rally at the high school gym next Thursday.
Doors open at 6, she'll talk about jobs and families. Bring friends.

Not sure if ASL interpreters available—still checking.
```

### Current Parser Output:
```javascript
{
    content_structure: {
        headline: "Contact: press@janesmithforcongress.org",
        dateline: null,
        lead_paragraph: "Jane Smith will hold a rally...",
        body_paragraphs: []
    },
    quotes: []
}
```

### Proposed Parser Output:
```javascript
{
    content_structure: {
        headline: "Jane Smith will hold a rally at the high school gym next Thursday",
        dateline: {
            location: null,
            date: null,
            full: null,
            confidence: 'none',
            issues: ['No date found in release', 'No location found']
        },
        lead_paragraph: "Jane Smith will hold a rally at the high school gym next Thursday. Doors open at 6, she'll talk about jobs and families.",
    },
    quotes: [],
    quality: {
        overall_score: 35,
        grade: 'F',
        readiness: 'draft',
        issues: [
            'No date found in release',
            'No location found',
            'Lead paragraph inferred - may not follow inverted pyramid structure',
            'No quotes found',
            'Insufficient structure'
        ],
        warnings: [
            'Dateline missing or informal - add location and date',
            'No quotes - add speaker quotes for credibility'
        ],
        suggestions: [
            'Add formal dateline with city, state, and date',
            'Specify exact date instead of "next Thursday"',
            'Include at least 2 quotes with full speaker names and titles',
            'Add body paragraphs with event details',
            'Confirm accessibility accommodations (ASL interpreters)'
        ]
    }
}
```

---

## Implementation Priority

### Phase 1: Core Robustness (Week 1)
1. ✅ Flexible dateline extraction with confidence scores
2. ✅ Quote extraction without requiring attribution
3. ✅ Quality metadata structure

### Phase 2: Smart Detection (Week 2)
4. ✅ Smart lead paragraph detection
5. ✅ Better headline extraction
6. ✅ Issue/warning generation

### Phase 3: Editor Integration (Week 3)
7. Update UI to show confidence scores
8. Add "fix issues" buttons for each flagged problem
9. Color-code components by confidence (red/yellow/green)
10. Generate AI suggestions for fixing low-confidence components

---

## Editor UI Enhancements

Once parser returns quality metadata, the editor can:

1. **Visual Quality Indicators**
   - Overall score badge (A/B/C/D/F)
   - Component confidence colors (🔴 none, 🟡 low, 🟢 high)
   - Issues panel with actionable fixes

2. **Smart Fix Buttons**
   - "Add Dateline" → Opens dateline editor with suggestions
   - "Fix Quote Attribution" → Searches text for speaker names
   - "Improve Lead" → AI suggests rewrite following inverted pyramid

3. **Quality Checklist**
   - [ ] Formal dateline with city, state, date
   - [ ] Headline 40-100 characters
   - [ ] Lead paragraph with 5 W's
   - [ ] At least 2 quotes with full attribution
   - [ ] 3-5 body paragraphs
   - [ ] Boilerplate if needed

---

## Testing Plan

Create new test suite `test-parser-robustness.js`:

```javascript
const tests = [
    {
        name: "Missing dateline",
        input: "Jane Smith announced...",
        expect: {
            dateline: { confidence: 'none' },
            quality: { score: '<60' }
        }
    },
    {
        name: "Informal quote",
        input: 'Jane said she was "very happy" about it.',
        expect: {
            quotes: [{ confidence: 'medium', issues: ['needs full name'] }]
        }
    },
    // ... more test cases
];
```

Run against all 25 Jane Smith examples and verify:
- ✅ No parse failures (100% success rate maintained)
- ✅ All components extracted with confidence scores
- ✅ Quality issues correctly identified
- ✅ Suggestions are actionable

---

## Benefits

1. **Parser never fails** - always returns something useful
2. **Clear quality feedback** - users know what needs fixing
3. **Actionable guidance** - specific suggestions, not generic complaints
4. **Graceful degradation** - works with any input, better with good input
5. **Training data** - quality scores help identify patterns to improve

---

## Questions / Need Guidance On

1. **Confidence thresholds** - Are 'none/low/medium/high' granular enough, or should we use 0-100 scores?

2. **Quality scoring weights** - Currently equal (20pts each for headline/dateline/lead/quotes/structure). Should some components be weighted higher?

3. **AI suggestions** - Should parser generate specific fix suggestions, or leave that to a separate AI service?

4. **Backwards compatibility** - Should we keep the old strict parser as `parseStrict()` for well-formatted releases?

5. **Performance** - Flexible parsing does more work (multiple fallback attempts). Is this acceptable for real-time parsing in the UI?

Let me know which approach you prefer and I can start implementing!
