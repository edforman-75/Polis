# Transcript Import Workflow

**Complete guide for importing speeches from transcripts (C-SPAN, YouTube, PDFs, etc.)**

---

## Overview

The transcript package v3 provides tools to fetch and import speeches from:
- 📺 **C-SPAN** programs
- 🎬 **YouTube** videos (with captions)
- 📄 **PDF** transcripts (hearings, panels)
- 🌐 **Web pages** (TED talks, committee statements)
- 📡 **TV stations** (CBS6, NBC12, etc.)
- 🏛️ **Universities** (UVA, VCU, VT, W&M)

## Quick Start

### Full Workflow

```bash
# 1. Navigate to transcript tools
cd /Users/edf/Polis/training-data/spanberger-campaign/transcript-tools

# 2. Install dependencies (one-time setup)
pip install requests beautifulsoup4 youtube-transcript-api

# 3. Edit manifest.json to add actual URLs

# 4. Fetch transcripts
python3 fetch_and_extract.py

# 5. Import to speeches
python3 import_to_speeches.py

# 6. Regenerate index
cd ..
python3 generate_speech_index.py

# 7. View in browser
open http://localhost:8888/speeches/
```

---

## Detailed Steps

### Step 1: Install Dependencies

**One-time setup**:

```bash
# Basic dependencies
pip install requests beautifulsoup4

# For YouTube captions
pip install youtube-transcript-api

# For PDF extraction (optional but recommended)
brew install poppler  # Mac
# or
sudo apt-get install poppler-utils  # Linux
```

### Step 2: Update Manifest

**Edit**: `/Users/edf/Polis/training-data/spanberger-campaign/transcript-tools/manifest.json`

The manifest contains placeholder entries. Update with actual URLs:

#### Example: YouTube Video

```json
{
  "id": "yt-rally-virginia-full-speech",
  "title": "FULL SPEECH: Abigail Spanberger rallies in Virginia",
  "speaker": "Abigail Spanberger",
  "date": "2024-10-15",
  "type": "video_cc",
  "source_kind": "youtube_cc",
  "source_url": "https://www.youtube.com/watch?v=Oda1PqOxLwI",
  "topics": ["campaign-speech", "rally"]
}
```

**Find the URL**:
1. Search YouTube for "Abigail Spanberger speech"
2. Open the video
3. Copy the `watch?v=...` URL
4. Paste into `source_url`

#### Example: C-SPAN Program

```json
{
  "id": "cspan-floor-speech-healthcare",
  "title": "Floor Speech on Healthcare Reform",
  "speaker": "Abigail Spanberger",
  "date": "2024-09-20",
  "type": "floor_speech",
  "source_kind": "cspan_program",
  "source_url": "https://www.c-span.org/video/?123456-1/...",
  "topics": ["healthcare", "congress"]
}
```

**Find the URL**:
1. Visit https://www.c-span.org/person/abigail-spanberger/116283/
2. Browse appearances
3. Click on specific program
4. Copy the full URL

#### Example: PDF Transcript

```json
{
  "id": "house-ag-hearing-conservation",
  "title": "House Agriculture Hearing - Conservation",
  "speaker": "Abigail Spanberger (participant)",
  "date": "2024-08-15",
  "type": "hearing_transcript_pdf",
  "source_kind": "pdf",
  "source_url": "https://example.gov/hearing-transcript.pdf",
  "topics": ["agriculture", "conservation"]
}
```

### Step 3: Fetch Transcripts

```bash
cd /Users/edf/Polis/training-data/spanberger-campaign/transcript-tools
python3 fetch_and_extract.py
```

**What this does**:
- Reads `manifest.json`
- Downloads content from each URL
- Extracts text from HTML/PDF
- Fetches YouTube captions
- Saves results to `samples/records.jsonl`

