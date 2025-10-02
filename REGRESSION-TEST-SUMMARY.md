# Regression Test Summary
**Date**: October 1, 2025
**Changes**: Multi-paragraph quote detection + headline/subhead filtering

## Test Results

### ✅ Sherrill Releases (7 total)
**Files**: `sherrill_01` through `sherrill_07`

| File | Headlines | Dates | Locations | Quotes | Status |
|------|-----------|-------|-----------|--------|--------|
| sherrill_01 | ✅ | ✅ | ✅ BLOOMFIELD, NJ | 4 | PASS |
| sherrill_02 | ✅ | ✅ | ✅ UNION, NJ | 1 | PASS |
| sherrill_03 | ✅ | ✅ | ✅ BLOOMFIELD, NJ | 2 | PASS |
| sherrill_04 | ✅ | ✅ | ✅ BLOOMFIELD, NJ | 13 | PASS |
| sherrill_05 | ✅ | ✅ | ✅ BLOOMFIELD, NJ | 4 | PASS |
| sherrill_06 | ✅ | ✅ | ✅ WEST CALDWELL, NJ | N/A | PASS |
| sherrill_07 | ✅ | ✅ | ✅ BLOOMFIELD, NJ | 1 (multi-para) | PASS |

**Key Win**: sherrill_07 now extracts 1 properly combined multi-paragraph quote instead of 2 broken quotes

### ✅ Spanberger Releases (4 total)
**Status**: All datelines correct, 7 quotes extracted

| Location | Status |
|----------|--------|
| RICHMOND, Va | ✅ |
| HAMPTON, Va - Sep 29, 2025 | ✅ |
| RICHMOND, Va - Sep 25, 2025 | ✅ |
| RICHMOND, Va - Sep 26, 2025 | ✅ |

### ✅ Baseline Regression Tests (2 tests)
**Files**: `test-regression.js`

| Test | Headline | Dateline | Quotes | Speakers | Status |
|------|----------|----------|--------|----------|--------|
| Detroit Battery Plant | ✅ | ✅ | 2 | James Wilson, Jennifer Martinez | PASS |
| Healthcare Expansion | ✅ | ✅ | 1 | Sarah Smith | PASS |

### ✅ Hybrid Releases (spot check: 3 of 25)
**Files**: `hybrid_release_01`, `hybrid_release_10`, `hybrid_release_20`

All extracting quotes correctly:
- Quote count: 1 per file
- Speaker: Alex Rivera
- Attribution: Working

## Changes Made

### 1. Multi-Paragraph Quote Detection
- **Method**: `extractMultiParagraphQuotes()`
- **Logic**: Count quote marks (1 = start, 2+ = complete)
- **Impact**: Fixes journalism-style multi-paragraph quotes

### 2. Headline/Subhead Filtering
- **Method**: Modified `extractQuotes()` signature
- **Logic**: Filter out quotes that appear in headlines or subheads
- **Impact**: Prevents false positives like "Tunnel Obsessed Congresswoman"

### 3. Attribution Extraction
- **Method**: `extractAttributionFromText()`
- **Logic**: Parse `," said Speaker.` patterns
- **Impact**: Better speaker detection for multi-para quotes

## Summary

**Total Tests Run**: 16 press releases
**Passed**: 16 ✅
**Failed**: 0
**Regressions**: 0

### No Regressions Detected
- All existing quote extraction still working
- Dateline extraction unchanged
- Headline/subhead extraction unchanged
- New multi-paragraph detection doesn't break single-paragraph quotes

### New Functionality Working
- Multi-paragraph journalism quotes properly combined
- False positive quotes from headlines/subheads filtered
- Attribution extraction improved for complex formats
