# Parser Assistant Workflow & Improvement System

**Philosophy:** Parsing Assistant fixes structural issues → Logs problems/solutions → Parser learns from patterns → Regression testing prevents backsliding

---

## Roles & Responsibilities

### Parsing Assistant (Human or AI)
**Skills required:**
- Document structure recognition (headlines, datelines, quotes, paragraphs)
- Basic grammar and formatting
- Pattern recognition
- NO political knowledge required

**Tasks:**
1. Review parser output for each new release
2. Identify what the parser got wrong
3. Fix structural issues
4. Log the problem and solution with explanation
5. Decide: Send to editor OR bounce back to writer

**Not responsible for:**
- Political messaging
- Fact-checking
- Tone/voice
- Content quality (beyond structure)

---

### Parser
**Current state:** Strict pattern matching
**Goal state:** Learn from parsing assistant's corrections

**Improvement cycle:**
1. Parse release → Flag low confidence components
2. Parsing assistant reviews and fixes
3. System logs: what failed + why + how it was fixed
4. Developers review logs weekly
5. Implement pattern improvements
6. Run regression tests
7. Deploy if no regressions

---

## Logging System Design

### Parser Feedback Log Structure

```javascript
{
    log_id: "uuid",
    timestamp: "2025-10-01T17:30:00Z",
    release_id: "release_01",

    // What the parser returned
    parser_output: {
        headline: "Contact: press@janesmithforcongress.org",
        dateline: null,
        lead_paragraph: "Jane Smith will hold a rally...",
        quotes: [],
        quality_score: 35
    },

    // What the parsing assistant changed
    corrections: [
        {
            component: "headline",
            parser_value: "Contact: press@janesmithforcongress.org",
            correct_value: "Jane Smith to Hold Rally at High School Gym",

            // Why the parser failed
            failure_reason: "Parser picked up boilerplate contact line as headline",
            failure_category: "headline_detection",

            // How the assistant knew the right answer
            solution_method: "Manually identified first substantive sentence as headline",

            // What pattern should the parser learn?
            pattern_suggestion: "Skip lines starting with 'Contact:' when looking for headlines",

            // Assistant's confidence in their fix
            confidence: "high"
        },
        {
            component: "dateline",
            parser_value: null,
            correct_value: "SPRINGFIELD, IL - October 8, 2025",

            failure_reason: "No formal dateline in text - release said 'next Thursday'",
            failure_category: "dateline_missing",

            solution_method: "Inferred date from context: announcement made Oct 1, next Thursday = Oct 8. Location from campaign HQ records.",

            pattern_suggestion: "Flag vague dates like 'next Thursday' and prompt for specific date",

            confidence: "medium",
            notes: "Had to look up campaign HQ location. Should be in metadata."
        }
    ],

    // Overall decision
    decision: "fix_and_forward",  // or "bounce_to_writer"
    decision_reason: "Structural issues fixable. Content is weak but acceptable.",

    // Time spent
    time_spent_seconds: 180,

    // Was this a regression? (Did parser used to handle this correctly?)
    is_regression: false,

    // Parsing assistant grades the parser's performance on THIS document
    parser_grade: {
        score: 35,           // 0-100
        letter: 'F',         // A, B, C, D, F

        // Component-level grades
        components: {
            headline: { correct: false, score: 0, comment: "Picked boilerplate instead of real headline" },
            dateline: { correct: false, score: 0, comment: "No dateline found, none in text" },
            lead: { correct: true, score: 20, comment: "Found lead paragraph correctly" },
            quotes: { correct: false, score: 0, comment: "No quotes found" },
            structure: { correct: true, score: 15, comment: "Identified paragraph structure" }
        },

        // Overall assessment
        strengths: ["Extracted basic text structure"],
        weaknesses: ["Headline detection needs boilerplate filtering", "Dateline completely missing"],

        // Did the parser improve or regress since last similar release?
        trend: "baseline"  // "improving", "stable", "regressing", "baseline"
    }
}
```

---

## Failure Categories (Taxonomy)

### Headline Issues
- `headline_missing` - No headline found
- `headline_boilerplate` - Picked up boilerplate (Contact:, FOR IMMEDIATE RELEASE, etc.)
- `headline_wrong_line` - Found wrong line as headline
- `headline_truncated` - Headline cut off mid-sentence
- `headline_too_long` - Entire paragraph treated as headline

### Dateline Issues
- `dateline_missing` - No dateline in text
- `dateline_informal` - Has location/date but not in standard format
- `dateline_vague_date` - "next Thursday" instead of specific date
- `dateline_missing_location` - Has date but no location
- `dateline_missing_date` - Has location but no date

### Quote Issues
- `quote_missing_attribution` - Quote found but no speaker
- `quote_informal_attribution` - "union rep" instead of full name
- `quote_first_name_only` - "Jane said" instead of "Jane Smith said"
- `quote_missing_title` - Speaker name but no title
- `quote_not_detected` - Quote exists but parser didn't find it
- `quote_false_positive` - Parser found quote that isn't actually a quote

