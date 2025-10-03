# Fact-Checking System - User Guide

## ⚠️ CRITICAL REQUIREMENT

**ALWAYS USE WEB SEARCH FOR CURRENT EVENTS**

If a claim involves events after January 2025, you **MUST** use web search to verify. Never rely solely on training data or assumptions for time-sensitive claims.

**See:** [FACT_CHECKING_PROCESS.md](./FACT_CHECKING_PROCESS.md) for detailed search requirements.

---

## Overview

The Campaign AI Editor includes a comprehensive fact-checking system designed to detect, categorize, and verify claims in political communications. The system automatically identifies different types of claims and provides tools for systematic verification.

## Table of Contents

1. [Types of Claims](#types-of-claims)
2. [Creating a Fact-Check](#creating-a-fact-check)
3. [Extracting Claims](#extracting-claims)
4. [Verifying Claims](#verifying-claims)
5. [Workflow Overview](#workflow-overview)
6. [Best Practices](#best-practices)

---

## Types of Claims

The system recognizes **four distinct claim types**, each requiring different verification approaches:

### 1. Direct Factual Claims
**Verification Approach:** Standard verification against public sources

**Examples:**
- "The bill passed on September 15, 2025 with a vote of 218-210"
- "According to the FBI, crime decreased by 15% over the past two years"
- "The unemployment rate is 3.7%"

**Verification Strategy:**
- Check official government sources (congress.gov, agency websites)
- Consult credible news organizations
- Review official statistics and reports

**Typical Verification Time:** 5 minutes

---

### 2. Private Data Claims
**Verification Approach:** Unverifiable - lacks public access

**Examples:**
- "Our internal polling shows we are 20 points ahead"
- "My campaign has raised $10 million this quarter" (before official filing)
- "Focus groups confirm voters prefer our message"

**Why Unverifiable:**
- Data source controlled by claimant
- No independent access for third-party verification
- Cannot be confirmed or disputed externally

**What to Do:**
- Flag as unverifiable
- Note the private data limitation
- Wait for official public data if available (e.g., FEC filings)

**Typical Verification Time:** 1 minute (to flag)

---

### 3. Hearsay / Reported Speech
**Verification Approach:** Two-step verification process

**Examples:**
- "As you heard President Trump say, no one's taxes will go up"
- "The Governor told us that unemployment is at record lows"
- "My opponent claimed the bill would cost $1 trillion"

**Two-Step Verification:**

**Step 1: Verify the Attribution**
- Did the person actually say this?
- Check speeches, statements, press releases
- Review video/audio if available

**Step 2: Verify the Underlying Claim**
- Is what they said factually accurate?
- Apply standard fact-checking to the content

**Important Distinction:**
- **Hearsay** = "The Governor told us that..." (reporting what someone said)
- **Attribution** = "According to the CBO report..." (citing a document)

**Typical Verification Time:** 10 minutes

---

### 4. Plausible Deniability Claims
**Verification Approach:** Extract underlying claim, then verify

**Examples:**
- "People are saying the election was rigged"
- "Isn't it interesting that votes came in late at night?"
- "Some experts believe this could be dangerous"
- "Many are questioning whether this is constitutional"

**Deniability Patterns Detected:**
- Attribution to anonymous others ("people say")
- Just Asking Questions ("isn't it interesting...")
- Passive voice ("it is believed that...")
- Rhetorical questions with implications
- Hedged modality ("could be," "might")

**Verification Strategy:**
1. Extract the underlying assertion
2. Rephrase as direct claim
3. Apply standard fact-checking
4. Note the deniability framing in analysis

**Example Transformation:**
- **Original:** "A lot of people are saying crime is out of control"
- **Extracted Claim:** "Crime is out of control"
- **Then Verify:** Check crime statistics

**Typical Verification Time:** 7-8 minutes

---

## Creating a Fact-Check

### Via API

```javascript
POST /api/fact-checking/create

{
  "content": "Text to fact-check...",
  "assignmentId": "optional-assignment-id",
  "sourceAssignmentId": "optional-source-id"
}
```

### Via Web Interface

1. Navigate to the fact-checking dashboard
2. Click "Create New Fact-Check"
3. Paste or type the content to analyze
4. Optionally link to an assignment
5. Click "Create"

### What Gets Created

- **Fact-Check ID:** Unique identifier (e.g., FC-2025-001234)
- **Status:** Initially set to "pending"
- **Content:** Full text being analyzed
- **Metadata:** Creation date, creator, assignment links

---

## Extracting Claims

### Automatic Extraction

The system uses AI to automatically identify and extract factual claims from content.

```javascript
POST /api/fact-checking/:id/extract-claims
```

### What Happens During Extraction

1. **Text Analysis:** Content is split into sentences
2. **Pattern Detection:** Each sentence analyzed for claim patterns
3. **Type Classification:** Claims categorized (direct, hearsay, deniability, private)
4. **Confidence Scoring:** System assigns confidence to each detection
5. **Storage:** Claims saved to database for verification

### Extraction Results

Each extracted claim includes:
- **Claim Text:** The actual statement
- **Claim Type:** Classification (direct_factual, hearsay, etc.)
- **Verifiable:** Boolean indicating if claim can be verified
- **Verification Type:** Approach needed (standard, two-step, etc.)
- **Confidence Score:** 0.0 to 1.0
- **Patterns Matched:** Specific patterns detected
- **Deniability Score:** For plausible deniability claims (0.0 to 1.0)

### Example Output

```json
{
  "claimsExtracted": 3,
  "claims": [
    {
      "id": 1,
      "text": "According to FBI statistics, crime decreased by 15%",
      "claimType": "direct_factual",
      "verifiable": true,
      "verificationType": "standard",
      "confidence": 0.95
    },
    {
      "id": 2,
      "text": "People are telling me they feel safer than ever",
      "claimType": "plausible_deniability",
      "verifiable": false,
      "verificationType": "extract-underlying-claim",
      "deniabilityScore": 0.65
    }
  ]
}
```

---

## Verifying Claims

### Manual Verification Process

1. **Select Claim:** Choose a claim from the extracted list
2. **Research:** Find credible sources
3. **Assess:** Determine if claim is true, false, or mixed
4. **Document:** Record findings and sources
5. **Submit:** Save verification to database

### Via API

```javascript
POST /api/fact-checking/:factCheckId/claims/:claimId/verify

{
  "status": "verified_true",
  "rating": "true",
  "notes": "Confirmed via FBI UCR data",
  "method": "manual_source_check",
  "timeSpent": 300,
  "sources": [
    {
      "url": "https://ucr.fbi.gov/...",
      "domain": "fbi.gov",
      "title": "FBI Uniform Crime Report 2024",
      "credibilityTier": "federal_government",
      "credibilityScore": 1.0,
      "supportsClaim": true,
      "relevanceScore": 0.95,
      "excerpt": "Crime decreased 15.2%..."
    }
  ]
}
```

### Verification Ratings

- **TRUE:** Claim is accurate
- **MOSTLY TRUE:** Core claim accurate, minor issues
- **MIXED:** Partially true, partially false
- **MOSTLY FALSE:** Core claim inaccurate
- **FALSE:** Completely inaccurate
- **UNVERIFIABLE:** Cannot be verified with available sources

### Source Credibility Tiers

The system uses a tiered credibility scoring system:

| Tier | Score | Examples |
|------|-------|----------|
| **Federal Government** | 1.0 | congress.gov, fbi.gov, cdc.gov |
| **Fact-Checkers** | 0.9 | factcheck.org, politifact.com |
| **Research Institutions** | 0.85 | brookings.edu, pewresearch.org |
| **National News** | 0.75 | nytimes.com, washingtonpost.com |
| **Regional News** | 0.65 | Local newspapers |
| **Blogs/Opinion** | 0.3 | Personal blogs |
| **Unknown** | 0.5 | Default for unscored sources |

**Source Definitions:** See `cpo_docs/tier1_sources.json`

---

## Workflow Overview

### Complete Fact-Checking Workflow

```
1. CREATE FACT-CHECK
   ↓
2. EXTRACT CLAIMS (AI-powered)
   ↓
3. REVIEW EXTRACTED CLAIMS
   ↓
4. ASSIGN TO FACT-CHECKER
   ↓
5. VERIFY EACH CLAIM
   - Research sources
   - Document findings
   - Rate accuracy
   - Add sources
   ↓
6. COMPILE RESULTS
   ↓
7. COMPLETE FACT-CHECK
```

### Status Progression

- **pending** → Initial creation
- **extracting_claims** → AI extraction in progress
- **in_progress** → Assigned to fact-checker
- **completed** → All claims verified
- **published** → Results made public

---

## Best Practices

### For Fact-Checkers

**DO:**
- ✅ Use primary sources whenever possible
- ✅ Document your research process
- ✅ Note when claims are technically accurate but misleading
- ✅ Track time spent on verification
- ✅ Flag patterns of recurring false claims
- ✅ Be precise about what can and cannot be verified

**DON'T:**
- ❌ Rely on secondary sources when primary available
- ❌ Let political bias influence ratings
- ❌ Skip documenting sources
- ❌ Rate unverifiable claims as false (they're unverifiable)
- ❌ Conflate opinion with fact

### Common Pitfalls

**1. Confusing Attribution with Hearsay**
- ❌ Wrong: "According to the FBI report..." = hearsay
- ✅ Right: "According to the FBI report..." = attribution to document (standard verification)
- ✅ Hearsay: "The FBI Director told us..." = reporting what someone said (two-step)

**2. Missing Plausible Deniability**
- Watch for: "people say," "some believe," "isn't it interesting"
- Extract the underlying claim before verifying

**3. Treating Predictions as Facts**
- "Millions will lose insurance" = prediction (unverifiable)
- "2 million people lost insurance last year" = fact (verifiable)

**4. Ignoring Context**
- A statement can be technically true but misleading
- Document context issues in notes

### Quality Standards

**Every Verification Should Include:**
1. Clear rating (true/false/mixed/unverifiable)
2. At least one credible source (if verifiable)
3. Brief explanation of findings
4. Relevant excerpts from sources
5. Credibility assessment of sources

---

## Troubleshooting

### "No claims extracted"
- Content may be purely opinion/editorial
- Try with more factual content
- Check that content contains declarative statements

### "All claims marked unverifiable"
- May be private data claims (internal polling, etc.)
- May be predictions about future events
- May be purely subjective statements

### "Source credibility score seems wrong"
- Check `tier1_sources.json` for domain scoring
- You can override scores in verification
- Report persistent issues to system admin

---

## Related Documentation

- **API Documentation:** [FACT_CHECKING_API.md](./FACT_CHECKING_API.md)
- **Database Schema:** [FACT_CHECKING_DATABASE.md](./FACT_CHECKING_DATABASE.md)
- **System Architecture:** [FACT-CHECKING-SYSTEM.md](../FACT-CHECKING-SYSTEM.md)
- **Source Credibility:** [tier1_sources.json](./tier1_sources.json)

---

## Support

For questions or issues:
- Check the troubleshooting section above
- Review related documentation
- Contact system administrator

**Last Updated:** October 2, 2025
