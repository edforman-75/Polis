# V4 Transcript Package Import Summary

**Date**: October 15, 2025
**Package**: `spanberger_transcripts_pkg_v4.zip`
**Status**: ✅ Successfully imported

---

## Overview

Updated the transcript-tools manifest from v3 (23 placeholder entries) to v4 (8 concrete sources with real URLs), fetched transcripts, and imported them into the speeches knowledgebase.

---

## Sources Added in V4

### 1. C-SPAN Virginia Gubernatorial Debate (Oct 9, 2025)
- **URL**: https://www.c-span.org/program/campaign-2026/virginia-gubernatorial-debate/666941
- **Type**: `broadcast_event` / `cspan_program`
- **Status**: ⚠️ Placeholder (requires manual C-SPAN export)
- **Notes**: Full debate transcript available via C-SPAN export tools
- **Speech File**: `virginia-gubernatorial-debate-cspan.md`

### 2. C-SPAN Closing Remarks Clip
- **URL**: https://www.c-span.org/video/?c4755629%2Fabigail-spanberger-closing-remarks=
- **Type**: `clip` / `cspan_program`
- **Status**: ⚠️ Placeholder (requires manual C-SPAN export)
- **Notes**: Short quotable segment from debate
- **Speech File**: `abigail-spanberger-closing-remarks-user-clip-cspan.md`

### 3. WTVR CBS6 USPS Survey Story (May 22, 2024)
- **URL**: https://www.wtvr.com/news/local-news/abigail-spanberger-usps-issues-may-22-2024
- **Type**: `interview_text` / `news_html`
- **Status**: ✅ **FULL CONTENT IMPORTED**
- **Topics**: USPS, constituent-services
- **Speech File**: `hundreds-of-virginians-still-having-usps-issues-spanberger-survey-wtvr.md`

**Key Content**:
- Survey results: 1,800+ Virginia responses on USPS mail delays
- Quotes on Postmaster DeJoy's consolidation plan failing to create efficiencies
- Sandston facility becoming regional processing center causing delays
- Virginia ranking 3rd worst in nation for mail service

### 4. NBC12 VCU Poll Story (Sep 10, 2025)
- **URL**: https://www.nbc12.com/2025/09/10/vcu-poll-shows-narrowing-gap-between-democratic-republican-candidates-va-races/
- **Type**: `interview_text` / `news_html`
- **Status**: ✅ **FULL CONTENT IMPORTED**
- **Topics**: polling, governor-2025
- **Speech File**: `vcu-poll-shows-narrowing-gap-in-va-races-includes-spanberger-nbc12.md`

**Key Content**:
- VCU poll: Spanberger 49% vs. Earle-Sears 40% (9-point lead)
- Campaign strategy quotes from both candidates
- Larry Sabato analysis on polling margins and voter turnout
- Top voter issues: cost of living, reproductive rights, immigration, education

---

## Sources Retained from V3

### 5. TED Talk: "How to Connect With People Who Are Different Than You"
- **URL**: https://www.ted.com/talks/abigail_spanberger_how_to_connect_with_people_who_are_different_than_you/transcript
- **Type**: `transcript` / `web_html`
- **Status**: ⚠️ Empty (needs different scraping approach)

### 6. House Agriculture Opening Statement - Conservation Subcommittee
- **URL**: https://democrats-agriculture.house.gov/news/documentsingle.aspx?DocumentID=2793
- **Type**: `prepared_remarks` / `web_html`
- **Status**: ✅ **FULL CONTENT IMPORTED**
- **Topics**: agriculture, conservation, house-hearings
- **Speech File**: `opening-statement-house-agriculture-democrats-conservation-subcommittee.md`

**Key Content**:
- Farm Bill Summit in Virginia (100+ attendees)
- NRCS conservation programs (EQIP oversubscription issues)
- Increased TSP Access Act (bipartisan with Chairman Baird)
- Technical Service Provider shortage impacting farmer enrollment

### 7. YouTube Rally Speech
- **URL**: https://www.youtube.com/watch?v=Oda1PqOxLwI
- **Type**: `video_cc` / `youtube_cc`
- **Status**: ⚠️ Module error (venv activation issue)
- **Speech File**: `full-speech-rally-in-virginia-youtube.md`

