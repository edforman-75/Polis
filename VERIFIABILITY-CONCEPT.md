# Verifiability Concepts

## 1. Private Data Detection

### Core Principle

**A claim is verifiable only if the underlying data source is publicly accessible.**

## Three Requirements for Verification

### 1. PUBLIC ACCESS
Independent parties can access the raw data or methodology
- ✓ "According to Pew Research..." - anyone can access Pew's published data
- ✗ "Our internal polling shows..." - only the campaign has access

### 2. INDEPENDENT CONFIRMATION
Third parties produced or validated the data
- ✓ "FEC filings show we raised $5M" - government agency maintains the data
- ✗ "Our campaign data confirms..." - we produced and control the data

### 3. TRANSPARENT METHODOLOGY
Methods can be reviewed and reproduced by others
- ✓ "A Gallup poll found..." - Gallup publishes their methodology
- ✗ "We are 20 points ahead" (no source) - no methodology to review

## Implementation as 4-Step Process

### STEP 1: Check for Claimant-Controlled Sources
**Violates: PUBLIC ACCESS**

Detect patterns like:
- "according to our internal polling"
- "poll by our campaign"
- "data from my research"

If found → UNVERIFIABLE (claimant controls the data)

### STEP 2: Check for Public Attribution
**Satisfies: INDEPENDENT CONFIRMATION**

Detect patterns like:
- "according to Gallup"
- "poll by Pew Research"
- "reported by the New York Times"

If found → VERIFIABLE (independent third party)

### STEP 3: Detect Explicit Private Data Patterns
**Violates: PUBLIC ACCESS + INDEPENDENT CONFIRMATION**

Patterns identifying non-public sources:
- "our/my/internal/private polling" - controlled by claimant
- "our own campaign data" - explicitly campaign-controlled
- "internal polling" - not publicly released
- "private polling" - explicitly not public
- "proprietary analysis" - owned/controlled, not shared
- "our data shows" - indicates control

### STEP 4: Detect Unsourced Self-Referential Claims
**Violates: TRANSPARENT METHODOLOGY**

Claims like "We are 20 points ahead" with no attribution:
- Who measured this?
- What's the source?
- What methodology was used?

Without attribution, no way to access or validate the methodology.

## Test Results

```
[1] PRIVATE (100%)
    "Our internal polling confirms that we are at least 20 points ahead."
    → Violates PUBLIC ACCESS (claimant-controlled)

[2] PUBLIC (0%)
    "A new Politico poll shows we are 10 points ahead."
    → Satisfies INDEPENDENT CONFIRMATION (third party source)

[3] PUBLIC (0%)
    "According to Gallup, we lead by 12 points."
    → Satisfies INDEPENDENT CONFIRMATION (public attribution)

[4] PRIVATE (100%)
    "According to our campaign data, we are 15 points ahead."
    → Violates PUBLIC ACCESS (claimant-controlled despite "according to")

[5] PUBLIC (0%)
    "Poll by Pew Research shows 45% support."
    → Satisfies INDEPENDENT CONFIRMATION (third party)

[6] PRIVATE (100%)
    "Our proprietary research indicates we are pulling away."
    → Violates PUBLIC ACCESS + INDEPENDENT CONFIRMATION (controlled + not shared)
```

### Why This Matters

Politicians often make claims based on:
- Internal polling they control
- Campaign data they selectively release
- "Research" with no public methodology

These claims **cannot be fact-checked** because:
1. The underlying data is not publicly accessible
2. No independent party can confirm the claim
3. The methodology cannot be reviewed

By identifying these patterns, we can flag claims that require special scrutiny or cannot be verified against public sources.

---

## 2. Hearsay and Reported Speech Detection

### Core Principle

**Hearsay is when the speaker reports what someone else said, rather than making a direct claim themselves.**

### Verification Requirements

Hearsay requires **TWO-STEP VERIFICATION**:

1. **VERIFY THE ATTRIBUTION** - Did the person actually say this?
2. **VERIFY THE CLAIM** - Is what they said factually accurate?

### Three Types of Hearsay

#### Type 1: Audience Reference (Confidence: 100%)
Pattern: "As you heard X say..." or "You heard X say..."

**Example**: "As you heard President Trump say, no one's taxes will go up"

- Assumes the audience already heard the statement
- Still needs verification that Trump said it
- Then needs verification of the tax claim itself

#### Type 2: Reported Private Communication (Confidence: 90%)
Pattern: "X told us/me that..."

**Example**: "The Speaker told us that the bill would pass this week"

- Reports private/direct communication
- Cannot easily verify what was said privately
- Needs public record to confirm

#### Type 3: Paraphrase (Confidence: 80%)
Pattern: "X mentioned/said that..." or "As X said..."

**Example**: "Governor Newsom mentioned that California will reach carbon neutrality by 2030"

- Paraphrasing someone's statement
- May not be exact words
- Needs to find original statement to verify accuracy

### Key Distinctions

#### Direct Claim
**"No one's taxes will go up"**
- Speaker makes the claim directly
- One-step verification: Is it true?

