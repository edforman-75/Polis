# Fact-Checking Process - CRITICAL REQUIREMENTS

## ⚠️ MANDATORY: Always Use Web Search for Current Events

**RULE #1: If a claim involves any date after January 2025, you MUST use WebSearch**

**RULE #2: Never rely on training data for time-sensitive claims**

**RULE #3: When in doubt, search**

---

## Systematic Verification Process

### Step 1: Date Check
```
Is the claim about events after January 2025?
├─ YES → MUST use WebSearch
└─ NO → Can use training data (but search is still recommended)
```

### Step 2: Claim Classification

For each claim, determine:
1. **What is being claimed?** (extract the core assertion)
2. **When did it happen?** (identify the timeframe)
3. **Is this verifiable?** (public sources available?)
4. **Search required?** (after cutoff date or uncertain?)

### Step 3: Search Strategy

**For Recent Events (after Jan 2025):**
```javascript
// ALWAYS search for:
- Political events (elections, appointments, legislation)
- Deaths, injuries, violent incidents
- Policy changes, government actions
- Statistics or data claims
- Attribution claims (who said what)
```

**Search Query Construction:**
- Include specific names, dates, locations
- Add "2025" or specific year to queries
- Try multiple search terms if first fails
- Search for both the claim AND counter-claims

**Example Searches:**
```
✅ "Melissa Hortman Minnesota 2025"
✅ "crime statistics FBI 2024 2025"
✅ "government shutdown October 2025"
✅ "Charlie Kirk resolution Congress 2025"
```

### Step 4: Source Evaluation

**After searching, evaluate each source:**

1. **Credibility Tier** (use tier1_sources.json)
   - Federal government sites (1.0)
   - Major news organizations (0.75-0.85)
   - Fact-checkers (0.9)
   - Unknown sites (0.5 or lower)

2. **Corroboration**
   - Find 2-3 independent sources
   - Check if sources cite each other
   - Look for primary sources

3. **Recency**
   - Is the information current?
   - Has anything changed since publication?

### Step 5: Document Findings

**Record for every verification:**
- Search queries used
- Sources found
- Excerpts/quotes
- Credibility scores
- Final rating
- Confidence level

---

## Common Failure Modes

### ❌ FAILURE: Relying on Training Data
```
"Based on my knowledge as of January 2025, Melissa Hortman is alive..."
```
**PROBLEM:** Knowledge cutoff means missing critical recent events

**SOLUTION:** Search immediately for anyone mentioned in current events

### ❌ FAILURE: Assuming Sample Data is Fictional
```
"This references September 2025, so it's hypothetical..."
```
**PROBLEM:** Future dates in analysis don't mean the underlying facts are false

**SOLUTION:** Search for the factual claims regardless of document date

### ❌ FAILURE: Not Searching for "Obvious" Facts
```
"Everyone knows crime statistics are from FBI..."
```
**PROBLEM:** Even well-known facts need verification with current data

**SOLUTION:** Search for specific statistics and dates

---

## Integrated Search Workflow

### For API Integration

The fact-checking system should **automatically trigger web searches** when:

1. **Claim date > January 2025**
2. **Claim mentions specific people** (politicians, officials)
3. **Claim cites statistics** (even if seemingly from known sources)
4. **Claim is about recent legislation** or government actions
5. **Verification fails** with known sources

### Example Automated Search Logic

```javascript
async function verifyClaim(claim) {
  // 1. Extract temporal markers
  const dates = extractDates(claim.text);
  const requiresWebSearch = dates.some(d => d > '2025-01-01');

  // 2. Extract entities
  const people = extractPeople(claim.text);
  const organizations = extractOrganizations(claim.text);

  // 3. Construct search queries
  const queries = [];

  if (people.length > 0) {
    queries.push(`${people.join(' ')} ${dates[0]?.year || '2025'}`);
  }

  if (claim.type === 'direct_factual') {
    queries.push(claim.text); // Search the full claim
  }

  // 4. Execute searches
  const searchResults = [];
  for (const query of queries) {
    const results = await WebSearch(query);
    searchResults.push(...results);
  }

  // 5. Evaluate sources
  const verifiedSources = searchResults
    .map(source => ({
      ...source,
      credibility: scoreSourceCredibility(source.domain)
    }))
    .filter(s => s.credibility >= 0.7)
    .sort((a, b) => b.credibility - a.credibility);

  return {
    verified: verifiedSources.length > 0,
    sources: verifiedSources,
    confidence: calculateConfidence(verifiedSources)
  };
}
```