### 8. House Agriculture Hearing PDF
- **URL**: https://democrats-agriculture.house.gov/uploadedfiles/117-21_-_47307.pdf
- **Type**: `hearing_transcript_pdf` / `pdf`
- **Status**: ❌ Failed (requires `pdftotext` from poppler-utils)

---

## Workflow Executed

```bash
# 1. Update manifest
cp /tmp/manifest.json transcript-tools/manifest.json

# 2. Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install requests beautifulsoup4 youtube-transcript-api

# 3. Fetch transcripts
cd transcript-tools
python3 fetch_and_extract.py
# Result: 7/8 sources fetched (PDF needs pdftotext)

# 4. Import to speeches
python3 import_to_speeches.py
# Result: 6 speeches imported (1 skipped - empty TED)

# 5. Regenerate index
cd ..
python3 generate_speech_index.py
# Result: 6 speeches indexed
```

---

## Import Results

| Source | Status | Content Type | Speech File |
|--------|--------|--------------|-------------|
| House Ag Statement | ✅ Full | Prepared remarks | `opening-statement-house-agriculture-democrats...md` |
| WTVR USPS Survey | ✅ Full | News article | `hundreds-of-virginians-still-having-usps-issues...md` |
| NBC12 VCU Poll | ✅ Full | News article | `vcu-poll-shows-narrowing-gap-in-va-races...md` |
| C-SPAN Debate | ⚠️ Placeholder | Manual export needed | `virginia-gubernatorial-debate-cspan.md` |
| C-SPAN Clip | ⚠️ Placeholder | Manual export needed | `abigail-spanberger-closing-remarks-user-clip...md` |
| YouTube Rally | ⚠️ Placeholder | Module error | `full-speech-rally-in-virginia-youtube.md` |
| TED Talk | ⚠️ Skipped | Empty content | *(not imported)* |
| House Ag PDF | ❌ Failed | Missing pdftotext | *(not fetched)* |

**Summary**: 3 speeches with full content, 3 with placeholders, 1 skipped, 1 failed

---

## Speeches Ready for Consistency Checking

### 1. House Agriculture Conservation Statement
**Location**: Washington, DC (House of Representatives)
**Topics**: Agriculture, conservation, farm bill
**Use Cases**:
- Verify consistency on NRCS program positions
- Check Farm Bill priorities align with press releases
- Validate bipartisan legislation claims

**Key Quotes**:
> "These programs are very popular across all regions and commodities, so we must continue to work with partners and leverage resources to help farmers, ranchers, and foresters continue their work as the original conservationists."

### 2. WTVR USPS Survey Coverage (May 22, 2024)
**Topics**: Constituent services, USPS, government accountability
**Use Cases**:
- Track USPS criticism consistency over time
- Verify constituent survey data claims
- Check positions on Postmaster General DeJoy

**Key Quotes**:
> "From what I've seen, I think that Postmaster General [Louis] DeJoy's plan for consolidation, we haven't yet seen evidence that this has created the efficiencies that he set out to realize."

### 3. NBC12 VCU Poll Coverage (Sep 10, 2025)
**Topics**: Campaign strategy, polling, voter turnout
**Use Cases**:
- Verify campaign messaging consistency
- Track polling narrative over time
- Compare issue prioritization with policy positions

**Key Quotes**:
> "We're making sure that people aren't taking anything for granted. I'm certainly not taking anything for granted."

---

## Next Steps

### Immediate (Manual Processing Required)

1. **C-SPAN Transcripts**:
   - Visit C-SPAN program pages
   - Export transcript/captions per `cspan_export_helper.md`
   - Run `cspan_parse.py` to normalize format
   - Update speech markdown files with actual content

2. **YouTube Rally Speech**:
   - Fix venv activation in fetch script
   - Re-run fetch for YouTube source
   - Or manually download captions via youtube-dl

3. **TED Talk**:
   - Investigate why scraping returned empty content
   - May need JavaScript rendering (Playwright/Selenium)
   - Or manually copy transcript from TED page

