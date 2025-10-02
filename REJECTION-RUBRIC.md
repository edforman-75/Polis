# Press Release Rejection Rubric

## Quick Reference

**REJECTION THRESHOLD: Quality Score < 40**

## Critical Errors

These errors have the highest point deductions and are most likely to trigger rejection:

| Error | Points | Example | Fix |
|-------|--------|---------|-----|
| **No quotes** | -40 | No `"quoted text"` found | Add: `"Quote," said Name.` |
| **No content** | -35 | Body < 100 chars | Expand body to 200+ chars |
| **No header** | -30 | Missing FOR IMMEDIATE RELEASE | Add as first line |
| **No headline** | -25 | Headline < 10 chars | Add descriptive headline |

## Rejection Calculator

### Scenario 1: Empty Press Release
```
Starting score: 100
- Missing header: -30
- Missing headline: -25
- No quotes: -40
- No content: -35
= FINAL SCORE: -30 (treated as 0)
```
**Result: REJECTED** 🚫

### Scenario 2: Minimal Valid Release
```
FOR IMMEDIATE RELEASE

WASHINGTON, D.C. — Oct 2, 2025

Senator Smith Announces Bill

Senator Jane Smith announced a new infrastructure bill today that will
invest billions in roads and bridges across the country.

"This bill creates jobs," said Jane Smith.
```

```
Starting score: 100
- Has header: -0
- Has headline: -0
- Has dateline: -0
- Has 1 quote: -5 (few quotes warning)
- Content ~150 chars: -5 (short content warning)
= FINAL SCORE: 90
```
**Result: ACCEPTED (Excellent)** ✅

### Scenario 3: Borderline Case
```
FOR IMMEDIATE RELEASE

Campaign Event

Join us for a rally on Thursday. We'll discuss important issues.

More details to come.
```

```
Starting score: 100
- Has header: -0
- Has headline: -0
- No quotes: -40
- Content ~60 chars: -35 (insufficient)
- No dateline: -15
= FINAL SCORE: 10
```
**Result: REJECTED** 🚫

### Scenario 4: Poor But Accepted
```
FOR IMMEDIATE RELEASE

Smith Campaign Launches New Ad

The Smith campaign released a new television advertisement today focusing
on healthcare reform. The ad will air in major markets starting Monday.

"Healthcare is a right," the ad states.

Campaign officials say the ad is part of a larger media strategy.
```

```
Starting score: 100
- Has header: -0
- Has headline: -0
- Has content: -0
- Has 1 quote: -5 (few quotes)
- 1 unknown speaker: -5
- No dateline: -15
= FINAL SCORE: 75
```
**Result: ACCEPTED (Fair)** ⚠️

## What Triggers Rejection?

### Guaranteed Rejection (Score will be < 40)

✗ **No quotes + No content** = -75 points
  - Even with perfect header/headline, score = 25

✗ **No quotes + No header + Short content** = -75 points
  - Score = 25

### Likely Rejection (Usually < 40)

⚠️ **No quotes + Missing dateline + Few other issues**
  - No quotes (-40) + No dateline (-15) = -55
  - Need score > 60 to avoid rejection
  - One more critical error triggers rejection

⚠️ **No content + No header + Missing dateline**
  - -35 + -30 + -15 = -80
  - Score = 20, REJECTED

### Will NOT Trigger Rejection

✓ **Missing dateline only** = -15 points (Score: 85)

✓ **Unknown speakers only** = -5 to -20 points (Score: 80-95)

✓ **Few quotes only** = -5 points (Score: 95)

✓ **Short content only** = -5 points (Score: 95)

## Rejection Formulas

### Two Critical Errors

Any combination of 2+ critical errors likely triggers rejection:

```
no_quotes (-40) + no_content (-35) = -75 → REJECTED
no_quotes (-40) + no_header (-30) = -70 → LIKELY REJECTED
no_content (-35) + no_header (-30) = -65 → LIKELY REJECTED
```

### Three or More Issues

```
no_quotes (-40) + no_dateline (-15) + unknowns (-20) = -75 → REJECTED
no_content (-35) + no_header (-30) + no_dateline (-15) = -80 → REJECTED
```

## How to Avoid Rejection

### Minimum Requirements (Score: ~60-70)

1. ✅ Include "FOR IMMEDIATE RELEASE"
2. ✅ Add a headline
3. ✅ Include at least 1 quote with attribution
4. ✅ Write 150+ characters of body text
5. ✅ Add a dateline (location and date)

**Result**: Score ~85 (Good) ✅

### Best Practices (Score: 90+)

1. ✅ FOR IMMEDIATE RELEASE header
2. ✅ Clear, descriptive headline
3. ✅ Dateline with location and date
4. ✅ 2-3 quotes with full attribution
5. ✅ 200+ characters of meaningful content
6. ✅ All speakers properly identified

**Result**: Score 95-100 (Excellent) ✅

## Special Cases

### News Articles (Not Press Releases)

If content doesn't include "FOR IMMEDIATE RELEASE":
```
- Missing header: -30
- Usually no official quotes: -40
= Automatic -70 points
```
**Likely Score: 30 or less → REJECTED**

### Event Announcements

Minimal event announcements often fail:
```
"Join us Thursday at 6pm"
```
- No quotes: -40
- No real content: -35
- Usually no dateline: -15
**Score: 10 → REJECTED**

### Social Media Posts

Short posts fail validation:
```
"Excited to announce our new bill! #Congress"
```
- No header: -30
- No quotes: -40
- No content: -35
**Score: -5 (0) → REJECTED**

## Adjustment Guidelines

If you need to adjust the rejection threshold:

**More Strict** (Reject more releases):
- Set threshold to 60 (only accept good/excellent)
- Increase critical error deductions

**More Lenient** (Reject fewer releases):
- Set threshold to 25 (only reject worst cases)
- Decrease critical error deductions

Current setting in code:
```javascript
if (validation.quality_score < 40) {
    validation.should_reject = true;
}
```

## Summary

**A press release is REJECTED if**:
- Score < 40 points
- Usually requires 2+ critical errors
- Missing quotes + something else = rejection
- Missing content + something else = rejection

**The safest way to avoid rejection**:
Include all 6 basics:
1. FOR IMMEDIATE RELEASE
2. Dateline
3. Headline
4. At least 1 quote
5. Speaker attribution
6. 200+ char body

This guarantees a score of 90+ ✅
