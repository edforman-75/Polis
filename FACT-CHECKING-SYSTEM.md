# Comprehensive Fact-Checking System

A multi-layered system for detecting, categorizing, and verifying claims in political communications.

## Overview

This system identifies **four types of claims**, each requiring different verification approaches:

1. **Direct Factual Claims** → Standard verification
2. **Private Data Claims** → Unverifiable (no public access)
3. **Hearsay/Reported Speech** → Two-step verification
4. **Plausible Deniability** → Extract underlying claim

## System Components

### 1. Private Data Detection

**Concept**: A claim is verifiable only if the underlying data source is publicly accessible.

**Requirements for Verification**:
- PUBLIC ACCESS - Independent parties can access the raw data
- INDEPENDENT CONFIRMATION - Third parties produced the data
- TRANSPARENT METHODOLOGY - Methods can be reviewed and reproduced

**Examples**:
```javascript
// UNVERIFIABLE - Private Data
"Our internal polling confirms we are 20 points ahead"
→ Violates PUBLIC ACCESS (claimant controls data)

// VERIFIABLE - Public Source
"According to Gallup, we lead by 12 points"
→ Satisfies INDEPENDENT CONFIRMATION (third party)
```

**Implementation**: `detectPrivateDataClaim()` (press-release-parser.js:3310-3457)

### 2. Hearsay Detection

**Concept**: Hearsay is when the speaker reports what someone else said, rather than making a direct claim.

**Verification Requirements**: TWO-STEP PROCESS
1. VERIFY THE ATTRIBUTION - Did the person actually say this?
2. VERIFY THE CLAIM - Is what they said factually accurate?

**Types**:
- **Audience Reference** (100%) - "As you heard X say..."
- **Private Communication** (90%) - "X told us that..."
- **Paraphrase** (80%) - "X mentioned that..."

**Examples**:
```javascript
// HEARSAY
"As you heard President Trump say, no one's taxes will go up"
→ Must verify: (1) Did Trump say it? (2) Is it true?

// ATTRIBUTION (Not Hearsay)
"According to the CBO, taxes will increase by 15%"
→ One-step: Check CBO report
```

**Implementation**: `detectHearsay()` (press-release-parser.js:3589-3666)

### 3. Plausible Deniability Detection

**Concept**: Speaker makes claims while maintaining ability to deny responsibility.

**Deniability Techniques**:

| Pattern | Weight | Example | Deniability Response |
|---------|--------|---------|---------------------|
| Anonymous Attribution | 0.40 | "People are saying..." | "I didn't say it, others did" |
| Hearsay Shield | 0.35 | "I heard..." | "I was just repeating what I heard" |
| JAQing Off | 0.35 | "Just asking questions..." | "I was just asking, not claiming" |
| Passive Authority | 0.30 | "It is widely believed..." | "I'm reporting what is believed" |
| Rhetorical Questions | 0.20 | "Isn't it interesting..." | "I was just raising questions" |
| Hedged Modality | 0.20 | "Could be...", "Might..." | "I said 'might', not 'is'" |

**Scoring**:
- Base score = Sum of matched pattern weights
- +0.10 if contains "claimy" words (rigged, fraud, corrupt, etc.)
- +0.10 if rhetorical question with specific stem
- Threshold: ≥0.50 = Has plausible deniability

**Examples**:
```javascript
// DENIABLE (90%)
"People are telling me there were tremendous problems—everybody knows it."
→ Patterns: AttributionToAnonymousOthers, AppealToObviousness
→ Charged terms boost: +10%

// DIRECT CLAIM (0%)
"The bill passed on September 15, 2025 with a vote of 218-210."
→ No deniability patterns
```

**Implementation**: `detectPlausibleDeniability()` (press-release-parser.js:3459-3587)

### 4. Claim Grounding/Verification

**Concept**: Find credible online sources that validate factual claims.

**Components**:
- **Source Credibility Scoring** - Uses tier1_sources.json
- **Search Query Generation** - Creates targeted verification queries
- **Content Validation** - Checks if source supports claim

**Credibility Tiers**:
- Congressional/Federal (100%) - congress.gov, fec.gov
- Fact-checkers (90%) - factcheck.org, politifact.com
- Research (85%) - brookings.edu, pewresearch.org
- National news (75%) - politico.com, nytimes.com

**Implementation**:
- `scoreSourceCredibility()` (press-release-parser.js:3560-3593)
- `generateSearchQueries()` (press-release-parser.js:3598-3654)
- `doesContentSupportClaim()` (press-release-parser.js:3659-3705)

## Tools & Usage

### JavaScript Integration

