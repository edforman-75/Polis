# Comparative/Computational Claims - Fact-Checking Guide

## Overview

Comparative claims require **multi-step verification**: looking up multiple data points and comparing them. The system now automatically detects these claims and provides a structured verification workflow.

---

## What Are Comparative Claims?

Statements that compare two or more quantifiable metrics using comparison operators.

### Example

> "Our annual deficit is greater than the GDP of the UK."

**Why it's verifiable:**
- ✅ Both metrics can be looked up (US deficit, UK GDP)
- ✅ The comparison can be objectively verified
- ✅ The relationship is testable ("greater than")

**Verification steps:**
1. Look up current US annual deficit → e.g., $1.7 trillion
2. Look up current UK GDP → e.g., $3.1 trillion
3. Compare: Is $1.7T > $3.1T? → **FALSE**

---

## Types of Comparisons Detected

### 1. **Greater Than**
- **Patterns:** "greater than", "larger than", "bigger than", "higher than", "more than"
- **Examples:**
  - "Inflation is higher than the EU average"
  - "Our deficit is greater than the UK's GDP"
  - "Crime is larger than neighboring states"

### 2. **Less Than**
- **Patterns:** "less than", "smaller than", "lower than", "fewer than"
- **Examples:**
  - "Unemployment is lower than it was in 2019"
  - "Our spending is less than the previous administration"
  - "We have fewer deaths than projected"

### 3. **Equal To**
- **Patterns:** "equal to", "same as", "as much as", "as many as", "as high as"
- **Examples:**
  - "Our growth is equal to the national average"
  - "We've raised as much money as the incumbent"

### 4. **Exceeds**
- **Patterns:** "exceeds", "surpasses", "outpaces"
- **Examples:**
  - "The budget exceeds last year's spending by 20%"
  - "Economic growth surpasses predictions"
  - "Job creation outpaces the national rate"

### 5. **Trails**
- **Patterns:** "trails", "lags behind", "falls short of"
- **Examples:**
  - "Medicare spending trails inflation by 5 percentage points"
  - "Our state lags behind in education funding"
  - "Performance falls short of expectations"

### 6. **Multiple Of**
- **Patterns:** "doubled", "tripled", "quadrupled"
- **Examples:**
  - "Crime has doubled since 2020"
  - "Revenue tripled under this policy"
  - "Cases quadrupled in one month"

### 7. **Ratio**
- **Patterns:** "half of", "twice", "three times", "X times"
- **Examples:**
  - "Our state has three times the poverty rate of neighboring states"
  - "We've raised twice what our opponent has"
  - "Costs are half of what they were"

---

## Metrics Recognized

The system recognizes these quantifiable metrics:

### Economic
- GDP, deficit, debt, unemployment, inflation, growth
- Revenue, spending, budget, income, wages

### Social
- Poverty, enrollment, graduation, mortality, crime

### Environmental
- Temperature, emissions

### Political
- Approval, poll, votes, donations, fundraising

---

## Verification Workflow

For each comparative claim, the system generates **4 verification steps:**

### Step 1: Identify Metrics
Extract the two things being compared.

**Example:** "Our deficit is greater than the UK's GDP"
- Left metric: "Our deficit"
- Right metric: "the UK's GDP"

### Step 2: Look Up First Metric
Find the current value from authoritative sources.

**Sources:**
- Official government statistics
- Financial reports
- Central bank data
- International organizations (World Bank, IMF, OECD)

**Example:** US Federal deficit (FY2024) = $1.7 trillion

### Step 3: Look Up Second Metric
Find the comparison value from authoritative sources.

**Example:** UK GDP (2024) = $3.1 trillion (£2.5 trillion)

### Step 4: Perform Comparison
Verify the claimed relationship.

**Example:**
- Claim: "greater than"
- Actual: $1.7T vs $3.1T
- Result: **FALSE** (1.7T is NOT greater than 3.1T)

---

## How It Works

### Detection

The parser automatically detects comparative claims in `extractProvableFacts()`:

```javascript
const facts = parser.extractProvableFacts(text);

// Returns claims like:
{
  text: "Our deficit is greater than the UK's GDP",
  type: ["comparative-claim", "computational"],
  verification_type: "multi-step-comparative",
  comparison_type: "greater_than",
  metrics: ["deficit", "GDP"],
  verification_steps: [
    { step: 1, action: "identify_metrics", ... },
    { step: 2, action: "lookup_left", ... },
    { step: 3, action: "lookup_right", ... },
    { step: 4, action: "compare", ... }
  ]
}
```

### Storage

Comparative claims are stored in the `extracted_claims` table with:
- `claim_type` = "comparative_computational" (new claim type)
- `verification_type` = "multi-step-comparative"
- Full verification steps in JSON

---

## Test Results

From `test-comparative-claims.js`:

| Claim | Detected? | Type |
|-------|-----------|------|
| "Our annual deficit is greater than the GDP of the UK" | ✅ | greater_than |
| "Unemployment is lower than it was in 2019" | ✅ | less_than |
| "Inflation is higher than the EU average" | ✅ | greater_than |
| "Crime has doubled since 2020" | ✅ | multiple_of |
| "Our state has three times the poverty rate" | ✅ | ratio |
| "The budget exceeds last year's spending by 20%" | ✅ | exceeds |
| "Medicare spending trails inflation" | ✅ | trails |
| "The economy is doing well" | ❌ | Not comparative |

**Success rate:** 7/12 comparative claims detected correctly

---

## Verification Example: Full Workflow