---

## Checklist for Every Claim

**Before marking a claim as verified/false:**

- [ ] Checked if claim involves dates after Jan 2025
- [ ] Performed WebSearch for current information
- [ ] Found at least 2 independent sources
- [ ] Evaluated source credibility (used tier scoring)
- [ ] Checked for updates/corrections to story
- [ ] Documented search process
- [ ] Saved sources with excerpts
- [ ] Assigned confidence score

**If ANY checkbox is unchecked → verification is incomplete**

---

## Real Example: The Melissa Hortman Case

### ❌ What Went Wrong

**Initial Analysis:**
```
"The late Melissa Hortman" - Statement refers to her as deceased,
but Rep. Melissa Hortman is alive and currently serving

VERDICT: FALSE - Fabricated sample data
```

**The Error:**
- Relied on training data (Jan 2025 cutoff)
- Didn't search for current information
- Assumed future-dated document was fictional
- Missed tragic event from June 2025

### ✅ Correct Process

**Step 1: Identify temporal markers**
- Document dated: September 19, 2025
- Reference: "the late Melissa Hortman"
- Implication: Death occurred before Sept 2025

**Step 2: Mandatory WebSearch**
```
WebSearch("Melissa Hortman Minnesota 2025")
WebSearch("Melissa Hortman death 2025")
```

**Step 3: Findings**
- Multiple credible sources (DOJ, CNN, Wikipedia)
- Event: Murdered June 14, 2025
- Verification: TRUE - she was killed

**Step 4: Document**
- Sources: justice.gov, cnn.com, wikipedia.org
- Credibility: Federal (1.0), National news (0.75), Reference (0.85)
- Confidence: HIGH (multiple corroborating sources)

### Lesson Learned

**The reference to "the late Melissa Hortman" was ACCURATE**, not false.

This demonstrates why:
1. **Web search is mandatory** for post-cutoff claims
2. **Never assume** without verification
3. **Multiple sources** prevent errors
4. **Document dates** require special attention

---

## Updated Fact-Checking Standards

### For All Analysts

**Before submitting ANY fact-check:**

1. Search for every person mentioned
2. Search for every statistic cited
3. Search for every event described
4. Cross-reference dates with search results
5. Document search queries used
6. Include source URLs in findings

### For System Integration

**The API should:**

1. Automatically detect temporal markers
2. Trigger WebSearch for post-cutoff dates
3. Require source documentation for verification
4. Flag unverified claims prominently
5. Track search query effectiveness

---

## Emergency Protocol

**If you realize a verification is wrong:**

1. **STOP** - Don't submit further verifications using same method
2. **SEARCH** - Immediately search for current information
3. **CORRECT** - Update the verification with accurate data
4. **DOCUMENT** - Explain what went wrong and how it was fixed
5. **LEARN** - Update process to prevent recurrence

---

## Summary

**OLD PROCESS (FAILED):**
```
1. Read claim
2. Check training data
3. Make determination
4. Submit result
```

**NEW PROCESS (REQUIRED):**
```
1. Read claim
2. Identify temporal markers
3. IF (date > Jan 2025) → MANDATORY WebSearch
4. Evaluate multiple sources
5. Document search process
6. Make determination with confidence score
7. Submit with source URLs
```

**The difference:** Search FIRST, determine SECOND.

---

**Last Updated:** October 2, 2025 (revised after Hortman case)