```javascript
const parser = new PressReleaseParser();

// Extract all facts from text
const facts = parser.extractProvableFacts(text);

// Returns array of fact objects:
facts.forEach(fact => {
  console.log(fact.type); // e.g., ['plausible-deniability', 'attributiontoanonymousothers']
  console.log(fact.verifiable); // true/false
  console.log(fact.verification_type); // 'standard', 'two-step', 'extract-underlying-claim'
  console.log(fact.note); // Human-readable explanation
});
```

### Python CLI Tool

**Installation**:
```bash
chmod +x detect_pd.py
```

**Usage**:
```bash
# Process text file
python3 detect_pd.py --in speech.txt --out flags.jsonl

# Process JSONL corpus
python3 detect_pd.py --in corpus.jsonl \
  --format jsonl \
  --id-field doc_id \
  --text-field text \
  --out flags.jsonl

# Pipe from STDIN
cat speech.txt | python3 detect_pd.py --in - --out -

# Custom threshold
python3 detect_pd.py --in speech.txt --threshold 0.6 --out flags.jsonl
```

**Output Format** (JSONL):
```json
{
  "doc_id": "speech.txt",
  "sentence_id": 1,
  "span": {"start": 0, "end": 72},
  "sentence": "People are telling me there were problems—everybody knows it.",
  "score": 0.9,
  "labels": ["AppealToObviousness", "AttributionToAnonymousOthers"],
  "matched_patterns": [
    {"id": "ATTR_PEOPLE_SAY", "label": "AttributionToAnonymousOthers"},
    {"id": "ATTR_EVERYBODY_KNOWS", "label": "AppealToObviousness"}
  ],
  "meta": {"threshold": 0.5, "source": "speech.txt"}
}
```

### Test Files

**JavaScript Tests**:
- `test-fact-extraction.js` - Hedging and factual element detection
- `test-claim-grounding.js` - Source credibility and verification workflow
- `test-hearsay-detection.js` - Hearsay vs. attribution distinction
- `test-plausible-deniability.js` - Deniability pattern detection

**Run Tests**:
```bash
node test-fact-extraction.js
node test-claim-grounding.js
node test-hearsay-detection.js
node test-plausible-deniability.js
```

## Configuration Files

### Pattern Configuration
`plausible_deniability_patterns.json` - Editable pattern definitions

```json
{
  "meta": {
    "default_threshold": 0.5
  },
  "boosts": {
    "claiminess": 0.10,
    "rhetorical_question": 0.10
  },
  "patterns": [
    {
      "id": "ATTR_PEOPLE_SAY",
      "label": "AttributionToAnonymousOthers",
      "weight": 0.40,
      "rx": "\\b(people|lots of people)\\s+(?:are )?(?:saying|telling)\\b"
    }
    // ... more patterns
  ]
}
```

### Source Credibility
`cpo_docs/tier1_sources.json` - Trusted source domains by category

## Detection Flow

```
Input Text
    ↓
Split into sentences
    ↓
For each sentence:
    ↓
[1] Check: Private Data?
    ├─ YES → Mark unverifiable, continue to next
    └─ NO ↓

[2] Check: Plausible Deniability?
    ├─ YES → Mark as deniable claim, continue to next
    └─ NO ↓

[3] Check: Hearsay?
    ├─ YES → Mark two-step verification, continue to next
    └─ NO ↓

[4] Check: Hedged/Speculative?
    ├─ YES → Skip (not factual)
    └─ NO ↓

[5] Check: Contains Factual Elements?
    ├─ NO → Skip
    └─ YES ↓

[6] Extract as Direct Factual Claim
    └─ Standard verification required
```

## Why This Matters

Politicians use sophisticated rhetorical techniques to:
- Make inflammatory claims without direct responsibility
- Avoid fact-checking by not making direct assertions
- Plant ideas through suggestion and questions
- Maintain deniability when proven false

This system:
1. ✓ Identifies claims disguised as questions or hearsay
2. ✓ Extracts underlying assertions for verification
3. ✓ Flags low-accountability rhetoric
4. ✓ Tracks reliance on deniable phrasing
5. ✓ Distinguishes verifiable from unverifiable claims

## References

- **Conceptual Documentation**: `VERIFIABILITY-CONCEPT.md`
- **Pattern Definitions**: `plausible_deniability_patterns.json`
- **Source Credibility**: `cpo_docs/tier1_sources.json`
- **Main Parser**: `backend/utils/press-release-parser.js`

## Future Enhancements

Potential additions:
- Live WebSearch/WebFetch integration for claim verification
- Batch processing mode for corpus analysis
- API endpoint for real-time detection
- Machine learning refinement of pattern weights
- Domain-specific pattern sets (healthcare, immigration, etc.)
