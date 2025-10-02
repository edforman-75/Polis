# Spanberger Press Release Testing Summary

## Overview
Tested parser on 7 real-world Abigail Spanberger campaign press releases covering diverse formats.

## Test Results

### Release #1: Government Shutdown Statement
**Format:** Statement format
**Date:** Oct 01, 2025
**Results:**
- Dateline: ✅ RICHMOND, Va
- Quotes: 4/4 found, 4/4 attributed ✅
- **Status: ✅ PASS** (Fixed by Improvement #006)

### Release #2: Hampton Convocation Speech
**Format:** Speech/event coverage with narrative attribution
**Date:** Sep 29, 2025
**Results:**
- Dateline: ✅ HAMPTON, Va - Sep 29, 2025
- Quotes: 1/1 found, 1/1 attributed ✅
- **Status: ✅ PASS** (Fixed by Improvement #007)

### Release #3: Housing Data
**Format:** Spokesperson quote + data quote
**Date:** Sep 25, 2025
**Results:**
- Dateline: ✅ RICHMOND, Va - Sep 25, 2025
- Quotes: 2 found (1 data quote, 1 spokesperson)
- Attribution: 1/2 (spokesperson attributed, data quote not)
- **Status: ⚠️ PARTIAL** (Data quote is design question)

### Release #4: AFGE Endorsement
**Format:** Third-party endorsement with multiple speakers
**Date:** Sep 26, 2025
**Results:**
- Dateline: ✅ RICHMOND, Va - Sep 26, 2025
- Quotes: 2/2 found, 2/2 attributed ✅
- **Status: ✅ PASS**

### Release #5: TV Ad Announcement
**Format:** Ad announcement with ad title
**Date:** Sep 30, 2025
**Results:**
- Dateline: ✅ RICHMOND, Va - Sep 30, 2025
- Quotes: 2 found (1 ad title, 1 spoken quote)
- Attribution: 1/2 (spoken quote attributed, ad title not)
- **Status: ⚠️ PARTIAL** (Ad title is design question)

### Release #6: Fire Fighters Endorsement
**Format:** Endorsement with multiple speakers
**Date:** July 01, 2025
**Results:**
- Dateline: ✅ RICHMOND, Va - July 01, 2025
- Quotes: 2/2 found, 2/2 attributed ✅
- **Status: ✅ PASS**

### Release #7: Fish Bowl Classic Parade
**Format:** Event coverage (ICYMI)
**Date:** September 29, 2025
**Results:**
- Dateline: ✅ NORFOLK, Va - September 29, 2025
- Quotes: 1/1 found, 1/1 attributed ✅
- **Status: ✅ PASS**

## Overall Statistics

**Dateline Extraction:**
- Success Rate: 7/7 (100%) ✅

**Quote Detection:**
- Total quotes found: 14
- Spoken quotes: 12
- Non-spoken quotes (data/titles): 2

**Quote Attribution:**
- Spoken quotes attributed: 12/12 (100%) ✅
- Non-spoken quotes: 0/2 (0%) - **Design question**

**Overall Pass Rate:**
- Full Pass: 5/7 (71.4%)
- Partial Pass: 2/7 (28.6%)
- Fail: 0/7 (0%)

## Format Coverage

✅ **Statement format** - "X released the following statement"
✅ **Speech/event coverage** - Narrative attribution with "told"
✅ **Third-party endorsements** - Multiple speakers
✅ **Spokesperson quotes** - Campaign staff quotes
✅ **Event coverage (ICYMI)** - "In case you missed it" format
⚠️ **Data quotes** - Quoted statistics from reports
⚠️ **Ad titles** - Quoted names of campaigns/ads

## Key Findings

### Strengths
1. **100% dateline extraction** - Parser reliably finds location and date
2. **100% spoken quote attribution** - All person-spoken quotes properly attributed
3. **Multi-format support** - Handles diverse real-world press release formats
4. **No false negatives** - Parser finds all actual quotes
5. **No regressions** - Existing test suites still pass

### Design Questions

**Question #1: Quoted Data/Statistics**
- Example: `"four out of 10 people who are renting in Virginia..."`
- Context: Data from reports, not person speaking
- **Decision needed:** Extract as quote or filter out?

**Question #2: Quoted Titles/Names**
- Example: `"Stand With Her"` (ad title)
- Context: Names of campaigns, ads, initiatives
- **Decision needed:** Extract as quote or filter out?

### Current Approach
Parser extracts **all quoted text** regardless of whether it's spoken by a person or is a title/data reference. This provides maximum information extraction but may require filtering in the application layer based on use case.

## Improvements Deployed

**#006: Statement Format Attribution** ✅
- Pattern: "X released the following statement"
- Impact: 0% → 100% quote attribution in statement format

**#007: Narrative Attribution** ✅
- Pattern: "She told students:" with smart pronoun resolution
- Impact: 0% → 100% quote attribution in speech coverage

**#008: Subhead Detection** ✅
- Detects messaging subheads between headline and dateline
- Common in professional campaign communications

## Test Coverage

**Test Suites:**
1. Jane Smith regression (2 releases) - ✅ Passing
2. Hybrid releases (25 releases) - ✅ Passing
3. Spanberger suite (7 releases) - ✅ 100% dateline, 100% spoken quotes

**Total Releases Tested:** 34

## Recommendations

1. **Deploy current parser** - Solid B+/A- performance on real-world content
2. **Application-level filtering** - Let app decide whether to show data quotes/titles
3. **Future enhancement** - Add quote type classification (spoken vs. data vs. title)
4. **Monitor edge cases** - Continue testing on diverse campaign sources

## Grade: A-

**Before Spanberger testing:** B+ (template-based)
**After Spanberger testing:** A- (real-world validated)

Parser demonstrates strong real-world performance with 100% success on core extraction tasks (datelines, spoken quotes). Minor design questions around non-spoken quoted text don't impact core functionality.
