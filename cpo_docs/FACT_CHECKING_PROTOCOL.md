# Fact-Checking Verification Protocol

## MANDATORY RULE: Never Mark False Without Web Search

**Before rating ANY claim as FALSE, MIXED, or MOSTLY FALSE:**
1. ✅ Perform WebSearch
2. ✅ Find at least 2 credible sources
3. ✅ Document search queries
4. ✅ Compare search results with claim

**This applies to ALL claims, regardless of how confident you are.**

---

## Knowledge Cutoff Check

**My Knowledge Cutoff:** January 2025

**Current Date (from environment):** Check `<env>` tag

**When to ALWAYS use WebSearch:**
- Claim date ≥ January 2025
- Claim involves recent events (past 12 months)
- Claim mentions specific people in news/politics
- Claim cites statistics or data
- ANY claim you're marking as FALSE/MIXED/MOSTLY FALSE

---

## Dual Verification Process

### Step 1: AI Analysis (Training Data)
```
1. Analyze claim structure
2. Classify claim type
3. Check against training data
4. Form initial hypothesis
```

### Step 2: Web Verification (MANDATORY)
```
1. Construct search queries
2. Execute WebSearch
3. Evaluate source credibility
4. Compare results with claim
5. Form web-informed conclusion
```

### Step 3: Synthesis
```
IF (AI analysis = FALSE) AND (Web results = FALSE):
  ✅ Can mark as FALSE

IF (AI analysis = FALSE) AND (Web results = TRUE):
  ⚠️ Mark as TRUE (web overrides training data)

IF (AI analysis = TRUE) AND (Web results = FALSE):
  ⚠️ Mark as FALSE (web overrides training data)

IF (AI analysis = UNCERTAIN) OR (Web results = UNCERTAIN):
  ⚠️ Mark as NEEDS FURTHER RESEARCH
```

---

## Search Query Strategy

### For Any Claim Being Marked FALSE:

**Query 1: Direct claim search**
```
WebSearch("exact text of claim")
```

**Query 2: Key entity + year**
```
WebSearch("person/event name 2025")
```

**Query 3: Fact-checker search**
```
WebSearch("claim + fact check")
```

**Query 4: News search**
```
WebSearch("person/event + news")
```

**Minimum:** Execute at least 2-3 of these queries before marking FALSE

---

## Verification Checklist

**Before submitting ANY verification as FALSE/MIXED/MOSTLY FALSE:**

- [ ] Checked environment date vs knowledge cutoff
- [ ] Performed WebSearch (minimum 2 queries)
- [ ] Found credible sources (≥2 sources with credibility ≥0.7)
- [ ] Sources agree with each other
- [ ] No contradicting evidence found
- [ ] Documented search queries used
- [ ] Saved source URLs and excerpts
- [ ] Confidence score assigned (≥0.8 for FALSE rating)

**If ANY checkbox is unchecked → DO NOT mark as FALSE**

---

## Example: Correct Application

### Claim: "Melissa Hortman is alive and serving"

**Step 1: AI Analysis (Training Data)**
```
- Training data (Jan 2025): Shows Hortman as Minnesota House leader
- Initial hypothesis: TRUE (she was alive as of cutoff)
```

**Step 2: Check Cutoff vs Current**
```
- Knowledge cutoff: January 2025
- Current date: October 2025
- Time gap: 9 months
- Action: MANDATORY web search
```

**Step 3: Web Verification**
```
Query 1: "Melissa Hortman 2025"
→ Multiple results about her death in June 2025

Query 2: "Melissa Hortman Minnesota murdered"
→ DOJ, CNN, ABC confirm murder on June 14, 2025

Query 3: "Melissa Hortman current status"
→ Wikipedia, news sites confirm death
```

**Step 4: Synthesis**
```
AI analysis: TRUE (based on Jan 2025 data)
Web results: FALSE (she was murdered June 2025)
Final rating: FALSE (web overrides training data)
Confidence: 1.0 (federal sources, multiple corroboration)
```

**Step 5: Document**
```
Claim: "Melissa Hortman is alive" (implied in Sept 2025 context)
Rating: FALSE
Reasoning: Murdered June 14, 2025
Sources:
- https://www.justice.gov/... (credibility: 1.0)
- https://www.cnn.com/... (credibility: 0.75)
- https://en.wikipedia.org/... (credibility: 0.85)
Search queries: ["Melissa Hortman 2025", "Melissa Hortman murdered"]
```

---

## Example: Preventing False Negatives

### Claim: "Crime decreased by 15% according to FBI"

**Step 1: AI Analysis**
```
- Sounds plausible
- FBI does publish crime statistics
- Initial hypothesis: LIKELY TRUE but needs verification
```

**Step 2: Web Verification (REQUIRED before marking TRUE)**
```
Query 1: "FBI crime statistics 2024 2025"
→ Find actual FBI UCR reports

Query 2: "crime decreased 15% 2024"
→ Verify specific percentage

Query 3: "FBI crime data latest"
→ Get most recent official statistics
```

**Step 3: Evaluation**
```
- Check if FBI actually published this data
- Verify the 15% figure
- Confirm timeframe and jurisdiction
- Look for any corrections or updates
```