### Optional Enhancements

1. **PDF Support**:
   ```bash
   brew install poppler  # Installs pdftotext
   ```
   Then re-run fetch for House Ag hearing PDF

2. **Additional Sources**:
   - Add more URLs to manifest.json
   - Focus on recent campaign appearances
   - Local TV station interviews (WAVY, WDBJ7, WHSV, etc.)

3. **Automation**:
   - Create wrapper script to activate venv automatically
   - Add scheduler for periodic fetching
   - Set up CI/CD for transcript updates

---

## Files Modified/Created

### Modified
- `transcript-tools/manifest.json` - Updated from v3 to v4 (8 entries)
- `transcript-tools/samples/records.jsonl` - 7 fetched records

### Created
- `speeches/opening-statement-house-agriculture-democrats-conservation-subcommittee.md`
- `speeches/hundreds-of-virginians-still-having-usps-issues-spanberger-survey-wtvr.md`
- `speeches/vcu-poll-shows-narrowing-gap-in-va-races-includes-spanberger-nbc12.md`
- `speeches/virginia-gubernatorial-debate-cspan.md` (placeholder)
- `speeches/abigail-spanberger-closing-remarks-user-clip-cspan.md` (placeholder)
- `speeches/full-speech-rally-in-virginia-youtube.md` (placeholder)
- `venv/` - Python virtual environment with dependencies

### Updated
- `/Users/edf/Polis/spanberger-clone/api/speeches.json` - Regenerated index (6 speeches)

---

## Usage Examples

### Browse Speeches
```bash
# Start local server (if not already running)
cd /Users/edf/Polis/spanberger-clone
python3 -m http.server 8888

# Open browser
open http://localhost:8888/speeches/
```

### Search for USPS Content
```bash
cd /Users/edf/Polis/training-data/spanberger-campaign
grep -r "USPS" speeches/
grep -r "DeJoy" speeches/
```

### View Speech in Browser
- Navigate to: http://localhost:8888/speeches/
- Click "Hundreds of Virginians still having USPS issues"
- Full article with formatted markdown

### Add More Transcripts
```bash
# Edit manifest
nano transcript-tools/manifest.json

# Fetch new sources
cd transcript-tools
source ../venv/bin/activate
python3 fetch_and_extract.py

# Import to speeches
python3 import_to_speeches.py

# Regenerate index
cd ..
python3 generate_speech_index.py
```

---

## Integration with Existing Tools

### Consistency Checker
The speeches are now available in the consistency checking system:
- View speeches corpus: `/speeches/`
- Browse by topic: Filter dropdown
- Search across all content: Search bar
- Compare with press releases for messaging alignment

### Message Analysis
Speeches can be referenced when analyzing campaign messages:
- Check USPS positions against congressional record
- Verify agriculture policy consistency
- Track campaign narrative evolution

### Source Citation
All speeches include source URLs for verification:
- `**Source**: https://www.wtvr.com/news/...`
- Attribution to original outlets maintained
- License notes included per manifest

---

## Lessons Learned

1. **Venv Activation**: Virtual environment activation doesn't persist across bash commands - need wrapper script or single-command execution

2. **C-SPAN Manual Export**: C-SPAN requires manual transcript export per their terms - automated scraping returns placeholder text

3. **TED Scraping**: TED Talk page may require JavaScript rendering - BeautifulSoup alone insufficient

4. **PDF Dependencies**: PDF extraction needs external tool (`pdftotext`) - not Python-only solution

5. **News Scraping Success**: Local news sites (WTVR, NBC12) worked well with BeautifulSoup paragraph extraction

---

## Conclusion

**Successfully imported 3 speeches with full content** from the v4 transcript package, adding valuable knowledgebase material for consistency checking. The workflow is now established for future transcript imports.

**Main value delivered**:
- House Agriculture prepared remarks show official conservation policy positions
- WTVR article provides constituent services messaging (USPS)
- NBC12 article shows campaign strategy and voter engagement approach

**Next priority**: Manually export C-SPAN debate transcript (Oct 9, 2025) to capture full gubernatorial debate content - likely most valuable source for campaign consistency checking.