**Output**:
```
Fetching transcripts...
✓ ted-connecting-differences (web_html)
✓ yt-rally-virginia-full-speech (youtube_cc)
✓ house-ag-hearing-117-21 (pdf)
...
Saved 12 records to samples/records.jsonl
```

### Step 4: Special Handling - C-SPAN

C-SPAN requires manual export (their API has restrictions).

**Follow the guide**:
```bash
cat cspan_export_helper.md
```

**Process**:
1. Visit C-SPAN video page
2. Click on "Transcript" tab
3. Copy the transcript text OR download .srt captions
4. Save to file: `cspan_transcript.txt`

**Parse the transcript**:
```bash
python3 cspan_parse.py < cspan_transcript.txt > parsed.txt
```

**Manually add to records.jsonl**:
```bash
cat >> samples/records.jsonl <<'EOF'
{"id": "cspan-floor-speech", "title": "Floor Speech on Healthcare", "text": "...", "date": "2024-09-20", "source_url": "..."}
EOF
```

### Step 5: Import to Speeches

```bash
python3 import_to_speeches.py
```

**What this does**:
- Reads `samples/records.jsonl`
- Converts each record to speech markdown
- Extracts metadata (title, date, venue, location)
- Auto-detects event type
- Saves to `/Users/edf/Polis/training-data/spanberger-campaign/speeches/`

**Output**:
```
📋 Loaded manifest with 25 entries
📄 Found 12 transcript records

📝 Importing: ted-connecting-differences
   ✅ Saved: how-to-connect-with-people-who-are-different-than-you.md

📝 Importing: yt-rally-virginia-full-speech
   ✅ Saved: full-speech-abigail-spanberger-rallies-in-virginia.md

...

✅ Successfully imported: 12 speeches
📁 Speeches saved to: /Users/edf/Polis/training-data/spanberger-campaign/speeches/
```

### Step 6: Regenerate Index

```bash
cd /Users/edf/Polis/training-data/spanberger-campaign
python3 generate_speech_index.py
```

**Output**:
```
Found 12 speech files in corpus

✅ Generated index with 12 speeches
📁 Output: /Users/edf/Polis/spanberger-clone/api/speeches.json

📣 Sample speech:
   Title: How to Connect With People Who Are Different Than You
   Date: 2024-10-15
   Location: Online
   Topics: communication, governance
```

### Step 7: View in Browser

```bash
open http://localhost:8888/speeches/
```

Your imported speeches are now:
- ✅ Searchable by content
- ✅ Filterable by topic
- ✅ Sortable by date
- ✅ Ready for consistency checking

---

## Source Type Reference

| Source Kind | Description | Example |
|-------------|-------------|---------|
| `youtube_cc` | YouTube video with captions | Campaign rally speech |
| `cspan_program` | C-SPAN video/transcript | Floor speech, hearing |
| `pdf` | PDF transcript | Committee hearing PDF |
| `web_html` | Web page with text | TED talk transcript |
| `station_youtube_cc` | TV station YouTube | CBS6, NBC12 clips |
| `university_event` | University recordings | UVA, VCU events |

---

## Manifest Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (slug) |
| `title` | Yes | Speech/event title |
| `speaker` | Yes | "Abigail Spanberger" or descriptive |
| `date` | No | ISO date (YYYY-MM-DD) |
| `type` | Yes | Content type (see below) |
| `source_kind` | Yes | Source type (see above) |
| `source_url` | Yes | Full URL to content |
| `topics` | No | Array of topic tags |
| `license_note` | No | Usage restrictions note |
| `notes` | No | Additional context |

**Content Types**:
- `transcript` - Full speech transcript
- `prepared_remarks` - Prepared statement
- `floor_speech` - Congressional floor speech
- `hearing_transcript_pdf` - Committee hearing
- `panel_transcript_pdf` - Panel discussion
- `video_cc` - Video with captions/subtitles
- `appearance_index` - List of appearances

---

## Troubleshooting

### "No records found in records.jsonl"

**Problem**: The file is empty