**Only after web verification → assign rating**

---

## Special Cases

### Case 1: No Web Results Found

**If WebSearch returns no relevant results:**
```
1. Try alternative search queries
2. Search for related entities/events
3. Check fact-checker sites directly
4. If still nothing: Mark as "UNVERIFIABLE" (not FALSE)
```

**Do NOT mark as FALSE just because web search failed**

### Case 2: Contradictory Web Results

**If sources disagree:**
```
1. Rank sources by credibility score
2. Weight higher-credibility sources more
3. Note the contradiction in documentation
4. Mark as "MIXED" or "DISPUTED"
5. Include all perspectives in notes
```

### Case 3: Outdated Web Results

**If search results are older than claim:**
```
1. Add temporal qualifiers to search
2. Use date range filters if available
3. Search for "latest" or "current" versions
4. Note temporal limitation in documentation
```

---

## Cutoff Date Awareness Protocol

### At Start of Every Fact-Check Session:

```javascript
function checkCutoffStatus() {
  const cutoffDate = "2025-01-01"; // My knowledge cutoff
  const currentDate = getCurrentDateFromEnv(); // From <env> tag
  const daysSinceCutoff = daysBetween(cutoffDate, currentDate);

  if (daysSinceCutoff > 30) {
    console.warn(`⚠️ Working ${daysSinceCutoff} days past knowledge cutoff`);
    console.warn(`⚠️ MANDATORY: Use WebSearch for ALL factual claims`);
  }

  return {
    cutoffDate,
    currentDate,
    daysSinceCutoff,
    webSearchMandatory: daysSinceCutoff > 0
  };
}
```

### Display to User:

```
╔════════════════════════════════════════════╗
║  FACT-CHECKING SESSION                      ║
╠════════════════════════════════════════════╣
║  Knowledge Cutoff: January 2025             ║
║  Current Date: October 2, 2025              ║
║  Days Since Cutoff: 274                     ║
║                                             ║
║  ⚠️ WEB SEARCH: MANDATORY FOR ALL CLAIMS    ║
╚════════════════════════════════════════════╝
```

---

## Automated Safeguards

### Pre-Rating Check

```javascript
function canMarkAsFalse(claim, verification) {
  // Check 1: Was web search performed?
  if (!verification.webSearchPerformed) {
    throw new Error("BLOCKED: Must perform web search before marking FALSE");
  }

  // Check 2: Minimum source count
  if (verification.sources.length < 2) {
    throw new Error("BLOCKED: Need at least 2 sources to mark FALSE");
  }

  // Check 3: Source credibility threshold
  const avgCredibility = average(verification.sources.map(s => s.credibility));
  if (avgCredibility < 0.7) {
    throw new Error("BLOCKED: Sources not credible enough for FALSE rating");
  }

  // Check 4: Search query documentation
  if (!verification.searchQueries || verification.searchQueries.length === 0) {
    throw new Error("BLOCKED: Must document search queries used");
  }

  // Check 5: Confidence threshold
  if (verification.confidence < 0.8) {
    throw new Error("BLOCKED: Confidence too low for definitive FALSE rating");
  }

  return true; // All checks passed
}
```

---

## Error Recovery

### If You Mark Something FALSE Without Web Search:

```
1. IMMEDIATELY halt further verifications
2. Perform web search for the claim
3. Compare web results with your rating
4. IF mismatch:
   a. Correct the rating
   b. Document the error
   c. Explain what went wrong
5. Resume fact-checking with corrected process
```

### If User Questions Your Rating:

```
1. Don't defend without evidence
2. Immediately perform (or re-perform) web search
3. Show search results to user
4. If you were wrong: admit it, correct it, document it
5. If you were right: show supporting evidence
```

---

## Rating Confidence Levels

**When assigning ratings, include confidence:**

| Rating | Confidence Required | Minimum Sources | Web Search |
|--------|-------------------|-----------------|------------|
| FALSE | ≥ 0.8 | 2+ credible | MANDATORY |
| MOSTLY FALSE | ≥ 0.75 | 2+ credible | MANDATORY |
| MIXED | ≥ 0.7 | 2+ credible | MANDATORY |
| MOSTLY TRUE | ≥ 0.75 | 2+ credible | REQUIRED |
| TRUE | ≥ 0.8 | 2+ credible | REQUIRED |
| UNVERIFIABLE | N/A | N/A | ATTEMPTED |

---

## Summary

**The Golden Rule:**

```
IF making negative determination (FALSE/MIXED):
  THEN WebSearch is MANDATORY
  AND minimum 2 credible sources
  AND document all search queries
  ELSE rating is INVALID
```

**The Safety Net:**

```
When in doubt:
1. Search the web
2. Find more sources
3. Document everything
4. Mark as UNCERTAIN rather than FALSE
```

**The Commitment:**

```
I will NEVER mark a claim as FALSE without:
✅ Web search
✅ Multiple credible sources
✅ Documented queries
✅ High confidence (≥0.8)
```

---

**Last Updated:** October 2, 2025
**Updated After:** Melissa Hortman verification error
**Purpose:** Prevent false negatives through mandatory web verification