### Lead/Structure Issues
- `lead_missing` - No lead paragraph identified
- `lead_wrong_paragraph` - Parser picked wrong paragraph
- `lead_incomplete` - Lead doesn't have 5 W's
- `structure_missing` - No paragraph structure

---

## Regression Testing System

### Test Suite: `test-regression.js`

```javascript
const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

// Load baseline expectations
const baselines = JSON.parse(
    fs.readFileSync('./test-data/parser-baselines.json', 'utf-8')
);

const parser = new PressReleaseParser();
const regressions = [];

console.log('Running regression tests...\n');

baselines.forEach(baseline => {
    const text = fs.readFileSync(baseline.file_path, 'utf-8');
    const result = parser.parse(text);

    // Check each component
    const checks = [
        {
            name: 'headline',
            expected: baseline.expected.headline,
            actual: result.content_structure?.headline
        },
        {
            name: 'dateline',
            expected: baseline.expected.dateline,
            actual: result.content_structure?.dateline?.full
        },
        {
            name: 'quote_count',
            expected: baseline.expected.quote_count,
            actual: result.quotes?.length || 0
        }
    ];

    checks.forEach(check => {
        if (check.expected && check.actual !== check.expected) {
            regressions.push({
                file: baseline.file_path,
                component: check.name,
                expected: check.expected,
                actual: check.actual,
                baseline_version: baseline.parser_version
            });
        }
    });
});

if (regressions.length === 0) {
    console.log('✅ All regression tests passed!');
    process.exit(0);
} else {
    console.log(`❌ ${regressions.length} regressions detected:\n`);
    regressions.forEach(r => {
        console.log(`${r.file} - ${r.component}`);
        console.log(`  Expected: ${r.expected}`);
        console.log(`  Got: ${r.actual}\n`);
    });
    process.exit(1);
}
```

### Baseline Storage: `test-data/parser-baselines.json`

Every time a release is successfully parsed and corrected, we add it to the baseline:

```json
[
    {
        "file_path": "./cpo_examples/detroit_economy.txt",
        "parser_version": "1.0.0",
        "date_added": "2025-10-01",
        "expected": {
            "headline": "Detroit Secures $800 Million Battery Plant, Creating 2,500 Good-Paying Jobs",
            "dateline": "DETROIT, MI - October 1, 2025",
            "lead_paragraph_length": 224,
            "quote_count": 2,
            "quotes": [
                {
                    "speaker": "James Wilson",
                    "title": "Mayor of Detroit"
                },
                {
                    "speaker": "Jennifer Martinez",
                    "title": "CEO of ElectricFuture"
                }
            ]
        }
    }
]
```

---

## Implementation Plan: High Priority Issues

### Priority 1: Headline Boilerplate Filter 🎯

**Problem:** Parser picks "Contact: email@..." as headline (25/25 Jane Smith examples)

**Fix:**
```javascript
extractHeadlineRobust(text) {
    // Remove boilerplate FIRST
    let content = text;
    const boilerplatePatterns = [
        /^FOR IMMEDIATE RELEASE\s*/im,
        /^Contact:.*$/im,
        /^Media Contact:.*$/im,
        /^Press Contact:.*$/im,
        /^###\s*$/im
    ];

    boilerplatePatterns.forEach(pattern => {
        content = content.replace(pattern, '');
    });

    content = content.trim();

    // Now find headline in cleaned content
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    // ... rest of headline extraction logic
}
```

**Test cases:**
- release_01.txt (has "Contact:" line)
- release_02.txt (has "Contact:" line)
- All other releases with Contact: lines

**Expected improvement:** Headline detection accuracy 25/25 → should ignore Contact: lines

**Logging:** Track `headline_boilerplate` failures

---

### Priority 2: Flexible Dateline Extraction 🎯

**Problem:** 0/25 Jane Smith examples have formal datelines

**Fix:** Implement `extractDatelineFlexible()` from proposal
- Try formal pattern first
- Fallback to location detection
- Fallback to date detection
- Return with confidence scores

**Test cases:**
- Formal dateline: "BOSTON, MA - October 1, 2025" → high confidence
- Informal: "SPRINGFIELD, IL - Jane announced..." → medium confidence
- No dateline: "Jane Smith announced..." → low/none confidence, flag for assistant

**Expected improvement:** Dateline detection 0/25 → at least find partial info (location or date)

**Logging:** Track `dateline_missing`, `dateline_informal`, `dateline_vague_date`

---

### Priority 3: Quote Extraction Without Attribution 🎯

**Problem:** 0/25 Jane Smith examples have quotes extracted

**Fix:** Implement `extractQuotesFlexible()` from proposal
- Find ALL text in quotes first
- Try multiple attribution patterns
- Return quotes with confidence scores even if no attribution

**Test cases:**
- release_07.txt: `"She's pretty good"` with informal attribution
- Quotes without attribution: extract text, flag for assistant

**Expected improvement:** Quote detection 0/25 → find quoted text even without formal attribution

**Logging:** Track `quote_missing_attribution`, `quote_informal_attribution`

---

## Parsing Assistant Interface (Future)

### Dashboard View