#### Attribution
**"According to the CBO, taxes will increase"**
- Citing a verifiable source
- One-step verification: Check CBO reports

#### Hearsay
**"As you heard Trump say, no one's taxes will go up"**
- Reporting what someone else said
- Two-step verification:
  1. Did Trump say this? (verify attribution)
  2. Is it factually accurate? (verify claim)

### Implementation Results

Test cases showing 100% accuracy:

```
[1] "As you heard President Trump say, no one's taxes will go up"
    → HEARSAY (audience-reference)
    → Speaker: President Trump
    → Needs: Attribution + Claim verification

[2] "No one's taxes will go up"
    → DIRECT CLAIM
    → Needs: Claim verification only

[3] "According to the CBO, taxes will increase by 15%"
    → ATTRIBUTION
    → Needs: Verify CBO report

[4] "The Speaker told us that the bill would pass this week"
    → HEARSAY (reported-private-communication)
    → Speaker: The Speaker
    → Needs: Attribution + Claim verification
```

### Why Hearsay Detection Matters

Politicians use hearsay to:
- **Distance themselves from claims** - "As you heard X say..." lets them report claims without owning them
- **Avoid direct accountability** - If the claim is false, they can say "I was just reporting what X said"
- **Amplify messages** - Repeat what allies said without making the claim themselves

By detecting hearsay, we can:
1. Identify who actually made the original claim
2. Apply the appropriate two-step verification process
3. Track whether politicians accurately represent others' statements

---

## 3. Plausible Deniability Detection

### Core Principle

**Plausible deniability is when a speaker makes claims while maintaining the ability to deny responsibility or ownership of those claims.**

### Common Deniability Techniques

#### 1. Anonymous Attribution (Weight: 0.35-0.40)
Pattern: "People are saying...", "Everybody knows..."

**Examples**:
- "People are telling me there were tremendous problems"
- "Everybody knows the system is rigged"
- "Many people believe there was fraud"

**Deniability**: If challenged → "I didn't say it, other people did"

#### 2. Hearsay Shield (Weight: 0.35)
Pattern: "I heard...", "I don't know, but..."

**Examples**:
- "I don't know, but I've heard there was fraud"
- "I just heard the numbers don't add up"

**Deniability**: If challenged → "I was just repeating what I heard"

#### 3. JAQing Off (Just Asking Questions) (Weight: 0.35)
Pattern: "I'm not saying it's true, but...", "Just asking..."

**Examples**:
- "I'm not saying it's true, but isn't it interesting?"
- "Just asking questions about the irregularities"

**Deniability**: If challenged → "I was just asking questions, not making claims"

#### 4. Passive/Impersonal Authority (Weight: 0.30)
Pattern: "It is widely believed...", "It has been suggested..."

**Examples**:
- "It is widely believed there may be problems"
- "It has been suggested the results are questionable"

**Deniability**: If challenged → "I'm reporting what is believed, not asserting it"

#### 5. Rhetorical Questions (Weight: 0.20 + 0.10 boost)
Pattern: "Isn't it interesting...", "What if..."

**Examples**:
- "Isn't it interesting that the votes came in late?"
- "What if the system was rigged?"

**Deniability**: If challenged → "I was just raising questions, not making accusations"

#### 6. Hedged Modality (Weight: 0.20)
Pattern: "Might", "Could", "Possibly"

**Examples**:
- "There could be massive fraud"
- "This might be the worst scandal ever"

**Deniability**: If challenged → "I said 'might', not that it definitely is"

### Scoring System

**Base Score**: Sum of matched pattern weights
**Boosts**:
- +0.10 if contains "claimy" words (rigged, fraud, corrupt, hoax, etc.)
- +0.10 if rhetorical question with specific stem

**Threshold**: ≥ 0.50 = Has plausible deniability

### Test Results

```
[1] "People are telling me there were tremendous problems—everybody knows it."
    → DENIABLE (90%)
    → Patterns: AttributionToAnonymousOthers, AppealToObviousness
    → Charged terms boost: +10%

[2] "I'm not saying it's true, but many people think so."
    → DENIABLE (70%)
    → Patterns: JustAskingQuestions, AppealToConsensus

[3] "It is widely believed that there may be fraud."
    → DENIABLE (60%)
    → Patterns: PassiveAuthority, HedgedModality
    → Charged terms boost: +10%

[4] "The bill passed on September 15, 2025 with a vote of 218-210."
    → DIRECT CLAIM (0%)
    → No deniability patterns
```

### Why Plausible Deniability Detection Matters

Politicians use these patterns to:
- **Make inflammatory claims without direct responsibility** - Suggest serious accusations while maintaining deniability
- **Avoid fact-checking** - Not making direct assertions means claims are harder to fact-check
- **Plant ideas in audience minds** - Suggestions are often more persuasive than direct statements
- **Evade accountability** - If proven false, they can claim "I never actually said that"

By detecting these patterns, we can:
1. Identify claims disguised as questions or hearsay
2. Extract the underlying assertion for verification
3. Flag low-accountability rhetoric
4. Track politicians who rely on deniable phrasing