**Solutions**:
1. Check if `fetch_and_extract.py` ran successfully
2. Verify URLs in `manifest.json` are valid
3. Check dependencies are installed
4. Run with verbose output: `python3 fetch_and_extract.py -v`

### "YouTube transcript not available"

**Problem**: Video doesn't have captions

**Solutions**:
1. Check if video has CC button
2. Try English auto-generated captions
3. Use C-SPAN or other source if available
4. Manually transcribe if critical

### "PDF extraction failed"

**Problem**: pdftotext not installed

**Solutions**:
```bash
# Mac
brew install poppler

# Linux
sudo apt-get install poppler-utils

# Verify installation
which pdftotext
```

### "URL returns 403/404"

**Problem**: URL may have changed or requires authentication

**Solutions**:
1. Verify URL in browser
2. Check if site requires login
3. Use alternative source
4. Contact site administrator

---

## Advanced Usage

### Batch Processing

Process multiple URLs at once by adding them all to `manifest.json`:

```bash
# Add 10 YouTube videos to manifest
# Run fetch once
python3 fetch_and_extract.py

# Import all at once
python3 import_to_speeches.py
```

### Custom Topic Mapping

Edit the import script to map specific IDs to custom topics:

```python
# In import_to_speeches.py
if record_id == 'special-event':
    topics = ['economy', 'healthcare', 'education']
```

### Export to Other Formats

The speeches are in markdown. Convert to other formats:

```bash
# To HTML
for file in speeches/*.md; do
    pandoc "$file" -o "${file%.md}.html"
done

# To plain text
for file in speeches/*.md; do
    cat "$file" | sed 's/^#.*//' | sed 's/^\*//' > "${file%.md}.txt"
done
```

---

## Integration with Consistency Checking

Once imported, speeches are automatically included in:

### 1. Message Consistency Checker
Compare policy positions across:
- Press releases
- Speeches
- Prepared remarks
- Floor speeches

### 2. Citation System
Reference speeches in JSON-LD:
```json
{
  "isBasedOn": [{
    "@type": "Speech",
    "name": "Floor Speech on Healthcare Reform",
    "datePublished": "2024-09-20",
    "url": "https://c-span.org/..."
  }]
}
```

### 3. Topic Analysis
Track which topics appear most in:
- Campaign rallies vs floor speeches
- Prepared remarks vs spontaneous Q&A
- Geographic variations (Richmond vs Charlottesville)

---

## File Locations

| Item | Path |
|------|------|
| **Manifest** | `transcript-tools/manifest.json` |
| **Fetch script** | `transcript-tools/fetch_and_extract.py` |
| **C-SPAN parser** | `transcript-tools/cspan_parse.py` |
| **Import script** | `transcript-tools/import_to_speeches.py` |
| **Records** | `transcript-tools/samples/records.jsonl` |
| **Output speeches** | `speeches/*.md` |
| **Index** | `/Users/edf/Polis/spanberger-clone/api/speeches.json` |

---

## Next Steps

1. **Add more sources** to `manifest.json`
2. **Run fetcher** regularly to get new transcripts
3. **Build consistency reports** comparing messaging across sources
4. **Generate FAQs** from Q&A transcripts
5. **Create topic timelines** showing message evolution

---

## Quick Reference

```bash
# Full workflow
cd /Users/edf/Polis/training-data/spanberger-campaign/transcript-tools
pip install requests beautifulsoup4 youtube-transcript-api  # One-time
# Edit manifest.json
python3 fetch_and_extract.py
python3 import_to_speeches.py
cd .. && python3 generate_speech_index.py
open http://localhost:8888/speeches/

# Update existing speeches
python3 fetch_and_extract.py  # Add new records
python3 import_to_speeches.py  # Import
python3 generate_speech_index.py  # Rebuild index
```

---

**The transcript workflow is ready to use!**

Start by adding a few YouTube URLs to `manifest.json` and running the fetcher.