### Claim
> "Our annual deficit is greater than the GDP of the UK."

### Automated Detection

```javascript
{
  is_comparative: true,
  comparison_type: "greater_than",
  comparison_phrase: "greater than",
  metrics: ["deficit", "GDP"],
  left_side: "Our annual deficit is",
  right_side: "the GDP of the UK",
  verification_steps: [...]
}
```

### Manual Verification (Following Generated Steps)

**Step 1: Identify metrics**
- Left: US federal annual deficit
- Right: UK GDP

**Step 2: Look up US deficit**
- Source: US Treasury Department, Congressional Budget Office
- FY 2024 deficit: **$1.7 trillion**
- URL: https://www.cbo.gov/

**Step 3: Look up UK GDP**
- Source: World Bank, Office for National Statistics (UK)
- 2024 GDP: **$3.1 trillion** (£2.5 trillion)
- URL: https://data.worldbank.org/

**Step 4: Compare**
- Claimed relationship: "greater than"
- Actual values: $1.7T vs $3.1T
- $1.7T > $3.1T? **NO**
- **Verdict: FALSE**

The US annual deficit ($1.7T) is **NOT** greater than UK GDP ($3.1T). UK GDP is approximately 1.8x larger than the US deficit.

---

## Special Cases

### 1. **Implicit Comparisons**

Some comparisons don't use explicit comparison words:

**Example:** "Voter turnout surpassed the 2016 election"
- Currently NOT detected (no metric + comparison pattern)
- **Improvement needed:** Add "surpassed" pattern matching

### 2. **Multiple Metrics**

**Example:** "Medicare spending trails inflation by 5 percentage points"
- Detected: ✅
- Metrics: spending, inflation
- Requires calculating the difference (5 percentage points)

### 3. **Percentage Comparisons**

**Example:** "The budget exceeds last year's spending by 20%"
- Detected: ✅
- Requires:
  1. Look up current budget
  2. Look up last year's spending
  3. Calculate: (current - last) / last × 100%
  4. Verify: result = 20%?

### 4. **Historical Comparisons**

**Example:** "Unemployment is lower than it was in 2019"
- Detected: ✅
- Requires looking up two time points:
  - Current unemployment rate
  - Unemployment rate in 2019

---

## Integration with Existing System

### Claim Types Table

New entry in `claim_types`:

```sql
INSERT INTO claim_types
  (type_name, verification_approach, description, requires_sources, typical_verification_time)
VALUES
  ('comparative_computational',
   'multi-step-comparative',
   'Comparative claims requiring lookup of multiple metrics and calculation/comparison of values',
   1,
   900);
```

**Typical verification time:** 900 seconds (15 minutes)
- Longer than standard claims due to multiple lookups

### API Response

When you call `/api/fact-checking/:id/extract-claims`, comparative claims are included:

```json
{
  "id": 123,
  "claim_text": "Our deficit is greater than the UK's GDP",
  "claim_type": "comparative_computational",
  "verification_type": "multi-step-comparative",
  "patterns_matched": "[\"comparative-claim\", \"computational\"]",
  "status": "pending"
}
```

---

## Best Practices for Fact-Checkers

### 1. **Use Consistent Time Periods**

When comparing, ensure you're using data from the same time period:
- ❌ 2024 deficit vs 2023 GDP
- ✅ 2024 deficit vs 2024 GDP (or both from 2023)

### 2. **Check Currency/Units**

Ensure metrics use the same units:
- Convert £ to $ (or vice versa)
- Ensure both are in millions/billions/trillions

### 3. **Document Assumptions**

If exact data isn't available:
- Use most recent available data
- Document the date of each metric
- Note any estimates or projections used

### 4. **Consider Context**

Some comparisons need context:
- "Deficit greater than GDP" - which year? Whose GDP?
- "Crime doubled" - from when? What type of crime?

### 5. **Be Precise About Ratings**

For comparative claims:
- **TRUE** - Relationship holds exactly
- **MOSTLY TRUE** - Relationship holds with rounding/minor differences
- **HALF TRUE** - One metric correct, comparison wrong
- **FALSE** - Relationship does not hold

---

## Future Enhancements

### 1. **Automated Lookup**

Integrate with APIs to automatically fetch metrics:
- Federal Reserve API (FRED) for economic data
- World Bank API for international data
- Census Bureau API for demographic data

### 2. **Smart Source Suggestions**

Based on detected metrics, suggest specific sources:
- "deficit" → CBO, Treasury Department
- "GDP" → BEA, World Bank
- "unemployment" → BLS, Bureau of Labor Statistics

### 3. **Calculation Engine**

Automatically perform comparisons when both values are found:
- Fetch US deficit → $1.7T
- Fetch UK GDP → $3.1T
- Compare: 1.7 > 3.1? → FALSE
- Return verdict automatically

### 4. **Historical Data**

Track historical values to verify "doubled since 2020" style claims:
- Look up 2020 value
- Look up current value
- Calculate ratio
- Verify claimed relationship

---

## Summary

✅ **System now detects** 7 types of comparative claims
✅ **Generates verification steps** automatically
✅ **Stores claim type** as "comparative_computational"
✅ **Typical verification time** ~15 minutes (vs 5 min for standard claims)

**Coverage:**
- Greater/less than comparisons
- Ratios and multiples
- Exceeds/trails relationships
- Temporal comparisons

**Next steps:**
- Test on real press releases
- Integrate automated data lookup APIs
- Add calculation engine for automatic verification

Run test with: `node test-comparative-claims.js`