```
╔════════════════════════════════════════════════════════════╗
║ PARSING ASSISTANT QUEUE                                    ║
╠════════════════════════════════════════════════════════════╣
║ 📋 5 releases awaiting review                             ║
║                                                            ║
║ [1] release_01.txt - Score: 35/100 (F) - 3 issues        ║
║     ⚠️ Headline: Picked boilerplate                       ║
║     ⚠️ Dateline: Missing                                  ║
║     ⚠️ Quotes: None found                                 ║
║     [Review & Fix]  [Bounce to Writer]                   ║
║                                                            ║
║ [2] release_07.txt - Score: 45/100 (F) - 2 issues        ║
║     ⚠️ Dateline: Missing                                  ║
║     ⚠️ Quotes: Informal attribution ("union rep")         ║
║     [Review & Fix]  [Bounce to Writer]                   ║
╚════════════════════════════════════════════════════════════╝
```

### Correction Interface

```
╔════════════════════════════════════════════════════════════╗
║ FIXING: release_01.txt                                     ║
╠════════════════════════════════════════════════════════════╣
║ HEADLINE                                                   ║
║ ❌ Parser found: "Contact: press@janesmithforcongress.org"║
║ ✏️ Corrected:    "Jane Smith to Hold Rally at High School"║
║                                                            ║
║ Why did parser fail?                                       ║
║ ▢ Picked boilerplate as headline                          ║
║ ▢ Wrong line selected                                      ║
║ ▢ No clear headline in text                               ║
║ ▢ Other: ___________                                       ║
║                                                            ║
║ How did you find the correct headline?                     ║
║ [First substantive sentence after removing boilerplate]   ║
║                                                            ║
║ Pattern suggestion for parser:                             ║
║ [Skip lines matching /^Contact:/i when finding headline]  ║
║                                                            ║
║ Confidence: ⚫⚫⚫⚫○ High                                   ║
╠════════════════════════════════════════════════════════════╣
║ [Save & Continue]  [Skip]  [Bounce Entire Release]       ║
╚════════════════════════════════════════════════════════════╝
```

---

## Weekly Improvement Process

### Step 1: Review Logs (Monday)
- Aggregate parser feedback logs from past week
- Group failures by category
- Identify most common patterns

Example:
```
Last 7 days: 43 releases processed

Top failure categories:
1. headline_boilerplate - 38 occurrences (88%)
2. dateline_missing - 43 occurrences (100%)
3. quote_informal_attribution - 12 occurrences (28%)
```

### Step 2: Prioritize Fixes (Monday)
- Pick highest frequency category
- Review parsing assistant's pattern suggestions
- Design fix

### Step 3: Implement & Test (Tuesday-Thursday)
- Implement improvement
- Add new test cases
- Run regression suite
- Fix any regressions

### Step 4: Deploy (Friday)
- Deploy to production
- Monitor for new issues
- Update parser version
- Add successful cases to baseline

---

## Metrics to Track

### Parser Performance (Graded by Assistant)

**Per-document tracking:**
- Parser grade (A-F) for each release processed
- Component-level correctness (headline, dateline, lead, quotes, structure)
- Trend indicator (improving/stable/regressing)

**Aggregate metrics:**
- **Average parser grade** (goal: increase over time)
  - Week 1: F (35/100)
  - Week 2: D (65/100) ← after headline filter fix
  - Week 3: C (75/100) ← after dateline flexibility
  - Target: B+ (85/100) by Week 8

- **Component accuracy rates:**
  - Headlines correct: 0% → 88% → 95%
  - Datelines correct: 0% → 40% → 80%
  - Quotes correct: 0% → 15% → 60%

- **Grade distribution:**
  ```
  A: ████░░░░░░ 5%
  B: ██████░░░░ 12%
  C: ████████░░ 23%
  D: ██████████ 35%
  F: ████████░░ 25%
  ```

### System Performance
- Overall parse success rate (should stay 100% - never crash)
- Regression count per deployment (goal: 0)
- Time between improvements (goal: < 1 week)

### Parsing Assistant Efficiency
- Average time per review
- Fix rate vs bounce rate
- Confidence distribution of fixes
- Most common failure categories

### Improvement Velocity
- Fixes implemented per week
- Time from log → deployment
- Success rate of fixes (did they reduce that failure category?)

---

## Next Actions

1. **Create logging system**
   - `backend/services/parser-feedback-logger.js`
   - Database schema for feedback logs
   - API endpoints for logging corrections

2. **Create regression test suite**
   - `test-regression.js`
   - `test-data/parser-baselines.json`
   - npm script: `npm run test-regression`

3. **Implement Priority 1: Headline Boilerplate Filter**
   - Update `extractHeadlineEnhanced()` method
   - Add test cases
   - Run regression tests
   - Deploy

4. **Document baseline for existing good parses**
   - Detroit economy example
   - Healthcare example
   - Lock these as regression tests

5. **Set up parsing assistant workflow**
   - Can be manual review for now
   - Simple form for logging corrections
   - Will build full UI later

Ready to start with Step 1 (logging system) and Step 2 (regression suite)?
